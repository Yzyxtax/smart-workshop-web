# 数据库设计文档

## 1. 概述

本数据库设计用于支持生产制造执行系统（MES），涵盖产品物料清单（BOM）、工艺流程、工序管理、生产计划与工单、设备信息、人员班组、权限管理等核心模块。主要业务包括：

- 物料与BOM管理（支持层级结构）
- 工艺流程定义（工序顺序、工时、质检点）
- 生产计划与订单执行（计划→订单→工单）
- 设备与工序步骤关联
- 人员技能与班组管理
- 状态变更历史追踪
- 用户权限与角色管理（RBAC模型）

## 2. 表结构详细说明

### 2.1 bom – 物料清单

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 物料主键 |
| drawing_no | varchar(100) | 可空 | 图号 |
| name_specification | varchar(200) | 可空 | 名称规格 |
| material | varchar(100) | 可空 | 材质 |
| quantity | int | 可空 | 数量 |
| unit_weight | decimal(10,3) | 可空 | 单重 |
| type | varchar(10) | 可空 | 类型 |
| parent_id | int | 外键(bom.id), 可空 | 父物料ID（支持树形结构） |

- **索引**：主键 `id`
- **外键**：`parent_id` 引用 `bom.id`，级联更新/删除

### 2.2 equipment_info – 设备信息

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 设备主键 |
| name | varchar(100) | NOT NULL | 设备名称 |
| type | varchar(50) | 可空 | 设备类型 |
| model | varchar(100) | 可空 | 型号 |
| production_date | date | 可空 | 生产日期 |
| manufacturer | varchar(100) | 可空 | 制造商 |

- **索引**：`idx_ei_name` on `name`

### 2.3 equipment_functions – 设备功能

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 功能主键 |
| equipment_info_id | int | NOT NULL, 外键 | 关联设备ID |
| function_description | text | 可空 | 功能描述 |

- **索引**：`equipment_info_id`
- **外键**：`equipment_info_id` 引用 `equipment_info(id)`，级联更新/删除

### 2.4 process_flows – 工艺流程

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 流程主键 |
| bom_id | int | NOT NULL, 外键 | 关联BOM ID |
| flow_name | varchar(100) | NOT NULL | 流程名称 |
| status | varchar(10) | NOT NULL | 是否废弃（如“有效”“废弃”） |
| planned_working_hours | int | 可空 | 计划总工时 |

- **外键**：`bom_id` 引用 `bom(id)`，级联更新/删除

### 2.5 processes – 工序定义

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 工序主键 |
| process_name | varchar(100) | NOT NULL, UNIQUE | 工序名称 |
| planned_working_hours | double | 可空 | 计划工时（小时） |
| description | text | 可空 | 工序描述 |
| quality_control_point | text | 可空 | 质量检查指标 |

- **唯一约束**：`process_name`
- **索引**：`idx_p_name` on `process_name`

### 2.6 input – 工序投入物料

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 主键 |
| input | int | NOT NULL, 外键 | 物料ID（BOM） |
| process_id | int | 可空, 外键 | 工序ID |

- **外键**：`input` 引用 `bom(id)`，`process_id` 引用 `processes(id)`，级联更新/删除

### 2.7 output – 工序产出物料

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 主键 |
| output | int | NOT NULL, 外键 | 物料ID（BOM） |
| process_id | int | NOT NULL, 外键 | 工序ID |

- **外键**：`output` 引用 `bom(id)`，`process_id` 引用 `processes(id)`，级联更新/删除

### 2.8 process_flow_processes – 工艺流程与工序关联

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 主键 |
| process_flow_id | int | NOT NULL, 外键 | 工艺流程ID |
| process_id | int | NOT NULL, 外键 | 工序ID |

- **索引**：`process_flow_id`, `process_id`
- **外键**：分别引用 `process_flows(id)` 和 `processes(id)`，级联更新/删除

### 2.9 process_sequences – 工序顺序（前驱后继）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 主键 |
| process_id | int | NOT NULL, 外键 | 当前工序ID |
| previous_process_id | int | 可空, 外键 | 前驱工序ID |
| process_flow_id | int | NOT NULL, 外键 | 所属工艺流程ID |

