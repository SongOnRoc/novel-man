"""
AI Assistant Integration Test
Verifies the assistant-ui adaptation implementation
"""
from playwright.sync_api import sync_playwright
import time


def test_ai_assistant():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # 使用有头模式便于观察
        page = browser.new_page()

        print("1. 导航到 AI助手页面...")
        page.goto('http://localhost:3000/tools/ai-assistant')
        page.wait_for_load_state('networkidle')
        time.sleep(2)

        # 截图记录初始状态
        page.screenshot(path='e2e/screenshots/01-initial.png', full_page=True)
        print("   ✓ 页面加载成功")

        # 检查页面结构
        print("\n2. 检查页面组件...")

        # 检查是否有 Thread 区域
        thread_area = page.locator('[class*="thread"]').first
        if thread_area.is_visible():
            print("   ✓ Thread 区域可见")
        else:
            print("   ⚠ Thread 区域未找到")

        # 检查是否有 Composer 输入框
        composer = page.locator('textarea, input[type="text"]').first
        if composer.is_visible():
            print("   ✓ Composer 输入框可见")
        else:
            print("   ⚠ Composer 未找到")

        page.screenshot(
            path='e2e/screenshots/02-components.png', full_page=True)

        # 检查快捷操作按钮
        print("\n3. 检查快捷操作按钮...")
        buttons = page.locator('button').all()
        button_texts = [b.inner_text() for b in buttons if b.is_visible()]
        print(f"   找到 {len(button_texts)} 个按钮: {
              button_texts[:10]}...")  # 显示前10个

        # 检查 ThreadList（如果存在）
        print("\n4. 检查会话列表...")
        thread_list = page.locator(
            '[class*="thread-list"], [class*="ThreadList"]').first
        if thread_list.is_visible():
            print("   ✓ ThreadList 可见")
        else:
            # 可能需要切换到显示模式
            print("   ThreadList 可能在侧边栏中")

        # 检查控制台错误
        print("\n5. 检查控制台错误...")
        console_errors = []
        page.on("console", lambda msg: console_errors.append(
            msg.text) if msg.type == "error" else None)

        # 等待一段时间收集可能的错误
        time.sleep(2)

        if console_errors:
            print(f"   ⚠ 发现 {len(console_errors)} 个控制台错误:")
            for err in console_errors[:5]:
                print(f"     - {err[:100]}...")
        else:
            print("   ✓ 无控制台错误")

        page.screenshot(path='e2e/screenshots/03-final.png', full_page=True)

        print("\n===== 测试完成 =====")
        print("截图已保存到 e2e/screenshots/ 目录")
        browser.close()


if __name__ == "__main__":
    import os
    os.makedirs("e2e/screenshots", exist_ok=True)
    test_ai_assistant()
