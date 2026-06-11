// src/api/workOrder.js
import request from "@/utils/request";

// 查询所有工单（GET /workOrder）
export const getWorkOrderListApi = () => request.get('/workOrder')

// 按工单编号查询（GET /workOrder/{workOrderNo}）
export const getWorkOrderByNoApi = (workOrderNo) =>
  request.get(`/workOrder/${workOrderNo}`)

// 按订单编号查询工单列表（GET /workOrder/order/{orderNo}）
export const getWorkOrdersByOrderApi = (orderNo) =>
  request.get(`/workOrder/order/${orderNo}`)

// 按人员查询工单列表（GET /workOrder/user/{userId}）
export const getWorkOrdersByUserApi = (userId) =>
  request.get(`/workOrder/user/${userId}`)

// 按工序查询工单列表（GET /workOrder/process/{processId}）
export const getWorkOrdersByProcessApi = (processId) =>
  request.get(`/workOrder/process/${processId}`)

// 新增工单（POST /workOrder）
export const addWorkOrderApi = (data) => request.post('/workOrder', data)

// 修改工单（PUT /workOrder/{workOrderNo}）
export const updateWorkOrderApi = (workOrderNo, data) =>
  request.put(`/workOrder/${workOrderNo}`, data)

// 删除工单（DELETE /workOrder/{workOrderNo}）
export const deleteWorkOrderApi = (workOrderNo) =>
  request.delete(`/workOrder/${workOrderNo}`)

// 执行状态动作（POST /workOrder/{workOrderNo}/actions/{action}）
// START_WORK/FINISH_WORK/PAUSE/RESUME/TERMINATE 可通过 API 调用
export const executeWorkOrderActionApi = (workOrderNo, action) =>
  request.post(`/workOrder/${workOrderNo}/actions/${action}`)
