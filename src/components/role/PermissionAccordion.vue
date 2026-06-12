<template>
  <div class="permission-accordion">
    <el-collapse v-model="activeModules">
      <el-collapse-item
        v-for="module in Object.keys(permissions)"
        :key="module"
        :name="module"
      >
        <template #title>
          <div class="module-header">
            <span>{{ moduleIcons[module] || '📦' }} {{ module }} — {{ moduleLabels[module] || module }}模块</span>
            <el-tag size="small" :type="getModuleCheckedCount(module) > 0 ? 'primary' : 'info'" effect="plain">
              已选 {{ getModuleCheckedCount(module) }}/{{ getModuleTotal(module) }}
            </el-tag>
          </div>
        </template>
        <div class="module-permissions">
          <el-checkbox
            v-for="perm in permissions[module]"
            :key="perm.id"
            :model-value="selected.includes(perm.id)"
            :label="`${perm.permissionCode ?? perm.permission_code} ${perm.permissionName ?? perm.permission_name}`"
            @change="togglePermission(perm.id)"
          />
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  permissions: { type: Object, default: () => ({}) },
  selectedIds: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:selectedIds'])

// 当前选中的权限 ID（内部维护）
const selected = ref([...props.selectedIds])

// 模块名称到中文映射
const moduleLabels = {
  SYS: '系统管理',
  PLAN: '生产计划',
  ORDER: '订单管理',
  WORKORDER: '工单管理',
  EQU: '设备管理',
  BOM: '物料清单',
  PROC: '工序管理'
}

// 模块 icon 映射
const moduleIcons = {
  SYS: '⚙️',
  PLAN: '📊',
  ORDER: '📦',
  WORKORDER: '📋',
  EQU: '🔧',
  BOM: '📐',
  PROC: '🏭'
}

// 计算每个模块的选中状态
const getModuleCheckedCount = (module) => {
  const perms = props.permissions[module] || []
  return perms.filter(p => selected.value.includes(p.id)).length
}

const getModuleTotal = (module) => {
  return (props.permissions[module] || []).length
}

// 监听外部 selectedIds 变化
watch(() => props.selectedIds, (newVal) => {
  selected.value = [...newVal]
}, { deep: true })

// 勾选/取消
const togglePermission = (permId) => {
  const idx = selected.value.indexOf(permId)
  if (idx > -1) {
    selected.value.splice(idx, 1)
  } else {
    selected.value.push(permId)
  }
  emit('update:selectedIds', [...selected.value])
}

// 全选/取消全选某个模块
const toggleModule = (module) => {
  const perms = props.permissions[module] || []
  const allIds = perms.map(p => p.id)
  const allSelected = allIds.every(id => selected.value.includes(id))

  if (allSelected) {
    // 取消全选：移除该模块所有 ID
    selected.value = selected.value.filter(id => !allIds.includes(id))
  } else {
    // 全选：添加该模块未选中的 ID
    const toAdd = allIds.filter(id => !selected.value.includes(id))
    selected.value.push(...toAdd)
  }
  emit('update:selectedIds', [...selected.value])
}

// 计算默认展开的模块 — 第一个有已选权限的，否则第一个
const defaultActive = computed(() => {
  const modules = Object.keys(props.permissions)
  if (modules.length === 0) return ''
  const firstWithSelection = modules.find(m => getModuleCheckedCount(m) > 0)
  return firstWithSelection || modules[0]
})

// 当前展开的模块
const activeModules = ref([defaultActive.value])

// 同步 defaultActive
watch(defaultActive, (val) => {
  if (val && !activeModules.value.includes(val)) {
    activeModules.value = [val]
  }
})
</script>

<style scoped>
.module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 12px;
}

.module-permissions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  padding: 8px 16px;
}
</style>
