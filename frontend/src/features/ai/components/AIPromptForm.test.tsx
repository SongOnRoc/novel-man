import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AIPromptForm } from "./AIPromptForm";

describe("AIPromptForm", () => {
  const mockOnSubmit = vi.fn();
  const mockOnStyleChange = vi.fn();
  const mockOnPersonalizedChange = vi.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    isLoading: false,
    selectedText: "",
    compact: false,
    style: "default",
    onStyleChange: mockOnStyleChange,
    isPersonalized: false,
    onPersonalizedChange: mockOnPersonalizedChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all quick actions", () => {
    render(<AIPromptForm {...defaultProps} />);
    expect(screen.getByRole("button", { name: /润色/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /续写/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /生成大纲/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /创建角色/i }),
    ).toBeInTheDocument();
  });

  it("disables selection-based actions when no text is selected", () => {
    render(<AIPromptForm {...defaultProps} />);
    expect(screen.getByRole("button", { name: /润色/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /续写/i })).toBeDisabled();
  });

  it("enables selection-based actions when text is selected", () => {
    render(
      <AIPromptForm {...defaultProps} selectedText="Some selected text" />,
    );
    expect(screen.getByRole("button", { name: /润色/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /续写/i })).toBeEnabled();
  });

  it("calls onSubmit directly for non-prompt-based actions", async () => {
    render(
      <AIPromptForm {...defaultProps} selectedText="Some selected text" />,
    );
    await userEvent.click(screen.getByRole("button", { name: /润色/i }));
    expect(mockOnSubmit).toHaveBeenCalledWith(
      "polish",
      "",
      "Some selected text",
    );
  });

  it("activates prompt-based action and updates placeholder", async () => {
    render(<AIPromptForm {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /生成大纲/i }));
    const textarea = screen.getByPlaceholderText("请输入作品简介或核心创意...");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toBeEnabled();
  });

  it("allows typing in the prompt and submitting", async () => {
    render(<AIPromptForm {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /创建角色/i }));
    const textarea = screen.getByPlaceholderText(/请输入对角色的简单描述/);
    await userEvent.type(textarea, "A lost mage");
    expect(textarea).toHaveValue("A lost mage");

    const submitButton = screen.getByLabelText("send");
    await userEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      "create-character",
      "A lost mage",
      "",
    );
  });

  it("changes style and personalization", async () => {
    render(<AIPromptForm {...defaultProps} />);

    // Change style
    await userEvent.click(screen.getByRole("combobox"));
    const styleOption = await screen.findByText("古风");
    await userEvent.click(styleOption);
    expect(mockOnStyleChange).toHaveBeenCalledWith("gufeng");

    // Toggle personalization
    await userEvent.click(screen.getByLabelText("个性化建议"));
    expect(mockOnPersonalizedChange).toHaveBeenCalledWith(true);
  });

  it("disables form elements when loading", () => {
    render(<AIPromptForm {...defaultProps} isLoading={true} />);
    expect(screen.getByRole("button", { name: /润色/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /生成大纲/i })).toBeDisabled();
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByLabelText("个性化建议")).toBeDisabled();
    expect(screen.getByLabelText("send")).toBeDisabled();
  });
});
