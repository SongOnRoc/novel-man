import { expect, test } from "@playwright/test";

async function assertPageInteractiveAfterDialogClose(page: any) {
  // 复现/抓证据：检查 Radix Portal/overlay 是否残留，避免 pointer-events 被遮罩拦截。
  await expect(
    page.locator('[data-slot="alert-dialog-overlay"][data-state="open"]')
  ).toHaveCount(0, { timeout: 30000 });
  await expect(
    page.locator('[data-slot="dropdown-menu-content"][data-state="open"]')
  ).toHaveCount(0, { timeout: 30000 });

  // 用户侧排查指令等价物：document.querySelectorAll('[data-radix-portal]')
  // 注意：Radix Portal 可能在关闭后仍保留节点，但不应再有 overlay/拦截。
  const portalCount = await page
    .evaluate(() => document.querySelectorAll('[data-radix-portal]').length)
    .catch(() => -1);

  // 核心证据：body 的 pointer-events 不应被锁死为 none。
  const bodyPointerEvents = await page.evaluate(() =>
    document.body.style.pointerEvents
  );
  expect(bodyPointerEvents).not.toBe("none");

  // 最小断言：删除后仍可点击页面主按钮（不需要刷新）。
  await page.getByRole("link", { name: "创建新作品" }).click();
  await page.waitForURL(/\/works\/new(\?.*)?$/, { timeout: 60000 });

  // portalCount 仅用于调试输出（不作为断言避免误报）
  test.info().annotations.push({
    type: "radix-portals",
    description: String(portalCount),
  });
}

type CreatedIdPayload = {
  id?: unknown;
  data?: unknown;
};

function toNumericId(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function extractIdFromMaybeEnvelope(payload: unknown): number | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const directId = toNumericId((payload as CreatedIdPayload).id);
  if (directId) {
    return directId;
  }

  const data = (payload as CreatedIdPayload).data;
  if (data && typeof data === "object") {
    const dataId = toNumericId((data as CreatedIdPayload).id);
    if (dataId) {
      return dataId;
    }

    const nested = (data as CreatedIdPayload).data;
    if (nested && typeof nested === "object") {
      const nestedId = toNumericId((nested as CreatedIdPayload).id);
      if (nestedId) {
        return nestedId;
      }
    }
  }

  return undefined;
}

// Next dev 首次进入路由可能触发编译，默认 60s 对部分机器不够。
test.setTimeout(180000);

async function login(page: any) {
  // 为避免 Next dev 首次编译/水合不稳定，登录做最多 5 次尝试：
  // - 如果出现原生表单 GET 提交（URL 变成 /login?identifier=...），则视为水合未完成，重置回 /login 再试。
  for (let attempt = 1; attempt <= 5; attempt++) {
    // warmup：让 Next dev 先编译一轮
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 120000 });

    // 登录页：优先等待 domcontentloaded；再尽力等待一次 networkidle（dev 下可能失败，忽略即可）
    await page.goto("/login", {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {
      // ignore
    });

    const identifierInput = page
      .locator('input[name="identifier"], input[placeholder*="用户名"]')
      .first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await identifierInput.waitFor({ state: "visible", timeout: 60000 });

    // 等待一小段时间，让 React 事件绑定更稳定（避免原生 GET 提交）
    await page.waitForTimeout(1200);

    await identifierInput.fill("string");
    await passwordInput.fill("stringst");

    await submitButton.click();

    // 登录后应跳转到 /dashboard；若水合失败则会跳到 /login?identifier=...（原生 GET 提交）
    const dashboardPromise = page.waitForURL(/\/dashboard(\?.*)?$/, {
      timeout: 30000,
      waitUntil: "domcontentloaded",
    });

    const badNativeSubmitPromise = page
      .waitForURL(/\/login\?.+/, {
        timeout: 30000,
        waitUntil: "domcontentloaded",
      })
      .then(() => {
        throw new Error("登录页发生原生 GET 提交（疑似未水合）");
      });

    try {
      await Promise.race([dashboardPromise, badNativeSubmitPromise]);
      return;
    } catch (error) {
      const currentUrl = page.url();
      if (attempt < 5) {
        // 重置回干净的 /login，避免 query 参数残留
        await page.goto("/login", {
          waitUntil: "domcontentloaded",
          timeout: 120000,
        });
        await page.waitForTimeout(800);
        continue;
      }

      throw new Error(
        `登录失败（attempt=${attempt}），当前 URL=${currentUrl}，err=${String(
          (error as Error)?.message ?? error
        )}`
      );
    }
  }
}

