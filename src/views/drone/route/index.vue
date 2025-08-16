<template>
  <div class="drone-route">
    <!-- 地图背景 -->
    <div class="map-background">
      <DroneMap
        ref="mapRef"
        :drones="[]"
        :cabinets="[]"
        :waypoints="selectedRoute?.waypoints || []"
        :show-route-path="true"
        :show-controls="false"
        :center="mapCenter as [number, number]"
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

    <!-- 顶部工具栏 -->
    <div class="top-toolbar">
      <div class="toolbar-left">
        <div class="title-section">
          <el-icon class="title-icon"><Location /></el-icon>
          <span class="title-text">航线规划</span>
        </div>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="createRoute">
          <el-icon><Plus /></el-icon>
          创建航线
        </el-button>
        <el-button type="success" @click="importRoute">
          <el-icon><Upload /></el-icon>
          导入航线
        </el-button>
        <el-button @click="exportRoute">
          <el-icon><Download /></el-icon>
          导出航线
        </el-button>
        <el-button @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="toggleWaypointList" :type="showWaypointList ? 'primary' : 'default'">
          <el-icon><List /></el-icon>
          {{ showWaypointList ? '隐藏航点列表' : '显示航点列表' }}
        </el-button>
      </div>
    </div>

    <!-- 左侧航线列表卡片 -->
    <div class="route-list-card" :class="{ hidden: !showWaypointList }">
      <div class="card-header">
        <div class="header-title">
          <el-icon class="title-icon"><List /></el-icon>
          <span class="title-text">航线列表 ({{ filteredRouteList.length }})</span>
        </div>
        <div class="search-box">
          <el-input 
            v-model="searchKeyword" 
            placeholder="搜索航线名称/编号" 
            clearable
            size="small"
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
                    <el-tag 
                      :type="validateRoute(route).valid ? 'success' : 'danger'" 
                      size="small" 
                      style="margin-left: 4px;"
                    >
                      {{ validateRoute(route).valid ? '有效' : '无效' }}
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
          </div>
          <div v-if="filteredRouteList.length === 0" class="empty-state">
            <el-icon class="empty-icon"><Location /></el-icon>
            <p>{{ searchKeyword ? '未找到匹配的航线' : '暂无航线数据' }}</p>
          </div>
      </div>
    </div>

    <!-- 地图控制卡片 -->
    <div class="map-controls-card">
      <div class="controls-title">地图控制</div>
      <div class="control-buttons">
        <div 
          class="control-btn"
          :class="{ active: mapMode === 'view' }"
          @click="setMapMode('view')"
        >
          <el-icon><View /></el-icon>
          <span>查看模式</span>
        </div>
        <div 
          class="control-btn"
          :class="{ active: mapMode === 'edit', disabled: !selectedRoute }"
          @click="selectedRoute && setMapMode('edit')"
        >
          <el-icon><Edit /></el-icon>
          <span>编辑模式</span>
        </div>
        <div 
          v-if="selectedRoute"
          class="control-btn"
          @click="centerToRoute"
        >
          <el-icon><Location /></el-icon>
          <span>定位航线</span>
        </div>
      </div>
    </div>




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
        <el-form-item label="飞行器类型" prop="aircraftType">
          <el-select v-model="routeForm.aircraftType" placeholder="请选择飞行器类型">
            <el-option label="多旋翼无人机" value="multirotor" />
            <el-option label="固定翼无人机" value="fixed-wing" />
            <el-option label="垂直起降无人机" value="vtol" />
            <el-option label="直升机" value="helicopter" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="routeForm.status" placeholder="请选择状态">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="起点起降点" prop="takeoffPoint">
          <el-select v-model="routeForm.takeoffPoint" placeholder="请选择起点起降点" filterable>
            <el-option 
              v-for="point in takeoffLandingPoints" 
              :key="point.code" 
              :label="`${point.name} (${point.code})`" 
              :value="point.code" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="终点起降点" prop="landingPoint">
          <el-select v-model="routeForm.landingPoint" placeholder="请选择终点起降点" filterable>
            <el-option 
              v-for="point in takeoffLandingPoints" 
              :key="point.code" 
              :label="`${point.name} (${point.code})`" 
              :value="point.code" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="航线空域" prop="airspace">
          <el-select v-model="routeForm.airspace" placeholder="请选择航线空域">
            <el-option label="适飞空域" value="suitable" />
            <el-option label="管制空域" value="controlled" />
            <el-option label="禁飞空域" value="restricted" />
            <el-option label="临时空域" value="temporary" />
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
        <el-form-item 
          v-if="waypointForm.action === 'landing'" 
          label="降落位置编码" 
          prop="landingCode"
        >
          <el-select v-model="waypointForm.landingCode" placeholder="请选择降落位置编码" filterable>
            <el-option 
              v-for="code in landingCodes" 
              :key="code.code" 
              :label="`${code.name} (${code.code}) - ${code.description}`" 
              :value="code.code" 
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="waypointDialogVisible = false" :disabled="saving">取消</el-button>
        <el-button 
          v-if="currentEditWaypointIndex !== -1" 
          type="danger" 
          :icon="Delete" 
          @click="deleteCurrentWaypoint" 
          :disabled="saving || (currentEditWaypointIndex !== null && isStartOrEndWaypoint(currentEditWaypointIndex))"
        >
          删除
        </el-button>
        <el-button type="primary" @click="saveWaypoint" :loading="saving">确定</el-button>
      </template>
    </el-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Location, Search, Refresh, List, View, Edit, InfoFilled, Plus, Upload, Download, Delete } from '@element-plus/icons-vue'
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

