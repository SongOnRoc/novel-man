## 已完成的部分总结
目前我们已经完成了：
1. 创建了基础Next.js项目，并选择了Turbopack作为开发服务器
2. 安装并初始化了shadcn/ui，设置了组件系统
3. 安装了next-themes库用于实现深色/浅色主题切换功能
4. 创建了ThemeProvider组件来封装next-themes库的功能
5. 修改了根布局，添加了字体支持和主题切换功能
6. 修改了全局CSS文件，设置了主题颜色和小说编辑器相关样式
7. 安装了必要的UI组件
8. 创建了侧边栏和主布局组件，并设置了路由组布局
9. 实现了首页仪表盘，包括统计卡片、最近作品和快速操作。
10. 实现了作品管理页面，可以展示和创建新作品。
11. 实现了章节管理页面，可以根据作品筛选章节。
12. 实现了基本的草稿管理功能。
13. 实现了AI助手、角色设定和世界观设定的基本框架。
14. 实现了Tiptap编辑器，并集成了基础的文本编辑功能。
15. 实现了编辑器的书签管理和专注模式。
16. 实现了AI助手的悬浮按钮和交互界面。
17. 实现了角色和世界观的查找与选择功能。
18. 实现了创建角色和世界观条目的页面。
19. 实现了章节编辑页面，并集成了Tiptap编辑器。
20. 实现了基本的草稿功能。
21. 细化了AI助手、角色和世界观的模拟数据和类型。

## 第22步：实现作品大纲与章节细纲功能

在这一步，我们为小说创作流程引入了一个核心功能：大纲管理系统。这个系统允许作者在动笔之前，对整个故事的结构进行宏观规划，包括总纲、分卷大纲和具体到每个章节的细纲。这有助于保证故事的连贯性和逻辑性，是专业写作流程中不可或缺的一环。

### 代码展示与详解

#### 1. 数据模型扩展：定义大纲结构

我们首先需要定义大纲的数据结构，这为后续所有功能的实现提供了基础。

**修改文件**：[`frontend/src/types/outline.ts`](frontend/src/types/outline.ts)
```typescript
// 定义分卷的基本结构
export interface Volume {
  id: string;
  title: string;
  order: number;
}

// 定义章节细纲的结构
export interface ChapterOutline {
  chapterId: string;
  title: string; // 章节标题，用于显示
  outline: string; // 章节的详细大纲
  order: number;
}

// 定义分卷大纲的结构
export interface VolumeOutline {
  volumeId: string;
  title: string; // 分卷标题，用于显示
  outline: string; // 分卷的整体大纲
  chapters: ChapterOutline[]; // 该分卷下的章节细纲列表
  order: number;
}

// 定义完整的大纲结构
export interface Outline {
  main: string; // 总纲
  volumes: VolumeOutline[]; // 分卷大纲列表
}
```

**代码详解**：
- **`Volume`**: 定义了“分卷”的基本信息，主要用于章节列表的组织。
- **`ChapterOutline`**: 定义了“章节细纲”，包含章节ID、标题、大纲内容和顺序。
- **`VolumeOutline`**: 定义了“分卷大纲”，它聚合了分卷的元信息、自身的大纲以及其下所有章节的细纲。
- **`Outline`**: 这是最顶层的结构，包含了整部作品的“总纲”和所有“分卷大纲”的列表，形成一个完整的、层次化的故事蓝图。

#### 2. 创建新作品流程更新

在用户创建新作品时，我们为其自动生成一个空的、结构化的大纲对象，确保每部作品都具备大纲管理的能力。

**修改文件**：[`frontend/src/app/(main)/works/new/page.tsx`](frontend/src/app/(main)/works/new/page.tsx)
```typescript
// ... imports

// 表单提交处理
async function onSubmit(values: z.infer<typeof formSchema>) {
  setIsSubmitting(true);

  try {
    // 为新作品创建一个包含默认大纲结构的对象
    const newWorkData = {
      ...values,
      id: new Date().toISOString(), // 临时生成一个唯一ID
      chapterCount: 0,
      wordCount: 0,
      updatedAt: new Date().toLocaleDateString("sv"),
      outline: {
        main: "",
        volumes: [],
      },
    };

    // 这里将来会调用API创建新作品
    console.log("创建新作品:", newWorkData);

    // 模拟API调用延迟
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 成功后跳转到作品列表页
    router.push("/works");
  } catch (error) {
    console.error("创建作品失败:", error);
    // 这里可以添加错误处理，如显示错误消息
  } finally {
    setIsSubmitting(false);
  }
}

// ... rest of the component
```

