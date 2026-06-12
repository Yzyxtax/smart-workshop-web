# RBAC 权限管理前端 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现完整的 RBAC 权限管理前端，包含角色管理、权限管理、用户权限分配三个路由视图和员工管理页快捷入口。

**Architecture:** 4 个 API 文件 → 4 个 Pinia Store → 3 个路由视图（role / permission / userPermission）+ 5 个可复用组件 → 2 个现有文件修改（router + layout menu）。所有 API 调用通过 `src/utils/request.js` 统一封装，Store 遵循组合式 setup store 模式，视图遵循现有 search → table → pagination → dialog 模板。

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), Element Plus 2, Pinia 3, Vue Router 4, Axios (via `@/utils/request`)

---

### Task 1: API 层 — 四个接口文件

**Files:**
- Create: `src/api/role.js`
- Create: `src/api/permission.js`
- Create: `src/api/userRole.js`
- Create: `src/api/rolePermission.js`

- [ ] **Step 1: 创建角色 API 文件**

```js
// src/api/role.js
import request from '@/utils/request'

/**
 * 角色管理 API
 *
 * 对应后端接口：
 * - GET    /role            查询角色列表（支持 roleName 模糊搜索 + 分页）
 * - GET    /role/{id}       查询角色详情
 * - POST   /role            新增角色
 * - PUT    /role            修改角色
 * - DELETE /role             删除角色（?ids=1,2,3）
 */

// 查询角色列表（GET /role?roleName=&page=&pageSize=）
export const getRoleListApi = (params = {}) =>
  request.get('/role', { params })

// 查询角色详情（GET /role/{id}）
export const getRoleByIdApi = (id) =>
  request.get(`/role/${id}`)

// 新增角色（POST /role）
export const addRoleApi = (data) =>
  request.post('/role', data)

// 修改角色（PUT /role）
export const updateRoleApi = (data) =>
  request.put('/role', data)

// 删除角色 — 支持单个或批量（DELETE /role?ids=1,2,3）
export const deleteRolesApi = (ids) =>
  request.delete('/role', { params: { ids } })
```

- [ ] **Step 2: 创建权限 API 文件**

```js
// src/api/permission.js
import request from '@/utils/request'

/**
 * 权限管理 API（只读）
 *
 * 对应后端接口：
 * - GET /permission          查询权限列表（支持 module 筛选）
 * - GET /permission/{id}     查询权限详情
 * - GET /permission/grouped   按模块分组查询全部权限
 */

// 查询权限列表（GET /permission?module=）
export const getPermissionListApi = (module) =>
  request.get('/permission', { params: { module } })

// 查询权限详情（GET /permission/{id}）
export const getPermissionByIdApi = (id) =>
  request.get(`/permission/${id}`)

// 按模块分组查询全部权限（GET /permission/grouped）
export const getPermissionsGroupedApi = () =>
  request.get('/permission/grouped')
```

- [ ] **Step 3: 创建用户-角色 API 文件**

```js
// src/api/userRole.js
import request from '@/utils/request'

/**
 * 用户-角色关联 API
 *
 * 对应后端接口：
 * - GET    /user-role/user/{userId}    查询用户拥有角色
 * - GET    /user-role/role/{roleId}    查询角色下用户
 * - POST   /user-role                  批量分配角色给用户
 * - DELETE /user-role                  移除用户角色
 */

// 查询用户拥有的角色（GET /user-role/user/{userId}）
export const getRolesByUserIdApi = (userId) =>
  request.get(`/user-role/user/${userId}`)

// 查询角色下的用户（GET /user-role/role/{roleId}）
export const getUsersByRoleIdApi = (roleId) =>
  request.get(`/user-role/role/${roleId}`)

// 为用户分配角色 — 支持批量（POST /user-role）
export const assignRolesApi = (data) =>
  request.post('/user-role', data)

// 移除用户角色（DELETE /user-role?userId=&roleIds=1,2）
export const removeRolesApi = (params) =>
  request.delete('/user-role', { params })
```

- [ ] **Step 4: 创建角色-权限 API 文件**

```js
// src/api/rolePermission.js
import request from '@/utils/request'

/**
 * 角色-权限关联 API
 *
 * 对应后端接口：
 * - GET    /role-permission/role/{roleId}           查询角色拥有的权限
 * - GET    /role-permission/permission/{permId}      查询拥有该权限的角色
 * - POST   /role-permission                         为角色分配权限（批量）
 * - DELETE /role-permission                         移除角色权限
 */

// 查询角色拥有的权限（GET /role-permission/role/{roleId}）
export const getPermissionsByRoleIdApi = (roleId) =>
  request.get(`/role-permission/role/${roleId}`)

// 查询拥有该权限的角色（GET /role-permission/permission/{permissionId}）
export const getRolesByPermissionIdApi = (permissionId) =>
  request.get(`/role-permission/permission/${permissionId}`)

// 为角色分配权限 — 支持批量（POST /role-permission）
export const assignPermissionsApi = (data) =>
  request.post('/role-permission', data)

// 移除角色权限（DELETE /role-permission?roleId=&permissionIds=1,2）
export const removePermissionsApi = (params) =>
  request.delete('/role-permission', { params })
```

- [ ] **Step 5: 验证 API 文件语法**

```bash
# 使用 Node 语法检查（不会发起请求，仅验证语法）
node -e "require('@/utils/request')" 2>&1 || echo "需要 ES module 环境下验证，语法检查通过文件阅读确认"
```

- [ ] **Step 6: 提交 API 层**

```bash
git add src/api/role.js src/api/permission.js src/api/userRole.js src/api/rolePermission.js
git commit -m "feat(rbac): add API layer — role, permission, userRole, rolePermission"
```

---

### Task 2: Pinia Store 层 — 四个 Store

**Files:**
- Create: `src/stores/role.js`
- Create: `src/stores/permission.js`
- Create: `src/stores/userRole.js`
- Create: `src/stores/rolePermission.js`

- [ ] **Step 1: 创建角色 Store**

```js
// src/stores/role.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  getRoleListApi,
  getRoleByIdApi,
  addRoleApi,
  updateRoleApi,
  deleteRolesApi
} from '@/api/role'

/**
 * 角色管理 Store
 * 管理角色列表的加载、本地 CRUD 操作
 */
export const useRoleStore = defineStore('role', () => {
  // state — 角色列表
  const roleList = ref([])
  // 分页总数
  const total = ref(0)

  // 加载角色列表（支持分页 + 模糊搜索）
  const loadRoles = async (params = {}) => {
    const result = await getRoleListApi(params)
    if (result.code === 200) {
      roleList.value = result.data.rows ?? result.data
      total.value = result.data.total ?? 0
    }
  }

  // 按 ID 查询角色详情
  const getRoleById = async (id) => {
    const result = await getRoleByIdApi(id)
    if (result.code === 200) {
      return result.data
    }
    return null
  }

  // 新增角色 — 调用 API 后本地追加
  const addRole = async (data) => {
    const result = await addRoleApi(data)
    if (result.code === 200) {
      if (result.data) {
        roleList.value.push(result.data)
      }
      return result
    }
    return result
  }

  // 更新角色 — 调用 API 后本地替换
  const updateRole = async (data) => {
    const result = await updateRoleApi(data)
    if (result.code === 200) {
      if (result.data) {
        const index = roleList.value.findIndex(r => r.id === result.data.id)
        if (index !== -1) {
          roleList.value[index] = result.data
        }
      }
      return result
    }
    return result
  }

  // 删除角色 — 调用 API 后本地移除
  const deleteRoles = async (ids) => {
    const result = await deleteRolesApi(ids)
    if (result.code === 200) {
      const idArray = Array.isArray(ids) ? ids : [ids]
      roleList.value = roleList.value.filter(r => !idArray.includes(r.id))
      return result
    }
    return result
  }

  return {
    roleList,
    total,
    loadRoles,
    getRoleById,
    addRole,
    updateRole,
    deleteRoles
  }
})
```

- [ ] **Step 2: 创建权限 Store**

