# MES 三层架构状态与权限设计总结

> **版本**: v2.0\
> **日期**: 2026-06-10\
> **变更**: v2.0 — 完全对齐代码实现，采用 6 状态 × 7 动作模型，补充三层完整状态-动作矩阵、权限策略、门禁规则、联动机制与修改约束
>
> 本文档用于系统性总结 **MES 中生产计划（Plan）→ 生产订单（Order）→ 工单（WorkOrder）** 三层架构的 **状态设计、状态联动、发布门禁、修改删除规则、以及用户操作权限设计**。
>
> **目标**：状态不乱 · 权责清晰 · 行为可追溯 · 贴合真实生产现场

***

## 一、三层架构定位与职责

| 层级 | 对象            | 核心职责    | 关注点         |
| -- | ------------- | ------- | ----------- |
| L1 | 生产计划（Plan）    | 调度与目标管理 | 做不做、何时做、做多少 |
| L2 | 生产订单（Order）   | 产线执行管理  | 在哪条产线、如何排产  |
| L3 | 工单（WorkOrder） | 人员与工序执行 | 谁来做、如何做     |

**核心原则：**

- 工单是最小执行单元
- 订单是工单的聚合
- 计划是订单的聚合

**状态影响方向：**

```
工单 → 订单 → 计划（向上联动聚合，由底层事实驱动上层状态）
计划 → 订单 → 工单（向下级联联动，由上层决策影响下层执行）
```

***

## 二、统一状态定义

三层对象统一使用 **6 种状态**（2 个可操作态 + 2 个执行态 + 2 个终态）：

| 状态枚举值        | 中文 | 类型   | 说明                  |
| ------------ | -- | ---- | ------------------- |
| `CREATED`    | 创建 | 可操作态 | 草稿，可自由编辑和删除         |
| `RELEASED`   | 发布 | 可操作态 | 已冻结/派工/排产，产生不可逆执行事实 |
| `RUNNING`    | 执行 | 执行态  | 至少一个下层对象进入执行        |
| `PAUSED`     | 暂停 | 执行态  | 执行被中断，可恢复           |
| `COMPLETED`  | 完成 | 终态   | 正常完结，不可再操作          |
| `TERMINATED` | 作废 | 终态   | 异常终止，不可逆            |

***

## 三、统一动作定义

三层对象统一使用 **7 种动作**（3 种决策型 + 2 种事实型 + 2 种干预型）：

| 动作枚举值            | 中文   | 类型  | 说明                                 |
| ---------------- | ---- | --- | ---------------------------------- |
| `PUBLISH`        | 发布   | 决策型 | 将对象从 CREATED 变为 RELEASED，冻结并生成下层对象 |
| `CANCEL_PUBLISH` | 取消发布 | 决策型 | 回退到 CREATED，清除下发结果                 |
| `START_WORK`     | 开始作业 | 事实型 | 由下层对象状态变更驱动，进入 RUNNING             |
| `FINISH_WORK`    | 完成作业 | 事实型 | 由下层对象状态变更驱动，进入 COMPLETED           |
| `PAUSE`          | 暂停   | 干预型 | 中断执行，可恢复                           |
| `RESUME`         | 恢复执行 | 干预型 | 恢复被中断的执行                           |
| `TERMINATE`      | 作废   | 干预型 | 不可逆终止，进入终态                         |

***

## 四、各层状态语义说明

### 4.1 生产计划（Plan）状态语义

> 计划是宏观调度对象，不直接参与执行。RUNNING / PAUSED / COMPLETED 由订单状态联动上传自动驱动。

| 状态         | 含义                                              | 驱动方式             |
| ---------- | ----------------------------------------------- | ---------------- |
| CREATED    | 草稿态，全部字段可编辑，可删除                                 | —                |
| RELEASED   | 已发布冻结，已按产线拆分生成订单                                | 生产主管手动 PUBLISH   |
| RUNNING    | 至少一个下属订单进入执行                                    | 订单层联动上传          |
| PAUSED     | 所有已执行订单均暂停或终态（排除 CREATED/RELEASED），且至少一个 PAUSED | 订单层联动上传          |
| COMPLETED  | 所有订单均处于终态（COMPLETED 或 TERMINATED），且至少一个正常完成     | 订单层联动上传          |
| TERMINATED | 人工作废（终态，不可逆）                                    | 生产主管手动 TERMINATE |

