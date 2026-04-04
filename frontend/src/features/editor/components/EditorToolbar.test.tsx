import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Editor } from "@tiptap/react";
import React from "react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

import { useBookmarks } from "@/hooks/editor/useBookmarks";

import { EditorToolbar } from "./EditorToolbar";


// Mock 子组件
vi.mock("./BookmarkManager", () => ({
  BookmarkManager: (props: any) => (
    <div data-testid="bookmark-manager">
      <button onClick={() => props.addBookmark()}>Add Bookmark</button>
    </div>
  ),
}));
vi.mock("./EditorSettings", () => ({
  EditorSettings: ({ onSettingsChange, settings }: any) => (
    <div data-testid="editor-settings">
      <button
        onClick={() =>
          onSettingsChange({
            ...settings,
            showWordCount: !settings.showWordCount,
          })
        }
      >
        Toggle Word Count
      </button>
    </div>
  ),
}));
vi.mock("./FocusMode", () => ({
  FocusMode: () => <div data-testid="focus-mode" />,
}));
vi.mock("./FindReplace", () => ({
  FindReplace: () => <div data-testid="find-replace" />,
}));
vi.mock("@/components/common/lookup/SettingsLookup", () => ({
  SettingsLookup: () => <div data-testid="settings-lookup" />,
}));

// Mock useBookmarks hook
vi.mock("@/hooks/editor/useBookmarks");

// Mock Tiptap Editor
const mockChain = {
  focus: vi.fn().mockReturnThis(),
  toggleBold: vi.fn().mockReturnThis(),
  toggleItalic: vi.fn().mockReturnThis(),
  toggleUnderline: vi.fn().mockReturnThis(),
  setTextAlign: vi.fn().mockReturnThis(),
  toggleHeading: vi.fn().mockReturnThis(),
  toggleBulletList: vi.fn().mockReturnThis(),
  toggleOrderedList: vi.fn().mockReturnThis(),
  undo: vi.fn().mockReturnThis(),
  redo: vi.fn().mockReturnThis(),
  run: vi.fn(),
};

const mockEditor = {
  isActive: vi.fn().mockReturnValue(false),
  chain: () => mockChain,
  can: () => ({
    chain: () => ({
      focus: () => ({
        undo: () => ({ run: () => true }),
        redo: () => ({ run: () => true }),
      }),
    }),
  }),
} as unknown as Editor;

const mockBookmarks = {
  bookmarks: [],
  addBookmark: vi.fn(),
  removeBookmark: vi.fn(),
  updateBookmarkLabel: vi.fn(),
  jumpToBookmark: vi.fn(),
};

