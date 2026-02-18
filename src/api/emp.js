import request from "../utils/request";

// 查询员工列表数据
export const queryPageApi = (name, position, begin, end, page, pageSize) =>
    request.get(`user?name=${name}&position=${position}&begin=${begin}&end=${end}&page=${page}&pageSize=${pageSize}`);

//根据id查询员工
export const queryInfoApi = (id) => request.get(`user/${id}`);

//新增
export const addApi = (emp) => request.post('user', emp);

//修改
export const updateApi = (emp) => request.put('user', emp);

//删除
export const deleteApi = (ids) => request.delete(`user?ids=${ids}`);

// 查询没加入班组的员工
export const queryNoTeamEmpApi = () => request.get('user/join');