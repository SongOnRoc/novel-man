import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WorkDraftsPage from "./page";

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockSetBreadcrumb = vi.fn();
const mockUseWorkById = vi.fn();
const mockUseDraftList = vi.fn();
const mockUseDeleteDraft = vi.fn();
const mockUsePublishDraft = vi.fn();
const mockUseUpdateDraft = vi.fn();
const mockUseCreateDraft = vi.fn();
const mockUseChapterList = vi.fn();

let currentSearchParams = new URLSearchParams();
let currentParams: { id: string } = { id: "12" };

vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => currentParams),
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: mockReplace,
  })),
  useSearchParams: vi.fn(() => currentSearchParams),
}));

vi.mock("@/contexts/BreadcrumbContext", () => ({
  useBreadcrumb: vi.fn(() => ({
    setBreadcrumb: mockSetBreadcrumb,
  })),
}));

vi.mock("@/hooks/work/useWorkService", () => ({
  useWorkById: (...args: unknown[]) => mockUseWorkById(...args),
}));

vi.mock("@/hooks/draft/useDraftService", () => ({
  useDraftList: (...args: unknown[]) => mockUseDraftList(...args),
  useDeleteDraft: () => mockUseDeleteDraft(),
  usePublishDraft: () => mockUsePublishDraft(),
  useUpdateDraft: () => mockUseUpdateDraft(),
  useCreateDraft: () => mockUseCreateDraft(),
}));

vi.mock("@/hooks/chapter/useChapterService", () => ({
  useChapterList: (...args: unknown[]) => mockUseChapterList(...args),
}));

vi.mock("@/components/common/DeleteItemDialog", () => ({
  DeleteItemDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="delete-draft-dialog">删除草稿对话框</div> : null,
}));

vi.mock("@/components/common/GlobalLoading", () => ({
  GlobalLoading: () => <div>加载中</div>,
}));

vi.mock("@/features/drafts/components/NewDraftDialog", () => ({
  NewDraftDialog: () => <div>新建草稿弹窗</div>,
}));

const mockWork = {
  id: 12,
  title: "测试作品",
  description: "作品草稿页测试用作品",
  status: "draft",
  updatedAt: "2026-03-01T08:00:00.000Z",
  totalWordCount: 12000,
  totalChapterCount: 3,
};

describe("WorkDraftsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams();
    currentParams = { id: "12" };

    mockUseWorkById.mockReturnValue({
      data: mockWork,
      isLoading: false,
    });
    mockUseDraftList.mockReturnValue({
      data: {
        data: [{ id: 201, title: "绑定草稿", content: "内容", workId: 12 }],
        pagination: { total: 1, limit: 10 },
      },
      isLoading: false,
    });
    mockUseDeleteDraft.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockUsePublishDraft.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockUseUpdateDraft.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUseCreateDraft.mockReturnValue({
      mutateAsync: vi.fn(),
    });
    mockUseChapterList.mockReturnValue({
      data: {
        data: [],
        pagination: { total: 0, limit: 9999 },
      },
      isLoading: false,
    });
  });

  it("应在作品工作台内展示作品草稿列表与作品内链接", () => {
    render(<WorkDraftsPage />);

    expect(screen.getAllByText("测试作品").length).toBeGreaterThan(0);
    expect(screen.getByText("管理当前作品下的创作草稿，并在准备就绪后发布为正式章节。")).toBeInTheDocument();
    expect(screen.getByText("作品草稿列表")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看未关联草稿箱" })).toHaveAttribute(
      "href",
      "/drafts",
    );
    expect(screen.getByRole("link", { name: "新建作品草稿" })).toHaveAttribute(
      "href",
      "/works/12/drafts/new",
    );
    expect(screen.getByText("绑定草稿")).toBeInTheDocument();
    expect(mockUseDraftList).toHaveBeenCalledWith({
      workId: 12,
      page: 1,
      limit: 10,
      q: undefined,
    });
    expect(mockUseChapterList).toHaveBeenCalledWith({
      workId: 12,
      page: 1,
      limit: 9999,
    });
    expect(mockSetBreadcrumb).toHaveBeenCalledWith("works-12", "测试作品");
  });

  it("没有草稿时应展示作品内空状态", () => {
    mockUseDraftList.mockReturnValue({
      data: {
        data: [],
        pagination: { total: 0, limit: 10 },
      },
      isLoading: false,
    });

    render(<WorkDraftsPage />);

    expect(screen.getByText("这部作品暂无草稿")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "新建作品草稿" })[0]).toHaveAttribute(
      "href",
      "/works/12/drafts/new",
    );
  });
});
