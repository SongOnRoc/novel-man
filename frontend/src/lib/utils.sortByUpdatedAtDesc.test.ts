import { describe, expect, it } from "vitest";

import { sortByUpdatedAtDesc } from "@/lib/utils";

interface MockItem {
  id: number;
  updatedAt?: string | null;
}

describe("sortByUpdatedAtDesc", () => {
  it("应按 updatedAt 从新到旧排序", () => {
    const input: MockItem[] = [
      { id: 1, updatedAt: "2026-01-01T10:00:00.000Z" },
      { id: 2, updatedAt: "2026-02-01T10:00:00.000Z" },
      { id: 3, updatedAt: "2025-12-01T10:00:00.000Z" },
    ];

    const result = sortByUpdatedAtDesc(input);

    expect(result.map((item) => item.id)).toEqual([2, 1, 3]);
  });

  it("应将空值和非法日期排在后面", () => {
    const input: MockItem[] = [
      { id: 1, updatedAt: null },
      { id: 2, updatedAt: "invalid-date" },
      { id: 3, updatedAt: "2026-02-01T10:00:00.000Z" },
      { id: 4 },
    ];

    const result = sortByUpdatedAtDesc(input);

    expect(result[0].id).toBe(3);
    expect(result.slice(1).map((item) => item.id).sort()).toEqual([1, 2, 4]);
  });

  it("不应修改原数组", () => {
    const input: MockItem[] = [
      { id: 1, updatedAt: "2026-01-01T10:00:00.000Z" },
      { id: 2, updatedAt: "2026-02-01T10:00:00.000Z" },
    ];

    const snapshot = [...input];
    sortByUpdatedAtDesc(input);

    expect(input).toEqual(snapshot);
  });
});
