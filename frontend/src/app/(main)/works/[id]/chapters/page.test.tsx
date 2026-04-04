import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ChaptersPage from "./page";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockSetBreadcrumb = vi.fn();
const mockUseWorkById = vi.fn();
const mockUseChapterList = vi.fn();
const mockUseDeleteChapter = vi.fn();
const mockUseImportChapters = vi.fn();
const mockUseUpdateChapter = vi.fn();
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

let currentSearchParams = new URLSearchParams();
let currentParams: { id: string } = { id: "12" };

vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => currentParams),
  useRouter: vi.fn(() => ({
    push: mockPush,
    refresh: mockRefresh,
  })),
  useSearchParams: vi.fn(() => currentSearchParams),
}));

vi.mock("@/contexts/BreadcrumbContext", () => ({
  useBreadcrumb: vi.fn(() => ({
    setBreadcrumb: mockSetBreadcrumb,
  })),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}));

vi.mock("@/hooks/work/useWorkService", () => ({
  useWorkById: (...args: unknown[]) => mockUseWorkById(...args),
}));

vi.mock("@/hooks/chapter/useChapterService", () => ({
  useChapterList: (...args: unknown[]) => mockUseChapterList(...args),
  useDeleteChapter: () => mockUseDeleteChapter(),
  useImportChapters: () => mockUseImportChapters(),
  useUpdateChapter: () => mockUseUpdateChapter(),
}));

vi.mock("@/components/common/DeleteItemDialog", () => ({
  DeleteItemDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="delete-chapter-dialog">删除章节对话框</div> : null,
}));

vi.mock("@/components/common/ImportDialog", () => ({
  ImportDialog: ({ open }: { open?: boolean }) =>
    open ? <div data-testid="import-dialog">导入章节弹窗</div> : null,
}));

vi.mock("@/components/common/GlobalLoading", () => ({
  GlobalLoading: () => <div>加载中</div>,
}));

