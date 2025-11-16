
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
        if (equipmentList.value.length > 0) {
            return
        }
        const result = await getAllEquipmentApi()
        if (result.code === 200) {
            equipmentList.value = result.data
        }
    }
    return { equipmentList, loadEquipmentData }
})