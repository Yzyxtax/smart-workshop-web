<script setup>
    import { ElContainer, ElHeader, ElAside, ElMain } from 'element-plus'
    import HoverButton from '@/components/HoverButton.vue'
    import { ref } from 'vue'

    const isCollapse = ref(true)
    const handleOpen = (key, keyPath) => {
    console.log(key, keyPath)
    }
    const handleClose = (key, keyPath) => {
    console.log(key, keyPath)
    }

    //处理退出登录 
    function handleLogout() {
        console.log('Logout clicked')
    }
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
            <HoverButton color="gray" text="key" icon="key" icon-color="white" @click="" />
            <span>&nbsp;&nbsp;&nbsp;  |  &nbsp;&nbsp;&nbsp;</span>
            <a href="">退出登陆</a>
            <HoverButton color="rgb(255,65,65)" text="out" icon="logout" icon-color="white" @click="" />
        </span>
      </el-header>

      <el-container>
        <el-aside width="250px">
            <el-radio-group v-model="isCollapse" style="margin: 20px; display: flex; justify-content: center;">
                <el-radio-button :value="false">扩展</el-radio-button>
                <el-radio-button :value="true">折叠</el-radio-button>
            </el-radio-group>
            <el-menu
                default-active="2"
                class="el-menu-vertical-demo"
                :collapse="isCollapse"
                @open="handleOpen"
                @close="handleClose"
                router
            >
                <el-sub-menu index="/meta">
                    <template #title>
                        <el-icon><Grid /></el-icon>
                        <span>产品设备管理</span>
                    </template>
                    <el-menu-item index="/bom"><el-icon><Aim /></el-icon>产品管理</el-menu-item>
                    <el-menu-item index="/equipment"><el-icon><Tools /></el-icon>设备管理</el-menu-item>
                </el-sub-menu>

                <el-sub-menu index="/management">
                    <template #title>
                        <el-icon><UserFilled /></el-icon>
                        <span>人员结构管理</span>
                    </template>
                    <el-menu-item index="/line"><el-icon><Guide /></el-icon>产线管理</el-menu-item>
                    <el-menu-item index="/team"><el-icon><User /></el-icon>班组管理</el-menu-item>
                    <el-menu-item index="/user"><el-icon><Avatar /></el-icon>员工管理</el-menu-item>
                </el-sub-menu>

                <el-sub-menu index="/production">
                    <template #title>
                        <el-icon><Filter /></el-icon>
                        <span>工艺流程管理</span>
                    </template>
                    <el-menu-item index="/flows"><el-icon><HelpFilled /></el-icon>工艺流程管理</el-menu-item>
                    <el-menu-item index="/process"><el-icon><Histogram /></el-icon>工序管理</el-menu-item>
                    <el-menu-item index="/step"><el-icon><Brush /></el-icon>工步管理</el-menu-item>
                    </el-sub-menu>
            </el-menu>
        </el-aside>
        <el-main>
            <router-view />
        </el-main>
      </el-container>

    </el-container>
  </div>
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