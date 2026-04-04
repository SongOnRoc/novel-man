import { ChapterForClient } from "@/lib/services/chapter.service";

export interface ChapterDirectoryGroup {
  key: string;
  volumeId: number | null;
  label: string;
  chapters: ChapterForClient[];
}

export function sortDirectoryChapters(chapters: ChapterForClient[]): ChapterForClient[] {
  return [...chapters].sort((a, b) => {
    const orderA = a.displayOrder ?? 0;
    const orderB = b.displayOrder ?? 0;
    if (orderA !== orderB) return orderA - orderB;

    const idA = a.id ?? 0;
    const idB = b.id ?? 0;
    return idA - idB;
  });
}

export function buildChapterDirectoryGroups(chapters: ChapterForClient[]): ChapterDirectoryGroup[] {
  const sorted = sortDirectoryChapters(chapters);
  const groups = new Map<string, { volumeId: number | null; chapters: ChapterForClient[] }>();

  sorted.forEach((chapter) => {
    const volumeId = typeof chapter.volumeId === "number" ? chapter.volumeId : null;
    const key = volumeId === null ? "unassigned" : `volume-${volumeId}`;
    const current = groups.get(key);

    if (current) {
      current.chapters.push(chapter);
      return;
    }

    groups.set(key, { volumeId, chapters: [chapter] });
  });

  const orderedGroups = [...groups.entries()].sort(([, a], [, b]) => {
    if (a.volumeId === null && b.volumeId !== null) return -1;
    if (a.volumeId !== null && b.volumeId === null) return 1;
    if (a.volumeId === null && b.volumeId === null) return 0;
    return (a.volumeId ?? 0) - (b.volumeId ?? 0);
  });

  let displayIndex = 1;

  return orderedGroups.map(([key, group]) => {
    if (group.volumeId === null) {
      return {
        key,
        volumeId: null,
        label: "未分卷",
        chapters: group.chapters,
      };
    }

    const next = {
      key,
      volumeId: group.volumeId,
      label: `第 ${displayIndex} 卷`,
      chapters: group.chapters,
    };
    displayIndex += 1;
    return next;
  });
}

export function paginateDirectoryGroups(
  groups: ChapterDirectoryGroup[],
  page: number,
  pageSize: number,
): ChapterDirectoryGroup[] {
  const start = (page - 1) * pageSize;
  return groups.slice(start, start + pageSize);
}

export function paginateDirectoryChapters(
  chapters: ChapterForClient[],
  page: number,
  pageSize: number,
): ChapterForClient[] {
  const start = (page - 1) * pageSize;
  return chapters.slice(start, start + pageSize);
}

export function resolveDirectoryPageByCurrentChapter(args: {
  groups: ChapterDirectoryGroup[];
  chapters: ChapterForClient[];
  currentChapterId?: number;
  pageSize: number;
  isTreeMode: boolean;
}): number | null {
  const { groups, chapters, currentChapterId, pageSize, isTreeMode } = args;

  if (!currentChapterId) {
    return null;
  }

  if (isTreeMode) {
    const groupIndex = groups.findIndex((group) =>
      group.chapters.some((chapter) => chapter.id === currentChapterId),
    );
    if (groupIndex === -1) {
      return null;
    }

    return Math.floor(groupIndex / pageSize) + 1;
  }

  const chapterIndex = chapters.findIndex((chapter) => chapter.id === currentChapterId);
  if (chapterIndex === -1) {
    return null;
  }

  return Math.floor(chapterIndex / pageSize) + 1;
}
