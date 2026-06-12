import { defineStore } from 'pinia'
import {
  getPermissionsByRoleIdApi,
  getRolesByPermissionIdApi,
  assignPermissionsApi,
  removePermissionsApi
} from '@/api/rolePermission'

/**
 * 角色-权限关联 Store
 * 管理角色与权限的分配关系
 */
export const useRolePermissionStore = defineStore('rolePermission', () => {
  // 查询角色拥有的权限（返回权限数组）
  const getPermissionsByRoleId = async (roleId) => {
    const result = await getPermissionsByRoleIdApi(roleId)
    if (result.code === 200) {
      return result.data
    }
    return []
  }

  // 查询拥有该权限的角色
  const getRolesByPermissionId = async (permissionId) => {
    const result = await getRolesByPermissionIdApi(permissionId)
    if (result.code === 200) {
      return result.data
    }
    return []
  }

  // 为角色分配权限（支持批量）
  const assignPermissions = async (data) => {
    const result = await assignPermissionsApi(data)
    return result
  }

  // 移除角色权限
  const removePermissions = async (params) => {
    const result = await removePermissionsApi(params)
    return result
  }

  return {
    getPermissionsByRoleId,
    getRolesByPermissionId,
    assignPermissions,
    removePermissions
  }
})