async function createWork(page: any, title: string): Promise<number> {
  await page.goto("/works/new", {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {
    // dev 环境偶发网络请求不断（如 HMR），不强制要求 networkidle
  });

  await page.getByLabel("作品标题").fill(title);

  // 原生 <select>
  await page.getByLabel("作品类型").selectOption({ label: "其他" });

  const createResponsePromise = page.waitForResponse(
    (resp: any) =>
      resp.request().method() === "POST" &&
      resp.url().includes("/api/proxy/works") &&
      resp.status() >= 200 &&
      resp.status() < 300,
    { timeout: 60000 }
  );

  await page.getByRole("button", { name: "创建作品" }).click();

  const createResp = await createResponsePromise;
  const createdJson = await createResp.json().catch(() => undefined);
  const workId = extractIdFromMaybeEnvelope(createdJson);
  if (!workId) {
    throw new Error(`未从创建作品响应中获取 workId：${String(createdJson)}`);
  }

  await page.waitForURL(/\/works(\?.*)?$/, { timeout: 60000 });
  return workId;
}

async function createDraftLinkedToWork(
  page: any,
  draftTitle: string,
  workTitle: string
) {
  await page.goto("/drafts", {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await page.waitForLoadState("networkidle");

  // 打开新建草稿对话框
  await page.getByRole("button", { name: "新草稿" }).click();

  // Radix Dialog：后续所有定位尽量限定在弹框内，避免误点到页面顶部的筛选 Select。
  const dialog = page.getByRole("dialog", { name: "新建草稿" });
  await expect(dialog).toBeVisible();

  await dialog.getByLabel("草稿标题（可选）").fill(draftTitle);

  // 选择关联作品（shadcn/ui Select）
  // 注意：NewDraftDialog 里 label 未通过 htmlFor 绑定到 Trigger，无法用 getByLabel 直接定位。
  const workField = dialog
    .locator('label:has-text("关联作品（可选）")')
    .locator("..");

  // Trigger 文本会从“占位”变成作品名；不要用 hasText 过滤，否则选中后 locator 会变成 0 个元素。
  const workSelectTrigger = workField
    .locator('[data-slot="select-trigger"]')
    .first();

  await workSelectTrigger.click();

  // SelectContent 通过 Portal 挂到 document.body，因此这里不能限定在 dialog 内
  const selectContent = page.locator(
    '[data-slot="select-content"][data-state="open"]'
  );
  await expect(selectContent).toBeVisible();

  // Radix SelectItem 的 role 通常为 option；如果角色不稳定，fallback 到文本点击。
  const optionByRole = selectContent.getByRole("option", {
    name: workTitle,
    exact: true,
  });
  if (await optionByRole.count()) {
    await optionByRole.first().click();
  } else {
    await selectContent.getByText(workTitle, { exact: true }).click();
  }

  // 选中后 SelectContent 应关闭，且 Trigger 文本应更新为作品名
  await expect(selectContent).toBeHidden({ timeout: 15000 });
  await expect(workSelectTrigger).toContainText(workTitle, { timeout: 15000 });

  await dialog.getByRole("button", { name: "确认创建" }).click();

  // 创建成功后会跳转到编辑页
  await page.waitForURL(/\/drafts\/(\d+)\/edit/, { timeout: 60000 });
}

test.describe("work-delete-draft-handling: 删除作品（存在关联草稿时的 409 二次确认）", () => {
  test("409 -> 选择 unlink -> 二次删除成功，且草稿卡片显示“未关联作品”", async ({
    page,
  }) => {
    await login(page);

    const workTitle = `e2e-作品-${Date.now()}`;
    const draftTitle = `e2e-草稿-${Date.now()}`;

    const workId = await createWork(page, workTitle);
    await createDraftLinkedToWork(page, draftTitle, workTitle);

    // 回到作品列表，触发删除
    await page.goto("/works");
    await page.waitForLoadState("networkidle");

    // 在包含该作品标题的卡片中打开菜单并点击“删除作品”
    const card = page
      .getByText(workTitle)
      .first()
      .locator("..")
      .locator("..")
      .locator("..")
      .locator("..");

    // WorkCard 菜单按钮的可访问名称来自 sr-only 文本“更多操作”
    await card.getByRole("button", { name: "更多操作" }).click();
    await page.getByRole("menuitem", { name: "删除作品" }).click();

    // 首次确认删除：后端应返回 409，前端进入二次确认态
    const firstDelete409Promise = page.waitForResponse(
      (resp: any) =>
        resp.request().method() === "DELETE" &&
        resp.url().includes(`/api/proxy/works/${workId}`) &&
        !resp.url().includes("draftHandling=") &&
        resp.status() === 409,
      { timeout: 60000 }
    );

    await page.getByRole("button", { name: "确认删除" }).click();
    await firstDelete409Promise;

    await expect(page.getByText("检测到关联草稿")).toBeVisible();

    // 选择 unlink 策略并执行二次删除
    const secondDelete200Promise = page.waitForResponse(
      (resp: any) =>
        resp.request().method() === "DELETE" &&
        resp.url().includes(`/api/proxy/works/${workId}`) &&
        resp.url().includes("draftHandling=unlink") &&
        resp.status() >= 200 &&
        resp.status() < 300,
      { timeout: 60000 }
    );

    await page.getByRole("button", { name: "解除关联并删除作品" }).click();
    await secondDelete200Promise;

    // 等待弹框关闭 & 验证页面交互未被 overlay 卡死
    await expect(page.getByText("检测到关联草稿")).toBeHidden({
      timeout: 60000,
    });
    await assertPageInteractiveAfterDialogClose(page);

    await page.goto("/works", { waitUntil: "networkidle", timeout: 120000 });

    // 作品卡片应消失（删除成功）
    await expect(page.getByRole("heading", { name: workTitle })).toHaveCount(
      0,
      {
        timeout: 30000,
      }
    );

    // 验证草稿在“其他草稿”（workId=0）中展示为未关联作品
    await page.goto("/drafts?workId=0", {
      waitUntil: "networkidle",
      timeout: 120000,
    });

    const draftCard = page
      .getByText(draftTitle)
      .first()
      .locator("..")
      .locator("..");
    await expect(draftCard.getByText("未关联作品")).toBeVisible({
      timeout: 30000,
    });
  });

  test("409 -> 选择 delete -> 二次删除成功，且草稿不再出现在草稿列表（无需刷新）", async ({
    page,
  }) => {
    await login(page);

    const workTitle = `e2e-作品-${Date.now()}`;
    const draftTitle = `e2e-草稿-${Date.now()}`;

    const workId = await createWork(page, workTitle);
    await createDraftLinkedToWork(page, draftTitle, workTitle);

    // 回到作品列表，触发删除
    await page.goto("/works");
    await page.waitForLoadState("networkidle");

    // 在包含该作品标题的卡片中打开菜单并点击“删除作品”
    const card = page
      .getByText(workTitle)
      .first()
      .locator("..")
      .locator("..")
      .locator("..")
      .locator("..");

    await card.getByRole("button", { name: "更多操作" }).click();
    await page.getByRole("menuitem", { name: "删除作品" }).click();

    // 首次确认删除：后端应返回 409，前端进入二次确认态
    const firstDelete409Promise = page.waitForResponse(
      (resp: any) =>
        resp.request().method() === "DELETE" &&
        resp.url().includes(`/api/proxy/works/${workId}`) &&
        !resp.url().includes("draftHandling=") &&
        resp.status() === 409,
      { timeout: 60000 }
    );

    await page.getByRole("button", { name: "确认删除" }).click();
    await firstDelete409Promise;

    await expect(page.getByText("检测到关联草稿")).toBeVisible();

    // 选择 delete 策略并执行二次删除
    const secondDelete200Promise = page.waitForResponse(
      (resp: any) =>
        resp.request().method() === "DELETE" &&
        resp.url().includes(`/api/proxy/works/${workId}`) &&
        resp.url().includes("draftHandling=delete") &&
        resp.status() >= 200 &&
        resp.status() < 300,
      { timeout: 60000 }
    );

    await page.getByRole("button", { name: "删除草稿并删除作品" }).click();
    await secondDelete200Promise;

    await expect(page.getByText("检测到关联草稿")).toBeHidden({
      timeout: 60000,
    });
    await assertPageInteractiveAfterDialogClose(page);

    await page.goto("/works", { waitUntil: "networkidle", timeout: 120000 });

    // 作品卡片应消失（删除成功）
    await expect(page.getByRole("heading", { name: workTitle })).toHaveCount(
      0,
      {
        timeout: 30000,
      }
    );

    // 关键回归点：切换到草稿页后，不应看到已硬删除的草稿（不允许手动刷新）
    await page.goto("/drafts", { waitUntil: "networkidle", timeout: 120000 });

    await expect(page.getByText(draftTitle)).toHaveCount(0, {
      timeout: 30000,
    });
  });
});
