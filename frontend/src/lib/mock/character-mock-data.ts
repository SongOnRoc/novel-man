import { Character } from "@/lib/services/characters.service";
import { Relationship as CharacterRelationship } from "@/lib/services/relationship.service";

// 模拟角色数据
export const mockCharacters: Character[] = [
  {
    id: 1,
    user_id: 1,
    name: "林逸风",
    avatar_url: "/avatars/char-1.jpg",
    age: 25,
    gender: "male",
    occupation: "修真者",
    background_story:
      "出身于修真世家，但家族在他10岁时因卷入宗门争斗而灭门。被一位隐居的老者收养，学习了独特的炼丹技术。",
    personality: "坚韧,聪慧,重情义,谨慎",
    abilities: "火属性灵力,炼丹术,基础剑法",
    appearance:
      "身材修长，面容俊朗，眉宇间透露着坚毅。右手手腕上有一道蜿蜒的疤痕，是幼时逃亡时留下的。",
    notes: "主角，性格成长轨迹：从复仇到救世。",
    created_at: "2023-01-15T08:30:00Z",
    updated_at: "2023-03-20T14:15:00Z",
  },
];

// 模拟角色关系数据
export const mockRelationships: CharacterRelationship[] = [
  {
    id: 1,
    source_entity_id: 1,
    target_entity_id: 2,
    source_entity_type: "Character",
    target_entity_type: "Character",
    relationship_type: "ally",
    description: "共同历练中结识，互相扶持，逐渐产生感情。",
    created_at: "2023-01-15T08:30:00Z",
    updated_at: "2023-03-20T14:15:00Z",
  },
];
