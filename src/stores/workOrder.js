// src/stores/workOrder.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getWorkOrderListApi } from '@/api/workOrder'

export const useWorkOrderStore = defineStore('workOrder', () => {
  // state — 工单列表
  const workOrderList = ref([])

  // actions
  // 从 API 加载所有工单
  const loadAllWorkOrders = async () => {
    const result = await getWorkOrderListApi()
    if (result.code === 200) {
      workOrderList.value = result.data
    }
  }

  // 本地新增工单
  const addWorkOrder = (workOrder) => {
    workOrderList.value.push(workOrder)
  }

  // 本地更新工单（按 workOrderNo 匹配）
  const updateWorkOrder = (updatedWorkOrder) => {
    const index = workOrderList.value.findIndex(
      w => w.workOrderNo === updatedWorkOrder.workOrderNo
    )
    if (index !== -1) {
      workOrderList.value[index] = updatedWorkOrder
    }
  }

  // 本地删除工单（按 workOrderNo 列表）
  const deleteWorkOrders = (workOrderNos) => {
    workOrderList.value = workOrderList.value.filter(
      w => !workOrderNos.includes(w.workOrderNo)
    )
  }

  return {
    workOrderList,
    loadAllWorkOrders,
    addWorkOrder,
    updateWorkOrder,
    deleteWorkOrders
  }
})
