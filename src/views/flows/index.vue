<template>
    <div class="page">
        <h1 class="page-title">工艺流程管理</h1>
    </div>
    <!-- 工艺流程页面内容 -->
    <div class="flows-wrapper">
        <el-container>
            <!-- 左侧栏 -->
            <el-aside width="300px" class="left-aside">
                <!-- 标题、按钮区域 -->
                <div>
                    <h2 style="padding: 10px; font-weight: bold; display: inline-block;">工艺流程列表</h2>
                    <el-button type="primary" @click="openFlowDialog()" size="small">添加</el-button>
                    <el-button type="danger" @click="deleteFlow" size="small">删除</el-button>
                </div>
                <!-- 导航栏区域 -->
                <el-menu style="width: 100%;" :default-active="''">
                    <!-- 遍历产品列表，每个产品作为一个 el-sub-menu -->
                    <el-sub-menu v-for="product in bomStore.productList" :key="product.id"
                        :index="product.id.toString()">
                        <template #title>
                            <el-icon>
                                <Box />
                            </el-icon>
                            <span>{{ product.name }}</span>
                        </template>

                        <!-- 根据当前产品的 id 查找对应的工艺流程列表 -->
                        <el-menu-item v-for="flow in getFlowsByProductId(product.id)" :key="flow.id"
                            :index="`${product.id}-${flow.id}`" @click="showFlowDetails(flow)">
                            {{ flow.flowName }}
                        </el-menu-item>
                    </el-sub-menu>
                </el-menu>
            </el-aside>
            <!-- 中间主区域 -->
            <el-main class="main-area">
                <!-- 标题、按钮区域 -->
                <div>
                    <h2 class="main-title" style="padding: 10px; font-weight: bold; display: inline-block;"
                        v-if="selectedFlow">
                        工艺流程图-{{ selectedFlow.flowName }}</h2>
                    <h2 class="main-title" style="padding: 10px; font-weight: bold; display: inline-block;" v-else>工艺流程图
                    </h2>
                    <el-button type="primary" @click="openAddNodeDialog" size="small">添加工序</el-button>
                    <el-button type="primary" @click="toggleAddEdgeMode" size="small">
                        {{ addingEdgeMode ? '取消添加箭头' : '添加箭头' }}
                    </el-button>
                    <el-button type="danger" @click="deleteSelectedElement" size="small">删除选中</el-button>
                    <el-button type="success" @click="saveFlowChart" size="small">保存</el-button>
                </div>
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
            <!-- 右侧栏 -->
            <el-aside class="right-aside">
                <div>
                    <h2 style="padding: 10px; font-weight: bold; display: inline-block;">流程详情</h2>
                    <el-button type="warning" @click="openFlowDialog(selectedFlow?.id, true)"
                        size="small">修改</el-button>
                </div>
                <FlowCard v-if="selectedFlow" :flow="selectedFlow" />
                <div v-else style="padding: 20px; color: #888;">请选择左侧工艺流程以查看详情</div>

                <div>
                    <h2 style="padding: 10px; font-weight: bold; display: inline-block;">工序详情</h2>
                    <el-button type="warning" @click="openProcessDialog(selectedProcess?.id, true)"
                        size="small">修改</el-button>
                </div>
                <ProcessCardForFlow v-if="selectedProcess" :process="{
                    ...selectedProcess,
                    input: selectedProcess.input,
                    output: selectedProcess.output,
                    workStep: selectedProcess.workStep
                }" @click="showStepDetails" />
                <div v-else style="padding: 20px; color: #888;">请选择左侧工序以查看详情</div>

                <div>
                    <h2 style="padding: 10px; font-weight: bold; display: inline-block;">工步详情</h2>
                    <el-button type="warning" @click="handleStepEdit" size="small">修改</el-button>
                </div>
                <StepCard v-if="selectedStep" :step="selectedStep" />
                <div v-else style="padding: 20px; color: #888;">请选择工步以查看详情</div>
            </el-aside>
        </el-container>

        <!-- 添加工序到画布的对话框 -->
        <el-dialog title="添加工序到流程图" v-model="addNodeDialogVisible" width="520px">
            <el-form label-width="100px">
                <el-form-item label="选择工序">
                    <el-select v-model="selectedProcessForNode" placeholder="请选择要添加到画布的工序" filterable>
                        <el-option v-for="p in processStore.processList" :key="p.id" :label="p.processName"
                            :value="p.id" />
                    </el-select>
                    <el-button type="primary" @click="openProcessDialog(null, false)"
                        style="margin-left:8px; margin-top: 8px;" size="small">新增工序</el-button>
                </el-form-item>

                <el-form-item label="放置位置">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <el-button :disabled="waitingForCanvasClick" @click="startCanvasSelection"
                            size="small">在画布中选择位置</el-button>
                        <span v-if="nodePosition">已选位置：x={{ nodePosition.x }}, y={{ nodePosition.y }}</span>
                        <span v-else style="color:#999">未选择，确认后将自动布局</span>
                    </div>
                    <div style="margin-top:8px; color:#999; font-size:12px;">（点击“在画布中选择位置”后，在画布上点击一次以确定节点位置）</div>
                </el-form-item>
            </el-form>

            <!-- 在画布上选择位置的对话框 -->
            <el-dialog title="在画布中选择位置" v-model="selectDialogVisible" width="60%" :destroy-on-close="true">
                <div style="height:440px; max-height:60vh; overflow:auto; padding:8px; box-sizing:border-box;">
                    <div id="canvasSelect" style="width:100%; height:100%; min-height:360px;"></div>
                </div>
                <template #footer>
                    <el-button @click="cancelSelectDialog">取消</el-button>
                    <el-button type="primary" :disabled="!nodePosition" @click="confirmSelectDialog">确认位置</el-button>
                </template>
            </el-dialog>

            <template #footer>
                <el-button @click="cancelAddNode">取消</el-button>
                <el-button type="primary" @click="confirmAddNode">确定并添加</el-button>
            </template>
        </el-dialog>

        <!-- 修改工步 -->
        <StepFormDialog v-model="stepDialogVisible" :form-data="stepFormData"
            :equipment-list="equipmentStore.equipmentList" :is-edit="true" :on-submit="StepPerformSubmit"
            @submit-success="onStepSubmitSuccess" />

        <!-- 修改/添加工序 -->
        <ProcessFormDialog v-model="processDialogVisible" :form-data="currentProcessData" :is-edit="isProcessEdit"
            :disabled-fields="disabledProcessFields" :allow-add-step="true" @submit-success="handleProcessSubmitSuccess"
            @submit-fail="handleProcessSubmitFail" @before-submit="handleProcessBeforeSubmit" />

        <!-- 添加/修改工艺流程对话框 -->
        <el-dialog :title="isFlowEdit ? '修改工艺流程' : '添加工艺流程'" v-model="flowDialogVisible" width="500px">
            <el-form :model="currentFlowData" label-width="100px" :rules="flowFormRules" ref="flowFormRef">
                <el-form-item label="流程名称" prop="flowName">
                    <el-input v-model="currentFlowData.flowName" placeholder="请输入流程名称" />
                </el-form-item>
                <el-form-item label="关联产品" prop="bomId">
                    <el-select v-model="currentFlowData.bomId" placeholder="请选择关联的产品">
                        <el-option v-for="product in bomStore.productList" :key="product.id" :label="product.name"
                            :value="product.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-select v-model="currentFlowData.status" placeholder="请选择状态">
                        <el-option label="有效" value="有效" />
                        <el-option label="无效" value="无效" />
                    </el-select>
                </el-form-item>
                <el-form-item label="标准工时">
                    <el-input v-model="currentFlowData.plannedWorkingHours" type="number" placeholder="请输入标准工时(小时)" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="flowDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitFlowForm">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { onMounted, ref, nextTick } from 'vue'
