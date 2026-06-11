# MES 工单管理模块 API 接口文档

> **版本**: v1.2  
> **基础路径**: `http://{host}:{port}/workOrder`  
> **认证方式**: JWT Token（`Authorization: Bearer <token>` 或 `token` 请求头）  
> **日期**: 2026-06-10  
> **变更**: v1.2 — Order 层级联操作补全工单审计记录，所有从 Order 触发的工单状态变更均可追溯

---

## 目录

1. [通用说明](#1-通用说明)
2. [API 概览](#2-api-概览)
3. [CRUD 接口](#3-crud-接口)
   - [3.1 查询所有工单](#31-查询所有工单)
   - [3.2 按工单编号查询](#32-按工单编号查询)
   - [3.3 按订单编号查询工单列表](#33-按订单编号查询工单列表)
   - [3.4 按人员查询工单列表](#34-按人员查询工单列表)
   - [3.5 按工序查询工单列表](#35-按工序查询工单列表)
   - [3.6 新增工单](#36-新增工单)
   - [3.7 修改工单](#37-修改工单)
   - [3.8 删除工单](#38-删除工单)
4. [状态变更接口](#4-状态变更接口)
   - [4.1 统一状态动作接口](#41-统一状态动作接口)
   - [4.2 状态-动作矩阵](#42-状态-动作矩阵)
5. [数据模型](#5-数据模型)
6. [错误码说明](#6-错误码说明)
7. [状态感知约束](#7-状态感知约束)
8. [业务规则](#8-业务规则)

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
| `GET` | `/workOrder` | 查询所有工单 | 登录用户 |
| `GET` | `/workOrder/{workOrderNo}` | 按工单编号查询 | 登录用户 |
| `GET` | `/workOrder/order/{orderNo}` | 按订单查询工单列表 | 登录用户 |
| `GET` | `/workOrder/user/{userId}` | 按人员查询工单列表 | 登录用户 |
| `GET` | `/workOrder/process/{processId}` | 按工序查询工单列表 | 登录用户 |
| `POST` | `/workOrder` | 新增工单 | 车间主任/生产主管 |
| `PUT` | `/workOrder/{workOrderNo}` | 修改工单 | 见状态感知规则 |
| `DELETE` | `/workOrder/{workOrderNo}` | 删除工单 | 车间主任/生产主管 |
| `POST` | `/workOrder/{workOrderNo}/actions/{action}` | 执行状态动作 | 见状态-权限矩阵（仅 START_WORK / FINISH_WORK / PAUSE / RESUME / TERMINATE 可外部调用） |

> **注意**: 路径中带固定前缀的查询接口（`/order/`、`/user/`、`/process/`）必须在 `/{workOrderNo}` 路径变量之前声明，避免被路径变量捕获。

---

## 3. CRUD 接口

### 3.1 查询所有工单

**请求**

```
GET /workOrder
```

**响应示例**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "workOrderNo": "PLAN-20260608-001-LINE-A01-10-1",
      "orderNo": "PLAN-20260608-001-LINE-A01",
      "processId": 10,
      "userId": 1001,
      "isCritical": true,
      "plannedQuantity": 1000,
      "actualQuantity": 350,
      "scrapQuantity": 5,
      "status": "RUNNING",
      "startTime": "2026-06-08 00:00:00",
      "endTime": "2026-06-30 00:00:00",
      "actualStartTime": "2026-06-08 08:30:00",
      "actualEndTime": null,
      "createTime": "2026-06-07 14:00:00",
      "updateTime": "2026-06-08 08:30:00"
    }
  ]
}
```

---

### 3.2 按工单编号查询

**请求**

```
GET /workOrder/{workOrderNo}
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| workOrderNo | String | 是 | 工单编号 |

**响应示例**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "workOrderNo": "PLAN-20260608-001-LINE-A01-10-1",
    "orderNo": "PLAN-20260608-001-LINE-A01",
    "processId": 10,
    "userId": 1001,
    "isCritical": true,
    "plannedQuantity": 1000,
    "actualQuantity": 350,
    "scrapQuantity": 5,
    "status": "RUNNING",
    "startTime": "2026-06-08 00:00:00",
    "endTime": "2026-06-30 00:00:00",
    "actualStartTime": "2026-06-08 08:30:00",
    "actualEndTime": null,
    "createTime": "2026-06-07 14:00:00",
    "updateTime": "2026-06-08 08:30:00"
  }
}
```

**错误响应**

```json
{
  "code": 400,
  "message": "未找到编号为 PLAN-20260608-001-LINE-A01-10-1 的工单",
  "data": null
}
```

---

### 3.3 按订单编号查询工单列表

**请求**

```
GET /workOrder/order/{orderNo}
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
      "workOrderNo": "PLAN-20260608-001-LINE-A01-10-1",
      "orderNo": "PLAN-20260608-001-LINE-A01",
      "processId": 10,
      "userId": 1001,
      "isCritical": true,
      "plannedQuantity": 1000,
      "actualQuantity": 350,
      "scrapQuantity": 5,
      "status": "RUNNING"
    },
    {
      "workOrderNo": "PLAN-20260608-001-LINE-A01-20-2",
      "orderNo": "PLAN-20260608-001-LINE-A01",
      "processId": 20,
      "userId": 1002,
      "isCritical": false,
      "plannedQuantity": 1000,
      "actualQuantity": 0,
      "scrapQuantity": 0,
      "status": "CREATED"
    }
  ]
}
```

---

### 3.4 按人员查询工单列表

> 根据派工人员 ID 查询该员工负责的所有工单。

**请求**

```
GET /workOrder/user/{userId}
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | Integer | 是 | 人员 ID |

**响应示例**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "workOrderNo": "PLAN-20260608-001-LINE-A01-10-1",
      "orderNo": "PLAN-20260608-001-LINE-A01",
      "processId": 10,
      "userId": 1001,
      "isCritical": true,
      "plannedQuantity": 1000,
      "actualQuantity": 350,
      "scrapQuantity": 5,
      "status": "RUNNING",
      "startTime": "2026-06-08 00:00:00",
      "endTime": "2026-06-30 00:00:00"
    },
    {
      "workOrderNo": "PLAN-20260610-002-LINE-B01-15-1",
      "orderNo": "PLAN-20260610-002-LINE-B01",
      "processId": 15,
      "userId": 1001,
      "isCritical": false,
      "plannedQuantity": 500,
      "actualQuantity": 0,
      "scrapQuantity": 0,
      "status": "RELEASED",
      "startTime": "2026-06-10 00:00:00",
      "endTime": "2026-06-20 00:00:00"
    }
  ]
}
```

**错误响应（人员不存在）**

```json
{
  "code": 400,
  "message": "未找到用户 ID 为 9999 的人员",
  "data": null
}
```

---

### 3.5 按工序查询工单列表

> 根据工序 ID 查询该工序下的所有工单。

**请求**

```
GET /workOrder/process/{processId}
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| processId | Integer | 是 | 工序 ID |

**响应示例**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "workOrderNo": "PLAN-20260608-001-LINE-A01-10-1",
      "orderNo": "PLAN-20260608-001-LINE-A01",
      "processId": 10,
      "userId": 1001,
      "isCritical": true,
      "plannedQuantity": 1000,
      "actualQuantity": 350,
      "scrapQuantity": 5,
      "status": "RUNNING",
      "startTime": "2026-06-08 00:00:00",
      "endTime": "2026-06-30 00:00:00"
    },
    {
      "workOrderNo": "PLAN-20260608-003-LINE-C01-10-1",
      "orderNo": "PLAN-20260608-003-LINE-C01",
      "processId": 10,
      "userId": 1005,
      "isCritical": true,
      "plannedQuantity": 300,
      "actualQuantity": 150,
      "scrapQuantity": 2,
      "status": "RUNNING",
      "startTime": "2026-06-09 00:00:00",
      "endTime": "2026-06-25 00:00:00"
    }
  ]
}
```

---

### 3.6 新增工单

> 手工创建工单（非由订单发布联动生成）。  
> 工单初始状态为 `CREATED`。

**请求**

```
POST /workOrder
Content-Type: application/json
```

**请求体**

```json
{
  "orderNo": "PLAN-20260608-001-LINE-A01",
  "processId": 10,
  "userId": 1003,
  "isCritical": false,
  "plannedQuantity": 500,
  "startTime": "2026-06-10 00:00:00",
  "endTime": "2026-06-20 00:00:00",
  "remark": "手工追加工单"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderNo | String | 是 | 所属订单编号 |
| processId | Integer | 是 | 工序 ID |
| userId | Integer | 是 | 派工人员 ID |
| isCritical | Boolean | 否 | 是否关键工单（默认 false），关键工单影响订单状态聚合 |
| plannedQuantity | Integer | 是 | 计划数量 |
| startTime | String | 否 | 计划开始时间 (yyyy-MM-dd HH:mm:ss) |
| endTime | String | 否 | 计划结束时间 (yyyy-MM-dd HH:mm:ss) |
| remark | String | 否 | 备注 |

**响应示例**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "workOrderNo": "PLAN-20260608-001-LINE-A01-10-3",
    "orderNo": "PLAN-20260608-001-LINE-A01",
    "processId": 10,
    "userId": 1003,
    "isCritical": false,
    "plannedQuantity": 500,
    "actualQuantity": 0,
    "scrapQuantity": 0,
    "status": "CREATED",
    "createTime": "2026-06-09 10:30:00"
  }
}
```

**业务规则**:
- 工单编号自动生成，格式为 `{orderNo}-{processId}-{seq}`
- `seq` 为同一订单+工序下的自增序号
- 同一订单+工序+人员组合不可重复创建
- 若订单下尚无任何工单且调用方未显式指定 `isCritical`，则首个工单自动标记为关键工单
- 初始状态默认为 `CREATED`
- 初始 `actualQuantity`、`scrapQuantity` 均为 0

---

### 3.7 修改工单

> 根据工单当前状态，可修改的字段范围不同。

**请求**

```
PUT /workOrder/{workOrderNo}
Content-Type: application/json
```

**请求体**

```json
{
  "userId": 1005,
  "plannedQuantity": 800,
  "startTime": "2026-06-12 00:00:00",
  "endTime": "2026-06-25 00:00:00",
  "remark": "调整派工人员和数量"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | Integer | 否 | 派工人员 ID（仅 CREATED 状态可改） |
| processId | Integer | 否 | 工序 ID（仅 CREATED 状态可改） |
| isCritical | Boolean | 否 | 是否关键工单（仅 CREATED 状态可改） |
| plannedQuantity | Integer | 否 | 计划数量 |
| actualQuantity | Integer | 否 | 实际完成数量（RUNNING 状态可上报） |
| scrapQuantity | Integer | 否 | 报废数量（RUNNING 状态可上报） |
| startTime | String | 否 | 计划开始时间 |
| endTime | String | 否 | 计划结束时间 |
| remark | String | 否 | 备注 |

**状态感知更新规则**:

| 状态 | userId/processId/isCritical | quantity | actualQuantity/scrapQuantity | 时间 | remark |
|------|:---:|:---:|:---:|:---:|:---:|
| CREATED | ✅ | ✅ | ❌ | ✅ | ✅ |
| RELEASED | ❌ | ✅ | ❌ | ✅ | ✅ |
| RUNNING | ❌ | ❌ | ✅ | ❌ | ✅ |
| PAUSED | ❌ | ❌ | ❌ | ❌ | ✅ |
| COMPLETED | ❌ | ❌ | ❌ | ❌ | ❌ |
| TERMINATED | ❌ | ❌ | ❌ | ❌ | ❌ |

> **说明**: RUNNING 状态下允许员工上报 `actualQuantity` 和 `scrapQuantity`，这是工单层特有的现场数据采集能力。

**错误响应（状态不允许修改）**

```json
{
  "code": 400,
  "message": "当前状态 [COMPLETED] 不允许修改工单",
  "data": null
}
```

---

### 3.8 删除工单

> 仅 `CREATED` 状态的工单允许删除。

**请求**

```
DELETE /workOrder/{workOrderNo}
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| workOrderNo | String | 是 | 工单编号 |

**响应示例**

```json
{
  "code": 200,
  "message": "工单 [PLAN-20260608-001-LINE-A01-10-3] 删除成功",
  "data": null
}
```

**错误响应（状态不允许删除）**

```json
{
  "code": 400,
  "message": "当前状态 [RELEASED] 不允许删除，仅创建状态的工单可删除",
  "data": null
}
```

---

## 4. 状态变更接口

### 4.1 统一状态动作接口

> 所有状态变更操作通过统一入口处理，遵循 **权限校验 → 状态机校验 → 持久化 → 审计 → 联动** 管道。

**请求**

```
POST /workOrder/{workOrderNo}/actions/{action}
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| workOrderNo | String | 是 | 工单编号 |
| action | String | 是 | 动作枚举值，见下表 |

**action 可选值**:

| 值 | 中文 | 类型 | API 可调用 | 说明 |
|----|------|------|:---:|------|
| PUBLISH | 发布 | 系统触发 | ❌ | 由订单发布联动，生成工单后自动发布，不支持直接 API 调用 |
| CANCEL_PUBLISH | 取消发布 | 系统触发 | ❌ | 回退到 CREATED，释放工单资源，不支持直接 API 调用 |
| START_WORK | 开始作业 | 员工操作 | ✅ | 员工确认开始作业，记录实际开始时间 |
| PAUSE | 暂停 | 员工/主管 | ✅ | 作业异常中断 |
| RESUME | 恢复执行 | 员工/主管 | ✅ | 从异常中恢复作业 |
| FINISH_WORK | 完成作业 | 员工操作 | ✅ | 员工确认作业完成，记录实际结束时间 |
| TERMINATE | 作废 | 主管操作 | ✅ | 作废工单，需车间主任/生产主管权限，仅 RELEASED/PAUSED 状态可执行 |

**成功响应**

```json
{
  "code": 200,
  "message": "工单 [PLAN-20260608-001-LINE-A01-10-1] 执行动作 [开始作业] 成功",
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
  "message": "操作不符合规则: WorkOrder 状态 [COMPLETED] 不允许执行动作 [PAUSE]",
  "data": null
}
```

**TERMINATE 业务校验失败**

```json
{
  "code": 400,
  "message": "工单当前状态 [RUNNING] 不允许作废，仅 RELEASED 或 PAUSED 状态可作废",
  "data": null
}
```

**系统专属 Action 拒绝（直接 API 调用 PUBLISH/CANCEL_PUBLISH）**

```json
{
  "code": 400,
  "message": "操作 [发布] 仅限系统内部触发，不支持直接 API 调用",
  "data": null
}
```

---

### 4.2 状态-动作矩阵

| 当前状态 ↓ / 动作 → | PUBLISH | CANCEL_PUBLISH | START_WORK | PAUSE | RESUME | FINISH_WORK | TERMINATE |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **CREATED** | ✅ 系统 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **RELEASED** | ❌ | ✅ 系统 | ✅ 员工 | ❌ | ❌ | ❌ | ✅ 主管 |
| **RUNNING** | ❌ | ❌ | ❌ | ✅ 员工/主管 | ❌ | ✅ 员工 | ❌ |
| **PAUSED** | ❌ | ❌ | ❌ | ❌ | ✅ 员工/主管 | ❌ | ✅ 主管 |
| **COMPLETED** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **TERMINATED** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**图例**:
- ✅ = 允许
- ❌ = 不允许
- **系统** = 由订单发布/取消发布联动系统自动触发，不校验用户角色
- **员工** = 需操作者归属本工单的派工人员
- **主管** = 需"车间主任"或"生产主管"角色

---

## 5. 数据模型

### 5.1 WorkOrder（工单实体）

| 字段 | 类型 | 说明 |
|------|------|------|
| workOrderNo | String | 工单编号，主键，格式 `{orderNo}-{processId}-{seq}` |
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
| actualStartTime | LocalDateTime | 实际开始时间（员工开始作业时锚定） |
| actualEndTime | LocalDateTime | 实际结束时间（员工确认完成时锚定） |
| remark | String | 备注 |
| createTime | LocalDateTime | 创建时间 |
| updateTime | LocalDateTime | 更新时间 |

### 5.2 WorkOrderDTO（新增工单请求体）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderNo | String | 是 | 所属订单编号 |
| processId | Integer | 是 | 工序 ID |
| userId | Integer | 是 | 派工人员 ID |
| isCritical | Boolean | 否 | 是否关键工单（默认 false） |
| plannedQuantity | Integer | 是 | 计划数量 |
| startTime | String | 否 | 计划开始时间 |
| endTime | String | 否 | 计划结束时间 |
| remark | String | 否 | 备注 |

### 5.3 WorkOrderUpdateDTO（修改工单请求体）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | Integer | 否 | 派工人员 ID（CREATED 可改） |
| processId | Integer | 否 | 工序 ID（CREATED 可改） |
| isCritical | Boolean | 否 | 是否关键工单（CREATED 可改） |
| plannedQuantity | Integer | 否 | 计划数量（CREATED/RELEASED 可改） |
| actualQuantity | Integer | 否 | 实际完成数量（RUNNING 可上报） |
| scrapQuantity | Integer | 否 | 报废数量（RUNNING 可上报） |
| startTime | String | 否 | 计划开始时间 |
| endTime | String | 否 | 计划结束时间 |
| remark | String | 否 | 备注 |

---

## 6. 错误码说明

| HTTP 状态 | code | 场景 | 说明 |
|-----------|------|------|------|
| 200 | 200 | 正常 | 操作成功 |
| 400 | 400 | 参数错误 | 请求参数不符合要求 |
| 400 | 400 | 状态机拒绝 | 当前状态不允许该动作 |
| 400 | 400 | 业务校验失败 | 如 TERMINATE 时状态不满足条件 |
| 400 | 400 | 状态不允许操作 | 修改/删除时状态不满足条件 |
| 400 | 400 | 重复创建 | 同一订单+工序+人员组合已存在 |
| 400 | 400 | 资源不存在 | 工单/订单/工序/人员不存在（通过 BusinessException 返回） |
| 400 | 400 | 系统专属 Action | PUBLISH/CANCEL_PUBLISH 仅限系统内部触发，不支持直接 API 调用 |
| 403 | 403 | 权限不足 | 用户无对应角色权限，或非本工单派工人员 |
| 500 | 500 | 系统异常 | 服务器内部错误 |

---

## 7. 状态感知约束

### 7.1 修改约束

```
CREATED ─── 全部字段可修改
RELEASED ── 仅 plannedQuantity、时间、备注可修改；userId/processId/isCritical 保持原值
RUNNING ─── 仅 actualQuantity、scrapQuantity、备注可修改（现场数据采集）
PAUSED ──── 仅备注可修改
COMPLETED ─ 不允许修改（终态）
TERMINATED─ 不允许修改（终态）
```

### 7.2 删除约束

| 状态 | 允许删除 |
|------|:---:|
| CREATED | ✅ |
| 其他所有状态 | ❌ |

**设计原则**: 一旦工单已派工（RELEASED）或已产生作业事实，禁止删除，只允许作废。

### 7.3 作废约束

| 状态 | 允许作废 |
|------|:---:|
| RELEASED | ✅ — 已派工但未开始，可作废 |
| PAUSED | ✅ — 异常暂停无法恢复，可作废 |
| CREATED | ❌ — 应走删除而非作废 |
| RUNNING | ❌ — 正在作业中不可作废 |
| COMPLETED | ❌ — 终态 |
| TERMINATED | ❌ — 终态 |

---

## 8. 业务规则

### 8.1 工单编号生成规则

工单编号格式：`{orderNo}-{processId}-{seq}`

- `orderNo`：所属订单编号
- `processId`：工序 ID
- `seq`：同一订单+工序下的自增序号，从 1 开始

示例：`PLAN-20260608-001-LINE-A01-10-1`

### 8.2 向上联动（工单 → 订单）

工单状态由员工现场操作驱动，变更后自动触发订单状态同步：

| 工单状态变更 | 订单状态联动 |
|-------------|------------|
| 任一关键工单 START_WORK → RUNNING | 订单 → RUNNING（首次） |
| 任一关键工单 PAUSE（且无其他 RUNNING 关键工单） | 订单 → PAUSED |
| 任一关键工单 RESUME | 订单 → RUNNING（从 PAUSED 恢复） |
| 所有工单 FINISH_WORK → COMPLETED | 订单 → COMPLETED |

> **关键工单（isCritical = true）**：标记为关键工序的工单，其状态变更直接影响订单状态聚合。非关键工单的状态变更不触发订单状态联动。

### 8.3 向下联动（订单 → 工单）

订单状态变更时，自动级联处理下属工单。**v1.2 起所有从 Order 触发的级联操作均包含工单审计记录**，确保无论从 Plan 层或 Order 层触发，工单状态变更均可追溯。

**PUBLISH** — 订单发布时根据产线绑定的工艺流程自动生成工单：
1. 获取产线对应的工艺流程
2. 遍历每条工序
3. 为每道工序查找具备技能的人员
4. 生成工单，首个工单标记为关键工单
5. 工单初始状态为 CREATED
6. 自动发布工单（CREATED → RELEASED），审计通过 `workOrderStateService` 记录

**CANCEL_PUBLISH** — 订单取消发布时，联动作废所有非终态工单（含 CREATED/RELEASED/PAUSED），每条工单的状态变更均记录审计。

**TERMINATE** — 订单作废时，联动作废所有非终态工单，每条工单的状态变更均记录审计。

**PAUSE** — 订单暂停时，级联暂停所有 RUNNING 工单，每条工单的状态变更均记录审计。

**RESUME** — 订单恢复时，级联恢复所有 PAUSED 工单，每条工单的状态变更均记录审计。

### 8.4 权限模型

工单层是最靠近现场的执行层，权限模型区分**员工**和**主管**两类角色：

| 操作 | 角色 | 附加校验 |
|------|------|---------|
| START_WORK | 员工 | 必须为本工单的派工人员（userId 匹配） |
| FINISH_WORK | 员工 | 必须为本工单的派工人员（userId 匹配） |
| PAUSE | 员工 / 主管 | 员工需 userId 匹配；主管可跨工单操作 |
| RESUME | 员工 / 主管 | 员工需 userId 匹配；主管可跨工单操作 |
| TERMINATE | 主管 | 需"车间主任"或"生产主管"角色 |

### 8.5 现场数据采集

工单在 RUNNING 状态下支持员工实时上报生产数据：

- **actualQuantity**：实际完成数量，由员工分次上报累加
- **scrapQuantity**：报废数量，由员工如实上报
- 数据的最终汇总将向上同步至订单的 `quantityProduced`、`qualifiedProducts`、`defectiveProducts`

---

## 附录 A: 状态生命周期示意

```
订单发布联动
     │
     ▼
┌──────────┐   PUBLISH    ┌──────────┐  TERMINATE    ┌────────────┐
│ CREATED  │ ──────────→  │ RELEASED │ ────────────→ │ TERMINATED │
│ (待派工)  │ ←────────── │ (已派工)  │               │  (作废)    │
└──────────┘ CANCEL_      └────┬─────┘               └────────────┘
              PUBLISH          │
                               │ START_WORK（员工确认开始）
                               ▼
                        ┌──────────┐
                        │ RUNNING  │ ←────RESUME──── ┌──────────┐
                        │ (作业中)  │ ────PAUSE──────→ │ PAUSED   │
                        └────┬─────┘                 │ (异常)    │
                             │                       └─────┬─────┘
                             │ FINISH_WORK                 │ TERMINATE
                             │（员工确认完成）               │（主管作废）
                             ▼                             ▼
                        ┌──────────┐               ┌────────────┐
                        │COMPLETED │               │ TERMINATED │
                        │ (完成)   │               │  (作废)    │
                        └──────────┘               └────────────┘
```

---

## 附录 B: 与订单模块的差异对比

| 维度 | Order（订单） | WorkOrder（工单） |
|------|-------------|------------------|
| 定位 | 产线调度单元 | 现场执行单元 |
| PUBLISH 触发 | 计划发布联动 | 订单发布联动 |
| START_WORK 角色 | 系统事实驱动 | **员工**手动确认 |
| FINISH_WORK 角色 | 系统事实驱动 | **员工**手动确认 |
| PAUSE 角色 | 主管 | **员工/主管** |
| RESUME 角色 | 主管 | **员工/主管** |
| TERMINATE 条件 | RELEASED 且无 RUNNING 工单 | RELEASED 或 PAUSED |
| 状态聚合来源 | 工单 (WorkOrder) | —（最底层） |
| 现场数据采集 | 不直接采集 | RUNNING 状态下支持上报 actualQuantity/scrapQuantity |
| isCritical | — | ✅ 标记关键工单，影响订单聚合 |

---

> **文档维护**: 本接口文档应与代码同步更新。状态流转规则变更时，需同步更新本文档和 `workOrderStateMachine` 状态机配置。
