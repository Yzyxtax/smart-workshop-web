import request from "@/utils/request";

//获取BOM列表
export const queryBomListApi = () => request.get('bom')

//根据id获取BOM详情
export const getBomByIdApi = (id) => request.get(`bom/${id}`)

//保存BOM信息
export const saveBomApi = (data) => request.put('bom', data)

//保存拖拽层级更改
export const saveLevelApi = (id, parentId) => request.put(`bom/level?id=${id}&parentId=${parentId}`)

//新增BOM
export const addBom = (data) => request.post('bom', data)

//删除BOM
export const deleteBom = (ids) => request.delete(`bom/${ids}`)