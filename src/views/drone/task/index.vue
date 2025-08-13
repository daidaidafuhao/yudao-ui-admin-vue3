<template>
  <div class="drone-task">
    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <el-icon class="mr-8px"><Document /></el-icon>
            <span class="text-18px font-bold">任务协同</span>
          </div>
          <div class="flex items-center space-x-8px">
            <el-button type="primary" @click="createTransportTask">创建运输单</el-button>
            <el-button type="success" @click="createDispatchTask">创建调度单</el-button>
            <el-button @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="task-content">
        <!-- 任务类型切换 -->
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="运输单管理" name="transport">
            <div class="tab-content">
              <!-- 筛选条件 -->
              <el-row :gutter="16" class="mb-16px">
                <el-col :span="6">
                  <el-select v-model="transportFilter.status" placeholder="任务状态" clearable>
                    <el-option label="全部" value="" />
                    <el-option label="待审核" value="pending" />
                    <el-option label="已审核" value="approved" />
                    <el-option label="放货中" value="loading" />
                    <el-option label="执飞中" value="flying" />
                    <el-option label="已完成" value="completed" />
                    <el-option label="已取消" value="cancelled" />
                  </el-select>
                </el-col>
                <el-col :span="6">
                  <el-input v-model="transportFilter.keyword" placeholder="搜索任务编号/物品信息" clearable />
                </el-col>
                <el-col :span="6">
                  <el-date-picker
                    v-model="transportFilter.dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                  />
                </el-col>
                <el-col :span="6">
                  <el-button type="primary" @click="searchTransportTasks">搜索</el-button>
                  <el-button @click="resetTransportFilter">重置</el-button>
                </el-col>
              </el-row>

              <!-- 运输单列表 -->
              <el-table :data="transportTaskList" style="width: 100%" v-loading="transportLoading">
                <el-table-column prop="taskNo" label="任务编号" width="150" />
                <el-table-column prop="itemInfo" label="物品信息" width="200" />
                <el-table-column prop="startPoint" label="起始点" width="150" />
                <el-table-column prop="endPoint" label="终点" width="150" />
                <el-table-column prop="routeName" label="航线" width="120" />
                <el-table-column prop="droneName" label="飞行器" width="120" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getTaskStatusType(row.status)">
                      {{ getTaskStatusText(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="createTime" label="创建时间" width="180" />
                <el-table-column label="操作" width="200" fixed="right">
                  <template #default="{ row }">
                    <el-button size="small" @click="viewTransportDetail(row)">详情</el-button>
                    <el-button 
                      size="small" 
                      type="primary" 
                      @click="approveTransport(row)"
                      v-if="row.status === 'pending'"
                    >
                      审核
                    </el-button>
                    <el-button 
                      size="small" 
                      type="warning" 
                      @click="cancelTransport(row)"
                      v-if="['pending', 'approved'].includes(row.status)"
                    >
                      取消
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <!-- 分页 -->
              <div class="flex justify-end mt-16px">
                <el-pagination
                  v-model:current-page="transportPage.current"
                  v-model:page-size="transportPage.size"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="transportPage.total"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleTransportSizeChange"
                  @current-change="handleTransportCurrentChange"
                />
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="调度单管理" name="dispatch">
            <div class="tab-content">
              <!-- 筛选条件 -->
              <el-row :gutter="16" class="mb-16px">
                <el-col :span="6">
                  <el-select v-model="dispatchFilter.status" placeholder="任务状态" clearable>
                    <el-option label="全部" value="" />
                    <el-option label="待审核" value="pending" />
                    <el-option label="已审核" value="approved" />
                    <el-option label="执飞中" value="flying" />
                    <el-option label="已完成" value="completed" />
                    <el-option label="已取消" value="cancelled" />
                  </el-select>
                </el-col>
                <el-col :span="6">
                  <el-input v-model="dispatchFilter.keyword" placeholder="搜索任务编号/航线" clearable />
                </el-col>
                <el-col :span="6">
                  <el-date-picker
                    v-model="dispatchFilter.dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                  />
                </el-col>
                <el-col :span="6">
                  <el-button type="primary" @click="searchDispatchTasks">搜索</el-button>
                  <el-button @click="resetDispatchFilter">重置</el-button>
                </el-col>
              </el-row>

              <!-- 调度单列表 -->
              <el-table :data="dispatchTaskList" style="width: 100%" v-loading="dispatchLoading">
                <el-table-column prop="taskNo" label="任务编号" width="150" />
                <el-table-column prop="routeName" label="航线" width="150" />
                <el-table-column prop="startPoint" label="起始点" width="150" />
                <el-table-column prop="endPoint" label="终点" width="150" />
                <el-table-column prop="droneName" label="飞行器" width="120" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getTaskStatusType(row.status)">
                      {{ getTaskStatusText(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="createTime" label="创建时间" width="180" />
                <el-table-column label="操作" width="200" fixed="right">
                  <template #default="{ row }">
                    <el-button size="small" @click="viewDispatchDetail(row)">详情</el-button>
                    <el-button 
                      size="small" 
                      type="primary" 
                      @click="approveDispatch(row)"
                      v-if="row.status === 'pending'"
                    >
                      审核
                    </el-button>
                    <el-button 
                      size="small" 
                      type="warning" 
                      @click="cancelDispatch(row)"
                      v-if="['pending', 'approved'].includes(row.status)"
                    >
                      取消
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <!-- 分页 -->
              <div class="flex justify-end mt-16px">
                <el-pagination
                  v-model:current-page="dispatchPage.current"
                  v-model:page-size="dispatchPage.size"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="dispatchPage.total"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleDispatchSizeChange"
                  @current-change="handleDispatchCurrentChange"
                />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>

    <!-- 运输单详情弹窗 -->
    <el-dialog
      v-model="transportDetailVisible"
      title="运输单详情"
      width="800px"
    >
      <div v-if="selectedTransportTask" class="task-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务编号">
            {{ selectedTransportTask.taskNo }}
          </el-descriptions-item>
          <el-descriptions-item label="任务状态">
            <el-tag :type="getTaskStatusType(selectedTransportTask.status)">
              {{ getTaskStatusText(selectedTransportTask.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="物品信息">
            {{ selectedTransportTask.itemInfo }}
          </el-descriptions-item>
          <el-descriptions-item label="物品重量">
            {{ selectedTransportTask.weight }}kg
          </el-descriptions-item>
          <el-descriptions-item label="起始点">
            {{ selectedTransportTask.startPoint }}
          </el-descriptions-item>
          <el-descriptions-item label="终点">
            {{ selectedTransportTask.endPoint }}
          </el-descriptions-item>
          <el-descriptions-item label="航线">
            {{ selectedTransportTask.routeName }}
          </el-descriptions-item>
          <el-descriptions-item label="飞行器">
            {{ selectedTransportTask.droneName }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ selectedTransportTask.createTime }}
          </el-descriptions-item>
          <el-descriptions-item label="预计完成时间">
            {{ selectedTransportTask.estimatedTime }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 调度单详情弹窗 -->
    <el-dialog
      v-model="dispatchDetailVisible"
      title="调度单详情"
      width="800px"
    >
      <div v-if="selectedDispatchTask" class="task-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务编号">
            {{ selectedDispatchTask.taskNo }}
          </el-descriptions-item>
          <el-descriptions-item label="任务状态">
            <el-tag :type="getTaskStatusType(selectedDispatchTask.status)">
              {{ getTaskStatusText(selectedDispatchTask.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="航线">
            {{ selectedDispatchTask.routeName }}
          </el-descriptions-item>
          <el-descriptions-item label="飞行器">
            {{ selectedDispatchTask.droneName }}
          </el-descriptions-item>
          <el-descriptions-item label="起始点">
            {{ selectedDispatchTask.startPoint }}
          </el-descriptions-item>
          <el-descriptions-item label="终点">
            {{ selectedDispatchTask.endPoint }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ selectedDispatchTask.createTime }}
          </el-descriptions-item>
          <el-descriptions-item label="预计完成时间">
            {{ selectedDispatchTask.estimatedTime }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 创建运输单弹窗 -->
    <el-dialog
      v-model="createTransportVisible"
      title="创建运输单"
      width="800px"
      :before-close="handleCreateTransportClose"
    >
      <el-form
        ref="transportFormRef"
        :model="transportForm"
        :rules="transportFormRules"
        label-width="120px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="物品名称" prop="itemName">
              <el-select
                v-model="transportForm.itemName"
                placeholder="请选择物品"
                filterable
                allow-create
                @change="handleItemChange"
              >
                <el-option
                  v-for="item in itemOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物品重量" prop="weight">
              <el-input-number
                v-model="transportForm.weight "
                :min="0.1"
                :max="50"
                :precision="1"
                placeholder="请输入重量"
                style="width: 100%"
              >
                <template #append>kg</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="物品描述" prop="itemDescription">
              <el-input
                v-model="transportForm.itemDescription"
                type="textarea"
                :rows="3"
                placeholder="请输入物品详细描述"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="航线选择" prop="routeId">
              <el-select
                v-model="transportForm.routeId"
                placeholder="请选择航线"
                @change="handleRouteChange"
              >
                <el-option
                  v-for="route in routeOptions"
                  :key="route.id"
                  :label="`${route.name} (${route.startPoint} → ${route.endPoint})`"
                  :value="route.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="飞行器" prop="droneId">
              <el-select
                v-model="transportForm.droneId"
                placeholder="请选择飞行器"
                :disabled="!transportForm.routeId"
              >
                <el-option
                  v-for="drone in availableDrones"
                  :key="drone.id"
                  :label="`${drone.name} (载重:${drone.maxWeight}kg)`"
                  :value="drone.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" v-if="selectedRoute">
          <el-col :span="12">
            <el-form-item label="起始点">
              <el-input v-model="selectedRoute.startPoint" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="终点">
              <el-input v-model="selectedRoute.endPoint" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="transportForm.priority" placeholder="请选择优先级">
                <el-option label="普通" value="normal" />
                <el-option label="紧急" value="urgent" />
                <el-option label="特急" value="critical" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计送达时间" prop="estimatedTime">
              <el-date-picker
                v-model="transportForm.estimatedTime"
                type="datetime"
                placeholder="请选择预计送达时间"
                style="width: 100%"
                :disabled-date="disabledDate"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="transportForm.remark"
                type="textarea"
                :rows="2"
                placeholder="请输入备注信息"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCreateTransportClose">取消</el-button>
          <el-button type="primary" @click="submitTransportTask" :loading="submitLoading">
            创建任务
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 创建调度单弹窗 -->
    <el-dialog
      v-model="createDispatchVisible"
      title="创建调度单"
      width="700px"
      :before-close="handleCreateDispatchClose"
    >
      <el-form
        ref="dispatchFormRef"
        :model="dispatchForm"
        :rules="dispatchFormRules"
        label-width="120px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="航线选择" prop="routeId">
              <el-select
                v-model="dispatchForm.routeId"
                placeholder="请选择航线"
                @change="handleDispatchRouteChange"
              >
                <el-option
                  v-for="route in routeOptions"
                  :key="route.id"
                  :label="`${route.name} (${route.startPoint} → ${route.endPoint})`"
                  :value="route.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="飞行器" prop="droneId">
              <el-select
                v-model="dispatchForm.droneId"
                placeholder="请选择飞行器"
                :disabled="!dispatchForm.routeId"
              >
                <el-option
                  v-for="drone in availableDrones"
                  :key="drone.id"
                  :label="`${drone.name} (载重:${drone.maxWeight}kg)`"
                  :value="drone.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" v-if="selectedDispatchRoute">
          <el-col :span="12">
            <el-form-item label="起始点">
              <el-input v-model="selectedDispatchRoute.startPoint" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="终点">
              <el-input v-model="selectedDispatchRoute.endPoint" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="dispatchForm.priority" placeholder="请选择优先级">
                <el-option label="普通" value="normal" />
                <el-option label="紧急" value="urgent" />
                <el-option label="特急" value="critical" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计完成时间" prop="estimatedTime">
              <el-date-picker
                v-model="dispatchForm.estimatedTime"
                type="datetime"
                placeholder="请选择预计完成时间"
                style="width: 100%"
                :disabled-date="disabledDate"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="dispatchForm.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入备注信息"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCreateDispatchClose">取消</el-button>
          <el-button type="primary" @click="submitDispatchTask" :loading="dispatchSubmitLoading">
            创建任务
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Refresh } from '@element-plus/icons-vue'
import { getDictOptions, DICT_TYPE } from '@/utils/dict'

defineOptions({ name: 'DroneTask' })

// 当前激活的标签页
const activeTab = ref('transport')

// 运输单相关
const transportLoading = ref(false)
const transportTaskList = ref([
  {
    id: 1,
    taskNo: 'T-20241201-001',
    itemInfo: '医疗用品',
    weight: 2.5,
    startPoint: '北京市朝阳区',
    endPoint: '北京市海淀区',
    routeName: 'RT-001',
    droneName: '飞行器001',
    status: 'pending',
    createTime: '2024-12-01 10:00:00',
    estimatedTime: '2024-12-01 11:00:00'
  },
  {
    id: 2,
    taskNo: 'T-20241201-002',
    itemInfo: '快递包裹',
    weight: 1.8,
    startPoint: '北京市西城区',
    endPoint: '北京市东城区',
    routeName: 'RT-002',
    droneName: '飞行器002',
    status: 'approved',
    createTime: '2024-12-01 09:30:00',
    estimatedTime: '2024-12-01 10:30:00'
  }
])

const transportFilter = reactive({
  status: '',
  keyword: '',
  dateRange: []
})

const transportPage = reactive({
  current: 1,
  size: 10,
  total: 0 // 初始化为0，根据实际数据量设置
})

// 调度单相关
const dispatchLoading = ref(false)
const dispatchTaskList = ref([
  {
    id: 1,
    taskNo: 'D-20241201-001',
    routeName: 'RT-003',
    startPoint: '北京市丰台区',
    endPoint: '北京市石景山区',
    droneName: '飞行器003',
    status: 'pending',
    createTime: '2024-12-01 08:00:00',
    estimatedTime: '2024-12-01 09:00:00'
  }
])

const dispatchFilter = reactive({
  status: '',
  keyword: '',
  dateRange: []
})

const dispatchPage = reactive({
  current: 1,
  size: 10,
  total: 0 // 初始化为0，根据实际数据量设置
})

// 详情弹窗
const selectedTransportTask = ref<any>(null)
const selectedDispatchTask = ref<any>(null)
const transportDetailVisible = ref(false)
const dispatchDetailVisible = ref(false)

// 创建运输单弹窗
const createTransportVisible = ref(false)
const submitLoading = ref(false)
const transportFormRef = ref()
const selectedRoute = ref<any>(null)

// 创建调度单弹窗
const createDispatchVisible = ref(false)
const dispatchSubmitLoading = ref(false)
const dispatchFormRef = ref()
const selectedDispatchRoute = ref<any>(null)

// 运输单表单数据
const transportForm = reactive({
  itemName: '',
  weight: undefined,
  itemDescription: '',
  routeId: '',
  droneId: '',
  priority: 'normal',
  estimatedTime: '',
  remark: ''
})

// 调度单表单数据
const dispatchForm = reactive({
  routeId: '',
  droneId: '',
  priority: 'normal',
  estimatedTime: '',
  remark: ''
})

// 表单验证规则
const transportFormRules = {
  itemName: [{ required: true, message: '请选择或输入物品名称', trigger: 'change' }],
  weight: [{ required: true, message: '请输入物品重量', trigger: 'blur' }],
  itemDescription: [{ required: true, message: '请输入物品描述', trigger: 'blur' }],
  routeId: [{ required: true, message: '请选择航线', trigger: 'change' }],
  droneId: [{ required: true, message: '请选择飞行器', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  estimatedTime: [{ required: true, message: '请选择预计送达时间', trigger: 'change' }]
}

const dispatchFormRules = {
  routeId: [{ required: true, message: '请选择航线', trigger: 'change' }],
  droneId: [{ required: true, message: '请选择飞行器', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  estimatedTime: [{ required: true, message: '请选择预计完成时间', trigger: 'change' }]
}

// 物品选项
// 使用字典数据获取运输物品类型选项
const itemOptions = computed(() => {
  return getDictOptions(DICT_TYPE.DRONE_TRANSPORT_ITEM_TYPE)
})

// 航线选项
const routeOptions = ref([
  {
    id: 'RT-001',
    name: '航线001',
    startPoint: '北京市朝阳区',
    endPoint: '北京市海淀区',
    distance: 15.2,
    estimatedTime: 25
  },
  {
    id: 'RT-002',
    name: '航线002',
    startPoint: '北京市西城区',
    endPoint: '北京市东城区',
    distance: 8.5,
    estimatedTime: 15
  },
  {
    id: 'RT-003',
    name: '航线003',
    startPoint: '北京市丰台区',
    endPoint: '北京市石景山区',
    distance: 12.8,
    estimatedTime: 20
  },
  {
    id: 'RT-004',
    name: '航线004',
    startPoint: '北京市昌平区',
    endPoint: '北京市顺义区',
    distance: 22.3,
    estimatedTime: 35
  }
])

// 可用飞行器
const availableDrones = ref([
  {
    id: 'D-001',
    name: '飞行器001',
    maxWeight: 5.0,
    status: 'available',
    batteryLevel: 85
  },
  {
    id: 'D-002',
    name: '飞行器002',
    maxWeight: 3.5,
    status: 'available',
    batteryLevel: 92
  },
  {
    id: 'D-003',
    name: '飞行器003',
    maxWeight: 8.0,
    status: 'available',
    batteryLevel: 78
  },
  {
    id: 'D-004',
    name: '飞行器004',
    maxWeight: 10.0,
    status: 'available',
    batteryLevel: 95
  }
])

// 状态映射
const getTaskStatusText = (status: string) => {
  const statusMap = {
    pending: '待审核',
    approved: '已审核',
    loading: '放货中',
    flying: '执飞中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || '未知'
}

const getTaskStatusType = (status: string) => {
  const typeMap = {
    pending: 'info',
    approved: 'warning',
    loading: 'warning',
    flying: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return typeMap[status] || 'info'
}

// 标签页切换
const handleTabChange = (tab: string) => {
  console.log('切换到标签页:', tab)
  if (tab === 'transport') {
    loadTransportTasks()
  } else if (tab === 'dispatch') {
    loadDispatchTasks()
  }
}

// 创建运输单
const createTransportTask = () => {
  // 重置表单
  resetTransportForm()
  createTransportVisible.value = true
}

// 重置运输单表单
const resetTransportForm = () => {
  Object.assign(transportForm, {
    itemName: '',
    weight: undefined,
    itemDescription: '',
    routeId: '',
    droneId: '',
    priority: 'normal',
    estimatedTime: '',
    remark: ''
  })
  selectedRoute.value = null
  transportFormRef.value?.clearValidate()
}

// 处理物品选择变化
const handleItemChange = (value: string) => {
  console.log('选择物品:', value)
}

// 处理航线选择变化
const handleRouteChange = (routeId: string) => {
  const route = routeOptions.value.find(r => r.id === routeId)
  selectedRoute.value = route
  // 清空飞行器选择
  transportForm.droneId = ''
  console.log('选择航线:', route)
}

// 处理调度单航线选择变化
const handleDispatchRouteChange = (routeId: string) => {
  const route = routeOptions.value.find(r => r.id === routeId)
  selectedDispatchRoute.value = route
  // 清空飞行器选择
  dispatchForm.droneId = ''
  console.log('选择调度航线:', route)
}

// 关闭创建运输单弹窗
const handleCreateTransportClose = () => {
  createTransportVisible.value = false
  resetTransportForm()
}

// 关闭创建调度单弹窗
const handleCreateDispatchClose = () => {
  createDispatchVisible.value = false
  resetDispatchForm()
}

// 禁用过去的日期
const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 8.64e7 // 禁用昨天之前的日期
}

// 提交运输单
const submitTransportTask = async () => {
  try {
    await transportFormRef.value?.validate()
    
    submitLoading.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 生成任务编号
    const taskNo = `T-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(transportTaskList.value.length + 1).padStart(3, '0')}`
    
    // 获取选中的航线和飞行器信息
    const selectedRouteInfo = routeOptions.value.find(r => r.id === transportForm.routeId)
    const selectedDrone = availableDrones.value.find(d => d.id === transportForm.droneId)
    
    // 创建新的运输单
    const newTask = {
      id: transportTaskList.value.length + 1,
      taskNo,
      itemInfo: `${transportForm.itemName} - ${transportForm.itemDescription}`,
      weight: transportForm.weight || 0,
      startPoint: selectedRouteInfo?.startPoint || '',
      endPoint: selectedRouteInfo?.endPoint || '',
      routeName: selectedRouteInfo?.name || '',
      droneName: selectedDrone?.name || '',
      status: 'pending',
      priority: transportForm.priority,
      createTime: new Date().toLocaleString(),
      estimatedTime: new Date(transportForm.estimatedTime).toLocaleString(),
      remark: transportForm.remark
    }
    
    // 添加到列表
    transportTaskList.value.unshift(newTask)
    
    // 更新总数
    transportPage.total = transportTaskList.value.length
    
    ElMessage.success('运输单创建成功！')
    createTransportVisible.value = false
    resetTransportForm()
    
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 提交调度单
const submitDispatchTask = async () => {
  if (!dispatchFormRef.value) return
  
  try {
    dispatchSubmitLoading.value = true
    
    // 表单验证
    await dispatchFormRef.value.validate()
    
    // 模拟提交延迟
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 生成任务编号
    const taskNo = `D-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(dispatchTaskList.value.length + 1).padStart(3, '0')}`
    
    // 获取选中的航线和飞行器信息
    const selectedRouteInfo = routeOptions.value.find(r => r.id === dispatchForm.routeId)
    const selectedDrone = availableDrones.value.find(d => d.id === dispatchForm.droneId)
    
    // 创建新的调度单
    const newTask = {
      id: dispatchTaskList.value.length + 1,
      taskNo,
      routeName: selectedRouteInfo?.name || '',
      startPoint: selectedRouteInfo?.startPoint || '',
      endPoint: selectedRouteInfo?.endPoint || '',
      droneName: selectedDrone?.name || '',
      status: 'pending',
      createTime: new Date().toLocaleString(),
      estimatedTime: new Date(dispatchForm.estimatedTime).toLocaleString()
    }
    
    // 添加到列表
    dispatchTaskList.value.unshift(newTask)
    
    // 更新总数
    dispatchPage.total = dispatchTaskList.value.length
    
    ElMessage.success('调度单创建成功！')
    createDispatchVisible.value = false
    resetDispatchForm()
    
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    dispatchSubmitLoading.value = false
  }
}

// 创建调度单
const createDispatchTask = () => {
  // 重置表单
  resetDispatchForm()
  createDispatchVisible.value = true
}

// 重置调度单表单
const resetDispatchForm = () => {
  Object.assign(dispatchForm, {
    routeId: '',
    droneId: '',
    priority: 'normal',
    estimatedTime: '',
    remark: ''
  })
  selectedDispatchRoute.value = null
  dispatchFormRef.value?.clearValidate()
}

// 运输单搜索
const searchTransportTasks = () => {
  transportPage.current = 1 // 重置到第一页
  loadTransportTasks() // 重新加载数据
}

const resetTransportFilter = () => {
  transportFilter.status = ''
  transportFilter.keyword = ''
  transportFilter.dateRange = []
  transportPage.current = 1 // 重置到第一页
  loadTransportTasks() // 重新加载数据
}

// 调度单搜索
const searchDispatchTasks = () => {
  dispatchPage.current = 1 // 重置到第一页
  loadDispatchTasks() // 重新加载数据
}

const resetDispatchFilter = () => {
  dispatchFilter.status = ''
  dispatchFilter.keyword = ''
  dispatchFilter.dateRange = []
  dispatchPage.current = 1 // 重置到第一页
  loadDispatchTasks() // 重新加载数据
}

// 查看详情
const viewTransportDetail = (row: any) => {
  selectedTransportTask.value = row
  transportDetailVisible.value = true
}

const viewDispatchDetail = (row: any) => {
  selectedDispatchTask.value = row
  dispatchDetailVisible.value = true
}

// 审核任务
const approveTransport = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要审核通过运输单 ${row.taskNo} 吗？`, '确认审核')
    console.log('审核运输单:', row)
    ElMessage.success('审核通过成功')
  } catch {
    // 用户取消
  }
}

const approveDispatch = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要审核通过调度单 ${row.taskNo} 吗？`, '确认审核')
    console.log('审核调度单:', row)
    ElMessage.success('审核通过成功')
  } catch {
    // 用户取消
  }
}

// 取消任务
const cancelTransport = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要取消运输单 ${row.taskNo} 吗？`, '确认取消')
    console.log('取消运输单:', row)
    ElMessage.success('取消成功')
  } catch {
    // 用户取消
  }
}

const cancelDispatch = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要取消调度单 ${row.taskNo} 吗？`, '确认取消')
    console.log('取消调度单:', row)
    ElMessage.success('取消成功')
  } catch {
    // 用户取消
  }
}

// 刷新数据
const refreshData = () => {
  if (activeTab.value === 'transport') {
    loadTransportTasks()
  } else if (activeTab.value === 'dispatch') {
    loadDispatchTasks()
  }
  ElMessage.success('数据刷新成功')
}

// 数据加载函数
const loadTransportTasks = async () => {
  try {
    transportLoading.value = true
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 这里应该调用实际的API，传入分页参数和筛选条件
    console.log('加载运输单数据:', {
      page: transportPage.current,
      size: transportPage.size,
      filter: transportFilter
    })
    
    // 模拟分页数据处理 - 根据实际数据量设置总数
    transportPage.total = transportTaskList.value.length
    
  } catch (error) {
    console.error('加载运输单数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    transportLoading.value = false
  }
}

const loadDispatchTasks = async () => {
  try {
    dispatchLoading.value = true
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 这里应该调用实际的API，传入分页参数和筛选条件
    console.log('加载调度单数据:', {
      page: dispatchPage.current,
      size: dispatchPage.size,
      filter: dispatchFilter
    })
    
    // 模拟分页数据处理 - 根据实际数据量设置总数
    dispatchPage.total = dispatchTaskList.value.length
    
  } catch (error) {
    console.error('加载调度单数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    dispatchLoading.value = false
  }
}

// 分页处理
const handleTransportSizeChange = (val: number) => {
  transportPage.size = val
  transportPage.current = 1 // 重置到第一页
  loadTransportTasks() // 重新加载数据
}

const handleTransportCurrentChange = (val: number) => {
  transportPage.current = val
  loadTransportTasks() // 重新加载数据
}

const handleDispatchSizeChange = (val: number) => {
  dispatchPage.size = val
  dispatchPage.current = 1 // 重置到第一页
  loadDispatchTasks() // 重新加载数据
}

const handleDispatchCurrentChange = (val: number) => {
  dispatchPage.current = val
  loadDispatchTasks() // 重新加载数据
}

// 组件挂载时初始化数据
onMounted(() => {
  // 根据当前激活的标签页加载对应数据
  if (activeTab.value === 'transport') {
    loadTransportTasks()
  } else if (activeTab.value === 'dispatch') {
    loadDispatchTasks()
  }
})
</script>

<style lang="scss" scoped>
.drone-task {
  .task-content {
    padding: 16px 0;
  }

  .tab-content {
    padding: 16px 0;
  }

  .task-detail {
    .el-descriptions {
      margin-top: 16px;
    }
  }

  // 创建运输单弹窗样式
  .el-dialog {
    .el-form {
      .el-form-item {
        margin-bottom: 18px;
      }

      .el-input-number {
        width: 100%;
      }

      .el-select {
        width: 100%;
      }

      .el-date-picker {
        width: 100%;
      }
    }

    .dialog-footer {
      text-align: right;
      padding-top: 16px;
      border-top: 1px solid #e4e7ed;

      .el-button {
        margin-left: 12px;
      }
    }
  }

  // 表单标签样式
  .el-form-item__label {
    font-weight: 500;
    color: #606266;
  }

  // 禁用输入框样式
  .el-input.is-disabled .el-input__inner {
    background-color: #f5f7fa;
    border-color: #e4e7ed;
    color: #c0c4cc;
  }
}
</style>