import { Outline, Work, Volume, Chapter } from "@/types/work";
import { mockWorks } from "./works-mock-data";
import { mockVolumes } from "./volumes-mock-data";
import { mockChapters } from "./chapters-mock-data";

/**
 * 根据作品、分卷和章节数据动态生成大纲信息。
 * @param works - 作品列表
 * @param volumes - 分卷列表
 * @param chapters - 章节列表
 * @returns - 生成的大纲列表
 */
function generateOutlines(
  works: Work[],
  volumes: Volume[],
  chapters: Chapter[]
): Outline[] {
  return works.map((work) => {
    // 筛选出属于当前作品的分卷
    const workVolumes = volumes.filter((volume) => volume.workId === work.id);

    return {
      workId: work.id,
      main: work.description, // 使用作品的描述作为总纲
      volumes: workVolumes.map((volume) => {
        // 筛选出属于当前分卷的章节
        const volumeChapters = chapters.filter(
          (chapter) => chapter.volumeId === volume.id
        );
        return {
          ...volume,
          chapters: volumeChapters,
        };
      }),
    };
  });
}

// 生成所有作品的大纲
export const mockOutlines: Outline[] = generateOutlines(
  mockWorks,
  mockVolumes,
  mockChapters
);

/**
 * 根据作品ID获取对应的大纲。
 * @param workId - 作品ID
 * @returns - 对应的大纲信息，如果找不到则返回undefined
 */
export function getOutlineByWorkId(workId: string): Outline | undefined {
  return mockOutlines.find((outline) => outline.workId === workId);
}
