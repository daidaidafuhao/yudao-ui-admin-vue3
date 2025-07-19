<template>
  <Dialog v-model="dialogVisible" title="订单发货" width="35%">
    <el-form ref="formRef" v-loading="formLoading" :model="formData" label-width="80px">
      <el-form-item label="发货方式">
        <el-radio-group v-model="expressType">
          <el-radio border value="express">快递物流</el-radio>
          <el-radio border value="none">无需发货</el-radio>
        </el-radio-group>
      </el-form-item>
      
      <!-- 快递物流选项 -->
      <template v-if="expressType === 'express'">
        <el-form-item label="物流公司" prop="logisticsId">
          <el-select 
            v-model="formData.logisticsId" 
            placeholder="请选择物流公司" 
            style="width: 100%"
            @change="handleLogisticsChange"
          >
            <el-option
              v-for="item in deliveryExpressList"
              :key="item.id"
              :label="item.name"
              :value="Number(item.id)"
            />
          </el-select>
        </el-form-item>

        <!-- 配送方式选择 -->
        <el-form-item v-if="formData.logisticsId" label="配送方式">
          <el-radio-group v-model="deliveryMethod">
            <el-radio border value="traditional">传统配送</el-radio>
            <el-radio border value="drone">无人机配送</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 传统配送的物流单号 -->
        <el-form-item v-if="formData.logisticsId && deliveryMethod === 'traditional'" label="物流单号">
          <el-input v-model="formData.logisticsNo" placeholder="请输入物流单号" />
        </el-form-item>

        <!-- 无人机配送选项 -->
        <template v-if="formData.logisticsId && deliveryMethod === 'drone'">
          <el-form-item label="起始柜" prop="sourceCabinetCode">
            <el-select 
              v-model="formData.sourceCabinetCode" 
              placeholder="请选择起始无人机柜" 
              style="width: 100%"
              filterable
            >
              <el-option
                v-for="item in cabinetList"
                :key="item.code"
                :label="`${item.name} (${item.code})`"
                :value="item.code"
              >
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span>{{ item.name }}</span>
                  <div style="font-size: 12px; color: #999;">
                    <el-tag 
                      :type="getCabinetStatusType(item.status)" 
                      size="small"
                    >
                      {{ getCabinetStatusText(item.status) }}
                    </el-tag>
                    <span style="margin-left: 8px;">{{ item.availableBoxes }}/{{ item.totalBoxes }} 可用</span>
                  </div>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="目标柜" prop="targetCabinetCode">
            <el-select 
              v-model="formData.targetCabinetCode" 
              placeholder="请选择目标无人机柜" 
              style="width: 100%"
              filterable
            >
              <el-option
                v-for="item in cabinetList"
                :key="item.code"
                :label="`${item.name} (${item.code})`"
                :value="item.code"
              >
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span>{{ item.name }}</span>
                  <div style="font-size: 12px; color: #999;">
                    <el-tag 
                      :type="getCabinetStatusType(item.status)" 
                      size="small"
                    >
                      {{ getCabinetStatusText(item.status) }}
                    </el-tag>
                    <span style="margin-left: 8px;">{{ item.availableBoxes }}/{{ item.totalBoxes }} 可用</span>
                  </div>
                </div>
              </el-option>
            </el-select>
            <div v-if="parsedTargetCabinetCode" style="color: #409eff; font-size: 12px; margin-top: 4px;">
              从收货地址解析：{{ parsedTargetCabinetCode }}
            </div>
          </el-form-item>
          
          <el-form-item label="选择无人机" prop="droneCode">
            <el-select 
              v-model="formData.droneCode" 
              placeholder="请选择可用无人机" 
              style="width: 100%"
              filterable
              @change="handleDroneChange"
            >
              <el-option
                v-for="item in availableDrones"
                :key="item.droneCode"
                :label="`${item.droneName} (${item.droneCode})`"
                :value="item.droneCode"
              >
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span>{{ item.droneName }}</span>
                  <div style="font-size: 12px; color: #999;">
                    <el-tag 
                      :type="getDroneStatusType(item.status)" 
                      size="small"
                    >
                      {{ getDroneStatusText(item.status) }}
                    </el-tag>
                    <span style="margin-left: 8px;">电量: {{ item.batteryLevel }}%</span>
                  </div>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="物流单号">
            <el-input 
              v-model="formData.logisticsNo" 
              placeholder="选择无人机后自动生成"
              :disabled="true"
            />
          </el-form-item>
          
          <el-form-item v-if="selectedDrone" label="无人机信息">
            <el-card shadow="never" style="background-color: #f5f7fa;">
              <div style="font-size: 14px;">
                <p><strong>型号:</strong> {{ selectedDrone.model }}</p>
                <p><strong>制造商:</strong> {{ selectedDrone.manufacturer }}</p>
                <p><strong>最大载重:</strong> {{ selectedDrone.maxPayload }}kg</p>
                <p><strong>当前位置:</strong> 经度 {{ selectedDrone.longitude }}, 纬度 {{ selectedDrone.latitude }}</p>
              </div>
            </el-card>
          </el-form-item>
        </template>
      </template>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as DeliveryExpressApi from '@/api/mall/trade/delivery/express'
