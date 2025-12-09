<template>
    <!-- 复用的新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑工序' : '新增工序'" width="820px" @close="handleClose"
        :before-close="beforeClose">
        <el-form :model="localFormData" :rules="formRules" ref="formRef" label-width="120px" class="process-form">
            <el-row :gutter="20">
                <el-col :xs="24" :sm="24" :md="14">
                    <div class="panel">
                        <div class="panel-title">基本信息</div>
                        <el-form-item label="工序名称" prop="processName">
                            <el-input v-model="localFormData.processName" placeholder="请输入工序名称"
                                :disabled="disabledFields.includes('processName')" />
                        </el-form-item>
                        <el-form-item label="计划工时" prop="plannedWorkingHours">
                            <el-input v-model="localFormData.plannedWorkingHours" placeholder="小时" type="number"
                                :disabled="disabledFields.includes('plannedWorkingHours')" />
                        </el-form-item>
                        <el-form-item label="包含工步" prop="workStepId">
                            <el-select v-model="localFormData.workStepId" multiple placeholder="请选择工步"
                                :disabled="disabledFields.includes('workStepId')" @change="onWorkStepChange"
                                style="width: 100%">
                                <el-option v-for="item in stepStore.stepList" :key="item.id" :label="item.name"
                                    :value="item.id" />
                            </el-select>
                        </el-form-item>
                        <el-button type="success" @click="handleAddStep" :disabled="!allowAddStep">
                            + &nbsp; 创建工步
                        </el-button>
                    </div>
                    <div class="panel mt">
                        <div class="panel-title">描述 / 质量检查点</div>
                        <el-form-item label="描述" prop="description">
                            <el-input type="textarea" v-model="localFormData.description" :rows="4"
                                placeholder="工序描述（可选）" :disabled="disabledFields.includes('description')" />
                        </el-form-item>
                        <el-form-item label="质量检查点" prop="qualityControlPoint">
                            <el-input type="textarea" v-model="localFormData.qualityControlPoint" :rows="4"
                                placeholder="质量检查点（可选）" :disabled="disabledFields.includes('qualityControlPoint')" />
                        </el-form-item>
                    </div>
                </el-col>

                <el-col :xs="24" :sm="24" :md="10">
                    <div class="panel">
                        <div class="panel-title">物料选择</div>
                        <el-form-item label="输入物料" prop="inputBomId">
                            <el-select v-model="localFormData.inputBomId" multiple placeholder="请选择输入物料"
                                :disabled="disabledFields.includes('inputBomId')" style="width: 100%">
                                <el-option v-for="item in bomStore.flattenedBomData" :key="item.id" :label="item.label"
                                    :value="item.id" />
                            </el-select>
                        </el-form-item>

                        <el-form-item label="输出物料" prop="outputBomId">
                            <el-select v-model="localFormData.outputBomId" multiple placeholder="请选择输出物料"
                                :disabled="disabledFields.includes('outputBomId')" style="width: 100%">
                                <el-option v-for="item in bomStore.flattenedBomData" :key="item.id" :label="item.label"
                                    :value="item.id" />
                            </el-select>
                        </el-form-item>
                    </div>

                    <div class="panel mt">
                        <div class="panel-title">操作</div>
                        <div class="dialog-actions">
                            <el-button @click="handleClose">取消</el-button>
                            <el-button type="primary" @click="submitForm" :loading="submitLoading">
                                提交
                            </el-button>
                        </div>
                    </div>
                </el-col>
            </el-row>
        </el-form>
    </el-dialog>

    <!-- 创建新工步 -->
    <StepFormDialog v-model="stepDialogVisible" :form-data="stepFormData" :equipment-list="equipmentStore.equipmentList"
        :is-edit="false" :on-submit="performSubmit" @submit-success="onSubmitSuccess"
        @update:model-value="handleStepDialogUpdate" />
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, nextTick, onMounted } from 'vue'
import { addStepApi } from '@/api/step'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import StepFormDialog from '@/components/step/StepFormDialog.vue'
import { useStepStore } from '@/stores/step'
import { useBomStore } from '@/stores/bom'
import { useEquipmentStore } from '@/stores/equipment'

