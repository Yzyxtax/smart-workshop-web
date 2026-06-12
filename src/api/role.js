import request from '@/utils/request'

/**
 * 角色管理 API
 *
 * 对应后端接口：
 * - GET    /role            查询角色列表（支持 roleName 模糊搜索 + 分页）
 * - GET    /role/{id}       查询角色详情
 * - POST   /role            新增角色
 * - PUT    /role            修改角色
 * - DELETE /role            删除角色（?ids=1,2,3）
 */

// 查询角色列表（GET /role?roleName=&page=&pageSize=）
export const getRoleListApi = (params = {}) =>
  request.get('/role', { params })

// 查询角色详情（GET /role/{id}）
export const getRoleByIdApi = (id) =>
  request.get(`/role/${id}`)

// 新增角色（POST /role）
export const addRoleApi = (data) =>
  request.post('/role', data)

// 修改角色（PUT /role）
export const updateRoleApi = (data) =>
  request.put('/role', data)

// 删除角色 — 支持单个或批量（DELETE /role?ids=1,2,3）
export const deleteRolesApi = (ids) =>
  request.delete('/role', { params: { ids } })
