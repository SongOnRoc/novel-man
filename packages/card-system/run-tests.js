const { execSync } = require("node:child_process");
const path = require("node:path");

// 获取当前目录
const currentDir = __dirname;

try {
  // 运行测试命令
  console.log("正在运行卡片系统测试...");
  execSync("npx jest", {
    cwd: currentDir,
    stdio: "inherit",
  });
  console.log("测试完成！");
} catch (error) {
  console.error("测试运行失败:", error.message);
  process.exit(1);
}
