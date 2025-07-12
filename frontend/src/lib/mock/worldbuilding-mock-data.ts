import {
  WorldItem,
  WorldItemType,
  CreateWorldItemRequest,
  UpdateWorldItemRequest,
} from "@/types/worldbuilding";

// 模拟世界观设定数据
export const mockWorldItems: WorldItem[] = [
  {
    id: "world-1",
    workId: "1",
    name: "灵气体系",
    type: "system",
    description: "修真界的核心资源是「灵气」，它通过世界各处的「灵脉」流动。",
    details:
      "修真界的核心资源是「灵气」，它通过世界各处的「灵脉」流动。千年前一场大灾变让灵气稀薄，修真界从繁荣走向衰落。灵气分为五行属性：金、木、水、火、土，以及更为稀有的雷、风、光、暗等属性。修炼者通过吸收灵气提升修为，经历炼气、筑基、金丹、元婴、化神等境界。",
    tags: ["修真体系", "灵气", "五行"],
    relatedItems: ["world-3"],
    createdAt: "2023-01-10T08:00:00Z",
    updatedAt: "2023-02-15T14:30:00Z",
  },
  {
    id: "world-2",
    workId: "3",
    name: "青云宗",
    type: "organization",
    description: "修真界五大宗门之一，以炼丹术闻名天下。",
    image: "/worldbuilding/qingyun.jpg",
    details: `修真界五大宗门之一，以炼丹术闻名天下，门规严苛，弟子众多。坐落于灵气充沛的青云山脉，有"丹道正宗"之称。宗主青云子已有千年道行，为当世少有的大能。宗门内分为内门、外门和杂役，设有炼丹堂、藏经阁、执法堂等机构。`,
    tags: ["宗门", "势力", "炼丹"],
    relatedItems: ["world-1"],
    createdAt: "2023-01-15T10:20:00Z",
    updatedAt: "2023-03-05T16:45:00Z",
  },
  {
    id: "world-3",
    workId: "1",
    name: "天元大陆",
    type: "location",
    description: "故事发生的主要大陆，分为东南西北中五大区域。",
    image: "/worldbuilding/continent.jpg",
    details:
      "天元大陆是一片广袤的大陆，分为东南西北中五大区域，每个区域都有不同的地理特征和文化。东域多山多水，灵气充沛，是大多数修真宗门的所在地；南域气候温暖，适合种植灵草灵药；西域多沙漠戈壁，环境恶劣，但蕴含特殊资源；北域终年冰雪，是一些特殊功法的修炼圣地；中域则是人类王朝的所在，凡人与修真者共存。",
    tags: ["地理", "大陆", "区域划分"],
    relatedItems: [],
    createdAt: "2023-01-05T09:15:00Z",
    updatedAt: "2023-02-20T11:30:00Z",
  },
];

// 模拟获取所有世界观设定
export async function mockGetAllWorldItems(): Promise<WorldItem[]> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 800));
  return [...mockWorldItems];
}

// 模拟获取单个世界观设定
export async function mockGetWorldItemById(
  id: string
): Promise<WorldItem | null> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 500));
  const worldItem = mockWorldItems.find((item) => item.id === id);
  return worldItem || null;
}

// 模拟根据作品ID获取世界观设定
export async function mockGetWorldItemsByWorkId(
  workId: string
): Promise<WorldItem[]> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 600));
  return mockWorldItems.filter((item) => item.workId === workId);
}

// 模拟创建世界观设定
export async function mockCreateWorldItem(
  data: CreateWorldItemRequest
): Promise<WorldItem> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const now = new Date().toISOString();
  const newWorldItem: WorldItem = {
    id: `world-${mockWorldItems.length + 1}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  mockWorldItems.push(newWorldItem);
  return newWorldItem;
}

// 模拟更新世界观设定
export async function mockUpdateWorldItem(
  data: UpdateWorldItemRequest
): Promise<WorldItem> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const index = mockWorldItems.findIndex((item) => item.id === data.id);
  if (index === -1) {
    throw new Error(`世界观设定不存在: ${data.id}`);
  }

  const updatedWorldItem: WorldItem = {
    ...mockWorldItems[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  mockWorldItems[index] = updatedWorldItem;
  return updatedWorldItem;
}

// 模拟删除世界观设定
export async function mockDeleteWorldItem(id: string): Promise<boolean> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 800));

  const index = mockWorldItems.findIndex((item) => item.id === id);
  if (index === -1) {
    return false;
  }

  mockWorldItems.splice(index, 1);
  return true;
}

// 模拟按类型获取世界观设定
export async function mockGetWorldItemsByType(
  type: WorldItemType
): Promise<WorldItem[]> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 600));

  return mockWorldItems.filter((item) => item.type === type);
}

// 模拟搜索世界观设定
export async function mockSearchWorldItems(
  query: string
): Promise<WorldItem[]> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 700));

  const lowerQuery = query.toLowerCase();
  return mockWorldItems.filter(
    (item) =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}
