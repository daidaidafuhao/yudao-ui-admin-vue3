<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-row :gutter="20">
        <!-- 基本信息搜索 -->
        <el-col :span="6">
      <el-form-item label="无人机名称" prop="droneName">
        <el-input
          v-model="queryParams.droneName"
          placeholder="请输入无人机名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="型号" prop="model">
        <el-input
          v-model="queryParams.model"
          placeholder="请输入无人机型号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
        </el-col>
        <el-col :span="6">
      <el-form-item label="序列号" prop="serialNumber">
        <el-input
          v-model="queryParams.serialNumber"
          placeholder="请输入序列号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
        </el-col>
        <el-col :span="6">
      <el-form-item label="制造商" prop="manufacturer">
        <el-input
          v-model="queryParams.manufacturer"
          placeholder="请输入制造商"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryParams.status"
              placeholder="请选择状态"
          clearable
            >
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
        <el-col :span="6">
          <el-form-item label="电池电量" prop="batteryLevel">
        <el-input
          v-model="queryParams.batteryLevel"
              placeholder="请输入电池电量"
          clearable
          @keyup.enter="handleQuery"
            >
              <template #append>%</template>
            </el-input>
      </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="当前操作员" prop="operator">
        <el-input
              v-model="queryParams.operator"
              placeholder="请输入当前操作员"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
              v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
        />
      </el-form-item>
        </el-col>
      </el-row>

      <!-- 展开搜索 -->
      <el-collapse-transition>
        <div v-show="showAdvancedSearch">
          <el-row :gutter="20">
            <el-col :span="6">
      <el-form-item label="当前任务ID" prop="currentMissionId">
        <el-input
          v-model="queryParams.currentMissionId"
          placeholder="请输入当前任务ID"
          clearable
        />
      </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="订单编号" prop="currentOrderId">
        <el-input
          v-model="queryParams.currentOrderId"
          placeholder="请输入当前运送订单编号"
          clearable
        />
      </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="起送柜编号" prop="sourceCabinetCode">
        <el-input
          v-model="queryParams.sourceCabinetCode"
          placeholder="请输入起送柜子编号"
          clearable
        />
      </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="目标柜编号" prop="targetCabinetCode">
        <el-input
          v-model="queryParams.targetCabinetCode"
          placeholder="请输入目标柜子编号"
          clearable
        />
      </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-collapse-transition>

      <el-row>
        <el-col :span="24" class="text-right">
      <el-form-item>
            <el-button @click="handleQuery">
              <Icon icon="ep:search" class="mr-5px" /> 搜索
            </el-button>
            <el-button @click="resetQuery">
              <Icon icon="ep:refresh" class="mr-5px" /> 重置
            </el-button>
            <el-button 
              link 
              type="primary" 
              @click="showAdvancedSearch = !showAdvancedSearch"
            >
              <Icon :icon="showAdvancedSearch ? 'ep:arrow-up' : 'ep:arrow-down'" class="mr-5px" />
              {{ showAdvancedSearch ? '收起' : '展开' }}
            </el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['drone:drones:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['drone:drones:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="无人机编号" align="center" prop="droneCode" width="120" fixed="left" />
      <el-table-column label="无人机名称" align="center" prop="droneName" width="140" />
      <el-table-column label="型号" align="center" prop="model" width="120" />
      <el-table-column label="制造商" align="center" prop="manufacturer" width="100" />
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="电池电量" align="center" prop="batteryLevel" width="100">
        <template #default="{ row }">
          <el-progress 
            :percentage="row.batteryLevel || 0" 
            :color="getBatteryColor(row.batteryLevel)"
            :show-text="true"
            :format="() => `${row.batteryLevel || 0}%`"
          />
        </template>
      </el-table-column>
      <el-table-column label="序列号" align="center" prop="serialNumber" width="140" />
      <el-table-column label="最大载重" align="center" prop="maxPayload" width="100">
        <template #default="{ row }">
          {{ row.maxPayload }}kg
        </template>
      </el-table-column>
      
      <!-- 位置信息分组 -->
      <el-table-column label="位置信息" align="center">
        <el-table-column label="经度" align="center" prop="longitude" width="100" />
        <el-table-column label="纬度" align="center" prop="latitude" width="100" />
        <el-table-column label="高度(m)" align="center" prop="altitude" width="80" />
        <el-table-column label="速度(m/s)" align="center" prop="speed" width="90" />
        <el-table-column label="航向(°)" align="center" prop="heading" width="80" />
      </el-table-column>
      
      <!-- 任务信息分组 -->
      <el-table-column label="任务信息" align="center">
        <el-table-column label="任务ID" align="center" prop="currentMissionId" width="100" />
        <el-table-column label="订单编号" align="center" prop="currentOrderId" width="120">
          <template #default="{ row }">
            <span v-if="!row.currentOrderId">-</span>
            <el-link 
              v-else
              type="primary" 
              @click="viewOrder(row.currentOrderId)"
              :underline="false"
            >
              <Icon icon="ep:document" class="mr-1" />
              {{ row.currentOrderId }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="起送柜" align="center" prop="sourceCabinetCode" width="100" />
        <el-table-column label="目标柜" align="center" prop="targetCabinetCode" width="100" />
      </el-table-column>
      
      <el-table-column label="操作员" align="center" prop="operator" width="100" />
      
      <!-- 时间信息分组 -->
      <el-table-column label="时间信息" align="center">
      <el-table-column
          label="最后飞行"
        align="center"
        prop="lastFlightTime"
        :formatter="dateFormatter"
          width="140"
      />
      <el-table-column
          label="最后维护"
        align="center"
        prop="lastMaintenanceTime"
        :formatter="dateFormatter"
          width="140"
      />
      <el-table-column
          label="下次维护"
        align="center"
        prop="nextMaintenanceTime"
        :formatter="dateFormatter"
          width="140"
        />
      </el-table-column>
      
      <el-table-column label="故障信息" align="center" prop="errorMessage" width="150" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="140"
      />
      
      <el-table-column label="操作" align="center" width="120" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.droneCode)"
            v-hasPermi="['drone:drones:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.droneCode)"
            v-hasPermi="['drone:drones:delete']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <dronesForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { dronesApi, dronesVO } from '@/api/drone/droneComm'
import dronesForm from './dronesForm.vue'

/** 无人机 列表 */
defineOptions({ name: 'drones' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<dronesVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const showAdvancedSearch = ref(false) // 是否显示高级搜索

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  droneName: undefined,
  model: undefined,
  serialNumber: undefined,
  manufacturer: undefined,
  status: undefined,
  batteryLevel: undefined,
  currentMissionId: undefined,
  currentOrderId: undefined,
  sourceCabinetCode: undefined,
  targetCabinetCode: undefined,
  operator: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

// 状态文本映射
const getStatusText = (status: number) => {
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

// 状态类型映射
const getStatusType = (status: number) => {
  const typeMap = {
    0: 'info',    // 待机
    1: 'success', // 飞行中
    2: 'warning', // 返航中
    3: 'primary', // 充电中
    4: 'warning', // 维护中
    5: 'danger',  // 故障
    6: ''         // 离线
  }
  return typeMap[status] || ''
}

// 电池颜色映射
const getBatteryColor = (level: number) => {
  if (level > 60) return '#67c23a'  // 绿色
  if (level > 30) return '#e6a23c'  // 黄色
  if (level > 10) return '#f56c6c'  // 红色
  return '#909399'  // 灰色
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await dronesApi.getdronesPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, droneCode?: string) => {
  formRef.value.open(type, droneCode)
}

/** 删除按钮操作 */
const handleDelete = async (droneCode: string) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await dronesApi.deletedrones(droneCode)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await dronesApi.exportdrones(queryParams)
    download.excel(data, '无人机.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 查看订单详情 */
const router = useRouter()
const viewOrder = (orderId: number) => {
  // 跳转到订单详情页面
  router.push({ name: 'TradeOrderDetail', params: { id: orderId } })
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

<style scoped>
:deep(.el-table .el-table__cell) {
  padding: 8px 0;
}
:deep(.el-progress-bar__outer) {
  height: 10px;
}
:deep(.el-progress-bar__inner) {
  border-radius: 5px;
}
</style>