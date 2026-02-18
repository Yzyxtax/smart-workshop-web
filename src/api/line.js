import request from "@/utils/request";

//查询所有产线信息
export const getAllLineApi = () => request.get('/line')

//新增产线信息
export const addLineApi = (data) => request.post('/line', data)

//删除产线信息
export const deleteLineApi = (lineNo) => request.delete(`/line/${lineNo}`)

//修改产线信息
export const updateLineApi = (data, lineCode) => request.put(`/line/${lineCode}`, data)

//查询产线班组组成
export const getLineComposeApi = (lineNo) => request.get(`/line/compose/${lineNo}`)

//保存产线班组组成
export const updateLineComposeApi = (data) => request.put('/line/compose', data)

//查询某个产线信息
export const getLineApi = (lineNo) => request.get(`/line/${lineNo}`)