<template>
    <div class="page">
        <h1>产线管理</h1>
    </div>
    <div class="layout-container">
        <el-container class="container">
            <!-- 左侧边栏 -->
            <el-aside class="sidebar">
                <div class="sidebar-content">
                    <div class="aside-header">
                        <h2 class="aside-title">产线列表</h2>
                        <el-button type="primary" size="small" @click="openAddDialog">新增产线</el-button>
                    </div>

                    <div class="menu-wrapper">
                        <el-menu :default-active="String(selectedLine)" class="line-menu" @select="selectLine">
                            <el-menu-item :index="String(index)" v-for="(line, index) in productionLines" :key="index"
                                class="line-menu-item">
                                <span class="line-name">{{ line.lineName }}</span>
                                <div class="line-actions">
                                    <el-button type="text" size="small" icon="Edit" @click.stop="editLine(index)" />
                                    <el-button type="text" size="small" icon="Delete" @click.stop="deleteLine(index)" />
                                </div>
                            </el-menu-item>
                        </el-menu>
                    </div>
                </div>
            </el-aside>

            <!-- 主内容区 -->
            <el-main class="main-content">
                <el-container direction="vertical" class="vertical-container">
                    <!-- 上半部分 -->
                    <div class="section section-top">
                        <el-container class="section-content">
                            <el-header>
                                <!-- 横向信息条 -->
                                <div class="info-bar">
                                    <div class="info-item">
                                        <div class="label">产线编号</div>
                                        <div class="value">{{ currentLine.lineNo || '--' }}</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="label">产线名称</div>
                                        <div class="value">{{ currentLine.lineName || '--' }}</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="label">产线状态</div>
                                        <div class="value">
                                            <span
                                                :class="['status-badge', currentLine.lineStatus ? ('status-' + currentLine.lineStatus) : '']">
                                                {{ currentLine.lineStatus || '--' }}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="info-item">
                                        <div class="label">所属工艺流程</div>
                                        <div class="value">{{ currentLine.flowName || '--' }}</div>
                                    </div>
                                </div>
                            </el-header>
                            <el-main>
                                <!-- 画布区域 -->
                                <div class="canvas-container">
                                    <div v-if="!graphLoaded" class="canvas-loading">
                                        <el-icon class="loading-icon">
                                            <Loading />
                                        </el-icon>
                                        <span>加载画布中...</span>
                                    </div>
                                    <div id="canvas" style="width:100%; height:600px;"></div>
                                </div>
                            </el-main>
                        </el-container>
                    </div>

                    <!-- 分割线 -->
                    <div class="divider"></div>

                    <!-- 下半部分 -->
                    <div class="section section-bottom">
                        <div class="section-content">
                            <div class="team-section">
                                <h3 style="display: inline-block; margin: 0 10px;">班组列表</h3>
                                <el-button type="success" size="small" round @click="saveLineCompose">保存</el-button>
                                <div class="card-container" ref="cardContainerRef" v-if="allTeams.length > 0">
                                    <div v-for="team in allTeams" :key="team.teamNo" class="team-card"
                                        :class="{ 'selected': selectedCards.includes(team.teamNo) }"
                                        @click="toggleCardSelection(team.teamNo)">
                                        <div class="team-info">
                                            <div class="team-name">{{ team.teamName }}</div>
                                            <div class="team-no">{{ team.teamNo }}</div>
                                            <div class="team-processes">
                                                <span v-for="(count, process) in team.processMatrix" :key="process"
                                                    v-if="process !== 'NO_PROCESS'" class="process-tag">
                                                    {{ process }}({{ count }})
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="empty-placeholder">暂无班组信息</div>
                            </div>
                        </div>
                    </div>
                </el-container>
            </el-main>
        </el-container>
    </div>

    <!-- 新增/编辑 对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑产线' : '新增产线'" width="560px" @close="handleClose">
        <el-form :model="formData" :rules="rules" ref="lineForm" label-width="110px">
            <el-form-item label="产线编号" prop="lineNo">
                <el-input v-model="formData.lineNo" placeholder="请输入产线编号" />
            </el-form-item>
            <el-form-item label="产线名称" prop="lineName">
                <el-input v-model="formData.lineName" placeholder="请输入产线名称" />
            </el-form-item>
            <el-form-item label="所属工艺流程" prop="flow">
                <div class="flow-selector-wrapper">
                    <el-select v-model="formData.flowId" placeholder="请选择所属工艺流程" :disabled="!canModifyFlow"
                        :popper-class="!canModifyFlow ? 'disabled-flow-select' : ''">
                        <el-option v-for="flow in flowData" :key="flow.id" :label="flow.flowName" :value="flow.id" />
                    </el-select>
                    <div v-if="!canModifyFlow" class="flow-disabled-tip">
                        产线状态非空闲，无法修改工艺流程
                    </div>
                </div>
            </el-form-item>
        </el-form>

        <template #footer>
            <el-button @click="handleClose">取消</el-button>
            <el-button type="primary" :loading="submitLoading" @click="submitForm">
                提交
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue';
import { getAllLineApi, addLineApi, deleteLineApi, updateLineApi, getLineComposeApi, updateLineComposeApi } from '@/api/line'
import { getAllFlowApi, getFlowChartApi } from '@/api/flow'
import { ElMessage, ElMessageBox } from 'element-plus';
import { Graph } from '@antv/x6'

