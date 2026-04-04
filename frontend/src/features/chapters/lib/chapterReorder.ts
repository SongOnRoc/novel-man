import { normalizeChapterTitle } from "./chapterNumbering";

type MinimalChapter = {
  id?: number;
  title?: string;
  displayOrder?: number;
};

export interface ChapterReorderPlanUpdate {
  id: number;
  data: {
    displayOrder: number;
    title: string;
  };
}

export interface ChapterReorderPlanResult {
  orderedChapterIds: number[];
  updates: ChapterReorderPlanUpdate[];
}

function sortChaptersForReorder<T extends MinimalChapter>(chapters: T[]): T[] {
  return [...chapters].sort((a, b) => {
    const orderA = a.displayOrder ?? 0;
    const orderB = b.displayOrder ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return (a.id ?? 0) - (b.id ?? 0);
  });
}

export function buildChapterReorderPlan(params: {
  chapters: MinimalChapter[];
  movingChapterId: number;
  targetDisplayOrder: number;
  styleTemplate: string;
  numberFormat?: "chinese" | "arabic";
}): ChapterReorderPlanResult {
  const ordered = sortChaptersForReorder(params.chapters);
  const total = ordered.length;

  if (!Number.isInteger(params.movingChapterId) || params.movingChapterId <= 0) {
    throw new Error("待移动章节 ID 无效");
  }
  if (!Number.isInteger(params.targetDisplayOrder) || params.targetDisplayOrder <= 0 || params.targetDisplayOrder > total) {
    throw new Error("目标章节号超出范围");
  }

  const movingIndex = ordered.findIndex((chapter) => chapter.id === params.movingChapterId);
  if (movingIndex < 0) {
    throw new Error("未找到待移动章节");
  }

  const movingChapter = ordered[movingIndex];
  const currentDisplayOrder = movingChapter.displayOrder ?? movingIndex + 1;
  if (currentDisplayOrder === params.targetDisplayOrder) {
    return {
      orderedChapterIds: ordered.map((chapter) => chapter.id ?? 0),
      updates: [],
    };
  }

  const next = [...ordered];
  next.splice(movingIndex, 1);
  next.splice(params.targetDisplayOrder - 1, 0, movingChapter);

  const updates: ChapterReorderPlanUpdate[] = [];
  for (let index = 0; index < next.length; index += 1) {
    const chapter = next[index];
    const nextDisplayOrder = index + 1;
    const normalized = normalizeChapterTitle({
      chapterNo: nextDisplayOrder,
      inputTitle: chapter.title || "",
      styleTemplate: params.styleTemplate,
      numberFormat: params.numberFormat ?? "chinese",
    });

    if ((chapter.displayOrder ?? nextDisplayOrder) !== nextDisplayOrder || (chapter.title || "") !== normalized.finalTitle) {
      if (!chapter.id) {
        throw new Error("章节缺少 ID，无法重排");
      }
      updates.push({
        id: chapter.id,
        data: {
          displayOrder: nextDisplayOrder,
          title: normalized.finalTitle,
        },
      });
    }
  }

  return {
    orderedChapterIds: next.map((chapter) => chapter.id ?? 0),
    updates,
  };
}
