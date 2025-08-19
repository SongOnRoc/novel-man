"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useWorldviewCategories,
  useCreateWorldviewCategory,
  useUpdateWorldviewCategory,
  useDeleteWorldviewCategory,
  useWorldviewItems,
  useDeleteWorldviewItem,
} from "@/hooks/worldbuilding/useWorldviewService";
import {
  WorldviewCategory,
  WorldviewItem,
  WorldviewCategoryList,
  WorldviewItemList,
} from "@/lib/services/worldview.service";

// --- Form Schema and Types ---

const categoryFormSchema = z.object({
  name: z.string().min(1, { message: "分类名称不能为空" }),
});
type CategoryFormValues = z.infer<typeof categoryFormSchema>;

// --- Reusable Components ---

function CategoryDialog({
  category,
  onSave,
  children,
  isPending,
}: {
  category?: WorldviewCategory;
  onSave: (values: CategoryFormValues) => void;
  children: React.ReactNode;
  isPending: boolean;
}): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: category?.name || "" },
  });

  useEffect(() => {
    if (category) {
      form.reset({ name: category.name || "" });
    }
  }, [category, form]);

  const onSubmit = (values: CategoryFormValues) => {
    onSave(values);
    setIsOpen(false);
    if (!category) {
      form.reset({ name: "" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "编辑分类" : "新建分类"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>分类名称 *</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：修炼境界、宗门势力" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ItemCard({
  item,
  onDelete,
}: {
  item: WorldviewItem;
  onDelete: (id: number) => void;
}): React.ReactElement {
  const router = useRouter();
  return (
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
            onDelete(item.id!);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// --- Item List Component ---

function ItemsList({
  categoryId,
}: {
  categoryId: number | null;
}): React.ReactElement | null {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = useMemo(() => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  }, [searchParams]);

  const {
    data: itemsResponse,
    isLoading,
    error,
  } = useWorldviewItems({
    category_id: categoryId!,
    page,
  });
  const { mutate: deleteItem } = useDeleteWorldviewItem();

  const items = (itemsResponse as WorldviewItemList)?.data || [];
  const pagination = (itemsResponse as WorldviewItemList)?.pagination;

  const totalPages = useMemo(() => {
    if (!pagination || !pagination.total || !pagination.limit) {
      return 1;
    }
    return Math.ceil(pagination.total / pagination.limit);
  }, [pagination]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handleDelete = (itemId: number) => {
    toast("确定要删除这个条目吗？", {
      action: {
        label: "删除",
        onClick: () =>
          deleteItem(itemId, {
            onSuccess: () => toast.success("删除成功"),
            onError: (e: Error) => toast.error(`删除失败: ${e.message}`),
          }),
      },
      cancel: { label: "取消", onClick: () => {} },
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (error) return <div>加载条目失败...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item: WorldviewItem) => (
          <ItemCard key={item.id} item={item} onDelete={handleDelete} />
        ))}
      </div>
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(page - 1);
                  }}
                />
              </PaginationItem>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNumber) => (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(pageNumber);
                    }}
                    isActive={page === pageNumber}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            {page < totalPages && (
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(page + 1);
                  }}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

// --- Main Page Component ---

export default function WorldbuildingPage(): React.ReactElement {
  const router = useRouter();
  const {
    data: categoriesResponse,
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useWorldviewCategories({});
  const { mutate: createCategory, isPending: isCreatingCategory } =
    useCreateWorldviewCategory();
  const { mutate: updateCategory, isPending: isUpdatingCategory } =
    useUpdateWorldviewCategory();
  const { mutate: deleteCategory } = useDeleteWorldviewCategory();

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const categories = (categoriesResponse as WorldviewCategoryList)?.data || [];

  if (isLoadingCategories) return <div>加载中...</div>;
  if (categoriesError) return <div>错误: {categoriesError.message}</div>;

  const handleCreateCategory = (values: CategoryFormValues) => {
    createCategory(values, {
      onSuccess: () => toast.success("分类创建成功"),
      onError: (e: Error) => toast.error(`创建失败: ${e.message}`),
    });
  };

  const handleUpdateCategory = (id: number, values: CategoryFormValues) => {
    updateCategory(
      { id, data: values },
      {
        onSuccess: () => toast.success("分类更新成功"),
        onError: (e: Error) => toast.error(`更新失败: ${e.message}`),
      }
    );
  };

  const handleDeleteCategory = (id: number) => {
    toast("确定要删除这个分类吗？其下的所有条目也将被删除。", {
      action: {
        label: "删除",
        onClick: () =>
          deleteCategory(id, {
            onSuccess: () => {
              toast.success("删除成功");
              if (selectedCategory === id) {
                setSelectedCategory(null);
              }
            },
            onError: (e: Error) => toast.error(`删除失败: ${e.message}`),
          }),
      },
      cancel: { label: "取消", onClick: () => {} },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">世界观库</h1>
        <Button
          onClick={() =>
            router.push(
              `/tools/worldbuilding/new?categoryId=${selectedCategory || ""}`
            )
          }
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          新建条目
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            分类
            <CategoryDialog
              onSave={handleCreateCategory}
              isPending={isCreatingCategory}
            >
              <Button variant="outline" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                新建分类
              </Button>
            </CategoryDialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {categories?.map((category: WorldviewCategory) => (
            <div key={category.id} className="relative group">
              <Button
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.id ? null : category.id!
                  )
                }
                className="pr-8"
              >
                {category.name}
              </Button>
              <div className="absolute top-0 right-0 flex items-center h-full opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                <CategoryDialog
                  category={category}
                  onSave={(values) =>
                    handleUpdateCategory(category.id!, values)
                  }
                  isPending={isUpdatingCategory}
                >
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Edit className="h-3 w-3" />
                  </Button>
                </CategoryDialog>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => handleDeleteCategory(category.id!)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {selectedCategory && <ItemsList categoryId={selectedCategory} />}
    </div>
  );
}
