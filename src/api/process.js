import request from "@/utils/request";

//条件分页查询工序信息
export const getProcessApi = (processName, inputBom, outputBom, page, pageSize) =>
    request.get(`process?processName=${processName}&inputBom=${inputBom}&outputBom=${outputBom}&page=${page}&pageSize=${pageSize}`)

//新增工序信息
export const addProcessApi = (data) => request.post('process', data)

//删除工序信息
export const deleteProcessApi = (ids) => request.delete(`process?ids=${ids}`)

//修改工序信息
export const updateProcessApi = (data) => request.put('process', data)

//查询所有工序信息
export const getAllProcessApi = () => request.get('/process/listAll')