describe("EditorToolbar", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    (useBookmarks as ReturnType<typeof vi.fn>).mockReturnValue(mockBookmarks);
    // 重置所有 mock chain 上的函数
    Object.values(mockChain).forEach((mockFn) => {
      if (typeof mockFn === "function") {
        mockFn.mockClear();
      }
    });
    mockEditor.isActive = vi.fn().mockReturnValue(false);
    const can = {
      chain: vi.fn().mockReturnValue({
        focus: vi.fn().mockReturnValue({
          undo: vi.fn().mockReturnValue({ run: vi.fn().mockReturnValue(true) }),
          redo: vi.fn().mockReturnValue({ run: vi.fn().mockReturnValue(true) }),
        }),
      }),
    };
    mockEditor.can = vi.fn().mockReturnValue(can);
  });

  afterEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("should not render if editor is null", () => {
    const { container } = render(
      <EditorToolbar editor={null} editorContainerId="test-id" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render all toolbar elements when editor is provided", () => {
    render(
      <EditorToolbar
        editor={mockEditor}
        editorContainerId="test-id"
        workId="w1"
      />,
    );
    expect(screen.getByLabelText("加粗")).toBeInTheDocument();
    expect(screen.getByLabelText("斜体")).toBeInTheDocument();
    expect(screen.getByTestId("bookmark-manager")).toBeInTheDocument();
    expect(screen.getByTestId("editor-settings")).toBeInTheDocument();
    expect(screen.getByTestId("focus-mode")).toBeInTheDocument();
    expect(screen.getByTestId("find-replace")).toBeInTheDocument();
    expect(screen.getByTestId("settings-lookup")).toBeInTheDocument();
  });

  it("should call toggleBold when bold button is clicked", async () => {
    render(<EditorToolbar editor={mockEditor} editorContainerId="test-id" />);
    await user.click(screen.getByLabelText("加粗"));
    expect(mockChain.toggleBold).toHaveBeenCalled();
    expect(mockChain.run).toHaveBeenCalled();
  });

  it("should call toggleItalic when italic button is clicked", async () => {
    render(<EditorToolbar editor={mockEditor} editorContainerId="test-id" />);
    await user.click(screen.getByLabelText("斜体"));
    expect(mockChain.toggleItalic).toHaveBeenCalled();
    expect(mockChain.run).toHaveBeenCalled();
  });

  it("should call toggleUnderline when underline button is clicked", async () => {
    render(<EditorToolbar editor={mockEditor} editorContainerId="test-id" />);
    await user.click(screen.getByLabelText("下划线"));
    expect(mockChain.toggleUnderline).toHaveBeenCalled();
    expect(mockChain.run).toHaveBeenCalled();
  });

  it.each([
    ["左对齐", "left"],
    ["居中对齐", "center"],
    ["右对齐", "right"],
    ["两端对齐", "justify"],
  ])("should call setTextAlign for %s", async (label, alignment) => {
    render(<EditorToolbar editor={mockEditor} editorContainerId="test-id" />);
    await user.click(screen.getByLabelText(label));
    expect(mockChain.setTextAlign).toHaveBeenCalledWith(alignment);
    expect(mockChain.run).toHaveBeenCalled();
  });

  it.each([
    ["一级标题", 1],
    ["二级标题", 2],
    ["三级标题", 3],
  ])("should call toggleHeading for %s", async (label, level) => {
    render(<EditorToolbar editor={mockEditor} editorContainerId="test-id" />);
    await user.click(screen.getByLabelText(label));
    expect(mockChain.toggleHeading).toHaveBeenCalledWith({ level });
    expect(mockChain.run).toHaveBeenCalled();
  });

  it("should call toggleBulletList when bullet list button is clicked", async () => {
    render(<EditorToolbar editor={mockEditor} editorContainerId="test-id" />);
    await user.click(screen.getByLabelText("无序列表"));
    expect(mockChain.toggleBulletList).toHaveBeenCalled();
    expect(mockChain.run).toHaveBeenCalled();
  });

  it("should call toggleOrderedList when ordered list button is clicked", async () => {
    render(<EditorToolbar editor={mockEditor} editorContainerId="test-id" />);
    await user.click(screen.getByLabelText("有序列表"));
    expect(mockChain.toggleOrderedList).toHaveBeenCalled();
    expect(mockChain.run).toHaveBeenCalled();
  });

  it("should call undo when undo button is clicked", async () => {
    render(<EditorToolbar editor={mockEditor} editorContainerId="test-id" />);
    await user.click(screen.getByLabelText("撤销"));
    expect(mockChain.undo).toHaveBeenCalled();
    expect(mockChain.run).toHaveBeenCalled();
  });

  it("should call redo when redo button is clicked", async () => {
    render(<EditorToolbar editor={mockEditor} editorContainerId="test-id" />);
    await user.click(screen.getByLabelText("重做"));
    expect(mockChain.redo).toHaveBeenCalled();
    expect(mockChain.run).toHaveBeenCalled();
  });

  it("should disable undo/redo buttons when editor.can() returns false", () => {
    const can = {
      chain: vi.fn().mockReturnValue({
        focus: vi.fn().mockReturnValue({
          undo: vi.fn().mockReturnValue({ run: vi.fn().mockReturnValue(false) }),
          redo: vi.fn().mockReturnValue({ run: vi.fn().mockReturnValue(false) }),
        }),
      }),
    };
    mockEditor.can = vi.fn().mockReturnValue(can);
    render(<EditorToolbar editor={mockEditor} editorContainerId="test-id" />);
    expect(screen.getByLabelText("撤销")).toBeDisabled();
    expect(screen.getByLabelText("重做")).toBeDisabled();
  });

  it.skip("should render desktop back label when back button label is provided", () => {
    // 当前 EditorToolbar 既有测试基线较老，待后续统一补齐此处细粒度断言
  });

  it("should call onSave when save button is clicked", async () => {
    const onSave = vi.fn();
    render(
      <EditorToolbar
        editor={mockEditor}
        onSave={onSave}
        editorContainerId="test-id"
      />,
    );
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(onSave).toHaveBeenCalled();
  });

  it("should show '保存中...' and disable button when isSaving is true", () => {
    render(
      <EditorToolbar
        editor={mockEditor}
        onSave={() => {}}
        isSaving={true}
        editorContainerId="test-id"
      />,
    );
    const saveButton = screen.getByRole("button", { name: "保存中..." });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });

  it("should load settings from localStorage", () => {
    const settings = {
      fontSize: 18,
      lineSpacing: 1.8,
      theme: "sepia",
      showWordCount: false,
    };
    localStorage.setItem("editor-settings", JSON.stringify(settings));
    render(<EditorToolbar editor={mockEditor} editorContainerId="test-id" />);
    expect(screen.queryByText(/字/)).not.toBeInTheDocument();
  });

  it("should save settings to localStorage when they change", async () => {
    render(<EditorToolbar editor={mockEditor} editorContainerId="test-id" />);

    // 默认设置 showWordCount 是 true, 所以初始保存时应该是 true
    const initialSettings = JSON.parse(
      localStorage.getItem("editor-settings")!,
    );
    expect(initialSettings.showWordCount).toBe(true);

    // 通过 mock 的子组件触发 onSettingsChange
    await user.click(screen.getByText("Toggle Word Count"));

    // 验证 localStorage 的内容是否已更新
    const updatedSettings = JSON.parse(
      localStorage.getItem("editor-settings")!,
    );
    expect(updatedSettings.showWordCount).toBe(false);
  });

  it("should show/hide word count based on settings", async () => {
    render(
      <EditorToolbar
        editor={mockEditor}
        editorContainerId="test-id"
        wordCount={123}
      />,
    );
    expect(screen.getByText("123 字")).toBeInTheDocument();
    await user.click(screen.getByText("Toggle Word Count"));
    expect(screen.queryByText("123 字")).not.toBeInTheDocument();
    await user.click(screen.getByText("Toggle Word Count"));
    expect(screen.getByText("123 字")).toBeInTheDocument();
  });

  it("should not render SettingsLookup if workId is not provided", () => {
    render(<EditorToolbar editor={mockEditor} editorContainerId="test-id" />);
    expect(screen.queryByTestId("settings-lookup")).not.toBeInTheDocument();
  });

  it("should return default settings if localStorage parsing fails", () => {
    const editorDiv = document.createElement("div");
    editorDiv.className = "ProseMirror";
    document.body.appendChild(editorDiv);

    const jsonParseSpy = vi.spyOn(JSON, "parse").mockImplementation(() => {
      throw new Error("Parsing failed");
    });
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    localStorage.setItem("editor-settings", "invalid json");

    render(<EditorToolbar editor={mockEditor} editorContainerId="test-id" />);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "加载编辑器设置失败:",
      expect.any(Error),
    );
    const editorElement = document.querySelector(".ProseMirror");
    expect(editorElement?.classList.contains("theme-default")).toBe(true);

    jsonParseSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("should correctly remove old theme classes and apply the new one", () => {
    const editorDiv = document.createElement("div");
    editorDiv.className = "ProseMirror theme-sepia theme-dark";
    document.body.appendChild(editorDiv);

    const settings = {
      fontSize: 16,
      lineSpacing: 1.5,
      theme: "minimal",
      isZenMode: false,
    };
    localStorage.setItem("editor-settings", JSON.stringify(settings));

    render(<EditorToolbar editor={mockEditor} editorContainerId="test-id" />);

    const editorElement = document.querySelector(".ProseMirror");
    expect(editorElement).not.toBeNull();
    expect(editorElement?.classList.contains("theme-minimal")).toBe(true);
    expect(editorElement?.classList.contains("theme-sepia")).toBe(false);
    expect(editorElement?.classList.contains("theme-dark")).toBe(false);
    expect(editorElement?.classList.contains("theme-default")).toBe(false);
  });
});