// 产线数据（包含编号、名称、状态、所属工艺）
const productionLines = ref([]);

//获取所有产线数据
const getAllLine = async () => {
    const response = await getAllLineApi();
    if (response && response.code === 200) {
        productionLines.value = response.data;
        selectedLine.value = productionLines.value.length ? 0 : -1;
    } else {
        ElMessage.error("获取产线数据错误：" + response.message ? response.message : "未知错误");
    }
}

//工艺流程数据
const flowData = ref([])

//获取所有有效的工艺流程数据
const getAllFlows = async () => {
    const response = await getAllFlowApi();
    if (response && response.code === 200) {
        flowData.value = response.data.filter((flow) => flow.status === '有效')
    } else {
        ElMessage.error("获取工艺流程数据错误：" + response.message ? response.message : "未知错误");
    }
}

//页面加载完成就加载数据
onMounted(async () => {
    await getAllLine();
    await getAllFlows();
    await initGraph();

    // 如果有产线数据，渲染第一个产线的流程图
    if (productionLines.value.length > 0) {
        await renderFlowChart(productionLines.value[0].flowId);
        getLineComppose(productionLines.value[0].lineNo);
    }

    // 等待 DOM 渲染完成
    await nextTick();

    // 确保监听器已添加
    if (cardContainerRef.value) {
        // 移除可能存在的旧监听器
        cardContainerRef.value.removeEventListener('wheel', handleWheelScroll);
        // 添加新监听器
        cardContainerRef.value.addEventListener('wheel', handleWheelScroll, { passive: false });
    }
});

// 当前选中的产线索引（默认选中第一个）
const selectedLine = ref(0);

// 计算当前产线对象
const currentLine = computed(() => {
    const idx = selectedLine.value;
    return productionLines.value[idx] || {};
});

// 选择产线（el-menu 的 select 会传回字符串索引）
const selectLine = async (index) => {
    selectedLine.value = Number(index);
    await renderFlowChart(productionLines.value[index].flowId);
    await getLineComppose(productionLines.value[index].lineNo);
};

// 对话框及表单相关
const dialogVisible = ref(false);
const isEdit = ref(false);
const editIndex = ref(-1);
const submitLoading = ref(false);
const lineForm = ref(null);
//记录原始的lineNo
const primitiveLineNo = ref('');

const formData = ref({
    lineNo: '',
    lineName: '',
    flowId: null
});

const rules = {
    lineNo: [{ required: true, message: '请输入产线编号', trigger: 'blur' }],
    lineName: [{ required: true, message: '请输入产线名称', trigger: 'blur' }],
    flowId: [{ required: true, message: '请选择所属工艺流程', trigger: 'blur' }]
};

// 添加计算属性判断是否可以修改工艺流程
const canModifyFlow = computed(() => {
    if (!isEdit.value) {
        // 新增模式下总是可以选择
        return true;
    }

    // 编辑模式下，只有当前产线状态为"空闲"时才能修改
    const currentSelectedLine = productionLines.value[editIndex.value];
    return currentSelectedLine && currentSelectedLine.lineStatus === '空闲';
});

