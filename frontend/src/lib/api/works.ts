import apiClient from './client';
import { Work, WorkListResponse, CreateWorkData, UpdateWorkData } from '@/types/work';

export const getWorks = async (params: { page?: number; limit?: number; status?: string } = {}): Promise<WorkListResponse> => {
  const response = await apiClient.get('/works', { params });
  return response.data;
};

export const createWork = async (data: CreateWorkData): Promise<Work> => {
  const response = await apiClient.post('/works', data);
  return response.data;
};

export const getWorkById = async (id: number): Promise<Work> => {
  const response = await apiClient.get(`/works/${id}`);
  return response.data;
};

export const updateWork = async (id: number, data: UpdateWorkData): Promise<Work> => {
  const response = await apiClient.put(`/works/${id}`, data);
  return response.data;
};

export const deleteWork = async (id: number): Promise<void> => {
  await apiClient.delete(`/works/${id}`);
};