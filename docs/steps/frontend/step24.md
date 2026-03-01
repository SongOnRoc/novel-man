## 已完成的部分总结
目前我们已经完成了：
1.  创建了基础Next.js项目，并选择了Turbopack作为开发服务器。
2.  安装并初始化了shadcn/ui，设置了组件系统。
3.  安装了next-themes库用于实现深色/浅色主题切换功能。
4.  创建了ThemeProvider组件来封装next-themes库的功能。
5.  修改了根布局，添加了字体支持和主题切换功能。
6.  修改了全局CSS文件，设置了主题颜色和小说编辑器相关样式。
7.  安装了必要的UI组件。
8.  创建了侧边栏和主布局组件，并设置了路由组布局。
9.  实现了首页仪表盘，包括统计卡片、最近作品和快速操作。
10. 实现了作品管理页面，可以展示和创建新作品。
11. 实现了章节管理页面，可以根据作品筛选章节。
12. 实现了基本的草稿管理功能。
13. 实现了AI助手、角色设定和世界观设定的基本框架。
14. 实现了Tiptap编辑器，并集成了基础的文本编辑功能。
15. 实现了编辑器的书签管理和专注模式。
16. 实现了AI助手的悬浮按钮和交互界面。
17. 实现了角色和世界观的查找与选择功能。
18. 实现了创建角色和世界观条目的页面。
19. 实现了章节编辑页面，并集成了Tiptap编辑器。
20. 实现了基本的草稿功能。
21. 细化了AI助手、角色和世界观的模拟数据和类型。
22. 实现了作品大纲与章节细纲的完整功能。
23. 整理并完善了项目文档结构，为后续开发奠定基础。

## 第24步：编辑器查找与替换功能开发

接下来，我们将为编辑器添加一个至关重要的功能：查找与替换。这对于作家在后期校对、修改文章中的特定词汇或名称时，能极大地提升工作效率。我们将创建一个非侵入式的浮动面板来承载此功能，严格遵循关注点分离的原则，将UI与核心逻辑解耦。

**执行命令**：
```
touch frontend/src/lib/editor/FindExtension.ts
touch frontend/src/components/editor/FindReplace.tsx
```

**创建文件**：`frontend/src/lib/editor/FindExtension.ts`

