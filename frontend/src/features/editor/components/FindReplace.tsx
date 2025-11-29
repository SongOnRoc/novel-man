"use client";

import { Editor } from "@tiptap/react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

interface FindReplaceProps {
  editor: Editor | null;
  embedded?: boolean;
}

export function FindReplace({ editor, embedded = false }: FindReplaceProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [resultCount, setResultCount] = useState({ current: 0, total: 0 });

  const updateResults = useCallback(() => {
    if (!editor || !searchTerm) {
      setResultCount({ current: 0, total: 0 });
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

  if (!editor) return null;

  const content = (
    <div className="grid gap-4">
          {!embedded && (
            <div className="space-y-2">
              <h4 className="font-medium leading-none">查找与替换</h4>
              <p className="text-sm text-muted-foreground">
                在文档中查找并替换文本。
              </p>
            </div>
          )}
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="find">查找</Label>
              <Input
                id="find"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="replace">替换为</Label>
              <Input
                id="replace"
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                className="col-span-2 h-8"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="case-sensitive"
                checked={caseSensitive}
                onCheckedChange={setCaseSensitive}
              />
              <Label htmlFor="case-sensitive">大小写匹配</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="whole-word"
                checked={wholeWord}
                onCheckedChange={setWholeWord}
              />
              <Label htmlFor="whole-word">全词匹配</Label>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {resultCount.total > 0
                ? `${resultCount.current} / ${resultCount.total}`
                : "无结果"}
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleFindPrev}
                disabled={resultCount.total === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleFindNext}
                disabled={resultCount.total === 0}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleReplace} disabled={resultCount.total === 0}>
              替换
            </Button>
            <Button
              onClick={handleReplaceAll}
              disabled={resultCount.total === 0}
            >
              全部替换
            </Button>
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
      <PopoverContent className="w-80">
        {content}
      </PopoverContent>
    </Popover>
  );
}
