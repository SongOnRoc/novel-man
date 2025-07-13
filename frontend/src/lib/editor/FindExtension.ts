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
            // 在一个事务中反向应用所有更改
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
        // 避免无限循环
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
