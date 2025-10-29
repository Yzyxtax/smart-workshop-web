import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '../router/index.js'

const request = axios.create({
    baseURL: '/api',
    timeout: 600000
});

// 请求拦截器
request.interceptors.request.use(
    (config) => {   //成功回调
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) {
            config.headers.token = user.token;
        }
        return config
    },
    (error) => {    //失败回调
        return Promise.reject(error);
    }
);    

// 响应拦截器
request.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // 处理未授权错误，例如重定向到登录页面
            ElMessage.error('未授权，请重新登录');
            localStorage.removeItem('user');
            router.push('/login') 
        }else{
            ElMessage.error(error.response?.data?.message || '请求失败，请稍后重试');
        }
        return Promise.reject(error);
    }
)

export default request;