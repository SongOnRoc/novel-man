import { Work, WorkCard } from "./components/WorkCard";
import { NewWorkButton } from "./components/NewWorkButton";

// 模拟作品数据
const works: Work[] = [
  {
    id: "1",
    title: "修仙从种田开始",
    description:
      "一个普通农民意外获得仙家传承，从此踏上修仙之路。在这个过程中，他不忘初心，将现代农业知识与仙法结合，创造出独特的修仙种田之道。",
    chapterCount: 23,
    wordCount: 78500,
    updatedAt: "2023-09-20",
    outline: {
      main: "主角李青，一个现代农业大学毕业生，意外穿越到修仙世界，利用科学知识结合仙法进行种田，最终成为一代仙农的传奇故事。",
      volumes: [
        {
          volumeId: "v1",
          title: "第一卷：仙农初成",
          order: 1,
          outline:
            "本卷主要讲述主角初入仙界，如何利用知识和机遇，建立自己的灵田，并与当地宗门产生初步联系。",
          chapters: [
            {
              chapterId: "1-1",
              title: "第一章 意外得到仙家传承",
              outline: "主角获得《仙农传承》，开启修仙之路。",
              order: 1,
            },
            {
              chapterId: "1-2",
              title: "第二章 初试灵力",
              outline: "主角第一次使用灵力改良土壤，效果显著。",
              order: 2,
            },
            {
              chapterId: "1-3",
              title: "第三章 神秘的种子",
              outline: "种下神秘种子，引发天地异象。",
              order: 3,
            },
          ],
        },
      ],
    },
  },
  {
    id: "2",
    title: "都市之全能高手",
    description:
      "一个退役特种兵回归都市，凭借自己的能力和智慧，在商场和危机中游刃有余，同时保护着身边的人和守护着这座城市的和平。",
    chapterCount: 15,
    wordCount: 52300,
    updatedAt: "2023-09-18",
    outline: {
      main: "退役兵王回归都市，开启一段新的传奇。",
      volumes: [],
    },
  },
  {
    id: "3",
    title: "星际穿越之旅",
    description:
      "人类文明面临灭绝危机，一群勇敢的宇航员穿越虫洞，寻找新的适居行星。在这个过程中，他们经历了时间膨胀、外星文明接触等种种奇遇。",
    chapterCount: 7,
    wordCount: 24630,
    updatedAt: "2023-09-15",
    outline: {
      main: "为了人类的延续，宇航员们踏上未知的星际旅程。",
      volumes: [],
    },
  },
];

// 作品列表页面组件
export default function WorksPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题和新建按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">我的作品</h1>
          <p className="text-muted-foreground">
            管理您的所有创作作品，继续您的创作之旅。
          </p>
        </div>
        <NewWorkButton />
      </div>

      {/* 作品列表 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {works.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>

      {/* 当没有作品时显示的内容 */}
      {works.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <h2 className="text-2xl font-semibold">暂无作品</h2>
          <p className="mb-4 mt-2 text-muted-foreground">
            您还没有创建任何作品，点击下方按钮开始您的创作之旅。
          </p>
          <NewWorkButton />
        </div>
      )}
    </div>
  );
}
