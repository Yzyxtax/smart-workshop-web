<script setup>
import { ref } from 'vue'
import { loginApi } from '@/api/login.js'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { User, Lock, Platform } from '@element-plus/icons-vue'

let loginForm = ref({ userName: '', password: '' })
const routers = useRouter()

const login = async () => {
    if (!loginForm.value.userName || !loginForm.value.password) {
        ElMessage.warning('用户名或密码不能为空')
        return
    }
    try {
        const response = await loginApi(loginForm.value)
        if (response.code == 200) {
            localStorage.setItem('user', JSON.stringify(response.data))
            ElMessage.success('登录成功')
            routers.push('/')
        } else {
            ElMessage.error(response.message || '登录失败')
        }
    } catch (error) {
        ElMessage.error('请求失败，请稍后重试')
    }
}

const clear = () => {
    loginForm.value.userName = ''
    loginForm.value.password = ''
}
</script>

<template>
    <div id="container">
        <div class="login-card">
            <div class="login-header">
                <div class="logo-box">
                    <el-icon :size="35" color="#409EFF">
                        <Platform />
                    </el-icon>
                </div>
                <h2 class="title">智联车间系统</h2>
                <p class="en-title">INTELLIGENT WORKSHOP SYSTEM</p>
            </div>

            <el-form :model="loginForm" class="login-form">
                <el-form-item>
                    <el-input v-model="loginForm.userName" placeholder="请输入用户名" :prefix-icon="User" size="large" />
                </el-form-item>

                <el-form-item>
                    <el-input type="password" v-model="loginForm.password" placeholder="请输入密码" :prefix-icon="Lock"
                        show-password size="large" @keyup.enter="login" />
                </el-form-item>

                <div class="button-group">
                    <el-button class="login-btn" type="primary" size="large" @click="login">登 录</el-button>
                    <el-button class="reset-btn" size="large" @click="clear">重 置</el-button>
                </div>
            </el-form>
        </div>
    </div>
</template>

<style>
/* 1. 彻底解决滚动条：全局重置 */
html,
body {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
    /* overflow: hidden; */
    /* 禁止溢出滚动 */
}
</style>

<style scoped>
#container {
    height: 100vh;
    width: 100vw;
    display: flex;
    /* 2. 调整垂直位置：改为 flex-start 配合 padding-top，或者使用 center 配合 margin-top */
    justify-content: center;
    align-items: center;
    background: url('@/assets/loginBg.png') no-repeat center center;
    background-size: cover;
}

.login-card {
    width: 400px;
    padding: 40px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);

    /* 3. 核心修改：通过 margin-top 将盒子下移，避开背景图文字 */
    /* 如果想露出文字，设为正数（如 80px）；如果想彻底遮住，设为负数（如 -50px） */
    margin-top: 80px;
}

.login-header {
    text-align: center;
    margin-bottom: 30px;
}

.logo-box {
    width: 54px;
    height: 54px;
    background: #f0f7ff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 15px;
}

.title {
    font-size: 24px;
    color: #333;
    margin: 0;
    letter-spacing: 1px;
}

.en-title {
    font-size: 11px;
    color: #999;
    margin-top: 4px;
}

/* 4. 按钮布局与对齐修复 */
.button-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
    /* 按钮之间的间距 */
    margin-top: 20px;
}

/* 强制清除 Element Plus 默认的左外边距 */
.button-group .el-button+.el-button {
    margin-left: 0 !important;
}

.login-btn,
.reset-btn {
    width: 100%;
    /* 确保两个按钮宽度一致 */
    height: 45px;
    border-radius: 8px;
    font-size: 15px;
}

.login-btn {
    font-weight: bold;
}
</style>