import { getAllFlowApi, addFlowApi, updateFlowApi, deleteFlowApi, getFlowChartApi, saveFlowChartApi } from '@/api/flow'
import { addProcessApi, updateProcessApi } from '@/api/process'
import { updateStepApi, addStepApi } from '@/api/step'
import { ElMessage, ElMessageBox, ElContainer, ElMain, ElAside } from 'element-plus'
import { Graph } from '@antv/x6'
import ProcessFormDialog from '@/components/process/ProcessFormDialog.vue'
import FlowCard from '@/components/flows/FlowCard.vue'
import ProcessCardForFlow from '@/components/process/ProcessCardForFlow.vue'
import StepCard from '@/components/step/StepCard.vue'
import StepFormDialog from '@/components/step/StepFormDialog.vue'
import { useProcessStore } from '@/stores/process'
import { useStepStore } from '@/stores/step'
import { useBomStore } from '@/stores/bom'
import { useEquipmentStore } from '@/stores/equipment'

const processStore = useProcessStore()
const stepStore = useStepStore()
const bomStore = useBomStore()
const equipmentStore = useEquipmentStore()
const { loadAllProcesses } = processStore
const { loadAllSteps } = stepStore
const { loadBomData } = bomStore
const { loadEquipmentData } = equipmentStore

// 工艺流程列表
const flowList = ref([])

// 加载所有工艺流程数据
const loadAllFlows = async () => {
    try {
        const response = await getAllFlowApi()
        if (response && response.code === 200) {
            flowList.value = response.data
        } else {
            ElMessage.error(`获取工艺流程失败: ${response?.message || '未知错误'}`)
        }
    } catch (error) {
        console.error('Load flows error:', error)
        ElMessage.error('加载工艺流程失败，请重试')
    }
}

// 根据产品 ID 获取对应的工艺流程列表
const getFlowsByProductId = (productId) => {
    return flowList.value.filter(flow => flow.bomId === productId)
}

// 选中的工艺流程详情
const selectedFlow = ref(null)

// 显示选中的工艺流程详情
const showFlowDetails = async (flow) => {
    selectedFlow.value = flow
    await renderFlowChart(flow.id)
}

