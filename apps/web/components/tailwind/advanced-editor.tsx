"use client";
import { defaultEditorContent } from "@/lib/content";
import type { Editor as EditorInstance, JSONContent } from "@tiptap/core";
import {
  //   EditorCommand,
  //   EditorCommandEmpty,
  //   EditorCommandItem,
  //   EditorCommandList,
  EditorContent,
  // type EditorInstance, <-- Removed from here
  EditorRoot,
  ImageResizer,
  // type JSONContent, <-- Removed from here
  handleCommandNavigation,
  handleImageDrop,
  handleImagePaste,
} from "novel";
import { forwardRef, useImperativeHandle } from "react";
import type { ForwardedRef } from "react";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { defaultExtensions } from "./extensions";
import { uploadFn } from "./image-upload";

// import { slashCommand, suggestionItems } from "./slash-command";
import { slashCommand } from "./slash-command";

import hljs from "highlight.js";

// import { ColorSelector } from "./selectors/color-selector";
// import { LinkSelector } from "./selectors/link-selector";
// import { MathSelector } from "./selectors/math-selector";
// import { NodeSelector } from "./selectors/node-selector";
// import { TextButtons } from "./selectors/text-buttons";
// import GenerativeMenuSwitch from "./generative/generative-menu-switch";
// import { Separator } from "./ui/separator";

const extensions = [...defaultExtensions, slashCommand];

interface TailwindAdvancedEditorProps {
  onContentChange?: (content: JSONContent) => void;
  onSaveStatusChange?: (status: string) => void;
  onWordCountChange?: (count: number) => void;
}

interface EditorHandle {
  getEditor: () => EditorInstance | null;
}

const TailwindAdvancedEditor = forwardRef<EditorHandle, TailwindAdvancedEditorProps>(
  (
    { onContentChange, onSaveStatusChange, onWordCountChange }: TailwindAdvancedEditorProps,
    ref: ForwardedRef<EditorHandle>,
  ) => {
    const [initialContent, setInitialContent] = useState<null | JSONContent>(null);
    // Internal save status state might still be useful for local UI, but we'll primarily rely on the prop callback
    // const [saveStatus, setSaveStatus] = useState("Saved");
    // const [charsCount, setCharsCount] = useState(); // Word count will be passed up

    //   const [openNode, setOpenNode] = useState(false);
    //   const [openColor, setOpenColor] = useState(false);
    //   const [openLink, setOpenLink] = useState(false);
    const [editorInstance, setEditorInstance] = useState<EditorInstance | null>(null); // State to hold editor instance

    //Apply Codeblock Highlighting on the HTML from editor.getHTML()
    const highlightCodeblocks = (content: string) => {
      const doc = new DOMParser().parseFromString(content, "text/html");
      doc.querySelectorAll("pre code").forEach((el) => {
        // https://highlightjs.readthedocs.io/en/latest/api.html?highlight=highlightElement#highlightelement
        hljs.highlightElement(el as HTMLElement);
      });
      return new XMLSerializer().serializeToString(doc);
    };

    const debouncedUpdates = useDebouncedCallback(async (editor: EditorInstance) => {
      const json = editor.getJSON();
      // 统计编辑器内容区域的中文字符、英文单词和标点符号
      const content = editor.getText(); // 获取纯文本内容，排除UI元素
      const matches = content.match(/[\u4e00-\u9fa5]|[\u3000-\u303F]|\w+|[^\w\s]/g) || [];
      const wordCount = matches.length;

      // Call props if they exist
      onContentChange?.(json);
      onWordCountChange?.(wordCount);
      onSaveStatusChange?.("Saved"); // Notify parent that saving is complete (debounced)

      // Keep local storage saving logic
      window.localStorage.setItem("html-content", highlightCodeblocks(editor.getHTML()));
      window.localStorage.setItem("novel-content", JSON.stringify(json));
      window.localStorage.setItem("markdown", editor.storage.markdown.getMarkdown());
      window.localStorage.setItem("novel-text-length", wordCount.toString());
      // setSaveStatus("Saved"); // Use prop callback instead
    }, 500);

    useEffect(() => {
      const content = window.localStorage.getItem("novel-content");
      if (content) setInitialContent(JSON.parse(content));
      else setInitialContent(defaultEditorContent);
    }, []);
    useImperativeHandle(
      ref,
      () => ({
        getEditor: () => editorInstance,
      }),
      [editorInstance],
    );

    if (!initialContent) return null;

    return (
      // Removed the outer div with max-w-screen-lg and relative positioning
      // Removed the absolute positioned saveStatus and charsCount div
      <EditorRoot>
        <EditorContent
          initialContent={initialContent}
          extensions={extensions}
          // Adjusted className: removed min-height, max-width, margin, border, shadow, rounded corners. Added h-full potentially.
          className="relative w-full h-full bg-transparent" // Use transparent background to inherit from parent
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              class:
                "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full",
            },
          }}
          onUpdate={({ editor }) => {
            setEditorInstance(editor); // Store editor instance on update

            // Notify parent immediately that content is changing and potentially unsaved
            onSaveStatusChange?.("Unsaved");
            debouncedUpdates(editor);
            // setSaveStatus("Unsaved"); // Use prop callback instead
          }}
          onCreate={({ editor }) => {
            setEditorInstance(editor); // Store editor instance on creation
          }}
          slotAfter={<ImageResizer />}
        >
          {/* <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="px-2 text-muted-foreground">No results</EditorCommandEmpty>
            <EditorCommandList>
              {suggestionItems.map((item) => (
                <EditorCommandItem
                  value={item.title}
                  onCommand={(val) => item.command(val)}
                  className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
                  key={item.title}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand> */}

          {/* Pass open state and onOpenChange to GenerativeMenuSwitch */}
          {/* Pass the new prop to GenerativeMenuSwitch */}
          {/* Pass open state and onOpenChange to GenerativeMenuSwitch */}
          {/* Pass the new prop to GenerativeMenuSwitch */}
          {/* <GenerativeMenuSwitch editor={editorInstance}> */}
          {/* <Separator orientation="vertical" /> */}
          {/* <NodeSelector open={openNode} onOpenChange={setOpenNode} /> */}
          {/* <Separator orientation="vertical" /> */}
          {/* <LinkSelector open={openLink} onOpenChange={setOpenLink} /> */}
          {/* <Separator orientation="vertical" /> */}
          {/* <MathSelector /> */}
          {/* <Separator orientation="vertical" /> */}
          {/* <TextButtons /> */}
          {/* <Separator orientation="vertical" /> */}
          {/* <ColorSelector open={openColor} onOpenChange={setOpenColor} /> */}
          {/* </GenerativeMenuSwitch> */}
        </EditorContent>
      </EditorRoot>
    );
  },
);

TailwindAdvancedEditor.displayName = "TailwindAdvancedEditor";
export default TailwindAdvancedEditor;