### 4.2 生产订单（Order）状态语义

> 订单是产线执行的最小调度单元。RUNNING / COMPLETED 由工单状态联动上传自动驱动。

| 状态         | 含义                         | 驱动方式                       |
| ---------- | -------------------------- | -------------------------- |
| CREATED    | 从计划拆分/手动创建，未排产，全部字段可编辑，可删除 | —                          |
| RELEASED   | 已绑定产线/工艺/BOM，已生成工单并派工      | 计划 PUBLISH 联动 / 系统 PUBLISH |
| RUNNING    | 至少一个关键工单开始作业               | 工单层联动上传                    |
| PAUSED     | 执行被中断（人工干预）                | 车间主任/生产主管手动 PAUSE          |
| COMPLETED  | 所有工单完成                     | 工单层联动上传                    |
| TERMINATED | 人工作废（终态，不可逆）               | 车间主任/生产主管手动 TERMINATE      |

### 4.3 工单（WorkOrder）状态语义

> 工单是真正的现场执行单据，由员工现场操作驱动。

| 状态         | 含义              | 驱动方式                       |
| ---------- | --------------- | -------------------------- |
| CREATED    | 待派工，全部字段可编辑，可删除 | —                          |
| RELEASED   | 已派工给员工          | 订单 PUBLISH 联动 / 系统 PUBLISH |
| RUNNING    | 员工确认开始作业        | 员工手动 START\_WORK           |
| PAUSED     | 作业异常中断          | 员工/主管手动 PAUSE              |
| COMPLETED  | 员工确认作业完成        | 员工手动 FINISH\_WORK          |
| TERMINATED | 人工作废（终态，不可逆）    | 主管手动 TERMINATE             |

***

## 五、状态流转总图

```
                PUBLISH          CANCEL_PUBLISH
  CREATED ──────────────────→ RELEASED ←───────────────────┐
     ↑                          │  │                        │
     │           START_WORK ←──┘  │  TERMINATE              │
     │               │            ↓              ┌──────────┤
     │               │       TERMINATED ←────────┤          │
     │               │         (终态)            │          │
     │               ↓                           │          │
     │           RUNNING ─────PAUSE────→ PAUSED  │          │
     │               ↑       ←──RESUME──    │    │          │
     │               │                      │    │          │
     │               │ FINISH_WORK          │    │          │
     │               ↓                      │    │          │
     │           COMPLETED                  │    │          │
     │            (终态)                     │    │          │
     └──────────────────────────────────────┴────┘          │
                                                            │
  (注：各层支持的动作子集不同，详见第六章矩阵)               │
```

***

## 六、各层状态-动作矩阵

### 6.1 计划层（Plan）状态-动作矩阵

| 当前状态 ↓ / 动作 →  | PUBLISH | CANCEL\_PUBLISH | START\_WORK | PAUSE | RESUME | FINISH\_WORK | TERMINATE |
| :------------- | :-----: | :-------------: | :---------: | :---: | :----: | :----------: | :-------: |
| **CREATED**    |   ✅ 主管  |        ❌        |      ❌      |   ❌   |    ❌   |       ❌      |     ❌     |
| **RELEASED**   |    ❌    |       ✅ 主管      |      ❌      |   ❌   |    ❌   |       ❌      |    ✅ 主管   |
| **RUNNING**    |    ❌    |        ❌        |      ❌      |  ✅ 主管 |    ❌   |       ❌      |     ❌     |
| **PAUSED**     |    ❌    |        ❌        |      ❌      |   ❌   |  ✅ 主管  |       ❌      |     ❌     |
| **COMPLETED**  |    ❌    |        ❌        |      ❌      |   ❌   |    ❌   |       ❌      |     ❌     |
| **TERMINATED** |    ❌    |        ❌        |      ❌      |   ❌   |    ❌   |       ❌      |     ❌     |

> **注意**：计划层不支持 `START_WORK` / `FINISH_WORK`，执行态和完成态由订单层联动上传自动驱动。

### 6.2 订单层（Order）状态-动作矩阵

