<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  visible: { type: Boolean, default: false },
  role: { type: Object, default: null }
})

const emit = defineEmits(['update:visible', 'saved'])

const formRef = ref(null)

const formData = ref({
  roleCode: '',
  roleName: '',
  description: ''
})

const dialogTitle = ref('新增角色')
const submitting = ref(false)

const rules = {
  roleCode: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { pattern: /^ROLE_/, message: '角色编码必须以 ROLE_ 开头', trigger: 'blur' }
  ],
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ]
}

watch(() => props.visible, (val) => {
  if (val) {
    if (props.role) {
      dialogTitle.value = '编辑角色'
      formData.value = {
        roleCode: props.role.roleCode ?? props.role.role_code ?? '',
        roleName: props.role.roleName ?? props.role.role_name ?? '',
        description: props.role.description ?? ''
      }
    } else {
      dialogTitle.value = '新增角色'
      formData.value = { roleCode: '', roleName: '', description: '' }
    }
    if (formRef.value) {
      formRef.value.clearValidate()
    }
  }
})

const handleClose = () => {
  emit('update:visible', false)
}

const handleSave = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('请正确填写表单')
      return
    }
    submitting.value = true
    try {
      emit('saved', { ...formData.value, id: props.role?.id })
    } finally {
      submitting.value = false
    }
  })
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="500px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <el-form-item label="角色编码" prop="roleCode">
        <el-input
          v-model="formData.roleCode"
          placeholder="如 ROLE_QUALITY_INSPECTOR"
          :disabled="!!role"
        />
        <span style="font-size:11px;color:#909399;">
          格式：ROLE_xxx（必须以ROLE_开头，全局唯一）
        </span>
      </el-form-item>
      <el-form-item label="角色名称" prop="roleName">
        <el-input
          v-model="formData.roleName"
          placeholder="如：质检员"
        />
      </el-form-item>
      <el-form-item label="角色描述">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="描述该角色的职责和权限范围"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSave">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>