vi.mock("@/features/chapters/components/ChapterTocTree", () => ({
  ChapterTocTree: ({
    groups,
    chapters,
    isTreeMode,
    expandedKeys = [],
    currentChapterId,
    onToggleGroup,
    onDelete,
    onReorder,
  }: {
    groups?: Array<{
      key: string;
      label: string;
      chapters: Array<{ id: number; title: string; displayOrder?: number }>;
    }>;
    chapters?: Array<{ id: number; title: string; displayOrder?: number }>;
    isTreeMode?: boolean;
    expandedKeys?: string[];
    currentChapterId?: number;
    onToggleGroup?: (key: string) => void;
    onDelete: (chapter: { id: number; title: string; displayOrder?: number }) => void;
    onReorder: (chapter: { id: number; title: string; displayOrder?: number }) => void;
  }) => {
    if (!isTreeMode) {
      return (
        <div data-testid="chapter-flat-list">
          {(chapters || []).map((chapter) => (
            <div key={chapter.id}>
              <button type="button" onClick={() => onDelete(chapter)}>
                删除 {chapter.title}
              </button>
              <button type="button" onClick={() => onReorder(chapter)}>
                调整章节号 {chapter.title}
              </button>
              <span data-current={chapter.id === currentChapterId ? "true" : undefined}>{chapter.title}</span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div data-testid="chapter-tree">
        {(groups || []).map((group) => {
          const expanded = expandedKeys.includes(group.key);
          return (
            <section key={group.key} aria-label={group.label}>
              <button type="button" onClick={() => onToggleGroup?.(group.key)}>
                {group.label}
              </button>
              <span>{group.chapters.length} 章</span>
              {expanded
                ? group.chapters.map((chapter) => (
                    <div key={chapter.id}>
                      <button type="button" onClick={() => onDelete(chapter)}>
                        删除 {chapter.title}
                      </button>
                      <button type="button" onClick={() => onReorder(chapter)}>
                        调整章节号 {chapter.title}
                      </button>
                      <span data-current={chapter.id === currentChapterId ? "true" : undefined}>
                        {chapter.title}
                      </span>
                    </div>
                  ))
                : null}
            </section>
          );
        })}
      </div>
    );
  },
}));

vi.mock("@/features/chapters/components/ChapterDirectoryToolbar", () => ({
  ChapterDirectoryToolbar: ({
    query,
    onQueryChange,
    showTreeControls,
    onExpandAll,
    onCollapseAll,
  }: {
    query: string;
    onQueryChange?: (value: string) => void;
    showTreeControls?: boolean;
    onExpandAll?: () => void;
    onCollapseAll?: () => void;
  }) => (
    <div>
      <input
        aria-label="搜索章节或分卷"
        value={query}
        onChange={(event) => onQueryChange?.(event.target.value)}
      />
      {showTreeControls ? (
        <>
          <button type="button" onClick={() => onExpandAll?.()}>
            全部展开
          </button>
          <button type="button" onClick={() => onCollapseAll?.()}>
            全部折叠
          </button>
        </>
      ) : null}
      <button type="button">更多操作</button>
    </div>
  ),
}));

const mockWork = {
  id: 12,
  title: "测试作品",
  description: "章节模块测试用作品",
  status: "draft",
  updatedAt: "2026-03-01T08:00:00.000Z",
  totalWordCount: 12000,
  totalChapterCount: 3,
};

describe("ChaptersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams();
    currentParams = { id: "12" };

    mockUseWorkById.mockReturnValue({
      data: mockWork,
      isLoading: false,
    });
    mockUseChapterList.mockReturnValue({
      data: {
        data: [{ id: 101, title: "第一章", displayOrder: 1 }],
        pagination: { total: 1, limit: 10 },
      },
      isLoading: false,
    });
    mockUseDeleteChapter.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockUseUpdateChapter.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUseImportChapters.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it("应展示章节目录页骨架而不是旧的洞察卡片", () => {
    render(<ChaptersPage />);

    expect(screen.getByText("章节目录")).toBeInTheDocument();
    expect(screen.getByText("快速定位卷章结构，并进入目标章节继续阅读或编辑。"))
      .toBeInTheDocument();
    expect(screen.getByLabelText("搜索章节或分卷")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "更多操作" })).toBeInTheDocument();
    expect(screen.queryByText("排序状态")).not.toBeInTheDocument();
    expect(screen.queryByText("作品上下文")).not.toBeInTheDocument();
    expect(screen.getByText("第一章")).toBeInTheDocument();
    expect(mockUseChapterList).toHaveBeenCalledWith({ workId: 12, page: 1, limit: 9999 });
    expect(mockSetBreadcrumb).toHaveBeenCalledWith("works-12", "测试作品");
  });

  it("应将低频目录操作收纳到更多操作区域", () => {
    render(<ChaptersPage />);

    const moreActions = screen.getByRole("button", { name: "更多操作" }).parentElement;
    expect(moreActions).not.toBeNull();
    expect(within(moreActions as HTMLElement).queryByText("导入章节")).not.toBeInTheDocument();
  });

  it("没有章节时应展示草稿导向空状态入口", () => {
    mockUseChapterList.mockReturnValue({
      data: {
        data: [],
        pagination: { total: 0, limit: 10 },
      },
      isLoading: false,
    });

    render(<ChaptersPage />);

    expect(screen.getByText("暂无章节")).toBeInTheDocument();
    expect(
      screen.getByText(
        "当前作品还没有正式章节。可以先进入作品草稿继续创作，再从草稿发布为章节；也可以直接导入已有内容。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "前往作品草稿" })).toHaveAttribute(
      "href",
      "/works/12/drafts",
    );
    expect(screen.getAllByRole("button", { name: "导入章节" }).length).toBeGreaterThan(0);
  });

  it("无效作品 id 时应阻止加载章节模块主体", () => {
    currentParams = { id: "abc" };

    render(<ChaptersPage />);

    expect(screen.getByText("无效的作品 ID")).toBeInTheDocument();
    expect(screen.queryByText("章节管理")).not.toBeInTheDocument();
  });

  it("应支持打开调整章节号入口", async () => {
    const user = userEvent.setup();

    render(<ChaptersPage />);

    await user.click(screen.getByRole("button", { name: "调整章节号 第一章" }));

    expect(screen.getByText("调整章节号")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1")).toBeInTheDocument();
    expect(screen.getByText("将变为：第一章")).toBeInTheDocument();
  });

  it("确认重排后应按顺序提交受影响章节的更新 payload", async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});

    mockUseChapterList.mockReturnValue({
      data: {
        data: [
          { id: 101, title: "第一章 起点", displayOrder: 1 },
          { id: 102, title: "第二章 中段", displayOrder: 2 },
          { id: 103, title: "第三章 终点", displayOrder: 3 },
        ],
        pagination: { total: 3, limit: 9999 },
      },
      isLoading: false,
    });
    mockUseUpdateChapter.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    render(<ChaptersPage />);

    await user.click(screen.getByRole("button", { name: "调整章节号 第三章 终点" }));
    const input = screen.getByLabelText("目标章节号");
    await user.clear(input);
    await user.type(input, "2");
    await user.click(screen.getByRole("button", { name: "确认调整" }));

    expect(mutateAsync).toHaveBeenCalledTimes(2);
    expect(mutateAsync).toHaveBeenNthCalledWith(1, {
      id: 103,
      data: {
        displayOrder: 2,
        title: "第二章 终点",
      },
    });
    expect(mutateAsync).toHaveBeenNthCalledWith(2, {
      id: 102,
      data: {
        displayOrder: 3,
        title: "第三章 中段",
      },
    });
    expect(mockToastSuccess).toHaveBeenCalledWith("已将章节调整为第 2 章");
  });

  it("重排过程中任一更新失败时应提示错误并刷新列表", async () => {
    const user = userEvent.setup();
    const mutateAsync = vi
      .fn()
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("网络异常"));

    mockUseChapterList.mockReturnValue({
      data: {
        data: [
          { id: 101, title: "第一章 起点", displayOrder: 1 },
          { id: 102, title: "第二章 中段", displayOrder: 2 },
          { id: 103, title: "第三章 终点", displayOrder: 3 },
        ],
        pagination: { total: 3, limit: 9999 },
      },
      isLoading: false,
    });
    mockUseUpdateChapter.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    render(<ChaptersPage />);

    await user.click(screen.getByRole("button", { name: "调整章节号 第三章 终点" }));
    const input = screen.getByLabelText("目标章节号");
    await user.clear(input);
    await user.type(input, "2");
    await user.click(screen.getByRole("button", { name: "确认调整" }));

    expect(mutateAsync).toHaveBeenCalledTimes(2);
    expect(mockToastError).toHaveBeenCalledWith("重排失败：网络异常；正在刷新章节列表");
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("目标章节号与当前一致时不应提交更新请求", async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});

    mockUseChapterList.mockReturnValue({
      data: {
        data: [
          { id: 101, title: "第一章 起点", displayOrder: 1 },
          { id: 102, title: "第二章 中段", displayOrder: 2 },
        ],
        pagination: { total: 2, limit: 9999 },
      },
      isLoading: false,
    });
    mockUseUpdateChapter.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    render(<ChaptersPage />);

    await user.click(screen.getByRole("button", { name: "调整章节号 第二章 中段" }));
    expect(screen.getByDisplayValue("2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "确认调整" }));

    expect(mutateAsync).not.toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("应将稀疏 volumeId 映射为连续卷号展示", () => {
    mockUseChapterList.mockReturnValue({
      data: {
        data: [
          { id: 101, title: "第一章 起点", displayOrder: 1, volumeId: 10 },
          { id: 102, title: "第二章 中段", displayOrder: 2, volumeId: 10 },
          { id: 103, title: "第三章 终点", displayOrder: 3, volumeId: 30 },
        ],
        pagination: { total: 3, limit: 9999 },
      },
      isLoading: false,
    });

    render(<ChaptersPage />);

    expect(screen.getByText("第 1 卷")).toBeInTheDocument();
    expect(screen.getByText("第 2 卷")).toBeInTheDocument();
    expect(screen.queryByText("第 10 卷")).not.toBeInTheDocument();
  });

  it("所有章节都无 volumeId 时应退化为纯章节目录", () => {
    mockUseChapterList.mockReturnValue({
      data: {
        data: [
          { id: 101, title: "第一章 起点", displayOrder: 1 },
          { id: 102, title: "第二章 中段", displayOrder: 2 },
        ],
        pagination: { total: 2, limit: 9999 },
      },
      isLoading: false,
    });

    render(<ChaptersPage />);

    expect(screen.queryByText("第 1 卷")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "全部展开" })).not.toBeInTheDocument();
    expect(screen.getByText("第一章 起点")).toBeInTheDocument();
    expect(screen.getByTestId("chapter-flat-list")).toBeInTheDocument();
  });

  it("带 currentChapterId 时应自动切到目标所在分页并高亮章节", () => {
    currentSearchParams = new URLSearchParams("currentChapterId=104");
    mockUseChapterList.mockReturnValue({
      data: {
        data: [
          { id: 101, title: "第一章 起点", displayOrder: 1, volumeId: 10 },
          { id: 102, title: "第二章 中段", displayOrder: 2, volumeId: 10 },
          { id: 103, title: "第三章 终点", displayOrder: 3, volumeId: 20 },
          { id: 104, title: "第四章 余波", displayOrder: 4, volumeId: 30 },
        ],
        pagination: { total: 4, limit: 9999 },
      },
      isLoading: false,
    });

    render(<ChaptersPage />);

    expect(screen.getByText("第四章 余波")).toHaveAttribute("data-current", "true");
    expect(screen.getByText("2")).toHaveAttribute("aria-current", "page");
  });

  it("搜索命中分卷标题时应保留整组章节", async () => {
    const user = userEvent.setup();

    mockUseChapterList.mockReturnValue({
      data: {
        data: [
          { id: 101, title: "第一章 起点", displayOrder: 1, volumeId: 10 },
          { id: 102, title: "第二章 中段", displayOrder: 2, volumeId: 10 },
          { id: 103, title: "第三章 终点", displayOrder: 3, volumeId: 20 },
        ],
        pagination: { total: 3, limit: 9999 },
      },
      isLoading: false,
    });

    render(<ChaptersPage />);

    await user.type(screen.getByLabelText("搜索章节或分卷"), "第 1 卷");

    expect(screen.getByText("第一章 起点")).toBeInTheDocument();
    expect(screen.getByText("第二章 中段")).toBeInTheDocument();
    expect(screen.queryByText("第三章 终点")).not.toBeInTheDocument();
  });

  it("搜索命中章节标题时应只保留命中项", async () => {
    const user = userEvent.setup();

    mockUseChapterList.mockReturnValue({
      data: {
        data: [
          { id: 101, title: "第一章 起点", displayOrder: 1, volumeId: 10 },
          { id: 102, title: "第二章 中段", displayOrder: 2, volumeId: 10 },
          { id: 103, title: "第三章 终点", displayOrder: 3, volumeId: 20 },
        ],
        pagination: { total: 3, limit: 9999 },
      },
      isLoading: false,
    });

    render(<ChaptersPage />);

    await user.type(screen.getByLabelText("搜索章节或分卷"), "终点");

    expect(screen.getByText("第三章 终点")).toBeInTheDocument();
    expect(screen.queryByText("第二章 中段")).not.toBeInTheDocument();
  });

  it("搜索无结果时应展示空状态", async () => {
    const user = userEvent.setup();

    mockUseChapterList.mockReturnValue({
      data: {
        data: [
          { id: 101, title: "第一章 起点", displayOrder: 1, volumeId: 10 },
          { id: 102, title: "第二章 中段", displayOrder: 2, volumeId: 10 },
        ],
        pagination: { total: 2, limit: 9999 },
      },
      isLoading: false,
    });

    render(<ChaptersPage />);

    await user.type(screen.getByLabelText("搜索章节或分卷"), "不存在");

    expect(screen.getByText("没有匹配的章节或分卷")).toBeInTheDocument();
  });

  it("树模式下应支持全部展开与全部折叠", async () => {
    const user = userEvent.setup();

    mockUseChapterList.mockReturnValue({
      data: {
        data: [
          { id: 101, title: "第一章 起点", displayOrder: 1, volumeId: 10 },
          { id: 102, title: "第二章 中段", displayOrder: 2, volumeId: 10 },
          { id: 103, title: "第三章 终点", displayOrder: 3, volumeId: 20 },
        ],
        pagination: { total: 3, limit: 9999 },
      },
      isLoading: false,
    });

    render(<ChaptersPage />);

    await user.click(screen.getByRole("button", { name: "全部折叠" }));
    expect(screen.queryByText("第一章 起点")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "全部展开" }));
    expect(screen.getByText("第一章 起点")).toBeInTheDocument();
    expect(screen.getByText("第三章 终点")).toBeInTheDocument();
  });
});
