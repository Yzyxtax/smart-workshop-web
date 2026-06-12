<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { usePermissionStore } from '@/stores/permission'
import { useRolePermissionStore } from '@/stores/rolePermission'
import PermissionAccordion from './PermissionAccordion.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  roleId: { type: Number, default: null },
  roleName: { type: String, default: '' }
})

const emit = defineEmits(['update:visible', 'saved'])

const permissionStore = usePermissionStore()
const rolePermissionStore = useRolePermissionStore()

const { groupedPermissions } = permissionStore

// 已选权限 ID 列表
const selectedIds = ref([])
// 原始选中（用于重置）
const originalIds = ref([])
// 提交中
const submitting = ref(false)
// 加载中
const loading = ref(false)

// 已选数量
const selectedCount = ref(0)

// 打开弹窗时加载数据
watch(() => props.visible, async (val) => {
  if (val && props.roleId) {
    loading.value = true
    try {
      // 并行加载全部分组权限 + 该角色已分配权限
      await permissionStore.loadGrouped()
      const assigned = await rolePermissionStore.getPermissionsByRoleId(props.roleId)
      const ids = (assigned || []).map(p => p.id ?? p.permissionId ?? p.permission_id)
      selectedIds.value = [...ids]
      originalIds.value = [...ids]
      selectedCount.value = ids.length
    } catch (e) {
      ElMessage.error('加载权限数据失败')
    } finally {
      loading.value = false
    }
  }
})

// 选中变更时更新计数
const handleSelectionChange = (ids) => {
  selectedIds.value = ids
  selectedCount.value = ids.length
}

// 保存
const handleSave = async () => {
  submitting.value = true
  try {
    const originalSet = new Set(originalIds.value)
    const currentSet = new Set(selectedIds.value)

    // 新增的权限 ID
    const toAdd = [...currentSet].filter(id => !originalSet.has(id))
    // 移除的权限 ID
    const toRemove = [...originalSet].filter(id => !currentSet.has(id))

    // 执行新增
    if (toAdd.length > 0) {
      const addResult = await rolePermissionStore.assignPermissions({
        roleId: props.roleId,
        permissionIds: toAdd
      })
      if (addResult.code !== 200) {
        ElMessage.error('分配权限失败：' + (addResult.message || '未知错误'))
        return
      }
    }

    // 执行移除
    if (toRemove.length > 0) {
      const removeResult = await rolePermissionStore.removePermissions({
        roleId: props.roleId,
        permissionIds: toRemove.join(',')
      })
      if (removeResult.code !== 200) {
        ElMessage.error('移除权限失败：' + (removeResult.message || '未知错误'))
        return
      }
    }

    ElMessage.success('权限分配成功')
    emit('update:visible', false)
    emit('saved')
  } catch (e) {
    ElMessage.error('权限分配失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// 取消
const handleCancel = () => {
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="`为「${roleName}」分配权限`"
    width="700px"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <div v-loading="loading" style="min-height: 200px;">
      <div class="dialog-header">
        <span class="selected-info">已选 {{ selectedCount }} 项权限</span>
      </div>
      <PermissionAccordion
        v-if="!loading && Object.keys(groupedPermissions).length > 0"
        :permissions="groupedPermissions"
        :selected-ids="selectedIds"
        @update:selected-ids="handleSelectionChange"
      />
      <el-empty v-if="!loading && Object.keys(groupedPermissions).length === 0" description="暂无权限数据" />
    </div>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSave">
        保存权限
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-header {
  margin-bottom: 12px;
}
.selected-info {
  font-size: 13px;
  color: #67c23a;
}
</style>
