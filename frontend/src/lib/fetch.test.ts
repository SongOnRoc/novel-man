import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("next-auth/react", () => {
  return {
    getSession: vi.fn(async () => null),
    signOut: vi.fn(async () => undefined),
  };
});

import { customFetch } from "./fetch";

describe("customFetch error logging", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("409 应作为业务分支：不触发 console.error，且保留 draftCount", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    globalThis.fetch = vi.fn(async () => {
      return new Response(JSON.stringify({ data: { draftCount: 3 } }), {
        status: 409,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;

    await expect(
      customFetch({ url: "/works/69", method: "DELETE" })
    ).rejects.toMatchObject({ code: 409, data: { draftCount: 3 } });

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("5xx 才触发 console.error", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    globalThis.fetch = vi.fn(async () => {
      return new Response(JSON.stringify({ message: "boom" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;

    await expect(
      customFetch({ url: "/works/69", method: "DELETE" })
    ).rejects.toMatchObject({ code: 500, message: "boom" });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0]?.[0]).toContain("API Error 500");
  });
});
