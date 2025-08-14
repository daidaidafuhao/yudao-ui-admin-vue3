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
            <el-button @click="refreshData" :loading="loading">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button @click="toggleMapView" :type="showMap ? 'primary' : 'default'">
              <el-icon><Location /></el-icon>
              {{ showMap ? '隐藏地图' : '显示地图' }}
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="route-content">
        <!-- 主要内容区域 -->
        <div class="main-content" :class="{ 'with-map': showMap }">
          <!-- 左侧航线列表 -->
          <div class="route-list-panel">
            <div class="panel-header">
              <h3>航线列表 ({{ filteredRouteList.length }})</h3>
              <!-- 搜索 -->
              <div class="search-box">
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
                  <div class="route-title">
                    <span class="route-name">{{ route.name }}</span>
                    <el-tag size="small" type="info">{{ route.code }}</el-tag>
                  </div>
                  <div class="route-status">
                    <el-tag :type="route.status === 'active' ? 'success' : 'info'" size="small">
                      {{ route.status === 'active' ? '启用' : '禁用' }}
                    </el-tag>
                  </div>
                </div>
                <div class="route-info">
                  <div class="info-item">
                    <el-icon><Location /></el-icon>
                    <span>{{ route.pointCount }} 个航点</span>
                  </div>
                  <div class="info-item">
                    <span>{{ route.distance }}km</span>
                  </div>
                  <div class="info-item">
                    <span>{{ route.duration }}分钟</span>
                  </div>
                  <div class="info-item">
                    <span>使用 {{ route.usageCount }} 次</span>
                  </div>
                </div>
                <div v-if="route.description" class="route-description">
                  {{ route.description }}
                </div>
                <div class="route-actions">
                  <el-button size="small" @click.stop="editRoute(route)">编辑</el-button>
                  <el-button size="small" type="danger" @click.stop="deleteRoute(route)">删除</el-button>
                </div>
              </div>
              <div v-if="filteredRouteList.length === 0" class="empty-state">
                <el-icon class="empty-icon"><Location /></el-icon>
                <p>{{ searchKeyword ? '未找到匹配的航线' : '暂无航线数据' }}</p>
              </div>
            </div>
          </div>

          <!-- 地图区域 -->
          <div v-if="showMap" class="map-panel">
            <div class="panel-header">
              <h3>航线地图</h3>
              <div class="map-controls">
                <el-button
                  size="small"
                  :type="mapMode === 'view' ? 'primary' : 'default'"
                  @click="setMapMode('view')"
                >
                  编辑模式
                </el-button>
                <el-button
                  size="small"
                  :type="mapMode === 'edit' ? 'primary' : 'default'"
                  @click="setMapMode('edit')"
                  :disabled="!selectedRoute"
                >
                  创建模式
                </el-button>
                <el-button
                  size="small"
                  type="success"
                  @click="centerToRoute"
                  :disabled="!selectedRoute"
                >
                  <el-icon><Location /></el-icon>
                  定位到航线
                </el-button>
              </div>
            </div>
            <div class="map-container">
               <DroneMap
                 ref="mapRef"
                 :drones="[]"
                 :cabinets="[]"
                 :waypoints="selectedRoute?.waypoints || []"
                 :show-route-path="true"
                 :show-controls="false"
                 :center="mapCenter"
                 :zoom="mapZoom"
                 :enable-map-click="mapMode === 'edit'"
                 :enable-waypoint-drag="mapMode === 'edit'"
                 :waypoint-icon="selectedRoute?.waypointIcon || 'circle'"
                 :waypoint-color="selectedRoute?.waypointColor || '#1890ff'"
                 :path-color="selectedRoute?.pathColor || '#52c41a'"
                 :path-width="selectedRoute?.pathWidth || 3"
                 @map-click="onMapClick"
                 @waypoint-drag="onWaypointDrag"
                 @waypoint-click="onWaypointClick"
               />
             </div>
          </div>

          <!-- 右侧：详情面板 -->
          <div class="detail-panel">
            <div class="panel-header">
              <h3>航线详情</h3>
            </div>
              
            <div v-if="selectedRoute" class="route-detail">
              <!-- 航线基本信息 -->
              <div class="basic-info">
                <el-descriptions :column="2" border>
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
              </div>

              <!-- 航点列表 -->
              <div class="waypoint-list">
                <div class="list-header">
                  <span class="text-16px font-bold">航点列表</span>
                  <el-button size="small" type="primary" @click="addWaypoint">添加航点</el-button>
                </div>
                <el-table 
                  :data="selectedRoute.waypoints" 
                  style="width: 100%" 
                  size="small"
                  :row-class-name="getWaypointRowClass"
                  @row-click="onWaypointRowClick"
                  @row-dblclick="onWaypointRowDblClick"
                >
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
          </div>
        </div>
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
        <el-form-item label="航点图标" prop="waypointIcon">
          <el-select v-model="routeForm.waypointIcon" placeholder="请选择航点图标">
            <el-option label="默认圆形" value="circle" />
            <el-option label="方形" value="square" />
            <el-option label="三角形" value="triangle" />
            <el-option label="菱形" value="diamond" />
            <el-option label="五角星" value="star" />
          </el-select>
        </el-form-item>
        <el-form-item label="图标颜色" prop="waypointColor">
          <el-color-picker v-model="routeForm.waypointColor" show-alpha />
        </el-form-item>
        <el-form-item label="连线颜色" prop="pathColor">
          <el-color-picker v-model="routeForm.pathColor" show-alpha />
        </el-form-item>
        <el-form-item label="连线宽度" prop="pathWidth">
          <el-input-number v-model="routeForm.pathWidth" :min="1" :max="10" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="routeDialogVisible = false" :disabled="saving">取消</el-button>
        <el-button type="primary" @click="saveRoute" :loading="saving">确定</el-button>
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
        <el-button @click="waypointDialogVisible = false" :disabled="saving">取消</el-button>
        <el-button type="primary" @click="saveWaypoint" :loading="saving">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Location, Search, Refresh } from '@element-plus/icons-vue'
