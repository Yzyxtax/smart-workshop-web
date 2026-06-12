import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  getRoleListApi,
  getRoleByIdApi,
  addRoleApi,
  updateRoleApi,
  deleteRolesApi
} from '@/api/role'

/**
 * 角色管理 Store
 * 管理角色列表的加载、本地 CRUD 操作
 */
export const useRoleStore = defineStore('role', () => {
  // state — 角色列表
  const roleList = ref([])
  // 分页总数
  const total = ref(0)

  // 加载角色列表（支持分页 + 模糊搜索）
  const loadRoles = async (params = {}) => {
    const result = await getRoleListApi(params)
    if (result.code === 200) {
      roleList.value = result.data.rows ?? result.data
      total.value = result.data.total ?? 0
    }
  }

  // 按 ID 查询角色详情
  const getRoleById = async (id) => {
    const result = await getRoleByIdApi(id)
    if (result.code === 200) {
      return result.data
    }
    return null
  }

  // 新增角色 — 调用 API 后本地追加
  const addRole = async (data) => {
    const result = await addRoleApi(data)
    if (result.code === 200) {
      if (result.data) {
        roleList.value.push(result.data)
      }
      return result
    }
    return result
  }

  // 更新角色 — 调用 API 后本地替换
  const updateRole = async (data) => {
    const result = await updateRoleApi(data)
    if (result.code === 200) {
      if (result.data) {
        const index = roleList.value.findIndex(r => r.id === result.data.id)
        if (index !== -1) {
          roleList.value[index] = result.data
        }
      }
      return result
    }
    return result
  }

  // 删除角色 — 调用 API 后本地移除
  const deleteRoles = async (ids) => {
    const result = await deleteRolesApi(ids)
    if (result.code === 200) {
      const idArray = Array.isArray(ids) ? ids : [ids]
      roleList.value = roleList.value.filter(r => !idArray.includes(r.id))
      return result
    }
    return result
  }

  return {
    roleList,
    total,
    loadRoles,
    getRoleById,
    addRole,
    updateRole,
    deleteRoles
  }
})
