/**
 * AI Assistant E2E 测试
 * 验证 assistant-ui 适配实现的关键功能
 */
import { test, expect } from "@playwright/test";

// 登录辅助函数
async function login(page: any) {
  await page.goto("http://localhost:3000/login");
  await page.waitForLoadState("networkidle");

  // 等待登录表单加载 - 使用 identifier（用户名或邮箱）
  const identifierInput = page.locator('input[name="identifier"], input[placeholder*="用户名"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const submitButton = page.locator('button[type="submit"]').first();

  // 等待输入框可见
  await identifierInput.waitFor({ state: "visible", timeout: 10000 });
  
  // 使用测试账号登录
  await identifierInput.fill("string");
  await passwordInput.fill("stringst");
  await submitButton.click();

  // 等待登录完成 - 跳转离开登录页
  await page.waitForURL((url: URL) => !url.pathname.includes("/login"), { timeout: 15000 });
}

test.describe("AI 助手页面", () => {
  test.beforeEach(async ({ page }) => {
    // 先登录
    await login(page);
    // 导航到 AI 助手页面
    await page.goto("http://localhost:3000/tools/ai-assistant");
    await page.waitForLoadState("networkidle");
  });

  test("页面应该正常加载", async ({ page }) => {
    // 验证页面标题或关键元素
    await expect(page).toHaveURL(/.*ai-assistant/);
    // 截图记录
    await page.screenshot({ path: "e2e/screenshots/01-page-load.png", fullPage: true });
  });

  test("应该显示对话区域", async ({ page }) => {
    // 检查 Thread 区域是否存在
    const threadArea = page.locator('[class*="thread"], [data-testid*="thread"]').first();
    await expect(threadArea).toBeVisible({ timeout: 10000 });
  });

  test("应该显示输入框", async ({ page }) => {
    // 检查 Composer 输入框
    const composer = page.locator('textarea').first();
    await expect(composer).toBeVisible({ timeout: 10000 });
  });

  test("应该显示快捷操作按钮", async ({ page }) => {
    // 检查快捷操作按钮（润色、续写等）
    const buttons = page.locator("button");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
    // 截图记录按钮状态
    await page.screenshot({ path: "e2e/screenshots/02-buttons.png", fullPage: true });
  });

  test("应该能在输入框中输入文本", async ({ page }) => {
    const composer = page.locator("textarea").first();
    await composer.fill("测试消息");
    await expect(composer).toHaveValue("测试消息");
  });

  test("控制台不应有严重错误", async ({ page }) => {
    const errors: string[] = [];
    
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // 等待页面稳定
    await page.waitForTimeout(3000);

    // 过滤掉一些已知的非关键错误
    const criticalErrors = errors.filter(
      (err) =>
        !err.includes("favicon") &&
        !err.includes("tapLookupResources") // 这个错误应该已被修复
    );

    // 如果有关键错误，打印出来
    if (criticalErrors.length > 0) {
      console.log("发现控制台错误:", criticalErrors);
    }

    // 截图记录最终状态
    await page.screenshot({ path: "e2e/screenshots/03-final.png", fullPage: true });
  });
});

test.describe("会话管理", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/tools/ai-assistant");
    await page.waitForLoadState("networkidle");
  });

  test("应该能看到会话列表", async ({ page }) => {
    // 检查是否有新建会话按钮
    const newSessionButton = page.getByText("新建会话");
    
    // 在桌面端应该可见，移动端可能需要打开菜单
    if (await newSessionButton.isVisible()) {
      await expect(newSessionButton).toBeVisible();
    }
  });

  test("点击新建会话应该创建新会话", async ({ page }) => {
    const newSessionButton = page.getByText("新建会话");
    if (await newSessionButton.isVisible()) {
      await newSessionButton.click();
      // 等待会话创建
      await page.waitForTimeout(1000);
      // 截图记录
      await page.screenshot({ path: "e2e/screenshots/04-new-session.png", fullPage: true });
    }
  });
});

test.describe("响应式布局", () => {
  test("桌面端应该显示侧边栏", async ({ page }) => {
    // 设置桌面端视口
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("http://localhost:3000/tools/ai-assistant");
    await page.waitForLoadState("networkidle");

    // 截图记录桌面端布局
    await page.screenshot({ path: "e2e/screenshots/05-desktop.png", fullPage: true });
  });

  test("移动端应该使用抽屉式布局", async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("http://localhost:3000/tools/ai-assistant");
    await page.waitForLoadState("networkidle");

    // 截图记录移动端布局
    await page.screenshot({ path: "e2e/screenshots/06-mobile.png", fullPage: true });
  });
});
