import {
  getCharacters as apiGetCharacters,
  getCharactersId as apiGetCharactersId,
  postCharacters as apiPostCharacters,
  putCharactersId as apiPutCharactersId,
  deleteCharactersId as apiDeleteCharactersId,
} from "@/lib/api/generated/characters/characters";
import type {
  GetCharactersParams,
  CharactersCreateCharacterRequest,
  CharactersUpdateCharacterRequest,
  CharactersCharacterResponse,
  CharactersListCharactersResponse,
} from "@/lib/api/generated/api10.schemas";
import { axiosInstance } from "@/lib/axios";

export type Character = CharactersCharacterResponse;
export type CharacterListParams = GetCharactersParams;
export type CharacterCreate = CharactersCreateCharacterRequest;
export type CharacterUpdate = CharactersUpdateCharacterRequest;
export type CharacterList = CharactersListCharactersResponse;

export function getCharacters(params?: CharacterListParams) {
  return apiGetCharacters(params);
}

export function getCharacter(id: number) {
  return apiGetCharactersId(id);
}

export function createCharacter(data: CharacterCreate) {
  return apiPostCharacters(data);
}

export function updateCharacter(id: number, data: CharacterUpdate) {
  return apiPutCharactersId(id, data);
}

export function deleteCharacter(id: number) {
  return apiDeleteCharactersId(id);
}

/**
 * 组合接口：按作品ID获取角色列表
 * 说明：OpenAPI 生成的 characters 列表未包含 work_id 过滤；此处走 BFF 聚合路由
 * 返回值与 Orval customInstance 保持一致：优先返回 data.data，否则返回 data
 */
export async function getCharactersByWorkId(workId: number) {
  const resp = await axiosInstance.get(`/works/${workId}/characters`);
  return resp?.data && typeof resp.data === "object" && "data" in resp.data
    ? (resp.data as any).data
    : resp.data;
}
