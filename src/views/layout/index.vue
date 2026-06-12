<script setup>
import { ElContainer, ElHeader, ElAside, ElMain, ElMessageBox, ElMessage } from 'element-plus'
import HoverButton from '@/components/HoverButton.vue'
import { ref, watch, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { updateApi } from '@/api/emp'

//处理导航栏的折叠和展开
const isCollapse = ref(true)
let asideWidth = ref('200px')
const handleOpen = (key, keyPath) => {
    // console.log(key, keyPath)
}
const handleClose = (key, keyPath) => {
    // console.log(key, keyPath)
}
//watch侦听isCollapse的变化，动态调整侧边栏宽度
watch(isCollapse, (newVal) => {
    asideWidth.value = newVal ? '200px' : '250px'
})


//处理可编辑的标签页
const editableTabsValue = ref()
const editableTabs = ref([])

const router = useRouter()

//添加标签页
const addTab = (route) => {
    const existingTab = editableTabs.value.find(tab => tab.name === route.index)
    if (!existingTab) {
        editableTabs.value.push({
            title: route.label,
            name: route.index
        })
    }
    editableTabsValue.value = route.index
    router.push(route.index)
}

//切换标签页
const handleTabClick = (tab) => {
    const name = tab.props.name
    editableTabsValue.value = name
    router.push(name)
}

//移除标签页
const removeTab = (targetName) => {
    const tabs = editableTabs.value
    let activeName = editableTabsValue.value

    // 找到要删除的标签页索引
    const targetIndex = tabs.findIndex(tab => tab.name === targetName)

    if (targetIndex === -1) return // 没找到要删除的标签页

    // 如果删除的是当前激活的标签页
    if (activeName === targetName) {
        // 尝试选中下一个标签页，否则选中上一个
        const nextTab = tabs[targetIndex + 1] || tabs[targetIndex - 1]
        activeName = nextTab ? nextTab.name : ''  // 如果没有相邻标签页，设为空
    }

    // 更新标签页状态
    editableTabsValue.value = activeName
    editableTabs.value = tabs.filter((tab) => tab.name !== targetName)

    // 路由同步
    if (activeName) {
        // 如果还有激活的标签页，跳转到该标签页对应的路由
        router.push(activeName)
    } else if (editableTabs.value.length === 0) {
        // 如果没有标签页了，重定向到主页
        editableTabsValue.value = ''  // 清空激活状态
        router.push('/')  // 重定向到主页
    }
}

// 退出登录
const logout = () => {
    ElMessageBox.confirm(
        '确认退出登陆？',
        '警告',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    ).then(async () => {
        ElMessage.success('退出成功')
        localStorage.removeItem('user')
        router.push('/login')
    }).catch(() => {
        ElMessage.info('已取消')
    })
}

//修改密码
const dialogVisible = ref(false)//控制对话框
const formLabelWidth = '140px'//表单标签宽度
//表单数据
const form = ref({
    newPassword: '',
    passwordAgain: ''
})
//表单引用
const passwordForm = ref(null)
//提交数据
const updateForm = ref({
    id: '',
    password: ''
})
//取消按钮
const cancel = () => {
    dialogVisible.value = false
    form.value = {
        newPassword: '',
        passwordAgain: ''
    }
}
//表单校验规则
const rules = ref({
    newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
    ],
    passwordAgain: [
        { required: true, message: '请再次输入密码', trigger: 'blur' },
        {
            validator: (rule, value, callback) => {
                if (value !== form.value.newPassword) {
                    callback(new Error('两次输入的密码不一致'))
                } else {
                    callback()
                }
            }, trigger: 'blur'
        }
    ]
})
//保存按钮
const save = () => {
    //表单校验
    passwordForm.value.validate(async (valid) => {
        let result
        if (valid) {//验证通过
            const user = JSON.parse(localStorage.getItem('user'));
            updateForm.value.id = user.id
            updateForm.value.password = form.value.newPassword
            result = await updateApi(updateForm.value)
            if (result.code == 200) {
                ElMessage.success('密码修改成功，请重新登录')
                localStorage.removeItem('user')
                router.push('/login')
            } else {
                ElMessage.error('密码修改失败，请稍后重试')
            }
            dialogVisible.value = false
        } else {
            ElMessage.error('表单数据填写不完整或格式不正确')
        }
        form.value = {
            newPassword: '',
            passwordAgain: ''
        }
    })
}

//本地持久化信息
const user = JSON.parse(localStorage.getItem('user'));
</script>

