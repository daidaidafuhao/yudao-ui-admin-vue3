<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="柜子名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入柜子名称" />
      </el-form-item>
      <el-form-item label="柜子编号" prop="code">
        <el-input v-model="formData.code" placeholder="请输入柜子编号" />
      </el-form-item>
      <el-form-item label="Modbus IP地址" prop="ip">
        <el-input v-model="formData.ip" placeholder="请输入Modbus IP地址" />
      </el-form-item>
      <el-form-item label="Modbus端口" prop="port">
        <el-input-number v-model="formData.port" :min="1" :max="65535" placeholder="请输入Modbus端口" />
      </el-form-item>
      <el-form-item label="Modbus从站ID" prop="slaveId">
        <el-input-number v-model="formData.slaveId" :min="1" :max="255" placeholder="请输入Modbus从站ID" />
      </el-form-item>
      <el-form-item label="实际地址" prop="address">
        <el-input v-model="formData.address" placeholder="请输入实际地址" />
      </el-form-item>
      <el-form-item label="经度" prop="longitude">
        <el-input-number v-model="formData.longitude" :precision="6" :step="0.000001" placeholder="请输入经度" />
      </el-form-item>
      <el-form-item label="纬度" prop="latitude">
        <el-input-number v-model="formData.latitude" :precision="6" :step="0.000001" placeholder="请输入纬度" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :label="0">离线</el-radio>
          <el-radio :label="1">在线</el-radio>
          <el-radio :label="2">故障</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="总格口数" prop="totalBoxes">
        <el-input-number v-model="formData.totalBoxes" :min="1" :max="999" />
      </el-form-item>
      <el-form-item label="可用格口数" prop="availableBoxes">
        <el-input-number v-model="formData.availableBoxes" :min="0" :max="formData.totalBoxes" />
      </el-form-item>
      <el-form-item label="故障信息" prop="errorMessage">
        <el-input v-model="formData.errorMessage" type="textarea" :rows="2" placeholder="请输入故障信息" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { CabinetApi, CabinetVO } from '@/api/drone/cabinet'

/** 无人机柜 表单 */
defineOptions({ name: 'CabinetForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref<Partial<CabinetVO>>({
  name: '',
  code: '',
  ip: '',
  port: undefined,
  slaveId: undefined,
  address: '',
  longitude: undefined,
  latitude: undefined,
  status: 0,
  totalBoxes: undefined,
  availableBoxes: undefined,
  errorMessage: '',
  remark: ''
})
const rules = reactive({
  name: [{ required: true, message: '柜子名称不能为空', trigger: 'blur' }],
  code: [{ required: true, message: '柜子编号不能为空', trigger: 'blur' }],
  ip: [{ required: true, message: 'Modbus IP不能为空', trigger: 'blur' }],
  port: [{ required: true, message: 'Modbus端口不能为空', trigger: 'blur' }],
  slaveId: [{ required: true, message: 'Modbus从站ID不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
  totalBoxes: [{ required: true, message: '总格口数不能为空', trigger: 'blur' }],
  availableBoxes: [{ required: true, message: '可用格口数不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: 'create' | 'update', id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增柜子' : '修改柜子'
  resetForm()
  if (type === 'update' && id) {
    formLoading.value = true
    try {
      const res = await CabinetApi.getCabinet(id)
      console.log('获取到的数据:', res) // 调试日志
      Object.assign(formData.value, res)
      console.log('处理后的表单数据:', formData.value) // 调试日志
    } catch (error) {
      console.error('Error fetching cabinet data:', error)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = { ...formData.value }
    console.log('提交前的数据:', data) // 调试日志
    
    console.log('提交的数据:', data) // 调试日志
    
    if (data.id) {
      await CabinetApi.updateCabinet(data as CabinetVO)
      message.success(t('common.updateSuccess'))
    } else {
      await CabinetApi.createCabinet(data as CabinetVO)
      message.success(t('common.createSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } catch (error) {
    console.error('Error submitting form:', error)
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    name: '',
    code: '',
    ip: '',
    port: undefined,
    slaveId: undefined,
    address: '',
    longitude: undefined,
    latitude: undefined,
    status: 0,
    totalBoxes: undefined,
    availableBoxes: undefined,
    errorMessage: '',
    remark: ''
  }
  formRef.value?.resetFields()
}
</script>