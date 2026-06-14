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
├── main.js              # 入口：挂载 Vue/Pinia/Router/ElementPlus + ElementPlus Icons 全局注册
├── App.vue              # 根组件：仅 <router-view />
├── router/index.js      # 路由定义：layout 为父路由，其下 16 个子路由 + /login
├── utils/request.js     # Axios 实例：baseURL=/api，token 注入，401 处理
├── api/                 # 每个域实体的 API 函数（每个文件导出多个函数）
├── stores/              # Pinia setup store：三种模式（CRUD / 关联 / 树形）
├── views/               # 每个路由对应一个文件夹，内含 index.vue
│   └── layout/          # 主布局：侧边栏 + 顶部导航 + 标签页
├── components/          # 可复用组件
│   ├── *.vue            # 通用组件（HoverButton, LongTextButton）
│   ├── bom/             # BOM 相关组件
│   ├── process/         # 工序相关组件
│   ├── step/            # 工步相关组件
│   ├── flows/           # 工艺流程相关组件
│   ├── role/            # 角色管理组件（RoleFormDialog, PermissionAccordion, RolePermissionDialog）
│   ├── user/            # 员工管理组件（AssignRoleDialog）
│   └── userPermission/  # 用户权限组件（UserRolePanel）
└── assets/              # 静态资源（CSS、图片）
```

### 侧边栏菜单结构

布局组件中的菜单定义了 6 个功能模块组，部分路由在多个菜单中出现（如 `/order` 同时在"生产管理"和"车间管理"中）：

| 菜单组 | 路由 |
|--------|------|
| 系统管理 | `/role`, `/permission`, `/userPermission` |
| 人员结构管理 | `/line`, `/team`, `/user`, `/equipment` |
| 工艺工程管理 | `/bom`, `/flows`, `/process`, `/step` |
| 生产管理 | `/plan`, `/order` |
| 车间管理 | `/order`, `/workOrder`, `/progress` |
| 生产执行 | `/workOrder`, `/execute` |

路由 `/workstation`（工位管理）已在路由表和菜单中注释掉，尚未启用。

## 关键架构决策

### 请求层 (`src/utils/request.js`)

所有 API 调用都通过该 Axios 实例进行。Base URL 为 `/api`，由 Vite 代理到 `http://localhost:8080`（路径重写会去掉 `/api` 前缀）。请求拦截器从 `localStorage.getItem('user')` 注入 token；响应拦截器解包 `response.data`，因此所有调用方拿到的是 `{ code, data, message }` 而非 Axios 原生响应对象。401 错误会自动清除用户信息并重定向到 `/login`。

### Pinia Store 三种模式

所有 store 使用组合式 setup store 风格（工厂函数）。按职责分为三类：

1. **CRUD Store**（`bom`, `role`, `equipment`, `step`, `process`, `plan`, `order`, `workOrder`, `permission`）：管理实体列表 + 分页总数，暴露 `load*`（从 API 获取）、`add*`、`update*`、`delete*`（API 调用后本地乐观更新）。分页逻辑由各视图自行管理，store 只保存 `total`。

2. **关联 Store**（`userRole`, `rolePermission`）：管理多对多关联关系，不持有本地列表。只提供 `get*By*`（查询关联）、`assign*`（批量分配）、`remove*`（移除关联）方法，直接返回 API 结果。

3. **树形 Store**（`bom`）：唯一管理嵌套树形数据的 store。包含 `listToTree`（扁平→嵌套）、`flattenBomTree`（嵌套→扁平）、节点的添加/删除/移动等操作。展开状态通过 `expandedKeys` Set 持久化，在数据重新加载时可以恢复。提供 `productList` computed 属性（根节点列表）和 `flattenedBomData` computed 属性。

### RBAC 权限管理模块

最近新增的基于角色的访问控制模块，是 production 和 operation 之外的第二大子系统：

- **角色管理** (`/role`)：角色的 CRUD，角色编码强制 `ROLE_` 前缀（全局唯一）
- **权限管理** (`/permission`)：只读的权限列表，后端按模块分组（`/permission/grouped`）
- **用户权限分配** (`/userPermission`)：左右分栏布局，左侧用户列表，右侧为用户分配角色

