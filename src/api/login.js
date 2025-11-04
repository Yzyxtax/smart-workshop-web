import request from "@/utils/request";

// 登录
export const loginApi = (loginForm) => request.post(`/login`, loginForm);