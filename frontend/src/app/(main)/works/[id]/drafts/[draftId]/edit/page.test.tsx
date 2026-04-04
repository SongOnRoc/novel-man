import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WorkDraftEditPage from "./page";

const mockPush = vi.fn();
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
const mockUseDraftById = vi.fn();
const mockUseUpdateDraft = vi.fn();
const mockUsePublishDraft = vi.fn();
const mockUseChapterList = vi.fn();
const mockUseWorkList = vi.fn();
const mockTiptapEditor = vi.fn();

let currentParams: { id: string; draftId: string } = { id: "12", draftId: "201" };

vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => currentParams),
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}));

vi.mock("@/hooks/draft/useDraftService", () => ({
  useDraftById: (...args: unknown[]) => mockUseDraftById(...args),
  useUpdateDraft: () => mockUseUpdateDraft(),
  usePublishDraft: () => mockUsePublishDraft(),
}));

vi.mock("@/hooks/chapter/useChapterService", () => ({
  useChapterList: (...args: unknown[]) => mockUseChapterList(...args),
}));

vi.mock("@/hooks/work/useWorkService", () => ({
  useWorkList: (...args: unknown[]) => mockUseWorkList(...args),
}));

vi.mock("@/components/common/GlobalLoading", () => ({
  GlobalLoading: () => <div>加载中</div>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}));

vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/features/editor/components/TiptapEditor", () => ({
  TiptapEditor: (props: Record<string, unknown>) => {
    mockTiptapEditor(props);
    return (
      <div>
        <div>草稿编辑器</div>
        <button type="button" onClick={() => (props.onBack as (() => void) | undefined)?.()}>
          返回
        </button>
        <button type="button" onClick={() => (props.onPublish as (() => void) | undefined)?.()}>
          打开发布弹窗
        </button>
      </div>
    );
  },
}));

const mockDraft = {
  id: 201,
  title: "绑定草稿",
  content: "内容",
  workId: 12,
};

describe("WorkDraftEditPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentParams = { id: "12", draftId: "201" };

    mockUseDraftById.mockReturnValue({
      data: mockDraft,
      isLoading: false,
      error: null,
    });
    mockUseUpdateDraft.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUsePublishDraft.mockReturnValue({
      mutate: vi.fn(),
    });
    mockUseChapterList.mockReturnValue({
      data: {
        data: [{ id: 101, title: "第一章", displayOrder: 1 }],
        pagination: { total: 1, limit: 9999 },
      },
      isLoading: false,
    });
    mockUseWorkList.mockReturnValue({
      data: {
        data: [{ id: 12, title: "测试作品" }],
      },
    });
  });

  it("应直接渲染与全局一致的草稿编辑器，并返回作品详情", async () => {
    const user = userEvent.setup();

    render(<WorkDraftEditPage />);

    expect(screen.getByText("草稿编辑器")).toBeInTheDocument();
    expect(screen.queryByText("编辑作品草稿")).not.toBeInTheDocument();
    expect(mockTiptapEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        initialContent: {
          title: "绑定草稿",
          content: "内容",
        },
        workId: "12",
        contentId: "201",
      }),
    );

    await user.click(screen.getByRole("button", { name: "返回" }));
    expect(mockPush).toHaveBeenCalledWith("/works/12");
  });

  it("草稿不属于当前作品时应提示并返回作品详情", async () => {
    const user = userEvent.setup();

    mockUseDraftById.mockReturnValue({
      data: { ...mockDraft, workId: 99 },
      isLoading: false,
      error: null,
    });

    render(<WorkDraftEditPage />);

    expect(screen.getByText("草稿不存在")).toBeInTheDocument();
    expect(screen.getByText("该草稿可能已被删除，或不属于当前作品。")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "返回作品详情" }));
    expect(mockPush).toHaveBeenCalledWith("/works/12");
  });
});
