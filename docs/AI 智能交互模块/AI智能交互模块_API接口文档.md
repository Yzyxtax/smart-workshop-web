# MES AI 智能交互模块 API 接口文档

> **版本**: v1.0\
> **基础路径**: `http://{host}:{port}`\
> **认证方式**: JWT Token（`Authorization: Bearer <token>` 或 `token` 请求头）\
> **日期**: 2026-06-13

***

## 目录

1. [通用说明](#1-通用说明)
2. [API 概览](#2-api-概览)
3. [会话管理接口](#3-会话管理接口)
   - [3.1 创建会话](#31-创建会话)
   - [3.2 查询会话列表](#32-查询会话列表)
   - [3.3 查询会话详情](#33-查询会话详情)
   - [3.4 删除会话](#34-删除会话)
4. [消息发送接口（SSE）](#4-消息发送接口sse)
   - [4.1 发送消息（SSE 流式响应）](#41-发送消息sse-流式响应)
   - [4.2 SSE 事件类型说明](#42-sse-事件类型说明)
5. [审计日志接口](#5-审计日志接口)
   - [5.1 分页查询审计日志](#51-分页查询审计日志)
6. [监控指标接口](#6-监控指标接口)
   - [6.1 获取运行指标快照](#61-获取运行指标快照)
7. [数据模型](#7-数据模型)
8. [AI 工具清单](#8-ai-工具清单)
9. [错误码说明](#9-错误码说明)
10. [业务规则](#10-业务规则)

***

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

会话管理接口会从 JWT 中提取 `userId`，实现用户级别的数据隔离——用户只能查看/删除自己的会话。

### 1.2 通用响应格式

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

| 字段      | 类型      | 说明           |
| ------- | ------- | ------------ |
| code    | Integer | 状态码，200 表示成功 |
| message | String  | 提示信息         |
| data    | Object  | 响应数据，可为 null |

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

### 1.4 模块架构说明

AI 智能交互模块是一个独立的 Maven 子模块（`smart-workshop-ai`），实现**多轮工具调用循环**架构：

```
用户自然语言 → AiChatController(SSE) → AiAgentService(调度器)
    → LLM Provider(Claude/OpenAI) → 解析工具调用
    → ToolExecutor(7步沙箱管道) → 业务 Service → 返回结果
    → LLM 继续推理 → ... → 最终文本回复
```

核心特性：

- **多 LLM 支持**：通过 `AiProvider` 接口接入 Claude / OpenAI，配置切换
- **工具热注册**：`@AiTool` 注解标记工具类，启动时自动扫描并生成 JSON Schema
- **7 步沙箱管道**：工具查找 → 参数校验 → RBAC 权限 → 确认检查 → 限流 → 执行 → 审计
- **SSE 流式推送**：前端实时接收 THINKING / TEXT\_DELTA / TOOL\_CALL / TOOL\_RESULT / DONE / ERROR 事件
- **审计全记录**：每次工具调用写入 `ai_audit_log` 表

***

## 2. API 概览

| 方法       | URL                               | 说明                 | 权限     |
| -------- | --------------------------------- | ------------------ | ------ |
| `POST`   | `/ai/chat/sessions`               | 创建新会话              | 登录用户   |
| `GET`    | `/ai/chat/sessions`               | 查询会话列表（当前用户）       | 登录用户   |
| `GET`    | `/ai/chat/sessions/{id}`          | 查询会话详情 + 消息历史      | 会话归属用户 |
| `DELETE` | `/ai/chat/sessions/{id}`          | 删除会话（级联删除消息）       | 会话归属用户 |
| `POST`   | `/ai/chat/sessions/{id}/messages` | 发送消息（SSE 流式响应）★ 核心 | 登录用户   |
| `GET`    | `/ai/audit`                       | 分页查询审计日志           | 登录用户   |
| `GET`    | `/ai/metrics`                     | 获取运行指标快照           | 登录用户   |

***

## 3. 会话管理接口

### 3.1 创建会话

**请求**

```
POST /ai/chat/sessions
Content-Type: application/json
```

**请求体**

```json
{
  "title": "生产计划查询"
}
```

| 字段    | 类型     | 必填 | 说明                            |
| ----- | ------ | -- | ----------------------------- |
| title | String | 否  | 会话标题。不传则发送首条消息时自动生成（取前 50 字符） |

请求体整体可选，不传 Body 亦可创建无标题会话。

**响应示例**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 1,
    "userId": 1001,
    "title": "生产计划查询",
    "status": "ACTIVE",
    "createdAt": "2026-06-13 14:30:00",
    "updatedAt": "2026-06-13 14:30:00"
  }
}
```

***

### 3.2 查询会话列表

> 按活跃时间倒序，仅返回当前用户的会话。

**请求**

```
GET /ai/chat/sessions
```

**响应示例**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "id": 2,
      "userId": 1001,
      "title": "查询设备状态",
      "status": "ACTIVE",
      "createdAt": "2026-06-13 10:15:00",
      "updatedAt": "2026-06-13 14:30:00"
    },
    {
      "id": 1,
      "userId": 1001,
      "title": "生产计划查询",
      "status": "ARCHIVED",
      "createdAt": "2026-06-12 09:00:00",
      "updatedAt": "2026-06-12 16:20:00"
    }
  ]
}
```

***

### 3.3 查询会话详情

> 返回会话基本信息及全部消息历史（按时间正序），仅会话归属用户可查看。

**请求**

```
GET /ai/chat/sessions/{sessionId}
```

**路径参数**

| 参数        | 类型   | 必填 | 说明    |
| --------- | ---- | -- | ----- |
| sessionId | Long | 是  | 会话 ID |

**响应示例**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "session": {
      "id": 1,
      "userId": 1001,
      "title": "生产计划查询",
      "status": "ACTIVE",
      "createdAt": "2026-06-13 14:30:00",
      "updatedAt": "2026-06-13 14:30:00"
    },
    "messages": [
      {
        "id": 1,
        "sessionId": 1,
        "role": "user",
        "content": "查询 PLAN-20260608-001 的状态",
        "toolCalls": null,
        "tokenUsage": null,
        "createdAt": "2026-06-13 14:30:05"
      },
      {
        "id": 2,
        "sessionId": 1,
        "role": "assistant",
        "content": "正在为您查询计划 PLAN-20260608-001 的状态...",
        "toolCalls": "[{\"name\":\"query_plan_status\",\"params\":{\"planNo\":\"PLAN-20260608-001\"}}]",
        "tokenUsage": "{\"prompt_tokens\":520,\"completion_tokens\":180,\"total_tokens\":700}",
        "createdAt": "2026-06-13 14:30:08"
      }
    ]
  }
}
```

**权限不足响应**

```json
{
  "code": 403,
  "message": "无权查看此会话",
  "data": null
}
```

***

### 3.4 删除会话

> 级联删除该会话下的所有消息，仅会话归属用户可删除。

**请求**

```
DELETE /ai/chat/sessions/{sessionId}
```

**路径参数**

| 参数        | 类型   | 必填 | 说明    |
| --------- | ---- | -- | ----- |
| sessionId | Long | 是  | 会话 ID |

**响应示例**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": null
}
```

**权限不足响应**

```json
{
  "code": 403,
  "message": "无权删除此会话",
  "data": null
}
```

***

## 4. 消息发送接口（SSE）

### 4.1 发送消息（SSE 流式响应）

> ★ 核心接口。通过 SSE（Server-Sent Events）流式推送 AI 回复。前端应使用 `EventSource` 或等价方式消费事件流。

**请求**

```
POST /ai/chat/sessions/{sessionId}/messages
Content-Type: application/json
Accept: text/event-stream
```

**路径参数**

| 参数        | 类型   | 必填 | 说明    |
| --------- | ---- | -- | ----- |
| sessionId | Long | 是  | 会话 ID |

**请求体**

```json
{
  "content": "查询所有运行中的生产计划"
}
```

| 字段      | 类型     | 必填 | 说明                  |
| ------- | ------ | -- | ------------------- |
| content | String | 是  | 用户自然语言消息，最大 4000 字符 |

**响应**: SSE 流（`Content-Type: text/event-stream`），超时 5 分钟（300 秒）。

**SSE 事件流示例**

```
event:thinking
data:{}

event:text_delta
data:{"content":"正在"}

event:text_delta
data:{"content":"为您查询"}

event:text_delta
data:{"content":"运行中的计划..."}

event:tool_call
data:{"name":"query_plan_status","params":{"status":"RUNNING"}}

event:tool_result
data:{"tool":"query_plan_status","result":{"success":true,"data":{"count":3,"plans":[...]}}}

event:text_delta
data:{"content":"当前有 3 个运行中的生产计划：\n1. ..."}

event:done
data:{"messageId":15,"tokenUsage":{"prompt_tokens":520,"completion_tokens":210,"total_tokens":730}}
```

**参数校验错误（非 SSE，立即返回）**

```json
{
  "code": 400,
  "message": "消息内容不能为空",
  "data": null
}
```

```json
{
  "code": 400,
  "message": "消息内容超过 4000 字符限制",
  "data": null
}
```

***

### 4.2 SSE 事件类型说明

| 事件名           | 方向  | 说明                      | 数据结构                                                        |
| ------------- | --- | ----------------------- | ----------------------------------------------------------- |
| `thinking`    | S→C | AI 正在思考，前端可展示加载动画       | `{}`                                                        |
| `text_delta`  | S→C | 流式文本片段，逐字推送给前端          | `{"content": "片段文本"}`                                       |
| `tool_call`   | S→C | LLM 决定调用工具，前端可展示工具名称和参数 | `{"name": "工具名", "params": {...}}`                          |
| `tool_result` | S→C | 工具执行完毕，返回结果             | `{"tool": "工具名", "result": {"success": true, "data": ...}}` |
| `done`        | S→C | 本轮对话完成                  | `{"messageId": 15, "tokenUsage": {...}}`                    |
| `error`       | S→C | 发生错误                    | `{"code": "错误码", "message": "错误描述"}`                        |

**done 事件的 tokenUsage 结构**

```json
{
  "prompt_tokens": 520,
  "completion_tokens": 210,
  "total_tokens": 730
}
```

> 注：`input_tokens`/`output_tokens` 字段名因 LLM 提供商差异可能不同，前端建议同时兼容两种命名。

**error 事件常见 code 值**

| code              | 说明        |
| ----------------- | --------- |
| `RATE_LIMIT`      | 工具调用频率超限  |
| `LLM_UNAVAILABLE` | LLM 服务不可用 |
| `LLM_EMPTY`       | AI 返回空响应  |
| `INTERNAL_ERROR`  | 系统内部异常    |

***

## 5. 审计日志接口

### 5.1 分页查询审计日志

**请求**

```
GET /ai/audit?userId=1001&toolName=search_equipment&startTime=2026-06-01&endTime=2026-06-13&success=true&page=1&pageSize=10
```

**查询参数**

| 参数        | 类型      | 必填 | 默认值 | 说明                          |
| --------- | ------- | -- | --- | --------------------------- |
| userId    | Integer | 否  | -   | 操作人 ID 筛选                   |
| toolName  | String  | 否  | -   | 工具名称筛选，如 `search_equipment` |
| startTime | String  | 否  | -   | 开始时间 (yyyy-MM-dd HH:mm:ss)  |
| endTime   | String  | 否  | -   | 结束时间 (yyyy-MM-dd HH:mm:ss)  |
| success   | Boolean | 否  | -   | 是否仅查询成功的记录                  |
| page      | Integer | 否  | 1   | 页码                          |
| pageSize  | Integer | 否  | 10  | 每页条数                        |

**响应示例**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "total": 156,
    "pageNum": 1,
    "pageSize": 10,
    "rows": [
      {
        "id": 1001,
        "sessionId": 42,
        "messageId": 380,
        "userId": 1001,
        "toolName": "search_equipment",
        "toolParams": "{\"keyword\":\"焊接机器人\"}",
        "executionResult": "{\"count\":3,\"equipment\":[...]}",
        "targetType": null,
        "targetId": null,
        "success": true,
        "errorMessage": null,
        "durationMs": 45,
        "userNaturalInput": "查一下焊接机器人的信息",
        "createdAt": "2026-06-13 14:30:08"
      }
    ]
  }
}
```

***

## 6. 监控指标接口

### 6.1 获取运行指标快照

**请求**

```
GET /ai/metrics
```

**响应示例**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "totalRequests": 1523,
    "successRate": 0.978,
    "avgLatencyMs": 2340,
    "registeredTools": 15,
    "toolNames": [
      "search_equipment", "get_equipment_detail",
      "add_equipment_function", "update_equipment_function",
      "delete_equipment_function", "search_bom", "create_bom",
      "search_line", "search_process", "search_team",
      "search_work_step", "add_work_step",
      "query_plan_status", "query_order_status",
      "query_work_order_status"
    ],
    "errorCounts": {
      "LLM_UNAVAILABLE": 15,
      "RATE_LIMIT": 8,
      "INTERNAL_ERROR": 3
    }
  }
}
```

| 字段              | 类型        | 说明           |
| --------------- | --------- | ------------ |
| totalRequests   | Long      | 累计 LLM 请求数   |
| successRate     | Double    | 成功率（0\~1）    |
| avgLatencyMs    | Double    | 平均延迟（毫秒）     |
| registeredTools | Integer   | 已注册 AI 工具数量  |
| toolNames       | String\[] | 所有已注册工具名称列表  |
| errorCounts     | Map       | 按错误类型分组的失败次数 |

***

## 7. 数据模型

### 7.1 AiChatSession（AI 对话会话）

| 字段        | 类型            | 说明                                  |
| --------- | ------------- | ----------------------------------- |
| id        | Long          | 主键，自增                               |
| userId    | Integer       | 会话归属用户 ID                           |
| title     | String        | 会话标题（首条消息前 50 字符自动生成）               |
| status    | String        | 会话状态：`ACTIVE`（活跃中）/ `ARCHIVED`（已归档） |
| createdAt | LocalDateTime | 创建时间 (yyyy-MM-dd HH:mm:ss)          |
| updatedAt | LocalDateTime | 最后活跃时间 (yyyy-MM-dd HH:mm:ss)        |

### 7.2 AiChatMessage（AI 对话消息）

| 字段         | 类型            | 说明                                            |
| ---------- | ------------- | --------------------------------------------- |
| id         | Long          | 主键，自增                                         |
| sessionId  | Long          | 所属会话 ID                                       |
| role       | String        | 消息角色：`user` / `assistant` / `system` / `tool` |
| content    | String        | 消息内容（Markdown 格式；tool 角色时为 JSON）              |
| toolCalls  | String        | AI 请求的工具调用列表 JSON：`[{name, params, result}]`  |
| tokenUsage | String        | token 消耗 JSON：`{prompt, completion, total}`   |
| createdAt  | LocalDateTime | 创建时间 (yyyy-MM-dd HH:mm:ss)                    |

### 7.3 AiAuditLog（AI 操作审计日志）

| 字段               | 类型            | 说明                          |
| ---------------- | ------------- | --------------------------- |
| id               | Long          | 主键，自增                       |
| sessionId        | Long          | 关联会话 ID                     |
| messageId        | Long          | 关联用户消息 ID                   |
| userId           | Integer       | 操作人 ID（JWT 提取）              |
| toolName         | String        | 调用的工具名称                     |
| toolParams       | String        | 工具参数（脱敏后 JSON）              |
| executionResult  | String        | 执行结果 JSON（成功时为返回值，失败时为错误信息） |
| targetType       | String        | 操作目标类型（表名/实体名）              |
| targetId         | String        | 操作目标 ID                     |
| success          | Boolean       | 是否成功                        |
| errorMessage     | String        | 失败时的错误信息                    |
| durationMs       | Integer       | 执行耗时（毫秒）                    |
| userNaturalInput | String        | 用户原始自然语言输入                  |
| createdAt        | LocalDateTime | 审计时间 (yyyy-MM-dd HH:mm:ss)  |

### 7.4 SessionCreateRequest（创建会话请求体）

| 字段    | 类型     | 必填 | 说明   |
| ----- | ------ | -- | ---- |
| title | String | 否  | 会话标题 |

### 7.5 SendMessageRequest（发送消息请求体）

| 字段      | 类型     | 必填 | 说明              |
| ------- | ------ | -- | --------------- |
| content | String | 是  | 消息内容，最大 4000 字符 |

### 7.6 AiAuditQueryParam（审计查询参数）

| 字段        | 类型      | 必填 | 默认值 | 说明       |
| --------- | ------- | -- | --- | -------- |
| userId    | Integer | 否  | -   | 用户 ID 筛选 |
| toolName  | String  | 否  | -   | 工具名称筛选   |
| startTime | String  | 否  | -   | 开始时间     |
| endTime   | String  | 否  | -   | 结束时间     |
| success   | Boolean | 否  | -   | 是否仅查成功记录 |
| page      | Integer | 否  | 1   | 页码       |
| pageSize  | Integer | 否  | 10  | 每页条数     |

### 7.7 枚举值汇总

**会话状态 (SessionStatus)**

| 值        | 说明  |
| -------- | --- |
| ACTIVE   | 活跃中 |
| ARCHIVED | 已归档 |

**消息角色 (MessageRole)**

| 值         | 说明      |
| --------- | ------- |
| user      | 用户消息    |
| assistant | AI 助手回复 |
| system    | 系统提示    |
| tool      | 工具调用结果  |

**SSE 事件类型 (SseEventType)**

| 值            | 事件名          | 说明         |
| ------------ | ------------ | ---------- |
| THINKING     | thinking     | AI 正在思考    |
| TEXT\_DELTA  | text\_delta  | 流式文本片段     |
| TOOL\_CALL   | tool\_call   | LLM 请求调用工具 |
| TOOL\_RESULT | tool\_result | 工具执行结果     |
| DONE         | done         | 对话完成       |
| ERROR        | error        | 发生错误       |

***

## 8. AI 工具清单

> 以下工具由 AI Agent 自动调用，无需前端直接调用。工具通过 `@AiTool` 注解注册，启动时自动构建 JSON Schema 发送给 LLM。

### 8.1 工具分类一览

| 分类        | 工具名称                        | 功能         | 需确认 | 所需权限                   |
| --------- | --------------------------- | ---------- | :-: | ---------------------- |
| **BOM管理** | `search_bom`                | 按关键词搜索物料清单 |  ❌  | -                      |
| **BOM管理** | `create_bom`                | 创建 BOM 记录  |  ❌  | `SYS_BOM_MANAGE`       |
| **设备管理**  | `search_equipment`          | 按关键词搜索设备   |  ❌  | -                      |
| **设备管理**  | `get_equipment_detail`      | 获取设备详细信息   |  ❌  | -                      |
| **设备管理**  | `add_equipment_function`    | 添加设备功能描述   |  ❌  | `SYS_EQUIPMENT_MANAGE` |
| **设备管理**  | `update_equipment_function` | 更新设备功能描述   |  ❌  | `SYS_EQUIPMENT_MANAGE` |
| **设备管理**  | `delete_equipment_function` | 删除设备功能描述   |  ✅  | `SYS_EQUIPMENT_MANAGE` |
| **产线管理**  | `search_line`               | 按关键词搜索产线   |  ❌  | -                      |
| **工序管理**  | `search_process`            | 按关键词搜索工艺流程 |  ❌  | -                      |
| **工步管理**  | `search_work_step`          | 按关键词搜索工步   |  ❌  | -                      |
| **工步管理**  | `add_work_step`             | 添加工步       |  ❌  | `SYS_PROCESS_MANAGE`   |
| **班组管理**  | `search_team`               | 按关键词搜索班组   |  ❌  | -                      |
| **生产管理**  | `query_plan_status`         | 查询生产计划状态   |  ❌  | -                      |
| **生产管理**  | `query_order_status`        | 查询生产订单状态   |  ❌  | -                      |
| **生产管理**  | `query_work_order_status`   | 查询生产工单状态   |  ❌  | -                      |

### 8.2 工具参数详情

#### search\_bom — 搜索 BOM

| 参数      | 类型     | 必填 | 说明                |
| ------- | ------ | -- | ----------------- |
| keyword | String | ✅  | 搜索关键词（物料名称、图号或材质） |

#### create\_bom — 创建 BOM

| 参数           | 类型      | 必填 | 说明                               |
| ------------ | ------- | -- | -------------------------------- |
| bomDrawingNo | String  | ✅  | BOM 图号                           |
| bomNameSpec  | String  | ✅  | 名称规格                             |
| bomMaterial  | String  | ❌  | 材质                               |
| bomQuantity  | Integer | ❌  | 单位用量（默认 1）                       |
| bomType      | String  | ❌  | BOM 类型：`成品`/`半成品`/`原材料`（默认"原材料"） |

#### search\_equipment — 搜索设备

| 参数      | 类型     | 必填 | 说明                |
| ------- | ------ | -- | ----------------- |
| keyword | String | ✅  | 搜索关键词（设备名称、型号或类型） |

#### get\_equipment\_detail — 获取设备详情

| 参数          | 类型      | 必填 | 说明    |
| ----------- | ------- | -- | ----- |
| equipmentId | Integer | ✅  | 设备 ID |

#### add\_equipment\_function — 添加设备功能

| 参数                  | 类型      | 必填 | 说明      |
| ------------------- | ------- | -- | ------- |
| equipmentId         | Integer | ✅  | 目标设备 ID |
| functionDescription | String  | ✅  | 功能描述文本  |

#### update\_equipment\_function — 更新设备功能

| 参数             | 类型      | 必填 | 说明       |
| -------------- | ------- | -- | -------- |
| equipmentId    | Integer | ✅  | 目标设备 ID  |
| functionId     | Integer | ✅  | 功能描述 ID  |
| newDescription | String  | ✅  | 新的功能描述文本 |

#### delete\_equipment\_function — 删除设备功能 ⚠️

| 参数          | 类型      | 必填 | 说明          |
| ----------- | ------- | -- | ----------- |
| equipmentId | Integer | ✅  | 目标设备 ID     |
| functionId  | Integer | ✅  | 要删除的功能描述 ID |

> ⚠️ 破坏性操作，需用户二次确认后才能执行。用户回复"确认"/"是"/"好的"等确认词后才会真正执行。

#### search\_line — 搜索产线

| 参数      | 类型     | 必填 | 说明             |
| ------- | ------ | -- | -------------- |
| keyword | String | ✅  | 搜索关键词（产线名称或编号） |

#### search\_process — 搜索工序

| 参数      | 类型     | 必填 | 说明             |
| ------- | ------ | -- | -------------- |
| keyword | String | ✅  | 搜索关键词（工序名称或编号） |

#### search\_work\_step — 搜索工步

| 参数      | 类型     | 必填 | 说明             |
| ------- | ------ | -- | -------------- |
| keyword | String | ✅  | 搜索关键词（工步名称或编号） |

#### add\_work\_step — 添加工步

| 参数              | 类型      | 必填 | 说明      |
| --------------- | ------- | -- | ------- |
| stepName        | String  | ✅  | 工步名称    |
| stepDescription | String  | ❌  | 工步描述    |
| equipmentId     | Integer | ❌  | 关联设备 ID |
| functionId      | Integer | ❌  | 关联功能 ID |

#### search\_team — 搜索班组

| 参数      | 类型     | 必填 | 说明             |
| ------- | ------ | -- | -------------- |
| keyword | String | ✅  | 搜索关键词（班组名称或编号） |

#### query\_plan\_status — 查询计划状态

| 参数     | 类型     | 必填 | 说明                                                                    |
| ------ | ------ | -- | --------------------------------------------------------------------- |
| planNo | String | ❌  | 计划编号（精确匹配）                                                            |
| status | String | ❌  | 状态筛选：`CREATED`/`RELEASED`/`RUNNING`/`PAUSED`/`COMPLETED`/`TERMINATED` |

#### query\_order\_status — 查询订单状态

| 参数      | 类型     | 必填 | 说明                                                                    |
| ------- | ------ | -- | --------------------------------------------------------------------- |
| orderNo | String | ❌  | 订单编号（精确匹配）                                                            |
| status  | String | ❌  | 状态筛选：`CREATED`/`RELEASED`/`RUNNING`/`PAUSED`/`COMPLETED`/`TERMINATED` |
| planNo  | String | ❌  | 所属计划编号                                                                |

#### query\_work\_order\_status — 查询工单状态

| 参数          | 类型      | 必填 | 说明                                                                    |
| ----------- | ------- | -- | --------------------------------------------------------------------- |
| workOrderNo | String  | ❌  | 工单编号（精确匹配）                                                            |
| status      | String  | ❌  | 状态筛选：`CREATED`/`RELEASED`/`RUNNING`/`PAUSED`/`COMPLETED`/`TERMINATED` |
| orderNo     | String  | ❌  | 所属订单编号                                                                |
| isCritical  | Boolean | ❌  | 是否只查询关键工单                                                             |

***

## 9. 错误码说明

| HTTP 状态 | code | 场景     | 说明                 |
| ------- | ---- | ------ | ------------------ |
| 200     | 200  | 正常     | 操作成功               |
| 400     | 400  | 参数错误   | 消息内容为空或超长          |
| 400     | 400  | 会话不存在  | sessionId 对应的会话不存在 |
| 403     | 403  | 权限不足   | 尝试查看/删除他人会话        |
| 403     | 403  | 工具权限不足 | AI 调用工具时用户无所需权限    |
| 500     | 500  | 系统异常   | 服务器内部错误            |

**SSE 错误事件 code（通过 error 事件推送，非 HTTP 状态码）**

| code              | 说明                                  |
| ----------------- | ----------------------------------- |
| `RATE_LIMIT`      | 工具调用频率超限（每分钟最多 10 次）                |
| `LLM_UNAVAILABLE` | LLM API 服务不可用（API Key 缺失、网络超时、返回异常） |
| `LLM_EMPTY`       | LLM 返回空响应                           |
| `INTERNAL_ERROR`  | 系统内部异常                              |

***

## 10. 业务规则

### 10.1 ToolExecutor 7 步沙箱管道

每次 AI 调用工具时，严格经过以下 7 步安全防线：

```
┌─────────────────────────────────────────────────┐
│ Step 1  工具查找    → ToolRegistry.getHandler() │
│ Step 2  参数校验    → 对照 @ToolParam 注解       │
│ Step 3  RBAC 权限   → PermissionChecker 校验     │
│ Step 4  确认检查    → requiresConfirmation 二次确认│
│ Step 5  限流检查    → 每分钟最多 10 次工具调用     │
│ Step 6  业务执行    → ToolHandler.execute()      │
│ Step 7  审计记录    → 写入 ai_audit_log 表        │
└─────────────────────────────────────────────────┘
```

### 10.2 多轮工具调用循环

AI Agent 最多进行 **5 轮** LLM → 工具调用 → LLM 循环：

```
用户输入 → LLM 推理
    ├─ 纯文本 → 直接推送文本回复 → 结束
    └─ 包含工具调用 → ToolExecutor 执行
         → 结果返回 LLM → 继续推理
         → 最多重复 5 轮 → 强制结束
```

### 10.3 确认语义检测

对于标记 `requiresConfirmation = true` 的工具（如 `delete_equipment_function`）：

- LLM 会先生成确认提示文本
- Agent 检测用户回复中是否包含确认关键词：`确认`、`是`、`确定`、`好的`、`继续`、`执行`、`可以`、`行`、`好`、`ok`、`yes`、`confirm`
- 确认后执行实际操作，未确认则跳过

### 10.4 会话隔离

- 每个用户只能查看/删除自己的会话
- 控制器从 JWT 中提取 `userId`，与目标会话的 `userId` 比对
- 不匹配返回 403

### 10.5 限流策略

- 同一会话每分钟最多 **10 次** AI 工具调用（可配置 `ai.tool.max-calls-per-minute`）
- 限流计数器基于滑动窗口，60 秒自动重置
- 超限返回 `RATE_LIMIT` 错误，前端应提示用户稍后重试

### 10.6 会话过期

- 会话数据保留天数：默认 90 天（可配置 `ai.session.retention-days`）
- 支持自动归档（可配置 `ai.session.archive-enabled`，默认关闭）
- 通过 `AiChatSessionMapper.deleteExpiredSessions()` 清理过期数据

### 10.7 LLM 提供商切换

- 配置项 `ai.llm.provider` 控制：`claude` / `openai`
- `AiProviderFactory` 在启动时扫描所有 `AiProvider` 实现，根据配置选择对应的 Provider
- 添加新的 LLM 提供商只需实现 `AiProvider` 接口并注册为 Spring Bean

***

## 附录 A：AI 对话完整生命周期

```
    用户输入 "查询设备A的信息"
         │
         ▼
┌──────────────────────────────────────────┐
│ 1. AiChatController.sendMessage()        │
│    - 参数校验（内容非空、≤4000 字符）      │
│    - 校验会话存在                         │
│    - 创建 SseEmitter（300s 超时）         │
└──────────────┬───────────────────────────┘
               │ 异步调用
               ▼
┌──────────────────────────────────────────┐
│ 2. AiAgentServiceImpl.process()          │
│    Phase 1: 保存用户消息 + 自动生成标题    │
│    Phase 2: 组装 SystemPrompt + 历史消息  │
│    Phase 3: LLM 推理循环                  │
│    Phase 4: 保存 AI 回复 + 记录指标       │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ 3. LLM Provider.streamChat()             │
│    - ClaudeProvider / OpenAiProvider     │
│    - SSE 流式读取 → 标准化 AiEvent       │
└──────────────┬───────────────────────────┘
               │ 有工具调用
               ▼
┌──────────────────────────────────────────┐
│ 4. ToolExecutor.execute()                │
│    7步沙箱管道执行 → 结果返回 LLM         │
└──────────────────────────────────────────┘
               │ 循环最多 5 轮
               ▼
         最终文本回复 → 前端展示
```

***

## 附录 B：与 AI API 的差异对比

| 维度   | 传统 REST API      | AI 聊天接口                                                      |
| ---- | ---------------- | ------------------------------------------------------------ |
| 请求方式 | 同步请求-响应          | SSE 流式响应（text/event-stream）                                  |
| 超时策略 | 固定超时             | SseEmitter 300s 超时                                           |
| 响应格式 | JSON             | 事件流（thinking/text\_delta/tool\_call/tool\_result/done/error） |
| 异常处理 | HTTP 状态码 + JSON  | error 事件（流内推送）                                               |
| 幂等性  | 增删改通常幂等          | 非幂等（每条消息产生新的 AI 推理）                                          |
| 认证   | JWT Bearer Token | 同 REST API                                                   |

***

> **文档维护**: 本接口文档应与代码同步更新。新增 AI 工具、修改工具参数或变更 SSE 事件格式时，需同步更新本文档。
>
> **v1.0 更新记录** (2026-06-13):
>
> - 初始版本，覆盖会话管理（CRUD）、SSE 消息发送、审计日志查询、监控指标查询
> - 15 个 AI 工具注册，涵盖 BOM、设备、产线、工序、工步、班组、生产管理 7 大领域
> - 7 步沙箱管道文档化