| 当前状态 ↓ / 动作 →  | PUBLISH | CANCEL\_PUBLISH | START\_WORK | PAUSE | RESUME | FINISH\_WORK | TERMINATE |
| :------------- | :-----: | :-------------: | :---------: | :---: | :----: | :----------: | :-------: |
| **CREATED**    |   ✅ 系统  |        ❌        |      ❌      |   ❌   |    ❌   |       ❌      |     ❌     |
| **RELEASED**   |    ❌    |       ✅ 系统      |    ✅ 工单事实   |   ❌   |    ❌   |       ❌      |    ✅ 主管   |
| **RUNNING**    |    ❌    |        ❌        |      ❌      |  ✅ 主管 |    ❌   |    ✅ 工单事实    |     ❌     |
| **PAUSED**     |    ❌    |        ❌        |      ❌      |   ❌   |  ✅ 主管  |       ❌      |     ❌     |
| **COMPLETED**  |    ❌    |        ❌        |      ❌      |   ❌   |    ❌   |       ❌      |     ❌     |
| **TERMINATED** |    ❌    |        ❌        |      ❌      |   ❌   |    ❌   |       ❌      |     ❌     |

> **注意**：
>
> - `PUBLISH` / `CANCEL_PUBLISH` 由计划层联动系统自动触发，订单控制器白名单已拦截，不可通过 API 直接调用
> - `START_WORK` / `FINISH_WORK` 由工单层状态变更联动触发，订单控制器白名单已拦截，不可通过 API 直接调用
> - 仅 `PAUSE` / `RESUME` / `TERMINATE` 可通过 API 由授权用户直接调用

### 6.3 工单层（WorkOrder）状态-动作矩阵

| 当前状态 ↓ / 动作 →  | PUBLISH | CANCEL\_PUBLISH | START\_WORK |  PAUSE  |  RESUME | FINISH\_WORK | TERMINATE |
| :------------- | :-----: | :-------------: | :---------: | :-----: | :-----: | :----------: | :-------: |
| **CREATED**    |   ✅ 系统  |        ❌        |      ❌      |    ❌    |    ❌    |       ❌      |     ❌     |
| **RELEASED**   |    ❌    |       ✅ 系统      |     ✅ 员工    |    ❌    |    ❌    |       ❌      |    ✅ 主管   |
| **RUNNING**    |    ❌    |        ❌        |      ❌      | ✅ 员工/主管 |    ❌    |     ✅ 员工     |     ❌     |
| **PAUSED**     |    ❌    |        ❌        |      ❌      |    ❌    | ✅ 员工/主管 |       ❌      |    ✅ 主管   |
| **COMPLETED**  |    ❌    |        ❌        |      ❌      |    ❌    |    ❌    |       ❌      |     ❌     |
| **TERMINATED** |    ❌    |        ❌        |      ❌      |    ❌    |    ❌    |       ❌      |     ❌     |

> **注意**：
>
> - `PUBLISH` / `CANCEL_PUBLISH` 由订单层联动系统自动触发，工单控制器白名单已拦截，不可通过 API 直接调用
> - 仅 `START_WORK` / `FINISH_WORK` / `PAUSE` / `RESUME` / `TERMINATE` 可通过 API 由授权用户直接调用

***

## 七、权限策略设计

### 7.1 计划层（Plan）权限

> 实现类：`planPermissionPolicy`\
> 所有操作均需 **"生产主管"** 角色。`START_WORK` / `FINISH_WORK` 计划层禁止。

| 动作              | 角色   | API 可调用 | 说明                      |
| --------------- | ---- | :-----: | ----------------------- |
| PUBLISH         | 生产主管 |    ✅    | 生产主管手动触发，冻结计划并联动拆分生成订单  |
| CANCEL\_PUBLISH | 生产主管 |    ✅    | 回退计划到 CREATED，级联作废订单及工单 |
| PAUSE           | 生产主管 |    ✅    | 中断所有订单执行，级联暂停           |
| RESUME          | 生产主管 |    ✅    | 恢复计划执行，级联恢复             |
| TERMINATE       | 生产主管 |    ✅    | 终止计划（终态不可逆），需校验无执行中订单   |
| START\_WORK     | —    |    ❌    | 计划层禁止，由订单层联动驱动          |
| FINISH\_WORK    | —    |    ❌    | 计划层禁止，由订单层联动驱动          |

