# RBAC权限管理系统接口设计文档

## 一、概述

### 1.1 文档目的
本文档详细设计RBAC（基于角色的访问控制）权限管理系统的功能接口，用于指导后续开发实现。

### 1.2 系统背景
当前系统已创建RBAC相关数据库表，需要实现对应的后端接口功能，实现完整的权限管理机制。

### 1.3 技术栈
- 后端框架：Spring Boot
- ORM框架：MyBatis
- 数据库：MySQL
- 认证方式：JWT Token

---

## 二、数据库表结构分析

### 2.1 现有表结构

#### 2.1.1 用户表 (users)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | int | 主键ID |
| username | varchar | 用户名 |
| password | varchar | 密码 |
| name | varchar | 姓名 |
| position | varchar | 职位 |
| created_at | date | 创建时间 |
| updated_at | timestamp | 更新时间 |
| team_no | varchar | 班组编号（数据库存在，User.java 实体未映射此字段，计划后续补充映射） |

#### 2.1.2 角色表 (role)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | int | 主键ID |
| role_code | varchar | 角色编码（唯一） |
| role_name | varchar | 角色名称 |
| description | text | 角色描述 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

**现有角色数据：**
| id | role_code | role_name | description |
|----|-----------|-----------|-------------|
| 1 | ROLE_PROD_MANAGER | 生产主管 | 负责生产计划的制定、发布和管理 |
| 2 | ROLE_PROCESS_ENGINEER | 工艺工程师 | 负责工艺流程设计、BOM管理 |
| 3 | ROLE_HR_MANAGER | 人事主管 | 负责人员管理、岗位分配、权限分配 |
| 4 | ROLE_WORKSHOPS_DIRECTOR | 车间主任 | 负责车间整体管理、生产调度 |
| 5 | ROLE_TEAM_LEADER | 班组长 | 负责班组管理、工单分派 |

#### 2.1.3 权限表 (permission)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | int | 主键ID |
| permission_code | varchar | 权限编码（唯一） |
| permission_name | varchar | 权限名称 |
| module | varchar | 所属模块 |
| description | text | 权限描述 |
| created_at | datetime | 创建时间 |

**现有权限模块：**
- SYS：系统管理模块
- PLAN：生产计划模块
- ORDER：订单管理模块
- WORKORDER：工单管理模块
- EQU：设备管理模块
- BOM：物料清单模块
- PROC：工序管理模块

#### 2.1.4 用户角色关联表 (user_role)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | int | 主键ID |
| user_id | int | 用户ID（外键） |
| role_id | int | 角色ID（外键） |
| created_at | datetime | 创建时间 |

#### 2.1.5 角色权限关联表 (role_permission)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | int | 主键ID |
| role_id | int | 角色ID（外键） |
| permission_id | int | 权限ID（外键） |
| created_at | datetime | 创建时间 |

#### 2.1.6 编码命名规范

**权限编码格式**：`{MODULE}_{ACTION}`

- `MODULE`：模块缩写，大写字母，当前支持：`SYS` / `PLAN` / `ORDER` / `WORKORDER` / `EQU` / `BOM` / `PROC`
- `ACTION`：操作类型，大写字母，当前支持：`CREATE` / `UPDATE` / `DELETE` / `QUERY` / `ASSIGN` / `MANAGE` / `EXPORT` / `IMPORT`
- 示例：`ORDER_CREATE`（订单创建）、`SYS_USER_DELETE`（用户删除）、`SYS_PERMISSION_ASSIGN`（权限分配）
- 权限编码全局唯一，由数据库 `UNIQUE` 约束保证

**角色编码格式**：`ROLE_{DOMAIN}_{ROLE_NAME}`

- `ROLE_` 前缀为固定约定，所有角色编码必须以 `ROLE_` 开头
- `DOMAIN`：角色所属领域，如 `PROD`（生产）、`PROCESS`（工艺）、`HR`（人事）、`WORKSHOPS`（车间）、`TEAM`（班组）
- `ROLE_NAME`：角色职责名称，如 `MANAGER`、`ENGINEER`、`DIRECTOR`、`LEADER`
- 示例：`ROLE_PROD_MANAGER`（生产主管）、`ROLE_QUALITY_INSPECTOR`（质检员）

