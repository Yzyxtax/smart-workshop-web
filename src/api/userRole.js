import request from '@/utils/request'

/**
 * 用户-角色关联 API
 *
 * 对应后端接口：
 * - GET    /user-role/user/{userId}    查询用户拥有角色
 * - GET    /user-role/role/{roleId}    查询角色下用户
 * - POST   /user-role                  批量分配角色给用户
 * - DELETE /user-role                  移除用户角色
 */

// 查询用户拥有的角色（GET /user-role/user/{userId}）
export const getRolesByUserIdApi = (userId) =>
  request.get(`/user-role/user/${userId}`)

// 查询角色下的用户（GET /user-role/role/{roleId}）
export const getUsersByRoleIdApi = (roleId) =>
  request.get(`/user-role/role/${roleId}`)

// 为用户分配角色 — 支持批量（POST /user-role）
export const assignRolesApi = (data) =>
  request.post('/user-role', data)

// 移除用户角色（DELETE /user-role?userId=&roleIds=1,2）
export const removeRolesApi = (params) =>
  request.delete('/user-role', { params })
