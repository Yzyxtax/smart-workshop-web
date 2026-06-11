# MES 计划管理模块 API 接口文档

> **版本**: v1.2  
> **基础路径**: `http://{host}:{port}/plan`  
> **认证方式**: JWT Token（`Authorization: Bearer <token>` 或 `token` 请求头）  
> **日期**: 2026-06-10  
> **变更**: v1.2 — PAUSED 判定排除 CREATED/RELEASED 订单；COMPLETED 判定纳入 TERMINATED 订单（Fix 11/12）

---

## 目录

1. [通用说明](#1-通用说明)
2. [API 概览](#2-api-概览)
3. [CRUD 接口](#3-crud-接口)
   - [3.1 查询所有计划](#31-查询所有计划)
   - [3.2 新增计划](#32-新增计划)
   - [3.3 修改计划](#33-修改计划)
   - [3.4 删除计划](#34-删除计划)
4. [状态变更接口](#4-状态变更接口)
   - [4.1 统一状态动作接口](#41-统一状态动作接口)
   - [4.2 状态-动作矩阵](#42-状态-动作矩阵)
5. [联动接口](#5-联动接口)
   - [5.1 按计划查询订单列表](#51-按计划查询订单列表)
6. [数据模型](#6-数据模型)
7. [错误码说明](#7-错误码说明)
8. [状态感知约束](#8-状态感知约束)
9. [业务规则](#9-业务规则)

---

## 1. 通用说明

### 1.1 认证

除登录接口外，所有接口均需携带 JWT Token：

```
Authorization: Bearer <jwt_token>
```

或

```
token: <jwt_token>
```

### 1.2 通用响应格式

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | Integer | 状态码，200 表示成功 |
| message | String | 提示信息 |
| data | Object | 响应数据，可为 null |

### 1.3 分页响应格式

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "total": 100,
    "rows": []
  }
}
```

---

## 2. API 概览

| 方法 | URL | 说明 | 权限 |
|------|-----|------|------|
| `GET` | `/plan` | 查询所有计划 | 登录用户 |
| `POST` | `/plan` | 新增计划 | 生产主管 |
| `PUT` | `/plan/{planNo}` | 修改计划 | 生产主管 |
| `DELETE` | `/plan/{planNo}` | 删除计划 | 生产主管 |
| `POST` | `/plan/{planNo}/actions/{action}` | 执行状态动作 | 见状态-权限矩阵 |
| `GET` | `/order/plan/{planNo}` | 按计划查询订单列表 | 登录用户 |

> **注意**:
> - `GET /order/plan/{planNo}` 为订单模块接口，用于查询指定计划下关联的所有生产订单，计划管理上下文中统称为"联动查询"。
> - 状态动作接口的 `userId` 从 JWT Token 中自动解析，**不接收客户端传入的用户 ID**。

---

## 3. CRUD 接口

### 3.1 查询所有计划

**请求**

```
GET /plan
```

**响应示例**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "planNo": "PLAN-20260608-001",
      "planName": "车载摄像头模组生产计划",
      "bomId": 1001,
      "planNum": 5000,
      "completedNum": 1200,
      "startTime": "2026-06-10",
      "endTime": "2026-07-31",
      "priority": "高",
      "status": "RUNNING",
      "creatorId": 1001,
      "publisherId": 1002,
      "createTime": "2026-06-07 09:00:00",
      "updateTime": "2026-06-08 08:30:00",
      "remark": "紧急订单配套计划"
    },
    {
      "planNo": "PLAN-20260608-002",
      "planName": "电池管理系统生产计划",
      "bomId": 1002,
      "planNum": 3000,
      "completedNum": 0,
      "startTime": "2026-07-01",
      "endTime": "2026-08-15",
      "priority": "中",
      "status": "CREATED",
      "creatorId": 1001,
      "publisherId": null,
      "createTime": "2026-06-07 10:00:00",
      "updateTime": "2026-06-07 10:00:00",
      "remark": null
    }
  ]
}
```

---

### 3.2 新增计划

> 创建生产计划。计划初始状态为 `CREATED`。  
> 计划编号由调用方生成并传入（如 `PLAN-20260608-001` 格式）。

**请求**

```
POST /plan
Content-Type: application/json
```

**请求体**

```json
{
  "planNo": "PLAN-20260608-003",
  "planName": "车载域控制器生产计划",
  "bomId": 1003,
  "planNum": 2000,
  "startTime": "2026-07-15",
  "endTime": "2026-09-30",
  "priority": "高",
  "creatorId": 1001,
  "remark": "新车型配套计划"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| planNo | String | 是 | 计划编号，需自行生成保证唯一性 |
| planName | String | 是 | 计划名称 |
| bomId | Integer | 是 | 关联产品 BOM ID |
| planNum | Integer | 是 | 计划生产数量 |
| startTime | LocalDate | 否 | 计划开始时间 (yyyy-MM-dd) |
| endTime | LocalDate | 否 | 计划结束时间 (yyyy-MM-dd) |
| priority | String | 否 | 优先级（如：高/中/低） |
| creatorId | Integer | 否 | 创建人 ID |
| publisherId | Integer | 否 | 发布人 ID（创建时通常为 null） |
| remark | String | 否 | 备注 |

**响应示例**

```json
{
  "code": 200,
  "message": "添加成功",
  "data": null
}
```

**响应示例（失败）**

```json
{
  "code": 400,
  "message": "添加失败",
  "data": null
}
```

**业务规则**:
- 计划编号（planNo）由调用方生成，后端不自动生成
- 初始状态固定为 `CREATED`
- 初始 `completedNum` 为 0
- 创建时间（createTime）和更新时间（updateTime）由数据库自动填充当前时间

---

### 3.3 修改计划

> 根据计划当前状态，可修改的字段范围不同。  
> 状态越靠后，可修改字段越少，终态完全不可修改。

**请求**

```
PUT /plan/{planNo}
Content-Type: application/json
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| planNo | String | 是 | 计划编号 |

**请求体**

```json
{
  "planNum": 6000,
  "startTime": "2026-07-20",
  "endTime": "2026-10-15",
  "priority": "中",
  "remark": "数量调整，交期顺延"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| planNo | String | 否 | 计划编号（仅 CREATED 可改） |
| planName | String | 否 | 计划名称（仅 CREATED 可改） |
| bomId | Integer | 否 | BOM ID（仅 CREATED 可改） |
| planNum | Integer | 否 | 计划数量（CREATED/RELEASED 可改） |
| startTime | LocalDate | 否 | 计划开始时间（CREATED/RELEASED 可改） |
| endTime | LocalDate | 否 | 计划结束时间（CREATED/RELEASED 可改） |
| priority | String | 否 | 优先级（CREATED/RELEASED 可改） |
| remark | String | 否 | 备注（CREATED/RELEASED 可改） |

**状态感知更新规则**:

| 状态 | planNo/planName/bomId | planNum | 时间 | priority | remark |
|------|:---:|:---:|:---:|:---:|:---:|
| CREATED | ✅ | ✅ | ✅ | ✅ | ✅ |
| RELEASED | ❌ | ✅ | ✅ | ✅ | ✅ |
| RUNNING | ❌ | ❌ | ❌ | ❌ | ❌ |
| PAUSED | ❌ | ❌ | ❌ | ❌ | ❌ |
| COMPLETED | ❌ | ❌ | ❌ | ❌ | ❌ |
| TERMINATED | ❌ | ❌ | ❌ | ❌ | ❌ |

> **实现细节**: RELEASED 状态下，即使请求体中传入了 planName 或 bomId，也会被服务端从数据库原值覆盖，不会生效。

**成功响应**

```json
{
  "code": 200,
  "message": "更新成功",
  "data": null
}
```

**错误响应（状态不允许修改）**

```json
{
  "code": 400,
  "message": "计划处于「执行中」状态，不允许修改",
  "data": null
}
```

---

### 3.4 删除计划

> 仅 `CREATED` 状态的计划允许删除。  
> 一旦计划已发布（产生不可逆执行事实），禁止删除，只允许作废（TERMINATE）。

**请求**

```
DELETE /plan/{planNo}
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| planNo | String | 是 | 计划编号 |

**成功响应**

```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

**错误响应（计划不存在）**

```json
{
  "code": 400,
  "message": "计划编号 PLAN-20260608-999 不存在",
  "data": null
}
```

**错误响应（状态不允许删除）**

```json
{
  "code": 400,
  "message": "计划处于「发布」状态，不允许删除",
  "data": null
}
```

**错误响应（删除失败）**

```json
{
  "code": 400,
  "message": "删除失败",
  "data": null
}
```

---

## 4. 状态变更接口

### 4.1 统一状态动作接口

> 所有状态变更操作通过统一入口处理，遵循 **权限校验 → 状态机校验 → 门禁校验 → 业务校验 → 持久化 → 审计 → 联动** 管道。  
> `userId` 由服务端从 JWT Token 自动解析，客户端无需传入。

**请求**

```
POST /plan/{planNo}/actions/{action}
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| planNo | String | 是 | 计划编号 |
| action | String | 是 | 动作枚举值，见下表 |

**action 可选值**:

| 值 | 中文 | 类型 | 说明 |
|----|------|------|------|
| PUBLISH | 发布 | 决策型 | 生产主管手动触发，冻结计划并联动拆分为生产订单 |
| CANCEL_PUBLISH | 取消发布 | 决策型 | 回退到 CREATED，需生产主管权限 |
| PAUSE | 暂停 | 干预型 | 中断计划执行，需生产主管权限 |
| RESUME | 恢复执行 | 干预型 | 恢复暂停的计划，需生产主管权限 |
| TERMINATE | 作废 | 干预型 | 终止计划（终态不可逆），需生产主管权限，需校验无执行中订单 |

> **注意**: `START_WORK` 和 `FINISH_WORK` 在计划层**不适用**。计划的执行态（RUNNING）和完成态（COMPLETED）由下层的订单状态联动上传自动驱动，不通过用户直接操作。

**处理管道**:

```
1. 获取 Plan 实体，构建 StateContext
2. 权限校验（planPermissionPolicy.check）
3. 状态机规则校验（planStateMachine.check）
4. 门禁校验（仅 PUBLISH 触发，GatePolicy.check）
5. 业务校验（TERMINATE 时校验无执行中订单）
6. 计算目标状态并持久化
7. 审计记录（AuditService.record）
8. 联动处理（handleLinkage，根据 action 类型执行不同的级联策略）：
   ├── PUBLISH    → 按产线拆分生成 Order
   ├── PAUSE      → 级联暂停所有 RUNNING 的 Order 及其 WorkOrder
   ├── RESUME     → 级联恢复所有 PAUSED 的 Order 及其 WorkOrder
   ├── CANCEL_PUBLISH → 级联作废所有非终态的 Order 及其 WorkOrder
   └── TERMINATE  → 级联终止所有非终态的 Order 及其 WorkOrder
```

**成功响应**

```json
{
  "code": 200,
  "message": "计划 [PLAN-20260608-001] 执行动作 [发布] 成功",
  "data": null
}
```

**权限不足（403）**

```json
{
  "code": 403,
  "message": "权限不足: 操作员无权限执行此操作",
  "data": null
}
```

**状态机拒绝（400）**

```json
{
  "code": 400,
  "message": "操作不符合规则: Plan 状态 [COMPLETED] 不允许执行动作 [PAUSE]",
  "data": null
}
```

**门禁校验失败（400 — PUBLISH 时）**

```json
{
  "code": 400,
  "message": "发布失败：该产品对应的工艺流程未定义或无效",
  "data": null
}
```

**TERMINATE 业务校验失败（400）**

```json
{
  "code": 400,
  "message": "计划下存在执行中的订单，不允许作废",
  "data": null
}
```

**参数错误（400）**

```json
{
  "code": 400,
  "message": "参数错误: 未提供有效的认证令牌",
  "data": null
}
```

**系统异常（500）**

```json
{
  "code": 500,
  "message": "系统内部执行异常，请联系管理员",
  "data": null
}
```

---

### 4.2 状态-动作矩阵

| 当前状态 ↓ / 动作 → | PUBLISH | CANCEL_PUBLISH | START_WORK | PAUSE | RESUME | FINISH_WORK | TERMINATE |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **CREATED** | ✅ 主管 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **RELEASED** | ❌ | ✅ 主管 | ❌ | ❌ | ❌ | ❌ | ✅ 主管 |
| **RUNNING** | ❌ | ❌ | ❌ | ✅ 主管 | ❌ | ❌ | ❌ |
| **PAUSED** | ❌ | ❌ | ❌ | ❌ | ✅ 主管 | ❌ | ❌ |
| **COMPLETED** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **TERMINATED** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**图例**:
- ✅ = 允许
- ❌ = 不允许
- **主管** = 需"生产主管"角色权限

> **与订单模块的关键差异**:
> - 计划层 **不支持** `START_WORK` / `FINISH_WORK`，这两个动作属于工单事实驱动层，计划层的执行/完成由订单状态联动上传
> - `PUBLISH` 在计划层是**人工决策型**操作（生产主管手动触发），在订单层是系统联动触发
> - 计划层的 `PAUSE` 由生产主管手动干预触发，订单层的 `PAUSE` 由工单状态联动上传

---

## 5. 联动接口

### 5.1 按计划查询订单列表

> 查询指定计划下关联的所有生产订单。本接口定义在订单管理模块中，计划管理模块通过此接口查看下发结果。

**请求**

```
GET /order/plan/{planNo}
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| planNo | String | 是 | 计划编号 |

**响应示例**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "orderNo": "PLAN-20260608-001-LINE-A01",
      "planNo": "PLAN-20260608-001",
      "lineNo": "LINE-A01",
      "orderName": "车载摄像头模组生产计划-LINE-A01",
      "quantity": 5000,
      "quantityProduced": 1200,
      "qualifiedProducts": 1150,
      "defectiveProducts": 50,
      "status": "RUNNING"
    },
    {
      "orderNo": "PLAN-20260608-001-LINE-A02",
      "planNo": "PLAN-20260608-001",
      "lineNo": "LINE-A02",
      "orderName": "车载摄像头模组生产计划-LINE-A02",
      "quantity": 5000,
      "quantityProduced": 0,
      "qualifiedProducts": 0,
      "defectiveProducts": 0,
      "status": "RELEASED"
    }
  ]
}
```

---

## 6. 数据模型

### 6.1 Plan（生产计划实体）

| 字段 | 类型 | 说明 |
|------|------|------|
| planNo | String | 计划编号，主键，格式 `PLAN-yyyyMMdd-nnn` |
| planName | String | 计划名称 |
| bomId | Integer | 关联产品 BOM ID |
| planNum | Integer | 计划生产数量 |
| completedNum | Integer | 已完成数量 |
| startTime | LocalDate | 计划开始时间 |
| endTime | LocalDate | 计划结束时间 |
| priority | String | 优先级（如：高/中/低） |
| status | StateEnum | 当前状态 |
| creatorId | Integer | 创建人 ID |
| publisherId | Integer | 发布人 ID |
| createTime | LocalDateTime | 创建时间 (yyyy-MM-dd HH:mm:ss) |
| updateTime | LocalDateTime | 更新时间 (yyyy-MM-dd HH:mm:ss) |
| remark | String | 备注 |

### 6.2 Plan 新增请求体

> 直接使用 `Plan` 实体作为请求体，无需额外的 DTO 包装。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| planNo | String | 是 | 计划编号，需自行生成 |
| planName | String | 是 | 计划名称 |
| bomId | Integer | 是 | BOM ID |
| planNum | Integer | 是 | 计划生产数量 |
| startTime | LocalDate | 否 | 计划开始时间 |
| endTime | LocalDate | 否 | 计划结束时间 |
| priority | String | 否 | 优先级 |
| creatorId | Integer | 否 | 创建人 ID |
| publisherId | Integer | 否 | 发布人 ID |
| remark | String | 否 | 备注 |

### 6.3 Plan 修改请求体

> 直接使用 `Plan` 实体作为请求体，MyBatis 动态 SQL 仅更新非空字段。  
> RELEASED 状态下 planName、bomId 会被服务端强制执行原值覆盖。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| planNo | String | 否 | 计划编号（仅 CREATED 可改） |
| planName | String | 否 | 计划名称（仅 CREATED 可改） |
| bomId | Integer | 否 | BOM ID（仅 CREATED 可改） |
| planNum | Integer | 否 | 计划数量（CREATED/RELEASED 可改） |
| startTime | LocalDate | 否 | 开始时间（CREATED/RELEASED 可改） |
| endTime | LocalDate | 否 | 结束时间（CREATED/RELEASED 可改） |
| priority | String | 否 | 优先级（CREATED/RELEASED 可改） |
| remark | String | 否 | 备注（CREATED/RELEASED 可改） |

---

## 7. 错误码说明

| HTTP 状态 | code | 场景 | 说明 |
|-----------|------|------|------|
| 200 | 200 | 正常 | 操作成功 |
| 400 | 400 | 参数错误 | Token 缺失或解析失败 |
| 400 | 400 | 状态机拒绝 | 当前状态不允许该动作 |
| 400 | 400 | 门禁失败 | 发布校验不通过（工艺/产线/人员） |
| 400 | 400 | 业务校验失败 | 如 TERMINATE 时仍有执行中订单 |
| 400 | 400 | 状态不允许操作 | 修改/删除时状态不满足条件 |
| 400 | 400 | 资源不存在 | 计划编号不存在 |
| 403 | 403 | 权限不足 | 用户无"生产主管"角色 |
| 500 | 500 | 系统异常 | 服务器内部错误 |

---

## 8. 状态感知约束

### 8.1 修改约束

```
CREATED ─── 全部字段可修改
RELEASED ── 仅 planNum、时间（startTime/endTime）、priority、remark 可修改；
            planName/bomId 由服务端强制从数据库原值覆盖
RUNNING ─── 不允许修改
PAUSED ──── 不允许修改
COMPLETED ─ 不允许修改（终态）
TERMINATED─ 不允许修改（终态）
```

### 8.2 删除约束

| 状态 | 允许删除 |
|------|:---:|
| CREATED | ✅ |
| 其他所有状态 | ❌ |

**设计原则**: 一旦计划已发布（关联了订单/产线/工艺资源），禁止删除，只允许通过 TERMINATE 作废。

### 8.3 状态生命周期

```
┌──────────┐   PUBLISH    ┌──────────┐
│ CREATED  │ ───────────→ │ RELEASED │ ──TERMINATE──→ ┌────────────┐
│ (草稿)   │ ←─────────── │ (已发布) │               │ TERMINATED │
└──────────┘ CANCEL_      └────┬─────┘               │  (作废)    │
              PUBLISH          │                      └────────────┘
                               │ 订单联动（任一订单 RUNNING）
                               ▼
                        ┌──────────┐
                        │ RUNNING  │ ←────RESUME──── ┌──────────┐
                        │ (执行中) │ ────PAUSE──────→ │ PAUSED   │
                        └────┬─────┘                 │ (已暂停)  │
                             │                       └──────────┘
                             │ 订单联动（所有订单完成或终止）
                             ▼
                        ┌──────────┐
                        │COMPLETED │
                        │ (完成)   │
                        └──────────┘
```

> **关键**: 计划的 RUNNING / PAUSED / COMPLETED 状态**不由用户直接操作**，而是由订单层状态通过 `syncPlanStatusFromOrders()` 联动上传自动驱动。

---

## 9. 业务规则

### 9.1 发布门禁（PUBLISH Gate）

计划从 `CREATED` 发布到 `RELEASED` 时，需通过三道门禁：

| 门禁 | 校验内容 | 失败提示 |
|------|---------|----------|
| **工艺流程存在性** | 计划是否绑定有效的 BOM，BOM 是否关联合规的工艺流程 | "发布失败：该产品对应的工艺流程未定义或无效" |
| **产线可用性** | 工艺流程是否至少有一条匹配的可用产线 | "发布失败：工艺流程没有匹配的可用产线" |
| **人员可执行性** | 每条工艺流程的每道工序是否至少有一名具备技能的可用员工 | "发布失败：工序「焊接」缺少具备技能的可用员工" |

校验通过后：状态 CREATED → RELEASED。

### 9.2 联动规则（Plan → Order → WorkOrder）

计划的状态变更通过 `planStateServiceImpl.handleLinkage()` 实现向下级联联动，不同 action 对应不同的级联策略。

#### 9.2.1 发布下发（PUBLISH）

计划发布时，自动按工艺流程和产线拆分生成生产订单：

1. 获取计划关联的 BOM ID
2. 通过 `processFlowMapper.getProcessFlowIdList(bomId)` 获取该 BOM 下所有工艺流程
3. 遍历每条工艺流程：
   - 通过 `lineMapper.getAvailableLineNoByFlowId(flowId)` 查找空闲产线
   - 若无空闲产线，跳过该工艺流程
   - 若有空闲产线，生成订单编号 `{planNo}-{lineNo}`
4. 创建 ProductionOrder：
   - `orderNo = planNo + "-" + lineNo`
   - `orderName = planName + "-" + lineNo`
   - `quantity = planNum`
   - 时间继承计划时间
   - 初始状态为 CREATED

#### 9.2.2 暂停联动（PAUSE）

计划暂停时，级联暂停所有 RUNNING 状态的订单，并递归暂停每个订单下的所有 RUNNING 工单：

```
Plan PAUSE
  ├── 查询计划下所有 RUNNING 状态的 Order
  ├── 对每个 Order:
  │     ├── 查询该 Order 下所有 RUNNING 的 WorkOrder
  │     ├── 将每个 WorkOrder 状态更新为 PAUSED，记录审计（WORK_ORDER 类型）
  │     └── 将 Order 状态更新为 PAUSED，记录审计（ORDER 类型）
  └── 完成
```

> **实现细节**: 使用直接 DB 更新方式（`updateWorkOrderStatus` / `updateOrderStatus`），避免通过 Order 服务层逐订单触发 `syncPlanStatusFromOrders` 造成状态回写。

#### 9.2.3 恢复联动（RESUME）

计划恢复时，级联恢复所有 PAUSED 状态的订单及其工单：

```
Plan RESUME
  ├── 查询计划下所有 PAUSED 状态的 Order
  ├── 对每个 Order:
  │     ├── 查询该 Order 下所有 PAUSED 的 WorkOrder
  │     ├── 将每个 WorkOrder 状态更新为 RUNNING，记录审计（WORK_ORDER 类型）
  │     └── 将 Order 状态更新为 RUNNING，记录审计（ORDER 类型）
  └── 完成
```

#### 9.2.4 取消发布联动（CANCEL_PUBLISH）

计划取消发布时，级联作废所有非终态的订单及其工单：

```
Plan CANCEL_PUBLISH
  ├── 查询计划下所有 Order
  ├── 过滤：仅处理状态 ≠ COMPLETED 且 ≠ TERMINATED 的 Order
  ├── 对每个符合条件的 Order:
  │     ├── 查询该 Order 下所有 WorkOrder
  │     ├── 对每个非终态（≠ COMPLETED, ≠ TERMINATED）的 WorkOrder:
  │     │     ├── 状态 → TERMINATED，审计使用 TERMINATE 动作
  │     │     └── 记录审计（WORK_ORDER 类型）
  │     ├── 将 Order 状态 → TERMINATED
  │     └── 记录审计（ORDER 类型，审计动作使用 TERMINATE）
  └── 完成
```

#### 9.2.5 作废联动（TERMINATE）

计划作废时，级联终止所有非终态的订单及其工单：

```
Plan TERMINATE
  ├── 前置校验：计划下无 RUNNING 状态的 Order（在 handle() 第5步已校验）
  ├── 查询计划下所有 Order
  ├── 过滤：仅处理状态 ≠ COMPLETED 且 ≠ TERMINATED 的 Order
  ├── 对每个符合条件的 Order:
  │     ├── 查询该 Order 下所有 WorkOrder
  │     ├── 对每个非终态的 WorkOrder:
  │     │     ├── 状态 → TERMINATED
  │     │     └── 记录审计（WORK_ORDER 类型）
  │     ├── 将 Order 状态 → TERMINATED
  │     └── 记录审计（ORDER 类型）
  └── 完成
```

### 9.3 联动上传规则（Order → Plan）

订单状态变更后，通过 `orderStateServiceImpl.handleLinkage()` 调用 `planStateServiceImpl.syncPlanStatusFromOrders()` 自动同步计划状态：

| 订单聚合状态 | 计划状态变化 | 额外操作 |
|-------------|------------|---------|
| 任一订单 RUNNING | 计划 → RUNNING | — |
| **所有已执行订单**（排除 CREATED/RELEASED）处于 PAUSED/COMPLETED/TERMINATED，且至少一个 PAUSED，且无 RUNNING | 计划 → PAUSED（仅当原状态为 RUNNING 时） | — |
| **所有订单**处于 COMPLETED 或 TERMINATED，且至少一个 COMPLETED | 计划 → COMPLETED | **仅汇总 COMPLETED 订单的 `quantityProduced`**（TERMINATED 订单不计入），调用 `planMapper.updatePlanCompletedNum()` |

**关键设计语义（v1.2 修正）**:
- **PAUSED 判定**：仅对"已执行"订单（状态≠CREATED 且≠RELEASED）进行判定，避免未发布的草稿订单阻止计划进入暂停
- **COMPLETED 判定**：将 TERMINATED 视为合法终态，存在作废订单时不影响剩余订单的正常完成判定。`hasCompleted` 保障至少一个订单正常完成，避免全部 TERMINATED 时误触发 COMPLETED

> **注意**: `syncPlanStatusFromOrders` 的调用链为 `WorkOrder.handleLinkage()` → `orderMapper.updateOrderStatus()` → `planStateService.syncPlanStatusFromOrders()`。当 Plan 层主动 PAUSE/RESUME/CANCEL_PUBLISH/TERMINATE 时，由于使用直接 DB 更新 Order 状态，不会递归触发 `syncPlanStatusFromOrders`，避免了循环回写。

### 9.4 作废（TERMINATE）约束

- 仅 `RELEASED` 状态可作废
- 作废前需校验：计划下不存在 `RUNNING` 状态的订单
- 作废为终态，不可逆
- 需"生产主管"角色权限

### 9.5 权限策略

计划模块通过 `planPermissionPolicy` 在**服务层**实施权限控制（非 `@RequirePermission` 注解方式）：

| 动作 | 所需角色 | 说明 |
|------|---------|------|
| PUBLISH | 生产主管 | 人工决策型，冻结计划并下发订单 |
| CANCEL_PUBLISH | 生产主管 | 回退计划到草稿态 |
| PAUSE | 生产主管 | 中断所有订单执行 |
| RESUME | 生产主管 | 恢复计划执行 |
| TERMINATE | 生产主管 | 终止计划 |
| START_WORK | — | 计划层禁止，由订单层联动驱动 |
| FINISH_WORK | — | 计划层禁止，由订单层联动驱动 |

---

## 附录 A: 与订单模块的差异对比

| 维度 | Plan（计划） | Order（订单） |
|------|-------------|--------------|
| PUBLISH 权限 | 生产主管手动 | 系统联动自动 |
| START_WORK | ❌ 不适用 | ✅ 工单事实驱动 |
| FINISH_WORK | ❌ 不适用 | ✅ 工单事实驱动 |
| PAUSE 权限 | 生产主管 | 车间主任/生产主管 |
| RESUME 权限 | 生产主管 | 车间主任/生产主管 |
| TERMINATE 权限 | 生产主管 | 车间主任/生产主管 |
| 发布生成对象 | 生产订单(Order) | 工单(WorkOrder) |
| 状态聚合来源 | 订单(Order) | 工单(WorkOrder) |
| 修改约束（RELEASED） | planNum/时间/priority/remark | quantity/时间/remark |
| 修改约束（PAUSED） | 不允许修改 | 仅备注可修改 |
| 删除约束 | 仅 CREATED | 仅 CREATED |

---

## 附录 B: 核心类与文件对照

| 类名 | 文件路径 | 职责 |
|------|---------|------|
| planController | `smart-workshop-server/.../controller/planController.java` | REST 控制器，5 个端点，userId 从 JWT Token 解析 |
| planService | `smart-workshop-server/.../service/planService.java` | 计划 CRUD 服务接口 |
| planServiceImpl | `smart-workshop-server/.../service/serviceImpl/planServiceImpl.java` | 计划 CRUD 实现，含状态感知修改/删除 |
| planStateService | `smart-workshop-server/.../service/planStateService.java` | 计划状态服务接口，`handleLinkage(Plan, ActionEnum, Integer userId)` |
| planStateServiceImpl | `smart-workshop-server/.../service/serviceImpl/planStateServiceImpl.java` | 状态处理 + 全联动（下发/级联暂停/恢复/作废/取消发布）+ 上行聚合 |
| planStateMachine | `smart-workshop-production/.../stateDomain/planStateMachine.java` | 计划状态迁移规则 |
| planPermissionPolicy | `smart-workshop-server/.../plicy/planPermissionPolicy.java` | 计划操作权限策略 |
| GatePolicy | `smart-workshop-server/.../plicy/GatePolicy.java` | 发布门禁校验（工艺/产线/人员），含 `check()` 和 `checkOrder()` 两个重载 |
| Plan | `smart-workshop-pojo/.../entity/Plan.java` | 计划实体 |
| planMapper | `smart-workshop-server/.../mapper/planMapper.java` | 计划数据访问，含 `updatePlanStatus` / `updatePlanCompletedNum` |
| planMapper.xml | `smart-workshop-server/.../resources/com/xtax/mapper/planMapper.xml` | 新增/修改 SQL（MyBatis 动态 SQL） |
| workOrderMapper | `smart-workshop-server/.../mapper/workOrderMapper.java` | 工单数据访问（planStateServiceImpl 级联联动时使用） |

---

> **文档维护**: 本接口文档应与代码同步更新。状态流转规则变更时，需同步更新本文档和 `planStateMachine` 状态机配置。
