# 步骤 2：建立自动化 API 工作流

## 1. 目标

本阶段的核心目标是彻底改变前端手动维护 API 类型和请求代码的传统模式，建立一个基于后端 OpenAPI 规范的、全自动的、类型安全的代码生成工作流。

## 2. 核心流程与决策

我们最终确立了一个严谨、分层、且经过“技术前瞻性验证”的全局接口管理策略。

1.  **确立“基准红线”:** 任何技术决策都必须包含“技术前瞻性验证”环节，通过引用权威外部佐证来证明方案的现代性。
2.  **后端规范现代化:** 我们首先推动后端，将 API 规范从过时的 Swagger 2.0 升级到了现代的 OpenAPI 3.1。
3.  **工程规范固化:**
    -   我们摒弃了脆弱的口头约定，通过在 `package.json` 中设置 `packageManager` 字段，利用 Node.js Corepack 从工程层面强制项目统一使用 `pnpm`。
    -   相关设计决策被详细记录在 `docs/design/new/frontend/package_manager_standardization.md`。
4.  **HTTP 客户端选型:**
    -   我们对 `axios`, `fetch` 等方案进行了对比，并澄清了 `axios` (执行者) 与 `@tanstack/react-query` (协调者) 的关系。
    -   最终决定标准化地使用 `axios`，因为它强大的拦截器功能是我们架构的基石。
    -   相关设计决策被详细记录在 `docs/design/new/frontend/http_client_strategy.md`。
5.  **双工具代码生成策略:**
    -   我们最终选择了一个职责分离的双工具策略，以追求极致的架构清晰性。
    -   **类型生成:** 使用 `openapi-typescript` 生成纯粹、无依赖的 TS 类型。
    -   **Client 生成:** 使用 `Orval` 读取 OpenAPI 规范和生成的类型，创建与我们自定义 `axios` 实例集成的、类型安全的 API 请求函数。
    -   相关设计决策被详细记录在 `docs/design/new/frontend/api_codegen_strategy.md`。
6.  **BFF 安全与抽象策略:**
    -   我们明确了 BFF 的核心安全职责：**防止密钥暴露**和**防止爬虫抓取**。
    -   最终确立了**混合模式**：默认使用**透明代理**以保证开发效率，同时为复杂场景（如 API 聚合）创建**抽象代理**。
    -   所有 BFF 请求都将增加**强制认证**和**速率限制**等安全中间件。
    -   相关设计决策被详细记录在 `docs/design/new/frontend/bff_strategy.md`。

## 3. 遇到的核心问题与解决方案

| 问题 | 根源分析 | 解决方案 |
| :--- | :--- | :--- |
| **`openapi-typescript` 执行失败** | 后端 `swagger.json` 是过时的 Swagger 2.0 格式，与现代工具不兼容。 | **[修正方案]** 推动后端升级 `swaggo` 工具链，通过 `swag init --v3.1` 命令直接生成 OpenAPI 3.1 规范，从根源解决问题。 |
| **后端 Swagger UI (运行时) 500 错误** | `swag init --v3.1` 生成的 `docs.go` 与后端使用的旧版 `gin-swagger` 库不兼容。 | **[修正方案]** (由用户解决) 升级后端的 `gin-swagger` 依赖库至支持 OpenAPI 3.0+ 的版本。 |
| **`orval` 找不到 `mutator` 文件** | `orval.config.js` 中 `mutator` 的 `path` 配置错误。 | **[修正方案]** 创建一个全局的 `axios` 实例 (`/src/lib/axios.ts`)，并在 `orval.config.js` 中使用正确的相对路径指向它。 |
| **`next-auth` 的 `Session` 类型错误** | 默认的 `Session` 类型不包含我们自定义的 `accessToken` 字段。 | **[修正方案]** 创建 `src/types/next-auth.d.ts` 类型声明文件，通过模块扩展为 `Session` 和 `JWT` 类型添加自定义字段。 |
| **`orval` 无法识别 `export default`** | `orval` 的静态分析器无法将 `export default axiosInstance` 识别为一个“函数”。 | **[修正方案]** 将 `axios.ts` 的导出方式从 `export default` 修改为 `export const customInstance = ...` 的具名函数导出，并相应更新 `orval.config.js`。 |
| **`prettier` 钩子执行失败** | `orval` 的执行环境找不到 `prettier` 命令，因为项目中并未直接安装 `prettier` 包。 | **[修正方案]** 执行 `pnpm add prettier --save-dev` 将 `prettier` 添加到开发依赖中，确保 CLI 工具可用。 |
| **BFF 与 Client 冲突** | 前端 `axios` 实例直接请求后端 API，绕过了 BFF 代理层，导致后端地址和路由结构暴露。 | **[修正方案]** 将 `axios` 实例的 `baseURL` 修改为指向 BFF 代理的相对路径 (`/api/proxy`)，确保所有请求都通过 BFF。 |

## 4. 关键命令总结

```bash
# (后端) 重新生成 OpenAPI 3.1 规范
swag init --v3.1 --parseInternal --dir ./ --generalInfo main.go --output ./docs

# (前端) 安装所有代码生成相关的开发依赖
pnpm add openapi-typescript orval prettier --save-dev

# (前端) 运行完整的代码生成流水线
pnpm api:generate

# (前端) 执行 `prettier` 钩子
pnpm exec prettier --write
```