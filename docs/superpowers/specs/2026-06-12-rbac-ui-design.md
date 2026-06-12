# RBAC 权限管理 — 前端视觉交互原型设计

## 一、概述

### 1.1 设计目标
基于 [RBAC权限管理系统接口设计文档](../RBAC权限管理系统接口设计.md) 中的 API 接口和数据库表结构，设计一套完整的权限管理前端交互原型。

### 1.2 范围
完整四模块：角色管理、权限管理、用户权限分配、角色权限分配，共 4 个功能视图。

### 1.3 设计决策记录

| 决策项 | 选择 | 说明 |
|--------|------|------|
| 导航位置 | 独立"系统管理"菜单组 | 与人员结构、工艺工程等 5 组平级，RBAC 功能集中管理 |
| 用户-角色分配模式 | 独立页面 + 弹窗快捷入口 | `/user-permission` 独立页（主入口）+ 员工管理页"分配角色"按钮（快捷入口） |
| 权限选择器 | Accordion 折叠面板 | 7 个模块折叠面板，展开显示模块下权限，支持全选/反选 |
| 权限管理 | 只读列表 | 权限编码由开发预定义，不提供运行时增删改 API |

---

## 二、信息架构

```
⚙️ 系统管理（新增侧边栏菜单组）
├── 角色管理       → /role
│   └── 列表 + 新增/编辑弹窗 + 分配权限弹窗（Accordion选择器）
├── 权限管理       → /permission
│   └── 只读列表，按模块筛选
└── 用户权限分配   → /user-permission
    └── 左右分栏：用户列表 → 角色分配面板

📋 人员结构管理（现有菜单组，增强）
└── 员工管理       → /user
    └── 列表增加"分配角色"按钮 → 弹窗快速分配（快捷入口）
```

### 2.1 路由注册

```js
// src/router/index.js 新增路由
{ path: 'role', name: 'role', component: () => import('@/views/role/index.vue') },
{ path: 'permission', name: 'permission', component: () => import('@/views/permission/index.vue') },
{ path: 'user-permission', name: 'userPermission', component: () => import('@/views/userPermission/index.vue') },
```

### 2.2 侧边栏菜单修改

在 `src/views/layout/index.vue` 的 `<el-menu>` 中新增"系统管理" `<el-sub-menu>` 组。

---

## 三、页面详细设计

### 3.1 角色管理 /role

#### 列表视图

```
┌──────────────────────────────────────────────────┐
│  搜索栏：[角色名称________] [查询] [清空]         │
├──────────────────────────────────────────────────┤
│  [+ 新增角色]  [- 批量删除]                       │
├────┬──────────┬──────────┬────────┬────┬─────────┤
│ ☐  │ 角色编码  │ 角色名称  │ 描述   │权限│  操作   │
│    │           │          │        │数量│         │
├────┼──────────┼──────────┼────────┼────┼─────────┤
│ ☐  │ROLE_PROD │生产主管   │负责... │ 5  │分配权限  │
│    │_MANAGER  │          │        │    │编辑 删除  │
├────┴──────────┴──────────┴────────┴────┴─────────┤
│                      共 5 条  [10条/页] « 1 »     │
└──────────────────────────────────────────────────┘
```

**表格列**：复选框、角色编码、角色名称、描述、权限数量（蓝底数字徽标）、创建时间、操作

**操作栏按钮**：
- `+ 新增角色` — 打开新增弹窗
- `- 批量删除` — 调用 `DELETE /role?ids=...`，需确认

**行操作按钮**：
- `🔑 分配权限` — 打开 Accordion 权限分配弹窗
- `✏️ 编辑` — 打开编辑弹窗，预填数据
- `🗑️ 删除` — `ElMessageBox.confirm` 后调用 `DELETE /role?ids=[id]`

**分页**：使用 `el-pagination`，调用 `GET /role?page=&pageSize=&roleName=`

#### 新增/编辑角色弹窗

