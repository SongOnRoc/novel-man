import { Work } from "@/lib/services/work.service";

export const mockWorks: Work[] = [
  {
    id: 1,
    user_id: 1,
    title: "修仙从种田开始",
    category: "修真",
    description:
      "一个普通农民意外获得仙家传承，从此踏上修仙之路。在这个过程中，他不忘初心，将现代农业知识与仙法结合，创造出独特的修仙种田之道。",
    status: "ongoing",
    created_at: "2023-09-20",
    updated_at: "2023-09-20",
  },
  {
    id: 2,
    user_id: 1,
    title: "都市之全能高手",
    category: "都市",
    description:
      "一个退役特种兵回归都市，凭借自己的能力和智慧，在商场和危机中游刃有余，同时保护着身边的人和守护着这座城市的和平。",
    status: "completed",
    created_at: "2023-09-18",
    updated_at: "2023-09-18",
  },
  {
    id: 3,
    user_id: 1,
    title: "星际穿越之旅",
    category: "科幻",
    description:
      "人类文明面临灭绝危机，一群勇敢的宇航员穿越虫洞，寻找新的适居行星。在这个过程中，他们经历了时间膨胀、外星文明接触等种种奇遇。",
    status: "on_hold",
    created_at: "2023-09-15",
    updated_at: "2023-09-15",
  },
];