### 7.2 订单层（Order）权限

> 实现类：`orderPermissionPolicy`\
> 系统联动动作不校验用户角色；人工干预动作需 **"车间主任"** 或 **"生产主管"** 角色。

| 动作              | 角色          | API 可调用 | 说明                              |
| --------------- | ----------- | :-----: | ------------------------------- |
| PUBLISH         | 系统触发        |    ❌    | 由计划发布联动，控制器白名单拦截                |
| CANCEL\_PUBLISH | 系统触发        |    ❌    | 由计划取消发布联动，控制器白名单拦截              |
| PAUSE           | 车间主任 / 生产主管 |    ✅    | 中断订单执行，级联暂停所有 RUNNING 工单        |
| RESUME          | 车间主任 / 生产主管 |    ✅    | 恢复订单执行，级联恢复所有 PAUSED 工单         |
| TERMINATE       | 车间主任 / 生产主管 |    ✅    | 终止订单（终态），需校验无 RUNNING 工单，级联作废工单 |
| START\_WORK     | 工单事实驱动      |    ❌    | 由工单层联动触发，控制器白名单拦截               |
| FINISH\_WORK    | 工单事实驱动      |    ❌    | 由工单层联动触发，控制器白名单拦截               |

### 7.3 工单层（WorkOrder）权限

> 实现类：`workOrderPermissionPolicy`\
> 权限模型区分 **员工**（本工单派工人员）和 **主管**（车间主任/生产主管）两类角色。

| 动作              | 角色      | API 可调用 | 附加校验                                     |
| --------------- | ------- | :-----: | ---------------------------------------- |
| PUBLISH         | 系统触发    |    ❌    | 由订单发布联动，不校验用户角色                          |
| CANCEL\_PUBLISH | 系统触发    |    ❌    | 由订单取消发布联动，不校验用户角色                        |
| START\_WORK     | 员工      |    ✅    | 必须为本工单的派工人员（userId 匹配）                   |
| FINISH\_WORK    | 员工      |    ✅    | 必须为本工单的派工人员（userId 匹配）                   |
| PAUSE           | 员工 / 主管 |    ✅    | 员工需 userId 匹配；主管可跨工单操作                   |
| RESUME          | 员工 / 主管 |    ✅    | 员工需 userId 匹配；主管可跨工单操作                   |
| TERMINATE       | 主管      |    ✅    | 需"车间主任"或"生产主管"角色，仅 RELEASED/PAUSED 状态可执行 |

***

## 八、发布门禁（Gate）设计

> 发布不是简单的状态切换，而是一次**可执行性校验 + 资源绑定决策**。\
> 实现类：`GatePolicy`，提供 `check()`（Plan 级）和 `checkOrder()`（Order 级）两个重载。

### 8.1 计划发布门禁（PUBLISH Gate — Plan 级）

执行顺序：**工艺存在性 → 产线可用性 → 人员可执行性**

| 门禁                       | 校验内容                        | 失败提示                     |
| ------------------------ | --------------------------- | ------------------------ |
| **Process Gate**（工艺存在性）  | 计划是否绑定有效 BOM，BOM 是否关联有效工艺流程 | "发布失败：该产品对应的工艺流程未定义或无效"  |
| **Capacity Gate**（产线可用性） | 工艺流程是否至少有一条匹配的可用产线          | "发布失败：工艺流程没有匹配的可用产线"     |
| **Skill Gate**（人员可执行性）   | 每条工艺流程的每道工序是否至少有一名具备技能的可用员工 | "发布失败：工序「XX」缺少具备技能的可用员工" |

### 8.2 订单发布门禁（PUBLISH Gate — Order 级）

执行顺序：**产线可用性 → 工艺完整性 → 人员可执行性**

| 门禁                       | 校验内容                    | 失败提示                        |
| ------------------------ | ----------------------- | --------------------------- |
| **Capacity Gate**（产线可用性） | 绑定产线是否存在且状态为"空闲"        | "发布校验失败: 产线 XX 不可用或已被占用"    |
| **Process Gate**（工艺完整性）  | 产线是否绑定有效工艺流程            | "发布校验失败: 产线 XX 未绑定有效工艺流程"   |
| **Skill Gate**（人员可执行性）   | 流程中每道工序是否至少有一名具备技能的可用员工 | "发布校验失败: 工序「XX」缺少具备技能的可用员工" |