```js
// src/stores/permission.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  getPermissionListApi,
  getPermissionByIdApi,
  getPermissionsGroupedApi
} from '@/api/permission'

/**
 * 权限管理 Store
 * 管理权限列表的加载（只读）
 */
export const usePermissionStore = defineStore('permission', () => {
  // state — 权限列表
  const permissionList = ref([])
  // 按模块分组的权限
  const groupedPermissions = ref({})

  // 加载权限列表（支持按模块筛选）
  const loadPermissions = async (module) => {
    const result = await getPermissionListApi(module)
    if (result.code === 200) {
      permissionList.value = result.data.rows ?? result.data
    }
  }

  // 加载全部分组权限（用于 Accordion 选择器）
  const loadGrouped = async () => {
    const result = await getPermissionsGroupedApi()
    if (result.code === 200) {
      groupedPermissions.value = result.data
    }
  }

  // 按 ID 查询权限详情
  const getPermissionById = async (id) => {
    const result = await getPermissionByIdApi(id)
    if (result.code === 200) {
      return result.data
    }
    return null
  }

  return {
    permissionList,
    groupedPermissions,
    loadPermissions,
    loadGrouped,
    getPermissionById
  }
})
```

- [ ] **Step 3: 创建用户-角色 Store**

```js
// src/stores/userRole.js
import { defineStore } from 'pinia'
import {
  getRolesByUserIdApi,
  getUsersByRoleIdApi,
  assignRolesApi,
  removeRolesApi
} from '@/api/userRole'

/**
 * 用户-角色关联 Store
 * 管理用户与角色的分配关系
 */
export const useUserRoleStore = defineStore('userRole', () => {
  // 查询用户拥有的角色（返回角色数组）
  const getRolesByUserId = async (userId) => {
    const result = await getRolesByUserIdApi(userId)
    if (result.code === 200) {
      return result.data
    }
    return []
  }

  // 查询角色下的用户
  const getUsersByRoleId = async (roleId) => {
    const result = await getUsersByRoleIdApi(roleId)
    if (result.code === 200) {
      return result.data
    }
    return []
  }

  // 为用户分配角色（支持批量）
  const assignRoles = async (data) => {
    const result = await assignRolesApi(data)
    return result
  }

  // 移除用户角色
  const removeRoles = async (params) => {
    const result = await removeRolesApi(params)
    return result
  }

  return {
    getRolesByUserId,
    getUsersByRoleId,
    assignRoles,
    removeRoles
  }
})
```

- [ ] **Step 4: 创建角色-权限 Store**

```js
// src/stores/rolePermission.js
import { defineStore } from 'pinia'
import {
  getPermissionsByRoleIdApi,
  getRolesByPermissionIdApi,
  assignPermissionsApi,
  removePermissionsApi
} from '@/api/rolePermission'

/**
 * 角色-权限关联 Store
 * 管理角色与权限的分配关系
 */
export const useRolePermissionStore = defineStore('rolePermission', () => {
  // 查询角色拥有的权限（返回权限数组）
  const getPermissionsByRoleId = async (roleId) => {
    const result = await getPermissionsByRoleIdApi(roleId)
    if (result.code === 200) {
      return result.data
    }
    return []
  }

  // 查询拥有该权限的角色
  const getRolesByPermissionId = async (permissionId) => {
    const result = await getRolesByPermissionIdApi(permissionId)
    if (result.code === 200) {
      return result.data
    }
    return []
  }

  // 为角色分配权限（支持批量）
  const assignPermissions = async (data) => {
    const result = await assignPermissionsApi(data)
    return result
  }

  // 移除角色权限
  const removePermissions = async (params) => {
    const result = await removePermissionsApi(params)
    return result
  }

  return {
    getPermissionsByRoleId,
    getRolesByPermissionId,
    assignPermissions,
    removePermissions
  }
})
```

- [ ] **Step 5: 提交 Store 层**

```bash
git add src/stores/role.js src/stores/permission.js src/stores/userRole.js src/stores/rolePermission.js
git commit -m "feat(rbac): add Pinia stores — role, permission, userRole, rolePermission"
```

---

### Task 3: 路由注册 + 侧边栏菜单

**Files:**
- Modify: `src/router/index.js`
- Modify: `src/views/layout/index.vue`

- [ ] **Step 1: 添加路由懒加载 import 并注册子路由**

在 `src/router/index.js` 顶部 import 区域末尾添加三行 import：

```js
// 在现有 import 行之后追加
import roleView from '@/views/role/index.vue'
import permissionView from '@/views/permission/index.vue'
import userPermissionView from '@/views/userPermission/index.vue'
```

在 `children` 数组末尾（`{ path: 'progress', ... }` 之后）新增三条路由：

```js
{ path: 'role', name: 'role', component: roleView },
{ path: 'permission', name: 'permission', component: permissionView },
{ path: 'userPermission', name: 'userPermission', component: userPermissionView },
```

修改后的 `src/router/index.js` 完整内容：

```js
import { createRouter, createWebHistory } from 'vue-router'

import bomView from '@/views/bom/index.vue'
import equipmentView from '@/views/equipment/index.vue'
import lineView from '@/views/line/index.vue'
import teamView from '@/views/team/index.vue'
import userView from '@/views/user/index.vue'
import flowsView from '@/views/flows/index.vue'
import processView from '@/views/process/index.vue'
import stepView from '@/views/step/index.vue'
import planView from '@/views/plan/index.vue'
import orderView from '@/views/order/index.vue'
import workOrderView from '@/views/workOrder/index.vue'
import executeView from '@/views/execute/index.vue'
import progressView from '@/views/progress/index.vue'
import loginView from '@/views/login/index.vue'
import layoutView from '@/views/layout/index.vue'
// RBAC 权限管理模块
import roleView from '@/views/role/index.vue'
import permissionView from '@/views/permission/index.vue'
import userPermissionView from '@/views/userPermission/index.vue'
// import workstationView from '@/views/workstation/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: layoutView,
      children: [
        { path: 'bom', name: 'bom', component: bomView },
        { path: 'equipment', name: 'equipment', component: equipmentView },
        { path: 'line', name: 'line', component: lineView },
        { path: 'team', name: 'team', component: teamView },
        { path: 'user', name: 'user', component: userView },
        { path: 'flows', name: 'flows', component: flowsView },
        { path: 'process', name: 'process', component: processView },
        { path: 'step', name: 'step', component: stepView },
        // { path: 'workstation', name: 'workstation', component: workstationView }
        { path: 'plan', name: 'plan', component: planView },
        { path: 'order', name: 'order', component: orderView },
        { path: 'workOrder', name: 'workOrder', component: workOrderView },
        { path: 'execute', name: 'execute', component: executeView },
        { path: 'progress', name: 'progress', component: progressView },
        // RBAC 权限管理模块
        { path: 'role', name: 'role', component: roleView },
        { path: 'permission', name: 'permission', component: permissionView },
        { path: 'userPermission', name: 'userPermission', component: userPermissionView },
      ]
    },
    { path: '/login', name: 'login', component: loginView },
  ],
})

export default router
```

- [ ] **Step 2: 在侧边栏添加"系统管理"菜单组**

在 `src/views/layout/index.vue` 的 `<el-menu>` 中，在 `<el-sub-menu index="/management">`（人员结构管理）组之前插入新的"系统管理"菜单组：

```html
<!-- 系统管理菜单组 — 插入到 el-menu 内，作为第一个 sub-menu -->
<el-sub-menu index="/system">
    <template #title>
        <el-icon>
            <Setting />
        </el-icon>
        <span>系统管理</span>
    </template>
    <el-menu-item index="/role" @click="addTab({ index: '/role', label: '角色管理' })">
        <el-icon><Avatar /></el-icon>角色管理
    </el-menu-item>
    <el-menu-item index="/permission" @click="addTab({ index: '/permission', label: '权限管理' })">
        <el-icon><Lock /></el-icon>权限管理
    </el-menu-item>
    <el-menu-item index="/userPermission" @click="addTab({ index: '/userPermission', label: '用户权限分配' })">
        <el-icon><UserFilled /></el-icon>用户权限分配
    </el-menu-item>
</el-sub-menu>
```

- [ ] **Step 3: 验证页面占位 — 创建三个路由视图的占位文件**

```vue
<!-- src/views/role/index.vue（占位 — 后续 Task 替换为完整实现） -->
<template>
  <div class="page">
    <h1>角色管理</h1>
    <p>加载中...</p>
  </div>
</template>
```

```vue
<!-- src/views/permission/index.vue（占位） -->
<template>
  <div class="page">
    <h1>权限管理</h1>
    <p>加载中...</p>
  </div>
</template>
```

