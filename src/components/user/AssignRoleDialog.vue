<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserRoleStore } from '@/stores/userRole'
import { useRoleStore } from '@/stores/role'

const props = defineProps({
  visible: { type: Boolean, default: false },
  userId: { type: Number, default: null },
  userName: { type: String, default: '' }
})

const emit = defineEmits(['update:visible', 'saved'])

const userRoleStore = useUserRoleStore()
const roleStore = useRoleStore()

// 全部角色列表
const allRoles = ref([])
// 复选框选中状态 { [roleId]: boolean }
const checkedRoles = ref({})
// 原始选中状态（用于对比变更）
const originalChecked = ref({})
// 加载中
const loading = ref(false)
// 提交中
const submitting = ref(false)

// 打开时加载数据
watch(() => props.visible, async (val) => {
  if (val && props.userId) {
    loading.value = true
    try {
      // 并行加载全部角色 + 用户已分配角色
      await roleStore.loadRoles()
      const userRoles = await userRoleStore.getRolesByUserId(props.userId)
      const assignedIds = new Set((userRoles || []).map(r => r.id))

      allRoles.value = [...roleStore.roleList]
      const checked = {}
      allRoles.value.forEach(r => {
        checked[r.id] = assignedIds.has(r.id)
      })
      checkedRoles.value = { ...checked }
      originalChecked.value = { ...checked }
    } catch (e) {
      ElMessage.error('加载角色数据失败')
    } finally {
      loading.value = false
    }
  }
})

// 单个角色勾选切换
const toggleRole = (roleId) => {
  checkedRoles.value[roleId] = !checkedRoles.value[roleId]
}

// 保存
const handleSave = async () => {
  submitting.value = true
  try {
    const toAdd = []
    const toRemove = []
    for (const roleId of Object.keys(checkedRoles.value)) {
      const wasChecked = originalChecked.value[roleId]
      const isChecked = checkedRoles.value[roleId]
      if (wasChecked && !isChecked) {
        toRemove.push(Number(roleId))
      } else if (!wasChecked && isChecked) {
        toAdd.push(Number(roleId))
      }
    }

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

    ElMessage.success('分配成功')
    emit('update:visible', false)
    emit('saved')
  } catch (e) {
    ElMessage.error('分配失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="`为「${userName}」分配角色`"
    width="450px"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <div v-loading="loading" style="min-height: 120px;">
      <p class="hint-text">勾选要分配的角色，取消勾选即移除</p>
      <div class="role-check-list">
        <el-checkbox
          v-for="role in allRoles"
          :key="role.id"
          :model-value="checkedRoles[role.id]"
          @change="toggleRole(role.id)"
        >
          <b>{{ role.roleName ?? role.role_name }}</b>
          <span class="role-code">{{ role.roleCode ?? role.role_code }}</span>
        </el-checkbox>
      </div>
    </div>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSave">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.hint-text {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}
.role-check-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.role-code {
  font-size: 11px;
  color: #909399;
  margin-left: 6px;
}
</style>
