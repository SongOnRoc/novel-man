"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

// 作品类型定义
interface Work {
  id: string;
  title: string;
}

// 作品选择器属性
interface WorkSelectorProps {
  works: Work[];
  selectedWork: Work | null;
  onSelectWork: (work: Work) => void;
}

// 作品选择器组件
export function WorkSelector({
  works,
  selectedWork,
  onSelectWork,
}: WorkSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full md:w-auto justify-between">
          {selectedWork ? selectedWork.title : "选择作品"}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {works.map((work) => (
          <DropdownMenuItem
            key={work.id}
            onClick={() => onSelectWork(work)}
            className="cursor-pointer"
          >
            {work.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