// 起降点数据
const takeoffLandingPoints = ref([
  { code: 'LP001', name: '主起降点A', latitude: 39.90923, longitude: 116.397428, type: 'primary' },
  { code: 'LP002', name: '备用起降点B', latitude: 39.91923, longitude: 116.407428, type: 'backup' },
  { code: 'LP003', name: '临时起降点C', latitude: 39.92923, longitude: 116.417428, type: 'temporary' },
  { code: 'LP004', name: '紧急起降点D', latitude: 39.93923, longitude: 116.427428, type: 'emergency' }
])

// 降落位置编码数据
const landingCodes = ref([
  { code: 'LC001', name: '精准降落点1', description: '主要降落区域' },
  { code: 'LC002', name: '精准降落点2', description: '备用降落区域' },
  { code: 'LC003', name: '精准降落点3', description: '紧急降落区域' },
  { code: 'LC004', name: '精准降落点4', description: '临时降落区域' }
])

// 计算两点间距离（单位：米）
const calculateDistance = (point1: any, point2: any) => {
  const R = 6371000 // 地球半径（米）
  const lat1 = point1.latitude * Math.PI / 180
  const lat2 = point2.latitude * Math.PI / 180
  const deltaLat = (point2.latitude - point1.latitude) * Math.PI / 180
  const deltaLng = (point2.longitude - point1.longitude) * Math.PI / 180
  
  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
          Math.cos(lat1) * Math.cos(lat2) *
          Math.sin(deltaLng/2) * Math.sin(deltaLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  
  return R * c
}

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
  aircraftType: '',
  takeoffPoint: '',
  landingPoint: '',
  airspace: 'suitable',
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
  aircraftType: [{ required: true, message: '请选择飞行器类型', trigger: 'change' }],
  takeoffPoint: [{ required: true, message: '请选择起点起降点', trigger: 'change' }],
  landingPoint: [{ required: true, message: '请选择终点起降点', trigger: 'change' }],
  airspace: [{ required: true, message: '请选择航线空域', trigger: 'change' }],
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
  action: 'hover',
  landingCode: ''
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
  action: [{ required: true, message: '请选择动作', trigger: 'change' }],
  landingCode: [
    { 
      validator: (rule: any, value: any, callback: any) => {
        if (waypointForm.action === 'landing' && !value) {
          callback(new Error('精准降落动作必须选择降落位置编码'))
        } else {
          callback()
        }
      }, 
      trigger: 'change' 
    }
  ]
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



// 选择航线
const selectRoute = (route: any) => {
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
  routeForm.aircraftType = ''
  routeForm.takeoffPoint = ''
  routeForm.landingPoint = ''
  routeForm.airspace = 'suitable'
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
  routeForm.aircraftType = route.aircraftType || ''
  routeForm.takeoffPoint = route.takeoffPoint || ''
  routeForm.landingPoint = route.landingPoint || ''
  routeForm.airspace = route.airspace || 'suitable'
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

// 航线验证函数
const validateRoute = (route: any) => {
  if (!route.waypoints || route.waypoints.length === 0) {
    return { valid: false, message: '航线至少需要一个航点' }
  }
  
  // 检查最后一个航点是否为降落动作
  const lastWaypoint = route.waypoints[route.waypoints.length - 1]
  if (lastWaypoint.action !== 'landing') {
    return { valid: false, message: '航线最后一个航点必须是降落动作，否则航线无效' }
  }
  
  return { valid: true, message: '' }
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
        route.aircraftType = routeForm.aircraftType
        route.takeoffPoint = routeForm.takeoffPoint
        route.landingPoint = routeForm.landingPoint
        route.airspace = routeForm.airspace
        route.status = routeForm.status
        route.description = routeForm.description
        route.waypointIcon = routeForm.waypointIcon
        route.waypointColor = routeForm.waypointColor
        route.pathColor = routeForm.pathColor
        route.pathWidth = routeForm.pathWidth
        
        // 更新起点和终点航点坐标
        updateStartEndWaypoints(route)
        
        // 重新计算航线统计信息
        updateRouteStats(route)
        
        // 保存到localStorage
        saveRoutesToStorage(routeList.value)
        
        // 更新选中的航线
        if (selectedRoute.value?.id === route.id) {
          selectedRoute.value = { ...route }
        }
        
        ElMessage.success('编辑成功')
      }
    } else {
      // 创建新航线
      const waypoints: any[] = []
      
      // 如果选择了起降点，自动创建起始和终止航点
      if (routeForm.takeoffPoint && routeForm.landingPoint) {
        const takeoffPoint = takeoffLandingPoints.value.find(p => p.code === routeForm.takeoffPoint)
        const landingPoint = takeoffLandingPoints.value.find(p => p.code === routeForm.landingPoint)
        
        if (takeoffPoint) {
           waypoints.push({
             index: 1,
             name: `起始点-${takeoffPoint.name}`,
             latitude: takeoffPoint.latitude,
             longitude: takeoffPoint.longitude,
             altitude: 50,
             speed: 10,
             action: 'hover',
             landingCode: ''
           })
         }
         
         if (landingPoint) {
           waypoints.push({
             index: waypoints.length + 1,
             name: `终止点-${landingPoint.name}`,
             latitude: landingPoint.latitude,
             longitude: landingPoint.longitude,
             altitude: 20,
             speed: 5,
             action: 'landing',
             landingCode: landingCodes.value[0]?.code || ''
           })
         }
      }
      
      const newRoute = {
        id: generateId(),
        name: routeForm.name,
        code: routeForm.code,
        aircraftType: routeForm.aircraftType,
        takeoffPoint: routeForm.takeoffPoint,
        landingPoint: routeForm.landingPoint,
        airspace: routeForm.airspace,
        status: routeForm.status,
        description: routeForm.description,
        waypointIcon: routeForm.waypointIcon,
        waypointColor: routeForm.waypointColor,
        pathColor: routeForm.pathColor,
        pathWidth: routeForm.pathWidth,
        distance: 0,
        duration: 0,
        pointCount: waypoints.length,
        usageCount: 0,
        createTime: new Date().toLocaleString('zh-CN'),
        waypoints: waypoints
      }
      
      // 更新起点和终点航点坐标
      updateStartEndWaypoints(newRoute)
      
      // 如果有航点，计算统计信息
      if (waypoints.length > 0) {
        updateRouteStats(newRoute)
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

// 判断是否为起点或终点航点
const isStartOrEndWaypoint = (index: number) => {
  if (!selectedRoute.value || !selectedRoute.value.waypoints) {
    return false
  }
  
  const waypoints = selectedRoute.value.waypoints
  if (waypoints.length === 0) {
    return false
  }
  
  // 起点：第一个航点且action为hover
  const isStartPoint = index === 0 && waypoints[0].action === 'hover'
  
  // 终点：最后一个航点且action为landing
  const isEndPoint = index === waypoints.length - 1 && waypoints[waypoints.length - 1].action === 'landing'
  
  return isStartPoint || isEndPoint
}

// 更新起点和终点航点坐标
const updateStartEndWaypoints = (route: any) => {
  if (!route.waypoints || route.waypoints.length === 0) {
    return
  }
  
  // 更新起点航点
  if (route.takeoffPoint && route.waypoints.length > 0) {
    const takeoffPoint = takeoffLandingPoints.value.find(p => p.code === route.takeoffPoint)
    if (takeoffPoint && route.waypoints[0].action === 'hover') {
      route.waypoints[0].latitude = takeoffPoint.latitude
      route.waypoints[0].longitude = takeoffPoint.longitude
      route.waypoints[0].name = `起点-${takeoffPoint.name}`
    }
  }
  
  // 更新终点航点
  if (route.landingPoint && route.waypoints.length > 1) {
    const landingPoint = takeoffLandingPoints.value.find(p => p.code === route.landingPoint)
    const lastIndex = route.waypoints.length - 1
    if (landingPoint && route.waypoints[lastIndex].action === 'landing') {
      route.waypoints[lastIndex].latitude = landingPoint.latitude
      route.waypoints[lastIndex].longitude = landingPoint.longitude
      route.waypoints[lastIndex].name = `终点-${landingPoint.name}`
    }
  }
}

// 编辑航点
const editWaypoint = (waypoint: any, index: number) => {
  if (!selectedRoute.value) {
    ElMessage.warning('请先选择一个航线')
    return
  }
  
  // 检查是否为起点或终点航点
  if (isStartOrEndWaypoint(index)) {
    ElMessage.warning('起点和终点航点不能编辑')
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

// 删除当前编辑的航点
const deleteCurrentWaypoint = async () => {
  if (currentEditWaypointIndex.value === null || currentEditWaypointIndex.value === -1) {
    ElMessage.warning('没有选中的航点')
    return
  }
  
  if (!selectedRoute.value) {
    ElMessage.warning('请先选择一个航线')
    return
  }
  
  // 检查是否为起点或终点航点
  if (isStartOrEndWaypoint(currentEditWaypointIndex.value)) {
    ElMessage.warning('起点和终点航点不能删除')
    return
  }
  
  try {
    const waypoint = selectedRoute.value.waypoints[currentEditWaypointIndex.value]
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
      route.waypoints.splice(currentEditWaypointIndex.value, 1)
      
      // 重新编号航点
      route.waypoints.forEach((wp, idx) => {
        wp.index = idx + 1
      })
      
      // 更新统计信息
      updateRouteStats(route)
      
      // 强制更新selectedRoute以触发地图响应式更新
      selectedRoute.value = { ...route }
      
      // 保存到localStorage
      saveRoutesToStorage(routeList.value)
      
      // 关闭编辑弹窗
      waypointDialogVisible.value = false
      
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消
  }
}

// 删除航点
const deleteWaypoint = async (index: number) => {
  if (!selectedRoute.value) {
    ElMessage.warning('请先选择一个航线')
    return
  }
  
  // 检查是否为起点或终点航点
  if (isStartOrEndWaypoint(index)) {
    ElMessage.warning('起点和终点航点不能删除')
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
      
      // 强制更新selectedRoute以触发地图响应式更新
      selectedRoute.value = { ...route }
      
      // 保存到localStorage
      saveRoutesToStorage(routeList.value)
      
      // 验证航线是否有效
      const validation = validateRoute(route)
      if (!validation.valid) {
        ElMessage.warning(validation.message)
      } else {
        ElMessage.success('删除成功')
      }
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
      // 添加新航点 - 插入在起点和终点之间
      const newWaypoint = {
        ...waypointData,
        index: route.waypoints.length + 1
      }
      
      // 如果航线有起点和终点，新航点插入在倒数第二个位置（终点前）
      if (route.waypoints.length >= 2 && 
          route.waypoints[0].action === 'hover' && 
          route.waypoints[route.waypoints.length - 1].action === 'landing') {
        // 插入在终点前
        route.waypoints.splice(route.waypoints.length - 1, 0, newWaypoint)
      } else {
        // 否则添加到末尾
        route.waypoints.push(newWaypoint)
      }
      
      // 重新编号所有航点
      route.waypoints.forEach((wp, idx) => {
        wp.index = idx + 1
      })
      
      ElMessage.success('添加成功')
    }
    
    // 更新统计信息
    updateRouteStats(route)
    
    // 强制更新selectedRoute以触发地图响应式更新
    if (selectedRoute.value?.id === route.id) {
      selectedRoute.value = { ...route }
    }
    
    // 验证航线是否有效
    const validation = validateRoute(route)
    if (!validation.valid) {
      ElMessage.warning(validation.message)
    }
    
    // 保存到localStorage
    saveRoutesToStorage(routeList.value)
    
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
const showMap = ref(true) // 地图一直显示
const showWaypointList = ref(true) // 航点列表显示状态
const mapMode = ref('view')
const mapCenter = ref([39.90923, 116.397428])
const mapZoom = ref(10)
const selectedWaypointIndex = ref(-1)

// 切换航点列表显示
const toggleWaypointList = () => {
  showWaypointList.value = !showWaypointList.value
}

// 切换地图显示（保留原函数以防其他地方调用）
const toggleMapView = () => {
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
const onWaypointRowClick = (row: any) => {
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
  const { index } = event
  
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
  
  // 检查是否为起点或终点航点
  if (isStartOrEndWaypoint(index)) {
    ElMessage.warning('起点和终点航点不能拖拽移动')
    return
  }
  
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
    
    // 强制更新selectedRoute以触发地图响应式更新
    selectedRoute.value = { ...route }
    
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

// 页面初始化
onMounted(() => {
  // 监听页面刷新/关闭事件
  const handleBeforeUnload = () => {
    saveRoutesToStorage(routeList.value)
  }
  
  window.addEventListener('beforeunload', handleBeforeUnload)
  
  // 清理事件监听器
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }
})

// 离开页面前保存数据
onBeforeRouteLeave(() => {
  saveRoutesToStorage(routeList.value)
  return true
})
</script>

<style lang="scss" scoped>
.drone-route {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #0c1426 0%, #1a2332 100%);
}

.map-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.top-toolbar {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  height: 60px;
  background: rgba(13, 110, 253, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(13, 110, 253, 0.3);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(13, 110, 253, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;

  .toolbar-left {
    .title-section {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .title-icon {
        font-size: 24px;
        color: #ffffff;
      }
      
      .title-text {
        font-size: 20px;
        font-weight: 600;
        color: #ffffff;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
    }
  }

  .toolbar-right {
    display: flex;
    gap: 12px;
    
    .el-button {
      background: rgba(13, 110, 253, 0.2);
      border: 1px solid rgba(13, 110, 253, 0.4);
      color: #ffffff;
      
      &:hover {
        background: rgba(13, 110, 253, 0.3);
        border-color: rgba(13, 110, 253, 0.6);
      }
      
      &.el-button--primary {
        background: rgba(13, 110, 253, 0.8);
        border-color: rgba(13, 110, 253, 1);
        
        &:hover {
          background: rgba(13, 110, 253, 0.9);
        }
      }
      
      &.el-button--success {
        background: rgba(34, 197, 94, 0.8);
        border-color: rgba(34, 197, 94, 1);
        
        &:hover {
          background: rgba(34, 197, 94, 0.9);
        }
      }
    }
  }
}

.route-list-card {
  position: absolute;
  top: 100px;
  left: 20px;
  width: 360px;
  max-height: calc(100vh - 140px);
  background: rgba(13, 110, 253, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(13, 110, 253, 0.3);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(13, 110, 253, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  z-index: 10;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  &.hidden {
    display: none;
  }

  .card-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid rgba(13, 110, 253, 0.2);
    
    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      
      .title-icon {
        font-size: 20px;
        color: #ffffff;
      }
      
      .title-text {
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
      }
    }
    
    .search-box {
      :deep(.el-input__wrapper) {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        
        .el-input__inner {
          color: #ffffff;
          
          &::placeholder {
            color: rgba(255, 255, 255, 0.6);
          }
        }
      }
    }
  }

  .route-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px 24px 24px;
    
    .route-item {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(13, 110, 253, 0.1);
        border-color: rgba(13, 110, 253, 0.4);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(13, 110, 253, 0.2);
      }
      
      &.active {
        background: rgba(13, 110, 253, 0.2);
        border-color: rgba(13, 110, 253, 0.6);
        box-shadow: 0 4px 16px rgba(13, 110, 253, 0.3);
      }
      
      .route-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        
        .route-title {
          display: flex;
          align-items: center;
          gap: 8px;
          
          .route-name {
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
          }
        }
      }
      
      .route-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 12px;
        
        .info-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          
          .info-icon {
            font-size: 14px;
            color: rgba(13, 110, 253, 0.8);
          }
        }
      }
      
      .route-description {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 12px;
        line-height: 1.4;
      }
      
      .route-actions {
        display: flex;
        gap: 8px;
        
        .el-button {
          background: rgba(13, 110, 253, 0.2);
          border: 1px solid rgba(13, 110, 253, 0.4);
          color: #ffffff;
          
          &:hover {
            background: rgba(13, 110, 253, 0.3);
          }
          
          &.el-button--danger {
            background: rgba(239, 68, 68, 0.2);
            border-color: rgba(239, 68, 68, 0.4);
            
            &:hover {
              background: rgba(239, 68, 68, 0.3);
            }
          }
        }
      }
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: rgba(255, 255, 255, 0.6);
      
      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        color: rgba(13, 110, 253, 0.6);
      }
      
      .empty-text {
        font-size: 16px;
        margin-bottom: 8px;
      }
      
      .empty-desc {
        font-size: 14px;
        opacity: 0.8;
      }
    }
  }
}

.map-controls-card {
  position: absolute;
  top: 100px;
  right: 20px;
  width: 200px;
  background: rgba(13, 110, 253, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(13, 110, 253, 0.3);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(13, 110, 253, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  z-index: 10;
  padding: 20px;
  
  .controls-title {
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 16px;
    text-align: center;
  }
  
  .control-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    
    .control-btn {
      width: 100%;
      height: 36px;
      padding: 8px 16px;
      background: rgba(13, 110, 253, 0.2);
      border: 1px solid rgba(13, 110, 253, 0.4);
      border-radius: 6px;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-sizing: border-box;
      
      &:hover {
        background: rgba(13, 110, 253, 0.3);
        border-color: rgba(13, 110, 253, 0.6);
      }
      
      &.active {
        background: rgba(13, 110, 253, 0.8);
        border-color: rgba(13, 110, 253, 1);
      }
      
      &.disabled {
        background: rgba(13, 110, 253, 0.1);
        border-color: rgba(13, 110, 253, 0.2);
        color: rgba(255, 255, 255, 0.5);
        cursor: not-allowed;
        
        &:hover {
          background: rgba(13, 110, 253, 0.1);
          border-color: rgba(13, 110, 253, 0.2);
        }
      }
      
      .el-icon {
        font-size: 14px;
      }
      
      span {
        font-size: 14px;
        font-weight: 500;
      }
    }
  }
}



.no-selection {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(13, 110, 253, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(13, 110, 253, 0.3);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(13, 110, 253, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  z-index: 10;
  padding: 40px;
  text-align: center;
  
  :deep(.el-empty) {
    .el-empty__description {
      color: rgba(255, 255, 255, 0.8);
    }
    
    .el-button {
      background: rgba(13, 110, 253, 0.8);
      border-color: rgba(13, 110, 253, 1);
      color: #ffffff;
      
      &:hover {
        background: rgba(13, 110, 253, 0.9);
      }
    }
  }
}

// 滚动条样式
:deep(.el-scrollbar__bar) {
  .el-scrollbar__thumb {
    background: rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

// 对话框样式覆盖
:deep(.el-dialog) {
  background: rgba(13, 110, 253, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(13, 110, 253, 0.3);
  
  .el-dialog__header {
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    
    .el-dialog__title {
      color: #ffffff;
    }
  }
  
  .el-dialog__body {
    color: rgba(255, 255, 255, 0.9);
  }
}
</style>