```
┌─ 新增角色 ──────────────────────────┐
│                                      │
│  * 角色编码                           │
│  [________________________]          │
│  格式：ROLE_xxx（必须以ROLE_开头）      │
│                                      │
│  * 角色名称                           │
│  [________________________]          │
│                                      │
│  角色描述                             │
│  [________________________]          │
│                                      │
│              [取消]  [保存]           │
└──────────────────────────────────────┘
```

**表单字段**：
- `roleCode`：文本输入，必填，格式提示"ROLE_xxx"
- `roleName`：文本输入，必填
- `description`：文本域，选填

**API 映射**：
- 新增：`POST /role` → 成功后 `ElMessage.success('创建成功')` + 刷新列表
- 编辑：`GET /role/{id}` → 预填表单 → `PUT /role` → 成功后刷新

#### 分配权限弹窗（Accordion 折叠面板）

```
┌─ 为「生产主管」分配权限 ─── 已选 5 项 ─┐
│                                         │
│  ▼ 📦 ORDER — 订单管理模块  已选 3/5    │
│  │  ☑ ORDER_CREATE 订单创建              │
│  │  ☑ ORDER_UPDATE 订单修改              │
│  │  ☑ ORDER_DELETE 订单删除              │
│  │  ☐ ORDER_QUERY 订单查询               │
│  │  ☐ ORDER_ASSIGN 订单分配              │
│                                         │
│  ▶ 📦 SYS — 系统管理模块    已选 2/5    │
│  ▶ 📦 PLAN — 生产计划模块    已选 0/4   │
│  ▶ 📦 WORKORDER — 工单管理    已选 0/6  │
│  ▶ 📦 EQU — 设备管理模块    已选 0/4    │
│  ▶ 📦 BOM — 物料清单模块    已选 0/4    │
│  ▶ 📦 PROC — 工序管理模块    已选 0/4   │
│                                         │
│              [取消]  [保存权限]           │
└─────────────────────────────────────────┘
```

**交互行为**：
- 打开弹窗时调用 `GET /role-permission/role/{roleId}` 获取已分配权限，并调用 `GET /permission/grouped` 获取全部权限按模块分组
- 折叠面板默认展开第一个有已选权限的模块，其余折叠
- 每个模块标题显示"已选 X/N"
- 点击保存时调用 `POST /role-permission` 或 `DELETE /role-permission`
- 权限数据加载失败时显示重试按钮

### 3.2 权限管理 /permission

#### 列表视图

```
┌──────────────────────────────────────────────┐
│  搜索栏：[所属模块 ▼全部模块] [查询] [清空]     │
├──────┬──────────┬──────┬────────┬─────────────┤
│权限编码│权限名称  │所属  │描述    │创建时间 │操作│
│      │          │模块  │        │         │    │
├──────┼──────────┼──────┼────────┼─────────┼────┤
│SYS_  │用户创建   │SYS   │创建... │2026-...│详情│
│USER..│          │      │        │         │    │
├──────┴──────────┴──────┴────────┴─────────┴────┤
│                     共 32 条                     │
├─────────────────────────────────────────────────┤
│ ⚠️ 权限编码由开发预定义，不提供运行时增删改。     │
└─────────────────────────────────────────────────┘
```

**关键约束**：
- **只读表格**：无新增/编辑/删除按钮
- 模块筛选下拉：全部模块 + 7 个模块选项
- 每行仅有"详情"操作按钮，点击打开只读详情弹窗
- 底部提示：权限编码由开发预定义

### 3.3 用户权限分配 /user-permission

#### 左右分栏布局

