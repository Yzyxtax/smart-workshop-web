<template>
    <div class="page">
        <h1 class="page-title">班组管理</h1>
    </div>
    <el-container class="main-container">
        <el-aside class="sidebar">
            <!-- 标题、按钮区域 -->
            <div class="header-actions">
                <h2 class="list-title">班组列表</h2>
                <div class="action-buttons">
                    <el-button type="primary" @click="handleAdd" size="small">添加</el-button>
                    <el-button type="warning" @click="handleUpdate" size="small">修改</el-button>
                    <el-button type="danger" @click="handleDelete" size="small">删除</el-button>
                </div>
            </div>
            <!-- 导航栏区域 -->
            <el-menu class="menu-list" :default-active="activeMenu" @select="handleMenuSelect">
                <el-menu-item v-for="item in menuItems" :key="item.index" :index="item.index">
                    {{ item.label }}
                </el-menu-item>
            </el-menu>
        </el-aside>
        <el-main class="content-main">
            <el-container>
                <el-header class="content-header">Header</el-header>
                <el-main class="content-body">Main</el-main>
            </el-container>
        </el-main>
    </el-container>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

const activeMenu = ref('');
// 示例数据
const menuItems = ref([
    { index: '1', label: '班组A' },
    { index: '2', label: '班组B' },
    { index: '3', label: '班组C' },
    { index: '4', label: '班组D' },
    { index: '5', label: '班组E' },
    { index: '6', label: '班组F' },
    { index: '7', label: '班组G' },
    { index: '8', label: '班组H' },
    { index: '9', label: '班组I' },
    { index: '10', label: '班组J' },
]);

const handleAdd = () => {
    console.log('添加班组');
    ElMessage.success('点击了添加');
};
const handleDelete = () => {
    console.log('删除班组');
    ElMessage.warning('点击了删除');
};
const handleUpdate = () => {
    console.log('修改班组');
    ElMessage.warning('点击了修改');
};
const handleMenuSelect = (index) => {
    activeMenu.value = index;
    console.log('选择了:', index);
    ElMessage.info(`选择了班组 ${index}`);
};
</script>

<style scoped>
.main-container {
    height: calc(100vh - 60px);
    /* 减去顶部标题的高度 */
    margin-top: 20px;
    /* 与顶部标题保持间距 */
}

.sidebar {
    background-color: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
    padding: 10px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
}

.header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--el-border-color-light);
}

.list-title {
    margin: 0;
    font-size: 16px;
    font-weight: bold;
    color: var(--el-text-color-primary);
}

.action-buttons .el-button {
    margin-left: 10px;
}

.menu-list {
    flex: 1;
    /* 占据剩余空间 */
    height: 0;
    /* 结合flex: 1，使内容区域高度计算生效 */
    overflow-y: auto;
    /* 内容超出时显示垂直滚动条 */
    border-right: none;
    /* 去掉右侧边框，保持整洁 */
}

/* 可选：自定义滚动条样式 */
.menu-list::-webkit-scrollbar {
    width: 6px;
}

.menu-list::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.menu-list::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.menu-list::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

.content-main {
    background-color: var(--el-bg-color-page);
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
    margin-left: 20px;
    /* 与侧边栏保持间距 */
}

.content-header {
    background-color: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-light);
    line-height: 48px;
    /* Element Plus 默认头部高度 */
    padding: 0 20px;
}

.content-body {
    background-color: var(--el-fill-color-blank);
    padding: 20px;
}
</style>