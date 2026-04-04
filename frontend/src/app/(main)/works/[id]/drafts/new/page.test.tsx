import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import WorkDraftNewPage from "./page";

const mockPush = vi.fn();
const mockUseWorkById = vi.fn();
let currentParams: { id: string } = { id: "12" };

vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => currentParams),
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}));

vi.mock("@/hooks/work/useWorkService", () => ({
  useWorkById: (...args: unknown[]) => mockUseWorkById(...args),
}));

vi.mock("@/components/common/GlobalLoading", () => ({
  GlobalLoading: () => <div>加载中</div>,
}));

vi.mock("@/features/drafts/components/draft-form", () => ({
  DraftForm: ({ workId, onSuccessNavigateTo }: { workId?: number; onSuccessNavigateTo?: string }) => (
    <div>
      <span>草稿表单</span>
      <span>{String(workId)}</span>
      <span>{onSuccessNavigateTo}</span>
    </div>
  ),
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

describe("WorkDraftNewPage", () => {
  it("应在作品上下文中渲染草稿表单", () => {
    mockUseWorkById.mockReturnValue({
      data: mockWork,
      isLoading: false,
    });

    render(<WorkDraftNewPage />);

    expect(screen.getAllByText("新建作品草稿").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "返回作品" })).toBeInTheDocument();
    expect(screen.getByText("草稿表单")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("/works/12/drafts")).toBeInTheDocument();
  });
});