```
┌─────────────┬──────────────────────────────────┐
│ 左栏 320px   │ 右栏（自适应）                     │
│             │                                  │
│ [🔍 搜索用户] │ 👤 顿红  dunhong · 生产主管       │
│             │                                  │
│ ▎顿红       │ ✅ 已分配角色                      │
│   dunhong   │  ┌──────────────────────┐        │
│   2个角色    │  │ ● 生产主管           ✕ │       │
│             │  │ ● 工艺工程师          ✕ │       │
│  王明       │  └──────────────────────┘        │
│  工艺工程师  │                                  │
│             │ ➕ 分配新角色                      │
│  李华       │  ┌────────────────┐  ┌─────┐     │
│  班组长     │  │ 车间主任       │  │添加→│     │
│             │  │ 班组长         │  │     │     │
│  张伟       │  │ 人事主管       │  └─────┘     │
│  工人       │  │ 质检员         │              │
│             │  └────────────────┘              │
│ 共12用户 «» │                                  │
│             │  [💾 保存分配] [重置]              │
└─────────────┴──────────────────────────────────┘
```

**交互流程**：
1. 左栏加载用户列表（可搜索、翻页），调用 `GET /user?page=&pageSize=`
2. 点击用户行 → 高亮选中 → 右栏加载该用户的角色
3. 右栏调用 `GET /user-role/user/{userId}` 获取已分配角色（以 Chip/Tag 形式展示，可点击 ✕ 移除）
4. 右栏下方多选列表调用 `GET /role` 获取全部可选角色（排除已分配的）
5. 点击"添加所选 →"将选中的角色加入已分配列表
6. 点击"💾 保存分配"批量提交：
   - 新增的调用 `POST /user-role`
   - 移除的调用 `DELETE /user-role`
7. 点击"重置"恢复到保存前的状态

**空状态**：
- 未选中用户时，右栏显示"请在左侧选择一个用户"
- 用户无角色时，已分配区域显示"该用户暂无角色"
- 所有角色已分配时，可选列表显示"所有角色已分配"

### 3.4 快捷入口：员工管理页增强

#### 列表新增"分配角色"按钮

在现有 `src/views/user/index.vue` 的操作列中新增：

```
编辑  删除  [🔑 分配角色]
```

#### 快捷分配角色弹窗

```
┌─ 为「顿红」分配角色 ──────────┐
│                                │
│ 勾选要分配的角色，取消勾选即移除  │
│                                │
│ ☑ 生产主管    ROLE_PROD_...    │
│ ☐ 工艺工程师  ROLE_PROCESS_... │
│ ☐ 车间主任    ROLE_WORKSHOPS.. │
│ ☑ 班组长      ROLE_TEAM_...   │
│                                │
│         [取消]  [保存]          │
└────────────────────────────────┘
```

**交互**：
- 打开弹窗时调用 `GET /user-role/user/{userId}` + `GET /role`（全部角色）
- 角色以复选框列表展示，已分配的勾选
- 保存时对比变更，分别调用 `POST /user-role` 和 `DELETE /user-role`
- 保存成功后 `ElMessage.success('分配成功')` + 关闭弹窗

---

## 四、状态处理

### 4.1 操作状态

| 操作 | 成功 | 失败 |
|------|------|------|
| 新增角色 | `ElMessage.success('创建成功')` | `ElMessage.error('创建失败：' + message)` |
| 编辑角色 | `ElMessage.success('更新成功')` | `ElMessage.error('更新失败：' + message)` |
| 删除角色 | `ElMessage.success('删除成功')` | `ElMessage.error('删除失败：' + message)` |
| 分配权限 | `ElMessage.success('权限分配成功')` | `ElMessage.error('分配失败：' + message)` |
| 分配角色 | `ElMessage.success('分配成功')` | `ElMessage.error('分配失败：' + message)` |
| 权限不足 | - | `ElMessage.error('权限不足')` (HTTP 403) |
| 批量操作 | `ElMessageBox.confirm` 确认 | 取消时 `ElMessage.info('已取消')` |

### 4.2 空状态

| 场景 | 展示 |
|------|------|
| 角色列表为空 | 📭 "暂无角色数据" + "点击「新增角色」创建第一个角色" |
| 搜索无结果 | 🔍 "未找到匹配的角色" + "请尝试调整搜索条件" |
| 用户无角色 | "该用户暂无角色" |
| 权限列表空（按模块筛选后） | "该模块下暂无权限" |

