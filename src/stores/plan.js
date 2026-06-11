// src/stores/plan.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getPlanListApi } from '@/api/plan'

export const usePlanStore = defineStore('plan', () => {
  // state — 计划列表
  const planList = ref([])

  // actions
  // 从 API 加载所有计划
  const loadAllPlans = async () => {
    const result = await getPlanListApi()
    if (result.code === 200) {
      planList.value = result.data
    }
  }

  // 本地新增计划
  const addPlan = (plan) => {
    planList.value.push(plan)
  }

  // 本地更新计划（按 planNo 匹配）
  const updatePlan = (updatedPlan) => {
    const index = planList.value.findIndex(p => p.planNo === updatedPlan.planNo)
    if (index !== -1) {
      planList.value[index] = updatedPlan
    }
  }

  // 本地删除计划（按 planNo 列表）
  const deletePlans = (planNos) => {
    planList.value = planList.value.filter(p => !planNos.includes(p.planNo))
  }

  return {
    planList,
    loadAllPlans,
    addPlan,
    updatePlan,
    deletePlans
  }
})
