import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Save,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 编辑器工具栏属性
interface EditorToolbarProps {
  editor: Editor | null; // Tiptap编辑器实例，可能为null（初始化前）
  onSave: () => void; // 保存回调函数
  isSaving: boolean; // 是否正在保存
  wordCount: number; // 字数统计
}

// 编辑器工具栏组件
export function EditorToolbar({
  editor,
  onSave,
  isSaving,
  wordCount,
}: EditorToolbarProps) {
  // 如果编辑器未初始化，返回空工具栏
  if (!editor) {
    return (
      <div className="novel-editor-toolbar flex items-center justify-between border-b p-2">
        <div className="flex flex-wrap gap-1"></div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">0 字</div>
          <Button disabled className="gap-1" size="sm">
            <Save className="h-4 w-4" />
            保存
          </Button>
        </div>
      </div>
    );
  }

  // 工具按钮数据
  const tools = [
    {
      icon: Bold,
      tooltip: "加粗 (Ctrl+B)",
      isActive: editor.isActive("bold"),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      icon: Italic,
      tooltip: "斜体 (Ctrl+I)",
      isActive: editor.isActive("italic"),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      icon: Underline,
      tooltip: "下划线 (Ctrl+U)",
      isActive: editor.isActive("underline"),
      onClick: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      icon: List,
      tooltip: "无序列表",
      isActive: editor.isActive("bulletList"),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      icon: ListOrdered,
      tooltip: "有序列表",
      isActive: editor.isActive("orderedList"),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      icon: AlignLeft,
      tooltip: "左对齐",
      isActive: editor.isActive({ textAlign: "left" }),
      onClick: () => editor.chain().focus().setTextAlign("left").run(),
    },
    {
      icon: AlignCenter,
      tooltip: "居中",
      isActive: editor.isActive({ textAlign: "center" }),
      onClick: () => editor.chain().focus().setTextAlign("center").run(),
    },
    {
      icon: AlignRight,
      tooltip: "右对齐",
      isActive: editor.isActive({ textAlign: "right" }),
      onClick: () => editor.chain().focus().setTextAlign("right").run(),
    },
  ];

  return (
    <div className="novel-editor-toolbar flex items-center justify-between border-b p-2">
      {/* 格式化工具按钮 */}
      <div className="flex flex-wrap gap-1">
        {tools.map((tool, index) => (
          <Tooltip key={index} delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant={tool.isActive ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={tool.onClick}
              >
                <tool.icon className="h-4 w-4" />
                <span className="sr-only">{tool.tooltip}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{tool.tooltip}</TooltipContent>
          </Tooltip>
        ))}

        {/* 撤销/重做按钮 */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo className="h-4 w-4" />
              <span className="sr-only">撤销</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>撤销 (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo className="h-4 w-4" />
              <span className="sr-only">重做</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>重做 (Ctrl+Y)</TooltipContent>
        </Tooltip>
      </div>

      {/* 右侧区域：字数统计和保存按钮 */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">{wordCount} 字</div>
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="gap-1"
          size="sm"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "保存中..." : "保存"}
        </Button>
      </div>
    </div>
  );
}