### 4.3 错误状态

| 场景 | 处理 |
|------|------|
| 列表加载失败 | ⚠️ "加载失败" + [重试] 按钮 |
| 详情加载失败 | ElMessage.error |
| 保存冲突（编码重复） | ElMessage.error('角色编码已存在') |
| 403 权限不足 | ElMessage.error('权限不足') |

### 4.4 加载状态

- 列表首次加载：表格区域显示 `v-loading` 骨架
- 弹窗提交中：保存按钮显示 loading 状态，禁止重复提交
- 用户切换（用户权限分配页）：右侧面板显示 loading 过渡

---

## 五、组件拆分

### 5.1 新增组件

| 组件 | 路径 | 用途 |
|------|------|------|
| `RoleFormDialog` | `src/components/role/RoleFormDialog.vue` | 角色新增/编辑弹窗 |
| `PermissionAccordion` | `src/components/role/PermissionAccordion.vue` | 权限 Accordion 选择器（角色权限分配弹窗内嵌） |
| `RolePermissionDialog` | `src/components/role/RolePermissionDialog.vue` | 角色权限分配弹窗（包含 PermissionAccordion） |
| `UserRolePanel` | `src/components/userPermission/UserRolePanel.vue` | 用户权限分配页右侧面板 |
| `AssignRoleDialog` | `src/components/user/AssignRoleDialog.vue` | 员工管理页快捷分配角色弹窗 |

### 5.2 新增 Page-Level 组件（3 个路由视图）

| 视图 | 路径 |
|------|------|
| `RoleIndex` | `src/views/role/index.vue` |
| `PermissionIndex` | `src/views/permission/index.vue` |
| `UserPermissionIndex` | `src/views/userPermission/index.vue` |

### 5.3 需修改的现有文件

| 文件 | 修改内容 |
|------|----------|
| `src/views/layout/index.vue` | 侧边栏新增"系统管理"菜单组（3 个子菜单项） |
| `src/views/user/index.vue` | 操作列新增"分配角色"按钮 + 引入 AssignRoleDialog |
| `src/router/index.js` | 新增 3 条路由 |

---

## 六、Pinia Store 设计

### 6.1 roleStore

```js
// src/stores/role.js
export const useRoleStore = defineStore('role', () => {
  const roleList = ref([])
  const total = ref(0)

  async function loadRoles(params) { /* GET /role */ }
  async function getRoleById(id) { /* GET /role/{id} */ }
  async function addRole(role) { /* POST /role */ }
  async function updateRole(role) { /* PUT /role */ }
  async function deleteRoles(ids) { /* DELETE /role?ids=... */ }

  return { roleList, total, loadRoles, getRoleById, addRole, updateRole, deleteRoles }
})
```

### 6.2 permissionStore

```js
// src/stores/permission.js
export const usePermissionStore = defineStore('permission', () => {
  const permissionList = ref([])
  const groupedPermissions = ref({})

  async function loadPermissions(module) { /* GET /permission?module= */ }
  async function loadGrouped() { /* GET /permission/grouped */ }
  async function getPermissionById(id) { /* GET /permission/{id} */ }

  return { permissionList, groupedPermissions, loadPermissions, loadGrouped, getPermissionById }
})
```

### 6.3 userRoleStore

```js
// src/stores/userRole.js
export const useUserRoleStore = defineStore('userRole', () => {
  async function getRolesByUserId(userId) { /* GET /user-role/user/{userId} */ }
  async function getUsersByRoleId(roleId) { /* GET /user-role/role/{roleId} */ }
  async function assignRoles(dto) { /* POST /user-role */ }
  async function removeRoles(userId, roleIds) { /* DELETE /user-role */ }
  
  return { getRolesByUserId, getUsersByRoleId, assignRoles, removeRoles }
})
```

### 6.4 rolePermissionStore

