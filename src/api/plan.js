import request from "@/utils/request";

//查询所有计划信息
export const getAllPlanApi = () => request.get('/plan')

//新增计划信息
export const addPlanApi = (data) => request.post('plan', data)

//删除计划信息
export const deletePlanApi = (planNo) => request.delete(`plan/${planNo}`)

//修改计划信息
export const updatePlanApi = (data, planNo) => request.put(`plan/${planNo}`, data)

//更改计划状态
export const updatePlanStateApi = (planNo, action, userId) => request.post(`plan/${planNo}/actions/${action}?userId=${userId}`)