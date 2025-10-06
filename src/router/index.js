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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: layoutView,
      redirect: '/bom',
      children: [
        {path: 'bom' ,component: bomView},
        {path: 'equipment' ,component: equipmentView},
        {path: 'line' ,component: lineView},
        {path: 'team' ,component: teamView},
        {path: 'user' ,component: userView},
        {path: 'flows' ,component: flowsView},
        {path: 'process' ,component: processView},
        {path: 'step' ,component: stepView},
      ]
    },
    {path: '/login' ,component: loginView},
  ],
})

export default router
