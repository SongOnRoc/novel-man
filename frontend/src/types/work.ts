import { Outline } from "./outline";

// 作品类型定义
export interface Work {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  coverImage?: string; // 可选的封面图片URL
  outline?: string; // 可选的作品总纲
}
