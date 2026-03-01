"use client";

import { Editor } from "@tiptap/react";
import { Search, ChevronDown, ChevronUp, Replace, Type, WholeWord, CaseSensitive } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Toggle } from "@/components/ui/toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface FindReplaceProps {
  editor: Editor | null;
  embedded?: boolean;
}

interface SearchResult {
  from: number;
  to: number;
}

export function FindReplace({ editor, embedded = false }: FindReplaceProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [resultCount, setResultCount] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<SearchResult[]>([]);

  const updateResults = useCallback(() => {
    if (!editor || !searchTerm) {
      setResultCount({ current: 0, total: 0 });
      setResults([]);
      editor?.commands.clearFind();
      return;
    }
    const { state } = editor.view;
    const findPluginState = (state as any).plugins
      .find((p: any) => p.key === "find$")
      ?.getState(state);

    if (findPluginState) {
      setResultCount({
        current: findPluginState.currentIndex + 1,
        total: findPluginState.results.length,
      });
      setResults(findPluginState.results);
    }
  }, [editor, searchTerm]);

  useEffect(() => {
    if (!editor || !open) {
      editor?.commands.clearFind();
      return;
    }

    const handler = () => updateResults();
    editor.on("update", handler);
    editor.on("selectionUpdate", handler);

    return () => {
      editor.off("update", handler);
      editor.off("selectionUpdate", handler);
    };
  }, [editor, open, updateResults]);

  useEffect(() => {
    if (searchTerm) {
      editor?.commands.find({ searchTerm, caseSensitive, wholeWord });
      updateResults();
    } else {
      editor?.commands.clearFind();
    }
  }, [searchTerm, caseSensitive, wholeWord, editor, updateResults]);

  const handleFindNext = () => {
    editor?.commands.findNext();
    updateResults();
  };

  const handleFindPrev = () => {
    editor?.commands.findPrev();
    updateResults();
  };

  const handleReplace = () => {
    editor?.commands.replace(replaceTerm);
    updateResults();
  };

  const handleReplaceAll = () => {
    editor?.commands.replaceAll(replaceTerm);
    updateResults();
  };

  const jumpToResult = (result: SearchResult) => {
    if (!editor) return;
    
    // Ensure focus and scroll with a slight delay to bypass any UI focus traps
    // especially when the sheet might be handling focus
    setTimeout(() => {
      editor.chain()
        .focus()
        .setTextSelection({ from: result.from, to: result.to })
        .scrollIntoView()
        .run();
    }, 10);
  };

  const getContext = (from: number, to: number) => {
    if (!editor) return { before: "", match: "", after: "" };
    const doc = editor.state.doc;
    // Increase context length slightly for better readability
    const before = doc.textBetween(Math.max(0, from - 20), from, " ");
    const match = doc.textBetween(from, to, " ");
    const after = doc.textBetween(to, Math.min(doc.content.size, to + 20), " ");
    return { before, match, after };
  };

  if (!editor) return null;

  const content = (
    <div className="flex flex-col h-full gap-4">
      {!embedded && (
        <div className="space-y-1 shrink-0">
          <h4 className="font-medium leading-none">查找与替换</h4>
          <p className="text-xs text-muted-foreground">
            在文档中查找并替换文本。
          </p>
        </div>
      )}
      
      {/* Controls Area */}
      <div className="space-y-3 shrink-0">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="查找内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          <div className="absolute right-1 top-1 flex gap-0.5">
            <Toggle
              size="sm"
              pressed={caseSensitive}
              onPressedChange={setCaseSensitive}
              aria-label="区分大小写"
              className="h-7 w-7 p-0 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
              title="区分大小写"
            >
              <Type className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={wholeWord}
              onPressedChange={setWholeWord}
              aria-label="全词匹配"
              className="h-7 w-7 p-0 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
              title="全词匹配"
            >
              <WholeWord className="h-3.5 w-3.5" />
            </Toggle>
          </div>
        </div>

        {/* Replace Input */}
        <div className="relative">
          <Replace className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="替换为..."
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md border">
            {resultCount.total > 0 ? (
              <>
                <span className="font-mono font-medium text-foreground">{resultCount.current}</span>
                <span>/</span>
                <span className="font-mono font-medium text-foreground">{resultCount.total}</span>
              </>
            ) : (
              "无结果"
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleFindPrev}
              disabled={resultCount.total === 0}
              title="上一个"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleFindNext}
              disabled={resultCount.total === 0}
              title="下一个"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-4 mx-1" />
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleReplace} 
              disabled={resultCount.total === 0}
              className="h-8 px-3 text-xs"
            >
              替换
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleReplaceAll} 
              disabled={resultCount.total === 0}
              className="h-8 px-3 text-xs"
            >
              全部
            </Button>
          </div>
        </div>
      </div>

      <Separator className="shrink-0" />

      {/* Results List */}
      <div className="flex-1 min-h-0 -mx-1">
        {results.length > 0 ? (
          <ScrollArea className="h-full">
            <div className="p-1 space-y-1">
              {results.map((result, index) => {
                const { before, match, after } = getContext(result.from, result.to);
                const isCurrent = index + 1 === resultCount.current;
                return (
                  <button
                    key={`${result.from}-${result.to}`}
                    onClick={() => jumpToResult(result)}
                    className={cn(
                      "w-full text-left text-sm p-3 rounded-lg hover:bg-accent/50 hover:text-accent-foreground transition-all duration-200 group border border-transparent",
                      isCurrent 
                        ? "bg-primary/5 border-primary/20 shadow-sm" 
                        : "hover:border-border/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn(
                        "text-[10px] font-mono shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full min-w-[1.5rem] text-center",
                        isCurrent 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                      )}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0 text-xs leading-relaxed break-words whitespace-normal text-muted-foreground">
                        <span>{before}</span>
                        <span className={cn(
                          "font-medium px-1 rounded mx-0.5 transition-colors",
                          isCurrent 
                            ? "bg-primary/20 text-primary" 
                            : "bg-yellow-200/50 dark:bg-yellow-900/50 text-foreground"
                        )}>
                          {match}
                        </span>
                        <span>{after}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-2">
            <Search className="h-8 w-8 opacity-20" />
            <span className="text-xs">输入关键词开始查找</span>
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Search className="h-4 w-4" />
          查找
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 h-[500px] p-4">
        {content}
      </PopoverContent>
    </Popover>
  );
}