// 定义组件 props
interface Props {
    modelValue: boolean // 控制对话框显示/隐藏
    formData?: ProcessFormData // 传递的表单数据
    isEdit?: boolean // 是否为编辑模式
    disabledFields?: string[] // 禁用的字段列表
    allowAddStep?: boolean // 是否允许添加工步
    // 可以根据需要添加更多配置项
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    formData: () => ({
        id: null,
        processName: '',
        plannedWorkingHours: null,
        description: '',
        qualityControlPoint: '',
        inputBomId: [],
        outputBomId: [],
        workStepId: []
    }),
    isEdit: false,
    disabledFields: () => [],
    allowAddStep: true
})

// 定义组件 emits
interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'submit-success', data: any): void
    (e: 'submit-fail', error: any): void
    (e: 'before-submit', data: any): void
}

const emit = defineEmits<Emits>()

// 使用 stores
const stepStore = useStepStore()
const bomStore = useBomStore()
const equipmentStore = useEquipmentStore()

// 响应式数据
const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

const localFormData = reactive<ProcessFormData>({ ...JSON.parse(JSON.stringify(props.formData)) })

// 表单验证规则
const formRules: FormRules = {
    processName: [
        { required: true, message: '请输入工序名称', trigger: 'blur' },
        { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
    ],
    plannedWorkingHours: [
        {
            validator: (rule, value, callback) => {
                if (value !== null && value !== undefined && value !== '') {
                    if (isNaN(Number(value)) || Number(value) <= 0) {
                        callback(new Error('计划工时必须大于0'))
                    } else {
                        callback()
                    }
                } else {
                    callback()
                }
            },
            trigger: 'blur'
        }
    ],
    workStepId: [
        {
            validator: (rule, value, callback) => {
                if (Array.isArray(value) && value.length === 0) {
                    callback(new Error('请选择至少一个工步'))
                } else {
                    callback()
                }
            },
            trigger: 'change'
        }
    ]
}

// 其他响应式数据
const formRef = ref<FormInstance>()
const submitLoading = ref(false)
const stepDialogVisible = ref(false)
const stepFormData = ref({
    id: null,
    name: '',
    description: '',
    equipmentId: null,
    functionId: null
})

// 监听 props.formData 的变化，但只在对话框打开时更新
watch(() => props.formData, (newVal) => {
    if (props.modelValue) { // 只在对话框打开时同步数据
        Object.assign(localFormData, { ...JSON.parse(JSON.stringify(newVal)) })
    }
}, { deep: true })

// 监听 isEdit 变化
watch(() => props.isEdit, (newVal) => {
    // 可以在这里添加编辑模式相关的逻辑
})

// 工步选择变化事件
const onWorkStepChange = (value: any) => {
    // 可以在这里添加工步选择变化的处理逻辑
    console.log('Selected work steps:', value)
}

// 提交表单
const submitForm = async () => {
    if (!formRef.value) return

    try {
        await formRef.value.validate()

        // 发送提交前事件
        emit('before-submit', { ...localFormData })

        submitLoading.value = true

        // 准备提交数据
        const payload = {
            id: localFormData.id,
            processName: localFormData.processName,
            plannedWorkingHours: localFormData.plannedWorkingHours,
            description: localFormData.description,
            qualityControlPoint: localFormData.qualityControlPoint,
            inputBomId: Array.isArray(localFormData.inputBomId)
                ? localFormData.inputBomId
                : localFormData.inputBomId ? [localFormData.inputBomId] : [],
            outputBomId: Array.isArray(localFormData.outputBomId)
                ? localFormData.outputBomId
                : localFormData.outputBomId ? [localFormData.outputBomId] : [],
            workStepId: Array.isArray(localFormData.workStepId)
                ? localFormData.workStepId
                : localFormData.workStepId ? [localFormData.workStepId] : []
        }
        // 暂时返回数据供父组件处理
        emit('submit-success', payload)
        handleClose()

    } catch (error) {
        console.error('Form validation failed:', error)
        emit('submit-fail', error)
    } finally {
        submitLoading.value = false
    }
}

// 关闭对话框
const handleClose = () => {
    dialogVisible.value = false
    resetForm()
}

// 关闭前的确认
const beforeClose = (done: () => void) => {
    // 可以添加表单未保存的确认逻辑
    ElMessageBox.confirm('确定要关闭吗？未保存的数据将会丢失。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        done()
        resetForm()
    }).catch(() => {
        // 取消关闭
    })
}

