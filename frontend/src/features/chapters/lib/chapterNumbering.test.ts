import { describe, expect, it } from "vitest";

import {
  formatChapterNumber,
  isValidChapterNumberStyleTemplate,
  normalizeChapterTitle,
  stripChapterNumberPrefix,
  toChineseNumeral,
} from "./chapterNumbering";

describe("chapterNumbering", () => {
  describe("isValidChapterNumberStyleTemplate", () => {
    it("必须包含 {N} 且不能换行", () => {
      expect(isValidChapterNumberStyleTemplate("第{N}章")).toBe(true);
      expect(isValidChapterNumberStyleTemplate("{N}."))
        .toBe(true);

      expect(isValidChapterNumberStyleTemplate("第N章")).toBe(false);
      expect(isValidChapterNumberStyleTemplate(""))
        .toBe(false);
      expect(isValidChapterNumberStyleTemplate("第{N}章\n"))
        .toBe(false);
    });
  });

  describe("toChineseNumeral", () => {
    it("支持 1-9999 的中文数字", () => {
      expect(toChineseNumeral(1)).toBe("一");
      expect(toChineseNumeral(9)).toBe("九");
      expect(toChineseNumeral(10)).toBe("十");
      expect(toChineseNumeral(11)).toBe("十一");
      expect(toChineseNumeral(20)).toBe("二十");
      expect(toChineseNumeral(101)).toBe("一百零一");
      expect(toChineseNumeral(110)).toBe("一百一十");
      expect(toChineseNumeral(1005)).toBe("一千零五");
      expect(toChineseNumeral(9999)).toBe("九千九百九十九");
    });
  });

  describe("formatChapterNumber", () => {
    it("默认中文数字替换 {N}", () => {
      expect(formatChapterNumber(12, "第{N}章")).toBe("第十二章");
    });

    it("支持阿拉伯数字", () => {
      expect(formatChapterNumber(12, "第{N}章", { numberFormat: "arabic" })).toBe("第12章");
      expect(formatChapterNumber(3, "{N}.", { numberFormat: "arabic" })).toBe("3.");
    });
  });

  describe("stripChapterNumberPrefix", () => {
    it("可剥离常见章号前缀", () => {
      expect(stripChapterNumberPrefix("第20章 标题")).toEqual({
        stripped: "标题",
        detectedNo: 20,
      });

      expect(stripChapterNumberPrefix("第二十章：标题"))
        .toEqual({ stripped: "标题", detectedNo: 20 });

      expect(stripChapterNumberPrefix("章节20 标题"))
        .toEqual({ stripped: "标题", detectedNo: 20 });

      expect(stripChapterNumberPrefix("20. 标题"))
        .toEqual({ stripped: "标题", detectedNo: 20 });

      expect(stripChapterNumberPrefix("20 标题"))
        .toEqual({ stripped: "标题", detectedNo: 20 });
    });

    it("无匹配前缀时不修改", () => {
      expect(stripChapterNumberPrefix("只是标题")).toEqual({
        stripped: "只是标题",
        detectedNo: null,
      });
    });
  });

  describe("normalizeChapterTitle", () => {
    it("生成 finalTitle，并能检测冲突", () => {
      const r1 = normalizeChapterTitle({
        chapterNo: 3,
        inputTitle: "第三章 测试",
        styleTemplate: "第{N}章",
      });
      expect(r1.finalTitle).toBe("第三章 测试");
      expect(r1.hasConflict).toBe(false);
      expect(r1.detectedNo).toBe(3);
      expect(r1.suffix).toBe("测试");

      const r2 = normalizeChapterTitle({
        chapterNo: 3,
        inputTitle: "第4章 测试",
        styleTemplate: "第{N}章",
        numberFormat: "arabic",
      });
      expect(r2.finalTitle).toBe("第3章 测试");
      expect(r2.hasConflict).toBe(true);
      expect(r2.detectedNo).toBe(4);
    });

    it("空后缀时只输出前缀", () => {
      const r = normalizeChapterTitle({
        chapterNo: 1,
        inputTitle: "",
        styleTemplate: "第{N}章",
      });
      expect(r.finalTitle).toBe("第一章");
      expect(r.suffix).toBe("");
    });
  });
});
