<template>
  <div class="drone-route">
    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <el-icon class="mr-8px"><Location /></el-icon>
            <span class="text-18px font-bold">航线规划</span>
          </div>
          <div class="flex items-center space-x-8px">
            <el-button type="primary" @click="createRoute">创建航线</el-button>
            <el-button type="success" @click="importRoute">导入航线</el-button>
            <el-button @click="exportRoute">导出航线</el-button>
            <el-button @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="route-content">
        <el-row :gutter="16">
          <!-- 左侧：航线列表 -->
          <el-col :span="8">
            <el-card shadow="never">
              <template #header>
                <span class="text-16px font-bold">航线列表</span>
              </template>
              
              <!-- 搜索 -->
              <div class="mb-16px">
                <el-input 
                  v-model="searchKeyword" 
                  placeholder="搜索航线名称/编号" 
                  clearable
                  @input="searchRoutes"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>

              <!-- 航线列表 -->
              <div class="route-list">
                <div 
                  v-for="route in filteredRouteList" 
                  :key="route.id"
                  class="route-item"
                  :class="{ 'active': selectedRoute?.id === route.id }"
                  @click="selectRoute(route)"
                >
                  <div class="route-header">
                    <div class="route-name">{{ route.name }}</div>
                    <div class="route-status">
                      <el-tag :type="route.status === 'active' ? 'success' : 'info'" size="small">
                        {{ route.status === 'active' ? '启用' : '禁用' }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="route-info">
                    <div class="route-code">编号: {{ route.code }}</div>
                    <div class="route-points">航点: {{ route.pointCount }}个</div>
                    <div class="route-distance">距离: {{ route.distance }}km</div>
                    <div class="route-time">时长: {{ route.duration }}分钟</div>
                  </div>
                  <div class="route-actions">
                    <el-button size="small" @click.stop="editRoute(route)">编辑</el-button>
                    <el-button size="small" type="danger" @click.stop="deleteRoute(route)">删除</el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 右侧：地图和详情 -->
          <el-col :span="16">
            <el-card shadow="never">
              <template #header>
                <span class="text-16px font-bold">航线详情</span>
              </template>
              
              <div v-if="selectedRoute" class="route-detail">
                <!-- 航线基本信息 -->
                <el-row :gutter="16" class="mb-16px">
                  <el-col :span="12">
                    <el-descriptions :column="1" border>
                      <el-descriptions-item label="航线名称">
                        {{ selectedRoute.name }}
                      </el-descriptions-item>
                      <el-descriptions-item label="航线编号">
                        {{ selectedRoute.code }}
                      </el-descriptions-item>
                      <el-descriptions-item label="状态">
                        <el-tag :type="selectedRoute.status === 'active' ? 'success' : 'info'">
                          {{ selectedRoute.status === 'active' ? '启用' : '禁用' }}
                        </el-tag>
                      </el-descriptions-item>
                      <el-descriptions-item label="创建时间">
                        {{ selectedRoute.createTime }}
                      </el-descriptions-item>
                    </el-descriptions>
                  </el-col>
                  <el-col :span="12">
                    <el-descriptions :column="1" border>
                      <el-descriptions-item label="总距离">
                        {{ selectedRoute.distance }}km
                      </el-descriptions-item>
                      <el-descriptions-item label="预计时长">
                        {{ selectedRoute.duration }}分钟
                      </el-descriptions-item>
                      <el-descriptions-item label="航点数量">
                        {{ selectedRoute.pointCount }}个
                      </el-descriptions-item>
                      <el-descriptions-item label="使用次数">
                        {{ selectedRoute.usageCount }}次
                      </el-descriptions-item>
                    </el-descriptions>
                  </el-col>
                </el-row>

                <!-- 地图区域 -->
                <div class="map-container">
                  <div class="map-placeholder">
                    <el-icon class="map-icon"><Location /></el-icon>
                    <div class="map-text">地图区域 - 显示航线路径</div>
                    <div class="map-desc">支持拖拽创建航点，调整航线路径</div>
                  </div>
                </div>

                <!-- 航点列表 -->
                <div class="waypoint-list">
                  <div class="list-header">
                    <span class="text-16px font-bold">航点列表</span>
                    <el-button size="small" type="primary" @click="addWaypoint">添加航点</el-button>
                  </div>
                  <el-table :data="selectedRoute.waypoints" style="width: 100%">
                    <el-table-column prop="index" label="序号" width="60" />
                    <el-table-column prop="name" label="航点名称" width="120" />
                    <el-table-column prop="latitude" label="纬度" width="100" />
                    <el-table-column prop="longitude" label="经度" width="100" />
                    <el-table-column prop="altitude" label="高度(m)" width="80" />
                    <el-table-column prop="speed" label="速度(m/s)" width="100" />
                    <el-table-column prop="action" label="动作" width="120" />
                    <el-table-column label="操作" width="120">
                      <template #default="{ row, $index }">
                        <el-button size="small" @click="editWaypoint(row, $index)">编辑</el-button>
                        <el-button size="small" type="danger" @click="deleteWaypoint($index)">删除</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>

              <div v-else class="no-route">
                <el-empty description="请选择航线查看详情">
                  <el-button type="primary" @click="createRoute">创建航线</el-button>
                </el-empty>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 航线编辑弹窗 -->
    <el-dialog
      v-model="routeDialogVisible"
      :title="isEdit ? '编辑航线' : '创建航线'"
      width="600px"
    >
      <el-form :model="routeForm" :rules="routeRules" ref="routeFormRef" label-width="100px">
        <el-form-item label="航线名称" prop="name">
          <el-input v-model="routeForm.name" placeholder="请输入航线名称" />
        </el-form-item>
        <el-form-item label="航线编号" prop="code">
          <el-input v-model="routeForm.code" placeholder="请输入航线编号" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="routeForm.status" placeholder="请选择状态">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="routeForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入航线描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="routeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRoute">确定</el-button>
      </template>
    </el-dialog>

    <!-- 航点编辑弹窗 -->
    <el-dialog
      v-model="waypointDialogVisible"
      :title="isEditWaypoint ? '编辑航点' : '添加航点'"
      width="500px"
    >
      <el-form :model="waypointForm" :rules="waypointRules" ref="waypointFormRef" label-width="100px">
        <el-form-item label="航点名称" prop="name">
          <el-input v-model="waypointForm.name" placeholder="请输入航点名称" />
        </el-form-item>
        <el-form-item label="纬度" prop="latitude">
          <el-input v-model="waypointForm.latitude" placeholder="请输入纬度" />
        </el-form-item>
        <el-form-item label="经度" prop="longitude">
          <el-input v-model="waypointForm.longitude" placeholder="请输入经度" />
        </el-form-item>
        <el-form-item label="高度(m)" prop="altitude">
          <el-input-number v-model="waypointForm.altitude" :min="0" :max="1000" />
        </el-form-item>
        <el-form-item label="速度(m/s)" prop="speed">
          <el-input-number v-model="waypointForm.speed" :min="0" :max="50" />
        </el-form-item>
        <el-form-item label="动作" prop="action">
          <el-select v-model="waypointForm.action" placeholder="请选择动作">
            <el-option label="悬停" value="hover" />
            <el-option label="拍照" value="photo" />
            <el-option label="精准降落" value="landing" />
            <el-option label="盘旋" value="circle" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="waypointDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveWaypoint">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Location, Search, Refresh } from '@element-plus/icons-vue'