> **注意**：权限编码由开发阶段定义，通过数据库初始化脚本管理，**不提供运行时 API 创建/修改/删除接口**，以保证权限编码的稳定性和可追溯性。

---

## 三、功能模块设计

### 3.1 功能模块概览

```
RBAC权限管理系统
├── 角色管理模块
│   ├── 角色列表查询
│   ├── 角色详情查询
│   ├── 角色创建
│   ├── 角色更新
│   └── 角色删除
├── 权限管理模块
│   ├── 权限列表查询
│   ├── 权限详情查询
│   └── 按模块查询权限
├── 用户角色分配模块
│   ├── 查询用户角色
│   ├── 为用户分配角色
│   ├── 移除用户角色
│   └── 批量分配角色
├── 角色权限分配模块
│   ├── 查询角色权限
│   ├── 为角色分配权限
│   ├── 移除角色权限
│   └── 批量分配权限
└── 权限校验模块
    ├── 登录时加载权限
    ├── 接口权限拦截
    └── 权限校验API
```

---

## 四、接口详细设计

### 4.1 角色管理接口

#### 4.1.1 查询角色列表
- **接口路径**：`GET /role`
- **权限要求**：无（`/role/**` 路径已在 WebConfig 中排除权限校验）
- **请求参数**：
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | page | Integer | 否 | 页码，默认1 |
  | pageSize | Integer | 否 | 每页条数，默认10 |
  | roleName | String | 否 | 角色名称（模糊查询） |

- **响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 5,
    "list": [
      {
        "id": 1,
        "roleCode": "ROLE_PROD_MANAGER",
        "roleName": "生产主管",
        "description": "负责生产计划的制定、发布和管理",
        "createdAt": "2026-06-04 15:33:11",
        "updatedAt": "2026-06-04 15:58:31",
        "permissionCount": 5
      }
    ]
  }
}
```

#### 4.1.2 查询角色详情
- **接口路径**：`GET /role/{id}`
- **权限要求**：无
- **路径参数**：
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | id | Integer | 是 | 角色ID |

- **响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "roleCode": "ROLE_PROD_MANAGER",
    "roleName": "生产主管",
    "description": "负责生产计划的制定、发布和管理",
    "createdAt": "2026-06-04 15:33:11",
    "updatedAt": "2026-06-04 15:58:31",
    "permissions": [
      {
        "id": 13,
        "permissionCode": "ORDER_CREATE",
        "permissionName": "订单创建",
        "module": "ORDER"
      }
    ]
  }
}
```

#### 4.1.3 创建角色
- **接口路径**：`POST /role`
- **权限要求**：无（`/role/**` 路径已在 WebConfig 中排除权限校验）
- **请求体**：
```json
{
  "roleCode": "ROLE_QUALITY_INSPECTOR",
  "roleName": "质检员",
  "description": "负责产品质量检验和质量问题跟踪"
}
```

