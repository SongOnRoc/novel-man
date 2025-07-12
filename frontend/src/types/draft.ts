// 草稿类型定义
export interface Draft {
  id: string;
  title: string;
  content: string;
  workTitle?: string;
  workId?: string;
  chapterId?: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
}
