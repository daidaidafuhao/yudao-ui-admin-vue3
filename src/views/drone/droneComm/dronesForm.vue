<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1200px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <!-- 基本信息 -->
      <el-card class="mb-4" shadow="never">
        <template #header>
          <span class="card-title">基本信息</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="无人机编号" prop="droneCode">
              <el-input 
                v-model="formData.droneCode" 
                placeholder="请输入无人机编号" 
                :disabled="formType === 'update'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="无人机名称" prop="droneName">
              <el-input v-model="formData.droneName" placeholder="请输入无人机名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="无人机型号" prop="model">
              <el-input v-model="formData.model" placeholder="请输入无人机型号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="序列号" prop="serialNumber">
              <el-input v-model="formData.serialNumber" placeholder="请输入序列号" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="制造商" prop="manufacturer">
              <el-input v-model="formData.manufacturer" placeholder="请输入制造商" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择状态">
                <el-option label="待机" :value="0" />
                <el-option label="飞行中" :value="1" />
                <el-option label="返航中" :value="2" />
                <el-option label="充电中" :value="3" />
                <el-option label="维护中" :value="4" />
                <el-option label="故障" :value="5" />
                <el-option label="离线" :value="6" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="部门编号" prop="deptId">
              <el-input-number 
                v-model="formData.deptId" 
                placeholder="请输入部门编号" 
                :min="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 性能参数 -->
      <el-card class="mb-4" shadow="never">
        <template #header>
          <span class="card-title">性能参数</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="电池电量" prop="batteryLevel">
              <el-input-number 
                v-model="formData.batteryLevel" 
                placeholder="请输入电池电量" 
                :min="0" 
                :max="100"
                style="width: 100%"
              >
                <template #append>%</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="累计飞行时间" prop="flightTime">
              <el-input-number 
                v-model="formData.flightTime" 
                placeholder="请输入累计飞行时间" 
                :min="0"
                style="width: 100%"
              >
                <template #append>分钟</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最大载重" prop="maxPayload">
              <el-input-number 
                v-model="formData.maxPayload" 
                placeholder="请输入最大载重" 
                :min="0" 
                :precision="2"
                style="width: 100%"
              >
                <template #append>kg</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="最大飞行时间" prop="maxFlightTime">
              <el-input-number 
                v-model="formData.maxFlightTime" 
                placeholder="请输入最大飞行时间" 
                :min="0"
                style="width: 100%"
              >
                <template #append>分钟</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="当前速度" prop="speed">
              <el-input-number 
                v-model="formData.speed" 
                placeholder="请输入当前速度" 
                :min="0" 
                :precision="2"
                style="width: 100%"
              >
                <template #append>m/s</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="航向角度" prop="heading">
              <el-input-number 
                v-model="formData.heading" 
                placeholder="请输入航向角度" 
                :min="0" 
                :max="360"
                style="width: 100%"
              >
                <template #append>°</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 位置信息 -->
      <el-card class="mb-4" shadow="never">
        <template #header>
          <span class="card-title">位置信息</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="当前经度" prop="longitude">
              <el-input-number 
                v-model="formData.longitude" 
                placeholder="请输入当前经度" 
                :precision="6"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="当前纬度" prop="latitude">
              <el-input-number 
                v-model="formData.latitude" 
                placeholder="请输入当前纬度" 
                :precision="6"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="当前海拔高度" prop="altitude">
              <el-input-number 
                v-model="formData.altitude" 
                placeholder="请输入当前海拔高度" 
                :precision="2"
                style="width: 100%"
              >
                <template #append>米</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="起飞点经度" prop="homeLongitude">
              <el-input-number 
                v-model="formData.homeLongitude" 
                placeholder="请输入起飞点经度" 
                :precision="6"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="起飞点纬度" prop="homeLatitude">
              <el-input-number 
                v-model="formData.homeLatitude" 
                placeholder="请输入起飞点纬度" 
                :precision="6"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="起飞点海拔高度" prop="homeAltitude">
              <el-input-number 
                v-model="formData.homeAltitude" 
                placeholder="请输入起飞点海拔高度" 
                :precision="2"
                style="width: 100%"
              >
                <template #append>米</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 任务信息 -->
      <el-card class="mb-4" shadow="never">
        <template #header>
          <span class="card-title">任务信息</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="当前任务ID" prop="currentMissionId">
              <el-input v-model="formData.currentMissionId" placeholder="请输入当前任务ID" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="运送订单编号" prop="currentOrderId">
              <el-input v-model="formData.currentOrderId" placeholder="请输入当前运送订单编号" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="订单流水号" prop="currentOrderNo">
              <el-input v-model="formData.currentOrderNo" placeholder="请输入当前运送订单流水号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="起送柜编号" prop="sourceCabinetCode">
              <el-input v-model="formData.sourceCabinetCode" placeholder="请输入起送柜子编号" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="目标柜编号" prop="targetCabinetCode">
              <el-input v-model="formData.targetCabinetCode" placeholder="请输入目标柜子编号" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="当前操作员" prop="operator">
              <el-input v-model="formData.operator" placeholder="请输入当前操作员" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 时间信息 -->
      <el-card class="mb-4" shadow="never">
        <template #header>
          <span class="card-title">时间信息</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="最后飞行时间" prop="lastFlightTime">
              <el-date-picker
                v-model="formData.lastFlightTime"
                type="datetime"
                value-format="x"
                placeholder="选择最后飞行时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最后降落时间" prop="lastLandingTime">
              <el-date-picker
                v-model="formData.lastLandingTime"
                type="datetime"
                value-format="x"
                placeholder="选择最后降落时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最后维护时间" prop="lastMaintenanceTime">
              <el-date-picker
                v-model="formData.lastMaintenanceTime"
                type="datetime"
                value-format="x"
                placeholder="选择最后维护时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="下次维护时间" prop="nextMaintenanceTime">
              <el-date-picker
                v-model="formData.nextMaintenanceTime"
                type="datetime"
                value-format="x"
                placeholder="选择下次维护时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最后故障时间" prop="lastErrorTime">
              <el-date-picker
                v-model="formData.lastErrorTime"
                type="datetime"
                value-format="x"
                placeholder="选择最后故障时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 其他信息 -->
      <el-card shadow="never">
        <template #header>
          <span class="card-title">其他信息</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="故障信息" prop="errorMessage">
              <el-input 
                v-model="formData.errorMessage" 
                type="textarea" 
                :rows="3"
                placeholder="请输入故障信息" 
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="备注" prop="remark">
              <el-input 
                v-model="formData.remark" 
                type="textarea" 
                :rows="3"
                placeholder="请输入备注" 
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { dronesApi, dronesVO } from '@/api/drone/droneComm'
import * as CabinetApi from '@/api/drone/cabinet'

