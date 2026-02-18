<script setup>
import { addBom, deleteBom, saveLevelApi } from "@/api/bom";
import BomContent from "@/components/bom/BomContent.vue";
import BomInsert from "@/components/bom/BomInsert.vue";
import { ref, onMounted, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useBomStore } from "@/stores/bom";
import { storeToRefs } from "pinia";

const bomStore = useBomStore();
const { bomTreeData, expandedKeys } = storeToRefs(bomStore);
const { loadBomData, addNode, removeNode, moveNode } = bomStore;

const clickId = ref(null);
const treeRef = ref(null);

onMounted(async () => {
    await loadBomData();
});

//添加根节点
const addRoot = () => {
    currentParentId.value = null;
    isShowPage.value = true;
};

// 保存展开状态
const handleNodeExpand = (data, node) => {
    expandedKeys.value.add(data.id);
};

const handleNodeCollapse = (data, node) => {
    expandedKeys.value.delete(data.id);
};

// 点击树节点
const handleNodeClick = (data) => {
    clickId.value = data.id;
};

// 新增节点弹窗控制
const isShowPage = ref(false);
const currentParentId = ref(null);

const append = (data) => {
    currentParentId.value = data.id;
    isShowPage.value = true;
};

const handleCancel = () => {
    isShowPage.value = false;
};

//新增提交
const handleSubmit = async (childData) => {
    const result = await addBom(childData);
    if (result.code === 200) {
        ElMessage.success("添加成功");
        childData.id = result.data;

        // 处理添加到根节点的情况
        if (currentParentId.value === null) {
            // 添加到根节点
            bomTreeData.value.push({
                id: childData.id,
                label: childData.nameSpecification,
                parentId: null,
                children: []
            });
        } else {
            addNode(currentParentId.value, childData); // 添加到指定父节点
        }

        isShowPage.value = false;
    } else {
        ElMessage.error(result.message);
    }
};

// 递归收集所有子节点 id
const collectIds = (node) => {
    const ids = [node.id];
    if (node.children) {
        node.children.forEach(c => ids.push(...collectIds(c)));
    }
    return ids;
};

// 删除节点
const remove = async (data) => {
    // 弹出确认对话框
    try {
        await ElMessageBox.confirm(
            `确定要删除 "${data.label}" 及其所有子项吗？此操作无法撤销！`,
            '删除确认',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
                draggable: true
            }
        );

        // 用户点击确定后执行删除操作
        const ids = collectIds(data);
        const result = await deleteBom(ids);

        if (result.code === 200) {
            ElMessage.success("删除成功");
            removeNode(data.id); // 局部更新
        } else {
            ElMessage.error(result.message);
        }
    } catch (error) {
        // 用户点击取消或关闭对话框
        ElMessage.info("已取消删除");
    }
};

// 拖拽规则
const allowDrop = (dragNode, dropNode, type) => {
    const isChild = (parent, targetId) => {
        if (parent.data.id === targetId) return true;
        if (parent.childNodes) {
            return parent.childNodes.some(child => isChild(child, targetId));
        }
        return false;
    };

    if (isChild(dragNode, dropNode.data.id)) return false;

    if (dragNode.level === 1 && type === "inner" && dropNode.level > 1) {
        return false;
    }

    return true;
};

// 拖拽结束
const handleDragEnd = async (dragNode, dropNode, type) => {
    if (!type) return;

    let newParentId = null;
    if (type === "inner") {
        newParentId = dropNode.data.id;
    } else {
        newParentId = dropNode.parent ? dropNode.parent.data.id : null;
    }

    const result = await saveLevelApi(dragNode.data.id, newParentId);
    if (result.code === 200) {
        ElMessage.success("层级已更新");
        moveNode(dragNode.data.id, newParentId); // 局部更新
    } else {
        ElMessage.error("层级更新失败");
    }
};

const updateNodeName = async (updatedNode) => {
    updateNodeInTree(bomStore.bomTreeData, updatedNode);
    await nextTick();
};

const updateNodeInTree = (tree, updated) => {
    for (const node of tree) {
        if (node.id === updated.id) {
            node.nameSpecification = updated.nameSpecification;
            node.label = updated.nameSpecification; // 如果 label 依赖 nameSpecification
            return true;
        }
        if (node.children) {
            const found = updateNodeInTree(node.children, updated);
            if (found) return true;
        }
    }
    return false;
};
</script>

<template>
    <div class="page">
        <h1>产品管理</h1>
    </div>
    <div>
        <el-button type="primary" @click="addRoot">添加产品</el-button>
    </div>

    <div class="tree">
        <div class="ElTree">
            <el-tree ref="treeRef" :data="bomTreeData" node-key="id" :highlight-current="true"
                :expand-on-click-node="false" @node-click="handleNodeClick" default-expand-all draggable
                :allow-drop="allowDrop" @node-drag-end="handleDragEnd" class="my-custom-tree">
                <template #default="{ node, data }">
                    <div class="custom-tree-node">
                        <span>{{ data.label }}</span>
                        <div>
                            <el-button link type="primary" @click="append(data)">添加</el-button>
                            <el-button link type="danger" @click="remove(data)">删除</el-button>
                        </div>
                    </div>
                </template>
            </el-tree>
        </div>

        <div class="card">
            <BomContent :clickId="clickId" @saved="updateNodeName" />
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
    position: relative;
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
    transform: translate(-50%, -50%);
    width: 700px;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 2001;
    /* 提高 z-index 值，确保高于 BomContent 组件的 z-index (2000) */
}
</style>