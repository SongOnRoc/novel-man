/**
 * @file work/index.ts
 * @description Defines types related to creative works, including works, volumes, chapters, drafts, and outlines.
 */

// 1. 作品核心定义 (Work)
// =================================================================

/**
 * 代表一部独立的作品，如小说、剧本等。
 */
export interface Work {
  id: number;
  title: string;
  description: string;
  cover_image_url: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WorkListResponse {
  data: Work[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export type CreateWorkData = Omit<Work, 'id' | 'created_at' | 'updated_at'>;
export type UpdateWorkData = Partial<CreateWorkData>;

// 2. 内容基本结构 (Base Content)
// =================================================================

/**
 * 定义了所有文本内容（如章节、草稿）共享的基础属性。
 */
export interface BaseContent {
  id: string;
  workId: string; // 关联的作品ID
  title: string;
  content: string; // 完整内容 (HTML or Markdown)
  outline: string; // 大纲或摘要
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

// 3. 章节与草稿 (Chapter & Draft)
// =================================================================

/**
 * 定义内容的发布状态
 */
export type ContentStatus = "draft" | "published" | "archived";

/**
 * 代表作品中一个已发布的、有顺序的章节。
 */
export interface Chapter extends BaseContent {
  volumeId: string; // 所属分卷ID
  order: number; // 在分卷中的顺序
  status: ContentStatus; // 章节状态
}

/**
 * 代表一个未完成或未发布的草稿。
 */
export interface Draft extends BaseContent {
  status: ContentStatus; // 草稿状态
}

// 4. 大纲与分卷 (Outline & Volume)
// =================================================================

/**
 * 定义分卷的基本结构。
 */
export interface Volume {
  id: string;
  workId: string; // 关联的作品ID
  title: string;
  order: number;
  outline: string; // 分卷的整体大纲
}

/**
 * 为大纲页面定义一个包含章节的卷结构。
 */
export interface VolumeWithChapters extends Volume {
  chapters: Chapter[];
}

/**
 * 定义一部作品的完整大纲结构。
 */
export interface Outline {
  workId: string; // 关联的作品ID
  main: string; // 作品总纲
  volumes: VolumeWithChapters[]; // 包含章节的分卷列表
}
