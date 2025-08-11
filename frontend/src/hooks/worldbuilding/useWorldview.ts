import useSWR from "swr";
import {
  getWorldviewCategories,
  createWorldviewCategory,
  updateWorldviewCategory,
  deleteWorldviewCategory,
  getWorldviewItems,
  createWorldviewItem,
  updateWorldviewItem,
  deleteWorldviewItem,
  getWorldviewItem,
  getAllWorldviewItems, // 新增导入
} from "@/lib/api/worldview";
import { WorldviewCategory, WorldviewItem } from "@/types/worldbuilding";
import { useCallback } from "react";

export function useWorldview() {
  // 获取所有分类
  const {
    data: categories,
    error: categoriesError,
    mutate: mutateCategories,
  } = useSWR<WorldviewCategory[]>(
    "/api/worldview/categories",
    getWorldviewCategories,
  );

  // 获取所有条目
  const {
    data: items,
    error: itemsError,
    mutate: mutateItems,
  } = useSWR<WorldviewItem[]>("/api/worldview/items", getAllWorldviewItems);

  // 按分类ID获取条目
  const getItemsByCategory = (categoryId: number | null) => {
    const {
      data: items,
      error: itemsError,
      mutate: mutateItems,
    } = useSWR<WorldviewItem[]>(
      categoryId ? `/api/worldview/items?category=${categoryId}` : null,
      () => getWorldviewItems(categoryId!),
    );
    return { items, itemsError, mutateItems };
  };

  // 按ID获取单个条目
  const getItem = (itemId: number | null) => {
    const {
      data: item,
      error: itemError,
      mutate: mutateItem,
    } = useSWR<WorldviewItem>(
      itemId ? `/api/worldview/items/${itemId}` : null,
      () => getWorldviewItem(itemId!),
    );
    return { item, itemError, mutateItem };
  };

  // --- 分类操作 ---
  const createCategory = async (data: Partial<WorldviewCategory>) => {
    const newCategory = await createWorldviewCategory(data);
    mutateCategories();
    return newCategory;
  };

  const updateCategory = async (
    id: number,
    data: Partial<WorldviewCategory>,
  ) => {
    const updatedCategory = await updateWorldviewCategory(id, data);
    mutateCategories();
    return updatedCategory;
  };

  const deleteCategory = async (id: number) => {
    await deleteWorldviewCategory(id);
    mutateCategories();
  };

  // --- 条目操作 ---
  const createItem = async (data: Partial<WorldviewItem>) => {
    const newItem = await createWorldviewItem(data);
    mutateItems(); // 创建后刷新所有条目列表
    return newItem;
  };

  const updateItem = async (id: number, data: Partial<WorldviewItem>) => {
    const updatedItem = await updateWorldviewItem(id, data);
    mutateItems(); // 更新后刷新所有条目列表
    return updatedItem;
  };

  const deleteItem = async (id: number) => {
    await deleteWorldviewItem(id);
    mutateItems(); // 删除后刷新所有条目列表
  };

  return {
    categories,
    categoriesError,
    isLoadingCategories: !categories && !categoriesError,
    items, // 导出所有条目
    itemsError,
    isLoadingItems: !items && !itemsError,
    mutateCategories,
    mutateItems,
    createCategory,
    updateCategory,
    deleteCategory,
    getItemsByCategory,
    getItem,
    createItem,
    updateItem,
    deleteItem,
  };
}

// 重新引入 useWorldviewLookup
export function useWorldviewLookup() {
  const getWorldItemsByWorkId = useCallback(async (workId: number) => {
    // TODO: The backend API currently does not support filtering worldview items by workId.
    // This function fetches all items as a temporary measure.
    // A proper implementation requires a new API endpoint: GET /api/v1/works/{workId}/worldview-items
    console.warn(
      "Fetching all worldview items. Filtering by workId is not yet implemented in the API.",
    );
    return await getAllWorldviewItems();
  }, []);

  return {
    getWorldItemsByWorkId,
  };
}
