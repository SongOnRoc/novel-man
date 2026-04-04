import { describe, expect, it, beforeEach, vi } from "vitest";

import {
  clearWorkChapterNumberingConfig,
  getChapterNumberStyleTemplate,
  getEffectiveChapterNumberingConfig,
  loadGlobalChapterNumberingConfig,
  loadWorkChapterNumberingConfig,
  saveGlobalChapterNumberingConfig,
  saveWorkChapterNumberingConfig,
} from "./chapterNumberingStorage";

describe("chapterNumberingStorage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("默认返回全局配置", () => {
    const cfg = loadGlobalChapterNumberingConfig();
    expect(cfg.styleId).toBe("cn_chapter");
    expect(cfg.numberFormat).toBe("chinese");
  });

  it("可保存/读取全局配置", () => {
    saveGlobalChapterNumberingConfig({
      styleId: "arabic_dot",
      numberFormat: "arabic",
    });
    const cfg = loadGlobalChapterNumberingConfig();
    expect(cfg.styleId).toBe("arabic_dot");
    expect(cfg.numberFormat).toBe("arabic");
  });

  it("作品覆盖优先于全局", () => {
    saveGlobalChapterNumberingConfig({ styleId: "cn_chapter", numberFormat: "chinese" });
    saveWorkChapterNumberingConfig(12, { styleId: "cn_volume", numberFormat: "chinese" });

    const eff = getEffectiveChapterNumberingConfig(12);
    expect(eff.styleId).toBe("cn_volume");
  });

  it("clearWorkChapterNumberingConfig 会移除覆盖", () => {
    saveWorkChapterNumberingConfig(12, { styleId: "cn_section", numberFormat: "chinese" });
    expect(loadWorkChapterNumberingConfig(12)?.styleId).toBe("cn_section");

    clearWorkChapterNumberingConfig(12);
    expect(loadWorkChapterNumberingConfig(12)).toBeNull();
  });

  it("custom 模板必须包含 {N} 且禁止换行", () => {
    saveGlobalChapterNumberingConfig({
      styleId: "custom",
      numberFormat: "chinese",
      customTemplate: "第{N}回",
    });

    const cfg = loadGlobalChapterNumberingConfig();
    expect(cfg.styleId).toBe("custom");
    expect(getChapterNumberStyleTemplate(cfg)).toBe("第{N}回");

    saveGlobalChapterNumberingConfig({
      styleId: "custom",
      numberFormat: "chinese",
      customTemplate: "第N回",
    });

    // invalid custom should fall back
    const cfg2 = loadGlobalChapterNumberingConfig();
    expect(cfg2.styleId).toBe("cn_chapter");
  });
});
