import { Chapter, Draft } from "@/types/work";

export const mockChapters: Chapter[] = [
  // 作品 "修仙从种田开始" 的已发布章节
  {
    id: "1-1",
    workId: "1",
    volumeId: "v1",
    title: "第一章 意外得到仙家传承",
    outline: "主角获得《仙农传承》，开启修仙之路。",
    content:
      "<p>李青是一个普通的农村青年，从小就对种植有着浓厚的兴趣。他家祖祖辈辈都是种地的，但收成一直平平，生活也过得紧巴巴的。</p><p>这一天，李青像往常一样在自家的地里忙活。突然，他的锄头碰到了一个硬物。他以为是石头，便弯腰去捡，却发现那是一个古朴的小盒子。</p><p>好奇心驱使下，他打开了盒子，里面是一本泛黄的古书和一颗晶莹剔透的种子。古书上写着《仙农传承》四个大字。</p><p>当李青的手触碰到那本书的瞬间，一股奇异的能量涌入他的体内。他惊讶地发现，自己竟然能够感知到周围植物的生命力，甚至能够通过意念影响它们的生长。</p><p>这一刻，李青知道自己的人生将彻底改变。他决定按照古书上的指引，将那颗神秘的种子种下，开始了自己的修仙种田之路。</p>",
    order: 1,
    wordCount: 1500,
    createdAt: "2023-09-10",
    updatedAt: "2023-09-11",
    status: "published",
  },
  {
    id: "1-2",
    workId: "1",
    volumeId: "v1",
    title: "第二章 初试灵力",
    outline: "主角第一次使用灵力改良土壤，效果显著。",
    content:
      '<p>回到家后，李青迫不及待地翻阅《仙农传承》。书中记载了许多奇特的种植方法和修炼功法，其中最基础的是"引灵入体"，可以吸收天地间的灵气，提升自身修为。</p><p>按照书上的指导，李青盘腿而坐，调整呼吸，尝试感知周围的灵气。起初，他什么也没感觉到，但坚持了大约一个小时后，他开始隐约感觉到有微弱的能量围绕着自己流动。</p><p>"这就是灵气吗？"李青心中暗想。他按照功法引导这些能量进入体内，顿时感到一股清凉之意流遍全身，疲劳一扫而空。</p><p>第二天清晨，李青来到自家的菜园，决定试试自己的新能力。他将手掌贴在一株长势不佳的白菜上，尝试将一丝灵力输入其中。</p><p>令他惊讶的是，那株白菜以肉眼可见的速度变得更加翠绿挺拔，叶片也更加厚实。这小小的成功让李青兴奋不已，他决定找一块隐蔽的地方，种下那颗神秘的种子。</p>',
    order: 2,
    wordCount: 1800,
    createdAt: "2023-09-12",
    updatedAt: "2023-09-13",
    status: "published",
  },
  {
    id: "1-3",
    workId: "1",
    volumeId: "v2",
    title: "第三章 神秘的种子",
    outline: "种下神秘种子，引发天地异象。",
    content: "",
    order: 3,
    wordCount: 1650,
    createdAt: "2023-09-14",
    updatedAt: "2023-09-15",
    status: "published",
  },
  {
    id: "1-4",
    workId: "1",
    volumeId: "v2",
    title: "第四章 修炼灵力",
    outline: "修炼灵力，引发灵田生长。",
    content: "",
    order: 4,
    wordCount: 1650,
    createdAt: "2023-09-14",
    updatedAt: "2023-09-15",
    status: "published",
  },
  {
    id: "1-5",
    workId: "1",
    volumeId: "v2",
    title: "第五章 修炼灵力",
    outline: "修炼灵力，引发灵田生长。",
    content: "",
    order: 5,
    wordCount: 1650,
    createdAt: "2023-09-14",
    updatedAt: "2023-09-15",
    status: "published",
  },
  {
    id: "2-1",
    workId: "2",
    volumeId: "v1",
    title: "第一章 回归都市",
    outline: "主角回到都市，开始新的生活。",
    content: "",
    order: 1,
    wordCount: 1650,
    createdAt: "2023-09-14",
    updatedAt: "2023-09-15",
    status: "published",
  },
  {
    id: "2-2",
    workId: "2",
    volumeId: "v1",
    title: "第二章 初露锋芒",
    outline: "主角在都市中逐渐展露头角，获得了初步的成功。",
    content: "",
    order: 2,
    wordCount: 1650,
    createdAt: "2023-09-14",
    updatedAt: "2023-09-15",
    status: "published",
  },
  {
    id: "3-1",
    workId: "3",
    volumeId: "v1",
    title: "第一章 青云山下",
    outline: "",
    content: "",
    order: 1,
    wordCount: 1650,
    createdAt: "2023-09-14",
    updatedAt: "2023-09-15",
    status: "published",
  },
];