**代码详解**：
- 在 `onSubmit` 函数中，当创建一个 `newWorkData` 对象时，我们添加了一个 `outline` 字段。
- `outline` 被初始化为一个包含空的 `main`（总纲）和空的 `volumes`（分卷大纲列表）的对象。这样，新创建的作品就拥有了一个符合我们数据模型的、可供编辑的初始大纲。

#### 3. 大纲管理页面

这是本次更新的核心，一个全新的、功能完善的大纲管理页面，允许作者编辑总纲、分卷大纲和章节细纲。

**创建文件**：[`frontend/src/app/(main)/works/[id]/outline/page.tsx`](frontend/src/app/(main)/works/[id]/outline/page.tsx)
```typescript
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Book, Layers, FileText } from "lucide-react";
import Link from "next/link";
import { Work } from "../../components/WorkCard";
import { Outline, VolumeOutline, ChapterOutline } from "@/types/outline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ... 模拟数据 getWorkById

export default function OutlinePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [work, setWork] = useState<Work | null>(null);
  const [outline, setOutline] = useState<Outline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeof id === "string") {
      const fetchWork = async () => {
        setIsLoading(true);
        const fetchedWork = await getWorkById(id);
        setWork(fetchedWork);
        setOutline(fetchedWork?.outline || null);
        setIsLoading(false);
      };
      fetchWork();
    }
  }, [id]);

  const handleSave = async () => {
    setIsSaving(true);
    console.log(`正在为作品 ${id} 保存大纲:`, outline);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    router.push(`/works`);
  };

  const handleOutlineChange = (
    type: "main" | "volume" | "chapter",
    value: string,
    volumeId?: string,
    chapterId?: string
  ) => {
    if (!outline) return;

    let newOutline = { ...outline };

    if (type === "main") {
      newOutline.main = value;
    } else if (type === "volume" && volumeId) {
      const volume = newOutline.volumes.find((v) => v.volumeId === volumeId);
      if (volume) {
        volume.outline = value;
      }
    } else if (type === "chapter" && volumeId && chapterId) {
      const volume = newOutline.volumes.find((v) => v.volumeId === volumeId);
      if (volume) {
        const chapter = volume.chapters.find((c) => c.chapterId === chapterId);
        if (chapter) {
          chapter.outline = value;
        }
      }
    }

    setOutline(newOutline);
  };

  if (isLoading) return <div>正在加载大纲...</div>;
  if (!work || !outline) return <div>未找到该作品或大纲。</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* ... Header JSX */}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="main" className="w-full">
        <TabsList>
          <TabsTrigger value="main">
            <Book className="mr-2 h-4 w-4" />
            总纲
          </TabsTrigger>
          <TabsTrigger value="volumes">
            <Layers className="mr-2 h-4 w-4" />
            分卷大纲
          </TabsTrigger>
          <TabsTrigger value="chapters">
            <FileText className="mr-2 h-4 w-4" />
            章节细纲
          </TabsTrigger>
        </TabsList>

        {/* Main Outline */}
        <TabsContent value="main">
          {/* ... Main Outline JSX */}
        </TabsContent>

        {/* Volume Outlines */}
        <TabsContent value="volumes">
          {/* ... Volume Outlines JSX */}
        </TabsContent>

        {/* Chapter Outlines */}
        <TabsContent value="chapters">
          <div className="space-y-4">
            {outline.volumes.map((vol) => (
              <Card key={vol.volumeId}>
                <CardHeader>
                  <CardTitle>{vol.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vol.chapters.map((chap) => (
                    <div key={chap.chapterId} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">{chap.title}</h4>
                        <Button variant="link" size="sm" asChild>
                          <Link href={`/chapters/${chap.chapterId}/edit`}>
                            去编辑
                          </Link>
                        </Button>
                      </div>
                      <Textarea
                        value={chap.outline}
                        onChange={(e) =>
                          handleOutlineChange(
                            "chapter",
                            e.target.value,
                            vol.volumeId,
                            chap.chapterId
                          )
                        }
                        placeholder={`输入 ${chap.title} 的细纲...`}
                        className="min-h-[100px]"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```
