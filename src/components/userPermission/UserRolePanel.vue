<template>
  <div class="user-role-panel" v-loading="loading">
    <!-- 未选择用户 -->
    <div v-if="!userId" class="empty-hint">
      <el-empty description="请在左侧选择一个用户" />
    </div>

    <!-- 用户信息 + 角色分配 -->
    <template v-else>
      <!-- 用户信息头 -->
      <div class="user-info-header">
        <h3>👤 {{ userName }}</h3>
        <p class="user-meta">
          {{ userInfo.userName ?? userInfo.username ?? '' }}
          <template v-if="userInfo.position"> · {{ userInfo.position }}</template>
        </p>
      </div>

      <!-- 已分配角色 -->
      <div class="section">
        <h4>✅ 已分配角色（点击 ✕ 移除）</h4>
        <div class="role-tags" v-if="assignedRoles.length > 0">
          <el-tag
            v-for="role in assignedRoles"
            :key="role.id"
            closable
            type="success"
            effect="plain"
            size="large"
            @close="handleRemove(role)"
          >
            {{ role.roleName ?? role.role_name }}
            <span style="color:#909399;font-size:11px;">
              ({{ role.roleCode ?? role.role_code }})
            </span>
          </el-tag>
        </div>
        <el-empty v-else description="该用户暂无角色" :image-size="40" />
      </div>

      <el-divider />

      <!-- 分配新角色 -->
      <div class="section">
        <h4>➕ 分配新角色</h4>
        <div class="add-role-area">
          <el-select
            v-model="selectedToAdd"
            multiple
            placeholder="请选择角色"
            style="flex: 1;"
            :disabled="availableRoles.length === 0"
          >
            <el-option
              v-for="role in availableRoles"
              :key="role.id"
              :label="`${role.roleName ?? role.role_name} (${role.roleCode ?? role.role_code})`"
              :value="role.id"
            />
          </el-select>
          <el-button type="primary" @click="handleAdd" :disabled="selectedToAdd.length === 0">
            添加所选 →
          </el-button>
        </div>
        <p class="hint" v-if="availableRoles.length === 0">所有角色已分配</p>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="success" :loading="saving" @click="handleSave">
          💾 保存分配
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserRoleStore } from '@/stores/userRole'
import { useRoleStore } from '@/stores/role'

const props = defineProps({
  userId: { type: Number, default: null },
  userName: { type: String, default: '' },
  userInfo: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['refresh'])

const userRoleStore = useUserRoleStore()
const roleStore = useRoleStore()

// 已分配角色列表
const assignedRoles = ref([])
// 原始角色列表（用于重置）
const originalRoles = ref([])
// 所有可选角色
const allRoles = ref([])
// 多选列表当前选中的值
const selectedToAdd = ref([])
// 加载中
const loading = ref(false)
// 保存中
const saving = ref(false)

// 计算哪些角色未分配（可选列表）
const availableRoles = computed(() => {
  const assignedIds = new Set(assignedRoles.value.map(r => r.id))
  return allRoles.value.filter(r => !assignedIds.has(r.id))
})

// 监听用户切换
watch(() => props.userId, async (val) => {
  if (!val) {
    assignedRoles.value = []
    originalRoles.value = []
    selectedToAdd.value = []
    return
  }
  await loadUserRoles(val)
}, { immediate: true })

// 加载用户角色数据
const loadUserRoles = async (userId) => {
  loading.value = true
  try {
    // 并行加载用户角色 + 全部角色
    const [userRoles] = await Promise.all([
      userRoleStore.getRolesByUserId(userId),
      roleStore.loadRoles()
    ])

    assignedRoles.value = [...(userRoles || [])]
    originalRoles.value = [...(userRoles || [])]
    allRoles.value = [...(roleStore.roleList || [])]
    selectedToAdd.value = []
  } catch (e) {
    ElMessage.error('加载角色数据失败')
  } finally {
    loading.value = false
  }
}

// 移除已分配角色
const handleRemove = (role) => {
  assignedRoles.value = assignedRoles.value.filter(r => r.id !== role.id)
}

// 添加所选角色
const handleAdd = () => {
  if (selectedToAdd.value.length === 0) {
    ElMessage.warning('请先选择要添加的角色')
    return
  }
  const toAdd = allRoles.value.filter(r => selectedToAdd.value.includes(r.id))
  assignedRoles.value.push(...toAdd)
  selectedToAdd.value = []
}

// 保存
const handleSave = async () => {
  saving.value = true
  try {
    const originalIds = new Set(originalRoles.value.map(r => r.id))
    const currentIds = new Set(assignedRoles.value.map(r => r.id))

    // 新增的角色 ID
    const toAdd = [...currentIds].filter(id => !originalIds.has(id))
    // 移除的角色 ID
    const toRemove = [...originalIds].filter(id => !currentIds.has(id))

    if (toAdd.length > 0) {
      const result = await userRoleStore.assignRoles({
        userId: props.userId,
        roleIds: toAdd
      })
      if (result.code !== 200) {
        ElMessage.error('分配角色失败：' + (result.message || '未知错误'))
        return
      }
    }

    if (toRemove.length > 0) {
      const result = await userRoleStore.removeRoles({
        userId: props.userId,
        roleIds: toRemove.join(',')
      })
      if (result.code !== 200) {
        ElMessage.error('移除角色失败：' + (result.message || '未知错误'))
        return
      }
    }

    originalRoles.value = [...assignedRoles.value]
    ElMessage.success('保存分配成功')
    emit('refresh')
  } catch (e) {
    ElMessage.error('保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

// 重置
const handleReset = () => {
  assignedRoles.value = [...originalRoles.value]
  selectedToAdd.value = []
}
</script>

<style scoped>
.user-role-panel {
  min-height: 400px;
}
.user-info-header {
  margin-bottom: 20px;
}
.user-info-header h3 {
  margin: 0 0 4px 0;
}
.user-meta {
  font-size: 13px;
  color: #909399;
  margin: 0;
}
.section {
  margin: 12px 0;
}
.section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
}
.role-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.add-role-area {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.hint {
  font-size: 12px;
  color: #909399;
  margin: 8px 0 0 0;
}
.action-buttons {
  margin-top: 24px;
  display: flex;
  gap: 8px;
}
.empty-hint {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>