defineOptions({ name: 'DroneRoute' })

// 搜索关键词
const searchKeyword = ref('')

// 航线列表
const routeList = ref([
  {
    id: 1,
    name: '朝阳区-海淀区航线',
    code: 'RT-001',
    status: 'active',
    distance: 15.6,
    duration: 25,
    pointCount: 8,
    usageCount: 156,
    createTime: '2024-11-01 10:00:00',
    description: '连接朝阳区和海淀区的主要航线',
    waypoints: [
      { index: 1, name: '起点', latitude: 39.90923, longitude: 116.397428, altitude: 100, speed: 15, action: '悬停' },
      { index: 2, name: '航点1', latitude: 39.91923, longitude: 116.407428, altitude: 120, speed: 18, action: '悬停' },
      { index: 3, name: '航点2', latitude: 39.92923, longitude: 116.417428, altitude: 150, speed: 20, action: '拍照' },
      { index: 4, name: '终点', latitude: 39.93923, longitude: 116.427428, altitude: 100, speed: 15, action: '精准降落' }
    ]
  },
  {
    id: 2,
    name: '西城区-东城区航线',
    code: 'RT-002',
    status: 'active',
    distance: 12.3,
    duration: 20,
    pointCount: 6,
    usageCount: 89,
    createTime: '2024-11-15 14:30:00',
    description: '连接西城区和东城区的快速航线',
    waypoints: [
      { index: 1, name: '起点', latitude: 39.89923, longitude: 116.387428, altitude: 100, speed: 15, action: '悬停' },
      { index: 2, name: '终点', latitude: 39.91923, longitude: 116.427428, altitude: 100, speed: 15, action: '精准降落' }
    ]
  }
])

