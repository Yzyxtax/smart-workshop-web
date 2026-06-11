# MES 订单管理模块 API 接口文档

> **版本**: v1.2  
> **基础路径**: `http://{host}:{port}/order`  
> **认证方式**: JWT Token（`Authorization: Bearer <token>` 或 `token` 请求头）  
> **日期**: 2026-06-10  
> **变更**: v1.2 — 订单级联方法补全工单审计记录（Fix 13）；订单→工单 4 条级联路径审计全覆盖

---

## 目录

1. [通用说明](#1-通用说明)
2. [API 概览](#2-api-概览)
3. [CRUD 接口](#3-crud-接口)
   - [3.1 查询所有订单](#31-查询所有订单)
   - [3.2 按订单编号查询](#32-按订单编号查询)
   - [3.3 按计划编号查询订单列表](#33-按计划编号查询订单列表)
   - [3.4 新增订单](#34-新增订单)
   - [3.5 修改订单](#35-修改订单)
   - [3.6 删除订单](#36-删除订单)
4. [状态变更接口](#4-状态变更接口)
   - [4.1 统一状态动作接口](#41-统一状态动作接口)
   - [4.2 状态-动作矩阵](#42-状态-动作矩阵)
5. [联动接口](#5-联动接口)
   - [5.1 查询订单下的工单](#51-查询订单下的工单)
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
| `GET` | `/order` | 查询所有订单 | 登录用户 |
| `GET` | `/order/{orderNo}` | 按订单编号查询 | 登录用户 |
| `GET` | `/order/plan/{planNo}` | 按计划查询订单列表 | 登录用户 |
| `POST` | `/order` | 新增订单 | 车间主任/生产主管 |
| `PUT` | `/order/{orderNo}` | 修改订单 | 车间主任/生产主管 |
| `DELETE` | `/order/{orderNo}` | 删除订单 | 车间主任/生产主管 |
| `POST` | `/order/{orderNo}/actions/{action}` | 执行状态动作（仅 PAUSE/RESUME/TERMINATE 可用户调用） | 见状态-权限矩阵 |
| `GET` | `/order/{orderNo}/workOrders` | 查询订单下的工单 | 登录用户 |

> **注意**: 原 `GET /order/{planNo}` 路径与 `GET /order/{orderNo}` 冲突，已调整为：
> - `GET /order/plan/{planNo}` — 按计划编号查询
> - `GET /order/{orderNo}` — 按订单编号查询

---

## 3. CRUD 接口

### 3.1 查询所有订单

**请求**

```
GET /order
```

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
      "orderName": "车载摄像头模组-LINE-A01",
      "quantity": 1000,
      "quantityProduced": 350,
      "qualifiedProducts": 340,
      "defectiveProducts": 10,
      "status": "RUNNING",
      "actualStartTime": "2026-06-08 08:30:00",
      "actualEndTime": null,
      "startTime": "2026-06-08 00:00:00",
      "endTime": "2026-06-30 00:00:00",
      "createTime": "2026-06-07 10:00:00",
      "updateTime": "2026-06-08 08:30:00"
    }
  ]
}
```

---

### 3.2 按订单编号查询

**请求**

```
GET /order/{orderNo}
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderNo | String | 是 | 订单编号 |

**响应示例**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "orderNo": "PLAN-20260608-001-LINE-A01",
    "planNo": "PLAN-20260608-001",
    "lineNo": "LINE-A01",
    "orderName": "车载摄像头模组-LINE-A01",
    "quantity": 1000,
    "quantityProduced": 350,
    "qualifiedProducts": 340,
    "defectiveProducts": 10,
    "status": "RUNNING",
    "actualStartTime": "2026-06-08 08:30:00",
    "actualEndTime": null,
    "startTime": "2026-06-08 00:00:00",
    "endTime": "2026-06-30 00:00:00",
    "createTime": "2026-06-07 10:00:00",
    "updateTime": "2026-06-08 08:30:00"
  }
}
```

**错误响应**

```json
{
  "code": 400,
  "message": "未找到编号为 PLAN-20260608-001-LINE-A01 的生产订单",
  "data": null
}
```

---

### 3.3 按计划编号查询订单列表

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
      "orderName": "车载摄像头模组-LINE-A01",
      "quantity": 1000,
      "quantityProduced": 350,
      "qualifiedProducts": 340,
      "defectiveProducts": 10,
      "status": "RUNNING"
    },
    {
      "orderNo": "PLAN-20260608-001-LINE-A02",
      "planNo": "PLAN-20260608-001",
      "lineNo": "LINE-A02",
      "orderName": "车载摄像头模组-LINE-A02",
      "quantity": 500,
      "quantityProduced": 0,
      "qualifiedProducts": 0,
      "defectiveProducts": 0,
      "status": "RELEASED"
    }
  ]
}
```

---

### 3.4 新增订单

> 创建独立的生产订单（非由计划联动生成）。  
> 订单初始状态为 `CREATED`。

**请求**

```
POST /order
Content-Type: application/json
```

**请求体**

```json
{
  "planNo": "PLAN-20260608-001",
  "lineNo": "LINE-A03",
  "orderName": "车载摄像头模组-LINE-A03",
  "quantity": 800,
  "startTime": "2026-06-10 00:00:00",
  "endTime": "2026-07-15 00:00:00",
  "remark": "紧急追加订单"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| planNo | String | 是 | 所属计划编号 |
| lineNo | String | 是 | 产线编号 |
| orderName | String | 是 | 订单名称 |
| quantity | Integer | 是 | 计划生产数量 |
| startTime | String | 否 | 计划开始时间 (yyyy-MM-dd HH:mm:ss) |
| endTime | String | 否 | 计划结束时间 (yyyy-MM-dd HH:mm:ss) |
| remark | String | 否 | 备注 |

**响应示例**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "orderNo": "PLAN-20260608-001-LINE-A03",
    "planNo": "PLAN-20260608-001",
    "lineNo": "LINE-A03",
    "orderName": "车载摄像头模组-LINE-A03",
    "quantity": 800,
    "status": "CREATED",
    "createTime": "2026-06-08 14:30:00"
  }
}
```

**业务规则**:
- 订单编号自动生成，格式为 `{planNo}-{lineNo}`
- 同一计划+产线组合不可重复创建订单
- 初始状态默认为 `CREATED`
- 初始 `quantityProduced`、`qualifiedProducts`、`defectiveProducts` 均为 0

---

### 3.5 修改订单

> 根据订单当前状态，可修改的字段范围不同。

**请求**

```
PUT /order/{orderNo}
Content-Type: application/json
```

**请求体**

```json
{
  "orderName": "车载摄像头模组-LINE-A03-改",
  "quantity": 1200,
  "startTime": "2026-06-12 00:00:00",
  "endTime": "2026-07-20 00:00:00",
  "remark": "数量调整"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderName | String | 否 | 订单名称（仅 CREATED 状态可改） |
| lineNo | String | 否 | 产线编号（仅 CREATED 状态可改） |
| planNo | String | 否 | 计划编号（仅 CREATED 状态可改） |
| quantity | Integer | 否 | 计划数量 |
| startTime | String | 否 | 计划开始时间 |
| endTime | String | 否 | 计划结束时间 |
| remark | String | 否 | 备注 |

**状态感知更新规则**:

| 状态 | orderName | lineNo/planNo | quantity | 时间 | remark |
|------|:---:|:---:|:---:|:---:|:---:|
| CREATED | ✅ | ✅ | ✅ | ✅ | ✅ |
| RELEASED | ❌ | ❌ | ✅ | ✅ | ✅ |
| RUNNING | ❌ | ❌ | ❌ | ❌ | ❌ |
| PAUSED | ❌ | ❌ | ❌ | ❌ | ✅ |
| COMPLETED | ❌ | ❌ | ❌ | ❌ | ❌ |
| TERMINATED | ❌ | ❌ | ❌ | ❌ | ❌ |

**错误响应（状态不允许修改）**

```json
{
  "code": 400,
  "message": "当前状态 [RUNNING] 不允许修改订单",
  "data": null
}
```

---

### 3.6 删除订单

> 仅 `CREATED` 状态的订单允许删除。

**请求**

```
DELETE /order/{orderNo}
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderNo | String | 是 | 订单编号 |

**响应示例**

```json
{
  "code": 200,
  "message": "订单 [PLAN-20260608-001-LINE-A03] 删除成功",
  "data": null
}
```

**错误响应（状态不允许删除）**

```json
{
  "code": 400,
  "message": "当前状态 [RELEASED] 不允许删除，仅创建状态的订单可删除",
  "data": null
}
```

---

## 4. 状态变更接口

### 4.1 统一状态动作接口

> 所有状态变更操作通过统一入口处理，遵循 **权限校验 → 状态机校验 → 门禁校验 → 持久化 → 审计 → 联动** 管道。

**请求**

```
POST /order/{orderNo}/actions/{action}
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderNo | String | 是 | 订单编号 |
| action | String | 是 | 动作枚举值，见下表 |

**action 可选值**:

| 值 | 中文 | 类型 | 用户可调用 | 说明 |
|----|------|------|:---:|------|
| PUBLISH | 发布 | 系统触发 | ❌ | 由计划发布联动，校验产线/工艺/人员；直接调用 API 返回 400 |
| CANCEL_PUBLISH | 取消发布 | 系统触发 | ❌ | 回退到 CREATED，释放产线锁，级联作废工单；直接调用 API 返回 400 |
| START_WORK | 开始作业 | 事实驱动 | ❌ | 由工单层联动触发，首个工单开始执行；直接调用 API 返回 400 |
| PAUSE | 暂停 | 人工干预 | ✅ | 中断执行，需车间主任/生产主管权限，级联暂停 RUNNING 工单 |
| RESUME | 恢复 | 人工干预 | ✅ | 恢复中断的执行，需车间主任/生产主管权限，级联恢复 PAUSED 工单 |
| FINISH_WORK | 完成作业 | 事实驱动 | ❌ | 由工单层联动触发，所有工单完成；直接调用 API 返回 400 |
| TERMINATE | 作废 | 人工干预 | ✅ | 终止订单，需车间主任/生产主管权限，级联作废所有非终态工单 |

> **重要**: 控制器内置 `USER_ALLOWED_ACTIONS` 白名单机制，仅 `PAUSE`、`RESUME`、`TERMINATE` 三个 Action 可通过 API 直接调用。`PUBLISH`、`CANCEL_PUBLISH`、`START_WORK`、`FINISH_WORK` 由系统内部联动触发，直接调用 API 将返回 400 错误。

**成功响应**

```json
{
  "code": 200,
  "message": "订单 [PLAN-20260608-001-LINE-A01] 执行动作 [暂停] 成功",
  "data": null
}
```

**系统专属 Action 拒绝**

```json
{
  "code": 400,
  "message": "操作 [发布] 仅限系统内部触发，不支持直接 API 调用",
  "data": null
}
```

**权限不足**

```json
{
  "code": 403,
  "message": "权限不足: 操作员无权限执行此操作",
  "data": null
}
```

**状态机拒绝**

```json
{
  "code": 400,
  "message": "操作不符合规则: Order 状态 [COMPLETED] 不允许执行动作 [PAUSE]",
  "data": null
}
```

**门禁校验失败（PUBLISH 时）**

```json
{
  "code": 400,
  "message": "发布校验失败: 产线 LINE-A01 无可用工序人员",
  "data": null
}
```

**TERMINATE 业务校验失败**

```json
{
  "code": 400,
  "message": "订单下存在执行中的工单，不允许作废",
  "data": null
}
```

---

### 4.2 状态-动作矩阵

| 当前状态 ↓ / 动作 → | PUBLISH | CANCEL_PUBLISH | START_WORK | PAUSE | RESUME | FINISH_WORK | TERMINATE |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **CREATED** | ✅ 系统 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **RELEASED** | ❌ | ✅ 系统 | ✅ 工单事实 | ❌ | ❌ | ❌ | ✅ 主管 |
| **RUNNING** | ❌ | ❌ | ❌ | ✅ 主管 | ❌ | ✅ 工单事实 | ❌ |
| **PAUSED** | ❌ | ❌ | ❌ | ❌ | ✅ 主管 | ❌ | ❌ |
| **COMPLETED** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **TERMINATED** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**图例**:
- ✅ = 允许
- ❌ = 不允许
- **系统** = 由计划发布联动系统自动触发，不校验用户角色（API 层面已拦截，不可直接调用）
- **工单事实** = 由工单层状态变更联动触发，不校验用户角色（API 层面已拦截，不可直接调用）
- **主管** = 需"车间主任"或"生产主管"角色，人工可直接调用 API

**级联联动说明**（v1.1 新增）:
- **PAUSE**: 订单暂停时，自动级联暂停其下所有 RUNNING 状态的工单
- **RESUME**: 订单恢复时，自动级联恢复其下所有 PAUSED 状态的工单
- **TERMINATE**: 订单作废时，自动级联作废其下所有非终态的工单
- **CANCEL_PUBLISH**: 取消发布时，作废其下所有非终态工单（含 RELEASED/PAUSED，不再仅限于 CREATED）

---

## 5. 联动接口

### 5.1 查询订单下的工单

**请求**

```
GET /order/{orderNo}/workOrders
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderNo | String | 是 | 订单编号 |

**响应示例**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "workOrderNo": "WO-20260608-001",
      "orderNo": "PLAN-20260608-001-LINE-A01",
      "processId": 10,
      "userId": 1001,
      "isCritical": true,
      "plannedQuantity": 500,
      "actualQuantity": 200,
      "scrapQuantity": 5,
      "status": "RUNNING",
      "startTime": "2026-06-08 00:00:00",
      "endTime": "2026-06-15 00:00:00",
      "actualStartTime": "2026-06-08 08:30:00",
      "actualEndTime": null,
      "createTime": "2026-06-07 14:00:00",
      "updateTime": "2026-06-08 08:30:00"
    }
  ]
}
```

---

## 6. 数据模型

### 6.1 ProductionOrder（生产订单实体）

| 字段 | 类型 | 说明 |
|------|------|------|
| orderNo | String | 订单编号，主键，格式 `{planNo}-{lineNo}` |
| planNo | String | 所属计划编号 |
| lineNo | String | 绑定产线编号 |
| orderName | String | 订单名称 |
| quantity | Integer | 计划生产数量 |
| quantityProduced | Integer | 已生产数量（工单实际数量汇总） |
| qualifiedProducts | Integer | 合格品数 |
| defectiveProducts | Integer | 不良品数 |
| status | StateEnum | 当前状态 |
| remark | String | 备注 |
| actualStartTime | LocalDateTime | 实际开始时间（首个工单作业开始） |
| actualEndTime | LocalDateTime | 实际结束时间（所有工单完成） |
| startTime | LocalDateTime | 计划开始时间 |
| endTime | LocalDateTime | 计划结束时间 |
| createTime | LocalDateTime | 创建时间 |
| updateTime | LocalDateTime | 更新时间 |

### 6.2 OrderDTO（新增订单请求体）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| planNo | String | 是 | 所属计划编号 |
| lineNo | String | 是 | 产线编号 |
| orderName | String | 是 | 订单名称 |
| quantity | Integer | 是 | 计划生产数量 |
| startTime | String | 否 | 计划开始时间 |
| endTime | String | 否 | 计划结束时间 |
| remark | String | 否 | 备注 |

### 6.3 OrderUpdateDTO（修改订单请求体）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderName | String | 否 | 订单名称（CREATED 可改） |
| lineNo | String | 否 | 产线编号（CREATED 可改） |
| planNo | String | 否 | 计划编号（CREATED 可改） |
| quantity | Integer | 否 | 计划数量 |
| startTime | String | 否 | 计划开始时间 |
| endTime | String | 否 | 计划结束时间 |
| remark | String | 否 | 备注 |

### 6.4 WorkOrder（工单实体）

| 字段 | 类型 | 说明 |
|------|------|------|
| workOrderNo | String | 工单编号，主键 |
| orderNo | String | 所属订单编号 |
| processId | Integer | 工序 ID |
| userId | Integer | 派工人员 ID |
| isCritical | Boolean | 是否关键工单（影响订单状态聚合） |
| plannedQuantity | Integer | 计划数量 |
| actualQuantity | Integer | 实际完成数量 |
| scrapQuantity | Integer | 报废数量 |
| status | StateEnum | 当前状态 |
| startTime | LocalDateTime | 计划开始时间 |
| endTime | LocalDateTime | 计划结束时间 |
| actualStartTime | LocalDateTime | 实际开始时间 |
| actualEndTime | LocalDateTime | 实际结束时间 |
| remark | String | 备注 |
| createTime | LocalDateTime | 创建时间 |
| updateTime | LocalDateTime | 更新时间 |

---

## 7. 错误码说明

| HTTP 状态 | code | 场景 | 说明 |
|-----------|------|------|------|
| 200 | 200 | 正常 | 操作成功 |
| 400 | 400 | 参数错误 | 请求参数不符合要求 |
| 400 | 400 | 系统专属 Action | PUBLISH/CANCEL_PUBLISH/START_WORK/FINISH_WORK 不可直接调用 API |
| 400 | 400 | 状态机拒绝 | 当前状态不允许该动作 |
| 400 | 400 | 门禁失败 | 发布校验不通过 |
| 400 | 400 | 业务校验失败 | 如 TERMINATE 时仍有执行中工单 |
| 400 | 400 | 状态不允许操作 | 修改/删除时状态不满足条件 |
| 403 | 403 | 权限不足 | 用户无对应角色权限 |
| 404 | 404 | 资源不存在 | 订单/计划/产线不存在 |
| 500 | 500 | 系统异常 | 服务器内部错误 |

---

## 8. 状态感知约束

### 8.1 修改约束

```
CREATED ─── 全部字段可修改
RELEASED ── 仅 quantity、时间、备注可修改；orderName/lineNo/planNo 保持原值
RUNNING ─── 不允许修改
PAUSED ──── 仅备注可修改
COMPLETED ─ 不允许修改（终态）
TERMINATED─ 不允许修改（终态）
```

### 8.2 删除约束

| 状态 | 允许删除 |
|------|:---:|
| CREATED | ✅ |
| 其他所有状态 | ❌ |

**设计原则**: 一旦产生不可逆执行事实（已发布给产线/已开始生产），禁止删除，只允许作废。

---

## 9. 业务规则

### 9.1 发布门禁（PUBLISH Gate）

订单从 `CREATED` 发布到 `RELEASED` 时，需通过三道门禁：

| 门禁 | 校验内容 | 失败提示 |
|------|---------|----------|
| **产线可用性** | 绑定产线是否存在且为空闲状态 | "产线 LINE-A01 不可用或已被占用" |
| **工艺完整性** | 产线是否绑定启用的工艺流程 | "产线 LINE-A01 未绑定有效工艺流程" |
| **人员可执行性** | 工序中每个步骤至少有一名具备技能的可用员工 | "工序[焊接]无可用员工" |

校验通过后：锁定产线（软锁），状态 CREATED → RELEASED，并自动生成工单并发布。

### 9.2 状态联动规则

#### 向上联动（工单 → 订单）

订单状态由下属工单的状态聚合决定：

| 工单状态 | 订单状态变化 |
|---------|------------|
| 任一关键工单 RUNNING | 订单 → RUNNING |
| 任一关键工单 PAUSED（且无 RUNNING） | 订单 → PAUSED |
| 所有工单 COMPLETED | 订单 → COMPLETED |

#### 向上联动（订单 → 计划）

订单状态变更后，自动触发计划状态同步（调用 `syncPlanStatusFromOrders`）：

| 订单状态 | 计划状态变化 |
|---------|------------|
| 任一订单 RUNNING | 计划 → RUNNING |
| 所有订单 PAUSED/COMPLETED（且无 RUNNING） | 计划 → PAUSED |
| 所有订单 COMPLETED | 计划 → COMPLETED |

#### 向下联动（订单 → 工单）

订单状态变更时，自动级联处理下属工单，**所有级联操作均包含工单审计记录**（v1.2 补全）：

| 订单动作 | 工单级联处理 | 工单审计 |
|---------|------------|:---:|
| PUBLISH | 按产线→工艺流程→工序→人员自动生成工单，首个工单标记为关键工单，并自动发布 | ✅ 通过 workOrderStateService |
| CANCEL_PUBLISH | 作废所有非终态工单（含 CREATED / RELEASED / PAUSED） | ✅ auditService.record("WORK_ORDER") |
| TERMINATE | 作废所有非终态工单（含 CREATED / RELEASED / PAUSED） | ✅ auditService.record("WORK_ORDER") |
| PAUSE | 暂停所有 RUNNING 状态的工单 | ✅ auditService.record("WORK_ORDER") |
| RESUME | 恢复所有 PAUSED 状态的工单 | ✅ auditService.record("WORK_ORDER") |

### 9.3 作废（TERMINATE）约束

- 仅 `RELEASED` 状态可作废
- 作废前需校验：订单下不存在 RUNNING 状态的工单
- 作废后释放产线资源
- 作废为终态，不可逆

---

## 附录 A: 状态生命周期示意

```
计划发布联动
     │
     ▼
┌──────────┐   PUBLISH    ┌──────────┐
│ CREATED  │ ───────────→ │ RELEASED │ ──TERMINATE──→ ┌────────────┐
│ (待排产) │ ←─────────── │ (已排产) │               │ TERMINATED │
└──────────┘ CANCEL_      └────┬─────┘               │  (作废)    │
              PUBLISH          │                      └────────────┘
                               │ 首个工单开始
                               ▼
                        ┌──────────┐
                        │ RUNNING  │ ←────RESUME──── ┌──────────┐
                        │ (执行中) │ ────PAUSE──────→ │ PAUSED   │
                        └────┬─────┘                 │ (已中断)  │
                             │                       └──────────┘
                             │ 所有工单完成
                             ▼
                        ┌──────────┐
                        │COMPLETED │
                        │ (完成)   │
                        └──────────┘
```

---

## 附录 B: 与计划模块的差异对比

| 维度 | Plan（计划） | Order（订单） |
|------|-------------|--------------|
| PUBLISH 权限 | 生产主管手动 | 系统联动自动（API 已拦截） |
| CANCEL_PUBLISH 权限 | 生产主管手动 | 系统联动自动（API 已拦截） |
| START_WORK | ❌ 不适用 | ✅ 工单事实驱动（API 已拦截） |
| FINISH_WORK | ❌ 不适用 | ✅ 工单事实驱动（API 已拦截） |
| PAUSE 权限 | 生产主管 | 车间主任/生产主管 |
| RESUME 权限 | 生产主管 | 车间主任/生产主管 |
| TERMINATE 权限 | 生产经理 | 车间主任/生产主管 |
| PAUSE 向下联动 | 暂停订单 + 工单 | 暂停工单 |
| RESUME 向下联动 | 恢复订单 + 工单 | 恢复工单 |
| TERMINATE 向下联动 | 作废订单 + 工单 | 作废工单 |
| 发布生成对象 | 生产订单(Order) | 工单(WorkOrder) |
| 状态聚合来源 | 订单(Order) | 工单(WorkOrder) |

---

> **文档维护**: 本接口文档应与代码同步更新。状态流转规则变更时，需同步更新本文档和 `orderStateMachine` 状态机配置。
> 
> **v1.2 更新记录** (2026-06-10):
> - 订单 4 个级联方法（pauseWorkOrders/resumeWorkOrders/cancelWorkOrders/terminateWorkOrders）补全工单审计记录 `auditService.record("WORK_ORDER", ...)`
> - 向下联动规则表新增"工单审计"列，5 条级联路径审计全覆盖
>
> **v1.1 更新记录** (2026-06-10):
> - 控制器增加 `USER_ALLOWED_ACTIONS` 白名单（PAUSE/RESUME/TERMINATE），系统专属 Action 直接调用 API 返回 400
> - 新增 TERMINATE/PAUSE/RESUME 向下级联工单联动逻辑
> - CANCEL_PUBLISH 工单处理范围扩展至所有非终态（不再仅限于 CREATED）
> - ProductionOrder 实体新增 `remark` 字段
> - WorkOrder 实体完善时间字段和备注字段
> - 状态联动规则表格化
