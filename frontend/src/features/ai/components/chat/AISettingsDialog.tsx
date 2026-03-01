import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { getAvailableModelsService } from "@/lib/services/ai.service";

interface AISettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string, baseUrl: string) => void;
  initialApiKey?: string;
  initialBaseUrl?: string;
}

export function AISettingsDialog({
  isOpen,
  onClose,
  onSave,
  initialApiKey = "",
  initialBaseUrl = "",
}: AISettingsDialogProps) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl);

  useEffect(() => {
    setApiKey(initialApiKey);
    setBaseUrl(initialBaseUrl);
  }, [initialApiKey, initialBaseUrl, isOpen]);

  const handleSave = async () => {
    // Call service to save settings to cookie via proxy
    try {
      await getAvailableModelsService(apiKey, baseUrl);
    } catch (error) {
      console.error("Failed to save AI settings to cookie", error);
    }
    
    onSave(apiKey, baseUrl);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI 设置</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="sk-..."
              type="password"
            />
            <p className="text-xs text-muted-foreground">
              您的 API Key 将仅存储在本地浏览器中，不会保存到服务器。
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="baseUrl">Base URL (可选)</Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://api.openai.com/v1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} type="button">
            取消
          </Button>
          <Button onClick={handleSave} type="button">
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
