<template>
  <div class="drone-facility">
    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <el-icon class="mr-8px"><Setting /></el-icon>
            <span class="text-18px font-bold">低空设施管理</span>
          </div>
          <div class="flex items-center space-x-8px">
            <el-button type="primary" @click="addDrone">添加飞行器</el-button>
            <el-button type="success" @click="addLandingPoint">添加起降点</el-button>
            <el-button @click="syncData">同步数据</el-button>
            <el-button @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="facility-content">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <!-- 飞行器管理 -->
          <el-tab-pane label="飞行器管理" name="drone">
            <div class="tab-content">
              <!-- 筛选条件 -->
              <el-row :gutter="16" class="mb-16px">
                <el-col :span="6">
                  <el-select v-model="droneFilter.status" placeholder="在线状态" clearable>
                    <el-option label="全部" value="" />
                    <el-option label="在线" value="online" />
                    <el-option label="离线" value="offline" />
                    <el-option label="故障" value="error" />
                  </el-select>
                </el-col>
                <el-col :span="6">
                  <el-select v-model="droneFilter.manufacturer" placeholder="厂商" clearable>
                    <el-option label="全部" value="" />
                    <el-option label="大疆" value="dji" />
                    <el-option label="零度" value="zerotech" />
                    <el-option label="亿航" value="ehang" />
                  </el-select>
                </el-col>
                <el-col :span="6">
                  <el-input v-model="droneFilter.keyword" placeholder="搜索SN码/名称" clearable />
                </el-col>
                <el-col :span="6">
                  <el-button type="primary" @click="searchDrones">搜索</el-button>
                  <el-button @click="resetDroneFilter">重置</el-button>
                </el-col>
              </el-row>

              <!-- 飞行器列表 -->
              <el-table :data="droneList" style="width: 100%" v-loading="droneLoading">
                <el-table-column type="selection" width="55" />
                <el-table-column prop="snCode" label="SN码" width="150" />
                <el-table-column prop="name" label="飞行器名称" width="150" />
                <el-table-column prop="model" label="型号" width="120" />
                <el-table-column prop="manufacturer" label="厂商" width="100" />
                <el-table-column prop="department" label="所属部门" width="120" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getDroneStatusType(row.status)">
                      {{ getDroneStatusText(row.status) }}
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
                <el-table-column prop="videoStream" label="视频流" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.videoStream ? 'success' : 'info'" size="small">
                      {{ row.videoStream ? '可用' : '不可用' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="lastUpdate" label="最后更新" width="180" />
                <el-table-column label="操作" width="200" fixed="right">
                  <template #default="{ row }">
                    <el-button size="small" @click="viewDroneDetail(row)">详情</el-button>
                    <el-button size="small" type="primary" @click="editDrone(row)">编辑</el-button>
                    <el-button size="small" type="danger" @click="deleteDrone(row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>

              <!-- 分页 -->
              <div class="flex justify-end mt-16px">
                <el-pagination
                  v-model:current-page="dronePage.current"
                  v-model:page-size="dronePage.size"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="dronePage.total"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleDroneSizeChange"
                  @current-change="handleDroneCurrentChange"
                />
              </div>
            </div>
          </el-tab-pane>

          <!-- 起降点管理 -->
          <el-tab-pane label="起降点管理" name="landing">
            <div class="tab-content">
              <!-- 筛选条件 -->
              <el-row :gutter="16" class="mb-16px">
                <el-col :span="6">
                  <el-select v-model="landingFilter.status" placeholder="在线状态" clearable>
                    <el-option label="全部" value="" />
                    <el-option label="在线" value="online" />
                    <el-option label="离线" value="offline" />
                    <el-option label="故障" value="error" />
                  </el-select>
                </el-col>
                <el-col :span="6">
                  <el-input v-model="landingFilter.keyword" placeholder="搜索名称/地址" clearable />
                </el-col>
                <el-col :span="6">
                  <el-select v-model="landingFilter.type" placeholder="起降点类型" clearable>
                    <el-option label="全部" value="" />
                    <el-option label="固定起降点" value="fixed" />
                    <el-option label="移动起降点" value="mobile" />
                    <el-option label="临时起降点" value="temporary" />
                  </el-select>
                </el-col>
                <el-col :span="6">
                  <el-button type="primary" @click="searchLandingPoints">搜索</el-button>
                  <el-button @click="resetLandingFilter">重置</el-button>
                </el-col>
              </el-row>

              <!-- 起降点列表 -->
              <el-table :data="landingPointList" style="width: 100%" v-loading="landingLoading">
                <el-table-column type="selection" width="55" />
                <el-table-column prop="name" label="起降点名称" width="150" />
                <el-table-column prop="code" label="编号" width="120" />
                <el-table-column prop="type" label="类型" width="120">
                  <template #default="{ row }">
                    <el-tag :type="getLandingTypeType(row.type)">
                      {{ getLandingTypeText(row.type) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="address" label="地址" width="200" />
                <el-table-column prop="coordinates" label="坐标" width="150" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getLandingStatusType(row.status)">
                      {{ getLandingStatusText(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="videoStream" label="视频流" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.videoStream ? 'success' : 'info'" size="small">
                      {{ row.videoStream ? '可用' : '不可用' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="lastUpdate" label="最后更新" width="180" />
                <el-table-column label="操作" width="200" fixed="right">
                  <template #default="{ row }">
                    <el-button size="small" @click="viewLandingDetail(row)">详情</el-button>
                    <el-button size="small" type="primary" @click="editLandingPoint(row)">编辑</el-button>
                    <el-button size="small" type="danger" @click="deleteLandingPoint(row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>

              <!-- 分页 -->
              <div class="flex justify-end mt-16px">
                <el-pagination
                  v-model:current-page="landingPage.current"
                  v-model:page-size="landingPage.size"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="landingPage.total"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleLandingSizeChange"
                  @current-change="handleLandingCurrentChange"
                />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>

    <!-- 飞行器详情弹窗 -->
    <el-dialog
      v-model="droneDetailVisible"
      title="飞行器详情"
      width="800px"
    >
      <div v-if="selectedDrone" class="drone-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="SN码">
            {{ selectedDrone.snCode }}
          </el-descriptions-item>
          <el-descriptions-item label="飞行器名称">
            {{ selectedDrone.name }}
          </el-descriptions-item>
          <el-descriptions-item label="型号">
            {{ selectedDrone.model }}
          </el-descriptions-item>
          <el-descriptions-item label="厂商">
            {{ selectedDrone.manufacturer }}
          </el-descriptions-item>
          <el-descriptions-item label="所属部门">
            {{ selectedDrone.department }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getDroneStatusType(selectedDrone.status)">
              {{ getDroneStatusText(selectedDrone.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="电池电量">
            <el-progress
              :percentage="selectedDrone.batteryLevel"
              :color="getBatteryColor(selectedDrone.batteryLevel)"
            />
          </el-descriptions-item>
          <el-descriptions-item label="视频流">
            <el-tag :type="selectedDrone.videoStream ? 'success' : 'info'">
              {{ selectedDrone.videoStream ? '可用' : '不可用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">
            {{ selectedDrone.registerTime }}
          </el-descriptions-item>
          <el-descriptions-item label="最后更新">
            {{ selectedDrone.lastUpdate }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 起降点详情弹窗 -->
    <el-dialog
      v-model="landingDetailVisible"
      title="起降点详情"
      width="800px"
    >
      <div v-if="selectedLandingPoint" class="landing-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="起降点名称">
            {{ selectedLandingPoint.name }}
          </el-descriptions-item>
          <el-descriptions-item label="编号">
            {{ selectedLandingPoint.code }}
          </el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="getLandingTypeType(selectedLandingPoint.type)">
              {{ getLandingTypeText(selectedLandingPoint.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getLandingStatusType(selectedLandingPoint.status)">
              {{ getLandingStatusText(selectedLandingPoint.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="地址">
            {{ selectedLandingPoint.address }}
          </el-descriptions-item>
          <el-descriptions-item label="坐标">
            {{ selectedLandingPoint.coordinates }}
          </el-descriptions-item>
          <el-descriptions-item label="视频流">
            <el-tag :type="selectedLandingPoint.videoStream ? 'success' : 'info'">
              {{ selectedLandingPoint.videoStream ? '可用' : '不可用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ selectedLandingPoint.createTime }}
          </el-descriptions-item>
          <el-descriptions-item label="最后更新">
            {{ selectedLandingPoint.lastUpdate }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting, Refresh } from '@element-plus/icons-vue'

defineOptions({ name: 'DroneFacility' })

// 当前激活的标签页
const activeTab = ref('drone')

// 飞行器相关
const droneLoading = ref(false)
const droneList = ref([
  {
    id: 1,
    snCode: 'DJI-001-2024-001',
    name: '飞行器001',
    model: 'DJI Mavic 3',
    manufacturer: '大疆',
    department: '技术部',
    status: 'online',
    batteryLevel: 85,
    videoStream: true,
    registerTime: '2024-01-01 10:00:00',
    lastUpdate: '2024-12-01 14:30:00'
  },
  {
    id: 2,
    snCode: 'ZT-002-2024-001',
    name: '飞行器002',
    model: 'ZeroTech ZT-100',
    manufacturer: '零度',
    department: '运营部',
    status: 'offline',
    batteryLevel: 45,
    videoStream: false,
    registerTime: '2024-02-01 09:00:00',
    lastUpdate: '2024-12-01 12:15:00'
  }
])

const droneFilter = reactive({
  status: '',
  manufacturer: '',
  keyword: ''
})

const dronePage = reactive({
  current: 1,
  size: 10,
  total: 100
})

// 起降点相关
const landingLoading = ref(false)
const landingPointList = ref([
  {
    id: 1,
    name: '起降点A',
    code: 'LP-001',
    type: 'fixed',
    address: '北京市朝阳区建国门外大街1号',
    coordinates: '39.90923, 116.397428',
    status: 'online',
    videoStream: true,
    createTime: '2024-01-01 10:00:00',
    lastUpdate: '2024-12-01 14:30:00'
  },
  {
    id: 2,
    name: '起降点B',
    code: 'LP-002',
    type: 'mobile',
    address: '北京市海淀区中关村大街1号',
    coordinates: '39.91923, 116.407428',
    status: 'online',
    videoStream: true,
    createTime: '2024-02-01 09:00:00',
    lastUpdate: '2024-12-01 12:15:00'
  }
])

const landingFilter = reactive({
  status: '',
  keyword: '',
  type: ''
})

const landingPage = reactive({
  current: 1,
  size: 10,
  total: 50
})

// 详情弹窗
const selectedDrone = ref<any>(null)
const selectedLandingPoint = ref<any>(null)
const droneDetailVisible = ref(false)
const landingDetailVisible = ref(false)

// 状态映射
const getDroneStatusText = (status: string) => {
  const statusMap = {
    online: '在线',
    offline: '离线',
    error: '故障'
  }
  return statusMap[status] || '未知'
}

const getDroneStatusType = (status: string) => {
  const typeMap = {
    online: 'success',
    offline: 'info',
    error: 'danger'
  }
  return typeMap[status] || 'info'
}

const getLandingStatusText = (status: string) => {
  const statusMap = {
    online: '在线',
    offline: '离线',
    error: '故障'
  }
  return statusMap[status] || '未知'
}

const getLandingStatusType = (status: string) => {
  const typeMap = {
    online: 'success',
    offline: 'info',
    error: 'danger'
  }
  return typeMap[status] || 'info'
}

const getLandingTypeText = (type: string) => {
  const typeMap = {
    fixed: '固定起降点',
    mobile: '移动起降点',
    temporary: '临时起降点'
  }
  return typeMap[type] || '未知'
}

const getLandingTypeType = (type: string) => {
  const typeMap = {
    fixed: 'primary',
    mobile: 'warning',
    temporary: 'info'
  }
  return typeMap[type] || 'info'
}

const getBatteryColor = (level: number) => {
  if (level > 60) return '#67c23a'
  if (level > 30) return '#e6a23c'
  return '#f56c6c'
}

// 标签页切换
const handleTabChange = (tab: string) => {
  console.log('切换到标签页:', tab)
}

// 添加飞行器
const addDrone = () => {
  ElMessage.success('添加飞行器功能开发中...')
}

// 添加起降点
const addLandingPoint = () => {
  ElMessage.success('添加起降点功能开发中...')
}

// 同步数据
const syncData = () => {
  ElMessage.success('数据同步功能开发中...')
}

// 飞行器搜索
const searchDrones = () => {
  console.log('搜索飞行器:', droneFilter)
}

const resetDroneFilter = () => {
  droneFilter.status = ''
  droneFilter.manufacturer = ''
  droneFilter.keyword = ''
}

// 起降点搜索
const searchLandingPoints = () => {
  console.log('搜索起降点:', landingFilter)
}

const resetLandingFilter = () => {
  landingFilter.status = ''
  landingFilter.keyword = ''
  landingFilter.type = ''
}

// 查看详情
const viewDroneDetail = (row: any) => {
  selectedDrone.value = row
  droneDetailVisible.value = true
}

const viewLandingDetail = (row: any) => {
  selectedLandingPoint.value = row
  landingDetailVisible.value = true
}

// 编辑
const editDrone = (row: any) => {
  console.log('编辑飞行器:', row)
  ElMessage.success('编辑功能开发中...')
}

const editLandingPoint = (row: any) => {
  console.log('编辑起降点:', row)
  ElMessage.success('编辑功能开发中...')
}

// 删除
const deleteDrone = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除飞行器 ${row.name} 吗？`, '确认删除')
    console.log('删除飞行器:', row)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

const deleteLandingPoint = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除起降点 ${row.name} 吗？`, '确认删除')
    console.log('删除起降点:', row)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

// 刷新数据
const refreshData = () => {
  ElMessage.success('数据刷新成功')
}

// 分页处理
const handleDroneSizeChange = (val: number) => {
  dronePage.size = val
}

const handleDroneCurrentChange = (val: number) => {
  dronePage.current = val
}

const handleLandingSizeChange = (val: number) => {
  landingPage.size = val
}

const handleLandingCurrentChange = (val: number) => {
  landingPage.current = val
}
</script>

<style lang="scss" scoped>
.drone-facility {
  .facility-content {
    padding: 16px 0;
  }

  .tab-content {
    padding: 16px 0;
  }

  .drone-detail, .landing-detail {
    .el-descriptions {
      margin-top: 16px;
    }
  }
}
</style> 