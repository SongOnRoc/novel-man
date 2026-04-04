import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DraftsPage from "./page";

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockUseDraftList = vi.fn();
const mockUseWorkList = vi.fn();
const mockUseDeleteDraft = vi.fn();
const mockUsePublishDraft = vi.fn();
const mockUseUpdateDraft = vi.fn();
const mockUseCreateDraft = vi.fn();
const mockUseChapterList = vi.fn();

let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: mockReplace,
  })),
  useSearchParams: vi.fn(() => currentSearchParams),
}));

vi.mock("@/hooks/work/useWorkService", () => ({
  useWorkList: (...args: unknown[]) => mockUseWorkList(...args),
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

describe("DraftsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams();

    mockUseWorkList.mockReturnValue({
      data: {
        data: [{ id: 12, title: "测试作品" }],
      },
      isLoading: false,
    });
    mockUseDraftList.mockReturnValue({
      data: {
        data: [{ id: 201, title: "未关联草稿", content: "内容", workId: 0 }],
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

  it("应固定查询未关联草稿并展示灵感草稿箱文案", () => {
    render(<DraftsPage />);

    expect(screen.getByText("灵感草稿箱")).toBeInTheDocument();
    expect(screen.getByText("这里只保留未关联作品的灵感草稿，方便统一沉淀零散想法。")).toBeInTheDocument();
    expect(mockUseDraftList).toHaveBeenCalledWith({
      workId: 0,
      page: 1,
      limit: 10,
      q: undefined,
    });
    expect(screen.getByText("未关联草稿")).toBeInTheDocument();
  });

  it("没有草稿时应展示灵感空状态", () => {
    mockUseDraftList.mockReturnValue({
      data: {
        data: [],
        pagination: { total: 0, limit: 10 },
      },
      isLoading: false,
    });

    render(<DraftsPage />);

    expect(screen.getByText("灵感空空如也")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始创作" })).toBeInTheDocument();
  });
});
