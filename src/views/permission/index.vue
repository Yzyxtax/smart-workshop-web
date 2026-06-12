<script setup>
import { ref, onMounted } from 'vue'
import { usePermissionStore } from '@/stores/permission'

const permissionStore = usePermissionStore()
const { permissionList } = permissionStore

// 模块筛选下拉选项
const moduleOptions = [
  { value: '', label: '全部模块' },
  { value: 'SYS', label: 'SYS - 系统管理' },
  { value: 'PLAN', label: 'PLAN - 生产计划' },
  { value: 'ORDER', label: 'ORDER - 订单管理' },
  { value: 'WORKORDER', label: 'WORKORDER - 工单管理' },
  { value: 'EQU', label: 'EQU - 设备管理' },
  { value: 'BOM', label: 'BOM - 物料清单' },
  { value: 'PROC', label: 'PROC - 工序管理' }
]

// 当前筛选模块
const selectedModule = ref('')
// 加载中
const loading = ref(false)
const loadError = ref(false)
// 总记录数
const total = ref(0)
// 详情弹窗
const detailVisible = ref(false)
const detailData = ref({})

// 加载数据
const loadData = async () => {
  loading.value = true
  loadError.value = false
  try {
    const moduleParam = selectedModule.value || undefined
    await permissionStore.loadPermissions(moduleParam)
    total.value = permissionList.value.length
  } catch (e) {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

// 查询
const handleSearch = () => {
  loadData()
}

// 清空
const handleClear = () => {
  selectedModule.value = ''
  handleSearch()
}

// 查看详情
const handleDetail = async (row) => {
  const detail = await permissionStore.getPermissionById(row.id)
  if (detail) {
    detailData.value = detail
    detailVisible.value = true
  }
}

// 模块标签颜色
const getModuleTagType = (module) => {
  const colors = {
    SYS: 'primary',
    PLAN: 'success',
    ORDER: 'warning',
    WORKORDER: 'info',
    EQU: '',
    BOM: 'success',
    PROC: ''
  }
  return colors[module] || 'info'
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>权限管理</h1>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true">
        <el-form-item label="所属模块">
          <el-select v-model="selectedModule" placeholder="全部模块" clearable style="width: 200px;">
            <el-option
              v-for="opt in moduleOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button type="info" @click="handleClear">清空</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格 -->
    <div class="table-container">
      <el-table
        :data="permissionList"
        border
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="permissionCode" label="权限编码" min-width="180" />
        <el-table-column prop="permissionName" label="权限名称" width="140" />
        <el-table-column label="所属模块" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getModuleTagType(row.module)" size="small">
              {{ row.module }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="240" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty v-if="!loading && permissionList.length === 0" description="该模块下暂无权限数据" />

      <!-- 错误状态 -->
      <div v-if="loadError" class="error-state">
        <el-result icon="error" title="加载失败" sub-title="网络或服务异常，请稍后重试">
          <template #extra>
            <el-button type="primary" @click="loadData">重试</el-button>
          </template>
        </el-result>
      </div>
    </div>

    <!-- 底部统计 -->
    <div class="table-footer">
      <span>共 {{ total }} 条</span>
    </div>

    <!-- 警告横幅 -->
    <el-alert
      title="权限编码由开发预定义，不提供运行时增删改。如需新增权限，请修改数据库初始化脚本。"
      type="warning"
      :closable="false"
      show-icon
      style="margin-top: 16px;"
    />

    <!-- 详情弹窗（只读） -->
    <el-dialog v-model="detailVisible" title="权限详情" width="500px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="权限编码">{{ detailData.permissionCode ?? detailData.permission_code }}</el-descriptions-item>
        <el-descriptions-item label="权限名称">{{ detailData.permissionName ?? detailData.permission_name }}</el-descriptions-item>
        <el-descriptions-item label="所属模块">{{ detailData.module }}</el-descriptions-item>
        <el-descriptions-item label="描述">{{ detailData.description }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailData.createdAt ?? detailData.created_at }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.search-bar, .table-container {
  margin: 16px 0;
}
.table-footer {
  display: flex;
  justify-content: flex-end;
  padding: 8px 0;
  font-size: 13px;
  color: #909399;
}
.error-state {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
</style>