// 页面加载时获取所有工序和步骤数据
onMounted(async () => {
    await loadAllProcesses()
    await loadAllSteps()
    await loadBomData()
    await loadAllFlows()
    await loadEquipmentData()
    // 初始化画布
    await initGraph()
})

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
                    // 启用 Selection 插件的配置
                    selecting: {
                        enabled: true,          // 启用选择功能 (可选，设为 true 时可以省略)
                        multiple: true,         // 是否支持多选，默认为 false
                        rubberband: true,       // 是否启用框选（橡皮筋选择），默认为 false
                        movable: true,          // 选中后是否可以移动，默认为 true
                        showNodeSelectionBox: true,  // 是否显示节点选中框，默认为 false
                    },
                    // 启用节点拖拽
                    nodeMovable: true,
                    edgeMovable: false, // 边不能移动
                    // 允许节点点击
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

                // 监听节点点击事件
                graphInstance.on('node:click', ({ node, e }) => {
                    handleNodeClick(node, e)
                })

                // 监听边点击事件
                graphInstance.on('edge:click', ({ edge, e }) => {
                    handleEdgeClick(edge, e)
                })

                // 监听空白处点击，清除选择
                graphInstance.on('blank:click', () => {
                    clearSelection()
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

// 渲染边
const renderEdges = (edgeData) => {
    if (!graphInstance || !edgeData) {
        return
    }

    // 遍历边数据，格式可能是 HashMap<String, String> 或 HashMap<String, List<String>>
    for (const [sourceName, targetName] of Object.entries(edgeData)) {
        // targetName是数组（HashMap<String, List<String>>格式）
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

// 添加工序到画布相关状态
const addNodeDialogVisible = ref(false)
const selectedProcessForNode = ref(null) // 存放 process id
const nodePosition = ref(null) // {x,y}
const waitingForCanvasClick = ref(false)
const lastCreatedProcessId = ref(null) // 用于记录刚刚通过新增表单创建的 process id

// 打开“添加工序到画布”对话框
const openAddNodeDialog = () => {
    if (!selectedFlow.value) {
        ElMessage.warning('请先在左侧选择一个工艺流程（Flow）')
        return
    }
    nodePosition.value = null
    selectedProcessForNode.value = null
    addNodeDialogVisible.value = true
    lastCreatedProcessId.value = null
}

// 取消添加节点对话框
const cancelAddNode = () => {
    addNodeDialogVisible.value = false
    waitingForCanvasClick.value = false
    nodePosition.value = null
}

// 确认在画布上添加节点
const confirmAddNode = async () => {
    if (!selectedProcessForNode.value) {
        ElMessage.warning('请先选择一个工序')
        return
    }
    if (!graphInstance) {
        ElMessage.error('画布尚未初始化')
        return
    }

    // 尝试根据 lastCreatedProcessId 设定选择（如果用户刚刚通过新增创建）
    if (!processStore.processList.find(p => p.id === selectedProcessForNode.value) && lastCreatedProcessId.value) {
        selectedProcessForNode.value = lastCreatedProcessId.value
    }

    const processObj = processStore.processList.find(p => p.id === selectedProcessForNode.value)
    if (!processObj) {
        ElMessage.error('未找到对应的工序，请刷新后重试')
        return
    }

    // 生成 node id，尽量唯一
    const nodeId = `node_proc_${processObj.id}_${Date.now()}`
    const width = 160
    const height = 60
    const x = nodePosition.value ? nodePosition.value.x : 100 + Math.random() * 400
    const y = nodePosition.value ? nodePosition.value.y : 100 + Math.random() * 300

    const node = graphInstance.createNode({
        id: nodeId,
        shape: 'rect',
        x: x,
        y: y,
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
                text: processObj.processName,
                fill: '#333',
                fontSize: 14,
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
            },
        },
        data: {
            id: processObj.id,
            name: processObj.processName,
            raw: processObj
        }
    })

    graphInstance.addCell(node)
    ElMessage.success('已将工序添加到画布（仅本地显示）')

    // 关闭对话框并清理状态
    addNodeDialogVisible.value = false
    nodePosition.value = null
    waitingForCanvasClick.value = false
}

// 选择画布对话框与临时图实例
const selectDialogVisible = ref(false)
let selectGraphInstance = null

// 点击“在画布中选择位置”现在打开对话框并初始化选择画布
const startCanvasSelection = () => {
    // 重置位置
    nodePosition.value = null
    // 打开选择对话框
    selectDialogVisible.value = true
    // 在下一个 tick 初始化选择画布（保证 DOM 已渲染）
    nextTick(() => {
        initSelectGraph()
    })
}

// 初始化选择对话（在对话框中的画布）并把主画布的内容复制过来（仅视觉）
const initSelectGraph = () => {
    const container = document.getElementById('canvasSelect')
    if (!container) {
        ElMessage.error('选择画布容器未找到')
        return
    }

    // 销毁旧实例
    if (selectGraphInstance) {
        try { selectGraphInstance.dispose() } catch (e) { /* ignore */ }
        selectGraphInstance = null
    }

    // 创建新的临时图，用于在对话框中展示（配置与主图类似）
    selectGraphInstance = new Graph({
        container,
        autoResize: true,
        background: { color: '#ffffff' },
        grid: {
            visible: true,
            type: 'mesh'
        },
        panning: true,
        mousewheel: true
    })

    // 如果主画布存在，将节点/边复制过去用于预览（浅复制 attrs/position）
    if (graphInstance) {
        // 复制节点
        const nodes = graphInstance.getNodes()
        nodes.forEach(n => {
            const pos = n.getPosition()
            // 尝试读取宽高，若没有使用默认值
            const bbox = n.getBBox ? n.getBBox() : { width: 160, height: 60 }
            const width = Math.max(120, bbox.width)
            const height = Math.max(40, bbox.height)
            // 按优先顺序取名字（不同数据结构）
            const data = n.getData ? n.getData() : (n.data || {})
            const labelText = data.name || data.processName || data.processName || ''

            // 优先使用原节点 attrs，如果无则使用我们定义的默认样式
            const originalAttrs = (n.getAttrs && Object.keys(n.getAttrs()).length) ? n.getAttrs() : null

            const enhancedAttrs = {
                body: {
                    fill: '#f5f9ff',
                    stroke: '#31d0c6',
                    strokeWidth: 2,
                    rx: 6,
                    ry: 6
                },
                // 使用 label 属性来配置文字；若你的 X6 版本使用 text，请改为 text: { ... }
                label: {
                    text: labelText,
                    fill: '#333',
                    fontSize: 12,
                    // 尝试启用换行/省略；不同版本属性名可能不同（textWrap 或 label.textWrap）
                    textWrap: {
                        // 最大像素宽度，留一些内边距
                        width: Math.max(80, width - 20),
                        // 是否使用省略号
                        ellipsis: true
                    }
                }
            }

            const attrsToUse = originalAttrs ? { ...originalAttrs, ...enhancedAttrs } : enhancedAttrs

            const newNode = selectGraphInstance.createNode({
                id: `copy_${n.id}`,
                shape: n.shape || 'rect',
                x: pos.x,
                y: pos.y,
                width,
                height,
                attrs: attrsToUse,
                data
            })
            selectGraphInstance.addCell(newNode)
        })

        // 复制边
        const edges = graphInstance.getEdges()
        edges.forEach(e => {
            const source = e.getSource()
            const target = e.getTarget()

            // 如果 source/target 是 cell id，映射到 copy_ 前缀
            const sourceCellId = (source && source.cell) ? `copy_${source.cell}` : (typeof source === 'string' ? `copy_${source}` : source)
            const targetCellId = (target && target.cell) ? `copy_${target.cell}` : (typeof target === 'string' ? `copy_${target}` : target)

            const edgeAttrs = (e.getAttrs && Object.keys(e.getAttrs()).length) ? e.getAttrs() : {
                line: {
                    stroke: '#cfcfcf',
                    strokeWidth: 1.6,
                    targetMarker: {
                        name: 'classic',
                        size: 6
                    }
                }
            }

            const newEdge = selectGraphInstance.createEdge({
                shape: 'edge',
                source: sourceCellId,
                target: targetCellId,
                attrs: edgeAttrs
            })
            selectGraphInstance.addCell(newEdge)
        })
    }

    // 监听空白处点击事件，X6 的 blank:click 返回图内坐标 (x,y)
    selectGraphInstance.on('blank:click', ({ x, y }) => {
        nodePosition.value = { x: Math.round(x), y: Math.round(y) }
        ElMessage.success(`已选择位置 x:${nodePosition.value.x}, y:${nodePosition.value.y}`)
    })
}

// 取消选择对话框
const cancelSelectDialog = () => {
    selectDialogVisible.value = false
    nodePosition.value = null
    // 销毁临时图
    if (selectGraphInstance) {
        try { selectGraphInstance.dispose() } catch (e) { }
        selectGraphInstance = null
    }
}

// 确认选择的位置（将位置保留并关闭对话框）
const confirmSelectDialog = () => {
    if (!nodePosition.value) {
        ElMessage.warning('请先在画布中点击选择位置')
        return
    }
    selectDialogVisible.value = false
    // 销毁临时图
    if (selectGraphInstance) {
        try { selectGraphInstance.dispose() } catch (e) { }
        selectGraphInstance = null
    }
    ElMessage.success(`已选择位置 x:${nodePosition.value.x}, y:${nodePosition.value.y}`)
    // 此时 nodePosition 已可供 confirmAddNode 使用
}

// 添加箭头相关状态
const addingEdgeMode = ref(false)
const edgeSourceNodeId = ref(null)
const edgeSourceOriginalAttrs = ref(null)

// 切换添加箭头模式（再次点击可取消）
const toggleAddEdgeMode = () => {
    if (!selectedFlow.value) {
        ElMessage.warning('请先在左侧选择一个工艺流程（Flow）')
        return
    }
    addingEdgeMode.value = !addingEdgeMode.value
    if (addingEdgeMode.value) {
        edgeSourceNodeId.value = null
        edgeSourceOriginalAttrs.value = null
        ElMessage.info('进入"添加箭头"模式：先点击源节点，再点击目标节点；再次点击按钮取消。')
    } else {
        // 取消时恢复源节点样式（若已选）
        if (edgeSourceNodeId.value && graphInstance) {
            const n = graphInstance.getCellById(edgeSourceNodeId.value)
            if (n && edgeSourceOriginalAttrs.value) {
                try {
                    n.attr(edgeSourceOriginalAttrs.value)
                } catch (e) { /* ignore */ }
            }
        }
        edgeSourceNodeId.value = null
        edgeSourceOriginalAttrs.value = null
        ElMessage.info('已取消添加箭头模式')
    }
}

// 添加选择状态管理
const selectedElement = ref(null) // 存储选中的元素（节点或边）
const selectedElementType = ref(null) // 存储选中元素类型 ('node' 或 'edge')

// 处理节点点击事件
const handleNodeClick = (node, event) => {
    // 如果处于添加箭头模式：先选源节点，再选目标节点创建箭头
    if (addingEdgeMode.value) {
        const clickedId = node.id
        // 选择源节点
        if (!edgeSourceNodeId.value) {
            edgeSourceNodeId.value = clickedId
            // 保存原始 attrs（方便取消时恢复）
            edgeSourceOriginalAttrs.value = { ...node.getAttrs() } // 深拷贝attrs
            // 高亮源节点（仅视觉提示）
            try {
                node.attr({
                    body: {
                        stroke: '#f56c6c',
                        strokeWidth: 3
                    }
                })
            } catch (e) { /* ignore */ }
            ElMessage.info('已选择源节点，请点击目标节点以完成连接，或再次点击按钮取消')
            return
        }

        // 选择目标节点 -> 创建边
        const sourceId = edgeSourceNodeId.value
        const targetId = clickedId

        if (sourceId === targetId) {
            ElMessage.warning('源节点和目标节点不能相同，请选择其他节点')
            // 恢复源节点样式并清理状态
            if (graphInstance) {
                const srcNode = graphInstance.getCellById(sourceId)
                if (srcNode && edgeSourceOriginalAttrs.value) {
                    try { srcNode.attr(edgeSourceOriginalAttrs.value) } catch (e) { /* ignore */ }
                }
            }
            edgeSourceNodeId.value = null
            edgeSourceOriginalAttrs.value = null
            return
        }

        try {
            const edge = graphInstance.createEdge({
                shape: 'edge',
                source: sourceId,
                target: targetId,
                attrs: {
                    line: {
                        stroke: '#a0a0a0',
                        strokeWidth: 2,
                        targetMarker: {
                            name: 'classic',
                            size: 8
                        }
                    }
                }
            })
            graphInstance.addCell(edge)
            ElMessage.success('已添加箭头（仅本地显示）')
        } catch (e) {
            console.error('创建边失败：', e)
            ElMessage.error('添加箭头失败，请重试')
        }

        // 恢复源节点样式并清理状态
        if (graphInstance) {
            const srcNode = graphInstance.getCellById(sourceId)
            if (srcNode && edgeSourceOriginalAttrs.value) {
                try {
                    srcNode.attr(edgeSourceOriginalAttrs.value)
                } catch (e) { /* ignore */ }
            }
        }
        edgeSourceNodeId.value = null
        edgeSourceOriginalAttrs.value = null
        // 重置添加箭头模式
        addingEdgeMode.value = false
        ElMessage.info('已取消添加箭头模式')
        return
    }

    // 非添加箭头模式：选择节点
    clearSelection() // 清除之前的选择状态

    // 获取当前节点的原始样式
    const originalAttrs = { ...node.getAttrs() } // 深拷贝

    // 保存原始样式到节点数据中，以便后续恢复
    node.setData({
        ...node.getData(),
        originalAttrs: originalAttrs
    })

    // 添加选中动画效果
    node.attr({
        body: {
            fill: '#409eff', // 选中时的背景色
            stroke: '#1890ff', // 选中时的边框色
            strokeWidth: 3, // 加粗边框
        },
        text: {
            fill: '#fff', // 选中时文字颜色为白色
            fontWeight: 'bold', // 文字加粗
        },
    })

    // 更新选中状态
    selectedElement.value = node
    selectedElementType.value = 'node'

    // 获取并显示节点详细信息
    showNodeDetails(node)
}

// 添加处理边点击事件
const handleEdgeClick = (edge, event) => {
    if (addingEdgeMode.value) {
        // 在添加箭头模式下，点击边不应该有任何操作
        return
    }

    clearSelection() // 清除之前的选择状态

    // 保存原始样式
    const originalAttrs = { ...edge.getAttrs() } // 深拷贝
    edge.setData({
        ...edge.getData(),
        originalAttrs: originalAttrs
    })

    // 高亮选中的边
    edge.attr({
        line: {
            stroke: '#409eff', // 选中时的颜色
            strokeWidth: 4, // 加粗
            targetMarker: {
                name: 'classic',
                size: 10,
                fill: '#409eff'
            }
        }
    })

    // 更新选中状态
    selectedElement.value = edge
    selectedElementType.value = 'edge'
}

// 清除选择状态（支持节点和边）
const clearSelection = () => {
    if (!graphInstance) return

    // 清除选中的节点
    if (selectedElement.value && selectedElementType.value === 'node') {
        const originalAttrs = selectedElement.value.getData().originalAttrs
        if (originalAttrs) {
            selectedElement.value.attr(originalAttrs)
            const currentData = { ...selectedElement.value.getData() }
            delete currentData.originalAttrs
            selectedElement.value.setData(currentData)
        }
    }

    // 清除选中的边
    if (selectedElement.value && selectedElementType.value === 'edge') {
        const originalAttrs = selectedElement.value.getData().originalAttrs
        if (originalAttrs) {
            selectedElement.value.attr(originalAttrs)
            const currentData = { ...selectedElement.value.getData() }
            delete currentData.originalAttrs
            selectedElement.value.setData(currentData)
        }
    }

    selectedElement.value = null
    selectedElementType.value = null
}

// 删除选中元素
const deleteSelectedElement = () => {
    if (!selectedElement.value) {
        ElMessage.warning('请先选择要删除的节点或边')
        return
    }

    if (selectedElementType.value === 'node') {
        // 删除节点
        graphInstance.removeCell(selectedElement.value.id)
        ElMessage.success('节点已删除')
    } else if (selectedElementType.value === 'edge') {
        // 删除边
        graphInstance.removeCell(selectedElement.value.id)
        ElMessage.success('边已删除')
    }

    // 清除选择状态
    selectedElement.value = null
    selectedElementType.value = null
}

const selectedProcess = ref(null)
// 显示节点详细信息
const showNodeDetails = (node) => {
    const nodeData = node.getData()
    //根据名称寻找对应工序
    selectedProcess.value = handleSelectedProcess(processStore.processList.find(p => p.processName === nodeData.name))
}

//处理节点详细信息（用于显示）
const handleSelectedProcess = (selectedProcess) => {
    if (!selectedProcess) return '-'
    return {
        ...selectedProcess,
        input: (selectedProcess.inputBomId || []).map(id => getBomNameById(bomStore.bomTreeData, id)).join(', '),
        output: (selectedProcess.outputBomId || []).map(id => getBomNameById(bomStore.bomTreeData, id)).join(', '),
        workStep: (selectedProcess.workStepId || []).map(id => getStepNameById(id)).join(', ')
    }
}

// 根据物料id获取物料名称
const getBomNameById = (tree, id) => {
    if (!tree || !Array.isArray(tree)) return '-';

    // 使用深度优先搜索
    const searchInTree = (nodes, targetId) => {
        for (const node of nodes) {
            if (node.id == targetId) {
                return node.label;
            }

            // 如果有子节点，递归搜索
            if (node.children && Array.isArray(node.children) && node.children.length > 0) {
                const result = searchInTree(node.children, targetId);
                if (result) return result;
            }
        }
        return null; // 没找到
    };

    const result = searchInTree(tree, id);
    return result || '-';
}

// 根据工步id获取工步名称
const getStepNameById = (id) => {
    const list = stepStore.stepList || []
    const target = list.find(step => step.id === id)
    return target ? target.name : '-'
}

const selectedStep = ref(null)
//显示工步详情
const showStepDetails = (event) => {
    const { workStepName } = event
    //根据工步名称寻找对应工步
    const step = stepStore.stepList.find(s => s.name === workStepName)
    if (step) {
        //显示工步详情
        selectedStep.value = handleSelectedStep(step)
    } else {
        ElMessage.error(`未找到工步`)
    }
}

//处理工步信息（用于显示）
const handleSelectedStep = (selectedStep) => {
    if (!selectedStep) return '-'
    //通过设备id获取设备信息
    const equipment = equipmentStore.equipmentList.find(e => e.id === selectedStep.equipmentId)

    //通过功能id获取功能信息
    const functionDescription = equipment.description.find(f => f.id === selectedStep.functionId).functionDescription
    return {
        id: selectedStep.id,
        name: selectedStep.name,
        equipment: equipment ? equipment.name : '-',
        model: equipment ? equipment.model : '-',
        function: functionDescription || '-',
        description: selectedStep.description,
        status: selectedStep.processName.join(', ')
    }
}

//以下都是工步表单对话框相关的状态和方法
const stepDialogVisible = ref(false)
const stepFormData = ref({
    id: null,
    name: '',
    description: '',
    equipmentId: null,
    functionId: null
})

//打开工步编辑对话框
const handleStepEdit = () => {
    if (!selectedStep.value) {
        ElMessage.warning('请先选择一个工步进行编辑')
        return
    }
    //填充表单数据
    Object.assign(stepFormData.value, {
        id: selectedStep.value.id,
        name: selectedStep.value.name,
        description: selectedStep.value.description,
        equipmentId: equipmentStore.equipmentList.find(e => e.name === selectedStep.value.equipment)?.id || null,
        functionId: equipmentStore.equipmentList.find(e => e.name === selectedStep.value.equipment)?.description.find(f => f.functionDescription === selectedStep.value.function)?.id || null
    })
    stepDialogVisible.value = true
}

// 执行实际的 API 提交操作
const StepPerformSubmit = async (submitData) => {
    let result
    if (submitData.isEdit) {
        result = await updateStepApi(submitData)
    } else {
        result = await addStepApi(submitData)
    }
    if (result.code !== 200) {
        throw new Error(result.message || '操作失败')
    }
    return result
}

// 提交成功后的处理
const onStepSubmitSuccess = () => {
    ElMessage.success('修改成功')
    // 更新缓存
    const newStep = {
        id: stepFormData.id,
        name: stepFormData.name,
        equipmentId: stepFormData.equipmentId,
        functionId: stepFormData.functionId,
        equipmentName: null,
        equipmentModel: null,
        functionDescription: null,
        description: stepFormData.description,
        processName: selectedStep.processName
    }
    stepStore.updateStep(newStep);
    // 刷新显示的工步详情
    selectedStep.value.name = stepFormData.value.name
    selectedStep.value.description = stepFormData.value.description
    selectedStep.value.equipment = equipmentStore.equipmentList.find(e => e.id === stepFormData.value.equipmentId)?.name || self
    selectedStep.value.model = equipmentStore.equipmentList.find(e => e.id === stepFormData.value.equipmentId)?.model || self
    selectedStep.value.function = equipmentStore.equipmentList.find(e => e.id === stepFormData.value.equipmentId)?.description.find(f => f.id === stepFormData.value.functionId)?.functionDescription || self

}

//以下都是工序表单对话框相关的状态和方法
const processDialogVisible = ref(false)
const currentProcessData = ref({
    id: null,
    processName: '',
    plannedWorkingHours: null,
    description: '',
    qualityControlPoint: '',
    inputBomId: [],
    outputBomId: [],
    workStepId: []
})
const isProcessEdit = ref(false)
const disabledProcessFields = ref([]) // 根据业务需求设置禁用字段

// 根据 id 从原始 store 中查找未格式化的 process 对象（包含 id、inputBomId、outputBomId、workStepId 等）
const getRawProcessById = (id) => {
    if (!id) return null
    return processStore.processList.find(p => p.id === id) || null
}

// 打开工序对话框
const openProcessDialog = (id, editMode) => {
    if (!id && editMode) {
        ElMessage.warning('请先选择一个工序')
        return
    }
    const processData = getRawProcessById(id)
    isProcessEdit.value = editMode
    if (processData) {
        Object.assign(currentProcessData.value, processData)
    } else {
        // 重置为新增模式
        Object.assign(currentProcessData.value, {
            id: null,
            processName: '',
            plannedWorkingHours: null,
            description: '',
            qualityControlPoint: '',
            inputBomId: [],
            outputBomId: [],
            workStepId: []
        })
    }
    processDialogVisible.value = true
}

// 处理工序提交成功
const handleProcessSubmitSuccess = async (formData) => {
    try {
        let result
        if (isProcessEdit.value) {
            result = await updateProcessApi(formData)
        } else {
            result = await addProcessApi(formData)
        }

        if (result && result.code === 200) {
            ElMessage.success(isProcessEdit.value ? '修改成功' : '新增成功')
            if (isProcessEdit.value) {
                processStore.updateProcess(formData) // 更新本地状态
                // 重新获取并显示选中的工序详情
                const raw = processStore.processList.find(p => p.id === formData.id)
                selectedProcess.value = handleSelectedProcess(raw)
            } else {
                // 新增：先刷新流程列表
                await loadAllProcesses()

                // 尝试从返回结果中获取新创建的 id（各后端接口返回不一致）
                let createdId = result?.data?.id || null
                if (!createdId) {
                    // 通过名字寻找（如果后端未返回 id）
                    const found = processStore.processList.find(p => p.processName === formData.processName)
                    createdId = found?.id || null
                }
                lastCreatedProcessId.value = createdId

                // 如果后端没有返回 id，也可能需要再次 load 或人工刷新
            }
        } else {
            ElMessage.error(`操作失败: ${result?.message || '未知错误'}`)
        }
    } catch (error) {
        console.error('Process submit error:', error)
        ElMessage.error('提交失败，请重试')
    }
}

// 处理工序提交失败
const handleProcessSubmitFail = (error) => {
    console.error('Process submit failed:', error)
    ElMessage.error('表单验证失败，请检查输入')
}

// 处理工序提交前
const handleProcessBeforeSubmit = (data) => {
    // console.log('Process about to submit:', data)
    // 可以在这里做一些提交前的处理
}

// 保存工艺流程图
const saveFlowChart = async () => {
    if (!selectedFlow.value) {
        ElMessage.warning('请先在左侧选择一个工艺流程');
        return;
    }

    if (!graphInstance) {
        ElMessage.error('画布尚未初始化');
        return;
    }

    try {
        // 获取画布上的所有节点和边
        const nodes = graphInstance.getNodes();
        const edges = graphInstance.getEdges();

        // 构建要保存的数据结构
        const nodeData = nodes.map(node => node.getData().name);

        const edgeData = edges.map(edge => {
            const sourceCellId = edge.getSourceCellId();
            const targetCellId = edge.getTargetCellId();
            // 通过cellId找到对应的节点数据
            const sourceNode = nodes.find(n => n.id === sourceCellId);
            const targetNode = nodes.find(n => n.id === targetCellId);

            if (!sourceNode || !targetNode) {
                console.warn(`无法找到边的源或目标节点: ${sourceCellId} -> ${targetCellId}`);
                return null;
            }

            return {
                sourceNodeName: sourceNode.getData().name,
                targetNodeName: targetNode.getData().name,
            };
        }).filter(edge => edge !== null); // 过滤掉无效边

        // 调用API保存
        const saveData = {
            flowId: selectedFlow.value.id,
            nodeData: nodeData,
            edgeData: edgeData
        };

        const response = await saveFlowChartApi(saveData);

        if (response && response.code === 200) {
            ElMessage.success('工艺流程图保存成功');
        } else {
            ElMessage.error(`保存失败: ${response?.message || '未知错误'}`);
        }
    } catch (error) {
        console.error('Save flow chart error:', error);
        ElMessage.error('保存工艺流程图失败，请重试');
    }
};

//以下都是工艺流程表单对话框相关的状态和方法
// 添加/修改工艺流程对话框相关状态
const flowFormRef = ref(null)
const flowDialogVisible = ref(false)
const currentFlowData = ref({
    id: null,
    bomId: null,
    flowName: '',
    status: '',
    plannedWorkingHours: null
})
const isFlowEdit = ref(false) // 标记是编辑模式还是新增模式

// 根据 id 从 flowList 中查找 flow 对象
const getRawFlowById = (id) => {
    if (!id) return null
    return flowList.value.find(f => f.id === id) || null
}

// 打开工艺流程对话框 
const openFlowDialog = (id = null, editMode = false) => {
    //先清除表单验证状态
    if (flowFormRef.value) {
        flowFormRef.value.clearValidate()
    }

    isFlowEdit.value = editMode
    if (id && editMode) {
        const flowData = getRawFlowById(id)
        if (flowData) {
            Object.assign(currentFlowData.value, flowData)
        } else {
            ElMessage.error('未找到对应的工艺流程')
            return
        }
    } else {
        // 重置为新增模式
        Object.assign(currentFlowData.value, {
            id: null,
            flowName: '',
            bomId: null,
            status: '',
            plannedWorkingHours: null
        })
    }
    flowDialogVisible.value = true
}

// 工艺流程表单验证规则
const flowFormRules = {
    flowName: [
        { required: true, message: '请输入流程名称', trigger: 'blur' },
        { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
    ],
    bomId: [
        { required: true, message: '请选择关联的产品', trigger: 'change' }
    ],
    status: [
        { required: true, message: '请选择状态', trigger: 'change' }
    ],
}

// 处理工艺流程提交
const submitFlowForm = async () => {
    console.log(currentFlowData.value);

    if (flowFormRef.value) {
        flowFormRef.value.validate(async (valid) => {
            if (valid) {
                try {
                    let result
                    if (isFlowEdit.value) {
                        result = await updateFlowApi(currentFlowData.value)
                    } else {
                        result = await addFlowApi(currentFlowData.value)
                    }

                    if (result && result.code === 200) {
                        ElMessage.success(isFlowEdit.value ? '修改成功' : '新增成功')
                        // 刷新工艺流程列表
                        await loadAllFlows()
                        //重新查询一遍当前选中的工艺流程
                        if (isFlowEdit.value && selectedFlow.value && selectedFlow.value.id === currentFlowData.value.id) {
                            selectedFlow.value = getRawFlowById(currentFlowData.value.id)
                        }

                        flowDialogVisible.value = false
                    } else {
                        ElMessage.error(`操作失败: ${result?.message || '未知错误'}`)
                    }
                } catch (error) {
                    console.error('Flow submit error:', error)
                    ElMessage.error('提交失败，请重试')
                }
            }
        })
    }
}

// 删除工艺流程
const deleteFlow = async () => {
    const flowId = selectedFlow.value ? selectedFlow.value.id : null
    if (!flowId) {
        ElMessage.warning('流程ID无效')
        return
    }

    try {
        // 二次确认
        await ElMessageBox.confirm(
            '此操作将永久删除该工艺流程，是否继续?',
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )

        const response = await deleteFlowApi(flowId) // 调用删除API

        if (response && response.code === 200) {
            ElMessage.success('删除成功')
            // 重新加载列表
            await loadAllFlows()
            // 如果删除的是当前选中的流程，清除详情
            if (selectedFlow.value && selectedFlow.value.id === flowId) {
                selectedFlow.value = null
                if (graphInstance) {
                    graphInstance.clearCells() // 清空画布
                }
            }
        } else {
            ElMessage.error(`删除失败: ${response?.message || '未知错误'}`)
        }
    } catch (error) {
        if (error !== 'cancel') { // 用户取消操作
            console.error('Delete flow error:', error)
            ElMessage.error('删除失败，请重试')
        }
    }
}
</script>
<style scoped>
/* ... 原先样式保持不变，省略以节省篇幅（请保留文件中原本的 style 内容） ... */
.page-title {
    margin: 16px 0;
}

/* 外层容器内边距 */
.flows-wrapper {
    padding: 12px;
}

/* 使 Element Plus 的 el-aside 元素可视化（在 scoped 下使用 ::v-deep） */
.flows-wrapper :deep(.el-aside) {
    background: #ffffff;
    border: 1px solid #e6e6e6;
    border-radius: 8px;
    box-shadow: 0 6px 18px rgba(20, 24, 38, 0.06);
}

/* 标题区域样式 */
.flows-wrapper :deep(.el-aside) h2 {
    margin: 0;
    padding: 12px;
    font-size: 16px;
    font-weight: 600;
    border-bottom: 1px solid #f5f5f5;
}

/* 左侧栏额外内边距（已设置 width=300px）*/
.left-aside {
    padding: 8px;
    box-sizing: border-box;
}

/* 右侧栏占位与内边距 */
.right-aside {
    padding: 8px;
    box-sizing: border-box;
    min-width: 320px;
}

/* 菜单视觉微调 */
.flows-wrapper :deep(.el-menu) {
    background: transparent;
    border-radius: 6px;
}

.flows-wrapper :deep(.el-menu .el-menu-item) {
    padding-left: 36px;
}

/* 子菜单标题对齐图标 */
.flows-wrapper :deep(.el-submenu__title) {
    display: flex;
    align-items: center;
    gap: 8px;
}

.main-area {
    padding: 12px;
    box-sizing: border-box;
    background: linear-gradient(180deg, #ffffff, #fbfdff);
    /* 轻微渐变背景 */
    border: 1px solid #e6eef8;
    /* 淡蓝色边框 */
    border-radius: 10px;
    /* 圆角 */
    box-shadow: 0 6px 18px rgba(20, 24, 38, 0.04);
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 360px;
    /* 可按需调整 */
}

/* 当 Element Plus 内部对 el-main 做包装时的兼容选择器（保底）*/
.flows-wrapper :deep(.main-area) {
    background: linear-gradient(180deg, #ffffff, #fbfdff);
    border: 1px solid #e6eef8;
    border-radius: 10px;
    box-shadow: 0 6px 18px rgba(20, 24, 38, 0.04);
}

/* 主标题样式（位于 el-main 内显示的标题） */
.main-title {
    display: inline-block;
    padding: 8px 12px;
    margin: 0;
    background: #f5f9ff;
    /* 标题背景色 */
    border: 1px solid #dbeafe;
    /* 标题边框 */
    border-radius: 8px;
    /* 标题圆角 */
    font-size: 16px;
    font-weight: 600;
    color: #1f3a8a;
    /* 深蓝色文字（可调整） */
    box-shadow: 0 2px 6px rgba(20, 24, 38, 0.03);
}

/* 标题右侧的小按钮区域与标题对齐（如果你保留按钮行内显示） */
.main-title+.el-button,
.main-title+button,
.main-title~.el-button {
    margin-left: 8px;
    vertical-align: middle;
}

/* 响应式微调：小屏幕时减小圆角和内边距 */
@media (max-width: 900px) {
    .main-area {
        padding: 10px;
        border-radius: 8px;
    }

    .main-title {
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 14px;
    }
}

.canvas-container {
    width: 100%;
    height: 100%;
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

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>