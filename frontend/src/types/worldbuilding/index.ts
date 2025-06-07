// 世界观设定类型
export type WorldItemType = 
  | 'location' // 地点
  | 'organization' // 组织/势力
  | 'item' // 物品
  | 'event' // 事件
  | 'system' // 系统(如修真、魔法)
  | 'custom'; // 自定义类型

// 世界观设定项
export interface WorldItem {
  id: string;
  workId: string;
  name: string;
  type: WorldItemType;
  description: string;
  image?: string;
  details?: string; // 详细描述，可以是富文本
  tags: string[]; // 标签，用于分类和搜索
  relatedItems?: string[]; // 相关设定项的ID
  createdAt: string;
  updatedAt: string;
}

// 创建世界观设定请求
export interface CreateWorldItemRequest {
  workId: string;
  name: string;
  type: WorldItemType;
  description: string;
  image?: string;
  details?: string;
  tags: string[];
  relatedItems?: string[];
}

// 更新世界观设定请求
export interface UpdateWorldItemRequest extends Partial<CreateWorldItemRequest> {
  id: string;
}

// 世界观设定类型选项
export const worldItemTypeOptions = [
  { value: 'location', label: '地点/场景' },
  { value: 'organization', label: '势力/组织' },
  { value: 'item', label: '物品/法宝' },
  { value: 'event', label: '事件/历史' },
  { value: 'system', label: '系统/规则' },
  { value: 'custom', label: '自定义类型' },
];