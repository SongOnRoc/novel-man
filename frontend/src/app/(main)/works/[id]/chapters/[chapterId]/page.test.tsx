import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ExportOptions } from "@/components/common/ExportDialog";

import ChapterPage from "./page";

const mockSetBreadcrumb = vi.fn();
const mockUseWorkById = vi.fn();
const mockUseChapterById = vi.fn();
const mockUseChapterList = vi.fn();
const mockCreateObjectUrl = vi.fn(() => "blob:chapter-export");
const mockRevokeObjectUrl = vi.fn();
const mockAnchorClick = vi.fn();
const mockToPng = vi.fn();
const mockUseMediaQuery = vi.fn();
const mockBuildChapterAnalysisResult = vi.fn();

let capturedOnExport: ((options: ExportOptions) => void) | undefined;

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

let currentParams: { id: string; chapterId: string } = { id: "12", chapterId: "101" };

vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => currentParams),
  useRouter: vi.fn(() => ({
    back: vi.fn(),
    push: vi.fn(),
  })),
}));

vi.mock("@/contexts/BreadcrumbContext", () => ({
  useBreadcrumb: vi.fn(() => ({
    setBreadcrumb: mockSetBreadcrumb,
  })),
}));

vi.mock("@/hooks/work/useWorkService", () => ({
  useWorkById: (...args: unknown[]) => mockUseWorkById(...args),
}));

vi.mock("@/hooks/chapter/useChapterService", () => ({
  useChapterById: (...args: unknown[]) => mockUseChapterById(...args),
  useChapterList: (...args: unknown[]) => mockUseChapterList(...args),
}));

vi.mock("@/components/common/GlobalLoading", () => ({
  GlobalLoading: () => <div>加载中</div>,
}));

vi.mock("@/components/common/ExportDialog", () => ({
  ExportDialog: ({ onExport }: { onExport: (options: ExportOptions) => void }) => {
    capturedOnExport = onExport;
    return <button type="button">导出</button>;
  },
}));

vi.mock("html-to-image", () => ({
  toPng: (...args: unknown[]) => mockToPng(...args),
}));

vi.mock("@/hooks/ui/useMediaQuery", () => ({
  useMediaQuery: (...args: unknown[]) => mockUseMediaQuery(...args),
}));

vi.mock("@/features/chapters/lib/chapterAnalysis", () => ({
  buildChapterAnalysisResult: (...args: unknown[]) => mockBuildChapterAnalysisResult(...args),
  generateChapterAnalysisResult: async (...args: unknown[]) => mockBuildChapterAnalysisResult(...args),
}));

