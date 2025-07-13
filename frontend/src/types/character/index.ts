// 角色基本信息
export interface Character {
  id: string;
  workId: string;
  name: string;
  avatar?: string;
  age?: number;
  gender?: "male" | "female" | "other";
  occupation?: string;
  background?: string;
  personality?: string[];
  abilities?: string[];
  appearance?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 角色关系类型
export type RelationshipType = string;

export const relationshipTypes: string[] = [
  "family",
  "friend",
  "lover",
  "enemy",
  "master",
  "disciple",
  "ally",
  "rival",
  "subordinate",
  "superior",
];

export const relationshipTypeMap: Record<string, string> = {
  family: "家人",
  friend: "朋友",
  lover: "恋人",
  enemy: "敌人",
  master: "师傅",
  disciple: "弟子",
  ally: "盟友",
  rival: "竞争对手",
  subordinate: "下属",
  superior: "上级",
};

// 角色关系
export interface CharacterRelationship {
  id: string;
  sourceId: string; // 源角色ID
  targetId: string; // 目标角色ID
  type: RelationshipType;
  description?: string;
}

// 创建角色请求
export interface CreateCharacterRequest {
  workId: string;
  name: string;
  avatar?: string;
  age?: number;
  gender?: "male" | "female" | "other";
  occupation?: string;
  background?: string;
  personality?: string[];
  abilities?: string[];
  appearance?: string;
  notes?: string;
}

// 更新角色请求
export interface UpdateCharacterRequest
  extends Partial<CreateCharacterRequest> {
  id: string;
}