***

## 九、修改与删除规则

### 9.1 总体原则

> **一旦产生不可逆执行事实（已发布/已派工/已开始作业），禁止删除，只允许受控修改或作废。**

### 9.2 各层详细修改 / 删除规则

#### 生产计划（Plan）

| 状态         | planNo/planName/bomId | planNum | startTime/endTime | priority | remark |  删除 |  作废 |
| ---------- | :-------------------: | :-----: | :---------------: | :------: | :----: | :-: | :-: |
| CREATED    |           ✅           |    ✅    |         ✅         |     ✅    |    ✅   |  ✅  |  ❌  |
| RELEASED   |           ❌           |    ✅    |         ✅         |     ✅    |    ✅   |  ❌  |  ✅  |
| RUNNING    |           ❌           |    ❌    |         ❌         |     ❌    |    ❌   |  ❌  |  ❌  |
| PAUSED     |           ❌           |    ❌    |         ❌         |     ❌    |    ❌   |  ❌  |  ❌  |
| COMPLETED  |           ❌           |    ❌    |         ❌         |     ❌    |    ❌   |  ❌  |  ❌  |
| TERMINATED |           ❌           |    ❌    |         ❌         |     ❌    |    ❌   |  ❌  |  ❌  |

> RELEASED 状态下，即使请求体中传入了 planName 或 bomId，也会被服务端从数据库原值覆盖。

#### 生产订单（Order）

| 状态         | orderName/lineNo/planNo | quantity | startTime/endTime | remark |  删除 |  作废 |
| ---------- | :---------------------: | :------: | :---------------: | :----: | :-: | :-: |
| CREATED    |            ✅            |     ✅    |         ✅         |    ✅   |  ✅  |  ❌  |
| RELEASED   |            ❌            |     ✅    |         ✅         |    ✅   |  ❌  |  ✅  |
| RUNNING    |            ❌            |     ❌    |         ❌         |    ❌   |  ❌  |  ❌  |
| PAUSED     |            ❌            |     ❌    |         ❌         |    ✅   |  ❌  |  ❌  |
| COMPLETED  |            ❌            |     ❌    |         ❌         |    ❌   |  ❌  |  ❌  |
| TERMINATED |            ❌            |     ❌    |         ❌         |    ❌   |  ❌  |  ❌  |

#### 工单（WorkOrder）

| 状态         | userId/processId/isCritical | plannedQuantity | actualQuantity/scrapQuantity | startTime/endTime | remark |  删除 |  作废 |
| ---------- | :-------------------------: | :-------------: | :--------------------------: | :---------------: | :----: | :-: | :-: |
| CREATED    |              ✅              |        ✅        |               ❌              |         ✅         |    ✅   |  ✅  |  ❌  |
| RELEASED   |              ❌              |        ✅        |               ❌              |         ✅         |    ✅   |  ❌  |  ✅  |
| RUNNING    |              ❌              |        ❌        |               ✅              |         ❌         |    ✅   |  ❌  |  ❌  |
| PAUSED     |              ❌              |        ❌        |               ❌              |         ❌         |    ✅   |  ❌  |  ✅  |
| COMPLETED  |              ❌              |        ❌        |               ❌              |         ❌         |    ❌   |  ❌  |  ❌  |
| TERMINATED |              ❌              |        ❌        |               ❌              |         ❌         |    ❌   |  ❌  |  ❌  |

> RUNNING 状态下允许员工上报 `actualQuantity` 和 `scrapQuantity`（现场数据采集）。

***

## 十、三层联动机制

### 10.1 向下联动（Plan → Order → WorkOrder）

计划层状态变更通过 `planStateServiceImpl.handleLinkage()` 向下级联：

