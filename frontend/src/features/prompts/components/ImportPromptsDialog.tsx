"use client";

import { useImportPrompts } from "@/hooks/prompt/usePromptService";
import { ImportDialog } from "@/components/common/ImportDialog";

const ImportPromptsDialog = () => {
  const importMutation = useImportPrompts();

  return (
    <ImportDialog
      title="导入提示词"
      description="支持 .txt, .md, .json, 和 .zip 格式。"
      onImport={(file) => importMutation.mutateAsync(file)}
      allowedTypes={[".txt", ".md", ".json", ".zip"]}
    />
  );
};

export default ImportPromptsDialog;
