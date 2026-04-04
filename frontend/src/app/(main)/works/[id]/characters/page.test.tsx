import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CharactersPage from "./page";

const mockPush = vi.fn();
const mockSetBreadcrumb = vi.fn();
const mockUseWorkById = vi.fn();
const mockUseCharacters = vi.fn();
const mockUseDeleteCharacter = vi.fn();

let currentParams: { id: string } = { id: "12" };

vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => currentParams),
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
}));

vi.mock("@/contexts/BreadcrumbContext", () => ({
  useBreadcrumb: vi.fn(() => ({
    setBreadcrumb: mockSetBreadcrumb,
  })),
}));

vi.mock("@/hooks/work/useWorkService", () => ({
  useWorkById: (...args: unknown[]) => mockUseWorkById(...args),
}));

vi.mock("@/hooks/character/useCharacters", () => ({
  useCharacters: (...args: unknown[]) => mockUseCharacters(...args),
  useDeleteCharacter: () => mockUseDeleteCharacter(),
}));

vi.mock("@/components/common/DeleteItemDialog", () => ({
  DeleteItemDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="delete-character-dialog">删除角色对话框</div> : null,
}));

vi.mock("@/components/common/GlobalLoading", () => ({
  GlobalLoading: () => <div>加载中</div>,
}));

vi.mock("@/features/characters/components/CharacterCard", () => ({
  CharacterCard: ({
    character,
  }: {
    character: { id: number; name: string; occupation?: string | null };
  }) => <div>{character.name}</div>,
}));

const mockWork = {
  id: 12,
  title: "测试作品",
  description: "角色模块测试用作品",
  status: "draft",
  updatedAt: "2026-03-01T08:00:00.000Z",
  totalWordCount: 12000,
  totalChapterCount: 3,
};

describe("CharactersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentParams = { id: "12" };

    mockUseWorkById.mockReturnValue({
      data: mockWork,
      isLoading: false,
    });
    mockUseCharacters.mockReturnValue({
      data: {
        data: [
          { id: 201, name: "林深", occupation: "调查员" },
          { id: 202, name: "季遥", occupation: "医生" },
        ],
      },
      isLoading: false,
    });
    mockUseDeleteCharacter.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it("应在作品工作台壳层中展示角色管理与角色资产", () => {
    render(<CharactersPage />);

    expect(screen.getByText("测试作品")).toBeInTheDocument();
    expect(screen.getByText("维护当前作品相关角色，并保留每个子页面自己的独立视觉结构。")).toBeInTheDocument();
    expect(screen.getByText("数据边界")).toBeInTheDocument();
    expect(screen.getByText("暂未实现严格作品隔离")).toBeInTheDocument();
    expect(screen.getByText("角色结果数")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "返回作品总览" })).toHaveAttribute(
      "href",
      "/works/12",
    );
    expect(screen.getByRole("link", { name: "创建角色" })).toHaveAttribute(
      "href",
      "/works/12/characters/new",
    );
    expect(screen.getByPlaceholderText("搜索角色姓名或身份")).toBeInTheDocument();
    expect(
      screen.getByText(
        "当前搜索结果用于辅助整理角色资产，不表示这些角色已经全部与当前作品建立强关联。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("林深")).toBeInTheDocument();
    expect(screen.getByText("季遥")).toBeInTheDocument();
    expect(mockUseWorkById).toHaveBeenCalledWith(12);
    expect(mockUseCharacters).toHaveBeenCalledWith(12);
    expect(mockSetBreadcrumb).toHaveBeenCalledWith("works-12", "测试作品");
  });

  it("没有角色时应展示带数据边界说明的空状态", () => {
    mockUseCharacters.mockReturnValue({
      data: {
        data: [],
      },
      isLoading: false,
    });

    render(<CharactersPage />);

    expect(screen.getByText("暂无角色")).toBeInTheDocument();
    expect(
      screen.getByText(
        "当前还没有可展示的角色数据。你可以先创建角色资产；后续待后端支持后，再收敛为严格的作品内角色列表。",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "创建角色" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "创建角色" })[0]).toHaveAttribute(
      "href",
      "/works/12/characters/new",
    );
    expect(screen.getAllByRole("link", { name: "返回作品总览" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "返回作品总览" })[0]).toHaveAttribute(
      "href",
      "/works/12",
    );
  });

  it("作品不存在时应展示兜底提示", () => {
    mockUseWorkById.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    render(<CharactersPage />);

    expect(screen.getByText("作品不存在")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回作品列表" })).toBeInTheDocument();
    expect(screen.queryByText("角色管理")).not.toBeInTheDocument();
  });

  it("作品加载中时应优先展示全局加载态", () => {
    mockUseWorkById.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<CharactersPage />);

    expect(screen.getByText("加载中")).toBeInTheDocument();
    expect(screen.queryByText("角色资产")).not.toBeInTheDocument();
  });

  it("角色加载中时应在工作台内容区展示加载态", () => {
    mockUseCharacters.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<CharactersPage />);

    expect(screen.getByText("数据边界")).toBeInTheDocument();
    expect(screen.getByText("加载中")).toBeInTheDocument();
  });

  it("应支持按角色姓名或身份搜索", () => {
    render(<CharactersPage />);

    const input = screen.getByPlaceholderText("搜索角色姓名或身份");
    fireEvent.change(input, { target: { value: "医生" } });

    expect(screen.getByText("季遥")).toBeInTheDocument();
    expect(screen.queryByText("林深")).not.toBeInTheDocument();
    expect(screen.getByText("当前按“医生”过滤结果。")).toBeInTheDocument();
  });

  it("无效作品 id 时应阻止加载角色模块主体", () => {
    currentParams = { id: "abc" };

    render(<CharactersPage />);

    expect(screen.getByText("无效的作品 ID")).toBeInTheDocument();
    expect(screen.queryByText("角色管理")).not.toBeInTheDocument();
    expect(mockUseWorkById).toHaveBeenCalledWith(undefined);
    expect(mockUseCharacters).toHaveBeenCalledWith(undefined);
  });
});
