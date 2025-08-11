import { WorldviewItem } from "@/types/core";

// 模拟世界观设定数据
export const mockWorldItems: WorldviewItem[] = [
  {
    id: 1,
    userId: 1,
    categoryId: 1,
    name: "灵气体系",
    description: "修真界的核心资源是「灵气」，它通过世界各处的「灵脉」流动。",
    details:
      "修真界的核心资源是「灵气」，它通过世界各处的「灵脉」流动。千年前一场大灾变让灵气稀薄，修真界从繁荣走向衰落。灵气分为五行属性：金、木、水、火、土，以及更为稀有的雷、风、光、暗等属性。修炼者通过吸收灵气提升修为，经历炼气、筑基、金丹、元婴、化神等境界。",
    tags: ["修真体系", "灵气", "五行"],
    createdAt: "2023-01-10T08:00:00Z",
    updatedAt: "2023-02-15T14:30:00Z",
    type: "system",
  },
];