<template>
    <div class="common-layout">
        <el-container>
            <!-- 顶部导航栏 -->
            <el-header>
                <span>
                    <span class="header-text">智能车间管理系统</span>
                </span>
                <span class="header-title">
                    <a href="">修改密码</a>
                    <HoverButton color="#f39c12" text="key" icon="key" icon-color="white"
                        @press="dialogVisible = true" />
                    <span>&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;</span>
                    <a href="">退出登陆</a>
                    <HoverButton color="rgb(255,65,65)" text="out" icon="logout" icon-color="white" @press="logout" />
                    <span>&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;</span>
                    {{ '您好，' + user.name }}
                </span>
            </el-header>

            <el-container>
                <el-aside :style="{ width: asideWidth }">
                    <el-radio-group v-model="isCollapse" style="margin: 20px; display: flex; justify-content: center;">
                        <el-radio-button :value="false">扩展</el-radio-button>
                        <el-radio-button :value="true">折叠</el-radio-button>
                    </el-radio-group>
                    <el-menu default-active="2" class="el-menu-vertical-demo" :collapse="isCollapse" @open="handleOpen"
                        @close="handleClose" router>
                        <!-- 系统管理菜单组 — 插入到 el-menu 内，作为第一个 sub-menu -->
                        <el-sub-menu index="/system">
                            <template #title>
                                <el-icon>
                                    <Setting />
                                </el-icon>
                                <span>系统管理</span>
                            </template>
                            <el-menu-item index="/role" @click="addTab({ index: '/role', label: '角色管理' })">
                                <el-icon><Avatar /></el-icon>角色管理
                            </el-menu-item>
                            <el-menu-item index="/permission" @click="addTab({ index: '/permission', label: '权限管理' })">
                                <el-icon><Lock /></el-icon>权限管理
                            </el-menu-item>
                            <el-menu-item index="/userPermission" @click="addTab({ index: '/userPermission', label: '用户权限分配' })">
                                <el-icon><UserFilled /></el-icon>用户权限分配
                            </el-menu-item>
                        </el-sub-menu>

                        <el-sub-menu index="/management">
                            <template #title>
                                <el-icon>
                                    <UserFilled />
                                </el-icon>
                                <span>人员结构管理</span>
                            </template>
                            <el-menu-item index="/line" @click="addTab({ index: '/line', label: '产线管理' })"><el-icon>
                                    <Guide />
                                </el-icon>产线管理</el-menu-item>
                            <el-menu-item index="/team" @click="addTab({ index: '/team', label: '班组管理' })"><el-icon>
                                    <User />
                                </el-icon>班组管理</el-menu-item>
                            <!-- <el-menu-item index="/workstation"
                                @click="addTab({ index: '/workstation', label: '工位管理' })"><el-icon>
                                    <Suitcase />
                                </el-icon>工位管理</el-menu-item> -->
                            <el-menu-item index="/user" @click="addTab({ index: '/user', label: '员工管理' })"><el-icon>
                                    <Avatar />
                                </el-icon>员工管理</el-menu-item>
                            <el-menu-item index="/equipment"
                                @click="addTab({ index: '/equipment', label: '设备管理' })"><el-icon>
                                    <Tools />
                                </el-icon>设备管理</el-menu-item>
                        </el-sub-menu>

                        <el-sub-menu index="/production">
                            <template #title>
                                <el-icon>
                                    <Filter />
                                </el-icon>
                                <span>工艺工程管理</span>
                            </template>
                            <el-menu-item index="/bom" @click="addTab({ index: '/bom', label: '产品管理' })">
                                <el-icon>
                                    <Aim />
                                </el-icon>产品管理</el-menu-item>
                            <el-menu-item index="/flows" @click="addTab({ index: '/flows', label: '工艺流程管理' })"><el-icon>
                                    <HelpFilled />
                                </el-icon>工艺流程管理</el-menu-item>
                            <el-menu-item index="/process"
                                @click="addTab({ index: '/process', label: '工序管理' })"><el-icon>
                                    <Histogram />
                                </el-icon>工序管理</el-menu-item>
                            <el-menu-item index="/step" @click="addTab({ index: '/step', label: '工步管理' })"><el-icon>
                                    <Brush />
                                </el-icon>工步管理</el-menu-item>
                        </el-sub-menu>

                        <el-sub-menu index="/operation">
                            <template #title>
                                <el-icon>
                                    <Setting />
                                </el-icon>
                                <span>生产管理</span>
                            </template>
                            <el-menu-item index="/plan" @click="addTab({ index: '/plan', label: '计划管理' })"><el-icon>
                                    <Compass />
                                </el-icon>计划管理</el-menu-item>
                            <el-menu-item index="/order" @click="addTab({ index: '/order', label: '订单管理' })"><el-icon>
                                    <Document />
                                </el-icon>订单管理</el-menu-item>
                        </el-sub-menu>

                        <el-sub-menu index="/workshop">
                            <template #title>
                                <el-icon>
                                    <OfficeBuilding />
                                </el-icon>
                                <span>车间管理</span>
                            </template>
                            <el-menu-item index="/order" @click="addTab({ index: '/order', label: '订单管理' })"><el-icon>
                                    <Document />
                                </el-icon>订单管理</el-menu-item>
                            <el-menu-item index="/workOrder"
                                @click="addTab({ index: '/workOrder', label: '工单管理' })"><el-icon>
                                    <Notebook />
                                </el-icon>工单管理</el-menu-item>
                            <el-menu-item index="/progress"
                                @click="addTab({ index: '/progress', label: '进度管理' })"><el-icon>
                                    <Sort />
                                </el-icon>进度管理</el-menu-item>
                        </el-sub-menu>

                        <el-sub-menu index="/manufacture">
                            <template #title>
                                <el-icon>
                                    <Money />
                                </el-icon>
                                <span>生产执行</span>
                            </template>
                            <el-menu-item index="/workOrder"
                                @click="addTab({ index: '/workOrder', label: '工单管理' })"><el-icon>
                                    <Notebook />
                                </el-icon>工单管理</el-menu-item>
                            <el-menu-item index="/execute"
                                @click="addTab({ index: '/execute', label: '工单执行' })"><el-icon>
                                    <Timer />
                                </el-icon>工单执行</el-menu-item>
                        </el-sub-menu>
                    </el-menu>
                </el-aside>
                <el-main>
                    <el-tabs v-model="editableTabsValue" type="card" editable class="tabs" @edit="removeTab"
                        @tab-click="handleTabClick">
                        <el-tab-pane v-for="item in editableTabs" :key="item.name" :label="item.title"
                            :name="item.name" />
                        <router-view />
                    </el-tabs>
                </el-main>
            </el-container>

        </el-container>
    </div>
    <el-dialog v-model="dialogVisible" title="修改密码" width="500">
        <el-form :model="form" :rules="rules" ref="passwordForm">
            <el-form-item label="新密码" :label-width="formLabelWidth" prop="newPassword">
                <el-input v-model="form.newPassword" autocomplete="off" />
            </el-form-item>

            <el-form-item label="确认密码" :label-width="formLabelWidth" prop="passwordAgain">
                <el-input v-model="form.passwordAgain" autocomplete="off" />
            </el-form-item>
        </el-form>
        <template #footer>
            <div>
                <el-button @click="cancel">取消</el-button>
                <el-button type="primary" @click="save">
                    提交
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<style scoped>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Noto Sans SC', sans-serif;
}

