import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getAllProcessApi } from '@/api/process'

export const useProcessStore = defineStore('process', () => {
    //state
    const processList = ref([])
    //getters

    //actions
    //查询所有工序信息
    const loadAllProcesses = async () => {
        const result = await getAllProcessApi()
        if (result.code === 200) {
            processList.value = result.data
        }
    }
    //添加工序信息
    const addProcess = (process) => {
        processList.value.push(process)
    }
    //修改工序信息
    const updateProcess = (updatedProcess) => {
        const index = processList.value.findIndex(process => process.id === updatedProcess.id)
        if (index !== -1) {
            processList.value[index] = updatedProcess
        }
    }
    //删除工序信息
    const deleteProcesses = (ids) => {
        processList.value = processList.value.filter(process => !ids.includes(process.id))
    }

    return {
        processList,
        loadAllProcesses,
        addProcess,
        updateProcess,
        deleteProcesses
    }
})