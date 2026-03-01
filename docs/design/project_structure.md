# 项目目录结构设计文档

## 1. 概述

本文档描述了 novel-man 项目的整体目录结构设计，该项目是一个用于小说创作和管理的全栈应用程序。项目采用前后端分离架构，包含后端服务、前端应用、文档和端到端测试等部分。

## 2. 根目录结构

```
novel-man/
├── backend/          # 后端项目路径
├── frontend/         # 前端项目路径
├── docs/             # 项目文档路径
├── e2e/              # 端到端黑核测试项目路径
├── .gitignore        # Git忽略文件配置
└── README.md         # 项目说明文档
```

## 3. 后端目录结构 (backend/)

```
backend/
├── config.example.yaml    # 配置文件示例
├── go.mod                 # Go模块定义
├── go.sum                 # Go模块校验和
├── main.go                # 应用程序入口
├── internal/              # 内部包目录
│   ├── apps/              # 应用程序模块
│   │   ├── ai/            # AI相关功能模块
│   │   ├── auth/          # 认证授权模块
│   │   ├── chapters/      # 章节管理模块
│   │   ├── characters/    # 角色管理模块
│   │   ├── drafts/        # 草稿管理模块
│   │   ├── relationships/ # 关系管理模块
│   │   ├── settings/      # 设置管理模块
│   │   ├── works/         # 作品管理模块
│   │   └── worldview/     # 世界观管理模块
│   ├── cmd/               # 命令行接口
│   ├── config/            # 配置管理
│   ├── db/                # 数据库相关
│   ├── logger/            # 日志管理
│   ├── middlewares/       # 中间件
│   ├── models/            # 数据模型
│   ├── router/            # 路由管理
│   └── utils/             # 工具函数
└── utils/                 # 工具函数目录
    └── context/           # 上下文工具
```

## 4. 前端目录结构 (frontend/)

```
frontend/
├── .gitignore             # Git忽略文件配置
├── components.json        # 组件配置
├── eslint.config.mjs      # ESLint配置
├── next.config.ts         # Next.js配置
├── package.json           # 项目依赖配置
├── pnpm-lock.yaml         # 依赖锁定文件
├── postcss.config.mjs     # PostCSS配置
├── README.md              # 项目说明文档
├── public/                # 静态资源目录
└── src/                   # 源代码目录
    ├── app/               # 应用页面目录
    │   ├── (auth)/        # 认证相关页面
    │   ├── (main)/        # 主要功能页面
    │   ├── api/           # API路由
    │   ├── favicon.ico    # 网站图标
    │   └── globals.css    # 全局样式
    ├── components/        # 组件目录
    ├── contexts/          # 上下文目录
    ├── hooks/             # 自定义Hook目录
    ├── lib/               # 库函数目录
    ├── test/              # 测试目录
    └── types/             # TypeScript类型定义
```

## 5. 文档目录结构 (docs/)

```
docs/
├── conceptual_model.md    # 核心数据模型文档
├── design/                # 设计文档目录
│   └── project_structure.md  # 项目目录结构设计文档
├── fix/                   # 问题修复文档
├── requirements/          # 需求文档
├── steps/                 # 开发过程文档
├── tasks/                 # 任务文档
└── tech/                  # 技术文档
```

## 6. 端到端测试目录结构 (e2e/)

```
e2e/
├── .jwt_token             # JWT令牌文件
├── auth_test.go           # 认证测试
├── chapters_test.go       # 章节测试
├── go.mod                 # Go模块定义
├── go.sum                 # Go模块校验和
├── main_test.go           # 主测试文件
└── works_test.go          # 作品测试
```

## 7. 设计原则

1. **模块化**: 后端按照功能模块划分，每个模块包含自己的路由、服务和模型。
2. **分层架构**: 前端采用Next.js的App Router结构，按功能划分页面和组件。
3. **关注点分离**: 文档、测试和主应用代码分离，便于维护和管理。
4. **可扩展性**: 目录结构设计考虑了未来功能的扩展需求。

## 8. 维护说明

- 任何目录结构的变更都应在此文档中更新
- 新增模块时应遵循现有的目录结构模式
- 文档应与实际代码结构保持同步