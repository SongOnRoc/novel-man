"use client";

import { useState, useEffect } from "react";
import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface WritingGoalPopoverProps {
  targetCount: number;
  onTargetCountChange: (newTarget: number) => void;
}

export function WritingGoalPopover({
  targetCount,
  onTargetCountChange,
}: WritingGoalPopoverProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [targetInput, setTargetInput] = useState(targetCount.toString());

  useEffect(() => {
    setTargetInput(targetCount.toString());
  }, [targetCount]);

  const handleSetTarget = () => {
    const newTarget = parseInt(targetInput, 10);
    if (!isNaN(newTarget)) {
      onTargetCountChange(newTarget);
      setIsPopoverOpen(false); // Close popover after setting
    }
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Target className="h-4 w-4" />
          <span className="sr-only">设置写作目标</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="target-input" className="text-sm font-medium">
            设置目标字数
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="target-input"
              type="number"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              className="h-8"
              placeholder="例如: 2000"
            />
            <Button size="sm" onClick={handleSetTarget} className="h-8">
              设置
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
