import { defineStore } from 'pinia'
import {
  getRolesByUserIdApi,
  getUsersByRoleIdApi,
  assignRolesApi,
  removeRolesApi
} from '@/api/userRole'

/**
 * 用户-角色关联 Store
 * 管理用户与角色的分配关系
 */
export const useUserRoleStore = defineStore('userRole', () => {
  // 查询用户拥有的角色（返回角色数组）
  const getRolesByUserId = async (userId) => {
    const result = await getRolesByUserIdApi(userId)
    if (result.code === 200) {
      return result.data
    }
    return []
  }

  // 查询角色下的用户
  const getUsersByRoleId = async (roleId) => {
    const result = await getUsersByRoleIdApi(roleId)
    if (result.code === 200) {
      return result.data
    }
    return []
  }

  // 为用户分配角色（支持批量）
  const assignRoles = async (data) => {
    const result = await assignRolesApi(data)
    return result
  }

  // 移除用户角色
  const removeRoles = async (params) => {
    const result = await removeRolesApi(params)
    return result
  }

  return {
    getRolesByUserId,
    getUsersByRoleId,
    assignRoles,
    removeRoles
  }
})
