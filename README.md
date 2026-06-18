# 浮生录 The Transient Annals

![浮生录 Logo](public/fushenglu-logo.png)

浮生录是一个用于整理人物、事件、关系、时间线与资料档案的可视化图谱工作台。它面向历史研究、小说创作、剧本推演和世界观设定，帮助你把分散线索整理成一份可持续维护、可回看、可联动的案卷。

## 核心特性

- 多项目案卷：每个项目独立保存人物、事件、关系、因果连接和资料条目。
- 项目模板：新建时可选择“历史人物事件”或“小说人物情节”，模板会决定字段、导航、关系类型和示例数据。
- 人物页：支持新增、编辑、删除人物、角色、组织和地点，并可上传头像。
- 事件页：记录时间标签、地点、相关人物、标签和事件描述。
- 时间线：按 `order` 展示纵向时间线，适合年代、章节和幕次整理。
- 群像图：基于 React Flow 展示人物关系，可拖拽节点、点击节点或边查看详情。
- 因果图：展示事件之间的导致、影响、转折、伏笔、回收和对照关系。
- 画布内创建：可在群像图和因果图中直接拖拽建边，再补充关系说明。
- 图谱样式：支持实线、虚线、点线、颜色、线宽和流动效果设置。
- 藏卷：用于沉淀资料、引用、摘录、备注和灵感片段。
- 使用手册：提供独立帮助页和项目内帮助页，统一说明操作路径与数据保存方式。
- 数据管理：支持 JSON 导入导出、恢复示例数据和本地清空。
- 后端优先：优先同步本地 API；后端不可用时回退到浏览器 `localStorage`。

## 技术栈

- React + TypeScript + Vite
- Tailwind CSS
- React Router
- React Flow
- Zustand + localStorage
- Express + Zod
- Lucide React
- Vitest + Testing Library

## 快速开始

```bash
npm install
npm run dev
```

`npm run dev` 会同时启动前端页面和本地后端。默认地址通常是：

```text
http://127.0.0.1:5173/
http://127.0.0.1:4177/api
```

## 常用脚本

```bash
npm run dev      # 同时启动前端和后端
npm run dev:web  # 仅启动前端
npm run dev:api  # 仅启动后端
npm run api      # 启动后端 API
npm run test     # 运行测试
npm run lint     # 运行代码检查
npm run build    # 类型检查并构建生产包
npm run preview  # 预览构建结果
```

## 路由结构

- `/`：产品首页
- `/projects`：图谱项目列表
- `/projects/new`：选择项目模板
- `/help`：使用手册
- `/projects/new?template=history`：创建历史项目
- `/projects/new?template=fiction`：创建小说项目
- `/projects/:projectId/dashboard`：项目总览
- `/projects/:projectId/entities`：人物志
- `/projects/:projectId/events`：事件簿
- `/projects/:projectId/timeline`：时间线
- `/projects/:projectId/relation-graph`：群像图 / 势力图
- `/projects/:projectId/event-graph`：因果图
- `/projects/:projectId/library`：藏卷 / 史料库
- `/projects/:projectId/help`：项目内使用手册
- `/projects/:projectId/settings`：项目设置

## 项目结构

```text
src/
├─ components/   # 通用 UI、图谱画布、详情面板、编辑弹窗
├─ content/      # 使用手册内容
├─ data/         # 示例数据
├─ hooks/        # 项目上下文 hooks
├─ layouts/      # 首页与项目工作台布局
├─ pages/        # 路由页面
├─ routes/       # React Router 配置
├─ store/        # Zustand 状态与持久化
├─ templates/    # 项目模板配置
└─ types/        # 业务类型

server/
├─ data/         # 本地数据库 JSON
└─ src/
   ├─ index.ts   # Express API
   ├─ schema.ts  # Zod 校验与归一化
   └─ storage.ts # JSON 文件存储
```

## 数据模型

核心对象包括：

- `Entity`：人物、角色、组织、地点等实体
- `StoryEvent`：历史事件、章节情节、伏笔节点等
- `EntityRelation`：人物或组织之间的关系
- `EventLink`：事件之间的因果、伏笔、回收、转折连接
- `LibraryItem`：资料、摘录、备注、灵感片段
- `entityNodePositions` / `eventNodePositions`：图谱节点坐标
- `EdgeVisualStyle`：连线样式
- `ProjectTemplateId`：当前支持 `history` 和 `fiction`

当前数据结构使用 `schemaVersion: 3`。前端会优先同步到 `server/data/fushenglu-db.json`，后端不可用时退回 `localStorage`。

## 模板说明

- `history`：历史人物事件。偏重人物志、纪事簿、编年轴、史料库，以及朝代、生卒、事件类型等字段。
- `fiction`：小说人物情节。偏重人物志、事件簿、流年轴、藏卷，以及动机、人物弧光、章节、伏笔回收等字段。

旧项目缺少 `templateId` 时，会根据 `category` 自动归入历史或小说模板。

## 后端接口

- `GET /api/health`：检查后端状态和数据版本。
- `GET /api/projects`：读取全部项目。
- `GET /api/projects/:projectId`：读取单个项目。
- `POST /api/projects`：创建项目。
- `PUT /api/projects/:projectId`：保存完整项目数据。
- `DELETE /api/projects/:projectId`：删除项目。
- `POST /api/projects/:projectId/restore-sample`：恢复示例数据。
- `PATCH /api/projects/:projectId/node-positions/:kind/:nodeId`：保存节点坐标。
- `PATCH /api/projects/:projectId/relations/:relationId/style`：更新人物关系线样式。
- `PATCH /api/projects/:projectId/event-links/:linkId/style`：更新事件连接线样式。

## 验证

```bash
npm run test
npm run lint
npm run build
```