// 选中的航线
const selectedRoute = ref<any>(null)

// 过滤后的航线列表
const filteredRouteList = computed(() => {
  if (!searchKeyword.value) return routeList.value
  
  return routeList.value.filter(route => 
    route.name.includes(searchKeyword.value) || 
    route.code.includes(searchKeyword.value)
  )
})

// 航线表单
const routeDialogVisible = ref(false)
const isEdit = ref(false)
const routeFormRef = ref()
const routeForm = reactive({
  name: '',
  code: '',
  status: 'active',
  description: ''
})

const routeRules = {
  name: [{ required: true, message: '请输入航线名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入航线编号', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 航点表单
const waypointDialogVisible = ref(false)
const isEditWaypoint = ref(false)
const waypointFormRef = ref()
const waypointForm = reactive({
  name: '',
  latitude: '',
  longitude: '',
  altitude: 100,
  speed: 15,
  action: 'hover'
})

const waypointRules = {
  name: [{ required: true, message: '请输入航点名称', trigger: 'blur' }],
  latitude: [{ required: true, message: '请输入纬度', trigger: 'blur' }],
  longitude: [{ required: true, message: '请输入经度', trigger: 'blur' }]
}

// 搜索航线
const searchRoutes = () => {
  console.log('搜索航线:', searchKeyword.value)
}

// 选择航线
const selectRoute = (route: any) => {
  selectedRoute.value = route
}

// 创建航线
const createRoute = () => {
  isEdit.value = false
  routeForm.name = ''
  routeForm.code = ''
  routeForm.status = 'active'
  routeForm.description = ''
  routeDialogVisible.value = true
}

// 编辑航线
const editRoute = (route: any) => {
  isEdit.value = true
  routeForm.name = route.name
  routeForm.code = route.code
  routeForm.status = route.status
  routeForm.description = route.description
  routeDialogVisible.value = true
}

// 删除航线
const deleteRoute = async (route: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除航线 ${route.name} 吗？`, '确认删除')
    console.log('删除航线:', route)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

// 保存航线
const saveRoute = async () => {
  try {
    await routeFormRef.value.validate()
    console.log('保存航线:', routeForm)
    ElMessage.success(isEdit.value ? '编辑成功' : '创建成功')
    routeDialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 添加航点
const addWaypoint = () => {
  isEditWaypoint.value = false
  waypointForm.name = ''
  waypointForm.latitude = ''
  waypointForm.longitude = ''
  waypointForm.altitude = 100
  waypointForm.speed = 15
  waypointForm.action = 'hover'
  waypointDialogVisible.value = true
}

// 编辑航点
const editWaypoint = (waypoint: any, index: number) => {
  isEditWaypoint.value = true
  waypointForm.name = waypoint.name
  waypointForm.latitude = waypoint.latitude
  waypointForm.longitude = waypoint.longitude
  waypointForm.altitude = waypoint.altitude
  waypointForm.speed = waypoint.speed
  waypointForm.action = waypoint.action
  waypointDialogVisible.value = true
}

// 删除航点
const deleteWaypoint = async (index: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个航点吗？', '确认删除')
    console.log('删除航点:', index)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

// 保存航点
const saveWaypoint = async () => {
  try {
    await waypointFormRef.value.validate()
    console.log('保存航点:', waypointForm)
    ElMessage.success(isEditWaypoint.value ? '编辑成功' : '添加成功')
    waypointDialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 导入航线
const importRoute = () => {
  ElMessage.success('导入航线功能开发中...')
}

// 导出航线
const exportRoute = () => {
  ElMessage.success('导出航线功能开发中...')
}

// 刷新数据
const refreshData = () => {
  ElMessage.success('数据刷新成功')
}
</script>

<style lang="scss" scoped>
.drone-route {
  .route-content {
    padding: 16px 0;
  }

  .route-list {
    .route-item {
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        border-color: #409eff;
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
      }
      
      &.active {
        border-color: #409eff;
        background: #f0f9ff;
      }
      
      .route-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        
        .route-name {
          font-size: 16px;
          font-weight: bold;
          color: #303133;
        }
      }
      
      .route-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 12px;
        font-size: 12px;
        color: #606266;
      }
      
      .route-actions {
        display: flex;
        gap: 8px;
      }
    }
  }

  .map-container {
    height: 300px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    margin-bottom: 16px;
    
    .map-placeholder {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #909399;
      
      .map-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .map-text {
        font-size: 16px;
        margin-bottom: 8px;
      }
      
      .map-desc {
        font-size: 14px;
      }
    }
  }

  .waypoint-list {
    .list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
  }

  .no-route {
    height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style> 