//添加watch侦听，当flowId更改时，重新渲染流程图
watch(() => currentLine.value.flowId, async () => {
    if (!graphLoaded.value) return;
    await renderFlowChart(formData.value.flowId);
});


// 打开新增对话框
const openAddDialog = () => {
    isEdit.value = false;
    editIndex.value = -1;
    Object.assign(formData.value, {
        lineNo: '',
        lineName: '',
        flowId: null
    });
    dialogVisible.value = true;
};

// 编辑产线
const editLine = (index) => {
    const target = productionLines.value[index];
    if (!target) return;
    isEdit.value = true;
    editIndex.value = index;
    Object.assign(formData.value, {
        lineNo: target.lineNo ?? '',
        lineName: target.lineName ?? '',
        flowId: canModifyFlow.value ? (target.flowId ?? null) : target.flowId
    });
    primitiveLineNo.value = target.lineNo;
    dialogVisible.value = true;
};

// 删除产线
const deleteLine = async (index) => {
    const target = productionLines.value[index];
    if (!target) return;

    // 添加二次确认
    try {
        await ElMessageBox.confirm(
            `确定要删除产线 "${target.lineName}" 吗？此操作不可恢复！`,
            '删除确认',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        );
    } catch {
        // 用户取消删除
        return;
    }

    try {
        const res = await deleteLineApi(target.lineNo);
        if (res && res.code === 200) {
            productionLines.value.splice(index, 1);
            // 更新选中项索引，确保不会越界
            if (selectedLine.value >= productionLines.value.length) {
                selectedLine.value = Math.max(0, productionLines.value.length - 1);
            }
            ElMessage.success('删除成功');
        } else {
            const errorMsg = res?.message || '未知错误';
            ElMessage.error('删除失败：' + errorMsg);
        }
    } catch (err) {
        console.error('删除产线接口调用失败:', err);
        ElMessage.error('删除失败：网络或服务器异常');
    }
};
// 关闭对话框
const handleClose = () => {
    dialogVisible.value = false;
    primitiveLineNo.value = '';
    if (lineForm.value) {
        lineForm.value.clearValidate?.();
    }
};

// 提交表单（新增/更新）
const submitForm = async () => {
    if (!lineForm.value) {
        console.error('表单引用不存在');
        return;
    }

    // 如果是编辑模式且产线状态不是空闲，检查是否试图修改工艺流程
    if (isEdit.value && !canModifyFlow.value) {
        const originalLine = productionLines.value[editIndex.value];
        if (formData.value.flowId !== originalLine.flowId) {
            ElMessage.warning('该产线状态非空闲，无法修改工艺流程！');
            // 将工艺流程恢复为原来的值
            formData.value.flowId = originalLine.flowId;
            return;
        }
    }

    try {
        await lineForm.value.validate();
    } catch (err) {
        return;
    }

    submitLoading.value = true;
    try {
        if (isEdit.value) {
            // 更新
            const payload = { ...formData.value };
            const res = await updateLineApi(payload, primitiveLineNo.value);
            if (res && res.code === 200) {
                // 更新本地数据
                if (editIndex.value >= 0) {
                    // 获取原有的产线数据，合并更新字段，保留原有状态
                    const originalLine = productionLines.value[editIndex.value];
                    const updatedLine = {
                        ...originalLine, // 保留原有所有字段
                        ...payload,     // 覆盖更新的字段
                        flowName: flowData.value.find(f => f.id === formData.value.flowId)?.flowName
                    };
                    productionLines.value.splice(editIndex.value, 1, updatedLine);
                }
                ElMessage.success('更新成功');
                dialogVisible.value = false;
            } else {
                ElMessage.error('更新失败：' + (res && res.message ? res.message : '未知错误'));
            }
        } else {
            // 新增
            const payload = { ...formData.value, lineStatus: '空闲' }
            const res = await addLineApi(payload);
            if (res && res.code === 200) {
                // 若后端返回新数据，优先使用后端返回，否则使用本地 payload
                const newItem = { ...payload, flowName: flowData.value.find(f => f.id === formData.value.flowId)?.flowName };
                productionLines.value.push(newItem);
                ElMessage.success('新增成功');
                dialogVisible.value = false;
            } else {
                ElMessage.error('新增失败：' + (res && res.message ? res.message : '未知错误'));
            }
        }
    } catch (error) {
        console.error(error);
        ElMessage.error('请求异常，请稍后再试');
    } finally {
        submitLoading.value = false;
    }
};

