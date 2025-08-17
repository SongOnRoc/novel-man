import {
  getChapters as apiGetChapters,
  getChaptersId as apiGetChaptersId,
  postChapters as apiPostChapters,
  putChaptersId as apiPutChaptersId,
  deleteChaptersId as apiDeleteChaptersId,
} from "@/lib/api/generated/chapters/chapters";
import type {
  GetChaptersParams,
  ChaptersCreateChapterRequest,
  ChaptersUpdateChapterRequest,
} from "@/lib/api/generated/api10.schemas";

export type ChapterListParams = GetChaptersParams;
export type ChapterCreate = ChaptersCreateChapterRequest;
export type ChapterUpdate = ChaptersUpdateChapterRequest;

export function getChapters(params: ChapterListParams) {
  return apiGetChapters(params);
}

export function getChapterById(id: number) {
  return apiGetChaptersId(id);
}

export function createChapter(data: ChapterCreate) {
  return apiPostChapters(data);
}

export function updateChapter(id: number, data: ChapterUpdate) {
  return apiPutChaptersId(id, data);
}

export function deleteChapter(id: number) {
  return apiDeleteChaptersId(id);
}