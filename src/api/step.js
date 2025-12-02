import request from "@/utils/request";

//条件分页查询工步信息
export const getStepByPageApi = (stepName, equipmentName, processName, page, pageSize) =>
    request.get(`step?stepName=${stepName}&equipmentName=${equipmentName}&processName=${processName}&page=${page}&pageSize=${pageSize}`)

//新增工步信息
export const addStepApi = (data) => request.post('step', data)
//修改工步信息
export const updateStepApi = (data) => request.put('step', data)
//删除工步信息
export const deleteStepApi = (ids) => request.delete(`step?ids=${ids}`)

//查询所有工步信息
export const getAllStepApi = () => request.get('/step/listAll')