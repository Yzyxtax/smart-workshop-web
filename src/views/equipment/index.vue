<template>
    <div class="page">
        <h1>设备管理</h1>
    </div>
    <div class="container">
        <!-- 搜索栏 -->
        <el-form :inline="true" :model="searchEquipment" class="demo-form-inline">
            <el-form-item label="名称">
                <el-input v-model="searchEquipment.name" placeholder="请输入名称" clearable />
            </el-form-item>
            <el-form-item label="设备类型">
                <el-input v-model="searchEquipment.type" placeholder="请输入设备类型" clearable />
            </el-form-item>
            <el-form-item label="型号">
                <el-input v-model="searchEquipment.model" placeholder="请输入型号" clearable />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="search">查询</el-button>
                <el-button type="info" @click="clear">清空</el-button>
            </el-form-item>
        </el-form>
    </div>
    <!-- 数据展示表格 -->
    <div>
        <el-button type="primary" @click="addEquipment">+ &nbsp;新增设备</el-button>
        <el-button type="danger" @click="deleteByIds">- &nbsp;批量删除</el-button>
    </div>
    <div class="container">
        <el-table :data="equipmentList" border style="width: 100%" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column prop="name" label="设备名称" width="180" align="center" />
            <el-table-column prop="type" label="设备类型" width="180" align="center" />
            <el-table-column prop="model" label="设备型号" width="180" align="center" />
            <el-table-column prop="productionDate" label="生产日期" width="180" align="center" />
            <el-table-column prop="manufacturer" label="生产商" width="180" align="center" />
            <el-table-column label="操作" align="center">
                <template #default="scope">
                    <el-button type="primary" size="small" @click="edit(scope.row.id)"><el-icon>
                            <Edit />
                        </el-icon> &nbsp; 编辑</el-button>
                    <el-button type="danger" size="small" @click="deleteById(scope.row.id)"><el-icon>
                            <Delete />
                        </el-icon> &nbsp; 删除</el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
    <!-- 分页条 -->
    <div>
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
            :page-sizes="[5, 10, 20, 30, 50, 100]" :background="background"
            layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="handleSizeChange"
            @current-change="handleCurrentChange" />
    </div>
    <!-- 添加/修改员工的对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle">
        <el-form :rules="rules" ref="equipmentForm" :model="equipment" label-width="80px">
            {{ equipment }}
            <!-- 基本信息 -->
            <!-- 第一行 -->
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="设备名称" prop="name">
                        <el-input v-model="equipment.name" placeholder="请输入设备名称，2-20个字"></el-input>
                    </el-form-item>
                </el-col>

                <el-col :span="12">
                    <el-form-item label="设备类型" prop="type">
                        <el-input v-model="equipment.type" placeholder="请输入设备类型，2-10个字"></el-input>
                    </el-form-item>
                </el-col>
            </el-row>

            <!-- 第二行 -->
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="设备型号" prop="model">
                        <el-input v-model="equipment.model" placeholder="请输入设备型号，2-20个字"></el-input>
                    </el-form-item>
                </el-col>

                <el-col :span="12">
                    <el-form-item label="生产日期" prop="productionDate">
                        <el-date-picker v-model="equipment.productionDate" type="date" style="width: 100%;"
                            placeholder="选择日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD"></el-date-picker>
                    </el-form-item>
                </el-col>
            </el-row>

            <!-- 第三行 -->
            <el-row>
                <el-col :span="24">
                    <el-form-item label="制造商" prop="manufacturer">
                        <el-input v-model="equipment.manufacturer" placeholder="请输入制造商，2-20个字"></el-input>
                    </el-form-item>
                </el-col>
            </el-row>

            <!-- 第四行 -->
            <el-row>
                <el-col :span="24">
                    <el-form-item label="设备功能">
                        <el-button type="success" size="small" @click="addDescription">+ 添加设备功能</el-button>
                    </el-form-item>
                </el-col>
            </el-row>

            <!-- 第五行 ...  设备功能 -->
            <el-row :gutter="3" v-for="item in equipment.description">
                <el-col :span="22">
                    <el-form-item>
                        <el-input v-model="item.functionDescription" type="textarea" />
                    </el-form-item>
                </el-col>
                <el-col :span="2">
                    <el-form-item size="small" label-width="0px">
                        <el-button type="danger" @click="deleteDescription(index)">- 删除</el-button>
                    </el-form-item>
                </el-col>
            </el-row>
        </el-form>

        <!-- 底部按钮 -->
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="save">保存</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup>

import { ref, onMounted } from 'vue'
import { queryPageApi, addApi, updateApi, queryInfoApi, deleteApi } from '@/api/equipment'
import { ElMessage, ElMessageBox } from 'element-plus'

