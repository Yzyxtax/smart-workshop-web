import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  getPermissionListApi,
  getPermissionByIdApi,
  getPermissionsGroupedApi
} from '@/api/permission'

/**
 * 权限管理 Store
 * 管理权限列表的加载（只读）
 */
export const usePermissionStore = defineStore('permission', () => {
  // state — 权限列表
  const permissionList = ref([])
  // 按模块分组的权限
  const groupedPermissions = ref({})

  // 加载权限列表（支持按模块筛选）
  const loadPermissions = async (module) => {
    const result = await getPermissionListApi(module)
    if (result.code === 200) {
      permissionList.value = result.data.rows ?? result.data
    }
  }

  // 加载全部分组权限（用于 Accordion 选择器）
  const loadGrouped = async () => {
    const result = await getPermissionsGroupedApi()
    if (result.code === 200) {
      groupedPermissions.value = result.data
    }
  }

  // 按 ID 查询权限详情
  const getPermissionById = async (id) => {
    const result = await getPermissionByIdApi(id)
    if (result.code === 200) {
      return result.data
    }
    return null
  }

  return {
    permissionList,
    groupedPermissions,
    loadPermissions,
    loadGrouped,
    getPermissionById
  }
})