- **索引**：`previous_process_id`, `process_id`
- **外键**：`process_id`/`previous_process_id` 引用 `processes(id)`；`process_flow_id` 引用 `process_flows(id)`，级联更新/删除

### 2.10 production_lines – 生产线

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 主键 |
| line_no | varchar(50) | NOT NULL, UNIQUE | 线别编号 |
| line_name | varchar(100) | NOT NULL | 线别名称 |
| line_status | varchar(20) | 默认 '空闲' | 运行/空闲/暂停 |
| process_flow_id | int | 可空, 外键 | 当前执行的工艺流程ID |

- **索引**：`process_flow_id`
- **外键**：`process_flow_id` 引用 `process_flows(id)`，级联更新/删除

### 2.11 work_steps – 作业步骤

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 主键 |
| name | varchar(100) | NOT NULL | 步骤名称 |
| equipment_id | int | 可空, 外键 | 关联设备ID |
| function_id | int | 可空, 外键 | 关联设备功能ID |
| description | text | 可空 | 步骤描述 |

- **索引**：`equipment_id`, `function_id`, `idx_ws_name` on `name`
- **外键**：`equipment_id` → `equipment_info(id)`；`function_id` → `equipment_functions(id)`，级联更新/删除

### 2.12 process_steps – 工序与作业步骤关联

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 主键 |
| process_id | int | NOT NULL, 外键 | 工序ID |
| work_step_id | int | NOT NULL, 外键 | 作业步骤ID |

- **索引**：`process_id`, `idx_ps_work_step_id` on `work_step_id`
- **外键**：`process_id` → `processes(id)`；`work_step_id` → `work_steps(id)`，级联更新/删除

### 2.13 work_teams – 班组

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 主键 |
| team_name | varchar(100) | NOT NULL | 班组名称 |
| team_location | varchar(200) | 可空 | 班组位置 |
| line_no | varchar(50) | 可空, 外键 | 关联生产线编号 |
| team_no | varchar(50) | NOT NULL, UNIQUE | 班组编号 |

- **唯一约束**：`team_no`
- **外键**：`line_no` 引用 `production_lines(line_no)`，级联更新/删除

### 2.14 users – 用户（员工）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 主键 |
| username | varchar(50) | NOT NULL, UNIQUE | 登录用户名 |
| password | varchar(255) | NOT NULL, 默认 '123456' | 密码 |
| name | varchar(50) | NOT NULL | 真实姓名 |
| position | varchar(50) | 可空 | 职位 |
| created_at | date | 默认当前日期 | 创建日期 |
| updated_at | timestamp | 默认 CURRENT_TIMESTAMP | 更新时间戳 |
| team_no | varchar(50) | 可空, 外键 | 所属班组编号 |

- **唯一约束**：`username`
- **外键**：`team_no` 引用 `work_teams(team_no)`，级联更新/删除
- **权限控制**：通过 `user_role` 表关联角色，采用 RBAC 权限模型

### 2.15 production_plan – 生产计划

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 主键 |
| plan_no | varchar(50) | NOT NULL, UNIQUE | 计划编号 |
| plan_name | varchar(50) | 可空 | 计划名称 |
| bom_id | int | NOT NULL, 外键 | 产品BOM ID |
| plan_num | int | NOT NULL | 计划生产数量 |
| completed_num | int | NOT NULL, 默认 0 | 已完成数量 |
| start_time | date | NOT NULL | 计划开始日期 |
| end_time | date | NOT NULL | 计划结束日期 |
| priority | enum('强','中','弱') | 默认 '弱' | 优先级 |
| status | enum('CREATED','RELEASED','RUNNING','PAUSED','COMPLETED') | NOT NULL, 默认 'CREATED' | 计划状态 |
| creator_id | int | NOT NULL, 外键 | 创建人ID |
| publisher_id | int | 可空, 外键 | 发布人ID |
| create_time | datetime | 可空 | 创建时间 |
| update_time | datetime | 可空 | 更新时间 |
| remark | text | 可空 | 备注 |

- **外键**：`bom_id` → `bom(id)`；`creator_id` / `publisher_id` → `users(id)`，级联更新/删除

