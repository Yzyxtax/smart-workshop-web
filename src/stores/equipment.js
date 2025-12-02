
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getAllEquipmentApi } from '@/api/equipment'

export const useEquipmentStore = defineStore('equipment', () => {
    //数据state
    const equipmentList = ref([])

    //getter

    //actions
    //获取所有设备信息
    const loadEquipmentData = async () => {
        const result = await getAllEquipmentApi()
        if (result.code === 200) {
            equipmentList.value = result.data
        }
    }
    //添加设备信息
    const insertEquipment = (equipment) => {
        equipmentList.value.push(equipment)
    }
    //更新设备信息
    const updateEquipment = (updatedEquipment) => {
        const index = equipmentList.value.findIndex(
            (eq) => eq.id === updatedEquipment.id
        )
        if (index !== -1) {
            equipmentList.value[index] = updatedEquipment
        }
    }
    //删除设备信息
    const deleteEquipment = (id) => {
        equipmentList.value = equipmentList.value.filter((eq) => eq.id !== id)
    }
    return { equipmentList, loadEquipmentData, insertEquipment, updateEquipment, deleteEquipment }
})