```ts
import { Extension, RawCommands } from "@tiptap/core";
import { Plugin, PluginKey, EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Editor } from "@tiptap/react";

interface FindOptions {
  searchTerm: string;
  caseSensitive: boolean;
  wholeWord: boolean;
}

interface FindResult {
  from: number;
  to: number;
}

const findPluginKey = new PluginKey("find");

// 扩展Tiptap的命令接口
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    find: {
      find: (options: FindOptions) => ReturnType;
      findNext: () => ReturnType;
      findPrev: () => ReturnType;
      replace: (replaceTerm: string) => ReturnType;
      replaceAll: (replaceTerm: string) => ReturnType;
      clearFind: () => ReturnType;
    };
  }
}

export const FindExtension = Extension.create({
  name: "find",

  addProseMirrorPlugins() {
    const { editor } = this;

    return [
      new Plugin({
        key: findPluginKey,
        state: {
          init() {
            return {
              searchTerm: "",
              caseSensitive: false,
              wholeWord: false,
              results: [],
              currentIndex: -1,
            };
          },
          apply(tr, value) {
            const meta = tr.getMeta(findPluginKey);
            if (meta) {
              return { ...value, ...meta };
            }
            if (tr.docChanged && value.searchTerm) {
              const { searchTerm, caseSensitive, wholeWord } = value;
              const results = find(
                editor.state.doc,
                searchTerm,
                caseSensitive,
                wholeWord
              );
              return { ...value, results, currentIndex: -1 };
            }
            return value;
          },
        },
        props: {
          decorations(state: EditorState) {
            const { results, currentIndex } = findPluginKey.getState(state);
            if (!results.length) return DecorationSet.empty;
            const decorations = results.map(
              (res: FindResult, index: number) => {
                const className =
                  index === currentIndex
                    ? "find-highlight active"
                    : "find-highlight";
                return Decoration.inline(res.from, res.to, {
                  class: className,
                });
              }
            );
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },

  addCommands() {
    return {
      find:
        (options: FindOptions) =>
        ({ tr, dispatch }) => {
          const { searchTerm, caseSensitive, wholeWord } = options;
          const results = find(tr.doc, searchTerm, caseSensitive, wholeWord);
          if (dispatch) {
            tr.setMeta(findPluginKey, {
              searchTerm,
              caseSensitive,
              wholeWord,
              results,
              currentIndex: results.length > 0 ? 0 : -1,
            });
            dispatch(tr);
          }
          if (results.length > 0) {
            const { from, to } = results[0];
            this.editor.commands.setTextSelection({ from, to });
            this.editor.view.dispatch(this.editor.state.tr.scrollIntoView());
          }
          return results.length > 0;
        },
      findNext:
        () =>
        ({ tr, dispatch, state }) => {
          const { results, currentIndex } = findPluginKey.getState(state);
          if (!results.length) return false;
          const nextIndex = (currentIndex + 1) % results.length;
          if (dispatch) {
            tr.setMeta(findPluginKey, { currentIndex: nextIndex });
            dispatch(tr);
            const { from, to } = results[nextIndex];
            this.editor.commands.setTextSelection({ from, to });
            this.editor.view.dispatch(this.editor.state.tr.scrollIntoView());
          }
          return true;
        },
      findPrev:
        () =>
        ({ tr, dispatch, state }) => {
          const { results, currentIndex } = findPluginKey.getState(state);
          if (!results.length) return false;
          const prevIndex =
            (currentIndex - 1 + results.length) % results.length;
          if (dispatch) {
            tr.setMeta(findPluginKey, { currentIndex: prevIndex });
            dispatch(tr);
            const { from, to } = results[prevIndex];
            this.editor.commands.setTextSelection({ from, to });
            this.editor.view.dispatch(this.editor.state.tr.scrollIntoView());
          }
          return true;
        },
      replace:
        (replaceTerm: string) =>
        ({ tr, dispatch, state }) => {
          const { results, currentIndex } = findPluginKey.getState(state);
          if (currentIndex === -1 || !results[currentIndex]) return false;
          const { from, to } = results[currentIndex];
          if (dispatch) {
            tr.insertText(replaceTerm, from, to);
            dispatch(tr);
          }
          return true;
        },
      replaceAll:
        (replaceTerm: string) =>
        ({ tr, dispatch, state }) => {
          const { results } = findPluginKey.getState(state);
          if (!results.length) return false;
          if (dispatch) {
            results
              .slice()
              .reverse()
              .forEach((res: FindResult) => {
                tr.insertText(replaceTerm, res.from, res.to);
              });
            dispatch(tr);
          }
          return true;
        },
      clearFind:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(findPluginKey, {
              searchTerm: "",
              results: [],
              currentIndex: -1,
            });
            dispatch(tr);
          }
          return true;
        },
    };
  },
});

function find(
  doc: any,
  searchTerm: string,
  caseSensitive: boolean,
  wholeWord: boolean
): FindResult[] {
  if (!searchTerm) return [];

  const results: FindResult[] = [];
  const flags = caseSensitive ? "g" : "gi";
  const regex = wholeWord
    ? new RegExp(
        `\\b${searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`,
        flags
      )
    : new RegExp(searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), flags);

  doc.descendants((node: any, pos: number) => {
    if (!node.isText) return;

    let match;
    while ((match = regex.exec(node.text)) !== null) {
      if (match[0] === "") {
        if (regex.lastIndex === match.index) {
          regex.lastIndex++;
        }
        continue;
      }
      results.push({
        from: pos + match.index,
        to: pos + match.index + match[0].length,
      });
    }
  });

  return results;
}
```

**代码详解**：
1.  **逻辑封装**: 这是查找与替换功能的核心逻辑，被封装为一个独立的 Tiptap `Extension`，实现了与UI的解耦。
2.  **ProseMirror插件**: 通过 `addProseMirrorPlugins` 方法创建了一个 ProseMirror 插件，它负责管理查找的所有内部状态（如搜索词、结果、当前高亮索引）。
3.  **状态同步**: 插件的 `state.apply` 函数是状态管理的核心，它通过监听事务元数据 (`tr.getMeta`) 和文档变更 (`tr.docChanged`) 来智能地更新查找结果，确保数据一致性。
4.  **高亮装饰**: `props.decorations` 函数根据当前状态动态地在文本上创建高亮效果，为当前匹配项和其它匹配项应用不同的CSS类。
5.  **命令注入**: `addCommands` 方法向编辑器实例注入了一整套操作命令（`find`, `findNext`, `replace`等），供UI组件调用。
6.  **`replaceAll`实现**: `replaceAll` 命令通过反向遍历结果数组来执行替换，这是一个关键细节，可以有效避免因文本长度变化导致后续匹配项位置错乱的问题。

---

**创建文件**：`frontend/src/components/editor/FindReplace.tsx`

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

interface FindReplaceProps {
  editor: Editor | null;
}

export function FindReplace({ editor }: FindReplaceProps) {
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Search className="h-4 w-4" />
          查找
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">查找与替换</h4>
            <p className="text-sm text-muted-foreground">
              在文档中查找并替换文本。
            </p>
          </div>
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
      </PopoverContent>
    </Popover>
  );
}
```

**代码详解**：
1.  **UI组件**: 这是查找替换功能的用户界面，使用 `shadcn/ui` 的 `Popover` 组件构建，以提供非侵入式的用户体验。
2.  **状态管理**: 组件使用 `useState` 来管理界面自身的状态，如输入框内容、开关选项等。
3.  **与逻辑层通信**:
    *   **发送命令**: 当用户在输入框中输入或点击按钮时，组件会调用 `editor.commands` 中由 `FindExtension` 注入的相应命令（如 `editor.commands.find(...)`）。
    *   **接收状态**: 组件通过 `useEffect` 监听编辑器的 `update` 和 `selectionUpdate` 事件，并调用 `updateResults` 函数。该函数从 `FindExtension` 的插件状态中读取最新的结果数量和当前索引，并更新UI，确保了界面始终与编辑器核心状态保持同步。

**执行目的**：
本步骤通过创建 `FindExtension.ts`（核心逻辑）和 `FindReplace.tsx`（UI界面）两个文件，为编辑器实现了一个功能完整、体验流畅且代码结构清晰的查找与替换功能。这遵循了关注点分离的设计原则，提高了代码的可维护性和可复用性，并最终显著提升了作家的写作和编辑效率。

**替代方案**：
- **原生浏览器查找 (Ctrl+F)**: 功能过于基础，无法实现“全词匹配”、“全部替换”等高级功能，也无法与编辑器深度集成以高亮显示结果。
- **在React组件中实现所有逻辑**: 会导致UI组件代码极其臃肿、难以维护，并且需要手动操作DOM和编辑器状态，非常容易出错，性能也无法保证。我们选择的扩展方案是Tiptap官方推荐的最佳实践。

我们通过这种方式，实现了一个健壮且用户友好的高级编辑器功能。