- **响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": "创建成功"
}
```

#### 4.1.4 更新角色
- **接口路径**：`PUT /role`
- **权限要求**：无（`/role/**` 路径已在 WebConfig 中排除权限校验）
- **请求体**：
```json
{
  "id": 1,
  "roleName": "生产主管（更新）",
  "description": "更新后的描述"
}
```

- **响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": "更新成功"
}
```

#### 4.1.5 删除角色
- **接口路径**：`DELETE /role`
- **权限要求**：无（`/role/**` 路径已在 WebConfig 中排除权限校验）
- **请求参数**：
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | ids | List<Integer> | 是 | 角色ID列表 |

- **响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": "删除成功"
}
```

---

### 4.2 权限管理接口

#### 4.2.1 查询权限列表
- **接口路径**：`GET /permission`
- **权限要求**：无
- **请求参数**：
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | module | String | 否 | 模块编码，筛选指定模块的权限 |

- **响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "permissionCode": "SYS_USER_CREATE",
      "permissionName": "用户创建",
      "module": "SYS",
      "description": "创建系统用户",
      "createdAt": "2026-06-04 15:33:11"
    }
  ]
}
```

#### 4.2.2 查询权限详情
- **接口路径**：`GET /permission/{id}`
- **权限要求**：无
- **路径参数**：
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | id | Integer | 是 | 权限ID |

- **响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "permissionCode": "SYS_USER_CREATE",
    "permissionName": "用户创建",
    "module": "SYS",
    "description": "创建系统用户",
    "createdAt": "2026-06-04 15:33:11"
  }
}
```

#### 4.2.3 按模块分组查询权限
- **接口路径**：`GET /permission/grouped`
- **权限要求**：无
- **响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "SYS": [
      {
        "id": 1,
        "permissionCode": "SYS_USER_CREATE",
        "permissionName": "用户创建"
      }
    ],
    "PLAN": [
      {
        "id": 7,
        "permissionCode": "PLAN_CREATE",
        "permissionName": "计划创建"
      }
    ]
  }
}
```

---

### 4.3 用户角色分配接口

#### 4.3.1 查询用户的角色
- **接口路径**：`GET /user-role/user/{userId}`
- **权限要求**：无（当前未启用 `@RequirePermission` 注解）
- **路径参数**：
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | userId | Integer | 是 | 用户ID |

- **响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "roleId": 1,
      "roleCode": "ROLE_PROD_MANAGER",
      "roleName": "生产主管",
      "createdAt": "2026-06-04 19:10:32"
    }
  ]
}
```

#### 4.3.2 为用户分配角色
- **接口路径**：`POST /user-role`
- **权限要求**：无（当前未启用 `@RequirePermission` 注解）
- **请求体**：
```json
{
  "userId": 2,
  "roleIds": [1, 2]
}
```

- **响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": "分配成功"
}
```

#### 4.3.3 移除用户角色
- **接口路径**：`DELETE /user-role`
- **权限要求**：无（当前未启用 `@RequirePermission` 注解）
- **请求参数**：
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | userId | Integer | 是 | 用户ID |
  | roleIds | List<Integer> | 是 | 角色ID列表 |

- **响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": "移除成功"
}
```

#### 4.3.4 查询角色下的用户
- **接口路径**：`GET /user-role/role/{roleId}`
- **权限要求**：无（当前未启用 `@RequirePermission` 注解）
- **路径参数**：
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | roleId | Integer | 是 | 角色ID |

- **响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "userId": 2,
      "username": "dunhong",
      "name": "顿红",
      "position": "生产主管",
      "createdAt": "2026-06-04 19:10:32"
    }
  ]
}
```

---

### 4.4 角色权限分配接口

#### 4.4.1 查询角色的权限
- **接口路径**：`GET /role-permission/role/{roleId}`
- **权限要求**：无（当前未启用 `@RequirePermission` 注解）
- **路径参数**：
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | roleId | Integer | 是 | 角色ID |

- **响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "permissionId": 13,
      "permissionCode": "ORDER_CREATE",
      "permissionName": "订单创建",
      "module": "ORDER",
      "createdAt": "2026-06-04 15:33:11"
    }
  ]
}
```

#### 4.4.2 为角色分配权限
- **接口路径**：`POST /role-permission`
- **权限要求**：无（当前未启用 `@RequirePermission` 注解）
- **请求体**：
```json
{
  "roleId": 1,
  "permissionIds": [1, 2, 3, 4, 5]
}
```

- **响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": "分配成功"
}
```

#### 4.4.3 移除角色权限
- **接口路径**：`DELETE /role-permission`
- **权限要求**：无（当前未启用 `@RequirePermission` 注解）
- **请求参数**：
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | roleId | Integer | 是 | 角色ID |
  | permissionIds | List<Integer> | 是 | 权限ID列表 |

- **响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": "移除成功"
}
```

#### 4.4.4 查询权限所属角色
- **接口路径**：`GET /role-permission/permission/{permissionId}`
- **权限要求**：无（当前未启用 `@RequirePermission` 注解）
- **路径参数**：
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | permissionId | Integer | 是 | 权限ID |

- **响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "roleId": 1,
      "roleCode": "ROLE_PROD_MANAGER",
      "roleName": "生产主管"
    }
  ]
}
```

---

### 4.5 权限校验接口

#### 4.5.1 查询当前用户权限
- **接口路径**：`GET /auth/permissions`
- **权限要求**：已登录
- **请求头**：`token: <JWT Token>`
- **响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "userId": 2,
    "username": "dunhong",
    "name": "顿红",
    "roles": [
      {
        "id": 1,
        "roleCode": "ROLE_PROD_MANAGER",
        "roleName": "生产主管"
      }
    ],
    "permissions": [
      "ORDER_CREATE",
      "ORDER_UPDATE",
      "ORDER_DELETE",
      "ORDER_ASSIGN",
      "ORDER_QUERY"
    ]
  }
}
```

#### 4.5.2 校验用户权限
- **接口路径**：`GET /auth/check`
- **权限要求**：已登录
- **请求头**：`token: <JWT Token>`
- **请求参数**：
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | permissionCode | String | 是 | 权限编码 |

- **响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "hasPermission": true
  }
}
```

#### 4.5.3 登录接口增强
- **接口路径**：`POST /login`
- **请求体**：
```json
{
  "userName": "dunhong",
  "password": "123456"
}
```

- **响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 2,
    "userName": "dunhong",
    "name": "顿红",
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  }
}
```

> **注意**：当前登录接口返回 `LoginInfo` 对象，仅包含 `id`、`userName`、`name`、`token` 字段。如需获取用户角色和权限信息，请调用 `GET /auth/permissions` 接口。

---

## 五、权限拦截设计

### 5.1 权限注解设计

创建自定义权限注解，用于标记需要权限校验的接口：

```java
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequirePermission {
    String[] value() default {};  // 权限编码数组
    Logical logical() default Logical.AND;  // AND/OR 逻辑
}

public enum Logical {
    AND, OR
}
```

### 5.2 权限拦截器设计

创建权限拦截器，在请求处理前校验用户权限：

```java
@Component
public class PermissionInterceptor implements HandlerInterceptor {
    // 从Token中解析用户ID
    // 查询用户权限
    // 校验是否拥有所需权限
}
```

### 5.3 接口权限配置表

> **当前状态**：`@RequirePermission` 注解与 `PermissionInterceptor` 拦截器基础设施已就绪，并已在 RBAC 管理接口的写操作上应用。当前的权限控制层次：
> - `LoginFilter`（`@WebFilter "/*"`）：对所有非 `/login` 请求进行 JWT 认证
> - `PermissionInterceptor`（注册到 `/**`）：排除 `/login`、`/error`、`/auth/**` 路径。对 `/role/**` 和 `/permission/**` 的 GET 请求自动放行（查询不受限），写操作受 `@RequirePermission` 保护
> - 生产域状态变更接口通过 `PermissionPolicy` 实现进行权限校验（如 `planPermissionPolicy`、`orderPermissionPolicy`、`workOrderPermissionPolicy`）

| 接口路径 | 方法 | 设计所需权限 | 当前实际 |
|----------|------|-------------|----------|
| /user | GET | 无 | 仅 LoginFilter |
| /user | POST | SYS_USER_CREATE | ✅ @RequirePermission |
| /user | PUT | SYS_USER_UPDATE | ✅ @RequirePermission |
| /user | DELETE | SYS_USER_DELETE | ✅ @RequirePermission |
| /role | GET | 无 | 无（拦截器对 GET 放行） |
| /role | POST | SYS_ROLE_MANAGE | ✅ @RequirePermission |
| /role | PUT | SYS_ROLE_MANAGE | ✅ @RequirePermission |
| /role | DELETE | SYS_ROLE_MANAGE | ✅ @RequirePermission |
| /permission | GET | 无 | 无（拦截器对 GET 放行） |
| /user-role | GET | 无 | 仅 LoginFilter |
| /user-role | POST | SYS_PERMISSION_ASSIGN | ✅ @RequirePermission |
| /user-role | DELETE | SYS_PERMISSION_ASSIGN | ✅ @RequirePermission |
| /role-permission | GET | 无 | 仅 LoginFilter |
| /role-permission | POST | SYS_PERMISSION_ASSIGN | ✅ @RequirePermission |
| /role-permission | DELETE | SYS_PERMISSION_ASSIGN | ✅ @RequirePermission |
| /plan | POST | PLAN_CREATE | 仅 LoginFilter |
| /plan | PUT | PLAN_UPDATE | 仅 LoginFilter |
| /plan | DELETE | PLAN_DELETE | 仅 LoginFilter |
| /plan/actions/{action} | POST | 按 action 策略 | PermissionPolicy 校验 |
| /order/actions/{action} | POST | 按 action 策略 | PermissionPolicy 校验 |
| /work-order/actions/{action} | POST | 按 action 策略 | PermissionPolicy 校验 |
| /equipment | POST | EQU_CREATE | 仅 LoginFilter |
| /equipment | PUT | EQU_UPDATE | 仅 LoginFilter |
| /equipment | DELETE | EQU_DELETE | 仅 LoginFilter |
| /bom | POST | BOM_CREATE | 仅 LoginFilter |
| /bom | PUT | BOM_UPDATE | 仅 LoginFilter |
| /bom | DELETE | BOM_DELETE | 仅 LoginFilter |
| /process | POST | PROC_CREATE | 仅 LoginFilter |
| /process | PUT | PROC_UPDATE | 仅 LoginFilter |
| /process | DELETE | PROC_DELETE | 仅 LoginFilter |

> ⚠️ **已知待办**：生产域 CRUD 接口（`/plan`、`/order`、`/equipment`、`/bom`、`/process`）的写操作目前仅依赖 `LoginFilter`（JWT 认证），尚未添加 `@RequirePermission` 注解。这些接口的权限保护计划在后续迭代中补全。

---

## 六、实体类设计

### 6.1 新增实体类

#### 6.1.1 Role.java
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Role {
    private Integer id;
    @NotBlank(message = "角色编码不能为空")
    private String roleCode;
    @NotBlank(message = "角色名称不能为空")
    private String roleName;
    private String description;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
```

#### 6.1.2 Permission.java
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Permission {
    private Integer id;
    private String permissionCode;
    private String permissionName;
    private String module;
    private String description;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
```

#### 6.1.3 UserRole.java
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRole {
    private Integer id;
    private Integer userId;
    private Integer roleId;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
```

#### 6.1.4 RolePermission.java
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RolePermission {
    private Integer id;
    private Integer roleId;
    private Integer permissionId;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
```

### 6.2 新增VO类

#### 6.2.1 RoleVO.java
```java
@Data
public class RoleVO {
    private Integer id;
    private String roleCode;
    private String roleName;
    private String description;
    private List<PermissionVO> permissions;
    private Integer permissionCount;
}
```

#### 6.2.2 UserPermissionVO.java
```java
@Data
public class UserPermissionVO {
    private Integer userId;
    private String username;
    private String name;
    private List<RoleVO> roles;
    private List<String> permissions;
}
```

#### 6.2.3 AssignRoleDTO.java
```java
@Data
public class AssignRoleDTO {
    private Integer userId;
    private List<Integer> roleIds;
}
```

#### 6.2.4 AssignPermissionDTO.java
```java
@Data
public class AssignPermissionDTO {
    private Integer roleId;
    private List<Integer> permissionIds;
}
```

---

## 七、服务层设计

### 7.1 服务接口

#### 7.1.1 RoleService.java
```java
public interface RoleService {
    ResultPage<Role> getAllRole(RoleQueryParam param);
    RoleVO getRoleById(Integer id);
    int addRole(Role role);
    int updateRole(Role role);
    int deleteRoles(List<Integer> ids);
}
```

#### 7.1.2 PermissionService.java
```java
public interface PermissionService {
    List<Permission> getAllPermission(String module);
    Permission getPermissionById(Integer id);
    Map<String, List<Permission>> getPermissionsGrouped();
}
```

#### 7.1.3 UserRoleService.java
```java
public interface UserRoleService {
    List<RoleVO> getRolesByUserId(Integer userId);
    List<UserVO> getUsersByRoleId(Integer roleId);
    int assignRoles(AssignRoleDTO dto);
    int removeRoles(Integer userId, List<Integer> roleIds);
}
```

#### 7.1.4 RolePermissionService.java
```java
public interface RolePermissionService {
    List<PermissionVO> getPermissionsByRoleId(Integer roleId);
    List<RoleVO> getRolesByPermissionId(Integer permissionId);
    int assignPermissions(AssignPermissionDTO dto);
    int removePermissions(Integer roleId, List<Integer> permissionIds);
}
```

#### 7.1.5 AuthService.java
```java
public interface AuthService {
    UserPermissionVO getCurrentUserPermissions(Integer userId);
    boolean checkPermission(Integer userId, String permissionCode);
    Set<String> getUserPermissionCodes(Integer userId);
}
```

---

## 八、实现要点

### 8.1 权限缓存策略
- 用户权限信息在登录时加载，可缓存至Redis
- 用户角色/权限变更时，清除对应用户的权限缓存
- 缓存Key格式：`user:permission:{userId}`

### 8.2 权限校验流程
1. 请求进入 → LoginFilter验证Token
2. 解析Token获取用户ID
3. PermissionInterceptor检查接口权限注解
4. 查询用户权限（优先从缓存获取）
5. 校验是否拥有所需权限
6. 有权限则放行，无权限返回403

### 8.3 数据库操作注意事项
- 分配角色/权限时，需检查是否已存在，避免重复插入
- 移除角色/权限时，需同步清除用户权限缓存
- 删除角色时，需级联删除 `role_permission` 中的关联记录（已实现）；`user_role` 中的关联记录依赖数据库外键约束或单独处理
- 删除用户时，需级联删除 `user_role` 中的关联记录

### 8.4 异常处理
- 权限不足：返回403 Forbidden
- 角色不存在：返回400 Bad Request
- 用户不存在：返回400 Bad Request
- 权限编码重复：返回400 Bad Request
- 角色编码重复：返回400 Bad Request

---

## 九、接口汇总表

| 模块 | 接口路径 | 方法 | 功能 | 安全状态 |
|------|----------|------|------|----------|
| 角色管理 | /role | GET | 查询角色列表 | GET 自动放行 |
| 角色管理 | /role/{id} | GET | 查询角色详情 | GET 自动放行 |
| 角色管理 | /role | POST | 创建角色 | ✅ @RequirePermission(SYS_ROLE_MANAGE) |
| 角色管理 | /role | PUT | 更新角色 | ✅ @RequirePermission(SYS_ROLE_MANAGE) |
| 角色管理 | /role | DELETE | 删除角色 | ✅ @RequirePermission(SYS_ROLE_MANAGE) |
| 权限管理 | /permission | GET | 查询权限列表 | GET 自动放行 |
| 权限管理 | /permission/{id} | GET | 查询权限详情 | GET 自动放行 |
| 权限管理 | /permission/grouped | GET | 按模块分组查询 | GET 自动放行 |
| 用户角色 | /user-role/user/{userId} | GET | 查询用户角色 | 仅 LoginFilter |
| 用户角色 | /user-role/role/{roleId} | GET | 查询角色用户 | 仅 LoginFilter |
| 用户角色 | /user-role | POST | 分配用户角色 | ✅ @RequirePermission(SYS_PERMISSION_ASSIGN) |
| 用户角色 | /user-role | DELETE | 移除用户角色 | ✅ @RequirePermission(SYS_PERMISSION_ASSIGN) |
| 角色权限 | /role-permission/role/{roleId} | GET | 查询角色权限 | 仅 LoginFilter |
| 角色权限 | /role-permission/permission/{permissionId} | GET | 查询权限角色 | 仅 LoginFilter |
| 角色权限 | /role-permission | POST | 分配角色权限 | ✅ @RequirePermission(SYS_PERMISSION_ASSIGN) |
| 角色权限 | /role-permission | DELETE | 移除角色权限 | ✅ @RequirePermission(SYS_PERMISSION_ASSIGN) |
| 权限校验 | /auth/permissions | GET | 查询当前用户权限 | 已登录 |
| 权限校验 | /auth/check | GET | 校验用户权限 | 已登录 |

> **说明**：`@RequirePermission` 注解已在 RBAC 管理接口的写操作上应用。`/role/**` 和 `/permission/**` 的 GET 查询请求由 `PermissionInterceptor` 自动放行，写操作受注解保护。生产域 CRUD 接口的权限注解计划在后续迭代中补全。

---

## 十、文件结构规划

```
smart-workshop-pojo/src/main/java/com/xtax/
├── entity/
│   ├── Role.java
│   ├── Permission.java
│   ├── UserRole.java
│   └── RolePermission.java
├── dto/
│   ├── RoleQueryParam.java
│   ├── AssignRoleDTO.java
│   └── AssignPermissionDTO.java
├── vo/
│   ├── RoleVO.java
│   ├── PermissionVO.java
│   ├── UserPermissionVO.java
│   └── UserVO.java

smart-workshop-server/src/main/java/com/xtax/
├── controller/
│   ├── RoleController.java
│   ├── PermissionController.java
│   ├── UserRoleController.java
│   ├── RolePermissionController.java
│   └── AuthController.java
├── service/
│   ├── RoleService.java
│   ├── PermissionService.java
│   ├── UserRoleService.java
│   ├── RolePermissionService.java
│   ├── AuthService.java
│   └── serviceImpl/
│       ├── RoleServiceImpl.java
│       ├── PermissionServiceImpl.java
│       ├── UserRoleServiceImpl.java
│       ├── RolePermissionServiceImpl.java
│       └── AuthServiceImpl.java
├── mapper/
│   ├── RoleMapper.java
│   ├── PermissionMapper.java
│   ├── UserRoleMapper.java
│   └── RolePermissionMapper.java
├── annotation/
│   ├── RequirePermission.java
│   └── Logical.java
├── interceptor/
│   └── PermissionInterceptor.java
└── config/
    └── WebConfig.java (注册拦截器)

smart-workshop-server/src/main/resources/com/xtax/mapper/
├── RoleMapper.xml
├── PermissionMapper.xml
├── UserRoleMapper.xml
└── RolePermissionMapper.xml
```

---

## 十一、总结

本设计文档详细描述了RBAC权限管理系统的功能接口设计，包括：

1. **角色管理**：角色的增删改查功能
2. **权限管理**：权限的查询功能
3. **用户角色分配**：为用户分配/移除角色
4. **角色权限分配**：为角色分配/移除权限
5. **权限校验**：登录时加载权限、接口权限拦截

设计遵循现有项目的技术栈和代码规范，采用Spring Boot + MyBatis架构，使用JWT进行身份认证，通过自定义注解和拦截器实现权限校验。

---

## 十二、已知待办

以下项目为已识别但尚未实现的功能增强，计划在后续迭代中处理：

| 序号 | 待办项 | 优先级 | 说明 |
|------|--------|--------|------|
| 1 | 生产域 CRUD 接口权限保护 | 高 | `/plan`、`/order`、`/equipment`、`/bom`、`/process` 的 POST/PUT/DELETE 接口尚未添加 `@RequirePermission` 注解，当前仅依赖 JWT 认证 |
| 2 | 权限缓存实现 | 中 | 文档 8.1 节描述的 Redis 缓存策略尚未实现，当前每次权限校验均直接查询数据库（三表 JOIN）。建议使用 Spring Cache 或 Caffeine 本地缓存，缓存 Key：`user:permission:{userId}`，TTL 30 分钟 |
| 3 | 角色/权限变更后缓存失效 | 中 | 与第 2 项配套，在 `UserRoleService` 和 `RolePermissionService` 的增删方法中增加 `@CacheEvict` 逻辑 |
| 4 | `User.java` 补充 `team_no` 字段映射 | 低 | 数据库 `users` 表存在 `team_no` 字段但实体类未映射，需评估是否需要补充映射或从数据库移除 |
| 5 | 登录接口返回角色信息（可选） | 低 | 评估是否在 `/login` 响应中直接返回用户角色列表，减少前端一次额外的 `/auth/permissions` 请求。需权衡 JWT 内角色信息过期风险 |