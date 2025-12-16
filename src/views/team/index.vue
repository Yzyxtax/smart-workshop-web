<template>
    <div class="page">
        <h1>班组管理</h1>
    </div>
    <el-container class="team-page">
        <!-- 左侧边栏 -->
        <el-aside class="aside">
            <!-- 标题、按钮区域 -->
            <div class="aside-header">
                <h2 class="aside-title">班组列表</h2>
                <el-button type="primary" size="small" @click="openAddDialog">新增班组</el-button>
            </div>
            <!-- 菜单区域 -->
            <div class="menu-wrapper">
                <el-menu :default-active="activeIndex" class="team-menu" @select="handleSelect">
                    <el-menu-item v-for="teamItem in teams" :key="teamItem.teamNo" :index="teamItem.teamNo"
                        class="team-menu-item">
                        <span class="team-name">{{ teamItem.teamName }}</span>
                        <div class="team-actions">
                            <el-button type="text" size="small" icon="Edit" @click.stop="openEditDialog(teamItem)" />
                            <el-button type="text" size="small" icon="Delete" @click.stop="deleteTeam(teamItem)" />
                        </div>
                    </el-menu-item>
                </el-menu>
            </div>
        </el-aside>
        <!-- 右侧区域 -->
        <el-container class="right-col">
            <!-- 统计数据区域 -->
            <el-header class="header">
                <div class="stats-grid">
                    <el-card shadow="hover" class="stat-card">
                        <div class="stat-label">班组编号:</div>
                        <div class="stat-value">{{ selectedTeam.teamNo || '-' }}</div>
                    </el-card>
                    <el-card shadow="hover" class="stat-card">
                        <div class="stat-label">班组名称:</div>
                        <div class="stat-value">{{ selectedTeam.teamName || '-' }}</div>
                    </el-card>
                    <el-card shadow="hover" class="stat-card">
                        <div class="stat-label">所在地点:</div>
                        <div class="stat-value">{{ selectedTeam.teamLocation || '-' }}</div>
                    </el-card>
                    <el-card shadow="hover" class="stat-card">
                        <div class="stat-label">所属产线:</div>
                        <div class="stat-value">{{ selectedTeam.lineName || '-' }}</div>
                    </el-card>
                    <el-card shadow="hover" class="stat-card">
                        <div class="stat-label">班组长:</div>
                        <div class="stat-value">{{ selectedTeam.teamLeader || '-' }}</div>
                    </el-card>
                    <el-card shadow="hover" class="stat-card">
                        <div class="stat-label">成员数:</div>
                        <div class="stat-value">{{ (selectedTeam.teamMemberNum !== undefined &&
                            selectedTeam.teamMemberNum
                            !== null) ? selectedTeam.teamMemberNum : '-' }}</div>
                    </el-card>
                    <el-card shadow="hover" class="stat-card">
                        <div class="stat-label">可处理工序:</div>
                        <div class="stat-value">
                            <div v-if="processStats.length" style="display: inline-block;">
                                <div v-for="p in processStats" :key="p.processName">{{ p.processName }}：{{ p.count }}人
                                </div>
                            </div>
                            <div v-else>-</div>
                        </div>
                    </el-card>
                </div>
            </el-header>
            <!-- 矩阵图区域 -->
            <el-main class="main">
                <div>
                    <!-- 矩阵图标题 -->
                    <h3 style="margin: 16px;display: inline-block;">班组矩阵图</h3>
                    <el-button type="success" size="small" round @click.stop="saveMatrixGraph">保存</el-button>
                </div>
                <div ref="x6Container" class="team-graph"></div>
            </el-main>
        </el-container>

        <!-- 新增/编辑对话框 -->
        <el-dialog :title="isEdit ? '编辑班组' : '新增班组'" v-model="dialogVisible" width="600px">
            <el-form :model="form" :rules="rules" ref="teamForm" label-width="110px">
                <el-form-item label="班组编号" prop="teamNo">
                    <el-input v-model="form.teamNo" placeholder="请输入班组编号"></el-input>
                </el-form-item>
                <el-form-item label="班组名称" prop="teamName">
                    <el-input v-model="form.teamName" placeholder="请输入班组名称"></el-input>
                </el-form-item>
                <el-form-item label="所在地点" prop="teamLocation">
                    <el-input v-model="form.teamLocation" placeholder="请输入所在地点"></el-input>
                </el-form-item>
                <el-form-item label="班组长" prop="teamLeader">
                    <el-select v-model="form.teamLeader" placeholder="请选择班组长">
                        <el-option v-for="item in noTeamEmps.leaderList" :key="item.value" :label="item"
                            :value="item" />
                    </el-select>
                </el-form-item>
                <el-form-item label="成员" prop="userName">
                    <el-select v-model="form.userName" multiple placeholder="请选择用户名">
                        <el-option v-for="item in noTeamEmps.empList" :key="item.value" :label="item" :value="item" />
                    </el-select>
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="saving" @click="saveTeam">保存</el-button>
            </template>
        </el-dialog>
    </el-container>
