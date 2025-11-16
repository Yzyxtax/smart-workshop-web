<template>
    <div>
        <el-form :inline="true" :model="newChild" ref="ruleFormRef" :rules="rules" label-width="auto">
            <el-form-item label="名称及型号" prop="nameSpecification">
                <el-input v-model="newChild.nameSpecification" />
            </el-form-item>
            <el-form-item label="图号">
                <el-input v-model="newChild.drawingNo" />
            </el-form-item>
            <el-form-item label="材料">
                <el-input v-model="newChild.material" />
            </el-form-item>
            <el-form-item label="数量" prop="quantity">
                <el-input v-model="newChild.quantity" />
            </el-form-item>
            <el-form-item label="单件重量" prop="unitWeight">
                <el-input v-model="newChild.unitWeight" />
            </el-form-item>
            <el-form-item label="类型" prop="type" label-width="100px">
                <el-select v-model="newChild.type" placeholder="类型">
                    <el-option label="自制件" value="自制件" />
                    <el-option label="组合件" value="组合件" />
                    <el-option label="外购件" value="外购件" />
                </el-select>
            </el-form-item>
        </el-form>
    </div>
    <div class="button-area">
        <HoverButton color="#409eff" text="提交" icon="save" icon-color="white" @press="save" />
        <HoverButton color="#909399" text="取消" icon="close" icon-color="white" @press="cancel" />
    </div>
</template>

<script setup name="BomInsert">
import HoverButton from '../HoverButton.vue';
import { watch, ref, reactive } from 'vue';

const props = defineProps(['parentId'])
const emit = defineEmits(['cancel', 'submit'])
const newChild = ref({
    id: null,
    parentId: props.parentId,
    drawingNo: '',
    nameSpecification: '',
    material: '',
    quantity: '',
    unitWeight: '',
    type: ''
})
// 同步父组件传入的 parentId（父组件每次点击可能会变）
watch(() => props.parentId, (v) => {
    newChild.parentId = v
})

const ruleFormRef = ref();
const rules = reactive({
    nameSpecification: [
        { required: true, message: '名称及型号是必填项', trigger: 'blur' }
    ],
    quantity: [//必须是数字类型且为整数，数字大于0
        { required: true, message: '数量是必填项', trigger: 'blur' },
        { validator: quantityValidator, trigger: 'blur' }
    ],
    unitWeight: [//必须是数字类型，数字大于0
        { required: true, message: '单件重量是必填项', trigger: 'blur' },
        { validator: unitWeightValidator, trigger: 'blur' }
    ],
    type: [
        { required: true, message: '类型是必填项', trigger: 'change' }
    ]
})
//自定义数量验证规则
function quantityValidator(rule, value, callback) {
    if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
        callback(new Error('数量必须是大于0的整数'));
    } else {
        callback();
    }
}
//自定义单件重量验证规则
function unitWeightValidator(rule, value, callback) {
    if (isNaN(Number(value)) || Number(value) <= 0) {
        callback(new Error('单件重量必须是大于零的数字'));
    } else {
        callback();
    }
}
// 保存按钮点击事件
const save = () => {
    //表单校验
    if (!ruleFormRef.value) {
        return;
    }
    ruleFormRef.value.validate((valid) => {
        if (valid) {
            //发送数据给父组件
            emit('submit', newChild.value);
        }
    })
}

//取消按钮
const cancel = () => {
    emit('cancel');
}
</script>

<style>
/* 按钮布局 */
.button-area {
    display: flex;
    justify-content: space-around;
}
</style>