// 画布加载状态
const graphLoaded = ref(false)
// 图表实例
let graphInstance = null

// 初始化画布
const initGraph = () => {
    return new Promise((resolve, reject) => {
        try {
            // 确保 DOM 元素已渲染
            nextTick(() => {
                const canvasContainer = document.getElementById('canvas')
                if (!canvasContainer) {
                    reject(new Error('Canvas container not found'))
                    return
                }

                // 清除可能存在的旧实例
                if (graphInstance) {
                    graphInstance.dispose()
                }

                // 创建新的图表实例
                graphInstance = new Graph({
                    container: canvasContainer,
                    // 自动适应容器大小
                    autoResize: true,
                    // 设置画布背景颜色
                    background: { color: '#F2F7FA' },
                    // 设置网格
                    grid: {
                        visible: true,
                        type: 'doubleMesh',
                        args: [
                            {
                                color: '#eee', // 主网格线颜色
                                thickness: 1,     // 主网格线宽度
                            },
                            {
                                color: '#ddd', // 次网格线颜色
                                thickness: 1,     // 次网格线宽度
                                factor: 4,        // 主次网格线间隔
                            },
                        ],
                    },
                    // 拖动画布
                    panning: true,
                    // 缩放画布
                    mousewheel: true,
                    // 启用节点拖拽
                    nodeMovable: true,
                    edgeMovable: false, // 边不能移动
                    // 选中高亮
                    highlighting: {
                        magnetAdsorbed: {
                            name: 'stroke',
                            args: {
                                attrs: {
                                    fill: '#fff',
                                    stroke: '#31d0c6',
                                    strokeWidth: 3,
                                },
                            },
                        },
                    },
                })

                // 监听图表渲染完成事件
                graphInstance.on('render:done', () => {
                    graphLoaded.value = true
                    resolve(graphInstance)
                })

                // 如果没有渲染完成事件，也可以使用 setTimeout 作为备选方案
                setTimeout(() => {
                    if (!graphLoaded.value) {
                        graphLoaded.value = true
                        resolve(graphInstance)
                    }
                }, 500) // 500ms 后认为加载完成

            })
        } catch (error) {
            reject(error)
        }
    })
}

// 渲染流程图
// 修改渲染流程图函数，在渲染完成后更新节点高亮
const renderFlowChart = async (flowId) => {
    if (!graphInstance) {
        console.error('Graph instance not initialized')
        return
    }

    try {
        // 清空当前画布
        graphInstance.clearCells()

        // 调用API获取流程图数据
        const response = await getFlowChartApi(flowId)
        if (response && response.code === 200) {
            const { nodeData, edgeData } = response.data

            // 渲染节点
            renderNodes(nodeData)

            // 渲染边
            renderEdges(edgeData)
        } else {
            ElMessage.error(`获取流程图数据失败: ${response?.message || '未知错误'}`)
        }
    } catch (error) {
        console.error('Render flow chart error:', error)
        ElMessage.error('渲染流程图失败，请重试')
    }
}

// 渲染节点
const renderNodes = (nodeData) => {
    if (!graphInstance || !nodeData || !Array.isArray(nodeData)) {
        return
    }

    const width = 160
    const height = 60

    nodeData.forEach((nodeName, index) => {
        const node = graphInstance.createNode({
            id: `node_${index}`,
            shape: 'rect',
            x: 100 + (index % 4) * 200, // 每行最多4个节点
            y: 100 + Math.floor(index / 4) * 150, // 每4个节点换行
            width: width,
            height: height,
            attrs: {
                body: {
                    fill: '#f5f9ff',
                    stroke: '#31d0c6',
                    strokeWidth: 2,
                    rx: 6,
                    ry: 6,
                },
                text: {
                    text: nodeName,
                    fill: '#333',
                    fontSize: 14,
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                },
            },
            data: {
                name: nodeName
            }
        })

        graphInstance.addCell(node)
    })
}