body {
    background-color: #f5f7fa;
    color: #333;
}

.common-layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

/* 顶部导航栏样式 */
.el-header {
    background: linear-gradient(135deg, #1a3a8f 0%, #2c5aa0 100%);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 30px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 100;
}

/* 标题文本样式 */
.header-text {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    position: relative;
    padding: 8px 16px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(5px);
    transition: all 0.3s ease;
    display: inline-block;
}

.header-text:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.header-text::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 3px;
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
    transition: width 0.3s ease;
}

.header-text:hover::after {
    width: 80%;
}

/* 右侧按钮区域样式 */

.header-title {
    display: flex;
    align-items: center;
    gap: 10px;
}

.header-title a {
    color: white;
    text-decoration: none;
    font-size: 14px;
    transition: color 0.3s;
}

.header-title a:hover {
    color: #a8d8ff;
}

/* 按钮样式 */
.hover-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 14px;
    font-weight: 500;
    border: none;
    color: white;
}

.hover-button.gray {
    background-color: rgba(255, 255, 255, 0.15);
}

.hover-button.gray:hover {
    background-color: rgba(255, 255, 255, 0.25);
}

.hover-button.red {
    background-color: rgba(255, 65, 65, 0.7);
}

.hover-button.red:hover {
    background-color: rgba(255, 65, 65, 0.9);
}

/* 主内容区域样式 */
.el-container {
    flex: 1;
    display: flex;
}

.el-aside {
    background-color: #fff;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
    padding: 20px;
    color: #666;
    font-weight: 500;
}

.el-main {
    padding: 30px;
    background-color: #f5f7fa;
}

.el-menu-vertical-demo:not(.el-menu--collapse) {
    width: 200px;
    min-height: 400px;
}

.tabs>.el-tabs__content {
    padding: 32px;
    color: #6b778c;
    font-size: 32px;
    font-weight: 600;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .el-header {
        padding: 0 15px;
    }

    .header-text {
        font-size: 18px;
    }

    .header-title span {
        display: none;
    }
}
</style>