### 2.16 production_order – 生产订单

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 主键 |
| order_no | varchar(50) | NOT NULL, UNIQUE | 订单编号 |
| plan_no | varchar(50) | NOT NULL, 外键 | 关联计划编号 |
| line_no | varchar(50) | NOT NULL, 外键 | 生产线编号 |
| order_name | varchar(50) | 可空 | 订单名称 |
| quantity | int | NOT NULL | 订单数量 |
| quantity_produced | int | NOT NULL, 默认 0 | 实际生产数量 |
| qualified_products | int | NOT NULL, 默认 0 | 合格品数量 |
| defective_products | int | NOT NULL, 默认 0 | 不合格品数量 |
| actual_start_time | datetime | 可空 | 实际开始时间 |
| actual_end_time | datetime | 可空 | 实际结束时间 |
| start_time | datetime | NOT NULL | 计划开始时间 |
| end_time | datetime | NOT NULL | 计划结束时间 |
| status | enum('CREATED','RELEASED','RUNNING','PAUSED','COMPLETED') | NOT NULL, 默认 'CREATED' | 订单状态 |
| create_time | datetime | 可空 | 创建时间 |
| update_time | datetime | 可空 | 更新时间 |

- **外键**：`plan_no` → `production_plan(plan_no)`；`line_no` → `production_lines(line_no)`，级联更新/删除

### 2.17 skills – 员工技能

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 主键 |
| username | varchar(50) | NOT NULL, 外键 | 用户用户名 |
| name | varchar(50) | 可空 | 员工姓名（冗余） |
| process_name | varchar(100) | NOT NULL, 外键 | 工序名称 |
| choose | tinyint(1) | NOT NULL, 默认 0 | 是否擅长（0/1） |
| team_no | varchar(50) | 可空, 外键 | 班组编号 |

- **外键**：`username` → `users(username)`；`process_name` → `processes(process_name)`；`team_no` → `work_teams(team_no)`，级联更新/删除

### 2.18 status_history – 状态变更历史

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | bigint unsigned | PK, AUTO_INCREMENT | 主键 |
| target_type | enum('PLAN','ORDER','WORK_ORDER') | NOT NULL | 对象类型 |
| target_no | varchar(50) | NOT NULL | 对象编号（计划/订单/工单号） |
| old_status | enum('CREATED','RELEASED','RUNNING','PAUSED','COMPLETED') | NOT NULL | 原状态 |
| new_status | enum('CREATED','RELEASED','RUNNING','PAUSED','COMPLETED') | NOT NULL | 新状态 |
| operator_id | int | NOT NULL, 外键 | 操作人ID |
| created_time | timestamp | 默认 CURRENT_TIMESTAMP | 创建时间 |

- **外键**：`operator_id` → `users(id)`，级联更新/删除

### 2.19 work_order – 生产工单

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 主键 |
| order_no | varchar(50) | NOT NULL, 外键 | 生产订单编号 |
| work_order_no | varchar(50) | NOT NULL | 工单编号 |
| process_id | int | NOT NULL, 外键 | 工序ID |
| user_id | int | NOT NULL, 外键 | 负责人ID |
| is_critical | tinyint(1) | NOT NULL, 默认 0 | 是否关键工单 |
| planned_quantity | int | NOT NULL | 计划数量 |
| actual_quantity | int | NOT NULL | 实际完成数量 |
| scrap_quantity | int | NOT NULL | 报废数量 |
| status | enum('CREATED','RELEASED','RUNNING','PAUSED','COMPLETED') | NOT NULL, 默认 'CREATED' | 工单状态 |
| start_time | datetime | NOT NULL | 计划开始时间 |
| end_time | datetime | NOT NULL | 计划结束时间 |
| actual_start_time | datetime | 可空 | 实际开始时间 |
| actual_end_time | datetime | 可空 | 实际结束时间 |
| create_time | datetime | NOT NULL | 创建时间 |
| update_time | datetime | NOT NULL | 更新时间 |

- **外键**：`order_no` → `production_order(order_no)`；`process_id` → `processes(id)`；`user_id` → `users(id)`，级联更新/删除

