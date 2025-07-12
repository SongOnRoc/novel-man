import { Volume } from "@/types/work";

export const mockVolumes: Volume[] = [
  // 作品 "修仙从种田开始" 的分卷
  {
    id: "v1",
    workId: "1",
    title: "第一卷：仙农初成",
    order: 1,
    outline:
      "本卷主要讲述主角初入仙界，如何利用知识和机遇，建立自己的灵田，并与当地宗门产生初步联系。",
  },
  {
    id: "v2",
    workId: "1",
    title: "第二卷：灵田崛起",
    order: 2,
    outline:
      "本卷主要讲述主角在灵田中不断探索，逐渐掌握种植灵药的技巧，并与其他修士展开竞争。",
  },
];