import DroneMap from '@/components/DroneMap/index.vue'

defineOptions({ name: 'DroneRoute' })

// 数据持久化相关
const STORAGE_KEY = 'drone_routes'
const loadRoutesFromStorage = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : getDefaultRoutes()
}

const saveRoutesToStorage = (routes: any[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(routes))
}

const getDefaultRoutes = () => [
  {
    id: 1,
    name: '朝阳区-海淀区航线',
    code: 'RT-001',
    status: 'active',
    distance: 15.6,
    duration: 25,
    pointCount: 4,
    usageCount: 156,
    createTime: '2024-11-01 10:00:00',
    description: '连接朝阳区和海淀区的主要航线',
    waypoints: [
      { index: 1, name: '起点', latitude: 39.90923, longitude: 116.397428, altitude: 100, speed: 15, action: 'hover' },
      { index: 2, name: '航点1', latitude: 39.91923, longitude: 116.407428, altitude: 120, speed: 18, action: 'hover' },
      { index: 3, name: '航点2', latitude: 39.92923, longitude: 116.417428, altitude: 150, speed: 20, action: 'photo' },
      { index: 4, name: '终点', latitude: 39.93923, longitude: 116.427428, altitude: 100, speed: 15, action: 'landing' }
    ]
  },
  {
    id: 2,
    name: '西城区-东城区航线',
    code: 'RT-002',
    status: 'active',
    distance: 12.3,
    duration: 20,
    pointCount: 2,
    usageCount: 89,
    createTime: '2024-11-15 14:30:00',
    description: '连接西城区和东城区的快速航线',
    waypoints: [
      { index: 1, name: '起点', latitude: 39.89923, longitude: 116.387428, altitude: 100, speed: 15, action: 'hover' },
      { index: 2, name: '终点', latitude: 39.91923, longitude: 116.427428, altitude: 100, speed: 15, action: 'landing' }
    ]
  }
]

