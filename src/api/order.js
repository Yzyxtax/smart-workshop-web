// src/api/order.js
import request from "@/utils/request";

// 查询所有订单（GET /order）
export const getOrderListApi = () => request.get('/order')

// 按订单编号查询（GET /order/{orderNo}）
export const getOrderByNoApi = (orderNo) => request.get(`/order/${orderNo}`)

// 按计划编号查询订单列表（GET /order/plan/{planNo}）
export const getOrdersByPlanApi = (planNo) => request.get(`/order/plan/${planNo}`)

// 新增订单（POST /order）
export const addOrderApi = (data) => request.post('/order', data)

// 修改订单（PUT /order/{orderNo}）
export const updateOrderApi = (orderNo, data) => request.put(`/order/${orderNo}`, data)

// 删除订单（DELETE /order/{orderNo}）
export const deleteOrderApi = (orderNo) => request.delete(`/order/${orderNo}`)

// 执行状态动作（POST /order/{orderNo}/actions/{action}）
// 仅 PAUSE/RESUME/TERMINATE 可通过 API 调用
export const executeOrderActionApi = (orderNo, action) =>
  request.post(`/order/${orderNo}/actions/${action}`)

// 查询订单下的工单（GET /order/{orderNo}/workOrders）
export const getWorkOrdersByOrderApi = (orderNo) =>
  request.get(`/order/${orderNo}/workOrders`)