</template>

<script setup>
import { onMounted, ref, reactive, nextTick, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox, ElContainer, ElHeader, ElMain, ElAside } from 'element-plus'
import { queryNoTeamEmpApi } from '@/api/emp'
import { getAllTeamApi, getTeamByNoApi, addTeamApi, updateTeamApi, deleteTeamApi, getTeamMatrixApi, saveTeamMatrixApi } from '@/api/team'
import { Graph } from '@antv/x6'

// 班组列表数据
const teams = ref([])

// 当前选中的班组编号
const activeIndex = ref('')

// 选中班组详情
const selectedTeam = ref({})
// 每个工序对应的处理人数统计
const processStats = ref([])

// 获取班组列表
const searchTeams = async () => {
    const response = await getAllTeamApi()
    if (response && response.code === 200) {
        teams.value = response.data
        if (teams.value.length > 0) {
            activeIndex.value = teams.value[0].teamNo
            await loadTeamDetails(activeIndex.value)
        }
    } else {
        ElMessage.error('获取班组列表失败')
    }
}

// 加载某个班组详情
const loadTeamDetails = async (teamNo) => {
    if (!teamNo) {
        selectedTeam.value = {}
        return
    }
    try {
        const resp = await getTeamByNoApi(teamNo)
        if (resp && resp.code === 200) {
            selectedTeam.value = resp.data || {}
        } else {
            selectedTeam.value = {}
            ElMessage.error('获取班组详情失败')
        }
    } catch (err) {
        selectedTeam.value = {}
        ElMessage.error('获取班组详情出错')
    }
}

//查询无班组员工
const noTeamEmps = ref([])
const queryNoTeamEmp = async () => {
    try {
        const resp = await queryNoTeamEmpApi()
        if (resp && resp.code === 200) {
            noTeamEmps.value = resp.data || []
        } else {
            noTeamEmps.value = []
            ElMessage.error('获取无班组员工失败')
        }
    } catch (err) {
        noTeamEmps.value = []
        ElMessage.error('获取无班组员工出错')
    }
}

// 选择班组方法
const handleSelect = async (index) => {
    activeIndex.value = index
    await loadTeamDetails(index)
}

// 对话框与表单
const teamForm = ref(null)
const dialogVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const originalTeamNo = ref('') // 编辑时保存原始编号用于 PUT 请求

const form = reactive({
    teamNo: '',
    teamName: '',
    teamLocation: '',
    teamLeader: '',
    userName: [] // 数组形式，保存时 will be populated from membersText
})

// 校验规则
const rules = {
    teamNo: [
        { required: true, message: '请输入班组编号', trigger: 'blur' }
    ],
    teamName: [
        { required: true, message: '请输入班组名称', trigger: 'blur' }
    ]
}

// 打开新增对话框
const openAddDialog = () => {
    //先清除校验规则
    teamForm.value?.clearValidate()

    isEdit.value = false
    dialogVisible.value = true
    // reset form
    form.teamNo = ''
    form.teamName = ''
    form.teamLocation = ''
    form.teamLeader = ''
    form.userName = []
    originalTeamNo.value = ''

    //查询无班组员工
    queryNoTeamEmp();
}