// 根据卡片选中状态更新所有节点的高亮状态
const updateAllNodesHighlight = () => {
    if (!graphInstance || !allTeams.value.length) return

    // 获取所有节点
    const nodes = graphInstance.getNodes()
    if (nodes.length === 0) return

    // 创建一个集合来存储所有被选中的工序
    const highlightedProcesses = new Set()

    // 遍历所有选中的卡片
    selectedCards.value.forEach(teamNo => {
        const team = allTeams.value.find(t => t.teamNo === teamNo)
        if (team && team.processMatrix) {
            // 遍历该班组的所有工序（排除 NO_PROCESS）
            Object.keys(team.processMatrix).forEach(process => {
                if (process !== 'NO_PROCESS' && team.processMatrix[process] > 0) {
                    highlightedProcesses.add(process)
                }
            })
        }
    })

    // 更新所有节点的高亮状态
    nodes.forEach(node => {
        const nodeName = node.data?.name
        if (!nodeName) return

        if (highlightedProcesses.has(nodeName)) {
            // 节点需要高亮
            node.attr({
                body: {
                    fill: '#fff7e6',
                    stroke: '#fa8c16',
                    strokeWidth: 3,
                    rx: 6,
                    ry: 6,
                },
                text: {
                    text: nodeName,
                    fill: '#fa541c',
                    fontSize: 14,
                    fontWeight: 'bold',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                }
            })
        } else {
            // 节点不需要高亮
            node.attr({
                body: {
                    fill: '#f5f9ff',
                    stroke: '#31d0c6',
                    strokeWidth: 2,
                    rx: 6,
                    ry: 6,
                },
                text: {
                    text: nodeName,
                    fill: '#333',
                    fontSize: 14,
                    fontWeight: 'normal',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                }
            })
        }
    })
}

// 渲染边
const renderEdges = (edgeData) => {
    if (!graphInstance || !edgeData) {
        return
    }

    // 遍历边数据，格式HashMap<String, List<String>>
    for (const [sourceName, targetName] of Object.entries(edgeData)) {
        targetName.forEach(target => {
            const sourceNode = findNodeByName(sourceName)
            const targetNode = findNodeByName(target)

            if (sourceNode && targetNode) {
                const edge = graphInstance.createEdge({
                    shape: 'edge',
                    source: sourceNode.id,
                    target: targetNode.id,
                    attrs: {
                        line: {
                            stroke: '#a0a0a0',
                            strokeWidth: 2,
                            targetMarker: {
                                name: 'classic',
                                size: 8,
                            },
                        },
                    },
                })

                graphInstance.addCell(edge)
            }
        })
    }
}

// 根据节点名称查找节点
const findNodeByName = (nodeName) => {
    const nodes = graphInstance.getNodes()
    return nodes.find(node => node.data?.name === nodeName)
}

//获取产线组成数据
const getLineComppose = async (lineNo) => {
    const response = await getLineComposeApi(lineNo)
    if (response && response.code === 200) {
        lineComposeData.value = response.data
        if (response.data.composes) {
            allTeamsList.value = response.data.composes

            // 初始化选中的卡片（已分配的班组）
            const assignedTeams = response.data.composes.filter(team => team.type === 'assigned')
            selectedCards.value = assignedTeams.map(team => team.teamNo)
        } else {
            allTeamsList.value = []
            selectedCards.value = []
        }
    } else {
        ElMessage.error(`获取产线组成数据失败: ${response?.message || '未知错误'}`)
    }
}

//产线班组信息
const lineComposeData = ref({})

// 所有班组列表
const allTeamsList = ref([])

// 计算所有班组
const allTeams = computed(() => {
    return allTeamsList.value
})

// 选中的卡片集合（代表已分配的班组）
const selectedCards = ref([])

// 切换卡片选择状态
const toggleCardSelection = (teamNo) => {
    const index = selectedCards.value.indexOf(teamNo)
    if (index > -1) {
        // 如果已选中，则取消选中
        selectedCards.value.splice(index, 1)
    } else {
        // 如果未选中，则添加到选中列表
        selectedCards.value.push(teamNo)
    }

    // 更新节点高亮状态
    updateAllNodesHighlight()
}

// 添加一个监听器，当 selectedCards 变化时更新所有节点高亮
watch(selectedCards, () => {
    updateAllNodesHighlight()
}, { deep: true })

