import request from "@/utils/request";

//查询工单信息
export const getWorkOrderByOrderApi = (orderNo) => request.get(`/workOrder/${orderNo}`)

//添加工单
export const addWorkOrderApi = (data) => request.post('/workOrder', data)

//修改工单信息
export const updateWorkOrderApi = (data, workOrderNo) => request.put(`/workOrder/${workOrderNo}`, data)

//删除工单信息
export const deleteWorkOrderApi = (workOrderNo) => request.delete(`/workOrder/${workOrderNo}`)

//更改工单状态
export const updateWorkOrderStateApi = (workOrderNo, action, userId) => request.post(`/workOrder/${workOrderNo}/actions/${action}?userId=${userId}`)