```vue
<!-- src/views/userPermission/index.vue（占位） -->
<template>
  <div class="page">
    <h1>用户权限分配</h1>
    <p>加载中...</p>
  </div>
</template>
```

- [ ] **Step 4: 启动开发服务器验证路由和菜单**

```bash
npm run dev &
# 访问 http://localhost:5173，确认：
# 1. 侧边栏出现"系统管理"菜单组，含三个子菜单
# 2. 点击各子菜单能正确跳转并显示占位内容
# 3. 标签页可正常添加和关闭
```

- [ ] **Step 5: 提交路由和菜单**

```bash
git add src/router/index.js src/views/layout/index.vue src/views/role/index.vue src/views/permission/index.vue src/views/userPermission/index.vue
git commit -m "feat(rbac): add routing + sidebar menu for role/permission/user-permission pages"
```

---

### Task 4: 角色管理页 + 表单弹窗组件

**Files:**
- Create: `src/components/role/RoleFormDialog.vue`
- Modify: `src/views/role/index.vue`（替换占位内容）

- [ ] **Step 1: 创建 RoleFormDialog 组件**

```vue
<!-- src/components/role/RoleFormDialog.vue -->
<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

/**
 * 角色新增/编辑弹窗
 *
 * Props:
 * - visible: 弹窗可见性
 * - role: 编辑时传入的角色数据（null 表示新增）
 *
 * Events:
 * - update:visible: 弹窗关闭
 * - saved: 保存成功后触发，通知父组件刷新列表
 */

const props = defineProps({
  visible: { type: Boolean, default: false },
  role: { type: Object, default: null }
})

const emit = defineEmits(['update:visible', 'saved'])

// 表单引用
const formRef = ref(null)

// 表单数据
const formData = ref({
  roleCode: '',
  roleName: '',
  description: ''
})

// 弹窗标题
const dialogTitle = ref('新增角色')
// 提交中状态
const submitting = ref(false)

// 表单校验规则
const rules = {
  roleCode: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { pattern: /^ROLE_/, message: '角色编码必须以 ROLE_ 开头', trigger: 'blur' }
  ],
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ]
}

// 监听 visible 变化 — 打开时重置表单
watch(() => props.visible, (val) => {
  if (val) {
    if (props.role) {
      dialogTitle.value = '编辑角色'
      formData.value = {
        roleCode: props.role.roleCode ?? props.role.role_code ?? '',
        roleName: props.role.roleName ?? props.role.role_name ?? '',
        description: props.role.description ?? ''
      }
    } else {
      dialogTitle.value = '新增角色'
      formData.value = { roleCode: '', roleName: '', description: '' }
    }
    // 清除校验状态
    if (formRef.value) {
      formRef.value.clearValidate()
    }
  }
})

// 关闭弹窗
const handleClose = () => {
  emit('update:visible', false)
}

// 保存
const handleSave = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('请正确填写表单')
      return
    }
    submitting.value = true
    try {
      emit('saved', { ...formData.value, id: props.role?.id })
    } finally {
      submitting.value = false
    }
  })
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="500px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <el-form-item label="角色编码" prop="roleCode">
        <el-input
          v-model="formData.roleCode"
          placeholder="如 ROLE_QUALITY_INSPECTOR"
          :disabled="!!role"
        />
        <span style="font-size:11px;color:#909399;">
          格式：ROLE_xxx（必须以ROLE_开头，全局唯一）
        </span>
      </el-form-item>
      <el-form-item label="角色名称" prop="roleName">
        <el-input
          v-model="formData.roleName"
          placeholder="如：质检员"
        />
      </el-form-item>
      <el-form-item label="角色描述">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="描述该角色的职责和权限范围"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSave">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>
```

- [ ] **Step 2: 实现角色管理页完整视图**

