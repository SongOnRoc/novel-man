"use client";

import { useState, useEffect, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ValueSettingPopoverProps {
  currentValue: number;
  onValueChange: (newValue: number) => void;
  trigger: ReactNode;
  label: string;
  placeholder?: string;
  unit?: string;
}

export function ValueSettingPopover({
  currentValue,
  onValueChange,
  trigger,
  label,
  placeholder,
  unit,
}: ValueSettingPopoverProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [inputValue, setInputValue] = useState(currentValue.toString());

  useEffect(() => {
    setInputValue(currentValue.toString());
  }, [currentValue]);

  const handleSetValue = () => {
    const newValue = parseInt(inputValue, 10);
    if (!isNaN(newValue)) {
      onValueChange(newValue);
      setIsPopoverOpen(false);
    }
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="value-input" className="text-sm font-medium">
            {label}
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="value-input"
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="h-8"
              placeholder={placeholder}
            />
            {unit && (
              <span className="text-sm text-muted-foreground">{unit}</span>
            )}
            <Button size="sm" onClick={handleSetValue} className="h-8">
              设置
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