| 计划动作                | 订单级联                                                | 工单级联                                       |
| ------------------- | --------------------------------------------------- | ------------------------------------------ |
| **PUBLISH**         | 按 BOM → 工艺流程 → 产线拆分生成 Order（初始状态 CREATED）           | —                                          |
| **PAUSE**           | 将所有 RUNNING 的 Order → PAUSED                        | 将每个 Order 下所有 RUNNING 的 WorkOrder → PAUSED |
| **RESUME**          | 将所有 PAUSED 的 Order → RUNNING                        | 将每个 Order 下所有 PAUSED 的 WorkOrder → RUNNING |
| **CANCEL\_PUBLISH** | 将所有非终态 Order → TERMINATED                           | 将每个 Order 下所有非终态 WorkOrder → TERMINATED    |
| **TERMINATE**       | 将所有非终态 Order → TERMINATED（需前置校验无 RUNNING 状态的 Order） | 将每个 Order 下所有非终态 WorkOrder → TERMINATED    |

### 10.2 向下联动（Order → WorkOrder）

订单层状态变更通过 `orderStateServiceImpl.handleLinkage()` 向下级联，**所有级联操作均包含工单审计记录**：

| 订单动作                | 工单级联处理                                                              |
| ------------------- | ------------------------------------------------------------------- |
| **PUBLISH**         | 按产线→工艺流程→工序→人员自动生成工单，首个工单自动标记为关键工单（isCritical=true），并自动发布为 RELEASED |
| **CANCEL\_PUBLISH** | 作废所有非终态工单（含 CREATED/RELEASED/PAUSED）→ TERMINATED                    |
| **TERMINATE**       | 作废所有非终态工单（含 CREATED/RELEASED/PAUSED）→ TERMINATED                    |
| **PAUSE**           | 暂停所有 RUNNING 状态的工单 → PAUSED                                         |
| **RESUME**          | 恢复所有 PAUSED 状态的工单 → RUNNING                                         |

### 10.3 向上联动（WorkOrder → Order → Plan）

#### 工单 → 订单（通过 `workOrderStateServiceImpl.handleLinkage()`）

仅 **关键工单（isCritical = true）** 触发订单状态聚合：

| 工单状态变更                         | 订单状态联动                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| 任一关键工单 START\_WORK → RUNNING   | 订单首次 → RUNNING（更新 actualStartTime）                                                   |
| 任一关键工单 FINISH\_WORK，且所有工单完成    | 订单 → COMPLETED（汇总工单产量到 order 的 quantityProduced/qualifiedProducts/defectiveProducts） |
| 任一关键工单 PAUSE，且无其他 RUNNING 关键工单 | 订单 → PAUSED                                                                          |
| 任一关键工单 RESUME                  | 订单 → RUNNING（从 PAUSED 恢复）                                                            |

#### 订单 → 计划（通过 `planStateServiceImpl.syncPlanStatusFromOrders()`）

| 订单聚合状态                                                                             | 计划状态变化                          | 额外操作                                                                        |
| ---------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------- |
| 任一订单 RUNNING                                                                       | Plan → RUNNING                  | —                                                                           |
| 所有已执行订单（排除 CREATED/RELEASED）处于 PAUSED/COMPLETED/TERMINATED，且至少一个 PAUSED，且无 RUNNING | Plan → PAUSED（仅当原状态为 RUNNING 时） | —                                                                           |
| 所有订单处于 COMPLETED 或 TERMINATED，且至少一个 COMPLETED                                      | Plan → COMPLETED                | 汇总 COMPLETED 订单的 `quantityProduced` 到 plan 的 `completedNum`（TERMINATED 不计入） |

> **关键设计语义**：
>
> - PAUSED 判定：仅对"已执行"订单（状态 ≠ CREATED 且 ≠ RELEASED）进行判定，避免未发布的草稿订单影响计划状态
> - COMPLETED 判定：将 TERMINATED 视为合法终态，存在作废订单时不阻止剩余订单正常完成。`hasCompleted` 保障至少一个订单正常完成，避免全部 TERMINATED 时误触发 COMPLETED

***

## 十一、操作类型与触发方式汇总

