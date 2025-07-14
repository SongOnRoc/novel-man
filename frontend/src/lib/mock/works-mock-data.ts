import { Work } from "@/types/work";

export const mockWorks: Work[] = [
  {
    id: "1",
    title: "修仙从种田开始",
    description:
      "一个普通农民意外获得仙家传承，从此踏上修仙之路。在这个过程中，他不忘初心，将现代农业知识与仙法结合，创造出独特的修仙种田之道。",
    latestChapterId: "1-5",
    createdAt: "2023-09-20",
    updatedAt: "2023-09-20",
  },
  {
    id: "2",
    title: "都市之全能高手",
    description:
      "一个退役特种兵回归都市，凭借自己的能力和智慧，在商场和危机中游刃有余，同时保护着身边的人和守护着这座城市的和平。",
    latestChapterId: "2-2",
    createdAt: "2023-09-18",
    updatedAt: "2023-09-18",
  },
  {
    id: "3",
    title: "星际穿越之旅",
    description:
      "人类文明面临灭绝危机，一群勇敢的宇航员穿越虫洞，寻找新的适居行星。在这个过程中，他们经历了时间膨胀、外星文明接触等种种奇遇。",
    latestChapterId: "3-1",
    createdAt: "2023-09-15",
    updatedAt: "2023-09-15",
  },
];

// 模拟删除作品
export const mockDeleteWork = (workId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockWorks.findIndex((work) => work.id === workId);
      if (index !== -1) {
        mockWorks.splice(index, 1);
        console.log(`Work with id ${workId} deleted.`);
        resolve();
      } else {
        console.error(`Work with id ${workId} not found.`);
        reject(new Error("Work not found"));
      }
    }, 500); // 模拟网络延迟
  });
};