// 搜索关键词
const searchKeyword = ref('')

// 航线列表
const routeList = ref(loadRoutesFromStorage())

// 加载状态
const loading = ref(false)
const saving = ref(false)

// 生成唯一ID
const generateId = () => {
  return Math.max(...routeList.value.map(r => r.id), 0) + 1
}

// 生成航线编号
const generateRouteCode = () => {
  const maxCode = routeList.value
    .map(r => r.code)
    .filter(code => code.startsWith('RT-'))
    .map(code => parseInt(code.split('-')[1]))
    .reduce((max, num) => Math.max(max, num), 0)
  return `RT-${String(maxCode + 1).padStart(3, '0')}`
}

// 计算航线统计信息
const calculateRouteStats = (waypoints: any[]) => {
  if (!waypoints || waypoints.length === 0) {
    return { distance: 0, duration: 0, pointCount: 0 }
  }
  
  // 简单计算距离和时长（实际项目中应该使用更精确的地理计算）
  let totalDistance = 0
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1]
    const curr = waypoints[i]
    // 简化的距离计算
    const latDiff = Math.abs(curr.latitude - prev.latitude)
    const lngDiff = Math.abs(curr.longitude - prev.longitude)
    totalDistance += Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111 // 大约转换为km
  }
  
  const avgSpeed = waypoints.reduce((sum, wp) => sum + wp.speed, 0) / waypoints.length
  const duration = Math.round((totalDistance * 1000) / avgSpeed / 60) // 转换为分钟
  
  return {
    distance: Math.round(totalDistance * 10) / 10,
    duration: Math.max(duration, 1),
    pointCount: waypoints.length
  }
}

// 当前编辑的航线ID
const currentEditRouteId = ref<number | null>(null)

// 选中的航线
const selectedRoute = ref<any>(null)

// 增强的过滤功能 - 过滤后的航线列表
const filteredRouteList = computed(() => {
  if (!searchKeyword.value.trim()) {
    return routeList.value
  }
  
  const keyword = searchKeyword.value.toLowerCase().trim()
  return routeList.value.filter(route => {
    return (
      route.name.toLowerCase().includes(keyword) ||
      route.code.toLowerCase().includes(keyword) ||
      route.description.toLowerCase().includes(keyword) ||
      route.waypoints.some(wp => wp.name.toLowerCase().includes(keyword))
    )
  })
})

// 航线表单
const routeDialogVisible = ref(false)
const isEdit = ref(false)
const routeFormRef = ref()
const routeForm = reactive({
  name: '',
  code: '',
  status: 'active',
  description: '',
  waypointIcon: 'circle',
  waypointColor: '#1890ff',
  pathColor: '#52c41a',
  pathWidth: 3
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
const currentEditWaypointIndex = ref<number | null>(null)
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
  latitude: [
    { required: true, message: '请输入纬度', trigger: 'blur' },
    { pattern: /^-?([1-8]?\d(\.\d+)?|90(\.0+)?)$/, message: '纬度范围应在-90到90之间', trigger: 'blur' }
  ],
  longitude: [
    { required: true, message: '请输入经度', trigger: 'blur' },
    { pattern: /^-?((1[0-7]\d)|([1-9]?\d))(\.\d+)?$|^-?180(\.0+)?$/, message: '经度范围应在-180到180之间', trigger: 'blur' }
  ],
  altitude: [{ required: true, message: '请输入高度', trigger: 'blur' }],
  speed: [{ required: true, message: '请输入速度', trigger: 'blur' }],
  action: [{ required: true, message: '请选择动作', trigger: 'change' }]
}

// 更新航线统计信息
const updateRouteStats = (route: any) => {
  const stats = calculateRouteStats(route.waypoints)
  route.distance = stats.distance
  route.duration = stats.duration
  route.pointCount = stats.pointCount
  
  // 更新存储
  saveRoutesToStorage(routeList.value)
  
  // 如果是当前选中的航线，更新显示
  if (selectedRoute.value?.id === route.id) {
    selectedRoute.value = { ...route }
  }
}

// 搜索航线
const searchRoutes = () => {
  // 搜索功能已通过计算属性 filteredRouteList 实现
  console.log('搜索航线:', searchKeyword.value)
}

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = ''
  if (selectedRoute.value && !filteredRouteList.value.some(r => r.id === selectedRoute.value.id)) {
    selectedRoute.value = null
  }
  console.log('重置搜索')
}

