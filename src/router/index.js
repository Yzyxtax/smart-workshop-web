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
// AI 智能助手模块
import aiAuditView from '@/views/aiAudit/index.vue'
import aiMetricsView from '@/views/aiMetrics/index.vue'
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
        // AI 智能助手模块
        { path: 'aiAudit', name: 'aiAudit', component: aiAuditView },
        { path: 'aiMetrics', name: 'aiMetrics', component: aiMetricsView },
      ]
    },
    { path: '/login', name: 'login', component: loginView },
  ],
})

export default router
