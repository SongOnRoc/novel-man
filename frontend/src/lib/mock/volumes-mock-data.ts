import { Volume } from "@/types/work";

export const mockVolumes: Volume[] = [
  // 作品 "修仙从种田开始" 的分卷
  {
    id: 1,
    work_id: 1,
    title: "第一卷：仙农初成",
    display_order: 1,
    outline:
      "本卷主要讲述主角初入仙界，如何利用知识和机遇，建立自己的灵田，并与当地宗门产生初步联系。",
    created_at: "2023-01-15T08:30:00Z",
    updated_at: "2023-03-20T14:15:00Z",
  },
  {
    id: 2,
    work_id: 1,
    title: "第二卷：灵田崛起",
    display_order: 2,
    outline:
      "本卷主要讲述主角在灵田中不断探索，逐渐掌握种植灵药的技巧，并与其他修士展开竞争。",
    created_at: "2023-01-15T08:30:00Z",
    updated_at: "2023-03-20T14:15:00Z",
  },
];
