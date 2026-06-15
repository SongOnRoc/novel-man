import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WorkDraftNewPage from "./page";

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockSetQueryData = vi.fn();
const mockUseWorkById = vi.fn();
const mockCreateDraftAsync = vi.fn();
let currentParams: { id: string } = { id: "12" };

vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => currentParams),
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: mockReplace,
  })),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ setQueryData: mockSetQueryData }),
}));

vi.mock("@/hooks/work/useWorkService", () => ({
  useWorkById: (...args: unknown[]) => mockUseWorkById(...args),
}));

vi.mock("@/hooks/draft/useDraftService", () => ({
  draftKeys: { detail: (id: number) => ["drafts", "detail", id] },
  useCreateDraft: () => ({ mutateAsync: mockCreateDraftAsync, isPending: false }),
}));

vi.mock("@/components/common/GlobalLoading", () => ({
  GlobalLoading: () => <div>加载中</div>,
}));

// TiptapEditor 是带 CSS/编辑器依赖的重组件，这里替身只暴露页面接线用到的关键 props，
// 并提供按钮触发 onSave / onBack 以验证创建跳转流程。
vi.mock("@/features/editor/components/TiptapEditor", () => ({
  TiptapEditor: ({
    workId,
    backLabel,
    isSaving,
    onSave,
    onBack,
  }: {
    workId?: string;
    backLabel?: string;
    isSaving?: boolean;
    onSave: (data: { title: string; content: string; wordCount: number }) => void;
    onBack: () => void;
  }) => (
    <div data-testid="tiptap-editor">
      <span data-testid="editor-work-id">{workId}</span>
      <span data-testid="editor-back-label">{backLabel}</span>
      <span data-testid="editor-is-saving">{String(isSaving)}</span>
      <button
        type="button"
        onClick={() => onSave({ title: "首章草稿", content: "正文内容", wordCount: 4 })}
      >
        触发保存
      </button>
      <button type="button" onClick={() => onBack()}>
        触发返回
      </button>
    </div>
  ),
}));

const mockWork = {
  id: 12,
  title: "测试作品",
  description: "新建草稿页测试用作品",
  status: "draft",
  updatedAt: "2026-03-01T08:00:00.000Z",
  totalWordCount: 12000,
  totalChapterCount: 3,
};

describe("WorkDraftNewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentParams = { id: "12" };
    mockUseWorkById.mockReturnValue({ data: mockWork, isLoading: false });
    mockCreateDraftAsync.mockResolvedValue({ id: 777 });
  });

  it("应在作品上下文中渲染全屏编辑器并传入返回草稿入口", () => {
    render(<WorkDraftNewPage />);

    expect(screen.getByTestId("tiptap-editor")).toBeInTheDocument();
    expect(screen.getByTestId("editor-work-id")).toHaveTextContent("12");
    expect(screen.getByTestId("editor-back-label")).toHaveTextContent("返回草稿");
  });

  it("无效作品 id 时应展示错误态而不渲染编辑器", () => {
    currentParams = { id: "abc" };

    render(<WorkDraftNewPage />);

    expect(screen.getByText("无效的作品 ID")).toBeInTheDocument();
    expect(screen.queryByTestId("tiptap-editor")).not.toBeInTheDocument();
  });

  it("首次保存应创建草稿并跳转到作品内编辑页", async () => {
    const user = userEvent.setup();

    render(<WorkDraftNewPage />);

    await user.click(screen.getByRole("button", { name: "触发保存" }));

    expect(mockCreateDraftAsync).toHaveBeenCalledWith({
      title: "首章草稿",
      content: "正文内容",
      wordCount: 4,
      workId: 12,
    });
    expect(mockReplace).toHaveBeenCalledWith("/works/12/drafts/777/edit");
  });
});