//保存产线班组信息
const saveLineCompose = async () => {
    const payload = {
        lineNo: lineComposeData.value.lineNo,
        teams: selectedCards.value
    }
    const response = await updateLineComposeApi(payload)
    if (response && response.code === 200) {
        ElMessage.success('保存成功')
    } else {
        ElMessage.error(`保存失败: ${response?.message || '未知错误'}`)
    }
}

// 监听鼠标滚轮滚动
const cardContainerRef = ref(null)

// 添加滚轮事件处理函数
const handleWheelScroll = (e) => {
    if (!cardContainerRef.value) return;

    // 阻止默认的垂直滚动行为
    e.preventDefault();

    // 检查滚轮是垂直滚动还是水平滚动
    if (e.shiftKey) {
        // 按住 Shift 键时水平滚动
        cardContainerRef.value.scrollLeft += e.deltaY;
    } else {
        // 正常情况下水平滚动
        cardContainerRef.value.scrollLeft += e.deltaY;
    }
}

// 移除滚动监听器
const removeWheelListener = () => {
    if (cardContainerRef.value) {
        cardContainerRef.value.removeEventListener('wheel', handleWheelScroll);
    }
}

// 监听 cardContainerRef 的变化
watch(cardContainerRef, (newVal, oldVal) => {
    // 移除旧的监听器
    if (oldVal) {
        oldVal.removeEventListener('wheel', handleWheelScroll);
    }

    // 添加新的监听器
    if (newVal) {
        newVal.addEventListener('wheel', handleWheelScroll, { passive: false });
    }
}, { immediate: false });

// 在组件卸载时清理监听器
onUnmounted(() => {
    removeWheelListener();
});
</script>

<style scoped>
.layout-container {
    height: 100vh;
    border: 2px solid #ccc;
}

.container {
    height: 100%;
}

.sidebar {
    background-color: #f8f9fa;
    border-right: 2px solid #dee2e6;
    height: 100%;
    width: 250px;
}

.sidebar-content {
    padding: 20px;
    height: 93%;
    border: 1px solid #ced4da;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
}

/* 侧边栏头部样式 */
.aside-header {
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.2);
}

.aside-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1a3c5a;
}

/* 菜单包装器 */
.menu-wrapper {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
}

/* 菜单样式 */
.line-menu {
    border-right: none;
    background: transparent;
}

.line-menu-item {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px !important;
    margin: 4px 8px;
    border-radius: 6px;
    transition: all 0.3s ease;
}

.line-menu-item:hover {
    background-color: rgba(255, 255, 255, 0.3) !important;
}

.line-menu-item.is-active {
    background: linear-gradient(90deg, #409eff, #66b1ff) !important;
    color: white !important;
}

.line-name {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: #1a3c5a;
}

.line-menu-item.is-active .line-name {
    color: white;
}

.line-actions {
    opacity: 0;
    transition: opacity 0.2s ease;
    display: flex;
    gap: 8px;
}

.line-menu-item:hover .line-actions {
    opacity: 1;
}

.line-actions .el-button {
    padding: 2px 6px;
    color: #606266;
}

.line-actions .el-button:hover {
    color: #409eff;
}

.line-menu-item.is-active .line-actions .el-button {
    color: rgba(255, 255, 255, 0.8);
}

.line-menu-item.is-active .line-actions .el-button:hover {
    color: white;
}

.main-content {
    padding: 0;
    height: 100%;
}

.vertical-container {
    height: 100%;
    display: flex;
    flex-direction: column;
}

/* 信息条样式 */
.info-bar {
    display: flex;
    gap: 24px;
    padding: 12px 16px;
    border-bottom: 1px solid #e6eef8;
    align-items: center;
    background: linear-gradient(180deg, #ffffff, #fbfdff);
}

.info-item {
    display: flex;
    flex-direction: column;
}

.label {
    font-size: 12px;
    color: #6b7280;
}

.value {
    font-size: 14px;
    font-weight: 600;
    color: #102a43;
    margin-top: 4px;
}

/* 状态标签 */
.status-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    font-size: 12px;
}

/* 根据状态变色（使用状态中文作为类名） */
.status-运行 {
    background: #16a34a;
}

.status-空闲 {
    background: #3b82f6;
}

.status-暂停 {
    background: #f59e0b;
}

.section {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: auto;
    position: relative;
}

.section-top {
    flex: 0 0 63%;
    /* 固定占用65%的高度 */
    min-height: 400px;
    /* 设置最小高度 */
    border: 2px solid #dee2e6;
    border-radius: 4px 4px 0 0;
    margin: 8px 8px 0 8px;
    background-color: #f8fdff;
}

.section-bottom {
    flex: 0 0 34%;
    /* 固定占用35%的高度 */
    border: 2px solid #dee2e6;
    border-radius: 0 0 4px 4px;
    margin: 0 8px 8px 8px;
    background-color: #fefefe;
}

.divider {
    height: 1px;
    background-color: #dee2e6;
    flex-shrink: 0;
    margin: 0 8px;
}

.section-content {
    padding: 15px;
    flex: 1;
    overflow: auto;
    border: 1px dashed #adb5bd;
    border-radius: 2px;
}

.canvas-container {
    width: 99%;
    height: 99%;
    /* 使画布区域占满剩余空间 */
    border: 1px solid #dbeafe;
    /* 淡蓝色边框 */
    border-radius: 8px;
    /* 圆角 */
    background: #ffffff;
    /* 画布背景色 */
    box-shadow: inset 0 2px 6px rgba(20, 24, 38, 0.05);
    /* 内阴影效果 */
    overflow: hidden;
    /* 防止内容溢出 */
}

/* 画布加载状态 */
.canvas-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    gap: 8px;
    color: #666;
    z-index: 10;
}

