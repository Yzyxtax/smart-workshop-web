import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getOrderListApi } from '@/api/order'

export const useOrderStore = defineStore('order', () => {
  // state — 订单列表
  const orderList = ref([])

  // actions
  // 从 API 加载所有订单
  const loadAllOrders = async () => {
    const result = await getOrderListApi()
    if (result.code === 200) {
      orderList.value = result.data
    }
  }

  // 本地新增订单
  const addOrder = (order) => {
    orderList.value.push(order)
  }

  // 本地更新订单（按 orderNo 匹配）
  const updateOrder = (updatedOrder) => {
    const index = orderList.value.findIndex(o => o.orderNo === updatedOrder.orderNo)
    if (index !== -1) {
      orderList.value[index] = updatedOrder
    }
  }

  // 本地删除订单（按 orderNo 列表）
  const deleteOrders = (orderNos) => {
    orderList.value = orderList.value.filter(o => !orderNos.includes(o.orderNo))
  }

  return {
    orderList,
    loadAllOrders,
    addOrder,
    updateOrder,
    deleteOrders
  }
})
