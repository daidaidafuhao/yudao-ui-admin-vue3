<template>
  <div class="drone-monitor">
    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <el-icon class="mr-8px"><Monitor /></el-icon>
            <span class="text-18px font-bold">飞行监控</span>
          </div>
          <div class="flex items-center space-x-8px">
            <el-button type="primary" @click="batchStart">批量开始</el-button>
            <el-button type="warning" @click="batchPause">批量暂停</el-button>
            <el-button @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="monitor-content">
        <!-- 筛选条件 -->
        <el-row :gutter="16" class="mb-16px">
          <el-col :span="6">
            <el-select v-model="filterStatus" placeholder="飞行器状态" clearable>
              <el-option label="全部" value="" />
              <el-option label="空闲" value="idle" />
              <el-option label="飞行中" value="flying" />
              <el-option label="充电中" value="charging" />
              <el-option label="故障" value="error" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="filterTask" placeholder="任务状态" clearable>
              <el-option label="全部" value="" />
              <el-option label="待执行" value="pending" />
              <el-option label="执行中" value="executing" />
              <el-option label="已完成" value="completed" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-input v-model="searchKeyword" placeholder="搜索飞行器编号/名称" clearable />
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="searchDrones">搜索</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-col>
        </el-row>

        <!-- 飞行器列表 -->
        <el-table
          :data="droneList"
          style="width: 100%"
          @selection-change="handleSelectionChange"
          v-loading="loading"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="droneCode" label="飞行器编号" width="120" />
          <el-table-column prop="droneName" label="飞行器名称" width="150" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="taskStatus" label="任务状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getTaskStatusType(row.taskStatus)">
                {{ getTaskStatusText(row.taskStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="batteryLevel" label="电池电量" width="120">
            <template #default="{ row }">
              <el-progress
                :percentage="row.batteryLevel"
                :color="getBatteryColor(row.batteryLevel)"
                :stroke-width="8"
              />
            </template>
          </el-table-column>
          <el-table-column prop="currentTask" label="当前任务" />
          <el-table-column prop="location" label="当前位置" width="150" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewDetail(row)">详情</el-button>
              <el-button 
                size="small" 
                type="primary" 
                @click="startTask(row)"
                :disabled="row.status !== 'idle'"
              >
                开始任务
              </el-button>
              <el-button 
                size="small" 
                type="warning" 
                @click="pauseTask(row)"
                :disabled="row.status !== 'flying'"
              >
                暂停
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="emergencyStop(row)"
              >
                紧急停止
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="flex justify-end mt-16px">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>

    <!-- 飞行器详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="飞行器详情"
      width="600px"
    >
      <div v-if="selectedDrone" class="drone-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="飞行器编号">
            {{ selectedDrone.droneCode }}
          </el-descriptions-item>
          <el-descriptions-item label="飞行器名称">
            {{ selectedDrone.droneName }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedDrone.status)">
              {{ getStatusText(selectedDrone.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="任务状态">
            <el-tag :type="getTaskStatusType(selectedDrone.taskStatus)">
              {{ getTaskStatusText(selectedDrone.taskStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="电池电量">
            <el-progress
              :percentage="selectedDrone.batteryLevel"
              :color="getBatteryColor(selectedDrone.batteryLevel)"
            />
          </el-descriptions-item>
          <el-descriptions-item label="当前任务">
            {{ selectedDrone.currentTask || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="当前位置">
            {{ selectedDrone.location }}
          </el-descriptions-item>
          <el-descriptions-item label="飞行高度">
            {{ selectedDrone.altitude }}m
          </el-descriptions-item>
          <el-descriptions-item label="飞行速度">
            {{ selectedDrone.speed }}m/s
          </el-descriptions-item>
          <el-descriptions-item label="航向角度">
            {{ selectedDrone.heading }}°
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Monitor, Refresh } from '@element-plus/icons-vue'

defineOptions({ name: 'DroneMonitor' })

// 筛选条件
const filterStatus = ref('')
const filterTask = ref('')
const searchKeyword = ref('')

// 表格数据
const loading = ref(false)
const droneList = ref([
  {
    id: 1,
    droneCode: 'DR-001',
    droneName: '飞行器001',
    status: 'idle',
    taskStatus: 'pending',
    batteryLevel: 85,
    currentTask: 'T-20241201-001',
    location: '北京市朝阳区',
    altitude: 120,
    speed: 15,
    heading: 45
  },
  {
    id: 2,
    droneCode: 'DR-002',
    droneName: '飞行器002',
    status: 'flying',
    taskStatus: 'executing',
    batteryLevel: 65,
    currentTask: 'T-20241201-002',
    location: '北京市海淀区',
    altitude: 150,
    speed: 18,
    heading: 90
  },
  {
    id: 3,
    droneCode: 'DR-003',
    droneName: '飞行器003',
    status: 'charging',
    taskStatus: 'completed',
    batteryLevel: 95,
    currentTask: '',
    location: '北京市西城区',
    altitude: 0,
    speed: 0,
    heading: 0
  }
])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 选中的飞行器
const selectedDrones = ref<any[]>([])
const selectedDrone = ref<any>(null)
const detailVisible = ref(false)

// 状态映射
const getStatusText = (status: string) => {
  const statusMap = {
    idle: '空闲',
    flying: '飞行中',
    charging: '充电中',
    error: '故障',
    offline: '离线'
  }
  return statusMap[status] || '未知'
}

const getStatusType = (status: string) => {
  const typeMap = {
    idle: 'success',
    flying: 'warning',
    charging: 'info',
    error: 'danger',
    offline: 'info'
  }
  return typeMap[status] || 'info'
}

const getTaskStatusText = (status: string) => {
  const statusMap = {
    pending: '待执行',
    executing: '执行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || '未知'
}

const getTaskStatusType = (status: string) => {
  const typeMap = {
    pending: 'info',
    executing: 'warning',
    completed: 'success',
    cancelled: 'danger'
  }
  return typeMap[status] || 'info'
}

const getBatteryColor = (level: number) => {
  if (level > 60) return '#67c23a'
  if (level > 30) return '#e6a23c'
  return '#f56c6c'
}

// 搜索
const searchDrones = () => {
  console.log('搜索飞行器:', { filterStatus: filterStatus.value, filterTask: filterTask.value, searchKeyword: searchKeyword.value })
}

const resetFilter = () => {
  filterStatus.value = ''
  filterTask.value = ''
  searchKeyword.value = ''
}

// 批量操作
const handleSelectionChange = (selection: any[]) => {
  selectedDrones.value = selection
}

const batchStart = async () => {
  if (selectedDrones.value.length === 0) {
    ElMessage.warning('请选择要操作的飞行器')
    return
  }
  
  try {
    await ElMessageBox.confirm(`确定要批量开始 ${selectedDrones.value.length} 个飞行器的任务吗？`, '确认操作')
    console.log('批量开始任务:', selectedDrones.value)
    ElMessage.success('批量开始任务成功')
  } catch {
    // 用户取消
  }
}

const batchPause = async () => {
  if (selectedDrones.value.length === 0) {
    ElMessage.warning('请选择要操作的飞行器')
    return
  }
  
  try {
    await ElMessageBox.confirm(`确定要批量暂停 ${selectedDrones.value.length} 个飞行器的任务吗？`, '确认操作')
    console.log('批量暂停任务:', selectedDrones.value)
    ElMessage.success('批量暂停任务成功')
  } catch {
    // 用户取消
  }
}

// 单个操作
const viewDetail = (row: any) => {
  selectedDrone.value = row
  detailVisible.value = true
}

const startTask = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要开始飞行器 ${row.droneCode} 的任务吗？`, '确认操作')
    console.log('开始任务:', row)
    ElMessage.success('开始任务成功')
  } catch {
    // 用户取消
  }
}

const pauseTask = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要暂停飞行器 ${row.droneCode} 的任务吗？`, '确认操作')
    console.log('暂停任务:', row)
    ElMessage.success('暂停任务成功')
  } catch {
    // 用户取消
  }
}

const emergencyStop = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要紧急停止飞行器 ${row.droneCode} 吗？此操作不可撤销！`, '紧急停止', {
      confirmButtonText: '确定停止',
      confirmButtonClass: 'el-button--danger',
      type: 'warning'
    })
    console.log('紧急停止:', row)
    ElMessage.success('紧急停止成功')
  } catch {
    // 用户取消
  }
}

// 刷新数据
const refreshData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('数据刷新成功')
  }, 1000)
}

// 分页
const handleSizeChange = (val: number) => {
  pageSize.value = val
  console.log('每页显示数量:', val)
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  console.log('当前页:', val)
}
</script>

<style lang="scss" scoped>
.drone-monitor {
  .monitor-content {
    padding: 16px 0;
  }
}

.drone-detail {
  .el-descriptions {
    margin-top: 16px;
  }
}
</style> 