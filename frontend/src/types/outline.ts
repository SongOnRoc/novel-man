// 定义分卷的基本结构
export interface Volume {
  id: string;
  title: string;
  order: number;
}

// 定义章节/草稿的统一结构
export interface ChapterDraft {
  chapterId: string;
  workId: string; // 关联的作品ID
  volumeId?: string; // 关联的分卷ID, 草稿可以没有
  title: string; // 章节/草稿标题
  outline: string; // 章节大纲
  content: string; // 章节的完整内容
  order?: number; // 章节顺序, 草稿可以没有
  status: "draft" | "published"; // 状态
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

// 定义分卷大纲的结构
export interface VolumeOutline {
  volumeId: string;
  workId: string; // 关联的作品ID
  title: string; // 分卷标题，用于显示
  outline: string; // 分卷的整体大纲
  order: number;
  // chapters: ChapterDraft[]; // 章节将通过ID关联，而不是直接嵌套
}

// 为大纲页面定义一个包含章节的卷结构
export interface VolumeWithChapters extends VolumeOutline {
  chapters: ChapterDraft[];
}

// 定义完整的大纲结构
export interface Outline {
  main: string; // 总纲
  volumes: VolumeWithChapters[]; // 分卷大纲列表
}