/** 无人机 表单 */
defineOptions({ name: 'dronesForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  droneCode: undefined,
  droneName: undefined,
  model: undefined,
  serialNumber: undefined,
  manufacturer: undefined,
  status: 0,
  batteryLevel: undefined,
  flightTime: undefined,
  maxPayload: undefined,
  maxFlightTime: undefined,
  longitude: undefined,
  latitude: undefined,
  altitude: undefined,
  speed: undefined,
  heading: undefined,
  homeLongitude: undefined,
  homeLatitude: undefined,
  homeAltitude: undefined,
  lastFlightTime: undefined,
  lastLandingTime: undefined,
  lastMaintenanceTime: undefined,
  nextMaintenanceTime: undefined,
  currentMissionId: undefined,
  currentOrderId: undefined,
  currentOrderNo: undefined,
  sourceCabinetCode: undefined,
  targetCabinetCode: undefined,
  operator: undefined,
  errorMessage: undefined,
  lastErrorTime: undefined,
  remark: undefined,
  deptId: undefined
})
const formRules = reactive({
  droneCode: [
    { required: true, message: '无人机编号不能为空', trigger: 'blur' }
  ],
  droneName: [
    { required: true, message: '无人机名称不能为空', trigger: 'blur' }
  ],
  model: [
    { required: true, message: '无人机型号不能为空', trigger: 'blur' }
  ],
  serialNumber: [
    { required: true, message: '序列号不能为空', trigger: 'blur' }
  ],
  manufacturer: [
    { required: true, message: '制造商不能为空', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '状态不能为空', trigger: 'change' }
  ],
  batteryLevel: [
    { 
      type: 'number' as const, 
      min: 0, 
      max: 100, 
      message: '电池电量必须在0-100之间', 
      trigger: 'blur' 
    }
  ],
  heading: [
    { 
      type: 'number' as const, 
      min: 0, 
      max: 360, 
      message: '航向角度必须在0-360度之间', 
      trigger: 'blur' 
    }
  ]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, droneCode?: string) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增无人机' : '修改无人机'
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (droneCode) {
    formLoading.value = true
    try {
      const data = await dronesApi.getdrones(droneCode)
      formData.value = data
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as dronesVO
    console.log('提交的无人机数据:', data)
    console.log('droneCode值:', data.droneCode)
    
    if (formType.value === 'create') {
      await dronesApi.createdrones(data)
      message.success(t('common.createSuccess'))
    } else {
      await dronesApi.updatedrones(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    droneCode: undefined,
    droneName: undefined,
    model: undefined,
    serialNumber: undefined,
    manufacturer: undefined,
    status: 0,
    batteryLevel: undefined,
    flightTime: undefined,
    maxPayload: undefined,
    maxFlightTime: undefined,
    longitude: undefined,
    latitude: undefined,
    altitude: undefined,
    speed: undefined,
    heading: undefined,
    homeLongitude: undefined,
    homeLatitude: undefined,
    homeAltitude: undefined,
    lastFlightTime: undefined,
    lastLandingTime: undefined,
    lastMaintenanceTime: undefined,
    nextMaintenanceTime: undefined,
    currentMissionId: undefined,
    currentOrderId: undefined,
    currentOrderNo: undefined,
    sourceCabinetCode: undefined,
    targetCabinetCode: undefined,
    operator: undefined,
    errorMessage: undefined,
    lastErrorTime: undefined,
    remark: undefined,
    deptId: undefined
  }
  formRef.value?.resetFields()
}
</script>

<style scoped>
.card-title {
  font-weight: 600;
  color: #303133;
}
:deep(.el-card__header) {
  padding: 12px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}
:deep(.el-card__body) {
  padding: 20px;
}
</style>