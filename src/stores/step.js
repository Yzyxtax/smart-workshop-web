import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getAllStepApi } from '@/api/step'

export const useStepStore = defineStore('step', () => {
    //数据state
    const stepList = ref([])
    //getter

    //actions
    //查询所有工步信息
    const loadAllSteps = async () => {
        const result = await getAllStepApi()
        if (result.code === 200) {
            stepList.value = result.data
        }
    }
    //添加工步信息
    const addStep = (step) => {
        stepList.value.push(step)
    }
    //修改工步信息
    const updateStep = (updatedStep) => {
        const index = stepList.value.findIndex(step => step.id === updatedStep.id)
        if (index !== -1) {
            stepList.value[index] = updatedStep
        }
    }
    //删除工步信息
    const deleteSteps = (ids) => {
        stepList.value = stepList.value.filter(step => !ids.includes(step.id))
    }

    return { stepList, loadAllSteps, addStep, updateStep, deleteSteps }
})