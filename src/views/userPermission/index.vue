<script setup>
import { ref, onMounted } from 'vue'
import { queryPageApi as queryUserPage } from '@/api/emp'
import UserRolePanel from '@/components/userPermission/UserRolePanel.vue'

// 左栏 — 用户搜索
const searchKeyword = ref('')

// 用户列表
const userList = ref([])
const userTotal = ref(0)
const userPage = ref(1)
const userPageSize = ref(10)
const userLoading = ref(false)

// 当前选中用户
const selectedUser = ref(null)

// 加载用户列表
const loadUsers = async () => {
  userLoading.value = true
  try {
    const result = await queryUserPage(
      searchKeyword.value, '', // name, position
      '', '', // begin, end
      userPage.value, userPageSize.value
    )
    if (result.code === 200) {
      userList.value = result.data.rows ?? result.data
      userTotal.value = result.data.total ?? 0
    }
  } catch (e) {
    // handled by request interceptor
  } finally {
    userLoading.value = false
  }
}

onMounted(() => {
  loadUsers()
})

// 搜索
const handleSearch = () => {
  userPage.value = 1
  loadUsers()
}

// 清空
const handleClear = () => {
  searchKeyword.value = ''
  handleSearch()
}

// 选中用户
const handleSelectUser = (user) => {
  selectedUser.value = user
}

// 分页
const handleUserPageChange = () => {
  loadUsers()
}

// 子组件刷新（保存后更新角色计数）
const handleRefresh = () => {
  loadUsers()
}
</script>

<template>
  <div class="page user-permission-page">
    <div class="page-header">
      <h1>用户权限分配</h1>
    </div>

    <div class="split-layout">
      <!-- 左侧：用户列表 -->
      <div class="left-panel">
        <div class="left-panel-header">
          <el-input
            v-model="searchKeyword"
            placeholder="🔍 搜索用户名或姓名"
            clearable
            @keyup.enter="handleSearch"
          />
          <div class="search-actions">
            <el-button type="primary" size="small" @click="handleSearch">查询</el-button>
            <el-button size="small" @click="handleClear">清空</el-button>
          </div>
        </div>

        <div class="user-list" v-loading="userLoading">
          <div
            v-for="user in userList"
            :key="user.id"
            class="user-item"
            :class="{ active: selectedUser?.id === user.id }"
            @click="handleSelectUser(user)"
          >
            <div class="user-name">{{ user.name }}</div>
            <div class="user-sub">
              {{ user.userName ?? user.username }}<template v-if="user.position"> · {{ user.position }}</template>
              <span class="role-count">{{ user.roleCount ?? 0 }}个角色</span>
            </div>
          </div>
          <el-empty v-if="!userLoading && userList.length === 0" description="暂无用户数据" :image-size="40" />
        </div>

        <div class="left-panel-footer">
          <span class="total-text">共 {{ userTotal }} 个用户</span>
          <el-pagination
            small
            layout="prev, pager, next"
            :total="userTotal"
            :page-size="userPageSize"
            v-model:current-page="userPage"
            @current-change="handleUserPageChange"
          />
        </div>
      </div>

      <!-- 右侧：角色分配面板 -->
      <div class="right-panel">
        <UserRolePanel
          :user-id="selectedUser?.id"
          :user-name="selectedUser?.name"
          :user-info="selectedUser"
          @refresh="handleRefresh"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-permission-page {
  height: calc(100vh - 160px);
  display: flex;
  flex-direction: column;
}
.split-layout {
  display: flex;
  flex: 1;
  gap: 0;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
}
.left-panel {
  width: 320px;
  min-width: 320px;
  border-right: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}
.left-panel-header {
  padding: 12px;
  background: #fff;
  border-bottom: 1px solid #dcdfe6;
}
.search-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.user-list {
  flex: 1;
  overflow-y: auto;
}
.user-item {
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}
.user-item:hover {
  background: #f5f7fa;
}
.user-item.active {
  background: #ecf5ff;
  border-left-color: #409eff;
}
.user-name {
  font-weight: 600;
  font-size: 14px;
}
.user-sub {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
.role-count {
  margin-left: 8px;
  color: #409eff;
  font-size: 11px;
}
.left-panel-footer {
  padding: 8px 12px;
  border-top: 1px solid #dcdfe6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.total-text {
  font-size: 12px;
  color: #909399;
}
.right-panel {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>
