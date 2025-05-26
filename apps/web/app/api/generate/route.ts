import { getPrompt } from "@/lib/prompts";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import { OpenAI } from "openai";
import { match } from "ts-pattern";

export const runtime = "edge";

// 获取OpenAI客户端配置
const getOpenAIConfig = (useFallback: boolean) => {
  const baseURL = useFallback
    ? process.env.OPENAI_BASE_URL_FALLBACK
    : process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

  const apiKey = useFallback ? process.env.OPENAI_API_KEY_FALLBACK : process.env.OPENAI_API_KEY;

  const model = useFallback ? process.env.OPENAI_MODEL_FALLBACK || "gpt-4" : process.env.OPENAI_MODEL || "gpt-4";

  if (!apiKey || !baseURL) {
    throw new Error(`Missing ${useFallback ? "fallback" : "primary"} OpenAI config`);
  }

  // 验证baseURL格式
  try {
    const url = new URL(baseURL);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error(`Invalid protocol: ${url.protocol}`);
    }
    if (!url.pathname.endsWith("/v1")) {
      throw new Error(`baseURL path must end with /v1, got: ${url.pathname}`);
    }
  } catch (e) {
    throw new Error(`Invalid baseURL format: ${baseURL}. ${e.message}`);
  }

  return { baseURL, apiKey, model };
};

// 检查请求限流
const checkRateLimit = async (req: Request): Promise<Response | null> => {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const ip = req.headers.get("x-forwarded-for");
    if (!ip) return null;

    const ratelimit = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(50, "1 d"),
    });

    const { success } = await ratelimit.limit(`novel_ratelimit_${ip}`);
    if (!success) {
      return new Response("You have reached your request limit for the day.", {
        status: 429,
      });
    }
  }
  return null;
};

// 处理命令参数
const processCommand = (option: string, command: string): string => {
  if (option === "continue" && (!command || command.trim() === "")) {
    return "请结合前文内容继续创作。";
  }
  if (option === "zap" && (!command || command.trim() === "")) {
    return "请自由创作。";
  }
  return command;
};

// 构建消息
const buildMessages = (option: string, prompt: string, command: string): OpenAI.ChatCompletionMessageParam[] => {
  return match(option)
    .with("continue", () => [
      {
        role: "system" as const,
        content: getPrompt("CONTINUE"),
      },
      {
        role: "user" as const,
        content: getPrompt("USER_CONTINUE", { text: prompt, command }),
      },
    ])
    .with("improve", () => [
      {
        role: "system" as const,
        content: getPrompt("IMPROVE"),
      },
      {
        role: "user" as const,
        content: getPrompt("USER_IMPROVE", { text: prompt, command }),
      },
    ])
    .with("shorter", () => [
      {
        role: "system" as const,
        content: getPrompt("SHORTER"),
      },
      {
        role: "user" as const,
        content: getPrompt("USER_EXISTING", { text: prompt }),
      },
    ])
    .with("longer", () => [
      {
        role: "system" as const,
        content: getPrompt("LONGER"),
      },
      {
        role: "user" as const,
        content: getPrompt("USER_EXISTING", { text: prompt }),
      },
    ])
    .with("fix", () => [
      {
        role: "system" as const,
        content: getPrompt("FIX"),
      },
      {
        role: "user" as const,
        content: getPrompt("USER_EXISTING", { text: prompt }),
      },
    ])
    .with("zap", () => [
      {
        role: "system" as const,
        content: getPrompt("ZAP"),
      },
      {
        role: "user" as const,
        content: getPrompt("USER_COMMAND", { text: prompt, command }),
      },
    ])
    .with("generate_title", () => [
      {
        role: "system" as const,
        content: getPrompt("GENERATE_TITLE"),
      },
      {
        role: "user" as const,
        content: getPrompt("USER_GENERATE_TITLE", { text: prompt }),
      },
    ])
    .run();
};

// 创建OpenAI请求
const createOpenAIRequest = async (
  messages: OpenAI.ChatCompletionMessageParam[],
  useFallback: boolean,
): Promise<Response> => {
  const { baseURL, apiKey, model } = getOpenAIConfig(useFallback);

  const openai = new OpenAI({
    baseURL,
    apiKey,
    maxRetries: 0, // 禁用SDK自动重试
  });

  try {
    const completion = await openai.chat.completions.create({
      messages,
      model,
      max_tokens: 4096,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: true,
    });

    return new Response(completion.toReadableStream(), {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      // 记录详细的错误信息
      console.error(`OpenAI API Error - Status: ${error.status}, Code: ${error.code}, Message: ${error.message}`);

      // 所有非2xx状态码都会进入这里
      // 500+服务端错误触发配置切换
      if (error.status && error.status >= 500) {
        throw new Error(`OpenAI Server Error: ${error.status}`);
      }
      // 其他错误(400-499)直接抛出
      throw error;
    }

    // 网络错误等也触发配置切换
    throw error;
  }
};

export async function POST(req: Request): Promise<Response> {
  // 检查限流
  const rateLimitResponse = await checkRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  // 构建消息（只执行一次）
  const { prompt, option, command } = await req.json();
  const processedCommand = processCommand(option, command);
  const messages = buildMessages(option, prompt, processedCommand);

  try {
    // 先尝试主配置
    return await createOpenAIRequest(messages, false);
  } catch (error) {
    console.warn("Primary config failed, trying fallback", error);
    try {
      // 回退到备用配置
      return await createOpenAIRequest(messages, true);
    } catch (fallbackError) {
      console.error("Both configs failed", fallbackError);
      return new Response("OpenAI service unavailable. Please try again later.", { status: 503 });
    }
  }
}
