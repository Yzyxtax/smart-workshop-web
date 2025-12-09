import request from "@/utils/request";

//查询所有流程信息
export const getAllFlowApi = () => request.get('/flow')

//新增流程信息
export const addFlowApi = (data) => request.post('/flow', data)

//修改流程信息
export const updateFlowApi = (data) => request.put('/flow', data)

//删除流程信息
export const deleteFlowApi = (id) => request.delete(`/flow?id=${id}`)

//获取流程图信息
export const getFlowChartApi = (flowId) => request.get(`/flow/chart/${flowId}`)

//保存流程图信息
export const saveFlowChartApi = (data) => request.post('/flow/chart', data)