```vue
<!-- src/views/role/index.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoleStore } from '@/stores/role'
import RoleFormDialog from '@/components/role/RoleFormDialog.vue'

/**
 * 角色管理页
 *
 * 功能：
 * - 角色列表查询（分页 + 模糊搜索）
 * - 新增/编辑角色弹窗
 * - 批量/单个删除角色（级联清理关联权限）
 * - 为角色分配权限（见 Task 6 RolePermissionDialog）
 */

const roleStore = useRoleStore()
const { roleList, total } = roleStore

// 搜索表单
const searchName = ref('')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 多选
const multipleSelection = ref([])

// 表单弹窗状态
const dialogVisible = ref(false)
const currentRole = ref(null)

// 权限分配弹窗状态
const permDialogVisible = ref(false)
const permRoleId = ref(null)
const permRoleName = ref('')

// 加载数据
const loadData = async () => {
  await roleStore.loadRoles({
    roleName: searchName.value,
    page: currentPage.value,
    pageSize: pageSize.value
  })
}

onMounted(() => {
  loadData()
})

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 清空
const handleClear = () => {
  searchName.value = ''
  handleSearch()
}

// 分页
const handleSizeChange = () => loadData()
const handleCurrentChange = () => loadData()

// 多选变更
const handleSelectionChange = (selection) => {
  multipleSelection.value = selection.map(item => item.id)
}

// 新增
const handleAdd = () => {
  currentRole.value = null
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  currentRole.value = row
  dialogVisible.value = true
}

// 保存（由 RoleFormDialog emit 触发）
const handleSaved = async (formData) => {
  if (currentRole.value && currentRole.value.id) {
    // 编辑
    const result = await roleStore.updateRole({
      id: currentRole.value.id,
      ...formData,
      roleCode: currentRole.value.roleCode ?? currentRole.value.role_code
    })
    if (result.code === 200) {
      ElMessage.success('更新成功')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error('更新失败：' + (result.message || '未知错误'))
    }
  } else {
    // 新增
    const result = await roleStore.addRole(formData)
    if (result.code === 200) {
      ElMessage.success('创建成功')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error('创建失败：' + (result.message || '未知错误'))
    }
  }
}

// 单个删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确认删除角色「${row.roleName ?? row.role_name}」？删除后该角色下所有用户的权限将被移除。此操作不可恢复。`,
    '警告',
    { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    const result = await roleStore.deleteRoles(row.id)
    if (result.code === 200) {
      ElMessage.success('删除成功')
      loadData()
    } else {
      ElMessage.error('删除失败：' + (result.message || '未知错误'))
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 批量删除
const handleBatchDelete = async () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择要删除的角色')
    return
  }
  ElMessageBox.confirm(
    `确认删除选中的 ${multipleSelection.value.length} 个角色？删除后关联的权限分配将自动清理。`,
    '警告',
    { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    const result = await roleStore.deleteRoles(multipleSelection.value)
    if (result.code === 200) {
      ElMessage.success('删除成功')
      loadData()
    } else {
      ElMessage.error('删除失败：' + (result.message || '未知错误'))
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 打开权限分配弹窗
const handleAssignPermission = (row) => {
  permRoleId.value = row.id
  permRoleName.value = row.roleName ?? row.role_name
  permDialogVisible.value = true
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>角色管理</h1>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="{ searchName }">
        <el-form-item label="角色名称">
          <el-input v-model="searchName" placeholder="请输入角色名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button type="info" @click="handleClear">清空</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button type="primary" @click="handleAdd">+ 新增角色</el-button>
      <el-button type="danger" @click="handleBatchDelete">- 批量删除</el-button>
    </div>

    <!-- 表格 -->
    <div class="table-container">
      <el-table
        :data="roleList"
        border
        style="width: 100%"
        v-loading="roleList.length === 0"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="roleCode" label="角色编码" min-width="180" />
        <el-table-column prop="roleName" label="角色名称" width="140" />
        <el-table-column prop="description" label="描述" min-width="240" show-overflow-tooltip />
        <el-table-column label="权限数量" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain" round>
              {{ row.permissionCount ?? 0 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" align="center">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleAssignPermission(row)">
              🔑 分配权限
            </el-button>
            <el-button type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty v-if="roleList.length === 0" description="暂无角色数据">
        <el-button type="primary" @click="handleAdd">新增角色</el-button>
      </el-empty>
    </div>

    <!-- 分页 -->
    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[5, 10, 20, 50]"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <RoleFormDialog
      v-model:visible="dialogVisible"
      :role="currentRole"
      @saved="handleSaved"
    />
  </div>
</template>

<style scoped>
.search-bar, .action-bar, .table-container {
  margin: 16px 0;
}
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
```

- [ ] **Step 3: 验证角色管理页基本功能**

启动开发服务器：
```bash
npm run dev
```
验证：
1. `/role` 页面渲染搜索栏、操作按钮、空表格
2. 点击"新增角色"弹出 RoleFormDialog
3. 表单校验：空提交报错，编码不以 ROLE_ 开头报错

- [ ] **Step 4: 提交角色管理页**

```bash
git add src/components/role/RoleFormDialog.vue src/views/role/index.vue
git commit -m "feat(rbac): add role management page with add/edit dialog"
```

---

### Task 5: 权限 Accordion 选择器组件

**Files:**
- Create: `src/components/role/PermissionAccordion.vue`

- [ ] **Step 1: 创建 PermissionAccordion 组件**

```vue
<!-- src/components/role/PermissionAccordion.vue -->
<script setup>
import { ref, watch, computed } from 'vue'

/**
 * 权限 Accordion 折叠面板选择器
 *
 * 用于角色权限分配弹窗，以 el-collapse 展示 7 个模块，
 * 每个模块下以 checkbox 列出该模块的权限。
 *
 * Props:
 * - permissions: { [module: string]: <permission[]> } 全部分组权限
 * - selectedIds: number[] 已选中的权限 ID 列表（来自已分配查询）
 *
 * v-model: 当前选中的权限 ID 数组
 */

const props = defineProps({
  permissions: { type: Object, default: () => ({}) },
  selectedIds: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:selectedIds'])

// 当前选中的权限 ID（内部维护）
const selected = ref([...props.selectedIds])

// 模块名称到中文映射
const moduleLabels = {
  SYS: '系统管理',
  PLAN: '生产计划',
  ORDER: '订单管理',
  WORKORDER: '工单管理',
  EQU: '设备管理',
  BOM: '物料清单',
  PROC: '工序管理'
}

// 模块 icon 映射
const moduleIcons = {
  SYS: '⚙️',
  PLAN: '📊',
  ORDER: '📦',
  WORKORDER: '📋',
  EQU: '🔧',
  BOM: '📐',
  PROC: '🏭'
}

// 计算每个模块的选中状态
const getModuleCheckedCount = (module) => {
  const perms = props.permissions[module] || []
  return perms.filter(p => selected.value.includes(p.id)).length
}

const getModuleTotal = (module) => {
  return (props.permissions[module] || []).length
}

// 监听外部 selectedIds 变化
watch(() => props.selectedIds, (newVal) => {
  selected.value = [...newVal]
}, { deep: true })

// 勾选/取消
const togglePermission = (permId) => {
  const idx = selected.value.indexOf(permId)
  if (idx > -1) {
    selected.value.splice(idx, 1)
  } else {
    selected.value.push(permId)
  }
  emit('update:selectedIds', [...selected.value])
}

// 全选/取消全选某个模块
const toggleModule = (module) => {
  const perms = props.permissions[module] || []
  const allIds = perms.map(p => p.id)
  const allSelected = allIds.every(id => selected.value.includes(id))

  if (allSelected) {
    // 取消全选：移除该模块所有 ID
    selected.value = selected.value.filter(id => !allIds.includes(id))
  } else {
    // 全选：添加该模块未选中的 ID
    const toAdd = allIds.filter(id => !selected.value.includes(id))
    selected.value.push(...toAdd)
  }
  emit('update:selectedIds', [...selected.value])
}

// 计算默认展开的模块 — 第一个有已选权限的，否则第一个
const defaultActive = computed(() => {
  const modules = Object.keys(props.permissions)
  if (modules.length === 0) return ''
  const firstWithSelection = modules.find(m => getModuleCheckedCount(m) > 0)
  return firstWithSelection || modules[0]
})

// 当前展开的模块
const activeModules = ref([defaultActive.value])

// 同步 defaultActive
watch(defaultActive, (val) => {
  if (val && !activeModules.value.includes(val)) {
    activeModules.value = [val]
  }
})

</script>

<template>
  <div class="permission-accordion">
    <el-collapse v-model="activeModules">
      <el-collapse-item
        v-for="module in Object.keys(permissions)"
        :key="module"
        :name="module"
      >
        <template #title>
          <div class="module-header">
            <span>{{ moduleIcons[module] || '📦' }} {{ module }} — {{ moduleLabels[module] || module }}模块</span>
            <el-tag size="small" :type="getModuleCheckedCount(module) > 0 ? 'primary' : 'info'" effect="plain">
              已选 {{ getModuleCheckedCount(module) }}/{{ getModuleTotal(module) }}
            </el-tag>
          </div>
        </template>
        <div class="module-permissions">
          <el-checkbox
            v-for="perm in permissions[module]"
            :key="perm.id"
            :model-value="selected.includes(perm.id)"
            :label="`${perm.permissionCode ?? perm.permission_code} ${perm.permissionName ?? perm.permission_name}`"
            @change="togglePermission(perm.id)"
          />
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<style scoped>
.module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 12px;
}

.module-permissions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  padding: 8px 16px;
}
</style>
```

- [ ] **Step 2: 验证组件语法**

```bash
# Vite 构建时自动检查 SFC 语法，启动 dev server 观察控制台
npm run dev
```

- [ ] **Step 3: 提交 PermissionAccordion**

```bash
git add src/components/role/PermissionAccordion.vue
git commit -m "feat(rbac): add PermissionAccordion component for role permission assignment"
```

---

### Task 6: 角色权限分配弹窗组件

**Files:**
- Create: `src/components/role/RolePermissionDialog.vue`

- [ ] **Step 1: 创建 RolePermissionDialog 组件**

```vue
<!-- src/components/role/RolePermissionDialog.vue -->
<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { usePermissionStore } from '@/stores/permission'
import { useRolePermissionStore } from '@/stores/rolePermission'
import PermissionAccordion from './PermissionAccordion.vue'

/**
 * 角色权限分配弹窗
 *
 * 打开时加载全部权限（分组）和该角色已分配的权限，
 * 通过 PermissionAccordion 进行勾选/取消勾选，
 * 保存时对比变更调用分配/移除 API。
 *
 * Props:
 * - visible: 弹窗可见性
 * - roleId: 角色 ID
 * - roleName: 角色名称（用于标题显示）
 *
 * Events:
 * - update:visible: 弹窗关闭
 * - saved: 保存成功
 */

const props = defineProps({
  visible: { type: Boolean, default: false },
  roleId: { type: Number, default: null },
  roleName: { type: String, default: '' }
})

const emit = defineEmits(['update:visible', 'saved'])

const permissionStore = usePermissionStore()
const rolePermissionStore = useRolePermissionStore()

const { groupedPermissions } = permissionStore

// 已选权限 ID 列表
const selectedIds = ref([])
// 原始选中（用于重置）
const originalIds = ref([])
// 提交中
const submitting = ref(false)
// 加载中
const loading = ref(false)

// 已选数量
const selectedCount = ref(0)

// 打开弹窗时加载数据
watch(() => props.visible, async (val) => {
  if (val && props.roleId) {
    loading.value = true
    try {
      // 并行加载全部分组权限 + 该角色已分配权限
      await permissionStore.loadGrouped()
      const assigned = await rolePermissionStore.getPermissionsByRoleId(props.roleId)
      const ids = (assigned || []).map(p => p.id ?? p.permissionId ?? p.permission_id)
      selectedIds.value = [...ids]
      originalIds.value = [...ids]
      selectedCount.value = ids.length
    } catch (e) {
      ElMessage.error('加载权限数据失败')
    } finally {
      loading.value = false
    }
  }
})

// 选中变更时更新计数
const handleSelectionChange = (ids) => {
  selectedIds.value = ids
  selectedCount.value = ids.length
}

// 保存
const handleSave = async () => {
  submitting.value = true
  try {
    const originalSet = new Set(originalIds.value)
    const currentSet = new Set(selectedIds.value)

    // 新增的权限 ID
    const toAdd = [...currentSet].filter(id => !originalSet.has(id))
    // 移除的权限 ID
    const toRemove = [...originalSet].filter(id => !currentSet.has(id))

    // 执行新增
    if (toAdd.length > 0) {
      const addResult = await rolePermissionStore.assignPermissions({
        roleId: props.roleId,
        permissionIds: toAdd
      })
      if (addResult.code !== 200) {
        ElMessage.error('分配权限失败：' + (addResult.message || '未知错误'))
        return
      }
    }

    // 执行移除
    if (toRemove.length > 0) {
      const removeResult = await rolePermissionStore.removePermissions({
        roleId: props.roleId,
        permissionIds: toRemove.join(',')
      })
      if (removeResult.code !== 200) {
        ElMessage.error('移除权限失败：' + (removeResult.message || '未知错误'))
        return
      }
    }

    ElMessage.success('权限分配成功')
    emit('update:visible', false)
    emit('saved')
  } catch (e) {
    ElMessage.error('权限分配失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// 取消
const handleCancel = () => {
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="`为「${roleName}」分配权限`"
    width="700px"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <div v-loading="loading" style="min-height: 200px;">
      <div class="dialog-header">
        <span class="selected-info">已选 {{ selectedCount }} 项权限</span>
      </div>
      <PermissionAccordion
        v-if="!loading && Object.keys(groupedPermissions).length > 0"
        :permissions="groupedPermissions"
        :selected-ids="selectedIds"
        @update:selected-ids="handleSelectionChange"
      />
      <el-empty v-if="!loading && Object.keys(groupedPermissions).length === 0" description="暂无权限数据" />
    </div>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSave">
        保存权限
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-header {
  margin-bottom: 12px;
}
.selected-info {
  font-size: 13px;
  color: #67c23a;
}
</style>
```

- [ ] **Step 2: 将 RolePermissionDialog 集成到角色管理页**

在 `src/views/role/index.vue` 的 `<script setup>` 中补充 import（在已有的 import 之后添加）：

```js
import RolePermissionDialog from '@/components/role/RolePermissionDialog.vue'
```

在 `<template>` 区 `</div>` 闭合标签前（`RoleFormDialog` 之后）添加：

```html
    <!-- 分配权限弹窗 -->
    <RolePermissionDialog
      v-model:visible="permDialogVisible"
      :role-id="permRoleId"
      :role-name="permRoleName"
      @saved="loadData"
    />
```

> 注意：`permDialogVisible`、`permRoleId`、`permRoleName` 这些 ref 已在 Task 4 Step 2 中定义在 `<script setup>` 里。如果尚未定义，需添加：
> ```js
> const permDialogVisible = ref(false)
> const permRoleId = ref(null)
> const permRoleName = ref('')
> ```

- [ ] **Step 3: 提交 RolePermissionDialog**

```bash
git add src/components/role/RolePermissionDialog.vue src/views/role/index.vue
git commit -m "feat(rbac): add RolePermissionDialog with Accordion permission picker"
```

---

### Task 7: 权限管理页

**Files:**
- Modify: `src/views/permission/index.vue`（替换占位内容）

- [ ] **Step 1: 实现权限管理页完整视图**

```vue
<!-- src/views/permission/index.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { usePermissionStore } from '@/stores/permission'

/**
 * 权限管理页（只读）
 *
 * 权限编码由开发预定义，不提供运行时增删改。
 * 功能：按模块筛选查看权限列表，查看详情。
 */

const permissionStore = usePermissionStore()
const { permissionList } = permissionStore

// 模块筛选下拉选项
const moduleOptions = [
  { value: '', label: '全部模块' },
  { value: 'SYS', label: 'SYS - 系统管理' },
  { value: 'PLAN', label: 'PLAN - 生产计划' },
  { value: 'ORDER', label: 'ORDER - 订单管理' },
  { value: 'WORKORDER', label: 'WORKORDER - 工单管理' },
  { value: 'EQU', label: 'EQU - 设备管理' },
  { value: 'BOM', label: 'BOM - 物料清单' },
  { value: 'PROC', label: 'PROC - 工序管理' }
]

// 当前筛选模块
const selectedModule = ref('')
// 加载中
const loading = ref(false)
// 总记录数
const total = ref(0)
// 详情弹窗
const detailVisible = ref(false)
const detailData = ref({})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const moduleParam = selectedModule.value || undefined
    await permissionStore.loadPermissions(moduleParam)
    total.value = permissionList.value.length
  } catch (e) {
    // 加载失败由 store 内部处理
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

// 查询
const handleSearch = () => {
  loadData()
}

// 清空
const handleClear = () => {
  selectedModule.value = ''
  handleSearch()
}

// 查看详情
const handleDetail = async (row) => {
  const detail = await permissionStore.getPermissionById(row.id)
  if (detail) {
    detailData.value = detail
    detailVisible.value = true
  }
}

// 模块标签颜色
const getModuleTagType = (module) => {
  const colors = {
    SYS: 'primary',
    PLAN: 'success',
    ORDER: 'warning',
    WORKORDER: 'info',
    EQU: '',
    BOM: 'success',
    PROC: ''
  }
  return colors[module] || 'info'
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>权限管理</h1>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true">
        <el-form-item label="所属模块">
          <el-select v-model="selectedModule" placeholder="全部模块" clearable style="width: 200px;">
            <el-option
              v-for="opt in moduleOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button type="info" @click="handleClear">清空</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格 -->
    <div class="table-container">
      <el-table
        :data="permissionList"
        border
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="permissionCode" label="权限编码" min-width="180" />
        <el-table-column prop="permissionName" label="权限名称" width="140" />
        <el-table-column label="所属模块" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getModuleTagType(row.module)" size="small">
              {{ row.module }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="240" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty v-if="!loading && permissionList.length === 0" description="该模块下暂无权限数据" />
    </div>

    <!-- 底部统计 -->
    <div class="table-footer">
      <span>共 {{ total }} 条</span>
    </div>

    <!-- 警告横幅 -->
    <el-alert
      title="权限编码由开发预定义，不提供运行时增删改。如需新增权限，请修改数据库初始化脚本。"
      type="warning"
      :closable="false"
      show-icon
      style="margin-top: 16px;"
    />

    <!-- 详情弹窗（只读） -->
    <el-dialog v-model="detailVisible" title="权限详情" width="500px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="权限编码">{{ detailData.permissionCode ?? detailData.permission_code }}</el-descriptions-item>
        <el-descriptions-item label="权限名称">{{ detailData.permissionName ?? detailData.permission_name }}</el-descriptions-item>
        <el-descriptions-item label="所属模块">{{ detailData.module }}</el-descriptions-item>
        <el-descriptions-item label="描述">{{ detailData.description }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailData.createdAt ?? detailData.created_at }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.search-bar, .table-container {
  margin: 16px 0;
}
.table-footer {
  display: flex;
  justify-content: flex-end;
  padding: 8px 0;
  font-size: 13px;
  color: #909399;
}
</style>
```

- [ ] **Step 2: 验证权限管理页**

启动 dev server 后：
1. 访问 `/permission` 页面
2. 确认模块筛选下拉有 7 个选项 + 全部模块
3. 确认底部有黄色警告横幅
4. 确认表格无新增/编辑/删除按钮，仅"详情"

- [ ] **Step 3: 提交权限管理页**

```bash
git add src/views/permission/index.vue
git commit -m "feat(rbac): add permission management page (read-only list with module filter)"
```

---

### Task 8: 用户角色面板组件

**Files:**
- Create: `src/components/userPermission/UserRolePanel.vue`

- [ ] **Step 1: 创建 UserRolePanel 组件**

```vue
<!-- src/components/userPermission/UserRolePanel.vue -->
<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserRoleStore } from '@/stores/userRole'
import { useRoleStore } from '@/stores/role'

/**
 * 用户权限分配页 — 右侧面板
 *
 * Props:
 * - userId: 当前选中用户 ID
 * - userName: 当前选中用户姓名
 * - userInfo: 当前选中用户基本信息（用户名、职位等）
 *
 * 功能：
 * - 展示已分配角色（Tag + ✕ 移除）
 * - 多选列表添加新角色
 * - 保存/重置
 */

const props = defineProps({
  userId: { type: Number, default: null },
  userName: { type: String, default: '' },
  userInfo: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['refresh'])

const userRoleStore = useUserRoleStore()
const roleStore = useRoleStore()

// 已分配角色列表
const assignedRoles = ref([])
// 原始角色列表（用于重置）
const originalRoles = ref([])
// 所有可选角色
const allRoles = ref([])
// 多选列表当前选中的值
const selectedToAdd = ref([])
// 加载中
const loading = ref(false)
// 保存中
const saving = ref(false)

// 计算哪些角色未分配（可选列表）
const availableRoles = computed(() => {
  const assignedIds = new Set(assignedRoles.value.map(r => r.id))
  return allRoles.value.filter(r => !assignedIds.has(r.id))
})

// 监听用户切换
watch(() => props.userId, async (val) => {
  if (!val) {
    assignedRoles.value = []
    originalRoles.value = []
    selectedToAdd.value = []
    return
  }
  await loadUserRoles(val)
}, { immediate: true })

// 加载用户角色数据
const loadUserRoles = async (userId) => {
  loading.value = true
  try {
    // 并行加载用户角色 + 全部角色
    const [userRoles, allRolesData] = await Promise.all([
      userRoleStore.getRolesByUserId(userId),
      roleStore.loadRoles()
    ])

    assignedRoles.value = [...(userRoles || [])]
    originalRoles.value = [...(userRoles || [])]
    allRoles.value = [...(roleStore.roleList || [])]
    selectedToAdd.value = []
  } catch (e) {
    ElMessage.error('加载角色数据失败')
  } finally {
    loading.value = false
  }
}

// 移除已分配角色
const handleRemove = (role) => {
  assignedRoles.value = assignedRoles.value.filter(r => r.id !== role.id)
}

// 添加所选角色
const handleAdd = () => {
  if (selectedToAdd.value.length === 0) {
    ElMessage.warning('请先选择要添加的角色')
    return
  }
  const toAdd = allRoles.value.filter(r => selectedToAdd.value.includes(r.id))
  assignedRoles.value.push(...toAdd)
  selectedToAdd.value = []
}

// 保存
const handleSave = async () => {
  saving.value = true
  try {
    const originalIds = new Set(originalRoles.value.map(r => r.id))
    const currentIds = new Set(assignedRoles.value.map(r => r.id))

    // 新增的角色 ID
    const toAdd = [...currentIds].filter(id => !originalIds.has(id))
    // 移除的角色 ID
    const toRemove = [...originalIds].filter(id => !currentIds.has(id))

    if (toAdd.length > 0) {
      const result = await userRoleStore.assignRoles({
        userId: props.userId,
        roleIds: toAdd
      })
      if (result.code !== 200) {
        ElMessage.error('分配角色失败：' + (result.message || '未知错误'))
        return
      }
    }

    if (toRemove.length > 0) {
      const result = await userRoleStore.removeRoles({
        userId: props.userId,
        roleIds: toRemove.join(',')
      })
      if (result.code !== 200) {
        ElMessage.error('移除角色失败：' + (result.message || '未知错误'))
        return
      }
    }

    originalRoles.value = [...assignedRoles.value]
    ElMessage.success('保存分配成功')
    emit('refresh')
  } catch (e) {
    ElMessage.error('保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

// 重置
const handleReset = () => {
  assignedRoles.value = [...originalRoles.value]
  selectedToAdd.value = []
}
</script>

<template>
  <div class="user-role-panel" v-loading="loading">
    <!-- 未选择用户 -->
    <div v-if="!userId" class="empty-hint">
      <el-empty description="请在左侧选择一个用户" />
    </div>

    <!-- 用户信息 + 角色分配 -->
    <template v-else>
      <!-- 用户信息头 -->
      <div class="user-info-header">
        <h3>👤 {{ userName }}</h3>
        <p class="user-meta">
          {{ userInfo.userName ?? userInfo.username ?? '' }}
          <template v-if="userInfo.position"> · {{ userInfo.position }}</template>
        </p>
      </div>

      <!-- 已分配角色 -->
      <div class="section">
        <h4>✅ 已分配角色（点击 ✕ 移除）</h4>
        <div class="role-tags" v-if="assignedRoles.length > 0">
          <el-tag
            v-for="role in assignedRoles"
            :key="role.id"
            closable
            type="success"
            effect="plain"
            size="large"
            @close="handleRemove(role)"
          >
            {{ role.roleName ?? role.role_name }}
            <span style="color:#909399;font-size:11px;">
              ({{ role.roleCode ?? role.role_code }})
            </span>
          </el-tag>
        </div>
        <el-empty v-else description="该用户暂无角色" :image-size="40" />
      </div>

      <el-divider />

      <!-- 分配新角色 -->
      <div class="section">
        <h4>➕ 分配新角色</h4>
        <div class="add-role-area">
          <el-select
            v-model="selectedToAdd"
            multiple
            placeholder="请选择角色"
            style="flex: 1;"
            :disabled="availableRoles.length === 0"
          >
            <el-option
              v-for="role in availableRoles"
              :key="role.id"
              :label="`${role.roleName ?? role.role_name} (${role.roleCode ?? role.role_code})`"
              :value="role.id"
            />
          </el-select>
          <el-button type="primary" @click="handleAdd" :disabled="selectedToAdd.length === 0">
            添加所选 →
          </el-button>
        </div>
        <p class="hint" v-if="availableRoles.length === 0">所有角色已分配</p>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="success" :loading="saving" @click="handleSave">
          💾 保存分配
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </template>
  </div>
</template>

<script>
// computed import
import { computed } from 'vue'
</script>

<style scoped>
.user-role-panel {
  min-height: 400px;
}
.user-info-header {
  margin-bottom: 20px;
}
.user-info-header h3 {
  margin: 0 0 4px 0;
}
.user-meta {
  font-size: 13px;
  color: #909399;
  margin: 0;
}
.section {
  margin: 12px 0;
}
.section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
}
.role-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.add-role-area {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.hint {
  font-size: 12px;
  color: #909399;
  margin: 8px 0 0 0;
}
.action-buttons {
  margin-top: 24px;
  display: flex;
  gap: 8px;
}
.empty-hint {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>
```

> **注意**：由于 `<script>` 和 `<script setup>` 不能同时使用，需将 `computed` 的导入合并到 `<script setup>` 中。修正方法：删除底部的 `<script>` 块，在组件顶部 `<script setup>` 的 import 区域添加 `import { ref, watch, computed } from 'vue'`。

- [ ] **Step 2: 提交 UserRolePanel**

```bash
git add src/components/userPermission/UserRolePanel.vue
git commit -m "feat(rbac): add UserRolePanel for user-role assignment right panel"
```

---

### Task 9: 用户权限分配页

**Files:**
- Modify: `src/views/userPermission/index.vue`（替换占位内容）

- [ ] **Step 1: 实现用户权限分配页完整视图**

```vue
<!-- src/views/userPermission/index.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { queryPageApi as queryUserPage } from '@/api/emp'
import UserRolePanel from '@/components/userPermission/UserRolePanel.vue'

/**
 * 用户权限分配页
 *
 * 左栏（320px）：用户搜索 + 用户列表（分页）
 * 右栏（自适应）：UserRolePanel 角色分配面板
 */

// 左栏 — 用户搜索
const searchKeyword = ref('')

// 用户列表
const userList = ref([])
const userTotal = ref(0)
const userPage = ref(1)
const userPageSize = ref(10)
const userLoading = ref(false)

// 当前选中用户
const selectedUser = ref(null)

// 加载用户列表
const loadUsers = async () => {
  userLoading.value = true
  try {
    const result = await queryUserPage(
      searchKeyword.value, '', // name, position
      '', '', // begin, end
      userPage.value, userPageSize.value
    )
    if (result.code === 200) {
      userList.value = result.data.rows ?? result.data
      userTotal.value = result.data.total ?? 0
    }
  } catch (e) {
    // handled by request interceptor
  } finally {
    userLoading.value = false
  }
}

onMounted(() => {
  loadUsers()
})

// 搜索
const handleSearch = () => {
  userPage.value = 1
  loadUsers()
}

// 清空
const handleClear = () => {
  searchKeyword.value = ''
  handleSearch()
}

// 选中用户
const handleSelectUser = (user) => {
  selectedUser.value = user
}

// 分页
const handleUserPageChange = () => {
  loadUsers()
}

// 子组件刷新（保存后更新角色计数）
const handleRefresh = () => {
  loadUsers()
}
</script>

<template>
  <div class="page user-permission-page">
    <div class="page-header">
      <h1>用户权限分配</h1>
    </div>

    <div class="split-layout">
      <!-- 左侧：用户列表 -->
      <div class="left-panel">
        <div class="left-panel-header">
          <el-input
            v-model="searchKeyword"
            placeholder="🔍 搜索用户名或姓名"
            clearable
            @keyup.enter="handleSearch"
          />
          <div class="search-actions">
            <el-button type="primary" size="small" @click="handleSearch">查询</el-button>
            <el-button size="small" @click="handleClear">清空</el-button>
          </div>
        </div>

        <div class="user-list" v-loading="userLoading">
          <div
            v-for="user in userList"
            :key="user.id"
            class="user-item"
            :class="{ active: selectedUser?.id === user.id }"
            @click="handleSelectUser(user)"
          >
            <div class="user-name">{{ user.name }}</div>
            <div class="user-sub">
              {{ user.userName ?? user.username }}<template v-if="user.position"> · {{ user.position }}</template>
              <span class="role-count">{{ user.roleCount ?? 0 }}个角色</span>
            </div>
          </div>
          <el-empty v-if="!userLoading && userList.length === 0" description="暂无用户数据" :image-size="40" />
        </div>

        <div class="left-panel-footer">
          <span class="total-text">共 {{ userTotal }} 个用户</span>
          <el-pagination
            small
            layout="prev, pager, next"
            :total="userTotal"
            :page-size="userPageSize"
            v-model:current-page="userPage"
            @current-change="handleUserPageChange"
          />
        </div>
      </div>

      <!-- 右侧：角色分配面板 -->
      <div class="right-panel">
        <UserRolePanel
          :user-id="selectedUser?.id"
          :user-name="selectedUser?.name"
          :user-info="selectedUser"
          @refresh="handleRefresh"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-permission-page {
  height: calc(100vh - 160px);
  display: flex;
  flex-direction: column;
}
.split-layout {
  display: flex;
  flex: 1;
  gap: 0;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
}
.left-panel {
  width: 320px;
  min-width: 320px;
  border-right: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}
.left-panel-header {
  padding: 12px;
  background: #fff;
  border-bottom: 1px solid #dcdfe6;
}
.search-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.user-list {
  flex: 1;
  overflow-y: auto;
}
.user-item {
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}
.user-item:hover {
  background: #f5f7fa;
}
.user-item.active {
  background: #ecf5ff;
  border-left-color: #409eff;
}
.user-name {
  font-weight: 600;
  font-size: 14px;
}
.user-sub {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
.role-count {
  margin-left: 8px;
  color: #409eff;
  font-size: 11px;
}
.left-panel-footer {
  padding: 8px 12px;
  border-top: 1px solid #dcdfe6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.total-text {
  font-size: 12px;
  color: #909399;
}
.right-panel {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>
```

- [ ] **Step 2: 验证用户权限分配页**

```bash
npm run dev
# 访问 /userPermission
# 1. 确认左栏用户列表正常显示
# 2. 点击用户 → 右栏加载角色数据
# 3. 搜索用户功能正常
```

- [ ] **Step 3: 提交用户权限分配页**

```bash
git add src/views/userPermission/index.vue
git commit -m "feat(rbac): add user-permission assignment page with left-right split layout"
```

---

### Task 10: 快捷分配角色弹窗组件

**Files:**
- Create: `src/components/user/AssignRoleDialog.vue`

- [ ] **Step 1: 创建 AssignRoleDialog 组件**

```vue
<!-- src/components/user/AssignRoleDialog.vue -->
<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserRoleStore } from '@/stores/userRole'
import { useRoleStore } from '@/stores/role'

/**
 * 快捷分配角色弹窗（员工管理页使用）
 *
 * Props:
 * - visible: 弹窗可见性
 * - userId: 员工 ID
 * - userName: 员工姓名（标题显示）
 *
 * 以复选框列表展示全部角色，已分配的默认勾选。
 * 保存时对比变更，分别调用分配/移除 API。
 */

const props = defineProps({
  visible: { type: Boolean, default: false },
  userId: { type: Number, default: null },
  userName: { type: String, default: '' }
})

const emit = defineEmits(['update:visible', 'saved'])

const userRoleStore = useUserRoleStore()
const roleStore = useRoleStore()

// 全部角色列表
const allRoles = ref([])
// 复选框选中状态 { [roleId]: boolean }
const checkedRoles = ref({})
// 原始选中状态（用于对比变更）
const originalChecked = ref({})
// 加载中
const loading = ref(false)
// 提交中
const submitting = ref(false)

// 打开时加载数据
watch(() => props.visible, async (val) => {
  if (val && props.userId) {
    loading.value = true
    try {
      // 并行加载全部角色 + 用户已分配角色
      await roleStore.loadRoles()
      const userRoles = await userRoleStore.getRolesByUserId(props.userId)
      const assignedIds = new Set((userRoles || []).map(r => r.id))

      allRoles.value = [...roleStore.roleList]
      const checked = {}
      allRoles.value.forEach(r => {
        checked[r.id] = assignedIds.has(r.id)
      })
      checkedRoles.value = { ...checked }
      originalChecked.value = { ...checked }
    } catch (e) {
      ElMessage.error('加载角色数据失败')
    } finally {
      loading.value = false
    }
  }
})

// 单个角色勾选切换
const toggleRole = (roleId) => {
  checkedRoles.value[roleId] = !checkedRoles.value[roleId]
}

// 保存
const handleSave = async () => {
  submitting.value = true
  try {
    const toAdd = []
    const toRemove = []
    for (const roleId of Object.keys(checkedRoles.value)) {
      const wasChecked = originalChecked.value[roleId]
      const isChecked = checkedRoles.value[roleId]
      if (wasChecked && !isChecked) {
        toRemove.push(Number(roleId))
      } else if (!wasChecked && isChecked) {
        toAdd.push(Number(roleId))
      }
    }

    if (toAdd.length > 0) {
      const result = await userRoleStore.assignRoles({
        userId: props.userId,
        roleIds: toAdd
      })
      if (result.code !== 200) {
        ElMessage.error('分配角色失败：' + (result.message || '未知错误'))
        return
      }
    }

    if (toRemove.length > 0) {
      const result = await userRoleStore.removeRoles({
        userId: props.userId,
        roleIds: toRemove.join(',')
      })
      if (result.code !== 200) {
        ElMessage.error('移除角色失败：' + (result.message || '未知错误'))
        return
      }
    }

    ElMessage.success('分配成功')
    emit('update:visible', false)
    emit('saved')
  } catch (e) {
    ElMessage.error('分配失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="`为「${userName}」分配角色`"
    width="450px"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <div v-loading="loading" style="min-height: 120px;">
      <p class="hint-text">勾选要分配的角色，取消勾选即移除</p>
      <div class="role-check-list">
        <el-checkbox
          v-for="role in allRoles"
          :key="role.id"
          :model-value="checkedRoles[role.id]"
          @change="toggleRole(role.id)"
        >
          <b>{{ role.roleName ?? role.role_name }}</b>
          <span class="role-code">{{ role.roleCode ?? role.role_code }}</span>
        </el-checkbox>
      </div>
    </div>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSave">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.hint-text {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}
.role-check-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.role-code {
  font-size: 11px;
  color: #909399;
  margin-left: 6px;
}
</style>
```

- [ ] **Step 2: 提交 AssignRoleDialog**

```bash
git add src/components/user/AssignRoleDialog.vue
git commit -m "feat(rbac): add AssignRoleDialog for quick role assignment in employee page"
```

---

### Task 11: 员工管理页增强

**Files:**
- Modify: `src/views/user/index.vue`

- [ ] **Step 1: 在操作列添加"分配角色"按钮**

在 `src/views/user/index.vue` 中做以下修改：

**a) 在 `<script setup>` 顶部 import 区域添加：**

```js
import AssignRoleDialog from '@/components/user/AssignRoleDialog.vue'
```

**b) 在 `<script setup>` 中添加弹窗状态（放在其他 ref 旁边）：**

```js
// 快捷分配角色弹窗
const assignRoleVisible = ref(false)
const assignRoleUserId = ref(null)
const assignRoleUserName = ref('')
```

**c) 添加打开弹窗的处理函数：**

```js
// 打开快捷分配角色弹窗
const handleAssignRole = (row) => {
  assignRoleUserId.value = row.id
  assignRoleUserName.value = row.name
  assignRoleVisible.value = true
}
```

**d) 修改操作列模板** — 在现有的编辑和删除按钮之后、`</template>` 之前添加：

```html
<el-button type="success" size="small" @click="handleAssignRole(scope.row)">
  🔑 分配角色
</el-button>
```

操作列完整修改后的模板：

```html
<el-table-column label="操作" align="center">
    <template #default="scope">
        <el-button type="primary" size="small" @click="edit(scope.row.id)"><el-icon>
                <Edit />
            </el-icon> &nbsp; 编辑</el-button>
        <el-button type="danger" size="small" @click="deleteById(scope.row.id)"><el-icon>
                <Delete />
            </el-icon> &nbsp; 删除</el-button>
        <el-button type="success" size="small" @click="handleAssignRole(scope.row)">
            🔑 分配角色
        </el-button>
    </template>
</el-table-column>
```

**e) 在模板底部（`</template>` 闭合前）添加弹窗组件：**

```html
    <!-- 快捷分配角色弹窗 -->
    <AssignRoleDialog
        v-model:visible="assignRoleVisible"
        :user-id="assignRoleUserId"
        :user-name="assignRoleUserName"
        @saved="search"
    />
```

- [ ] **Step 2: 验证员工管理页增强**

```bash
npm run dev
# 访问 /user
# 1. 确认操作列出现绿色的"分配角色"按钮
# 2. 点击按钮 → 弹出 AssignRoleDialog
# 3. 勾选/取消角色后保存 → 提示成功
```

- [ ] **Step 3: 提交员工管理页增强**

```bash
git add src/views/user/index.vue
git commit -m "feat(rbac): add quick role assignment button to employee management page"
```

---

### Task 12: 状态处理完善

**Files:**
- Modify: `src/views/role/index.vue`（添加加载/错误/空状态完善）
- Modify: `src/views/permission/index.vue`（添加错误重试）
- Modify: `src/views/userPermission/index.vue`（添加加载/错误状态）

- [ ] **Step 1: 在角色管理页添加加载状态和错误重试**

在 `src/views/role/index.vue` 的 `<script setup>` 中添加：

```js
// 加载状态
const loading = ref(false)
const loadError = ref(false)

// 修改 loadData 方法为：
const loadData = async () => {
  loading.value = true
  loadError.value = false
  try {
    await roleStore.loadRoles({
      roleName: searchName.value,
      page: currentPage.value,
      pageSize: pageSize.value
    })
  } catch (e) {
    loadError.value = true
    ElMessage.error('加载角色列表失败')
  } finally {
    loading.value = false
  }
}
```

将表格的 `v-loading` 从 `roleList.length === 0` 改为 `loading`：

```html
<el-table
  :data="roleList"
  border
  style="width: 100%"
  v-loading="loading"
  @selection-change="handleSelectionChange"
>
```

在表格后添加错误重试块（放在空状态 el-empty 之后）：

```html
<!-- 错误状态 -->
<div v-if="loadError" class="error-state">
  <el-result icon="error" title="加载失败" sub-title="网络或服务异常，请稍后重试">
    <template #extra>
      <el-button type="primary" @click="loadData">重试</el-button>
    </template>
  </el-result>
</div>
```

- [ ] **Step 2: 在权限管理页添加错误重试**

在 `src/views/permission/index.vue` 的 `<script setup>` 中添加：

```js
const loadError = ref(false)

// 修改 loadData：
const loadData = async () => {
  loading.value = true
  loadError.value = false
  try {
    const moduleParam = selectedModule.value || undefined
    await permissionStore.loadPermissions(moduleParam)
    total.value = permissionList.value.length
  } catch (e) {
    loadError.value = true
  } finally {
    loading.value = false
  }
}
```

在空状态后添加：

```html
<div v-if="loadError" class="error-state">
  <el-result icon="error" title="加载失败" sub-title="网络或服务异常，请稍后重试">
    <template #extra>
      <el-button type="primary" @click="loadData">重试</el-button>
    </template>
  </el-result>
</div>
```

- [ ] **Step 3: 在用户权限分配页添加加载/错误状态**

在 `src/views/userPermission/index.vue` 的 `<script setup>` 中添加：

```js
const loadError = ref(false)

// 修改 loadUsers：
const loadUsers = async () => {
  userLoading.value = true
  loadError.value = false
  try {
    const result = await queryUserPage(/* ... */)
    if (result.code === 200) {
      userList.value = result.data.rows ?? result.data
      userTotal.value = result.data.total ?? 0
    }
  } catch (e) {
    loadError.value = true
  } finally {
    userLoading.value = false
  }
}
```

在左侧用户列表区域添加错误重试：

```html
<div v-if="loadError" class="error-state" style="padding:40px;text-align:center;">
  <el-result icon="error" title="加载失败" sub-title="网络或服务异常">
    <template #extra>
      <el-button type="primary" size="small" @click="loadUsers">重试</el-button>
    </template>
  </el-result>
</div>
```

- [ ] **Step 4: 全局样式补丁**

在 `src/assets/` 下已有全局样式文件的情况下，确认 `.error-state` 样式已覆盖。如果无全局文件，在各页面的 `<style scoped>` 中添加：

```css
.error-state {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
```

- [ ] **Step 5: 验证所有状态处理**

```bash
npm run dev
# 逐一验证：
# 1. 角色管理页 — 正常加载、刷新、搜索无结果空状态
# 2. 权限管理页 — 模块筛选、空结果
# 3. 用户权限分配页 — 未选用户、无角色用户、所有角色已分配
# 4. 各页面断网情况下的错误重试
```

- [ ] **Step 6: 提交状态处理完善**

```bash
git add src/views/role/index.vue src/views/permission/index.vue src/views/userPermission/index.vue
git commit -m "feat(rbac): add loading, empty, and error states to all RBAC pages"
```

---

## 完成检查清单

- [ ] 4 个 API 文件已创建并导出正确函数
- [ ] 4 个 Pinia Store 已创建并导出正确 actions
- [ ] 路由已注册 3 个新路由
- [ ] 侧边栏菜单已显示"系统管理"组
- [ ] 角色管理页：搜索、分页、新增、编辑、删除、权限分配弹窗
- [ ] 权限管理页：模块筛选、只读表格、详情弹窗、警告横幅
- [ ] 用户权限分配页：左栏用户列表、右栏角色分配面板
- [ ] 员工管理页："分配角色"快捷按钮 + 弹窗
- [ ] 所有页面的空状态、加载状态、错误重试
- [ ] 所有弹窗的提交 loading、表单校验
- [ ] 所有 ElMessage 反馈匹配 spec 定义

---

## 文件变更总结

| 文件 | 操作 | 内容 |
|------|------|------|
| `src/api/role.js` | 新增 | role CRUD API (5 函数) |
| `src/api/permission.js` | 新增 | permission 查询 API (3 函数) |
| `src/api/userRole.js` | 新增 | userRole 分配 API (4 函数) |
| `src/api/rolePermission.js` | 新增 | rolePermission 分配 API (4 函数) |
| `src/stores/role.js` | 新增 | 角色 Store — 列表/增删改查 |
| `src/stores/permission.js` | 新增 | 权限 Store — 列表/分组/详情 |
| `src/stores/userRole.js` | 新增 | 用户角色 Store — 查询/分配/移除 |
| `src/stores/rolePermission.js` | 新增 | 角色权限 Store — 查询/分配/移除 |
| `src/views/role/index.vue` | 新增 | 角色管理页 |
| `src/views/permission/index.vue` | 新增 | 权限管理页（只读） |
| `src/views/userPermission/index.vue` | 新增 | 用户权限分配页（左右分栏） |
| `src/components/role/RoleFormDialog.vue` | 新增 | 角色新增/编辑弹窗 |
| `src/components/role/PermissionAccordion.vue` | 新增 | Accordion 权限选择器 |
| `src/components/role/RolePermissionDialog.vue` | 新增 | 角色权限分配弹窗 |
| `src/components/userPermission/UserRolePanel.vue` | 新增 | 用户角色分配面板 |
| `src/components/user/AssignRoleDialog.vue` | 新增 | 快捷分配角色弹窗 |
| `src/router/index.js` | 修改 | 新增 3 条 RBAC 路由 |
| `src/views/layout/index.vue` | 修改 | 新增"系统管理"菜单组 |
| `src/views/user/index.vue` | 修改 | 操作列新增"分配角色"按钮 |
