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
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Refresh } from '@element-plus/icons-vue'

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
  total: 100
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
  total: 50
})

// 详情弹窗
const selectedTransportTask = ref<any>(null)
const selectedDispatchTask = ref<any>(null)
const transportDetailVisible = ref(false)
const dispatchDetailVisible = ref(false)

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
}

// 创建运输单
const createTransportTask = () => {
  ElMessage.success('创建运输单功能开发中...')
}

// 创建调度单
const createDispatchTask = () => {
  ElMessage.success('创建调度单功能开发中...')
}

// 运输单搜索
const searchTransportTasks = () => {
  console.log('搜索运输单:', transportFilter)
}

const resetTransportFilter = () => {
  transportFilter.status = ''
  transportFilter.keyword = ''
  transportFilter.dateRange = []
}

// 调度单搜索
const searchDispatchTasks = () => {
  console.log('搜索调度单:', dispatchFilter)
}

const resetDispatchFilter = () => {
  dispatchFilter.status = ''
  dispatchFilter.keyword = ''
  dispatchFilter.dateRange = []
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
  ElMessage.success('数据刷新成功')
}

// 分页处理
const handleTransportSizeChange = (val: number) => {
  transportPage.size = val
}

const handleTransportCurrentChange = (val: number) => {
  transportPage.current = val
}

const handleDispatchSizeChange = (val: number) => {
  dispatchPage.size = val
}

const handleDispatchCurrentChange = (val: number) => {
  dispatchPage.current = val
}
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
}
</style> 