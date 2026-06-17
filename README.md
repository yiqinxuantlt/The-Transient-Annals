# 浮生录 The Transient Annals

![浮生录 Logo](public/fushenglu-logo.png)

「浮生录」是一个用于整理人物、事件、关系、时间线和叙事脉络的可视化图谱工具原型。它不是传统后台系统，而是面向历史研究、小说创作、剧本推演和游戏世界观设定的安静型创作工作台。

你可以用它梳理人物关系、事件因果、章节节奏、伏笔回收、阵营冲突和资料摘录，让分散的设定逐渐形成一张可阅读、可追踪、可回看的叙事地图。

## 核心特性

- 多项目案卷：每个项目独立保存人物、事件、关系、因果连接和资料。
- 人物志：支持新增、编辑、删除人物 / 角色 / 组织 / 地点，并可上传头像。
- 事件簿：支持新增、编辑、删除事件，记录时间标签、地点、相关人物和标签。
- 流年轴：按 `order` 展示纵向时间线，适合年代、章节和幕次梳理。
- 群像图：基于 React Flow 展示人物关系，可拖拽节点、点击节点或边查看详情。
- 因果图：展示事件之间的导致、影响、转折、伏笔、回收、对照、背景等关系。
- 画布内创建：可在群像图 / 因果图中直接新增关系，也可从节点手柄拖拽建立连接。
- 藏卷：管理资料、引用、备注、灵感片段和原文摘录。
- 数据管理：支持 JSON 导入、导出、清空本地数据和恢复示例数据。
- 暗黑模式：支持浅色 / 暗黑模式切换，并自动保存用户选择。
- 本地优先：暂不依赖后端，数据通过 Zustand 持久化到 localStorage。

## 技术栈

- React + TypeScript + Vite
- Tailwind CSS
- React Router
- React Flow
- Zustand + localStorage
- Lucide React

## 快速开始

```bash
npm install
npm run dev
```

启动后打开终端显示的本地地址，通常是：

```bash
http://127.0.0.1:5173/
```

## 常用脚本

```bash
npm run dev      # 启动开发服务
npm run build    # 类型检查并构建生产包
npm run lint     # 运行代码检查
npm run preview  # 本地预览构建结果
```

## 路由结构

- `/`：产品首页
- `/projects`：图谱项目列表
- `/projects/:projectId/dashboard`：项目总览
- `/projects/:projectId/entities`：人物志
- `/projects/:projectId/events`：事件簿
- `/projects/:projectId/timeline`：流年轴
- `/projects/:projectId/relation-graph`：群像图
- `/projects/:projectId/event-graph`：因果图
- `/projects/:projectId/library`：藏卷
- `/projects/:projectId/settings`：项目设置

## 项目结构

```text
src/
├── App.tsx
├── main.tsx
├── components/        # 通用 UI、图谱画布、详情面板、编辑弹窗
├── data/              # 示例数据
├── hooks/             # 项目上下文 hook
├── layouts/           # 首页布局与项目工作台布局
├── pages/             # 多页面路由页面
├── routes/            # React Router 配置
├── store/             # Zustand 本地状态与持久化
└── types/             # 业务数据类型
```

## 数据模型

核心数据包括：

- `Entity`：人物、角色、组织、地点等实体。
- `StoryEvent`：历史事件、章节情节、伏笔节点等。
- `EntityRelation`：人物 / 组织 / 地点之间的关系。
- `EventLink`：事件之间的因果、伏笔、回收、转折等连接。
- `LibraryItem`：资料、摘录、备注和灵感片段。

当前版本使用 localStorage 保存数据，适合单机原型和早期体验验证。

## 后续扩展方向

- 节点位置持久化：刷新后保持手工整理过的图谱布局。
- 关系编辑能力：支持编辑人物关系和事件连接。
- 引用关联：让藏卷资料可以关联到具体人物、事件或关系。
- 多项目管理增强：支持项目复制、归档、批量导入导出。
- 协作与后端：接入账号、同步、协作编辑、版本历史和全文搜索。

## 验证状态

当前版本已通过：

```bash
npm run lint
npm run build
```
