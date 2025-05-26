import type { Editor as TiptapEditor } from "@tiptap/core"; // Import Editor type
import { Check, TextQuote, TrashIcon } from "lucide-react";
import { CommandGroup, CommandItem, CommandSeparator } from "../ui/command";

const AICompletionCommands = ({
  completion,
  onDiscard,
  editor, // Add editor prop
}: {
  completion: string;
  onDiscard: () => void;
  editor: TiptapEditor; // Define editor prop type
}) => {
  // Remove useEditor() hook
  return (
    <>
      <CommandGroup>
        <CommandItem
          className="gap-2 px-4"
          value="replace"
          onSelect={() => {
            const selection = editor.view.state.selection;

            editor
              .chain()
              .focus()
              .insertContentAt(
                {
                  from: selection.from,
                  to: selection.to,
                },
                completion,
              )
              .run();
          }}
        >
          <Check className="h-4 w-4 text-muted-foreground" />
          替换选中
        </CommandItem>
        <CommandItem
          className="gap-2 px-4"
          value="insert"
          onSelect={() => {
            const selection = editor.view.state.selection;
            editor
              .chain()
              .focus()
              .insertContentAt(selection.to + 1, completion)
              .run();
          }}
        >
          <TextQuote className="h-4 w-4 text-muted-foreground" />
          插到下行
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />

      <CommandGroup>
        <CommandItem onSelect={onDiscard} value="thrash" className="gap-2 px-4">
          <TrashIcon className="h-4 w-4 text-muted-foreground" />
          删除生成
        </CommandItem>
      </CommandGroup>
    </>
  );
};

export default AICompletionCommands;