.loading-icon {
    animation: rotate 2s linear infinite;
}

/* 修复工艺流程选择器样式 */
.flow-selector-wrapper {
    width: 100%;
}

/* 确保下拉框占满容器 */
.flow-selector-wrapper .el-select {
    width: 100%;
}

/* 禁用状态下保持宽度 */
.flow-selector-wrapper .el-select.is-disabled {
    width: 100%;
}

.flow-disabled-tip {
    margin-top: 8px;
    font-size: 12px;
    color: #f56c6c;
    line-height: 1.4;
}

/* 卡片相关样式 */
.team-section h3 {
    margin: 0 0 12px 0;
    font-size: 16px;
    color: #333;
    font-weight: 600;
}

.card-container {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding: 8px 4px;
    scrollbar-width: thin;
    /* Firefox */
    scrollbar-color: #c1c1c1 #f1f1f1;
    /* Firefox */

    scroll-behavior: smooth;
}

.card-container::-webkit-scrollbar {
    height: 8px;
    /* Chrome/Safari/Webkit */
}

.card-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

.card-container::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
}

.card-container::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

.team-card {
    min-width: 220px;
    height: 120px;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.3s ease;
}

.team-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    border-color: #409eff;
}

.team-card.selected {
    border-color: #409eff;
    background-color: #ecf5ff;
    box-shadow: 0 4px 8px rgba(64, 158, 255, 0.2);
    animation: pulse-highlight 2s infinite;
}

.team-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.team-name {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
}

.team-no {
    font-size: 12px;
    color: #666;
    margin-bottom: 8px;
}

.team-processes {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.process-tag {
    background: #f0f9ff;
    color: #409eff;
    border: 1px solid #b3d8ff;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 11px;
    white-space: nowrap;
}

.empty-placeholder {
    padding: 20px;
    text-align: center;
    color: #999;
    font-style: italic;
}

/* 添加鼠标悬停样式提示用户 */
.card-container {
    cursor: grab;
    /* 显示可抓取的手型光标 */
}

.card-container:active {
    cursor: grabbing;
    /* 拖动时的光标 */
}

/* 为高亮节点添加动画效果 */
@keyframes node-pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(250, 140, 22, 0.7);
    }

    70% {
        box-shadow: 0 0 0 8px rgba(250, 140, 22, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(250, 140, 22, 0);
    }
}

/* 为高亮节点添加阴影效果 */
.canvas-container :deep(.x6-node [stroke="#fa8c16"]) {
    filter: drop-shadow(0 0 3px rgba(250, 140, 22, 0.5));
    animation: node-pulse 2s infinite;
}

@keyframes pulse-highlight {
    0% {
        box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4);
    }

    70% {
        box-shadow: 0 0 0 6px rgba(64, 158, 255, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
    }
}
</style>