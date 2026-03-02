import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useDraftList } from "./useDraftService";
import { getDraftsService } from "@/lib/services/draft.service";
import { toCamelCase } from "@/lib/utils";

vi.mock("@/lib/services/draft.service", () => ({
  getDraftsService: vi.fn(),
  getDraftByIdService: vi.fn(),
  createDraftService: vi.fn(),
  updateDraftService: vi.fn(),
  deleteDraftService: vi.fn(),
  publishDraftService: vi.fn(),
}));

vi.mock("@/lib/utils", () => ({
  toCamelCase: vi.fn((data) => data),
  toSnakeCase: vi.fn((data) => data),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ refresh: vi.fn() })),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: vi.fn(),
  };
});

describe("useDraftService - useDraftList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useQueryClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      invalidateQueries: vi.fn(),
    });
    (useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
    });
  });

  it("传入有效 workId 时应转为 work_id 查询参数", () => {
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderHook(() => useDraftList({ workId: 12, page: 1, limit: 10 }));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["drafts", "list", { page: 1, limit: 10, work_id: 12 }],
        queryFn: expect.any(Function),
        select: expect.any(Function),
      }),
    );

    const queryFn = (useQuery as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].queryFn;
    queryFn();
    expect(getDraftsService).toHaveBeenCalledWith({ page: 1, limit: 10, work_id: 12 });

    const selectFn = (useQuery as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].select;
    selectFn({ some_data: "value" });
    expect(toCamelCase).toHaveBeenCalledWith({ some_data: "value" });
  });

  it("传入非法 workId（NaN）时不应携带 work_id", () => {
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderHook(() => useDraftList({ workId: Number.NaN, page: 2, limit: 10 }));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["drafts", "list", { page: 2, limit: 10 }],
      }),
    );

    const queryFn = (useQuery as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].queryFn;
    queryFn();
    expect(getDraftsService).toHaveBeenCalledWith({ page: 2, limit: 10 });
  });
});