**代码详解**：
- **页面结构**: 使用 `Tabs` 组件创建了一个清晰的三级视图：“总纲”、“分卷大纲”和“章节细纲”。
- **数据获取与状态管理**: 使用 `useEffect` 在页面加载时根据URL中的作品ID获取作品数据，并将其中的 `outline` 部分存入 `useState` 进行管理。
- **动态编辑**: `handleOutlineChange` 函数是实现动态编辑的核心。它根据传入的类型（`main`, `volume`, `chapter`）和ID，精确地更新 `outline` 状态对象中对应部分的文本内容。
- **章节联动**: 在“章节细纲”视图中，每个章节条目旁边都有一个“去编辑”的链接（`<Link href={`/chapters/${chap.chapterId}/edit`}>`）。这个链接可以直接跳转到该章节的Tiptap编辑页面，实现了大纲规划与正文写作之间的无缝衔接。

#### 4. 章节管理集成

为了让章节列表更好地反映作品的结构，我们重构了章节管理页面，使其能够按“分卷”对章节进行分组展示。

**修改文件**：[`frontend/src/app/(main)/chapters/page.tsx`](frontend/src/app/(main)/chapters/page.tsx)
```typescript
// ... imports and mock data

// 模拟章节数据，增加了 volumeId 和 volumeTitle
const chaptersData: Record<string, Chapter[]> = {
  "1": [
    {
      // ...
      volumeId: "v1",
      volumeTitle: "第一卷：仙农初成",
    },
    {
      // ...
      volumeId: "v1",
      volumeTitle: "第一卷：仙农初成",
    },
    {
      // ...
      volumeId: "v2",
      volumeTitle: "第二卷：仙农再起",
    },
  ],
  // ...
};
```
**修改文件**：[`frontend/src/app/(main)/chapters/components/ChapterList.tsx`](frontend/src/app/(main)/chapters/components/ChapterList.tsx)
```typescript
// ... imports

export function ChapterList({ workId, chapters }: ChapterListProps) {
  // 按分卷ID对章节进行分组
  const chaptersByVolume = chapters.reduce<Record<string, Chapter[]>>(
    (acc, chapter) => {
      const { volumeId } = chapter;
      if (!acc[volumeId]) {
        acc[volumeId] = [];
      }
      acc[volumeId].push(chapter);
      return acc;
    },
    {}
  );

  return (
    <Card>
      {/* ... CardHeader */}
      <CardContent>
        {chapters.length === 0 ? (
          // ... Empty state
        ) : (
          <div className="space-y-6">
            {Object.entries(chaptersByVolume).map(
              ([volumeId, volumeChapters]) => (
                <div key={volumeId} className="space-y-4">
                  <h3 className="text-lg font-semibold tracking-tight border-b pb-2">
                    {volumeChapters[0]?.volumeTitle || "未分卷"}
                  </h3>
                  {volumeChapters.map((chapter) => (
                    // ... Chapter item JSX
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </CardContent>
      {/* ... CardFooter */}
    </Card>
  );
}
```
**代码详解**：
- **数据准备**: 我们首先在模拟的章节数据中增加了 `volumeId` 和 `volumeTitle` 字段。
- **分组逻辑**: 在 `ChapterList` 组件中，我们使用 `reduce` 方法创建了一个 `chaptersByVolume` 对象。这个对象以 `volumeId` 为键，将所有章节按其所属分卷进行聚合。
- **渲染逻辑**: 组件的渲染部分现在会遍历 `chaptersByVolume` 对象。外层循环渲染出分卷标题（如“第一卷：仙农初成”），内层循环则渲染该分卷下的所有章节列表。这使得章节的展示结构与作品的实际结构保持一致。

