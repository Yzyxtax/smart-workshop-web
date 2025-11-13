<script setup>
import { saveLevelApi, addBom, deleteBom } from '@/api/bom';
import BomContent from '@/components/bom/BomContent.vue';
import BomInsert from '@/components/bom/BomInsert.vue';
import { ref, onMounted, computed } from 'vue';
import { ElTree, ElButton, ElMessage } from 'element-plus';
import { useBomStore } from '@/stores/bom';
import { storeToRefs } from 'pinia';


const bomStore = useBomStore();
const { bomTreeData } = storeToRefs(bomStore);
const { loadBomData } = bomStore;

const idSeed = computed(() => {
    // 计算当前最大ID值，用于添加新节点时生成唯一ID
    let maxId = 0;

    const traverse = (nodes) => {
        for (const node of nodes) {
            if (node.id > maxId) {
                maxId = node.id;
            }
            if (node.children && node.children.length > 0) {
                traverse(node.children);
            }
        }
    };

    traverse(bomTreeData.value);
    return maxId + 1; // 返回下一个可用ID
});

// 配置 el-tree 如何解析数据
const treeProps = {
    label: 'label', // 对应节点显示文本的字段名
    children: 'children' // 对应子节点数组的字段名
};

const clickId = ref(1);//将点击的节点ID传递给子组件，默认显示第一个节点
// 节点点击事件处理
const handleNodeClick = (data, node, component) => {
    clickId.value = data.id;
};

// 在组件挂载时加载BOM数据
onMounted(() => {
    loadBomData();
});

// 添加节点
const currentParentId = ref();
let isShowPage = ref(false);
const append = (data) => {
    //显示页面
    isShowPage.value = true;
    //保存当前项数据
    currentParentId.value = data.id;
}
//处理取消按钮逻辑
const handleCancel = () => {
    isShowPage.value = false;
}
//处理提交逻辑
const handleSubmit = async (childData) => {
    //发送请求
    const result = await addBom(childData);
    if (result.code === 200) {
        ElMessage.success('添加成功');
        isShowPage.value = false;
        loadBomData();
    } else {
        ElMessage.error(result.message);
    }
}
// 删除节点
// 递归收集节点及其所有子节点的ID
const collectIds = (nodeData) => {
    const ids = [nodeData.id]; // 先把自己ID加进去
    if (nodeData.children && Array.isArray(nodeData.children)) {
        for (const child of nodeData.children) {
            ids.push(...collectIds(child)); // 递归收集子节点ID
        }
    }
    return ids;
};
//执行删除逻辑
const remove = async (data) => {
    //收集要删除的id
    const idsToDelete = collectIds(data.data);
    //执行删除
    const result = await deleteBom(idsToDelete);
    if (result.code === 200) {
        ElMessage.success('删除成功');
        loadBomData();
    } else {
        ElMessage.error(result.message);
    }
}

//拖拽放置的规则
const allowDrop = (draggingNode, dropNode, Type) => {
    //1.不允许拖拽到自身（自引用）
    const isChild = (parent, childId) => {
        if (parent.data.id === childId) return true;
        if (parent.children) {
            for (let childNode of parent.children) {
                if (isChild(childNode, childId)) return true;
            }
        }
        return false;
    };
    //2.不允许拖拽到子节点上(循环引用)
    if (isChild(draggingNode, dropNode.data.id)) {
        return false;
    }
    //3.根节点不允许拖拽到子节点上（业务层面）
    if (draggingNode.level === 1 && Type === 'inner' && dropNode.level > 1) {
        return false;
    }
    return true;
}

//拖拽结束事件
const handleDragEnd = async (draggingNode, dropNode, dropType, event) => {
    //如果没有发生实际移动，不处理
    if (!dropType) {
        return;
    };

    //找到被拖拽的节点在bomTreeData中的位置并更新其parentId
    const updateParentId = (nodes, targetId, newPrentId) => {
        for (const node of nodes) {
            if (node.id === targetId) {
                node.parentId = newPrentId;//更新
                return true;//返回
            }
            //递归查找子节点
            if (node.children && node.children.length > 0) {
                if (updateParentId(node.children, targetId, newPrentId)) {
                    return true;
                }
            }
        }
        return false;
    };

    let newParentId = null;//默认是根节点
    if (dropType === 'inner') {
        //拖拽到目标节点内部，目标节点的id就是新的parentId
        newParentId = dropNode.data.id;
    } else {
        //拖拽到目标节点同级，目标节点的parentId就是新的parentId，注意如果目标节点是根节点，那么新的parentId也会是null
        newParentId = dropNode.parent ? dropNode.parent.data.id : null;
    }

    updateParentId(bomTreeData.value, draggingNode.data.id, newParentId);

    const result = await saveLevelApi(draggingNode.data.id, newParentId);
    if (result.code === 200) {
        ElMessage.success("层级修改成功");
    } else {
        ElMessage.error("层级修改失败");
        loadBomData();
    }
}
</script>

<template>
    <div class="page">
        <h1>产品管理</h1>
    </div>
    <div class="tree">
        <div class="ElTree">
            <el-tree :data="bomTreeData" :props="treeProps" node-key="id" default-expand-all :highlight-current="true"
                :expand-on-click-node="false" @node-click="handleNodeClick" draggable :allow-drop="allowDrop"
                @node-drag-end="handleDragEnd" :indent="20" class="my-custom-tree">
                <template #default="{ node, data }">
                    <div class="custom-tree-node">
                        <span>{{ data.label }}</span>
                        <div>
                            <el-button type="primary" link @click="append(data)">
                                添加
                            </el-button>
                            <el-button style="margin-left: 4px" type="danger" link @click="remove(node, data)">
                                删除
                            </el-button>
                        </div>
                    </div>
                </template>
            </el-tree>
        </div>
        <div class="card">
            <BomContent :clickId="clickId" />
        </div>
    </div>
    <div v-if="isShowPage" class="submit-view">
        <BomInsert :parent-id="currentParentId" @cancel="handleCancel" @submit="handleSubmit" />
    </div>
</template>

<style scoped>
.custom-tree-node {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    padding-right: 8px;
}

.tree {
    margin-top: 20px;
    border: 1px solid #ebeef5;
    border-radius: 14px;
    padding: 10px;
    background-color: #fff;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: space-around;
}

.ElTree {
    width: 500px;
}

.card {
    width: 500px;
}

/* 修改节点展开/折叠图标颜色 */
.my-custom-tree :deep(.el-tree-node__expand-icon) {
    color: #409eff;
}

/* 修改选中节点的样式 */
.my-custom-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
    background-color: #e6f7ff;
    /* 选中节点的背景色 */
}

/* 修改每个节点行的样式 */
.my-custom-tree :deep(.el-tree-node__content) {
    height: 36px;
    /* 修改节点行高 */
}

/* 提交表单页面 */
.submit-view {
    background-color: #fff;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -145%);
    width: 700px;
    padding: 5px;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>