<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoleStore } from '@/stores/role'
import RoleFormDialog from '@/components/role/RoleFormDialog.vue'
import RolePermissionDialog from '@/components/role/RolePermissionDialog.vue'

const roleStore = useRoleStore()
const { roleList, total } = roleStore

// 搜索表单
const searchName = ref('')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 多选
const multipleSelection = ref([])

// 表单弹窗状态
const dialogVisible = ref(false)
const currentRole = ref(null)

// 权限分配弹窗状态（用于 Task 6 RolePermissionDialog）
const permDialogVisible = ref(false)
const permRoleId = ref(null)
const permRoleName = ref('')

// 加载状态
const loading = ref(false)
const loadError = ref(false)

// 加载数据
const loadData = async () => {
  loading.value = true
  loadError.value = false
  try {
    await roleStore.loadRoles({
      roleName: searchName.value,
      page: currentPage.value,
      pageSize: pageSize.value
    })
  } catch (e) {
    loadError.value = true
    ElMessage.error('加载角色列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 清空
const handleClear = () => {
  searchName.value = ''
  handleSearch()
}

// 分页
const handleSizeChange = () => loadData()
const handleCurrentChange = () => loadData()

// 多选变更
const handleSelectionChange = (selection) => {
  multipleSelection.value = selection.map(item => item.id)
}

// 新增
const handleAdd = () => {
  currentRole.value = null
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  currentRole.value = row
  dialogVisible.value = true
}

// 保存（由 RoleFormDialog emit 触发）
const handleSaved = async (formData) => {
  if (currentRole.value && currentRole.value.id) {
    // 编辑
    const result = await roleStore.updateRole({
      id: currentRole.value.id,
      ...formData,
      roleCode: currentRole.value.roleCode ?? currentRole.value.role_code
    })
    if (result.code === 200) {
      ElMessage.success('更新成功')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error('更新失败：' + (result.message || '未知错误'))
    }
  } else {
    // 新增
    const result = await roleStore.addRole(formData)
    if (result.code === 200) {
      ElMessage.success('创建成功')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error('创建失败：' + (result.message || '未知错误'))
    }
  }
}

// 单个删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确认删除角色「${row.roleName ?? row.role_name}」？删除后该角色下所有用户的权限将被移除。此操作不可恢复。`,
    '警告',
    { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    const result = await roleStore.deleteRoles(row.id)
    if (result.code === 200) {
      ElMessage.success('删除成功')
      loadData()
    } else {
      ElMessage.error('删除失败：' + (result.message || '未知错误'))
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 批量删除
const handleBatchDelete = async () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择要删除的角色')
    return
  }
  ElMessageBox.confirm(
    `确认删除选中的 ${multipleSelection.value.length} 个角色？删除后关联的权限分配将自动清理。`,
    '警告',
    { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    const result = await roleStore.deleteRoles(multipleSelection.value)
    if (result.code === 200) {
      ElMessage.success('删除成功')
      loadData()
    } else {
      ElMessage.error('删除失败：' + (result.message || '未知错误'))
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 打开权限分配弹窗（用于 Task 6 RolePermissionDialog）
const handleAssignPermission = (row) => {
  permRoleId.value = row.id
  permRoleName.value = row.roleName ?? row.role_name
  permDialogVisible.value = true
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>角色管理</h1>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="{ searchName }">
        <el-form-item label="角色名称">
          <el-input v-model="searchName" placeholder="请输入角色名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button type="info" @click="handleClear">清空</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button type="primary" @click="handleAdd">+ 新增角色</el-button>
      <el-button type="danger" @click="handleBatchDelete">- 批量删除</el-button>
    </div>

    <!-- 表格 -->
    <div class="table-container">
      <el-table
        :data="roleList"
        border
        style="width: 100%"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="roleCode" label="角色编码" min-width="180" />
        <el-table-column prop="roleName" label="角色名称" width="140" />
        <el-table-column prop="description" label="描述" min-width="240" show-overflow-tooltip />
        <el-table-column label="权限数量" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain" round>
              {{ row.permissionCount ?? 0 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" align="center">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleAssignPermission(row)">
              🔑 分配权限
            </el-button>
            <el-button type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty v-if="roleList.length === 0" description="暂无角色数据">
        <el-button type="primary" @click="handleAdd">新增角色</el-button>
      </el-empty>

      <!-- 错误状态 -->
      <div v-if="loadError" class="error-state">
        <el-result icon="error" title="加载失败" sub-title="网络或服务异常，请稍后重试">
          <template #extra>
            <el-button type="primary" @click="loadData">重试</el-button>
          </template>
        </el-result>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[5, 10, 20, 50]"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <RoleFormDialog
      v-model:visible="dialogVisible"
      :role="currentRole"
      @saved="handleSaved"
    />

    <!-- 分配权限弹窗 -->
    <RolePermissionDialog
      v-model:visible="permDialogVisible"
      :role-id="permRoleId"
      :role-name="permRoleName"
      @saved="loadData"
    />
  </div>
</template>

<style scoped>
.search-bar, .action-bar, .table-container {
  margin: 16px 0;
}
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.error-state {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
</style>
