import apiClient from './client';
import { User } from '@/types/auth';

// 登录请求体类型
interface LoginCredentials {
    email: string;
    password: string;
}

// 注册请求体类型
interface RegisterData {
    username: string;
    email: string;
    password: string;
}

// 登录响应类型
interface LoginResponse {
    access_token: string;
    token_type: string;
}

export const register = (data: RegisterData) => {
    return apiClient.post<User>('/auth/register', data);
};

export const login = (credentials: LoginCredentials) => {
    return apiClient.post<LoginResponse>('/auth/login', credentials);
};

export const logout = () => {
    return apiClient.post('/auth/logout');
};

export const getMe = () => {
    return apiClient.get<User>('/auth/me');
};