// 选择航线
const selectRoute = (route: Route, autoCenter: boolean = false) => {
  selectedRoute.value = route
  selectedWaypointIndex.value = -1 // 重置选中的航点
  
  // 移除自动居中逻辑，避免地图自动移动
  // 用户可以通过点击"定位到航线"按钮手动居中
}

// 手动定位到选中航线的中心
const centerToRoute = () => {
  if (!selectedRoute.value || !showMap.value) return
  
  const route = selectedRoute.value
  if (route.waypoints && route.waypoints.length > 0) {
    const validWaypoints = route.waypoints.filter(wp => wp.longitude && wp.latitude && wp.longitude !== 0 && wp.latitude !== 0)
    if (validWaypoints.length > 0) {
      // 计算航点的中心位置
      const avgLat = validWaypoints.reduce((sum, wp) => sum + wp.latitude, 0) / validWaypoints.length
      const avgLng = validWaypoints.reduce((sum, wp) => sum + wp.longitude, 0) / validWaypoints.length
      
      // 验证计算结果
      if (!isNaN(avgLat) && !isNaN(avgLng) && 
          avgLat >= -90 && avgLat <= 90 && 
          avgLng >= -180 && avgLng <= 180) {
        mapCenter.value = [avgLat, avgLng]
        const newZoom = validWaypoints.length === 1 ? 15 : 12
        mapZoom.value = Math.min(20, Math.max(1, newZoom)) // 确保缩放值在有效范围内
        ElMessage.success('已定位到航线中心')
      } else {
        console.warn('计算出的地图中心点无效，使用默认值')
        mapCenter.value = [39.90923, 116.397428]
        mapZoom.value = 12
        ElMessage.warning('航线坐标异常，已定位到默认位置')
      }
    } else {
      ElMessage.warning('该航线没有有效的航点坐标')
    }
  } else {
    ElMessage.warning('该航线没有航点数据')
  }
}

// 创建航线
const createRoute = () => {
  isEdit.value = false
  currentEditRouteId.value = null
  routeForm.name = ''
  routeForm.code = generateRouteCode()
  routeForm.status = 'active'
  routeForm.description = ''
  routeForm.waypointIcon = 'circle'
  routeForm.waypointColor = '#1890ff'
  routeForm.pathColor = '#52c41a'
  routeForm.pathWidth = 3
  routeDialogVisible.value = true
}

// 编辑航线
const editRoute = (route: any) => {
  isEdit.value = true
  currentEditRouteId.value = route.id
  routeForm.name = route.name
  routeForm.code = route.code
  routeForm.status = route.status
  routeForm.description = route.description
  routeForm.waypointIcon = route.waypointIcon || 'circle'
  routeForm.waypointColor = route.waypointColor || '#1890ff'
  routeForm.pathColor = route.pathColor || '#52c41a'
  routeForm.pathWidth = route.pathWidth || 3
  routeDialogVisible.value = true
}

// 删除航线
const deleteRoute = async (route: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除航线 "${route.name}" 吗？删除后将无法恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 从列表中删除
    const index = routeList.value.findIndex(r => r.id === route.id)
    if (index > -1) {
      routeList.value.splice(index, 1)
      saveRoutesToStorage(routeList.value)
      
      // 如果删除的是当前选中的航线，清空选择
      if (selectedRoute.value?.id === route.id) {
        selectedRoute.value = null
      }
      
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消
  }
}

