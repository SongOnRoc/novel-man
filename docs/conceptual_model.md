# 核心数据模型 - 业务逻辑与关系图 (最终修订版)

## 一、 业务逻辑核心总结 (严格遵循用户要求)

-   **用户 (User)**
    -   是所有数据的根属主。

-   **作品 (Work)**
    -   直接隶属于 `User`。
    -   **拥有的属性**:
        -   分卷列表 (List of Volumes)
        -   章节列表 (List of Chapters, for works without volumes)
        -   草稿列表 (List of Drafts, for works without volumes)
        -   角色列表 (List of Characters)
        -   世界观列表 (List of Worldviews)
        -   作品总纲 (Main Outline)

-   **分卷 (Volume)**
    -   直接隶属于 `Work`。
    -   **拥有的属性**:
        -   章节列表 (List of Chapters)
        -   草稿列表 (List of Drafts)
        -   分卷大纲 (Volume Outline)

-   **章节/草稿 (Chapter/Draft)**
    -   可以隶属于 `Work` 或 `Volume`。
    -   **拥有的属性**:
        -   章节细纲 / 草稿描述 (Detailed Outline / Description)
        -   章节内容 (Content)

-   **角色/世界观 (Character/Worldview)**
    -   直接隶属于 `Work` (多对一)。
    -   **关联关系**:
        -   角色经历可关联到多个章节 (一对多引用)。
        -   世界观设定可关联到多个章节 (一对多引用)。

## 二、 关系图 (ASCII Tree - 完整修订版)

```
[ User ]
   |
   `-- owns --> [ Work ]
                 |
                 +-- owns --> [ Main Outline ]
                 |
                 +-- owns --> [ List of Volumes ]
                 |            |
                 |            `-- [ Volume ]
                 |                |
                 |                +-- owns --> [ Volume Outline ]
                 |                |
                 |                +-- owns --> [ List of Chapters ]
                 |                |            `-- [ Chapter ] (owns Outline, Content)
                 |                |
                 |                `-- owns --> [ List of Drafts ]
                 |                             `-- [ Draft ] (owns Description, Content)
                 |
                 +-- owns --> [ List of Chapters (work-level) ]
                 |            `-- [ Chapter ] (owns Outline, Content)
                 |
                 +-- owns --> [ List of Drafts (work-level) ]
                 |            `-- [ Draft ] (owns Description, Content)
                 |
                 +-- owns --> [ List of Characters ]
                 |            `-- [ Character ] -- references --> [ Chapter ]
                 |
                 `-- owns --> [ List of Worldviews ]
                              `-- [ Worldview ] -- references --> [ Chapter ]