import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { useDraftCreationController } from "./useDraftCreationController";

// useDraftCreationController 内部使用 useQueryClient 预填详情缓存，
// 因此 renderHook 需要包裹 QueryClientProvider。每次用全新 client 隔离用例。
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("useDraftCreationController", () => {
  it("未选择模板时应使用空白模板并使用默认标题", async () => {
    const createDraft = vi.fn().mockResolvedValue({ id: 101 });
    const onNavigate = vi.fn();

    const { result } = renderHook(() =>
      useDraftCreationController({
        initialWorkId: undefined,
        createDraft,
        onNavigate,
      }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.openDialog();
    });

    await act(async () => {
      await result.current.confirmCreate();
    });

    expect(createDraft).toHaveBeenCalledWith({
      title: "无标题草稿",
      content: "",
      workId: undefined,
    });
    expect(onNavigate).toHaveBeenCalledWith("/drafts/101/edit");
  });

  it("选择模板后应注入模板内容并携带作品 ID", async () => {
    const createDraft = vi.fn().mockResolvedValue({ data: { id: 202 } });
    const onNavigate = vi.fn();

    const { result } = renderHook(() =>
      useDraftCreationController({
        initialWorkId: 9,
        createDraft,
        onNavigate,
      }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.openDialog(12);
      result.current.updateValues({ title: "剧情草稿", templateKey: "plot" });
    });

    await act(async () => {
      await result.current.confirmCreate();
    });

    expect(createDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "剧情草稿",
        workId: 12,
      }),
    );
    expect(createDraft.mock.calls[0][0].content).toContain("剧情推进草稿");
    expect(onNavigate).toHaveBeenCalledWith("/drafts/202/edit");
  });

  it("创建失败时应保留输入并展示错误", async () => {
    const createDraft = vi.fn().mockRejectedValue(new Error("网络异常"));

    const { result } = renderHook(() =>
      useDraftCreationController({
        createDraft,
        onNavigate: vi.fn(),
      }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.openDialog();
      result.current.updateValues({ title: "保留标题", templateKey: "scene" });
    });

    await act(async () => {
      await result.current.confirmCreate();
    });

    expect(result.current.open).toBe(true);
    expect(result.current.values.title).toBe("保留标题");
    expect(result.current.values.templateKey).toBe("scene");
    expect(result.current.errorMessage).toContain("创建失败");
  });

  it("作品上下文创建后应跳转到作品内编辑页", async () => {
    const createDraft = vi.fn().mockResolvedValue({ id: 404 });
    const onNavigate = vi.fn();
    const getDraftEditPath = vi.fn((draftId: number, workId?: number) =>
      `/works/${workId}/drafts/${draftId}/edit`,
    );

    const { result } = renderHook(() =>
      useDraftCreationController({
        initialWorkId: 15,
        createDraft,
        onNavigate,
        getDraftEditPath,
      }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.openDialog();
    });

    await act(async () => {
      await result.current.confirmCreate();
    });

    expect(getDraftEditPath).toHaveBeenCalledWith(404, 15);
    expect(onNavigate).toHaveBeenCalledWith("/works/15/drafts/404/edit");
  });

  it("创建进行中时不应重复提交", async () => {
    const deferred = createDeferred<{ id: number }>();
    const createDraft = vi.fn().mockReturnValue(deferred.promise);

    const { result } = renderHook(() =>
      useDraftCreationController({
        createDraft,
        onNavigate: vi.fn(),
      }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.openDialog();
    });

    let firstCreate: Promise<void>;
    let secondCreate: Promise<void>;

    await act(async () => {
      firstCreate = result.current.confirmCreate();
      secondCreate = result.current.confirmCreate();
      await Promise.resolve();
    });

    expect(createDraft).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferred.resolve({ id: 505 });
      await Promise.all([firstCreate, secondCreate]);
    });

    await waitFor(() => {
      expect(result.current.isCreating).toBe(false);
    });
  });
});
