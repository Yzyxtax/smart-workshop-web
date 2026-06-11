import request from "@/utils/request";

// 查询所有计划（GET /plan）
export const getPlanListApi = () => request.get('/plan')

// 新增计划（POST /plan）
export const addPlanApi = (data) => request.post('/plan', data)

// 修改计划（PUT /plan/{planNo}）
export const updatePlanApi = (planNo, data) => request.put(`/plan/${planNo}`, data)

// 删除计划（DELETE /plan/{planNo}）
export const deletePlanApi = (planNo) => request.delete(`/plan/${planNo}`)

// 执行状态动作（POST /plan/{planNo}/actions/{action}）
export const executePlanActionApi = (planNo, action) =>
  request.post(`/plan/${planNo}/actions/${action}`)

// 按计划查询订单列表（GET /order/plan/{planNo}）
export const getOrdersByPlanApi = (planNo) => request.get(`/order/plan/${planNo}`)
