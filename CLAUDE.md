# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

智能车间管理系统（智联车间-制造信息管理系统）— 轻量级 MES 前端，基于 Vue 3 + Vite 构建。

## 常用命令

```sh
npm install          # 安装依赖
npm run dev          # 启动开发服务器 (Vite HMR)
npm run build        # 生产构建
npm run preview      # 预览生产构建
```

## 技术栈

- **框架**: Vue 3.5+ (Composition API, `<script setup>`)
- **构建**: Vite 7
- **路由**: Vue Router 4 (history mode)
- **状态管理**: Pinia 3 (setup store 风格)
- **UI 组件库**: Element Plus 2 (中文 locale)
- **流程图**: AntV X6 (工艺流程图编辑)
- **图可视化**: AntV G6
- **HTTP**: Axios（通过 `src/utils/request.js` 统一封装）

## 项目架构

```
src/
├── main.js              # 入口：挂载 Vue/Pinia/Router/ElementPlus
├── App.vue              # 根组件：仅 <router-view />
├── router/index.js      # 路由定义：layout 为父路由，其下 13 个子路由
├── utils/request.js     # Axios 实例：baseURL=/api，token 注入，401 处理
├── api/                 # 每个域实体的 API 函数（每个文件导出多个函数）
├── stores/              # Pinia setup store：本地 CRUD + 从 API 加载
├── views/               # 每个路由对应一个文件夹，内含 index.vue
│   └── layout/          # 主布局：侧边栏 + 顶部导航 + 标签页
├── components/          # 可复用组件（卡片、对话框、按钮）
└── assets/              # 静态资源（CSS、图片）
```

## 关键架构决策

### 请求层 (`src/utils/request.js`)

所有 API 调用都通过该 Axios 实例进行。Base URL 为 `/api`，由 Vite 代理到 `http://localhost:8080`（路径重写会去掉 `/api` 前缀）。请求拦截器从 `localStorage.getItem('user')` 注入 token；响应拦截器解包 `response.data`，因此所有调用方拿到的是 `{ code, data, message }` 而非 Axios 原生响应对象。401 错误会自动清除用户信息并重定向到 `/login`。

### Pinia Store 模式

所有 store 使用组合式 setup store 风格（工厂函数），而非 options store。每个 store 管理一个实体列表（如 `processList`、`stepList`），对外暴露 `load*`（从 API 获取）、`add*`、`update*`、`delete*`（本地乐观更新）等方法。Store 不处理分页——分页逻辑由各视图自行管理。

### BOM Store 特殊逻辑

`stores/bom.js` 管理树形产品结构，包含 `listToTree`（扁平列表转嵌套树）、`flattenBomTree`、节点的添加/删除/移动等操作。展开状态通过 `expandedKeys` 集合持久化，在数据重新加载时可以恢复。

### 业务流程视图 (`views/flows/index.vue`)

这是最复杂的视图：三栏布局，左侧为工艺流程列表（按产品分组），中间为 AntV X6 画布，右侧为流程/工序/工步详情面板。支持从工序库向画布添加节点、绘制连接线、保存流程图数据。是理解视图层复杂交互模式的最佳参考。

### API 函数命名约定

每个 API 文件中的函数遵循 REST 风格命名：
- `get*Api` / `query*Api` — GET 请求（查询、列表）
- `add*Api` / `save*Api` — POST 请求（新增）
- `update*Api` — PUT 请求（修改）
- `delete*Api` — DELETE 请求（删除）
- `getAll*Api` — GET `/xxx/listAll` — 获取全部数据（供下拉选择等场景使用）

### 后端 API 响应格式

所有后端接口返回统一格式：`{ code: 200, data: ..., message: "..." }`。`code === 200` 表示成功。

### 认证流程

登录后，用户信息（含 token）存入 `localStorage.setItem('user', JSON.stringify(...))`。所有请求通过拦截器自动携带 token。退出登录或修改密码会清除 localStorage 并重定向到 `/login`。

### 路径别名

`@` 映射到 `src/`（在 `vite.config.js` 和 `jsconfig.json` 中均已配置）。

## 注意

- ElMessage 和 ElMessageBox 已在 `request.js` 拦截器和所有视图中使用，用于统一的消息提示。
- 工位管理（`/workstation`）路由已在代码中注释掉，尚未启用。
- Vite 开发服务器代理到 `localhost:8080`；该服务的 Java 后端需单独启动。
  
## 注意事项

- **输出语言**：中文
- **代码注释**：生成的代码必须包含中文注释（类、方法、字段等）