describe("ChapterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentParams = { id: "12", chapterId: "101" };
    capturedOnExport = undefined;

    vi.stubGlobal("URL", {
      createObjectURL: mockCreateObjectUrl,
      revokeObjectURL: mockRevokeObjectUrl,
    });

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === "a") {
        Object.defineProperty(element, "click", {
          value: mockAnchorClick,
          configurable: true,
        });
      }
      return element;
    });

    mockUseWorkById.mockReturnValue({
      data: { id: 12, title: "测试作品" },
      isLoading: false,
    });
    mockUseChapterById.mockReturnValue({
      data: {
        id: 101,
        title: "第一章 雨夜",
        content: "<p>雨落得很密。</p>",
      },
      isLoading: false,
      error: null,
    });
    mockUseChapterList.mockReturnValue({
      data: {
        data: [
          {
            id: 101,
            title: "第一章 雨夜",
            content: "<p>雨落得很密。</p>",
            volumeId: 9,
          },
          {
            id: 102,
            title: "第二章 追踪",
            content: "<p>脚步声越来越近。</p>",
            volumeId: 9,
          },
        ],
      },
      isLoading: false,
    });
    mockToPng.mockResolvedValue("data:image/png;base64,preview");
    mockUseMediaQuery.mockReturnValue(true);
    mockBuildChapterAnalysisResult.mockImplementation(
      ({
        kind,
        chapterTitle,
        paragraphs,
      }: {
        kind: "outline" | "characters";
        chapterTitle: string;
        paragraphs: string[];
      }) => ({
        kind,
        heading: kind === "outline" ? "大纲提取结果" : "角色提取结果",
        summary: `基于《${chapterTitle}》生成 ${kind === "outline" ? "大纲" : "角色"}结果。`,
        items: paragraphs.length ? paragraphs.map((paragraph) => `${kind}:${paragraph}`) : ["暂无结果"],
      }),
    );
  });

  it("应直接渲染单章节工作区，而不是跳转到 preview", () => {
    render(<ChapterPage />);

    expect(screen.getAllByText("第一章 雨夜")).toHaveLength(2);
    expect(screen.getByText("围绕当前章节进行阅读、编辑与分析。")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "目录" })).toHaveAttribute(
      "href",
      "/works/12/chapters",
    );
    expect(screen.getByRole("button", { name: "分析" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "编辑" })).toHaveAttribute(
      "href",
      "/works/12/chapters/101/edit",
    );
    expect(screen.getByRole("button", { name: "导出" })).toBeInTheDocument();
    expect(screen.getByText("雨落得很密。")).toBeInTheDocument();
    expect(mockUseChapterById).toHaveBeenCalledWith(101);
    expect(mockUseChapterList).toHaveBeenCalledWith({ workId: 12, page: 1, limit: 9999 });
    expect(mockSetBreadcrumb).toHaveBeenCalledWith("works-12", "测试作品");
    expect(mockSetBreadcrumb).toHaveBeenCalledWith("chapters-101", "第一章 雨夜");
  });

  it("应将当前章节导出逻辑从 preview 吸收到主入口阅读态", () => {
    render(<ChapterPage />);

    expect(capturedOnExport).toBeTypeOf("function");

    capturedOnExport?.({ format: "txt", range: "current" });

    expect(mockCreateObjectUrl).toHaveBeenCalledTimes(1);
    expect(mockAnchorClick).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectUrl).toHaveBeenCalledWith("blob:chapter-export");
  });

  it("桌面端点击分析后应打开侧边分析面板", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred<{
      kind: "outline" | "characters";
      heading: string;
      summary: string;
      items: string[];
    }>();

    mockBuildChapterAnalysisResult.mockReturnValueOnce(deferred.promise);

    render(<ChapterPage />);

    await user.click(screen.getByRole("button", { name: "分析" }));

    expect(screen.getByText("分析中...")).toBeInTheDocument();
    expect(screen.getByLabelText("章节分析面板")).toBeInTheDocument();
    expect(screen.getByText("当前对象：第一章 雨夜")).toBeInTheDocument();
    deferred.resolve({
      kind: "outline",
      heading: "大纲提取结果",
      summary: "基于《第一章 雨夜》生成大纲结果。",
      items: ["outline:雨落得很密。"],
    });
    expect(await screen.findByText("大纲提取结果")).toBeInTheDocument();
    expect(screen.getAllByText("大纲").length).toBeGreaterThan(0);
  });

  it("整章分析应支持切换到角色结果", async () => {
    const user = userEvent.setup();
    const firstDeferred = createDeferred<{
      kind: "outline" | "characters";
      heading: string;
      summary: string;
      items: string[];
    }>();
    const secondDeferred = createDeferred<{
      kind: "outline" | "characters";
      heading: string;
      summary: string;
      items: string[];
    }>();

    mockBuildChapterAnalysisResult
      .mockReturnValueOnce(firstDeferred.promise)
      .mockReturnValueOnce(secondDeferred.promise);

    render(<ChapterPage />);

    await user.click(screen.getByRole("button", { name: "分析" }));
    expect(screen.getByText("分析中...")).toBeInTheDocument();
    firstDeferred.resolve({
      kind: "outline",
      heading: "大纲提取结果",
      summary: "基于《第一章 雨夜》生成大纲结果。",
      items: ["outline:雨落得很密。"],
    });
    await screen.findByText("大纲提取结果");
    await user.click(screen.getByRole("button", { name: "角色" }));

    expect(screen.getByText("分析中...")).toBeInTheDocument();
    secondDeferred.resolve({
      kind: "characters",
      heading: "角色提取结果",
      summary: "基于《第一章 雨夜》生成角色结果。",
      items: ["characters:雨落得很密。"],
    });
    expect(await screen.findByText("角色提取结果")).toBeInTheDocument();
    expect(screen.getAllByText("角色").length).toBeGreaterThan(0);
  });

  it("进入片段选择模式后应展示已选段落数，并将选择结果送入分析面板", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred<{
      kind: "outline" | "characters";
      heading: string;
      summary: string;
      items: string[];
    }>();

    mockBuildChapterAnalysisResult.mockReturnValueOnce(deferred.promise);

    render(<ChapterPage />);

    await user.click(screen.getByRole("button", { name: "选择片段提取" }));
    expect(screen.getByText("片段选择模式")).toBeInTheDocument();
    expect(screen.getByText("已选 0 段")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /第 1 段/i }));
    expect(screen.getByText("已选 1 段")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "提取大纲" }));
    expect(screen.getByLabelText("章节分析面板")).toBeInTheDocument();
    expect(screen.getByText("分析中...")).toBeInTheDocument();
    expect(screen.getByText("当前对象：已选 1 段")).toBeInTheDocument();
    deferred.resolve({
      kind: "outline",
      heading: "大纲提取结果",
      summary: "基于《第一章 雨夜》生成大纲结果。",
      items: ["outline:雨落得很密。"],
    });
    expect(await screen.findByText("大纲提取结果")).toBeInTheDocument();
    expect(screen.getAllByText("大纲").length).toBeGreaterThan(0);
  });

  it("进入片段选择模式后点击提取角色经历应生成角色结果", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred<{
      kind: "outline" | "characters";
      heading: string;
      summary: string;
      items: string[];
    }>();

    mockBuildChapterAnalysisResult.mockReturnValueOnce(deferred.promise);

    render(<ChapterPage />);

    await user.click(screen.getByRole("button", { name: "选择片段提取" }));
    await user.click(screen.getByRole("button", { name: /第 1 段/i }));
    await user.click(screen.getByRole("button", { name: "提取角色经历" }));

    expect(screen.getByLabelText("章节分析面板")).toBeInTheDocument();
    expect(screen.getByText("分析中...")).toBeInTheDocument();
    expect(screen.getByText("当前对象：已选 1 段")).toBeInTheDocument();
    deferred.resolve({
      kind: "characters",
      heading: "角色提取结果",
      summary: "基于《第一章 雨夜》生成角色结果。",
      items: ["characters:雨落得很密。"],
    });
    expect(await screen.findByText("角色提取结果")).toBeInTheDocument();
    expect(screen.getAllByText("角色").length).toBeGreaterThan(0);
  });

  it("分析失败时应展示错误态，并允许重试", async () => {
    const user = userEvent.setup();
    const retryDeferred = createDeferred<{
      kind: "outline" | "characters";
      heading: string;
      summary: string;
      items: string[];
    }>();

    mockBuildChapterAnalysisResult
      .mockRejectedValueOnce(new Error("分析失败，请稍后重试。"))
      .mockReturnValueOnce(retryDeferred.promise);

    render(<ChapterPage />);

    await user.click(screen.getByRole("button", { name: "分析" }));

    expect(screen.getByLabelText("章节分析面板")).toBeInTheDocument();
    expect(await screen.findByText("分析失败，请稍后重试。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重试分析" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "重试分析" }));

    expect(screen.getByText("分析中...")).toBeInTheDocument();
    retryDeferred.resolve({
      kind: "outline",
      heading: "大纲提取结果",
      summary: "基于《第一章 雨夜》生成大纲结果。",
      items: ["outline:雨落得很密。"],
    });
    expect(await screen.findByText("大纲提取结果")).toBeInTheDocument();
  });

  it("移动端应在分析 sheet 中展示异步状态与结果", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred<{
      kind: "outline" | "characters";
      heading: string;
      summary: string;
      items: string[];
    }>();

    mockUseMediaQuery.mockReturnValue(false);
    mockBuildChapterAnalysisResult.mockReturnValueOnce(deferred.promise);

    render(<ChapterPage />);

    await user.click(screen.getByRole("button", { name: "分析" }));

    expect(screen.getByText("章节分析")).toBeInTheDocument();
    expect(screen.getByText("分析中...")).toBeInTheDocument();
    deferred.resolve({
      kind: "outline",
      heading: "大纲提取结果",
      summary: "基于《第一章 雨夜》生成大纲结果。",
      items: ["outline:雨落得很密。"],
    });
    expect(await screen.findByText("大纲提取结果")).toBeInTheDocument();
  });

  it("无效章节 id 时应阻止渲染工作区主体", () => {
    currentParams = { id: "12", chapterId: "invalid" };

    render(<ChapterPage />);

    expect(screen.getByText("无效的章节 ID")).toBeInTheDocument();
    expect(screen.queryByText("围绕当前章节进行阅读、编辑与分析。")).not.toBeInTheDocument();
    expect(mockUseChapterById).toHaveBeenCalledWith(0);
  });
});
