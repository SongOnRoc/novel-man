"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useWorldview } from "@/hooks/worldbuilding/useWorldview";
import { WorldviewCategory, WorldviewItem } from "@/types/worldbuilding";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function CategoryDialog({
  category,
  onSave,
  children,
}: {
  category?: WorldviewCategory;
  onSave: (name: string, description: string) => void;
  children: React.ReactNode;
}) {
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");

  const handleSave = () => {
    onSave(name, description);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "编辑分类" : "新建分类"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">分类名称</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">分类描述</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={handleSave}>保存</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ItemsList({ categoryId }: { categoryId: number | null }) {
  const router = useRouter();
  const { getItemsByCategory, deleteItem } = useWorldview();
  const { items, itemsError, mutateItems } = getItemsByCategory(categoryId);

  if (!categoryId) {
    return (
      <div className="text-center text-muted-foreground py-10">
        请选择一个分类以查看其下的条目。
      </div>
    );
  }

  if (itemsError) return <div>加载条目失败...</div>;
  if (!items) return <div>加载中...</div>;

  const handleDelete = async (itemId: number) => {
    if (confirm("确定要删除这个条目吗？")) {
      await deleteItem(itemId);
      mutateItems();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <Card
          key={item.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push(`/tools/worldbuilding/${item.id}`)}
        >
          <CardHeader>
            <CardTitle>{item.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {item.description}
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/tools/worldbuilding/${item.id}/edit`);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default function WorldbuildingPage() {
  const router = useRouter();
  const {
    categories,
    isLoadingCategories,
    categoriesError,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useWorldview();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  if (isLoadingCategories) return <div>加载中...</div>;
  if (categoriesError) return <div>错误: {categoriesError.message}</div>;

  const handleCreateCategory = async (name: string, description: string) => {
    await createCategory({ name, description });
  };

  const handleUpdateCategory = async (
    id: number,
    name: string,
    description: string,
  ) => {
    await updateCategory(id, { name, description });
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm("确定要删除这个分类吗？其下的所有条目也将被删除。")) {
      await deleteCategory(id);
      if (selectedCategory === id) {
        setSelectedCategory(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">世界观库</h1>
        <Button
          onClick={() =>
            router.push(
              `/tools/worldbuilding/new?categoryId=${selectedCategory}`,
            )
          }
          disabled={!selectedCategory}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          新建条目
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            分类
            <CategoryDialog onSave={handleCreateCategory}>
              <Button variant="outline" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                新建分类
              </Button>
            </CategoryDialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
          >
            全部
          </Button>
          {categories?.map((category) => (
            <div key={category.id} className="relative group">
              <Button
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                onClick={() => setSelectedCategory(category.id)}
                className="pr-8"
              >
                {category.name}
              </Button>
              <div className="absolute top-0 right-0 flex items-center h-full opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                <CategoryDialog
                  category={category}
                  onSave={(name, description) =>
                    handleUpdateCategory(category.id, name, description)
                  }
                >
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Edit className="h-3 w-3" />
                  </Button>
                </CategoryDialog>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <ItemsList categoryId={selectedCategory} />
    </div>
  );
}