// 打开编辑对话框（用于侧边栏编辑按钮）
const openEditDialog = async (teamItem) => {
    //先清除校验规则
    teamForm.value?.clearValidate()
    isEdit.value = true
    // 若侧边栏传了 teamItem（仅包含 teamNo/teamName），先拉取详情以填充表单
    try {
        const resp = await getTeamByNoApi(teamItem.teamNo)
        if (resp && resp.code === 200) {
            const data = resp.data || {}
            form.teamNo = data.teamNo || ''
            form.teamName = data.teamName || ''
            form.teamLocation = data.teamLocation || ''
            form.teamLeader = data.teamLeader || ''
            form.userName = Array.isArray(data.userName) ? data.userName : (data.userName ? data.userName : [])
            originalTeamNo.value = data.teamNo || teamItem.teamNo || ''

            dialogVisible.value = true
            //查询无班组员工
            queryNoTeamEmp();
        } else {
            ElMessage.error('获取班组详情失败')
            dialogVisible.value = false
        }
    } catch (err) {
        ElMessage.error('获取班组详情出错')
        dialogVisible.value = false
    }
}

// 保存（新增或更新）
const saveTeam = () => {
    const teamForm = ref(null)
    // Access form ref to validate
    const validatePromise = new Promise((resolve, reject) => {
        // Vue template ref: use $refs via document? Instead use $refs in Options API not available here.
        // We'll use programmatic minimal validation:
        if (!form.teamNo || !form.teamName) {
            ElMessage.error('请填写必填项：班组编号、班组名称')
            reject(new Error('validation failed'))
            return
        }
        resolve()
    })

    validatePromise.then(async () => {
        saving.value = true
        const payload = {
            teamNo: form.teamNo,
            teamName: form.teamName,
            teamLocation: form.teamLocation,
            lineNo: form.lineNo === '' ? null : form.lineNo,
            teamLeader: form.teamLeader,
            userName: form.userName
        }

        try {
            if (isEdit.value) {
                // updateTeamApi(data, teamCode)
                const resp = await updateTeamApi(payload, originalTeamNo.value)
                if (resp && resp.code === 200) {
                    ElMessage.success('更新成功')
                    dialogVisible.value = false
                    await searchTeams()
                    // 保持当前选中为更新后的编号
                    activeIndex.value = form.teamNo
                    await loadTeamDetails(activeIndex.value)
                } else {
                    ElMessage.error(resp?.message || '更新失败')
                }
            } else {
                const resp = await addTeamApi(payload)
                if (resp && resp.code === 200) {
                    ElMessage.success('新增成功')
                    dialogVisible.value = false
                    await searchTeams()
                    // 选中新加入的班组
                    activeIndex.value = form.teamNo
                    await loadTeamDetails(activeIndex.value)
                } else {
                    ElMessage.error(resp?.message || '新增失败')
                }
            }
        } catch (err) {
            ElMessage.error('保存出错')
        } finally {
            saving.value = false
        }
    }).catch(() => {
        // validation failed
    })
}

// 删除方法
const deleteTeam = (team) => {
    ElMessageBox.confirm(`确定删除班组 "${team.teamName}" 吗？`, '确认删除')
        .then(async () => {
            const index = teams.value.findIndex(t => t.teamNo === team.teamNo)
            if (index > -1) {
                const response = await deleteTeamApi(team.teamNo)
                if (response && response.code === 200) {
                    teams.value.splice(index, 1)
                    ElMessage.success('删除成功')
                    // 如果删除的是当前选中项，尝试切换到第一个
                    if (activeIndex.value === team.teamNo) {
                        if (teams.value.length > 0) {
                            activeIndex.value = teams.value[0].teamNo
                            await loadTeamDetails(activeIndex.value)
                        } else {
                            activeIndex.value = ''
                            selectedTeam.value = {}
                        }
                    }
                } else {
                    ElMessage.error('删除失败')
                }
            }
        })
        .catch(() => {
            // 用户取消删除
            ElMessage.info('已取消删除')
        })
}

// X6 容器引用
const x6Container = ref(null)
let graph = null