import * as TradeOrderApi from '@/api/mall/trade/order'
import * as DroneApi from '@/api/drone/droneComm'
import * as CabinetApi from '@/api/drone/cabinet'
import { copyValueToTarget } from '@/utils'

defineOptions({ name: 'OrderDeliveryForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const expressType = ref('express') // 发货方式：express-快递；none-无需发货
const deliveryMethod = ref('traditional') // 配送方式：traditional-传统配送；drone-无人机配送
const currentOrder = ref<TradeOrderApi.OrderVO>() // 当前订单信息
const formData = ref({
  id: undefined as number | undefined, // 订单编号
  logisticsId: undefined as number | undefined, // 物流公司编号
  logisticsNo: '', // 物流编号
  droneCode: undefined as string | undefined, // 无人机编号
  sourceCabinetCode: undefined as string | undefined, // 起始柜编号
  targetCabinetCode: undefined as string | undefined // 目标柜编号
})
const formRef = ref() // 表单 Ref
const availableDrones = ref<any[]>([]) // 可用无人机列表
const selectedDrone = ref<any>() // 选中的无人机
const deliveryExpressList = ref<any[]>([])
const cabinetList = ref<any[]>([]) // 无人机柜列表
const parsedTargetCabinetCode = ref<string | null>(null) // 从收货地址解析的目标柜编号

// 无人机状态文本映射
const getDroneStatusText = (status: number) => {
  const statusMap = {
    0: '待机',
    1: '飞行中', 
    2: '返航中',
    3: '充电中',
    4: '维护中',
    5: '故障',
    6: '离线'
  }
  return statusMap[status] || '未知'
}

// 无人机状态类型映射
const getDroneStatusType = (status: number) => {
  const typeMap = {
    0: 'success',  // 待机 - 可用
    1: 'warning',  // 飞行中 - 忙碌
    2: 'warning',  // 返航中 - 忙碌
    3: 'info',     // 充电中 - 不可用
    4: 'warning',  // 维护中 - 不可用
    5: 'danger',   // 故障 - 不可用
    6: 'info'      // 离线 - 不可用
  }
  return typeMap[status] || 'info'
}

// 无人机柜状态文本映射
const getCabinetStatusText = (status: number) => {
  const statusMap = {
    0: '离线',
    1: '在线',
    2: '故障'
  }
  return statusMap[status] || '未知'
}

// 无人机柜状态类型映射
const getCabinetStatusType = (status: number) => {
  const typeMap = {
    0: 'info',     // 离线 - 不可用
    1: 'success',  // 在线 - 可用
    2: 'danger'    // 故障 - 不可用
  }
  return typeMap[status] || 'info'
}

// 处理无人机选择变化
const handleDroneChange = (droneCode: string) => {
  selectedDrone.value = availableDrones.value.find(drone => drone.droneCode === droneCode)
  // 自动生成物流单号
  if (droneCode) {
    formData.value.logisticsNo = `DRONE-${droneCode}`
  } else {
    formData.value.logisticsNo = ''
  }
}

// 处理物流公司选择变化
const handleLogisticsChange = (logisticsId: number) => {
  selectedDrone.value = undefined // 清空选中的无人机
  formData.value.droneCode = undefined // 清空无人机编号
  formData.value.logisticsNo = '' // 清空物流单号
  formData.value.sourceCabinetCode = undefined // 清空起始柜
  formData.value.targetCabinetCode = undefined // 清空目标柜
  deliveryMethod.value = 'traditional' // 重置为传统配送
  
  // 选择物流公司后加载无人机列表和柜子列表
  if (logisticsId) {
    loadAvailableDrones()
    loadCabinetList()
  }
  
  // 重新解析目标柜编号
  if (currentOrder.value?.receiverDetailAddress) {
    const fullAddress = `${currentOrder.value.receiverAreaName || ''} ${currentOrder.value.receiverDetailAddress}`
    const targetCode = parseTargetCabinetCode(fullAddress)
    if (targetCode) {
      parsedTargetCabinetCode.value = targetCode
      formData.value.targetCabinetCode = targetCode
    }
  }
}

// 加载可用无人机列表
const loadAvailableDrones = async () => {
  try {
    const data = await DroneApi.dronesApi.getdronesPage({
      pageNo: 1,
      pageSize: 100, // 获取更多数据
      status: 0 // 只获取待机状态的无人机
    })
    // 过滤出待机状态的无人机
    availableDrones.value = data.list?.filter((drone: DroneApi.dronesVO) => drone.status === 0) || []
  } catch (error) {
    console.error('加载无人机列表失败:', error)
    availableDrones.value = []
  }
}

// 加载无人机柜列表
const loadCabinetList = async () => {
  try {
    const data = await CabinetApi.CabinetApi.getCabinetPage({
      pageNo: 1,
      pageSize: 100 // 获取更多数据
    })
    cabinetList.value = data.list || []
  } catch (error) {
    console.error('加载无人机柜列表失败:', error)
    cabinetList.value = []
  }
}

// 解析收货地址获取目标柜编号
const parseTargetCabinetCode = (address: string) => {
  // 匹配括号内的数字，例如：北京市 北京市 东城区 123 (123)
  const match = address.match(/\((\d+)\)/)
  if (match && match[1]) {
    return match[1]
  }
  return null
}

/** 打开弹窗 */
const open = async (row: TradeOrderApi.OrderVO) => {
  resetForm()
  currentOrder.value = row
  // 设置数据
  copyValueToTarget(formData.value, row)
  if (row.logisticsId === 0) {
    expressType.value = 'none'
  }
  
  // 解析收货地址中的目标柜编号
  if (row.receiverDetailAddress) {
    const fullAddress = `${row.receiverAreaName || ''} ${row.receiverDetailAddress}`
    const targetCode = parseTargetCabinetCode(fullAddress)
    if (targetCode) {
      parsedTargetCabinetCode.value = targetCode
      formData.value.targetCabinetCode = targetCode
    }
  }
  
  dialogVisible.value = true
  // 无人机列表和柜子列表现在在选择支持无人机的物流公司时才加载
  if (formData.value.logisticsId) {
    loadAvailableDrones()
    loadCabinetList()
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 提交请求
  formLoading.value = true
  try {
    const data = unref(formData)
    
    if (expressType.value === 'none') {
      // 无需发货的情况
      data.logisticsId = 0
      data.logisticsNo = ''
    } else if (expressType.value === 'express') {
      // 快递物流
      if (!data.logisticsId) {
        message.error('请选择物流公司')
        return
      }
      
      if (deliveryMethod.value === 'drone') {
        // 无人机配送
        if (!data.droneCode) {
          message.error('请选择无人机')
          return
        }
        
        // 更新无人机的订单信息
        const selectedDroneData = selectedDrone.value
        if (selectedDroneData) {
          await DroneApi.dronesApi.updatedrones({
            ...selectedDroneData,
            currentOrderId: currentOrder.value!.id!,
            currentOrderNo: currentOrder.value!.no!,
            sourceCabinetCode: data.sourceCabinetCode || '',
            targetCabinetCode: data.targetCabinetCode || '',
            status: 1 // 设置为飞行中状态
          })
        }
        
        // 物流单号已经在选择无人机时自动生成
      } else {
        // 传统配送
        if (!data.logisticsNo) {
          message.error('请输入物流单号')
          return
        }
      }
    }
    
    await TradeOrderApi.deliveryOrder({
      id: data.id,
      logisticsId: data.logisticsId || null, // 确保符合API类型要求
      logisticsNo: data.logisticsNo
    })
    message.success(t('common.updateSuccess'))
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success', true)
  } catch (error) {
    console.error('发货失败:', error)
    message.error('发货失败，请重试')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  expressType.value = 'express'
  deliveryMethod.value = 'traditional'
  selectedDrone.value = undefined
  formData.value = {
    id: undefined, // 订单编号
    logisticsId: undefined, // 物流公司编号
    logisticsNo: '', // 物流编号
    droneCode: undefined, // 无人机编号
    sourceCabinetCode: undefined, // 起始柜编号
    targetCabinetCode: undefined // 目标柜编号
  }
  parsedTargetCabinetCode.value = null // 重置解析的目标柜编号
  formRef.value?.resetFields()
}

onMounted(async () => {
  deliveryExpressList.value = await DeliveryExpressApi.getSimpleDeliveryExpressList()
})
</script>
