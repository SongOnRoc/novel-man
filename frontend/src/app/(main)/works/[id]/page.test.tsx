import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WorkDetailsPage from "./page";

const mockPush = vi.fn();
const mockSetBreadcrumb = vi.fn();
const mockUseWorkById = vi.fn();
const mockUseChapterList = vi.fn();
const mockUseDraftList = vi.fn();

let currentParams: { id: string } = { id: "12" };

vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => currentParams),
  useRouter: vi.fn(() => ({
    push: mockPush,
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
  useChapterList: (...args: unknown[]) => mockUseChapterList(...args),
}));

vi.mock("@/hooks/draft/useDraftService", () => ({
  useDraftList: (...args: unknown[]) => mockUseDraftList(...args),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div>骨架屏</div>,
}));

const mockWork = {
  id: 12,
  title: "测试作品",
  description: "一个用于验证作品管理页新版布局的故事。",
  status: "draft",
  updatedAt: "2026-03-01T08:00:00.000Z",
  totalWordCount: 12345,
  totalChapterCount: 6,
};

describe("WorkDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentParams = { id: "12" };

    mockUseWorkById.mockReturnValue({
      data: mockWork,
      isLoading: false,
    });
    mockUseChapterList.mockReturnValue({
      data: {
        data: [{ id: 101, title: "第一章", wordCount: 1800, displayOrder: 1 }],
        pagination: { total: 1, limit: 5 },
      },
      isLoading: false,
    });
    mockUseDraftList.mockReturnValue({
      data: {
        data: [{ id: 201, title: "绑定草稿", updatedAt: "2026-03-02T08:00:00.000Z" }],
        pagination: { total: 1, limit: 5 },
      },
      isLoading: false,
    });
  });

  it("应展示符合作品工作台定位的上下结构与关键入口", async () => {
    const user = userEvent.setup();

    render(<WorkDetailsPage />);

    expect(screen.getAllByRole("heading", { name: "测试作品" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "返回作品列表" })).toHaveAttribute("href", "/works");
    expect(screen.getAllByText("草稿中").length).toBeGreaterThan(0);
    expect(screen.getAllByText("字数").length).toBeGreaterThan(0);
    expect(screen.getAllByText("章节").length).toBeGreaterThan(0);
    expect(screen.getAllByText("已绑定草稿").length).toBeGreaterThan(0);
    expect(screen.getByText("章节列表")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "新建草稿" })[0]).toHaveAttribute(
      "href",
      "/works/12/drafts/new",
    );
    expect(screen.getAllByRole("link", { name: "新建章节" }).some((link) => link.getAttribute("href") === "/works/12/chapters")).toBe(true);
    expect(screen.getAllByRole("link", { name: "编辑作品" }).some((link) => link.getAttribute("href") === "/works/12/edit")).toBe(true);
    expect(screen.getByRole("button", { name: "更多操作" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "章节" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "草稿" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "大纲" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "角色" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "设定" })).toBeInTheDocument();
    expect(screen.getByText("章节列表")).toBeInTheDocument();
    expect(screen.getByText("第一章")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "进入章节管理页" })).toHaveAttribute(
      "href",
      "/works/12/chapters",
    );
    expect(screen.getByRole("link", { name: "从草稿发布章节" })).toHaveAttribute(
      "href",
      "/works/12/drafts",
    );

    await user.click(screen.getByRole("button", { name: "更多操作" }));

    expect(screen.getAllByRole("link", { name: "编辑作品" }).some((link) => link.getAttribute("href") === "/works/12/edit")).toBe(true);
  });

  it("没有章节和草稿时应展示作品内空状态入口", () => {
    mockUseChapterList.mockReturnValue({
      data: {
        data: [],
        pagination: { total: 0, limit: 5 },
      },
      isLoading: false,
    });
    mockUseDraftList.mockReturnValue({
      data: {
        data: [],
        pagination: { total: 0, limit: 5 },
      },
      isLoading: false,
    });

    render(<WorkDetailsPage />);

    expect(screen.getByText("暂无章节")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "创建第一章草稿" })).toHaveAttribute(
      "href",
      "/works/12/drafts/new",
    );
  });

  it("无效作品 id 时应阻止加载工作台", () => {
    currentParams = { id: "abc" };

    render(<WorkDetailsPage />);

    expect(screen.getByText("无效的作品 ID")).toBeInTheDocument();
    expect(screen.queryByText("内容管理")).not.toBeInTheDocument();
  });
});