// 初始化 X6 图表
const initX6Graph = async () => {
    if (!x6Container.value) return

    // 确保容器有尺寸
    await nextTick()

    graph = new Graph({
        container: x6Container.value,
        width: x6Container.value.clientWidth || 800,
        height: x6Container.value.clientHeight || 600,
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
    // 添加点击事件监听
    graph.on('node:click', ({ cell }) => {
        if (cell.getData().type === 'process') { // 只处理工序节点
            // 切换选择状态
            const isSelected = cell.getData().isSelected
            const newSelected = !isSelected

            // 更新节点样式
            cell.attr('body/fill', newSelected ? '#FF6B6B' : '#409EFF') // 选中红色，未选中蓝色
            cell.setData({ ...cell.getData(), isSelected: newSelected })

            // 更新页面上的工序统计
            updateProcessStats()

            // console.log(`Process clicked: ${cell.getData().processName}, selected: ${newSelected}`)
        }
    })
    // console.log('X6 Graph initialized successfully')
}

// 渲染班组矩阵图
const renderMatrixGraph = async (teamNo) => {
    if (!teamNo || !graph) {
        // console.log('Skip rendering - teamNo or graph not ready', { teamNo, graph: !!graph })
        return
    }

    try {
        // console.log('Fetching team matrix data for:', teamNo)
        const resp = await getTeamMatrixApi(teamNo)
        if (!resp || resp.code !== 200) {
            ElMessage.error('获取团队矩阵数据失败:' + (resp?.message || '未知错误'))
            return
        }

        const rawData = resp.data
        // console.log('Raw data received:', rawData)

        // 清空之前的图形
        graph.clearCells()

        const employeeCount = rawData.length
        if (employeeCount === 0) {
            // console.log('No employees data, clearing graph')
            // 没有员工/节点时，清空画布并重置统计
            graph.clearCells()
            processStats.value = []
            return
        }

        const containerWidth = x6Container.value.clientWidth || 800
        const containerHeight = x6Container.value.clientHeight || 600
        const centerX = containerWidth / 2
        const centerY = containerHeight / 2
        const innerRadius = 150
        const outerRadius = 280

        // console.log(`Creating graph with ${employeeCount} employees`)
        // console.log(`Container size: ${containerWidth}x${containerHeight}`)

        // 计算所有节点，避免重叠
        rawData.forEach((emp, empIdx) => {
            if (!emp || !emp.name) {
                // console.warn('Skipping invalid employee ', emp)
                return
            }

            const empAngle = (empIdx / employeeCount) * Math.PI * 2
            const empX = centerX + innerRadius * Math.cos(empAngle)
            const empY = centerY + innerRadius * Math.sin(empAngle)

            // 创建员工节点
            const empNode = graph.addNode({
                id: `emp-${empIdx}`,
                x: empX - 50, // 节点宽度的一半
                y: empY - 20, // 节点高度的一半
                width: 100,
                height: 40,
                attrs: {
                    body: {
                        fill: '#67C23A',
                        stroke: '#fff',
                        strokeWidth: 2,
                        rx: 6,
                        ry: 6,
                    },
                    text: {
                        text: `${emp.name}\n(${emp.username})`,
                        fill: '#fff',
                        fontSize: 12,
                        fontWeight: 'bold',
                    },
                },
                data: {
                    type: 'employee',
                    empName: emp.name,
                    username: emp.username,
                },
            })
            const choices = Array.isArray(emp.choices) ? emp.choices : []
            const procCount = choices.length

            choices.forEach((choice, procIdx) => {
                if (!choice || !choice.processName) {
                    // console.warn('Skipping invalid process choice:', choice)
                    return
                }

                const spreadAngle = 0.5
                const procAngle = empAngle - (spreadAngle / 2) +
                    (procIdx / (procCount > 1 ? procCount - 1 : 1)) * spreadAngle
                const procX = centerX + outerRadius * Math.cos(procAngle)
                const procY = centerY + outerRadius * Math.sin(procAngle)

                // 创建工序节点
                const procNode = graph.addNode({
                    id: `proc-${empIdx}-${procIdx}`,
                    x: procX - 60,
                    y: procY - 15,
                    width: 120,
                    height: 30,
                    attrs: {
                        body: {
                            fill: choice.choose ? '#FF6B6B' : '#409EFF', // 根据 choose 状态设置颜色
                            stroke: '#fff',
                            strokeWidth: 2,
                            rx: 4,
                            ry: 4,
                        },
                        text: {
                            text: choice.processName,
                            fill: '#fff',
                            fontSize: 10,
                        },
                    },
                    data: {
                        type: 'process',
                        processName: choice.processName,
                        username: emp.username,
                        name: emp.name,
                        isSelected: choice.choose // 记录初始选择状态
                    }
                })

                // 创建连接线
                graph.addEdge({
                    source: empNode,
                    target: procNode,
                    attrs: {
                        line: {
                            stroke: '#A3B1BF',
                            strokeWidth: 1,
                            targetMarker: {
                                name: 'classic',
                                size: 6,
                            },
                        },
                    },
                })
            })
        })

        // 自适应视图
        graph.centerContent()
        // 渲染完成后更新工序统计
        updateProcessStats()
        // console.log('Graph rendered successfully')

    } catch (error) {
        // console.error('渲染矩阵图失败:', error)
        ElMessage.error('渲染矩阵图失败')
    }
}

// 组件挂载时获取班组列表
onMounted(async () => {
    // console.log('Component mounted, starting initialization')
    await searchTeams()
    await nextTick() // 确保 DOM 渲染完成
    // console.log('Initializing X6 graph')
    initX6Graph()

    // 延迟初始化图表，确保容器尺寸正确
    setTimeout(async () => {
        // 如果有选中的班组，渲染图表
        if (activeIndex.value) {
            // console.log('Rendering initial graph for team:', activeIndex.value)
            await renderMatrixGraph(activeIndex.value)
        }
    }, 100) // 延迟100ms确保DOM完全渲染
})

// 监听班组切换
watch(activeIndex, async (newTeamNo) => {
    // console.log('Active team changed:', newTeamNo)
    if (newTeamNo && graph) {
        await renderMatrixGraph(newTeamNo)
    }
}, { immediate: true })

// 监听窗口大小变化
const handleResize = () => {
    if (graph && x6Container.value) {
        const width = x6Container.value.clientWidth
        const height = x6Container.value.clientHeight
        graph.resize(width, height)
        // console.log(`Resized graph to: ${width}x${height}`)
    }
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (graph) {
        graph.dispose()
        graph = null
        // console.log('X6 graph disposed')
    }
})

// 获取当前选中的工序数据（用于保存）
const getCurrentSelectedProcesses = () => {
    if (!graph) return []

    const selectedProcesses = []
    const cells = graph.getCells()

    cells.forEach(cell => {
        if (cell.getData()?.type === 'process' && cell.getData()?.isSelected) {
            const processData = cell.getData()
            selectedProcesses.push({
                username: processData.username,
                processName: processData.processName,
            })
        }
    })

    return selectedProcesses
}

// 保存矩阵图选择状态
const saveMatrixGraph = async () => {
    if (!activeIndex.value) {
        ElMessage.error('没有选中的班组，无法保存')
        return
    }

    const selectedProcesses = getCurrentSelectedProcesses()
    // console.log('Saving selected processes:', selectedProcesses)

    try {
        const payload = {
            teamCode: activeIndex.value,
            matrixData: selectedProcesses
        }
        const resp = await saveTeamMatrixApi(payload)
        if (resp && resp.code === 200) {
            ElMessage.success('矩阵图保存成功')
        } else {
            ElMessage.error('矩阵图保存失败:' + (resp?.message || '未知错误'))
        }
    } catch (error) {
        // console.error('保存矩阵图失败:', error)
        ElMessage.error('保存矩阵图失败')
    }
}

// 更新页面上的每个工序对应的人数统计
const updateProcessStats = () => {
    if (!graph) {
        processStats.value = []
        return
    }

    const cells = graph.getCells()
    const map = {}

    cells.forEach(cell => {
        const d = cell.getData()
        if (d?.type === 'process') {
            const name = d.processName || ''
            const user = d.username || d.name || ''
            if (!map[name]) map[name] = new Set()
            if (d.isSelected) {
                if (user) map[name].add(user)
            }
            // ensure the process exists in map even if no one selected
            if (!map[name]) map[name] = new Set()
        }
    })

    const keys = Object.keys(map)
    processStats.value = keys.length ? keys.map(k => ({ processName: k, count: map[k].size })) : []
}
</script>

<style scoped>
.team-page {
    display: grid;
    grid-template-columns: 300px 1fr;
    grid-template-rows: auto auto;
    gap: 12px;
    height: calc(100vh - 24px);
    box-sizing: border-box;
    padding: 12px;
    background: #f7f9fb;
}

.aside {
    grid-row: 1 / 3;
    grid-column: 1;
    background: linear-gradient(180deg, #f0f6ff 0%, #f6fbff 100%);
    border-radius: 8px;
    box-shadow: 0 6px 18px rgba(20, 38, 59, 0.08);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: calc(35vh + 55vh + 8px);
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
.team-menu {
    border-right: none;
    background: transparent;
}

.team-menu-item {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px !important;
    margin: 4px 8px;
    border-radius: 6px;
    transition: all 0.3s ease;
}

.team-menu-item:hover {
    background-color: rgba(255, 255, 255, 0.3) !important;
}

.team-menu-item.is-active {
    background: linear-gradient(90deg, #409eff, #66b1ff) !important;
    color: white !important;
}

.team-name {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: #1a3c5a;
}

.team-menu-item.is-active .team-name {
    color: white;
}

/* 操作按钮区域 */
.team-actions {
    opacity: 0;
    transition: opacity 0.2s ease;
    display: flex;
    gap: 8px;
}

.team-menu-item:hover .team-actions {
    opacity: 1;
}

.team-actions .el-button {
    padding: 2px 6px;
    color: #606266;
}

.team-actions .el-button:hover {
    color: #409eff;
}

.team-menu-item.is-active .team-actions .el-button {
    color: rgba(255, 255, 255, 0.8);
}

.team-menu-item.is-active .team-actions .el-button:hover {
    color: white;
}

/* 统计数据区域样式 */
.header {
    background: linear-gradient(180deg, #e8f6f2 0%, #e6fbf6 100%);
    border-radius: 8px;
    box-shadow: 0 6px 18px rgba(20, 38, 59, 0.08);
    display: flex;
    align-items: flex-start;
    /* 改为顶部对齐，避免被裁剪 */
    justify-content: center;
    height: 35vh;
    padding: 16px;
    overflow: auto;
    /* 同时允许横/纵向滚动 */
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    /* 缩小最小列宽，允许更多换行 */
    gap: 16px;
    width: 100%;
    max-width: 1200px;
}

.stat-card {
    text-align: center;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    border-radius: 8px;
    border: 1px solid rgba(220, 223, 229, 0.5);
    background: rgba(255, 255, 255, 0.7);
    min-width: 0;
    /* 允许在容器内收缩，避免横向溢出 */
    word-break: break-word;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12) !important;
}

.stat-label {
    font-size: 14px;
    color: #606266;
    margin-bottom: 8px;
    font-weight: 500;
}

.stat-value {
    font-size: 16px;
    color: #303133;
    font-weight: 600;
    white-space: normal;
    /* 允许换行 */
}

.scrollbar-demo-item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 50px;
    margin: 10px;
    text-align: center;
    border-radius: 4px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
}

/* 矩阵图区域 */
.main {
    background: #f2f7fa;
    border-radius: 8px;
    box-shadow: 0 6px 18px rgba(20, 38, 59, 0.08);
    height: 55vh;
    min-height: 220px;
    overflow: auto;
}

.team-graph {
    width: 100%;
    height: 83%;
    position: relative;
}

/* 移动端适配 */
@media (max-width: 900px) {
    .team-page {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto auto;
        gap: 6px;
        padding: 10px;
        height: calc(100vh - 20px);
    }

    .aside {
        grid-row: 1;
        grid-column: 1;
        height: auto;
        min-height: 100px;
    }

    .right-col {
        display: contents;
    }

    .header {
        grid-row: 2;
        grid-column: 1;
        height: 28vh !important;
    }

    .main {
        grid-row: 3;
        grid-column: 1;
        height: 52vh !important;
    }

    .stats-grid {
        grid-template-columns: 1fr;
        /* 移动端单列显示 */
        gap: 12px;
    }
}
</style>