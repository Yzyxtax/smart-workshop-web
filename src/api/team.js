import request from "@/utils/request";

//查询所有班组编号和名称
export const getAllTeamApi = () => request.get('/team')

//根据编号查询班组信息
export const getTeamByNoApi = (teamCode) => request.get(`/team/${teamCode}`)

//新增班组信息
export const addTeamApi = (data) => request.post('team', data)

//修改班组信息
export const updateTeamApi = (data, teamCode) => request.put(`team/${teamCode}`, data)

//删除班组信息
export const deleteTeamApi = (teamCode) => request.delete(`team/${teamCode}`)

//查询矩阵信息
export const getTeamMatrixApi = (teamCode) => request.get(`/team/matrix?teamCode=${teamCode}`)

//保存矩阵信息
export const saveTeamMatrixApi = (data) => request.post('/team/matrix', data)