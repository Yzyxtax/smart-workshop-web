import request from '@/utils/request'

/**
 * 角色-权限关联 API
 *
 * 对应后端接口：
 * - GET    /role-permission/role/{roleId}           查询角色拥有的权限
 * - GET    /role-permission/permission/{permId}     查询拥有该权限的角色
 * - POST   /role-permission                         为角色分配权限（批量）
 * - DELETE /role-permission                         移除角色权限
 */

// 查询角色拥有的权限（GET /role-permission/role/{roleId}）
export const getPermissionsByRoleIdApi = (roleId) =>
  request.get(`/role-permission/role/${roleId}`)

// 查询拥有该权限的角色（GET /role-permission/permission/{permissionId}）
export const getRolesByPermissionIdApi = (permissionId) =>
  request.get(`/role-permission/permission/${permissionId}`)

// 为角色分配权限 — 支持批量（POST /role-permission）
export const assignPermissionsApi = (data) =>
  request.post('/role-permission', data)

// 移除角色权限（DELETE /role-permission?roleId=&permissionIds=1,2）
export const removePermissionsApi = (params) =>
  request.delete('/role-permission', { params })
