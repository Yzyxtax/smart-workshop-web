import { createRouter, createWebHistory } from 'vue-router'

import bomView from '@/views/bom/index.vue'
import equipmentView from '@/views/equipment/index.vue'
import lineView from '@/views/line/index.vue'
import teamView from '@/views/team/index.vue'
import userView from '@/views/user/index.vue'
import flowsView from '@/views/flows/index.vue'
import processView from '@/views/process/index.vue'
import stepView from '@/views/step/index.vue'
import loginView from '@/views/login/index.vue'
import layoutView from '@/views/layout/index.vue'
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
      ]
    },
    { path: '/login', name: 'login', component: loginView },
  ],
})

export default router
