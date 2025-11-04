<template>
    <div class="page">
        <h1>员工管理</h1>
    </div>
    <!-- 搜索栏 -->
    <div class="container">
        <el-form :inline="true" :model="searchEmp" class="demo-form-inline">
            <el-form-item label="姓名">
                <el-input v-model="searchEmp.name" placeholder="请输入姓名" clearable />
            </el-form-item>
            <el-form-item label="职位">
                <el-input v-model="searchEmp.position" placeholder="请输入职位" clearable />
            </el-form-item>
            <el-form-item label="入职时间">
                <el-date-picker v-model="searchEmp.date" type="daterange" unlink-panels range-separator="到"
                    start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="search">查询</el-button>
                <el-button type="info" @click="clear">清空</el-button>
            </el-form-item>
        </el-form>
    </div>
    <!-- 数据展示表格 -->
    <div>
        <el-button type="primary" @click="addEmp">+ &nbsp;新增员工</el-button>
        <el-button type="danger" @click="deleteByIds">- &nbsp;批量删除</el-button>
    </div>
    <div class="container">
        <el-table :data="empList" border style="width: 100%" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column prop="userName" label="用户名" width="120" align="center" />
            <el-table-column prop="name" label="姓名" width="120" align="center" />
            <el-table-column prop="position" label="职位" width="120" align="center" />
            <el-table-column prop="permissionLevel" label="权限等级" width="120" align="center" />
            <el-table-column prop="createdAt" label="入职时间" width="180" align="center" />
            <el-table-column prop="updatedAt" label="最后操作时间" width="200" align="center" />
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
        <el-form :rules="rules" ref="employeeForm" :model="employee" label-width="80px">
            <!-- 基本信息 -->
            <!-- 第一行 -->
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="用户名" prop="username">
                        <el-input v-model="employee.userName" placeholder="请输入员工用户名，2-20个字"></el-input>
                    </el-form-item>
                </el-col>

                <el-col :span="12">
                    <el-form-item label="姓名" prop="name">
                        <el-input v-model="employee.name" placeholder="请输入员工姓名，2-10个字"></el-input>
                    </el-form-item>
                </el-col>
            </el-row>

            <!-- 第二行 -->
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="职位" prop="position">
                        <el-select v-model="employee.position" placeholder="请选择职位" style="width: 100%;">
                            <el-option v-for="j in jobs" :key="j.value" :label="j.name" :value="j.value"></el-option>
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="权限等级" prop="permissionLevel">
                        <el-input v-model="employee.permissionLevel" placeholder="请输入权限等级"></el-input>
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
import { ref, watch, onMounted } from 'vue'
import { queryPageApi, addApi, queryInfoApi, updateApi, deleteApi } from '@/api/emp'
import { ElMessage, ElMessageBox } from 'element-plus'

//元数据
const jobs = ref([
    { value: '生产主管', name: '生产主管' },
    { value: '工艺工程师', name: '工艺工程师' },
    { value: '人事主管', name: '人事主管' },
    { value: '工人', name: '工人' },
    { value: '班组长', name: '班组长' },
    { value: '车间主任', name: '车间主任' }
])

// 搜索表单对象
const searchEmp = ref({ name: '', position: '', date: [], begin: '', end: '' })

//员工列表数据
const empList = ref([])

//侦听searchEmp的date属性
watch(() => searchEmp.value.date, (newVal, oldVal) => {
    if (newVal.length == 2) {
        searchEmp.value.begin = newVal[0]
        searchEmp.value.end = newVal[1]
    } else {
        searchEmp.value.begin = ''
        searchEmp.value.end = ''
    }
})

//查询页表数据
const search = async () => {
    const result = await queryPageApi(searchEmp.value.name, searchEmp.value.position, searchEmp.value.begin,
        searchEmp.value.end, currentPage.value, pageSize.value)
    if (result.code == 200) {
        empList.value = result.data.rows;
        total.value = result.data.total;
    }
}
//钩子函数
onMounted(() => {
    search()
})

//清空页表数据
const clear = () => {
    searchEmp.value = { name: '', position: '', date: [], begin: '', end: '' }
    search()
}

//分页操作
const currentPage = ref(1)//页码
const pageSize = ref(10)//每页展示的记录数
const background = ref(true)//有无背景色
const total = ref(400)//总记录数
//每页展示记录数变化时触发
const handleSizeChange = (val) => {
    search()
}
//页码变化时触发
const handleCurrentChange = (val) => {
    search()
}

//新增/修改表单
const employee = ref({
    userName: '',
    name: '',
    position: '',
    permissionLevel: ''
})

// 控制弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('新增员工')

//新增员工
const addEmp = () => {
    dialogVisible.value = true
    dialogTitle.value = '新增员工'
    // 重置表单
    employee.value = {
        userName: '',
        name: '',
        position: '',
        permissionLevel: ''
    }
    //重置表单校验状态
    if (employeeForm.value != null) {
        employeeForm.value.clearValidate()
    }
}

//保存员工
const save = async () => {
    //表单校验
    employeeForm.value.validate(async (valid) => {
        let result

        if (valid) {//验证通过

            if (employee.value.id) {//修改
                result = await updateApi(employee.value)
            } else {//新增
                result = await addApi(employee.value)
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

//表单引用对象
const employeeForm = ref(null)

//表单校验规则
const rules = ref({
    userName: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 10, message: '长度在 2 到 10 个字符', trigger: 'blur' }
    ],
    position: [
        { required: true, message: '请选择职位', trigger: 'change' }
    ]
})

//编辑员工
const edit = async (id) => {
    const result = await queryInfoApi(id)
    if (result.code == 200) {
        employee.value = result.data
        dialogVisible.value = true
        dialogTitle.value = '修改员工'
        //重置表单校验状态
        if (employeeForm.value != null) {
            employeeForm.value.clearValidate()
        }
    }
}

//根据id删除员工
const deleteById = async (id) => {
    ElMessageBox.confirm('是否确认删除该员工？', '提示', {
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

//根据id批量删除员工
const deleteByIds = async () => {
    if (multipleSelection.value.length == 0) {
        ElMessage.warning('请先选择要删除的员工')
        return
    }
    ElMessageBox.confirm(`是否确认删除选中的${multipleSelection.value.length}位员工？`, '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(async () => {
        const result = await deleteApi(multipleSelection.value)
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
</script>

<style scoped>
.demo-form-inline .el-input {
    --el-input-width: 220px;
}

.container {
    margin: 20px 0;
}
</style>