#### 5. UI组件更新

为了方便用户访问新的大纲管理功能，我们在作品卡片上增加了一个直达入口。

**修改文件**：[`frontend/src/app/(main)/works/components/WorkCard.tsx`](frontend/src/app/(main)/works/components/WorkCard.tsx)
```typescript
// ... imports

export function WorkCard({ work }: WorkCardProps) {
  return (
    <Card className="overflow-hidden">
      {/* ... CardHeader and CardContent */}
      
      {/* 卡片底部：操作按钮 */}
      <CardFooter className="grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" className="gap-1" asChild>
          <Link href={`/works/${work.id}/outline`}>
            <FileText className="h-4 w-4" />
            大纲管理
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="gap-1">
          <BookOpen className="h-4 w-4" />
          查看章节
        </Button>
        <Button size="sm" className="gap-1 col-span-1">
          <Edit className="h-4 w-4" />
          继续写作
        </Button>
      </CardFooter>
    </Card>
  );
}
```
**代码详解**：
- 在 `WorkCard` 组件的 `CardFooter` 部分，我们新增了一个“大纲管理”按钮。
- 这个按钮使用 Next.js 的 `Link` 组件，其 `href` 属性被动态设置为 `/works/${work.id}/outline`。点击后，用户将直接进入对应作品的大纲管理页面。

#### 6. 模拟数据更新

最后，我们更新了作品列表页面的模拟数据，使其包含完整的大纲信息，以便于测试和展示。

**修改文件**：[`frontend/src/app/(main)/works/page.tsx`](frontend/src/app/(main)/works/page.tsx)
```typescript
// 模拟作品数据
const works: Work[] = [
  {
    id: "1",
    title: "修仙从种田开始",
    // ... other properties
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
            // ... more chapters
          ],
        },
      ],
    },
  },
  // ... other works
];
```
**代码详解**：
- 为模拟作品数据 `works` 中的每个作品对象添加了符合 `Outline` 接口的 `outline` 字段。
- 这份详尽的模拟数据确保了我们在开发和测试大纲相关功能时，有真实、复杂的场景可供使用。

### 执行目的
本次 `step` 的核心目标是为小说创作平台构建一个完整、实用的大纲管理系统。具体来说，我们希望实现以下几点：
1.  **结构化写作**：提供一个工具，让作者能够在写作前规划好故事的宏观结构（总纲）、中期结构（分卷大纲）和微观结构（章节细纲）。
2.  **提升效率**：通过将大纲与章节编辑页面直接关联，作者可以方便地在构思和写作之间切换，减少心智负担。
3.  **数据整合**：将大纲作为作品核心数据的一部分，从创建作品的那一刻起就进行统一管理。
4.  **改善导航**：通过在章节列表中按分卷组织内容，让作者对作品的整体进度和结构有更清晰的认识。

### 替代方案
在实现大纲功能时，我们曾考虑过以下替代方案：
1.  **单一文本框大纲**：最简单的方案是只提供一个大的文本区域让作者填写所有大纲。
    *   **优点**：实现简单，开发速度快。
    *   **缺点**：缺乏结构性，当故事变得复杂时，大纲会变得混乱且难以维护。无法与具体章节关联，实用性差。
2.  **使用独立的第三方大纲工具**：引导用户使用如XMind、Notion等专业大纲或笔记软件。
    *   **优点**：无需自行开发，功能强大。
    *   **缺点**：割裂了用户体验。作者需要在我们的平台和第三方工具之间频繁切换，数据无法同步，无法实现大纲与章节的联动。
3.  **只实现分卷大纲，不实现章节细纲**：只做到分卷层级，简化开发。
    *   **优点**：比单一文本框方案好，开发复杂度适中。
    *   **缺点**：仍然不够精细。作者依然需要一个地方记录每个章节的具体情节，否则在写作时容易偏离主线。

最终，我们选择了当前这种三级（总纲-分卷-章节）的结构化大纲系统。虽然实现上更复杂，但它提供了最佳的平衡，既有宏观的规划，也有微观的细节，并且与平台的核心写作功能紧密集成，能最大化地提升作者的创作效率和体验。