import { AIPromptType } from "@/types/ai";

// 示例AI回复，实际应用中应通过API调用获取
export const mockAIResponses: Record<AIPromptType, string> = {
  expand:
    "他走进那间废弃多年的老屋，立刻被一股霉味和尘埃呛得咳嗽起来。屋内光线昏暗，只有几缕阳光透过布满蛛网的窗户洒进来，在空气中形成几道可见的光柱，无数灰尘在光柱中缓缓飘舞。",
  summarize:
    "主角发现家族秘密：老宅壁炉上找到祖父留下的盒子，内含关键线索，揭示家族与古老术法的联系。",
  rewrite:
    "他踏入那座被遗忘的宅院，瞬间被岁月的气息包围。光线如同稀有的宝藏，仅从蛛网密布的窗缝中泄露几缕，在尘埃弥漫的空气中划出几道金色的界限。",
  "plot-idea":
    "在一个被诅咒的世界里，人们的寿命被限制在25岁。主角发现自己拥有延长他人寿命的能力，但每次使用这种能力，就会缩短自己的生命。",
  "character-design":
    "角色名：林明远\n\n背景：出生于修真世家，但家族在他10岁时因卷入宗门争斗而灭门。他被一位隐居的老者收养，学习了独特的炼丹技术。",
  "world-building":
    "修真界的核心资源是「灵气」，它通过世界各处的「灵脉」流动。千年前一场大灾变让灵气稀薄，修真界从繁荣走向衰落。",
  dialogue:
    "林逸：「师父说过，修真之路，不在争强好胜，而在明心见性。」\n\n沈月：「那是因为你师父已经站在了金字塔顶端，居高临下地说这种话当然轻松。」",
  "text-polish":
    "原文：他快速地跑向了大门，心里非常害怕，因为他知道如果被发现的话，后果会很严重。\n\n修改后：\n他的脚步如同秋风扫落叶，贴着墙根悄无声息地向大门掠去。",
};

// 生成AI响应的模拟函数
export async function mockGenerateAIResponse(params: {
  promptType: AIPromptType;
  prompt: string;
  selectedText?: string;
}): Promise<string> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // 根据提示类型返回不同的模拟响应
  const baseResponse = mockAIResponses[params.promptType];

  // 如果有选中文本，则生成更具针对性的回复
  if (
    params.selectedText &&
    ["expand", "summarize", "rewrite"].includes(params.promptType)
  ) {
    const selectedPreview =
      params.selectedText.slice(0, 20) +
      (params.selectedText.length > 20 ? "..." : "");
    return `基于您选择的文本「${selectedPreview}」，${baseResponse}`;
  }

  return baseResponse;
}
