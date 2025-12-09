<!-- StepFormDialog.vue -->
<template>
    <!-- 复用的新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑工步' : '新增工步'" width="500px" @close="resetForm">
        <el-form :rules="rules" ref="stepFormRef" :model="formData" label-width="100px">
            <el-form-item label="工步名称" prop="name">
                <el-input v-model="formData.name" />
            </el-form-item>
            <el-form-item label="设备" prop="equipmentId">
                <el-select v-model="formData.equipmentId" placeholder="请选择设备" @change="onEquipmentChange">
                    <el-option v-for="item in equipmentList" :key="item.id" :label="item.name + item.model"
                        :value="item.id" />
                </el-select>
            </el-form-item>
            <el-form-item label="功能" prop="functionId">
                <el-select v-model="formData.functionId" placeholder="请选择设备功能">
                    <el-option v-for="func in getFunctionList(formData.equipmentId)" :key="func.id"
                        :label="func.functionDescription" :value="func.id" />
                </el-select>
            </el-form-item>
            <el-form-item label="描述">
                <el-input type="textarea" v-model="formData.description" :rows="5" />
            </el-form-item>
        </el-form>

        <template #footer>
            <el-button @click="handleCancel">取消</el-button>
            <el-button type="primary" @click="submitForm">提交</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { storeToRefs } from 'pinia';
import { useEquipmentStore } from '@/stores/equipment';

// 定义 props 接收数据和方法
const props = defineProps({
    modelValue: { // 用于控制对话框显示/隐藏
        type: Boolean,
        default: false
    },
    formData: { // 表单数据对象
        type: Object,
        required: true
    },
    equipmentList: { // 设备列表
        type: Array,
        required: true
    },
    isEdit: { // 是否为编辑模式
        type: Boolean,
        default: false
    },
    // 提交方法，由父组件传入
    onSubmit: {
        type: Function,
        required: true
    }
});

// 定义 emits 用于向父组件传递事件
const emit = defineEmits(['update:modelValue', 'submitSuccess', 'cancel']);

// 使用 ref 包装 props 以便在模板中使用
const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const formData = computed(() => props.formData);

// 表单引用
const stepFormRef = ref(null);

// 查找设备功能
const getFunctionList = (equipmentId) => {
    const equipment = props.equipmentList.find(e => e.id === equipmentId);
    return equipment && equipment.description ? equipment.description : [];
};

// 设备改变时，清空功能选择
const onEquipmentChange = () => {
    // 直接修改 formData，因为它是从父组件传来的引用
    props.formData.functionId = null;
};

// 表单校验规则
const rules = ref({
    name: [
        { required: true, message: '请输入工步名', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    equipmentId: [
        { required: true, message: '请选择设备', trigger: 'blur' },
    ],
    functionId: [
        { required: true, message: '请选择设备功能', trigger: 'blur' }
    ]
});

// 提交表单（新增/编辑复用）
const submitForm = async () => {
    if (stepFormRef.value) {
        stepFormRef.value.validate(async (valid) => {
            if (valid) { // 验证通过
                try {
                    await props.onSubmit({ ...props.formData, isEdit: props.isEdit }); // 调用父组件传入的提交方法
                    emit('submitSuccess'); // 提交成功后通知父组件
                    dialogVisible.value = false; // 关闭对话框
                } catch (error) {
                    console.error('提交失败:', error);
                    ElMessage.error('提交失败，请稍后重试');
                }
            }
        });
    }
};

// 取消按钮处理
const handleCancel = () => {
    emit('cancel'); // 通知父组件取消事件
    dialogVisible.value = false; // 关闭对话框
};

// 清空表单（当对话框关闭时）
const resetForm = () => {
    if (stepFormRef.value) {
        stepFormRef.value.clearValidate();
    }
    // 注意：这里不能直接修改 props.formData，需要通过 emit 通知父组件重置
    // 或者在父组件监听 update:modelValue 事件，当值变为 false 时重置
    // 为了简单，我们依赖父组件在关闭时重置数据
    // emit('resetForm'); // 可选，如果需要父组件重置数据
};
</script>

<style scoped>
/* 如果需要特定样式，可以在这里添加 */
</style>