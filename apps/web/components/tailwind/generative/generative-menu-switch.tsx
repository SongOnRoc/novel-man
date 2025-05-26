import type { Editor as TiptapEditor } from "@tiptap/core";
import { EditorBubble } from "novel";
import { Fragment, type ReactNode, useState } from "react";
import { AiToolboxDialogContent } from "../../dialogs/ai-toolbox-dialog";
import { Button } from "../ui/button";
import Magic from "../ui/icons/magic";

interface GenerativeMenuSwitchProps {
  children: ReactNode;
  editor: TiptapEditor | null; // Add editor prop
}

const GenerativeMenuSwitch = ({ children, editor }: GenerativeMenuSwitchProps) => {
  const [isOpen, setIsOpen] = useState(false); // State to control dialog visibility

  return (
    <Fragment>
      {" "}
      {/* Wrap in Fragment to include the dialog */}
      <EditorBubble
        tippyOptions={{
          placement: "right", // Always show on top initially
          onHidden: () => {
            // Keep highlight removal for when the bubble hides naturally
            editor?.chain().unsetHighlight().run();
          },
        }}
        className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
      >
        <Fragment>
          <Button
            className="gap-1 rounded-none text-purple-500"
            variant="ghost"
            onClick={() => {
              // Modify onClick to check editor and set isOpen
              if (editor) {
                setIsOpen(true);
              } else {
                console.warn("Editor instance not available yet.");
                // Optionally, add a toast notification here
              }
            }}
            size="sm"
          >
            <Magic className="h-5 w-5" />
            助手
          </Button>
          {children}
        </Fragment>
      </EditorBubble>
      {/* Conditionally render the AI Toolbox Dialog */}
      {isOpen &&
        editor && ( // Render dialog if isOpen and editor are available
          <AiToolboxDialogContent editor={editor} onClose={() => setIsOpen(false)} />
        )}
    </Fragment>
  );
};

export default GenerativeMenuSwitch;