// 保存航线
const saveRoute = async () => {
  if (saving.value) return
  
  try {
    saving.value = true
    if (!routeFormRef.value) {
      ElMessage.error('表单未初始化，请重试')
      return
    }
    await routeFormRef.value.validate()
    
    // 检查航线编号是否重复
    const existingRoute = routeList.value.find(r => 
      r.code === routeForm.code && r.id !== currentEditRouteId.value
    )
    if (existingRoute) {
      ElMessage.error('航线编号已存在，请使用其他编号')
      return
    }
    
    if (isEdit.value && currentEditRouteId.value) {
      // 编辑现有航线
      const index = routeList.value.findIndex(r => r.id === currentEditRouteId.value)
      if (index > -1) {
        const route = routeList.value[index]
        route.name = routeForm.name
        route.code = routeForm.code
        route.status = routeForm.status
        route.description = routeForm.description
        route.waypointIcon = routeForm.waypointIcon
        route.waypointColor = routeForm.waypointColor
        route.pathColor = routeForm.pathColor
        route.pathWidth = routeForm.pathWidth
        
        // 更新选中的航线
        if (selectedRoute.value?.id === route.id) {
          selectedRoute.value = { ...route }
        }
        
        ElMessage.success('编辑成功')
      }
    } else {
      // 创建新航线
      const newRoute = {
        id: generateId(),
        name: routeForm.name,
        code: routeForm.code,
        status: routeForm.status,
        description: routeForm.description,
        waypointIcon: routeForm.waypointIcon,
        waypointColor: routeForm.waypointColor,
        pathColor: routeForm.pathColor,
        pathWidth: routeForm.pathWidth,
        distance: 0,
        duration: 0,
        pointCount: 0,
        usageCount: 0,
        createTime: new Date().toLocaleString('zh-CN'),
        waypoints: []
      }
      
      routeList.value.unshift(newRoute)
      ElMessage.success('创建成功')
      
      // 自动选中新创建的航线
      selectedRoute.value = newRoute
    }
    
    saveRoutesToStorage(routeList.value)
    routeDialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
    ElMessage.error('保存失败，请检查输入信息')
  } finally {
    saving.value = false
  }
}

// 添加航点
const addWaypoint = () => {
  if (!selectedRoute.value) {
    ElMessage.warning('请先选择一个航线')
    return
  }
  
  isEditWaypoint.value = false
  currentEditWaypointIndex.value = null
  waypointForm.name = `航点${selectedRoute.value.waypoints.length + 1}`
  waypointForm.latitude = ''
  waypointForm.longitude = ''
  waypointForm.altitude = 100
  waypointForm.speed = 15
  waypointForm.action = 'hover'
  waypointDialogVisible.value = true
}

// 编辑航点
const editWaypoint = (waypoint: any, index: number) => {
  if (!selectedRoute.value) {
    ElMessage.warning('请先选择一个航线')
    return
  }
  
  isEditWaypoint.value = true
  currentEditWaypointIndex.value = index
  selectedWaypointIndex.value = index // 更新选中的航点索引
  waypointForm.name = waypoint.name
  waypointForm.latitude = waypoint.latitude.toString()
  waypointForm.longitude = waypoint.longitude.toString()
  waypointForm.altitude = waypoint.altitude
  waypointForm.speed = waypoint.speed
  waypointForm.action = waypoint.action
  waypointDialogVisible.value = true
}