| 类型          | 动作              | Plan 层 | Order 层     | WorkOrder 层 |
| ----------- | --------------- | ------ | ----------- | ----------- |
| **决策型**（人工） | PUBLISH         | 生产主管手动 | 计划联动自动      | 订单联动自动      |
| **决策型**（人工） | CANCEL\_PUBLISH | 生产主管手动 | 计划联动自动      | 订单联动自动      |
| **事实型**（系统） | START\_WORK     | 不适用    | 工单事实驱动      | 员工手动确认      |
| **事实型**（系统） | FINISH\_WORK    | 不适用    | 工单事实驱动      | 员工手动确认      |
| **干预型**（人工） | PAUSE           | 生产主管手动 | 车间主任/生产主管手动 | 员工/主管手动     |
| **干预型**（人工） | RESUME          | 生产主管手动 | 车间主任/生产主管手动 | 员工/主管手动     |
| **干预型**（人工） | TERMINATE       | 生产主管手动 | 车间主任/生产主管手动 | 主管手动        |

***

## 十二、API 调用白名单

各层控制器内置白名单机制，限制可通过 API 直接调用的 Action：

| 层级            | 白名单 Action                                          | 拦截原因                                                               |
| ------------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| **Plan**      | PUBLISH, CANCEL\_PUBLISH, PAUSE, RESUME, TERMINATE  | START\_WORK/FINISH\_WORK 由订单层联动驱动                                  |
| **Order**     | PAUSE, RESUME, TERMINATE                            | PUBLISH/CANCEL\_PUBLISH 由计划层联动驱动；START\_WORK/FINISH\_WORK 由工单层联动驱动 |
| **WorkOrder** | START\_WORK, FINISH\_WORK, PAUSE, RESUME, TERMINATE | PUBLISH/CANCEL\_PUBLISH 由订单层联动驱动                                   |

***

## 十三、设计核心原则总结

> 1. **状态不是按钮点出来的，而是事实与规则推导出来的** — 执行态和完成态由下层事实联动上传，不由用户直接操作
> 2. **发布是管理承诺，执行是现场事实** — PUBLISH 由决策者触发并经过门禁校验；START\_WORK/FINISH\_WORK 由现场事实驱动
> 3. **删除只发生在"尚未影响任何人"之前** — 仅 CREATED 状态可删除，一旦发布即禁止删除只允许作废
> 4. **越靠近现场，权限越细致** — Plan 层只需生产主管；Order 层区分车间主任/生产主管；WorkOrder 层区分员工/主管，且员工需 userId 匹配
> 5. **所有人工干预都必须可审计、可回溯** — 每次状态变更通过 AuditService 记录审计日志，无论从哪一层触发
> 6. **级联链路完整且无循环** — Plan 主动级联使用直接 DB 更新，避免通过 Order 服务层触发 `syncPlanStatusFromOrders` 造成循环回写

***

## 十四、核心类与文件对照

| 层级        | 类名                                                                             | 职责                                           |
| --------- | ------------------------------------------------------------------------------ | -------------------------------------------- |
| **枚举**    | `StateEnum`（6 状态）/ `ActionEnum`（7 动作）                                          | 三层共享的状态和动作定义                                 |
| **状态上下文** | `StateContext(bizNo, action, userId)`                                          | 状态变更上下文对象，在服务层/策略层/审计层间传递                    |
| **状态机**   | `planStateMachine` / `orderStateMachine` / `workOrderStateMachine`             | 纯规则校验器，定义各状态下允许的动作集合                         |
| **权限策略**  | `planPermissionPolicy` / `orderPermissionPolicy` / `workOrderPermissionPolicy` | 各层权限校验，实现 `PermissionPolicy` 接口              |
| **门禁**    | `GatePolicy.check()` / `GatePolicy.checkOrder()`                               | 发布门禁校验（工艺→产线→人员）                             |
| **状态服务**  | `planStateServiceImpl` / `orderStateServiceImpl` / `workOrderStateServiceImpl` | 管道处理（权限→状态机→门禁→持久化→审计→联动）                    |
| **审计**    | `AuditService.record(targetType, context, from, to)`                           | 状态变更审计记录，支持 PLAN/ORDER/WORK\_ORDER 类型        |
| **控制器**   | `planController` / `orderController` / `workOrderController`                   | REST API，userId 从 JWT Token 解析，内置 Action 白名单 |

***

> **文档维护**：本设计文档应与代码同步更新。状态流转规则变更时，需同步更新本文档、各 API 接口文档和状态机配置。