export const mockDrafts: Draft[] = [
  {
    id: "draft-1",
    workId: "1",
    title: "第四章 灵田初成",
    outline:
      "经过三天三夜的不懈努力，李青终于将灵力注入那片荒地，一股清新的灵气开始在土地中流转。他惊喜地发现，原本贫瘠的土地正在以肉眼可见的速度变得肥沃起来...",
    content:
      "经过三天三夜的不懈努力，李青终于将灵力注入那片荒地，一股清新的灵气开始在土地中流转。他惊喜地发现，原本贫瘠的土地正在以肉眼可见的速度变得肥沃起来...",
    status: "draft",
    wordCount: 2100,
    createdAt: "2023-09-19",
    updatedAt: "2023-09-20",
  },
  {
    id: "draft-2",
    workId: "2",
    title: "第三章 商业联姻",
    outline:
      "张明站在高楼之上，俯瞰整个城市的灯火。他知道，今晚的宴会将决定他与林氏集团合作的成败。作为一个从军队退役的特种兵，他从未想过有一天会靠联姻来解决商业问题...",
    content:
      "张明站在高楼之上，俯瞰整个城市的灯火。他知道，今晚的宴会将决定他与林氏集团合作的成 baisse.作为一个从军队退役的特种兵，他从未想过有一天会靠联姻来解决商业问题...",
    status: "draft",
    wordCount: 1800,
    createdAt: "2023-09-17",
    updatedAt: "2023-09-18",
  },
  {
    id: "draft-3",
    workId: "note-1", // 使用一个特殊的workId来表示这是一个独立的笔记
    title: "新作品构思",
    outline:
      "故事背景设定在2150年，人类已经开始在太阳系内多个行星建立殖民地。主角是一名星际运输船的机械师，在一次例行维修中发现了船舱内的神秘货物...",
    content:
      "故事背景设定在2150年，人类已经开始在太阳系内多个行星建立殖民地。主角是一名星际运输船的机械师，在一次例行维修中发现了船舱内的神秘货物...",
    status: "draft",
    wordCount: 950,
    createdAt: "2023-09-15",
    updatedAt: "2023-09-15",
  },
];

// 模拟删除章节
export const mockDeleteChapter = (chapterId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockChapters.findIndex((chapter) => chapter.id === chapterId);
      if (index !== -1) {
        mockChapters.splice(index, 1);
        console.log(`Chapter with id ${chapterId} deleted.`);
        resolve();
      } else {
        console.error(`Chapter with id ${chapterId} not found.`);
        reject(new Error("Chapter not found"));
      }
    }, 500);
  });
};

// 模拟更新章节状态
export const mockUpdateChapterStatus = (
  chapterId: string,
  status: "draft" | "published"
): Promise<Chapter> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const chapter = mockChapters.find((c) => c.id === chapterId);
      if (chapter) {
        chapter.status = status;
        chapter.updatedAt = new Date().toISOString().split("T")[0];
        console.log(
          `Chapter with id ${chapterId} status updated to ${status}.`
        );
        resolve(chapter);
      } else {
        console.error(`Chapter with id ${chapterId} not found.`);
        reject(new Error("Chapter not found"));
      }
    }, 500);
  });
};

// 模拟删除草稿
export const mockDeleteDraft = (draftId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockDrafts.findIndex((draft) => draft.id === draftId);
      if (index !== -1) {
        mockDrafts.splice(index, 1);
        console.log(`Draft with id ${draftId} deleted.`);
        resolve();
      } else {
        console.error(`Draft with id ${draftId} not found.`);
        reject(new Error("Draft not found"));
      }
    }, 500);
  });
};

// 模拟将草稿转换为章节
export const mockConvertDraftToChapter = (draftId: string): Promise<Chapter> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const draftIndex = mockDrafts.findIndex((d) => d.id === draftId);
      const draft = mockDrafts[draftIndex];

      if (draft && draft.workId) {
        mockDrafts.splice(draftIndex, 1);
        const newChapter: Chapter = {
          id: `ch-${Date.now()}`, // 生成一个唯一ID
          workId: draft.workId,
          volumeId: "v1", // 假设默认添加到第一个分卷
          title: draft.title,
          content: draft.content,
          status: "published",
          order: mockChapters.filter(c => c.workId === draft.workId).length + 1,
          wordCount: draft.wordCount,
          createdAt: new Date().toISOString().split("T")[0],
          updatedAt: new Date().toISOString().split("T")[0],
          outline: draft.outline,
        };
        mockChapters.push(newChapter);
        console.log(`Draft with id ${draftId} converted to chapter.`);
        resolve(newChapter);
      } else {
        console.error(`Draft with id ${draftId} not found or has no workId.`);
        reject(new Error("Draft not found or cannot be converted"));
      }
    }, 500);
  });
};

// 模拟创建新章节
export const mockCreateChapter = (
  data: Omit<Chapter, "id" | "order" | "wordCount" | "createdAt" | "updatedAt" | "status">
): Promise<Chapter> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newChapter: Chapter = {
        id: `ch-${Date.now()}`,
        ...data,
        order:
          mockChapters.filter((c) => c.workId === data.workId).length + 1,
        wordCount: data.content?.length || 0,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
        status: "draft", // 新建的章节默认为草稿
      };
      mockChapters.push(newChapter);
      console.log("New chapter created:", newChapter);
      resolve(newChapter);
    }, 500);
  });
};
