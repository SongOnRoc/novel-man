"use client";

import { Command, CommandInput } from "@/components/tailwind/ui/command";
import { ArrowUp } from "lucide-react";
import { useEditor } from "novel";
import { addAIHighlight } from "novel";
import { useRef, useState } from "react";
import Markdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "../ui/button";
import CrazySpinner from "../ui/icons/crazy-spinner";
import Magic from "../ui/icons/magic";
import { ScrollArea } from "../ui/scroll-area";
import AICompletionCommands from "./ai-completion-command";
import AISelectorCommands from "./ai-selector-commands";

interface CompleteOptions {
  body: {
    option: string;
    command?: string;
  };
}

interface AISelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AISelector({ onOpenChange }: AISelectorProps) {
  const { editor } = useEditor();
  if (!editor) {
    toast.error("编辑器未初始化");
    onOpenChange(false);
    return null;
  }
  const [inputValue, setInputValue] = useState("");

  const [completion, setCompletion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const complete = async (text: string, options?: CompleteOptions) => {
    setIsLoading(true);
    setCompletion("");

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: text,
          ...options?.body,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          try {
            const chunk = JSON.parse(line);
            const content = chunk.choices[0]?.delta?.content || "";
            setCompletion((prev) => prev + content);
          } catch (e) {
            console.error("Error parsing stream data:", e, line);
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("AI request failed:", err);
        toast.error(`AI请求失败: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };
  const hasCompletion = completion.length > 0;

  return (
    <Command className="w-[350px]">
      {hasCompletion && (
        <div className="flex max-h-[400px]">
          <ScrollArea>
            <div className="prose p-2 px-4 prose-sm">
              <Markdown>{completion}</Markdown>
            </div>
          </ScrollArea>
        </div>
      )}

      {isLoading && (
        <div className="flex h-12 w-full items-center px-4 text-sm font-medium text-muted-foreground text-purple-500">
          <Magic className="mr-2 h-4 w-4 shrink-0  " />
          思考中
          <div className="ml-2 mt-1">
            <CrazySpinner />
          </div>
        </div>
      )}
      {!isLoading && (
        <>
          <div className="relative">
            <CommandInput
              value={inputValue}
              onValueChange={setInputValue}
              autoFocus
              placeholder={hasCompletion ? "自由提问" : "编辑或生成..."}
              onFocus={() => addAIHighlight(editor)}
            />
            <Button
              size="icon"
              className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-purple-500 hover:bg-purple-900"
              onClick={() => {
                if (completion)
                  return complete(completion, {
                    body: { option: "zap", command: inputValue },
                  }).then(() => setInputValue(""));

                let text = "";
                try {
                  const slice = editor.state.selection.content();
                  text = editor.storage.markdown.serializer.serialize(slice.content);
                  if (!text) {
                    toast.error("请先选中文本");
                    return;
                  }

                  complete(text, {
                    body: { option: "zap", command: inputValue },
                  }).then(() => setInputValue(""));
                } catch (_error) {
                  toast.error("获取选中内容失败");
                  return;
                }
              }}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
          {hasCompletion ? (
            <AICompletionCommands
              editor={editor}
              onDiscard={() => {
                editor.chain().unsetHighlight().focus().run();
                onOpenChange(false);
              }}
              completion={completion}
            />
          ) : (
            <AISelectorCommands onSelect={(value, option) => complete(value, { body: { option } })} />
          )}
        </>
      )}
    </Command>
  );
}