关联关系：
- `userRole` — 用户 ↔ 角色（多对多）
- `rolePermission` — 角色 ↔ 权限（多对多）

核心组件：
- `RoleFormDialog` — 角色新增/编辑弹窗，使用 `v-model:visible` + `emit('saved')` 模式
- `PermissionAccordion` — 按模块分组的权限选择器（Element Plus Accordion）
- `RolePermissionDialog` — 为角色分配权限的弹窗
- `AssignRoleDialog` — 在员工管理页面快速分配角色
- `UserRolePanel` — 用户权限分配页面的右侧面板

### 组件 Dialog 模式

项目中弹窗组件遵循统一模式（参考 [RoleFormDialog.vue](src/components/role/RoleFormDialog.vue)）：
- Props: `visible` (Boolean), `entity` (Object/null，为 null 时表示新增)
- Emits: `update:visible`（关闭弹窗）, `saved`（保存成功后，由父组件处理 API 调用）
- 通过 `watch(visible)` 在弹窗打开时初始化表单数据（区分新增/编辑）并清除校验
- 表单校验通过后 emit `saved` 事件，不直接在子组件中调用 API

### 业务流程视图 (`views/flows/index.vue`)

这是最复杂的视图：三栏布局，左侧为工艺流程列表（按产品分组），中间为 AntV X6 画布，右侧为流程/工序/工步详情面板。支持从工序库向画布添加节点、绘制连接线、保存流程图数据。是理解视图层复杂交互模式的最佳参考。

### API 函数命名约定

每个 API 文件中的函数遵循 REST 风格命名：
- `get*Api` / `query*Api` — GET 请求（查询、列表）
- `add*Api` / `save*Api` — POST 请求（新增）
- `update*Api` — PUT 请求（修改）
- `delete*Api` — DELETE 请求（删除）
- `getAll*Api` — GET `/xxx/listAll` — 获取全部数据（供下拉选择等场景使用）

所有 API 函数通过 `src/utils/request.js` 统一导出 Axios 实例发起请求，响应拦截器已解包 `response.data`，因此 API 函数直接返回 `{ code, data, message }` 对象。

当前 API 模块清单（16 个文件）：
- 基础业务：`login`, `emp`, `bom`, `equipment`, `line`, `team`
- 工艺流程：`flow`, `process`, `step`
- 生产管理：`plan`, `order`, `workOrder`
- RBAC 权限：`role`, `permission`, `userRole`, `rolePermission`

### 后端 API 响应格式

所有后端接口返回统一格式：`{ code: 200, data: ..., message: "..." }`。`code === 200` 表示成功。

### 认证流程

登录后，用户信息（含 token、id、name）存入 `localStorage.setItem('user', JSON.stringify(...))`。所有请求通过拦截器自动携带 token（`config.headers.token`）。退出登录或修改密码会清除 localStorage 并重定向到 `/login`。修改密码功能在布局组件的顶部导航栏中，调用 `updateApi`（来自 `@/api/emp`）。

### 路径别名

`@` 映射到 `src/`（在 `vite.config.js` 和 `jsconfig.json` 中均已配置）。

### 开发环境

- Vite 7 开发服务器，配置 `vite-plugin-vue-devtools` 用于 Vue DevTools 调试
- Element Plus Icons 在 `main.js` 中全局注册，模板中可直接使用所有图标组件（无需单独导入）
- Element Plus 配置了中文 locale (`zh-cn`)

## 已知限制

- 项目无 TypeScript，纯 JavaScript
- 无 linting 或格式化配置（ESLint、Prettier）
- 无测试框架或测试用例（`package.json` 中无 test/lint 脚本）
- 工位管理（`/workstation`）路由已在代码中注释掉，尚未启用
- Vite 开发服务器代理到 `localhost:8080`；Java 后端需单独启动
  
## 注意事项

- **输出语言**：中文
- **代码注释**：生成的代码必须包含中文注释（类、方法、字段等）
- **Vue 风格**：所有 `.vue` 文件使用 `<script setup>` + Composition API
- 项目路由为 `/`（layout）和 `/login`，未配置路由守卫——认证依赖后端 401 响应触发重定向

