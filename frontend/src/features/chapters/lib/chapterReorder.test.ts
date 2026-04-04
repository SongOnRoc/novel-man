import { describe, expect, it } from "vitest";

import { buildChapterReorderPlan } from "./chapterReorder";

describe("buildChapterReorderPlan", () => {
  it("向前插入时应重算连续 displayOrder 并同步标题前缀", () => {
    const result = buildChapterReorderPlan({
      chapters: [
        { id: 101, title: "第一章 起点", displayOrder: 1 },
        { id: 102, title: "第二章 冲突", displayOrder: 2 },
        { id: 103, title: "第三章 终点", displayOrder: 3 },
      ],
      movingChapterId: 103,
      targetDisplayOrder: 2,
      styleTemplate: "第{N}章",
      numberFormat: "chinese",
    });

    expect(result.orderedChapterIds).toEqual([101, 103, 102]);
    expect(result.updates).toEqual([
      { id: 103, data: { displayOrder: 2, title: "第二章 终点" } },
      { id: 102, data: { displayOrder: 3, title: "第三章 冲突" } },
    ]);
  });

  it("向后插入时应保留后缀并按阿拉伯数字重写标题", () => {
    const result = buildChapterReorderPlan({
      chapters: [
        { id: 101, title: "第1章 起点", displayOrder: 1 },
        { id: 102, title: "第2章 经过", displayOrder: 2 },
        { id: 103, title: "第3章 终点", displayOrder: 3 },
      ],
      movingChapterId: 101,
      targetDisplayOrder: 3,
      styleTemplate: "第{N}章",
      numberFormat: "arabic",
    });

    expect(result.orderedChapterIds).toEqual([102, 103, 101]);
    expect(result.updates).toEqual([
      { id: 102, data: { displayOrder: 1, title: "第1章 经过" } },
      { id: 103, data: { displayOrder: 2, title: "第2章 终点" } },
      { id: 101, data: { displayOrder: 3, title: "第3章 起点" } },
    ]);
  });

  it("目标章节号与当前相同时应返回空更新", () => {
    const result = buildChapterReorderPlan({
      chapters: [
        { id: 101, title: "第一章 起点", displayOrder: 1 },
        { id: 102, title: "第二章 经过", displayOrder: 2 },
      ],
      movingChapterId: 102,
      targetDisplayOrder: 2,
      styleTemplate: "第{N}章",
      numberFormat: "chinese",
    });

    expect(result.orderedChapterIds).toEqual([101, 102]);
    expect(result.updates).toEqual([]);
  });
});
