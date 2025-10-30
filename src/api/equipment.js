import request from "@/utils/request";

//条件分页查询设备数据
export const queryPageApi = (name, type, model, page, pageSize) =>
    request.get(`equipment?name=${name}&type=${type}&model=${model}&page=${page}&pageSize=${pageSize}`)

//新增设备
export const addApi = (equipment) => request.post('equipment', equipment)

//修改设备
export const updateApi = (equipment) => request.put('equipment', equipment)

//根据id查询设备信息
export const queryInfoApi = (id) => request.get(`equipment/${id}`)

//批量删除设备信息
export const deleteApi = (ids) => request.delete(`equipment?ids=${ids}`)