// 重置表单
const resetForm = () => {
    if (props.isEdit) {
        // 编辑模式：恢复到初始传入的数据状态
        Object.assign(localFormData, { ...JSON.parse(JSON.stringify(props.formData)) })
    } else {
        // 新增模式：清空数据
        Object.assign(localFormData, {
            id: null,
            processName: '',
            plannedWorkingHours: null,
            description: '',
            qualityControlPoint: '',
            inputBomId: [],
            outputBomId: [],
            workStepId: []
        })
    }

    if (formRef.value) {
        formRef.value.clearValidate()
    }
    submitLoading.value = false
}

// 创建新工步 - 只打开对话框，不重置表单数据
const handleAddStep = () => {
    // 重置工步表单数据，而不是工序表单数据
    Object.assign(stepFormData.value, {
        id: null,
        name: '',
        description: '',
        equipmentId: null,
        functionId: null
    })

    stepDialogVisible.value = true
}

// 执行实际的 API 提交操作
const performSubmit = async (submitData: any) => {
    try {
        const result: any = await addStepApi(submitData)
        if (result.code !== 200) {
            throw new Error(result.message || '操作失败')
        }
        return result
    } catch (error) {
        console.error('Add step failed:', error)
        throw error
    }
}

// 工步提交成功后的处理
const onSubmitSuccess = () => {
    ElMessage.success('新增工步成功')
    stepStore.loadAllSteps // 重新加载所有工步数据
    // 重置工步表单数据
    Object.assign(stepFormData.value, {
        id: null,
        name: '',
        description: '',
        equipmentId: null,
        functionId: null
    })
}

// 工步对话框更新事件
const handleStepDialogUpdate = (value: boolean) => {
    stepDialogVisible.value = value
}

// 定义表单数据类型
interface ProcessFormData {
    id: number | null
    processName: string
    plannedWorkingHours: number | null
    description: string
    qualityControlPoint: string
    inputBomId: (number | string)[]
    outputBomId: (number | string)[]
    workStepId: (number | string)[]
}

// 暴露方法给父组件（如果需要）
defineExpose({
    resetForm,
    validate: () => formRef.value?.validate(),
    clearValidate: () => formRef.value?.clearValidate()
})
</script>

<style scoped>
/* 样式保持不变 */
.search-area {
    background: #ffffff;
    padding: 20px 25px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    margin-bottom: 25px;
}

.search-form {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.result-area {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
    max-height: 600px;
    overflow-y: auto;
    padding-right: 8px;
    margin-bottom: 20px;
    background-color: #ffffff;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.result-area::-webkit-scrollbar {
    width: 8px;
}

.result-area::-webkit-scrollbar-thumb {
    background-color: rgba(144, 147, 153, 0.4);
    border-radius: 4px;
}

.result-area::-webkit-scrollbar-thumb:hover {
    background-color: rgba(144, 147, 153, 0.6);
}

.card-wrapper {
    display: flex;
    justify-content: center;
}

.pagination-area {
    display: flex;
    justify-content: center;
    margin-top: 15px;
}

/* 操作按钮区样式 */
.action-area {
    margin-bottom: 15px;
    display: flex;
    gap: 10px;
}

.process-form .el-form-item {
    margin-bottom: 12px;
}

.panel {
    background: #fff;
    border-radius: 8px;
    padding: 12px 14px;
    box-shadow: 0 1px 6px rgba(22, 27, 34, 0.06);
    border: 1px solid rgba(22, 27, 34, 0.04);
}

.panel-title {
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
    font-size: 14px;
}

.mt {
    margin-top: 12px;
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 6px;
}

/* 响应式：较窄屏幕时面板垂直堆叠，dialog 变窄 */
@media (max-width: 768px) {
    .el-dialog {
        width: 92% !important;
    }

    .panel {
        padding: 10px;
    }
}
</style>