import request from "@/utils/request";

//查询某一计划的所有订单信息
export const getOrderByPlan = (planNo) => request.get(`order/${planNo}`)

//查询所有订单信息
export const getAllOrder = () => request.get('/order')

//新增订单信息
export const addOrderApi = (data) => request.post('order', data)

//删除订单信息
export const deleteOrderApi = (orderNo) => request.delete(`order/${orderNo}`)

//修改订单信息
export const updateOrderApi = (data, orderNo) => request.put(`order/${orderNo}`, data)

//更改订单状态
export const updateOrderStateApi = (orderNo, action, userId) => request.post(`order/${orderNo}/actions/${action}?userId=${userId}`)