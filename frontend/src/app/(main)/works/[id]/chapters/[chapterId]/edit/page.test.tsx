import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EditChapterPage from "./page";

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

const mockPush = vi.fn();
const mockSetBreadcrumb = vi.fn();
const mockUseChapterById = vi.fn();
const mockUseUpdateChapter = vi.fn();
const mockUseWorkById = vi.fn();
const mockTiptapEditor = vi.fn();
const mockUseMediaQuery = vi.fn();
const mockBuildChapterAnalysisResult = vi.fn();

let currentParams: { id: string; chapterId: string } = { id: "12", chapterId: "101" };

vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => currentParams),
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock("@/contexts/BreadcrumbContext", () => ({
  useBreadcrumb: vi.fn(() => ({
    setBreadcrumb: mockSetBreadcrumb,
  })),
}));

vi.mock("@/hooks/chapter/useChapterService", () => ({
  useChapterById: (...args: unknown[]) => mockUseChapterById(...args),
  useUpdateChapter: () => mockUseUpdateChapter(),
}));

vi.mock("@/hooks/work/useWorkService", () => ({
  useWorkById: (...args: unknown[]) => mockUseWorkById(...args),
}));

vi.mock("@/hooks/ui/useMediaQuery", () => ({
  useMediaQuery: (...args: unknown[]) => mockUseMediaQuery(...args),
}));

vi.mock("@/features/chapters/lib/chapterAnalysis", () => ({
  buildChapterAnalysisResult: (...args: unknown[]) => mockBuildChapterAnalysisResult(...args),
  generateChapterAnalysisResult: async (...args: unknown[]) => mockBuildChapterAnalysisResult(...args),
}));

vi.mock("@/components/common/GlobalLoading", () => ({
  GlobalLoading: () => <div>加载中</div>,
}));

vi.mock("@/features/editor/components/TiptapEditor", () => ({
  TiptapEditor: (props: Record<string, unknown>) => {
    mockTiptapEditor(props);
    return (
      <div>
        <div>章节编辑器</div>
        <button type="button" onClick={() => (props.onBack as (() => void) | undefined)?.()}>
          返回作品
        </button>
      </div>
    );
  },
}));

describe("EditChapterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentParams = { id: "12", chapterId: "101" };

    mockUseChapterById.mockReturnValue({
      data: {
        id: 101,
        title: "第一章 雨夜",
        content: "<p>雨落得很密。</p>",
      },
      isLoading: false,
      error: null,
    });
    mockUseWorkById.mockReturnValue({
      data: { id: 12, title: "测试作品" },
    });
    mockUseUpdateChapter.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
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

  it("应在编辑态展示统一章节工作区头部与编辑器入口", async () => {
    const user = userEvent.setup();

    render(<EditChapterPage />);

    expect(screen.getByText("围绕当前章节进行阅读、编辑与分析。")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "目录" })).toHaveAttribute(
      "href",
      "/works/12/chapters",
    );
    expect(screen.getByRole("button", { name: "分析" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "选择片段提取" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "阅读" })).toHaveAttribute(
      "href",
      "/works/12/chapters/101",
    );
    expect(screen.getByText("章节编辑器")).toBeInTheDocument();
    expect(mockTiptapEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        initialContent: {
          title: "第一章 雨夜",
          content: "<p>雨落得很密。</p>",
        },
        backLabel: "返回作品",
      }),
    );

    await user.click(screen.getByRole("button", { name: "返回作品" }));
    expect(mockPush).toHaveBeenCalledWith("/works/12");
  });

  it("编辑态点击分析后应打开分析面板容器", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred<{
      kind: "outline" | "characters";
      heading: string;
      summary: string;
      items: string[];
    }>();

    mockBuildChapterAnalysisResult.mockReturnValueOnce(deferred.promise);

    render(<EditChapterPage />);

    await user.click(screen.getByRole("button", { name: "分析" }));

    expect(screen.getByLabelText("章节分析面板")).toBeInTheDocument();
    expect(screen.getByText("分析中...")).toBeInTheDocument();
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

  it("编辑态整章分析应支持切换到角色结果", async () => {
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

    render(<EditChapterPage />);

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

  it("编辑态分析失败时应展示错误态，并允许重试", async () => {
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

    render(<EditChapterPage />);

    await user.click(screen.getByRole("button", { name: "分析" }));

    expect(screen.getByLabelText("章节分析面板")).toBeInTheDocument();
    expect(await screen.findByText("分析失败，请稍后重试。")).toBeInTheDocument();

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

  it("编辑态移动端应在分析 sheet 中展示异步状态与结果", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred<{
      kind: "outline" | "characters";
      heading: string;
      summary: string;
      items: string[];
    }>();

    mockUseMediaQuery.mockReturnValue(false);
    mockBuildChapterAnalysisResult.mockReturnValueOnce(deferred.promise);

    render(<EditChapterPage />);

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
});
