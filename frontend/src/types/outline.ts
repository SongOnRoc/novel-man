// 定义分卷的基本结构
export interface Volume {
  id: string;
  title: string;
  order: number;
}

// 定义章节细纲的结构
export interface ChapterOutline {
  chapterId: string;
  title: string; // 章节标题，用于显示
  outline: string; // 章节的详细大纲
  order: number;
}

// 定义分卷大纲的结构
export interface VolumeOutline {
  volumeId: string;
  title: string; // 分卷标题，用于显示
  outline: string; // 分卷的整体大纲
  chapters: ChapterOutline[]; // 该分卷下的章节细纲列表
  order: number;
}

// 定义完整的大纲结构
export interface Outline {
  main: string; // 总纲
  volumes: VolumeOutline[]; // 分卷大纲列表
}
