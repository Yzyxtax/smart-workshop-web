<template>
    <div class="affixBox">
        <el-form :model="bomValue" ref="ruleFormRef" :rules="rules" label-width="auto">
            <el-form-item label="名称及型号" prop="nameSpecification">
                <el-input v-model="bomValue.nameSpecification" />
            </el-form-item>
            <el-form-item label="图号">
                <el-input v-model="bomValue.drawingNo" />
            </el-form-item>
            <el-form-item label="材料">
                <el-input v-model="bomValue.material" />
            </el-form-item>
            <el-form-item label="数量" prop="quantity">
                <el-input v-model="bomValue.quantity" />
            </el-form-item>
            <el-form-item label="单件重量" prop="unitWeight">
                <el-input v-model="bomValue.unitWeight" />
            </el-form-item>
            <el-form-item label="类型" prop="type">
                <el-select v-model="bomValue.type" placeholder="类型">
                    <el-option label="自制件" value="自制件" />
                    <el-option label="组合件" value="组合件" />
                    <el-option label="外购件" value="外购件" />
                </el-select>
            </el-form-item>
        </el-form>
        <HoverButton color="#409eff" text="保存" icon="save" icon-color="white" class="buttonStyle" @press="save" />
    </div>
</template>

<script setup name="BomContent">
import { ElMessage } from 'element-plus';
import { getBomByIdApi, saveBomApi } from '@/api/bom';
import { reactive, ref, watch } from 'vue';
import HoverButton from '../HoverButton.vue';

// 存储BOM详情数据
const bomValue = ref({
    id: '',
    parentId: '',
    drawingNo: '',
    nameSpecification: '',
    material: '',
    quantity: '',
    unitWeight: '',
    type: ''
});

// 定义接收的props
const props = defineProps(['clickId']);

// 根据ID查询BOM详情
const search = async (id) => {
    if (!id) {
        ElMessage.warning('未选择节点');
        return;
    }
    const result = await getBomByIdApi(id);
    if (result.code === 200) {
        bomValue.value = result.data;
    }
}
// 侦听 clickId 变化
watch(() => props.clickId, (newId) => {
    // 当 clickId 变化时，重新执行查询
    search(newId);
}, { immediate: true } // immediate: true 表示在初始绑定时也执行一次
);

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
    ruleFormRef.value.validate(async (valid) => {
        if (valid) {
            const result = await saveBomApi(bomValue.value);
            if (result.code === 200) {
                ElMessage.success('保存成功');
            }
        } else {
            ElMessage.error('表单验证失败，请检查输入项');
            return;
        }
    })
}
</script>

<style scoped>
.affixBox {
    position: fixed;
    z-index: 2000;
    max-width: 360px;
    width: calc(100% - 32px);
}

.buttonStyle {
    margin: 0 190px;
}
</style>