// 删除航点
const deleteWaypoint = async (index: number) => {
  if (!selectedRoute.value) {
    ElMessage.warning('请先选择一个航线')
    return
  }
  
  try {
    const waypoint = selectedRoute.value.waypoints[index]
    await ElMessageBox.confirm(
      `确定要删除航点 "${waypoint.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 找到原始航线并删除航点
    const routeIndex = routeList.value.findIndex(r => r.id === selectedRoute.value!.id)
    if (routeIndex > -1) {
      const route = routeList.value[routeIndex]
      route.waypoints.splice(index, 1)
      
      // 重新编号航点
      route.waypoints.forEach((wp, idx) => {
        wp.index = idx + 1
      })
      
      // 更新统计信息
      updateRouteStats(route)
      
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消
  }
}

// 保存航点
const saveWaypoint = async () => {
  if (!selectedRoute.value) {
    ElMessage.warning('请先选择一个航线')
    return
  }
  
  if (saving.value) return
  
  try {
    saving.value = true
    await waypointFormRef.value.validate()
    
    // 找到原始航线
    const routeIndex = routeList.value.findIndex(r => r.id === selectedRoute.value!.id)
    if (routeIndex === -1) {
      ElMessage.error('航线不存在')
      return
    }
    
    const route = routeList.value[routeIndex]
    const waypointData = {
      name: waypointForm.name,
      latitude: parseFloat(waypointForm.latitude),
      longitude: parseFloat(waypointForm.longitude),
      altitude: waypointForm.altitude,
      speed: waypointForm.speed,
      action: waypointForm.action
    }
    
    // 验证经纬度范围
    if (waypointData.latitude < -90 || waypointData.latitude > 90) {
      ElMessage.error('纬度范围应在-90到90之间')
      return
    }
    
    if (waypointData.longitude < -180 || waypointData.longitude > 180) {
      ElMessage.error('经度范围应在-180到180之间')
      return
    }
    
    if (isEditWaypoint.value && currentEditWaypointIndex.value !== null) {
      // 编辑现有航点
      const waypoint = route.waypoints[currentEditWaypointIndex.value]
      Object.assign(waypoint, waypointData)
      
      // 同时更新selectedRoute中的航点以触发响应式更新
      if (selectedRoute.value && selectedRoute.value.waypoints[currentEditWaypointIndex.value]) {
        Object.assign(selectedRoute.value.waypoints[currentEditWaypointIndex.value], waypointData)
      }
      
      ElMessage.success('编辑成功')
    } else {
      // 添加新航点
      const newWaypoint = {
        ...waypointData,
        index: route.waypoints.length + 1
      }
      route.waypoints.push(newWaypoint)
      
      ElMessage.success('添加成功')
    }
    
    // 更新统计信息
    updateRouteStats(route)
    
    // 强制触发响应式更新
    if (selectedRoute.value) {
      selectedRoute.value = { ...selectedRoute.value }
    }
    
    waypointDialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
    ElMessage.error('保存失败，请检查输入信息')
  } finally {
    saving.value = false
  }
}

// 导入航线
const importRoute = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (event: any) => {
    const file = event.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e: any) => {
      try {
        const importedData = JSON.parse(e.target.result)
        
        if (!Array.isArray(importedData)) {
          ElMessage.error('导入文件格式错误')
          return
        }
        
        // 验证数据格式
        const validRoutes = importedData.filter(route => {
          return route.name && route.code && Array.isArray(route.waypoints)
        })
        
        if (validRoutes.length === 0) {
          ElMessage.error('导入文件中没有有效的航线数据')
          return
        }
        
        // 为导入的航线生成新的ID，避免冲突
        validRoutes.forEach(route => {
          route.id = generateId()
          route.code = generateRouteCode()
          route.createTime = new Date().toLocaleString('zh-CN')
          route.usageCount = 0
          
          // 重新计算统计信息
          const stats = calculateRouteStats(route.waypoints)
          route.distance = stats.distance
          route.duration = stats.duration
          route.pointCount = stats.pointCount
        })
        
        // 添加到现有航线列表
        routeList.value.unshift(...validRoutes)
        saveRoutesToStorage(routeList.value)
        
        ElMessage.success(`成功导入 ${validRoutes.length} 条航线`)
      } catch (error) {
        console.error('导入失败:', error)
        ElMessage.error('导入文件解析失败，请检查文件格式')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

// 导出航线
const exportRoute = () => {
  if (routeList.value.length === 0) {
    ElMessage.warning('没有可导出的航线数据')
    return
  }
  
  try {
    const dataStr = JSON.stringify(routeList.value, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = `drone_routes_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    URL.revokeObjectURL(link.href)
    ElMessage.success('航线数据导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

// 地图相关
const showMap = ref(false)
const mapMode = ref('view')
const mapCenter = ref([39.90923, 116.397428])
const mapZoom = ref(10)
const selectedWaypointIndex = ref(-1)

// 切换地图显示
const toggleMapView = () => {
  const wasMapVisible = showMap.value
  showMap.value = !showMap.value
  
  // 如果地图刚刚显示，且有选中的航线，不自动移动到航线中心
  // 用户可以手动点击航线来居中
}

// 设置地图模式
const setMapMode = (mode: string) => {
  mapMode.value = mode
}

// 地图点击事件
const onMapClick = (event: any) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] 地图点击事件触发:`, {
    mapMode: mapMode.value,
    hasSelectedRoute: !!selectedRoute.value,
    event: event,
    clickCount: '第一次检测'
  })
  
  if (mapMode.value === 'edit' && selectedRoute.value) {
    console.log(`[${timestamp}] 地图点击位置:`, event.latlng)
    console.log(`[${timestamp}] 准备调用addWaypointFromMap`)
    // 创建新航点
    addWaypointFromMap(event.lat, event.lng)
  } else {
    if (mapMode.value !== 'edit') {
      console.log(`[${timestamp}] 当前不是编辑模式，mapMode:`, mapMode.value)
      ElMessage.warning('请先切换到编辑模式')
    }
    if (!selectedRoute.value) {
      console.log(`[${timestamp}] 未选择航线`)
      ElMessage.warning('请先选择一个航线')
    }
  }
}

// 获取航点行样式类名
const getWaypointRowClass = ({ rowIndex }: { rowIndex: number }) => {
  return selectedWaypointIndex.value === rowIndex ? 'waypoint-selected' : ''
}

// 航点行点击事件
const onWaypointRowClick = (row: any, column: any, event: Event) => {
  const rowIndex = selectedRoute.value?.waypoints.findIndex(wp => wp === row) ?? -1
  if (rowIndex >= 0) {
    selectedWaypointIndex.value = rowIndex
    // 移除自动移动地图的逻辑，避免地图自动跳转
    // 用户可以通过双击航点行来定位到该航点
  }
}

// 航点行双击事件 - 定位到航点
const onWaypointRowDblClick = (row: any) => {
  if (showMap.value && row.latitude && row.longitude) {
    // 验证坐标有效性
    if (!isNaN(row.latitude) && !isNaN(row.longitude) &&
        row.latitude >= -90 && row.latitude <= 90 &&
        row.longitude >= -180 && row.longitude <= 180) {
      mapCenter.value = [row.latitude, row.longitude]
      const newZoom = Math.max(mapZoom.value, 15)
      mapZoom.value = Math.min(20, Math.max(1, newZoom)) // 确保缩放级别在有效范围内
      ElMessage.success(`已定位到航点: ${row.name}`)
    }
  }
}

// 航点点击事件
const onWaypointClick = (event: any) => {
  const { index, waypoint } = event
  
  if (!selectedRoute.value) {
    ElMessage.warning('请先选择一个航线')
    return
  }
  
  // 直接打开编辑对话框
  const waypointToEdit = selectedRoute.value.waypoints[index]
  if (waypointToEdit) {
    editWaypoint(waypointToEdit, index)
    waypointDialogVisible.value = true
  }
}

// 航点拖拽事件
const onWaypointDrag = (event: any) => {
  if (!selectedRoute.value || mapMode.value !== 'edit') {
    return
  }
  
  const { index, lat, lng } = event
  
  // 找到原始航线
  const routeIndex = routeList.value.findIndex(r => r.id === selectedRoute.value!.id)
  if (routeIndex === -1) {
    ElMessage.error('航线不存在')
    return
  }
  
  const route = routeList.value[routeIndex]
  if (index >= 0 && index < route.waypoints.length) {
    // 更新航点坐标
    route.waypoints[index].latitude = lat
    route.waypoints[index].longitude = lng
    
    // 更新统计信息
    updateRouteStats(route)
    
    ElMessage.success(`航点 "${route.waypoints[index].name}" 位置已更新`)
  }
}

// 从地图添加航点
const addWaypointFromMap = (lat: number, lng: number) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] addWaypointFromMap被调用:`, { 
    lat, 
    lng, 
    selectedRoute: !!selectedRoute.value,
    currentWaypointCount: selectedRoute.value?.waypoints.length || 0,
    dialogVisible: waypointDialogVisible.value
  })
  
  if (!selectedRoute.value) {
    console.log(`[${timestamp}] 没有选择航线，退出`)
    ElMessage.warning('请先选择一个航线')
    return
  }



  // 重置表单并预填坐标
  waypointForm.name = `航点${selectedRoute.value.waypoints.length + 1}`
  waypointForm.latitude = lat.toString()
  waypointForm.longitude = lng.toString()
  waypointForm.altitude = 50
  waypointForm.speed = 5
  waypointForm.action = 'hover'
  
  currentEditWaypointIndex.value = null
  waypointDialogVisible.value = true
  
  console.log(`[${timestamp}] 航点对话框设置为显示:`, waypointDialogVisible.value)
  console.log(`[${timestamp}] 航点表单数据:`, waypointForm)
  
  ElMessage.success('已在地图选点位置创建航点，请完善航点信息')
}

// 刷新数据
const refreshData = async () => {
  if (loading.value) return
  
  try {
    loading.value = true
    // 模拟加载延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 重新从localStorage加载数据
    routeList.value = loadRoutesFromStorage()
    selectedRoute.value = null
    searchKeyword.value = ''
    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('刷新失败:', error)
    ElMessage.error('刷新失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.drone-route {
  .route-content {
    padding: 16px 0;
  }

  .main-content {
    display: flex;
    gap: 16px;
    height: calc(100vh - 200px);
    
    &.with-map {
      .route-list-panel {
        flex: 0 0 300px;
      }
      
      .map-panel {
        flex: 1;
      }
      
      .detail-panel {
        flex: 0 0 400px;
      }
    }
    
    &:not(.with-map) {
      .route-list-panel {
        flex: 0 0 350px;
      }
      
      .detail-panel {
        flex: 1;
      }
    }
  }

  .route-list-panel,
  .map-panel,
  .detail-panel {
    background: white;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-header {
    padding: 16px;
    border-bottom: 1px solid #e4e7ed;
    background: #fafafa;
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: bold;
      color: #303133;
    }
    
    .search-box {
      width: 200px;
    }
    
    .map-controls {
      display: flex;
      gap: 8px;
    }
  }

  .route-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    
    .route-item {
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      padding: 12px;
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
        
        .route-title {
          display: flex;
          align-items: center;
          gap: 8px;
          
          .route-name {
            font-size: 14px;
            font-weight: bold;
            color: #303133;
          }
        }
      }
      
      .route-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
        margin-bottom: 8px;
        font-size: 12px;
        color: #606266;
        
        .info-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
      
      .route-description {
        font-size: 12px;
        color: #909399;
        margin-bottom: 8px;
        line-height: 1.4;
      }
      
      .route-actions {
        display: flex;
        gap: 8px;
      }
    }
    
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #909399;
      
      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
    }
  }

  .map-container {
    flex: 1;
    position: relative;
    min-height: 0; /* 防止flex子项高度计算问题 */
    
    .map-placeholder {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #909399;
      background: #f5f7fa;
      
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

  .detail-panel {
    .route-detail {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      
      .basic-info {
        margin-bottom: 24px;
      }
    }
    
    .waypoint-list {
      .list-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      
      :deep(.waypoint-selected) {
        background-color: #e6f7ff !important;
        
        td {
          background-color: #e6f7ff !important;
        }
      }
    }
    
    .no-route {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>