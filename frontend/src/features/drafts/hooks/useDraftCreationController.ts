import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DRAFT_TEMPLATE_OPTIONS,
  DraftTemplateKey,
  NewDraftDialogFormValues,
} from "@/features/drafts/components/NewDraftDialog";
import { CreateDraftPayloadForClient } from "@/hooks/draft/useDraftService";

export const DEFAULT_NEW_DRAFT_TITLE = "无标题草稿";

const getTemplateContent = (templateKey: DraftTemplateKey): string => {
  const template = DRAFT_TEMPLATE_OPTIONS.find((item) => item.key === templateKey);
  return template?.content ?? "";
};

const buildInitialValues = (workId?: number): NewDraftDialogFormValues => ({
  title: "",
  workId: typeof workId === "number" ? String(workId) : "none",
  templateKey: "blank",
});

const toNumericId = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const extractDraftId = (payload: unknown): number | undefined => {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const directId = toNumericId((payload as { id?: unknown }).id);
  if (directId) {
    return directId;
  }

  const dataObj = (payload as { data?: unknown }).data;
  if (dataObj && typeof dataObj === "object") {
    const dataId = toNumericId((dataObj as { id?: unknown }).id);
    if (dataId) {
      return dataId;
    }

    const nestedData = (dataObj as { data?: unknown }).data;
    if (nestedData && typeof nestedData === "object") {
      const nestedId = toNumericId((nestedData as { id?: unknown }).id);
      if (nestedId) {
        return nestedId;
      }
    }
  }

  return undefined;
};

type UseDraftCreationControllerOptions = {
  initialWorkId?: number;
  createDraft: (payload: CreateDraftPayloadForClient) => Promise<unknown>;
  onNavigate: (path: string) => void;
  onAfterCreate?: () => void;
};

export function useDraftCreationController({
  initialWorkId,
  createDraft,
  onNavigate,
  onAfterCreate,
}: UseDraftCreationControllerOptions) {
  const defaultValues = useMemo(
    () => buildInitialValues(initialWorkId),
    [initialWorkId],
  );

  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const creatingRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [values, setValues] =
    useState<NewDraftDialogFormValues>(defaultValues);

  useEffect(() => {
    if (!open) {
      setValues(defaultValues);
    }
  }, [defaultValues, open]);

  const openDialog = useCallback((preferredWorkId?: number) => {
    setErrorMessage(undefined);
    setValues(buildInitialValues(preferredWorkId ?? initialWorkId));
    setOpen(true);
  }, [initialWorkId]);

  const closeDialog = useCallback(() => {
    if (isCreating) {
      return;
    }
    setOpen(false);
  }, [isCreating]);

  const updateValues = useCallback(
    (next: Partial<NewDraftDialogFormValues>) => {
      setErrorMessage(undefined);
      setValues((prev) => ({ ...prev, ...next }));
    },
    [],
  );

  const confirmCreate = useCallback(async () => {
    if (creatingRef.current) {
      return;
    }

    creatingRef.current = true;
    setIsCreating(true);
    setErrorMessage(undefined);

    const payload: CreateDraftPayloadForClient = {
      title: values.title.trim() || DEFAULT_NEW_DRAFT_TITLE,
      content: getTemplateContent(values.templateKey),
      workId: values.workId === "none" ? undefined : Number(values.workId),
    };

    try {
      const createdDraft = await createDraft(payload);
      const draftId = extractDraftId(createdDraft);
      if (!draftId) {
        throw new Error("未获取到草稿 ID");
      }

      onAfterCreate?.();
      setOpen(false);
      onNavigate(`/drafts/${draftId}/edit`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "未知错误，请稍后重试";
      setErrorMessage(`创建失败：${message}`);
    } finally {
      creatingRef.current = false;
      setIsCreating(false);
    }
  }, [createDraft, onAfterCreate, onNavigate, values]);

  return {
    open,
    isCreating,
    values,
    errorMessage,
    openDialog,
    closeDialog,
    updateValues,
    confirmCreate,
  };
}
