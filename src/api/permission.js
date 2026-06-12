import request from '@/utils/request'

/**
 * 权限管理 API（只读）
 *
 * 对应后端接口：
 * - GET /permission          查询权限列表（支持 module 筛选）
 * - GET /permission/{id}     查询权限详情
 * - GET /permission/grouped   按模块分组查询全部权限
 */

// 查询权限列表（GET /permission?module=）
export const getPermissionListApi = (module) =>
  request.get('/permission', { params: { module } })

// 查询权限详情（GET /permission/{id}）
export const getPermissionByIdApi = (id) =>
  request.get(`/permission/${id}`)

// 按模块分组查询全部权限（GET /permission/grouped）
export const getPermissionsGroupedApi = () =>
  request.get('/permission/grouped')
