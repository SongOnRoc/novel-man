import {
  Character,
  CharacterRelationship,
  CreateCharacterRequest,
  UpdateCharacterRequest,
} from "@/types/character";

// 模拟角色数据
export const mockCharacters: Character[] = [
  {
    id: "char-1",
    workId: "work-1",
    name: "林逸风",
    avatar: "/avatars/char-1.jpg",
    age: 25,
    gender: "male",
    occupation: "修真者",
    background:
      "出身于修真世家，但家族在他10岁时因卷入宗门争斗而灭门。被一位隐居的老者收养，学习了独特的炼丹技术。",
    personality: ["坚韧", "聪慧", "重情义", "谨慎"],
    abilities: ["火属性灵力", "炼丹术", "基础剑法"],
    appearance:
      "身材修长，面容俊朗，眉宇间透露着坚毅。右手手腕上有一道蜿蜒的疤痕，是幼时逃亡时留下的。",
    notes: "主角，性格成长轨迹：从复仇到救世。",
    createdAt: "2023-01-15T08:30:00Z",
    updatedAt: "2023-03-20T14:15:00Z",
  },
  {
    id: "char-2",
    workId: "work-1",
    name: "沈月",
    avatar: "/avatars/char-2.jpg",
    age: 23,
    gender: "female",
    occupation: "丹药师",
    background:
      "丹药世家出身，天赋异禀，年纪轻轻就成为宗门重点培养的丹药师。性格直爽，与林逸风在一次历练中相识。",
    personality: ["直率", "聪颖", "善良", "固执"],
    abilities: ["丹药精通", "水属性灵力", "医术"],
    appearance:
      "长发如瀑，眼若秋水，身姿窈窕。手指因长期炼丹而略显粗糙，但动作灵巧。",
    notes: "女主角，与主角的关系从互相竞争到互相扶持。",
    createdAt: "2023-01-20T10:45:00Z",
    updatedAt: "2023-03-25T16:30:00Z",
  },
  {
    id: "char-3",
    workId: "work-2",
    name: "莫天阳",
    avatar: "/avatars/char-3.jpg",
    age: 45,
    gender: "male",
    occupation: "宗门长老",
    background:
      "修真界赫赫有名的强者，表面上是正道宗门的长老，实则暗中勾结魔道，意图颠覆修真界秩序。",
    personality: ["城府深", "野心勃勃", "残忍", "精明"],
    abilities: ["雷属性灵力", "高级阵法", "幻术"],
    appearance:
      "面容威严，鹰钩鼻，眼神锐利。常着华贵长袍，举止优雅，让人难以联想到其内心的阴暗。",
    notes: "主要反派，与主角有深仇大恨，最终将在修真界大战中败亡。",
    createdAt: "2023-02-05T09:20:00Z",
    updatedAt: "2023-04-10T11:05:00Z",
  },
];

// 模拟角色关系数据
export const mockRelationships: CharacterRelationship[] = [
  {
    id: "rel-1",
    sourceId: "char-1",
    targetId: "char-2",
    type: "ally",
    description: "共同历练中结识，互相扶持，逐渐产生感情。",
  },
  {
    id: "rel-2",
    sourceId: "char-1",
    targetId: "char-3",
    type: "enemy",
    description: "莫天阳是灭门惨案的幕后黑手，林逸风立志复仇。",
  },
  {
    id: "rel-3",
    sourceId: "char-2",
    targetId: "char-3",
    type: "superior",
    description: "沈月表面上是莫天阳的弟子，实则在暗中调查其罪行。",
  },
];

// 模拟获取所有角色
export async function mockGetAllCharacters(): Promise<Character[]> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 800));
  return [...mockCharacters];
}

// 模拟获取单个角色
export async function mockGetCharacterById(
  id: string
): Promise<Character | null> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 500));
  const character = mockCharacters.find((char) => char.id === id);
  return character || null;
}

// 模拟根据作品ID获取角色
export async function mockGetCharactersByWorkId(
  workId: string
): Promise<Character[]> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 800));
  return mockCharacters.filter((char) => char.workId === workId);
}

// 模拟创建角色
export async function mockCreateCharacter(
  data: CreateCharacterRequest
): Promise<Character> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const now = new Date().toISOString();
  const newCharacter: Character = {
    id: `char-${mockCharacters.length + 1}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  mockCharacters.push(newCharacter);
  return newCharacter;
}

// 模拟更新角色
export async function mockUpdateCharacter(
  data: UpdateCharacterRequest
): Promise<Character> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const index = mockCharacters.findIndex((char) => char.id === data.id);
  if (index === -1) {
    throw new Error(`角色不存在: ${data.id}`);
  }

  const updatedCharacter = {
    ...mockCharacters[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  mockCharacters[index] = updatedCharacter;
  return updatedCharacter;
}

// 模拟删除角色
export async function mockDeleteCharacter(id: string): Promise<boolean> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 800));

  const index = mockCharacters.findIndex((char) => char.id === id);
  if (index === -1) {
    return false;
  }

  mockCharacters.splice(index, 1);
  return true;
}

// 模拟获取角色关系
export async function mockGetCharacterRelationships(
  characterId: string
): Promise<CharacterRelationship[]> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 600));

  return mockRelationships.filter(
    (rel) => rel.sourceId === characterId || rel.targetId === characterId
  );
}
