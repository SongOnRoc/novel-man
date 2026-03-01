import { PlusCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface NewWorkButtonProps {
  trigger?: React.ReactNode;
}

// 新建作品按钮组件
export function NewWorkButton({ trigger }: NewWorkButtonProps) {
  if (trigger) {
    return (
      <Link href="/works/new" className="block h-full w-full">
        {trigger}
      </Link>
    );
  }

  return (
    <Button asChild className="gap-2">
      <Link href="/works/new">
        <PlusCircle className="h-4 w-4" />
        创建新作品
      </Link>
    </Button>
  );
}