### 2.20 permission – 权限表

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 权限主键 |
| permission_code | varchar(100) | NOT NULL, UNIQUE | 权限代码（如PLAN_PUBLISH） |
| permission_name | varchar(100) | NOT NULL | 权限名称（中文描述） |
| module | varchar(50) | NOT NULL | 所属模块（SYS/PLAN/ORDER/WORKORDER等） |
| description | text | 可空 | 权限描述 |
| created_at | datetime | 默认 CURRENT_TIMESTAMP | 创建时间 |

- **唯一约束**：`permission_code`
- **索引**：`idx_module` on `module`

### 2.21 role – 角色表

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 角色主键 |
| role_code | varchar(50) | NOT NULL, UNIQUE | 角色代码（如ROLE_PROD_MANAGER） |
| role_name | varchar(100) | NOT NULL | 角色名称（中文描述） |
| description | text | 可空 | 角色描述 |
| created_at | datetime | 默认 CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | 默认 CURRENT_TIMESTAMP ON UPDATE | 更新时间戳 |

- **唯一约束**：`role_code`
- **索引**：`idx_role_name` on `role_name`

### 2.22 role_permission – 角色权限关联表

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 主键 |
| role_id | int | NOT NULL, 外键 | 角色ID |
| permission_id | int | NOT NULL, 外键 | 权限ID |
| created_at | datetime | 默认 CURRENT_TIMESTAMP | 创建时间 |

- **唯一约束**：`uk_role_permission(role_id, permission_id)`
- **索引**：`idx_role_id`, `idx_permission_id`
- **外键**：`role_id` → `role(id)`；`permission_id` → `permission(id)`，级联更新/删除

### 2.23 user_role – 用户角色关联表

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 主键 |
| user_id | int | NOT NULL, 外键 | 用户ID |
| role_id | int | NOT NULL, 外键 | 角色ID |
| created_at | datetime | 默认 CURRENT_TIMESTAMP | 创建时间 |

- **唯一约束**：`uk_user_role(user_id, role_id)`
- **索引**：`idx_user_id`, `idx_role_id`
- **外键**：`user_id` → `users(id)`；`role_id` → `role(id)`，级联更新/删除

## 3. 主要关系图（概念）

```
bom (物料树) ← process_flows ← production_plan ← production_order ← work_order
       ↓                                    ↓
   input/output                       production_lines
       ↓                                    ↓
   processes ← process_sequences      work_teams ← users ← user_role → role ← role_permission → permission
       ↓                                    ↓
   process_steps ← work_steps ← equipment_functions ← equipment_info
```

## 4. 约束与触发说明

- 几乎所有外键都带有 `ON UPDATE CASCADE ON DELETE CASCADE`，确保数据一致性。
- 状态字段使用枚举类型，业务流转遵循 `CREATED → RELEASED → RUNNING → PAUSED/COMPLETED` 顺序。
- 状态历史表独立记录计划、订单、工单的状态变更，支持审计追溯。

## 5. 权限模型变更说明

### 5.1 变更背景

原设计中 `users` 表包含 `permission_level` 字段（简单数字级别权限），与系统已有的 RBAC 权限模型（role、user_role、permission、role_permission）存在架构冲突，导致：
- 权限判断逻辑混乱（两套机制并存）
- 数据一致性风险（两种权限可能冲突）
- 冗余设计（RBAC 已足够灵活）

### 5.2 变改内容

**2026-06-04 权限模型统一化改造：**

1. **移除字段**：删除 `users` 表的 `permission_level` 字段
2. **数据迁移**：将所有用户根据 `position` 字段映射到对应的角色
   - 生产主管 → ROLE_PROD_MANAGER
   - 工艺工程师 → ROLE_PROCESS_ENGINEER
   - 人事主管 → ROLE_HR_MANAGER
   - 车间主任 → ROLE_WORKSHOPS_DIRECTOR
   - 班组长 → ROLE_TEAM_LEADER
   - 工人 → ROLE_WORKER
3. **统一权限控制**：完全采用 RBAC 模型，通过 `user_role → role → role_permission → permission` 链路进行权限判断

### 5.3 影响范围

- **数据库表结构**：users 表字段变更
- **权限验证逻辑**：需更新相关业务代码，使用 RBAC 模型替代 permission_level 判断
- **用户创建流程**：不再设置 permission_level，通过 user_role 分配角色

### 5.4 迁移详情

详见迁移文档：`.trae/specs/fix-user-permission-model/migration-mapping.md`