//搜索表单绑定对象
const searchEquipment = ref({
    name: '',
    type: '',
    model: ''
})

//设备列表数据
const equipmentList = ref([])

//清空页表数据
const clear = () => {
    searchEquipment.value = { name: '', type: '', model: '' };
    search();
}

//查询页表数据
const search = async () => {
    const result = await queryPageApi(searchEquipment.value.name, searchEquipment.value.type, searchEquipment.value.model, currentPage.value, pageSize.value)
    if (result.code == 200) {
        equipmentList.value = result.data.rows;
        total.value = result.data.total;
    } else {
        ElMessage.error(result.message);
    }
}

//钩子函数
onMounted(() => {
    search()
})

//分页操作
const currentPage = ref(1)//页码
const pageSize = ref(10)//每页展示的记录数
const background = ref(true)//有无背景色
const total = ref(400)//总记录数
//每页展示记录数变化时触发
const handleSizeChange = () => {
    search()
}
//页码变化时触发
const handleCurrentChange = () => {
    search()
}

// 控制弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('新增设备')

//新增/修改表单
const equipment = ref({
    name: '',
    type: '',
    model: '',
    productionDate: '',
    manufacturer: '',
    description: [
        {
            id: null,
            functionDescription: ''
        }
    ]
})

//新增设备
const addEquipment = () => {
    dialogVisible.value = true
    dialogTitle.value = '新增设备'
    // 重置表单
    equipment.value = {
        name: '',
        type: '',
        model: '',
        productionDate: '',
        manufacturer: '',
        description: [
            {
                id: null,
                functionDescription: ''
            }
        ]
    }
    //重置表单校验状态
    if (equipmentForm.value != null) {
        equipmentForm.value.clearValidate()
    }
}

//表单引用对象
const equipmentForm = ref(null)

//表单校验规则
const rules = ref({
    name: [
        { required: true, message: '请输入设备名称', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    type: [
        { required: true, message: '请输入设备类型', trigger: 'blur' },
        { min: 2, max: 10, message: '长度在 2 到 10 个字符', trigger: 'blur' }
    ],
    model: [
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    manufacturer: [
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    productionDate: [
        { required: true, message: '请输入生产日期', trigger: 'blur' }
    ]
})

//添加设备功能
const addDescription = () => {
    equipment.value.description.push({ id: null, functionDescription: '' })
}

//删除设备功能
const deleteDescription = (index) => {
    equipment.value.description.splice(index, 1)
}

//编辑设备
const edit = async (id) => {
    const result = await queryInfoApi(id)
    if (result.code == 200) {
        equipment.value = result.data
        dialogVisible.value = true
        dialogTitle.value = '修改员工'
        //重置表单校验状态
        if (equipmentForm.value != null) {
            equipmentForm.value.clearValidate()
        }
    }
}

//保存设备
const save = async () => {
    //表单校验
    equipmentForm.value.validate(async (valid) => {
        if (valid) {//验证通过
            let result
            if (equipment.value.id) {//修改
                result = await updateApi(equipment.value)
            } else {//新增
                result = await addApi(equipment.value)
            }

            if (result.code == 200) {
                dialogVisible.value = false
                ElMessage.success('保存成功')
                search()
            } else {
                ElMessage.error(`保存失败:${result.message}`)
            }
        } else {
            ElMessage.error('表单数据填写不完整或格式不正确')
        }
    })
}

//根据id删除设备
const deleteById = async (id) => {
    ElMessageBox.confirm('是否确认删除该设备？', '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(async () => {
        const result = await deleteApi(id)
        if (result.code == 200) {
            ElMessage.success('删除成功')
            search()
        } else {
            ElMessage.error(`删除失败:${result.message}`)
        }
    }).catch(() => {
        //取消删除
        ElMessage.info('已取消删除')
    });
}

//多选框
const multipleSelection = ref([])
//多选框选中项变化时触发
const handleSelectionChange = (selection) => {
    multipleSelection.value = selection.map(item => item.id)
}

//根据id批量删除设备
const deleteByIds = async () => {
    if (multipleSelection.value.length == 0) {
        ElMessage.warning('请先选择要删除的设备')
        return
    }
    ElMessageBox.confirm(`是否确认删除选中的${multipleSelection.value.length}种设备？`, '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(async () => {
        const result = await deleteApi(multipleSelection.value)
        if (result.code) {
            ElMessage.success('删除成功')
            search()
        } else {
            ElMessage.error(`删除失败:${result.message}`)
        }
    }).catch(() => {
        //取消删除
        ElMessage.info('已取消删除')
    });
}
</script>

<style scoped>
.demo-form-inline .el-input {
    --el-input-width: 220px;
}

.container {
    margin: 20px 0;
}
</style>