```js
// src/stores/rolePermission.js
export const useRolePermissionStore = defineStore('rolePermission', () => {
  async function getPermissionsByRoleId(roleId) { /* GET /role-permission/role/{roleId} */ }
  async function getRolesByPermissionId(permissionId) { /* GET /role-permission/permission/{id} */ }
  async function assignPermissions(dto) { /* POST /role-permission */ }
  async function removePermissions(roleId, permissionIds) { /* DELETE /role-permission */ }

  return { getPermissionsByRoleId, getRolesByPermissionId, assignPermissions, removePermissions }
})
```

---

## 七、API 函数清单

需在 `src/api/` 下新增文件：

### 7.1 `src/api/role.js`

| 函数 | 方法 | 路径 |
|------|------|------|
| `getRoleListApi(params)` | GET | `/role` |
| `getRoleByIdApi(id)` | GET | `/role/{id}` |
| `addRoleApi(data)` | POST | `/role` |
| `updateRoleApi(data)` | PUT | `/role` |
| `deleteRolesApi(ids)` | DELETE | `/role` |

### 7.2 `src/api/permission.js`

| 函数 | 方法 | 路径 |
|------|------|------|
| `getPermissionListApi(module)` | GET | `/permission` |
| `getPermissionByIdApi(id)` | GET | `/permission/{id}` |
| `getPermissionsGroupedApi()` | GET | `/permission/grouped` |

### 7.3 `src/api/userRole.js`

| 函数 | 方法 | 路径 |
|------|------|------|
| `getRolesByUserIdApi(userId)` | GET | `/user-role/user/{userId}` |
| `getUsersByRoleIdApi(roleId)` | GET | `/user-role/role/{roleId}` |
| `assignRolesApi(data)` | POST | `/user-role` |
| `removeRolesApi(params)` | DELETE | `/user-role` |

### 7.4 `src/api/rolePermission.js`

| 函数 | 方法 | 路径 |
|------|------|------|
| `getPermissionsByRoleIdApi(roleId)` | GET | `/role-permission/role/{roleId}` |
| `getRolesByPermissionIdApi(permissionId)` | GET | `/role-permission/permission/{permissionId}` |
| `assignPermissionsApi(data)` | POST | `/role-permission` |
| `removePermissionsApi(params)` | DELETE | `/role-permission` |

---

## 八、实现优先级

| 优先级 | 任务 | 依赖 |
|--------|------|------|
| P0 | 侧边栏菜单 + 路由注册 | 无 |
| P0 | `src/api/` 四个 API 文件 | 无 |
| P0 | `src/stores/` 四个 Store | API 文件 |
| P1 | 角色管理页 + 弹窗组件 | Store + API |
| P1 | 权限管理页 | Store + API |
| P2 | 用户权限分配页 | Store + API |
| P2 | 员工管理页快捷入口 | Store + API |
| P3 | 空状态/错误状态/加载状态完善 | 各页面 |

---

## 九、文件清单

```
src/
├── api/
│   ├── role.js              # 新增
│   ├── permission.js        # 新增
│   ├── userRole.js          # 新增
│   └── rolePermission.js    # 新增
├── stores/
│   ├── role.js              # 新增
│   ├── permission.js        # 新增
│   ├── userRole.js          # 新增
│   └── rolePermission.js    # 新增
├── views/
│   ├── role/
│   │   └── index.vue        # 新增
│   ├── permission/
│   │   └── index.vue        # 新增
│   └── userPermission/
│       └── index.vue        # 新增
├── components/
│   ├── role/
│   │   ├── RoleFormDialog.vue        # 新增
│   │   ├── PermissionAccordion.vue   # 新增
│   │   └── RolePermissionDialog.vue  # 新增
│   ├── userPermission/
│   │   └── UserRolePanel.vue        # 新增
│   └── user/
│       └── AssignRoleDialog.vue     # 新增
├── router/
│   └── index.js             # 修改：新增 3 条路由
└── views/
    └── layout/
        └── index.vue        # 修改：新增侧边栏菜单组
```
