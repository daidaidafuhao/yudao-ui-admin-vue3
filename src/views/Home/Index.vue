<template>
  <div class="drone-dashboard">
    <!-- 顶部欢迎区域 -->
    <el-card shadow="never" class="welcome-card">
        <el-row :gutter="16" justify="space-between">
          <el-col :xl="12" :lg="12" :md="12" :sm="24" :xs="24">
            <div class="flex items-center">
              <el-avatar :src="avatar" :size="70" class="mr-16px">
                <img src="@/assets/imgs/avatar.gif" alt="" />
              </el-avatar>
              <div>
                <div class="text-20px">
                  {{ t('workplace.welcome') }} {{ username }} {{ t('workplace.happyDay') }}
                </div>
                <div class="mt-10px text-14px text-gray-500">
                无人机配送系统运行正常，今日已配送 {{ todayDeliveredCount }} 单
                </div>
              </div>
            </div>
          </el-col>
          <el-col :xl="12" :lg="12" :md="12" :sm="24" :xs="24">
            <div class="h-70px flex items-center justify-end lt-sm:mt-10px">
              <div class="px-8px text-right">
              <div class="mb-16px text-14px text-gray-400">在线无人机</div>
                <CountTo
                  class="text-20px"
                  :start-val="0"
                :end-val="onlineDroneCount"
                  :duration="2600"
                />
              </div>
              <el-divider direction="vertical" />
              <div class="px-8px text-right">
              <div class="mb-16px text-14px text-gray-400">在线柜子</div>
                <CountTo
                  class="text-20px"
                  :start-val="0"
                :end-val="onlineCabinetCount"
                  :duration="2600"
                />
              </div>
              <el-divider direction="vertical" border-style="dashed" />
              <div class="px-8px text-right">
              <div class="mb-16px text-14px text-gray-400">今日配送</div>
                <CountTo
                  class="text-20px"
                  :start-val="0"
                :end-val="todayDeliveredCount"
                  :duration="2600"
                />
              </div>
            </div>
          </el-col>
        </el-row>
    </el-card>

    <!-- 主要内容区域 -->
    <el-row :gutter="16" class="mt-16px">
      <!-- 左侧统计卡片 -->
      <el-col :xl="6" :lg="8" :md="24" :sm="24" :xs="24" class="mb-16px">
        <div class="stats-sidebar">
          <!-- 无人机统计卡片 -->
          <el-card shadow="hover" class="stat-card cursor-pointer mb-16px" @click="handleDroneClick">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-14px text-gray-500">无人机总数</div>
                <div class="text-24px font-bold mt-5px">{{ droneStats.total }}</div>
                <div class="text-12px text-gray-400 mt-5px">
                  在线 {{ droneStats.online }} | 飞行中 {{ droneStats.flying }}
                </div>
              </div>
              <el-icon class="text-40px text-primary"><Monitor /></el-icon>
            </div>
          </el-card>
          
          <!-- 无人机柜统计卡片 -->
          <el-card shadow="hover" class="stat-card cursor-pointer mb-16px" @click="handleCabinetClick">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-14px text-gray-500">无人机柜总数</div>
                <div class="text-24px font-bold mt-5px">{{ cabinetStats.total }}</div>
                <div class="text-12px text-gray-400 mt-5px">
                  在线 {{ cabinetStats.online }} | 可用格口 {{ cabinetStats.available }}
                </div>
              </div>
              <el-icon class="text-40px text-success"><Connection /></el-icon>
            </div>
          </el-card>
          
          <!-- 今日订单统计卡片 -->
          <el-card shadow="hover" class="stat-card cursor-pointer mb-16px" @click="router.push('/mall/trade/order')">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-14px text-gray-500">今日订单</div>
                <div class="text-24px font-bold mt-5px">{{ orderStats.today }}</div>
                <div class="text-12px text-gray-400 mt-5px">
                  配送中 {{ orderStats.delivering }} | 已完成 {{ orderStats.completed }}
                </div>
              </div>
              <el-icon class="text-40px text-warning"><Document /></el-icon>
            </div>
          </el-card>
          
          <!-- 系统状态统计卡片 -->
          <el-card shadow="hover" class="stat-card mb-16px">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-14px text-gray-500">系统状态</div>
                <div class="text-24px font-bold mt-5px" :class="systemStats.error > 0 ? 'text-danger' : 'text-success'">
                  {{ systemStats.error > 0 ? '异常' : '正常' }}
                </div>
                <div class="text-12px text-gray-400 mt-5px">
                  故障 {{ systemStats.error }} | 维护 {{ systemStats.maintenance }}
                </div>
              </div>
              <el-icon class="text-40px" :class="systemStats.error > 0 ? 'text-danger' : 'text-success'">
                <CircleCheck />
              </el-icon>
            </div>
          </el-card>
        </div>
      </el-col>
      
      <!-- 右侧地图区域 -->
      <el-col :xl="18" :lg="16" :md="24" :sm="24" :xs="24" class="mb-16px">
        <el-card shadow="never" class="map-card">
        <template #header>
            <div class="flex justify-between items-center">
              <div class="flex items-center">
                <span class="text-16px font-bold">实时配送地图</span>
                <el-tag v-if="coverageArea !== '暂无数据'" type="info" class="ml-8px">
                  {{ coverageArea }}
                </el-tag>
              </div>
              <div class="flex items-center space-x-8px">
                <el-button size="small" @click="refreshMap">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
                <el-button size="small" @click="toggleMapFullscreen">
                  <el-icon><FullScreen /></el-icon>
                  全屏
                </el-button>
              </div>
            </div>
          </template>
                           <div v-if="loading" class="loading-tip">
                   <el-icon class="is-loading"><Loading /></el-icon>
                   <div class="loading-text">正在加载数据...</div>
                 </div>
                 <div v-else-if="droneList.length === 0 && cabinetList.length === 0" class="no-data-tip">
                   <el-empty description="暂无无人机和柜子数据" />
          </div>
                 <DroneMap
                   v-else
                   :drones="droneList"
                   :cabinets="cabinetList"
                   :center="mapCenter"
                   :zoom="mapZoom"
                 />
      </el-card>
    </el-col>
  </el-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { ElMessage } from 'element-plus'
import { dronesApi, dronesVO } from '@/api/drone/droneComm'
import { CabinetApi, CabinetVO } from '@/api/drone/cabinet'
import * as TradeOrderApi from '@/api/mall/trade/order'
import {
  Monitor,
  Connection,
  Document,
  CircleCheck,
  Refresh,
  FullScreen,
  Location,
  DataBoard,
  Loading
} from '@element-plus/icons-vue'
import DroneMap from '@/components/DroneMap/index.vue'

defineOptions({ name: 'DroneDashboard' })

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()

// 基础数据
const avatar = userStore.getUser.avatar
const username = userStore.getUser.nickname
const mapContainer = ref()

// 统计数据
const droneStats = reactive({
  total: 0,
  online: 0,
  flying: 0,
  error: 0
})

const cabinetStats = reactive({
  total: 0,
  online: 0,
  available: 0,
  error: 0
})

const orderStats = reactive({
  today: 0,
  delivering: 0,
  completed: 0
})

const systemStats = reactive({
  error: 0,
  maintenance: 0
})

// 计算属性
const onlineDroneCount = computed(() => droneStats.online)
const onlineCabinetCount = computed(() => cabinetStats.online)
const todayDeliveredCount = computed(() => orderStats.completed)

// 计算当前覆盖区域
const coverageArea = computed(() => {
  const allPoints = [
    ...droneList.value.filter(d => d.longitude && d.latitude && d.longitude !== 0 && d.latitude !== 0),
    ...cabinetList.value.filter(c => c.longitude && c.latitude && c.longitude !== 0 && c.latitude !== 0)
  ]
  
  if (allPoints.length === 0) {
    return '暂无数据'
  }
  
  // 计算所有点的边界
  const lats = allPoints.map(p => p.latitude)
  const lngs = allPoints.map(p => p.longitude)
  
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  
  // 计算经纬度跨度
  const latSpan = maxLat - minLat
  const lngSpan = maxLng - minLng
  const maxSpan = Math.max(latSpan, lngSpan)
  
  // 根据跨度判断覆盖范围
  if (maxSpan > 1) return '省级覆盖'
  if (maxSpan > 0.1) return '市级覆盖'
  if (maxSpan > 0.01) return '区级覆盖'
  if (maxSpan > 0.001) return '街道级覆盖'
  return '社区级覆盖'
})

// 计算地图中心点和缩放级别
const mapCenter = computed((): [number, number] => {
  const allPoints = [
    ...droneList.value.filter(d => d.longitude && d.latitude && d.longitude !== 0 && d.latitude !== 0),
    ...cabinetList.value.filter(c => c.longitude && c.latitude && c.longitude !== 0 && c.latitude !== 0)
  ]
  
  if (allPoints.length === 0) {
    return [39.90923, 116.397428] // 默认北京坐标
  }
  
  // 计算所有点的边界
  const lats = allPoints.map(p => p.latitude)
  const lngs = allPoints.map(p => p.longitude)
  
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  
  // 计算中心点
  const centerLat = (minLat + maxLat) / 2
  const centerLng = (minLng + maxLng) / 2
  
  return [centerLat, centerLng]
})

const mapZoom = computed(() => {
  const allPoints = [
    ...droneList.value.filter(d => d.longitude && d.latitude && d.longitude !== 0 && d.latitude !== 0),
    ...cabinetList.value.filter(c => c.longitude && c.latitude && c.longitude !== 0 && c.latitude !== 0)
  ]
  
  if (allPoints.length === 0) {
    return 12 // 默认缩放级别
  }
  
  // 计算所有点的边界
  const lats = allPoints.map(p => p.latitude)
  const lngs = allPoints.map(p => p.longitude)
  
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  
  // 计算经纬度跨度
  const latSpan = maxLat - minLat
  const lngSpan = maxLng - minLng
  const maxSpan = Math.max(latSpan, lngSpan)
  
  // 根据跨度计算合适的缩放级别
  if (maxSpan > 1) return 8      // 省级
  if (maxSpan > 0.1) return 10   // 市级
  if (maxSpan > 0.01) return 12  // 区级
  if (maxSpan > 0.001) return 14 // 街道级
  return 16 // 社区级
})

// 列表数据
const droneList = ref<dronesVO[]>([])
const cabinetList = ref<CabinetVO[]>([])
const deliveringOrders = ref<TradeOrderApi.OrderVO[]>([])
const loading = ref(false)

// 无人机状态映射
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

const getDroneStatusClass = (status: number) => {
  const classMap = {
    0: 'status-online',    // 待机
    1: 'status-flying',    // 飞行中
    2: 'status-returning', // 返航中
    3: 'status-charging',  // 充电中
    4: 'status-maintenance', // 维护中
    5: 'status-error',     // 故障
    6: 'status-offline'    // 离线
  }
  return classMap[status] || 'status-offline'
}

const getBatteryColor = (level: number) => {
  if (level > 60) return '#67c23a'  // 绿色
  if (level > 30) return '#e6a23c'  // 黄色
  if (level > 10) return '#f56c6c'  // 红色
  return '#909399'  // 灰色
}

// 地图相关
const refreshMap = () => {
  // 刷新地图数据
  loadDashboardData()
}

const toggleMapFullscreen = () => {
  // 切换地图全屏
  console.log('切换地图全屏')
}

// 处理卡片点击事件
const handleDroneClick = () => {
  try {
    router.push('/mall/drones')
  } catch (error) {
    ElMessage.warning('无人机管理页面暂未配置，请联系管理员')
  }
}

const handleCabinetClick = () => {
  try {
    router.push('/mall/cabinet')
  } catch (error) {
    ElMessage.warning('无人机柜管理页面暂未配置，请联系管理员')
  }
}

// 数据加载
const loadDashboardData = async () => {
  loading.value = true
  try {
    console.log('开始加载真实数据...')
    
    // 加载无人机数据
    try {
      const droneData = await dronesApi.getdronesPage({
        pageNo: 1,
        pageSize: 100
      })
      droneList.value = droneData.list || []
      console.log('无人机数据:', droneList.value)
    } catch (error) {
      console.error('加载无人机数据失败:', error)
      droneList.value = []
    }
    
    // 计算无人机统计
    droneStats.total = droneList.value.length
    droneStats.online = droneList.value.filter(d => d.status === 0).length
    droneStats.flying = droneList.value.filter(d => d.status === 1).length
    droneStats.error = droneList.value.filter(d => d.status === 5).length

    // 加载无人机柜数据
    try {
      const cabinetData = await CabinetApi.getCabinetPage({
        pageNo: 1,
        pageSize: 100
      })
      cabinetList.value = cabinetData.list || []
      console.log('柜子数据:', cabinetList.value)
    } catch (error) {
      console.error('加载柜子数据失败:', error)
      cabinetList.value = []
    }
    
    // 计算柜子统计
    cabinetStats.total = cabinetList.value.length
    cabinetStats.online = cabinetList.value.filter(c => c.status === 1).length
    cabinetStats.available = cabinetList.value.reduce((sum, c) => sum + (c.availableBoxes || 0), 0)
    cabinetStats.error = cabinetList.value.filter(c => c.status === 2).length

    // 加载订单数据
    try {
      const orderData = await TradeOrderApi.getOrderPage({
        pageNo: 1,
        pageSize: 10,
        status: 20 // 已发货状态
      })
      
      // 过滤出无人机配送的订单
      deliveringOrders.value = (orderData.list || []).filter(order => 
        order.logisticsNo?.startsWith('DRONE-')
      )
    } catch (error) {
      console.error('加载订单数据失败:', error)
      deliveringOrders.value = []
    }

    // 计算真实统计数据
    orderStats.today = deliveringOrders.value.length
    orderStats.delivering = deliveringOrders.value.length
    orderStats.completed = deliveringOrders.value.filter(order => order.status === 30).length // 已完成状态
    systemStats.error = droneStats.error + cabinetStats.error
    systemStats.maintenance = droneList.value.filter(d => d.status === 4).length

    console.log('数据加载完成:', {
      drones: droneList.value.length,
      cabinets: cabinetList.value.length,
      orders: deliveringOrders.value.length,
      mapCenter: mapCenter.value,
      mapZoom: mapZoom.value
    })

  } catch (error) {
    console.error('加载仪表板数据失败:', error)
    // 显示错误提示
    ElMessage.error('数据加载失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}

// 轻量级数据更新 - 只更新统计数据，不重新加载地图
const updateStatsOnly = async () => {
  try {
    // 只更新统计数据，不重新加载完整数据
    const [droneData, cabinetData, orderData] = await Promise.allSettled([
      dronesApi.getdronesPage({ pageNo: 1, pageSize: 100 }),
      CabinetApi.getCabinetPage({ pageNo: 1, pageSize: 100 }),
      TradeOrderApi.getOrderPage({ pageNo: 1, pageSize: 10, status: 20 })
    ])

    // 更新无人机数据（保持引用，只更新内容）
    if (droneData.status === 'fulfilled') {
      const newDroneList = droneData.value.list || []
      // 智能更新：只更新变化的数据
      updateDroneListSmoothly(newDroneList)
    }

    // 更新柜子数据（保持引用，只更新内容）
    if (cabinetData.status === 'fulfilled') {
      const newCabinetList = cabinetData.value.list || []
      // 智能更新：只更新变化的数据
      updateCabinetListSmoothly(newCabinetList)
    }

    // 更新订单数据
    if (orderData.status === 'fulfilled') {
      const newOrderList = (orderData.value.list || []).filter(order => 
        order.logisticsNo?.startsWith('DRONE-')
      )
      deliveringOrders.value = newOrderList
    }

    // 重新计算统计数据
    updateStats()
    
  } catch (error) {
    console.error('轻量级数据更新失败:', error)
  }
}

// 智能更新无人机列表
const updateDroneListSmoothly = (newDroneList: dronesVO[]) => {
  // 如果数量变化很大，直接替换
  if (Math.abs(newDroneList.length - droneList.value.length) > 5) {
    droneList.value = newDroneList
    return
  }

  // 否则逐个更新，保持引用稳定
  newDroneList.forEach((newDrone, index) => {
    if (index < droneList.value.length) {
      // 更新现有对象
      Object.assign(droneList.value[index], newDrone)
    } else {
      // 添加新对象
      droneList.value.push(newDrone)
    }
  })

  // 移除多余的
  if (droneList.value.length > newDroneList.length) {
    droneList.value.splice(newDroneList.length)
  }
}

// 智能更新柜子列表
const updateCabinetListSmoothly = (newCabinetList: CabinetVO[]) => {
  // 如果数量变化很大，直接替换
  if (Math.abs(newCabinetList.length - cabinetList.value.length) > 5) {
    cabinetList.value = newCabinetList
    return
  }

  // 否则逐个更新，保持引用稳定
  newCabinetList.forEach((newCabinet, index) => {
    if (index < cabinetList.value.length) {
      // 更新现有对象
      Object.assign(cabinetList.value[index], newCabinet)
    } else {
      // 添加新对象
      cabinetList.value.push(newCabinet)
    }
  })

  // 移除多余的
  if (cabinetList.value.length > newCabinetList.length) {
    cabinetList.value.splice(newCabinetList.length)
  }
}

// 更新统计数据
const updateStats = () => {
  // 计算无人机统计
  droneStats.total = droneList.value.length
  droneStats.online = droneList.value.filter(d => d.status === 0).length
  droneStats.flying = droneList.value.filter(d => d.status === 1).length
  droneStats.error = droneList.value.filter(d => d.status === 5).length

  // 计算柜子统计
  cabinetStats.total = cabinetList.value.length
  cabinetStats.online = cabinetList.value.filter(c => c.status === 1).length
  cabinetStats.available = cabinetList.value.reduce((sum, c) => sum + (c.availableBoxes || 0), 0)
  cabinetStats.error = cabinetList.value.filter(c => c.status === 2).length

  // 计算订单统计
  orderStats.today = deliveringOrders.value.length
  orderStats.delivering = deliveringOrders.value.length
  orderStats.completed = deliveringOrders.value.filter(order => order.status === 30).length
  systemStats.error = droneStats.error + cabinetStats.error
  systemStats.maintenance = droneList.value.filter(d => d.status === 4).length
}

// 定时刷新
let refreshTimer: NodeJS.Timeout | null = null
let statsTimer: NodeJS.Timeout | null = null

onMounted(() => {
  // 首次加载完整数据
  loadDashboardData()
  
  // 每30秒进行轻量级数据更新（只更新统计数据，不影响地图）
  statsTimer = setInterval(updateStatsOnly, 30000)
  
  // 每5分钟进行一次完整数据刷新（包括地图）
  refreshTimer = setInterval(loadDashboardData, 300000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  if (statsTimer) {
    clearInterval(statsTimer)
  }
})
</script>

<style lang="scss" scoped>
.drone-dashboard {
  .welcome-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    :deep(.el-card__body) {
      padding: 24px;
    }
  }

  .stat-card {
    height: 120px;
    transition: all 0.3s;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
    
    &.cursor-pointer {
      cursor: pointer;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
      }
      
      &:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }
  }
  
  .stats-sidebar {
    .stat-card {
      width: 100%;
      
      &:last-child {
        margin-bottom: 0 !important;
      }
    }
  }
  
  // 响应式调整
  @media (max-width: 1200px) {
    .stats-sidebar {
      .stat-card {
        margin-bottom: 12px;
      }
    }
  }
  
  @media (max-width: 768px) {
    .stats-sidebar {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      
      .stat-card {
        margin-bottom: 0;
      }
    }
  }
  
  @media (max-width: 480px) {
    .stats-sidebar {
      grid-template-columns: 1fr;
    }
  }

  .map-card {
    .map-container {
      height: 500px;
      background: #f5f7fa;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .map-placeholder {
        text-align: center;
      }
    }
    
    .no-data-tip {
      height: 500px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f7fa;
      border-radius: 8px;
    }
    
    .loading-tip {
      height: 500px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f5f7fa;
      border-radius: 8px;
      
      .el-icon {
        font-size: 32px;
        color: #409eff;
        animation: rotate 1s linear infinite;
      }
      
      .loading-text {
        margin-top: 16px;
        color: #909399;
        font-size: 14px;
      }
    }
  }




}



@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.grid {
  display: grid;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.gap-12px {
  gap: 12px;
}

.space-y-12px > * + * {
  margin-top: 12px;
}

.space-y-8px > * + * {
  margin-top: 8px;
}

.mb-8px {
  margin-bottom: 8px;
}

.mb-16px {
  margin-bottom: 16px;
}

.mt-4px {
  margin-top: 4px;
}

.mt-8px {
  margin-top: 8px;
}

.mt-16px {
  margin-top: 16px;
}

.ml-8px {
  margin-left: 8px;
}

.mr-16px {
  margin-right: 16px;
}

.px-8px {
  padding-left: 8px;
  padding-right: 8px;
}

.py-20px {
  padding-top: 20px;
  padding-bottom: 20px;
}

.text-12px {
  font-size: 12px;
}

.text-14px {
  font-size: 14px;
}

.text-16px {
  font-size: 16px;
}

.text-20px {
  font-size: 20px;
}

.text-24px {
  font-size: 24px;
}

.text-60px {
  font-size: 60px;
}

.text-gray-300 {
  color: #d1d5db;
}

.text-gray-400 {
  color: #9ca3af;
}

.text-gray-500 {
  color: #6b7280;
}

.text-center {
  text-align: center;
}

.font-bold {
  font-weight: bold;
}

.font-medium {
  font-weight: 500;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.items-start {
  align-items: flex-start;
}

.justify-between {
  justify-content: space-between;
}

.justify-center {
  justify-content: center;
}

.text-right {
  text-align: right;
}

.cursor-pointer {
  cursor: pointer;
}

.transition-all {
  transition: all 0.3s;
}

.rounded-6px {
  border-radius: 6px;
}

.rounded-8px {
  border-radius: 8px;
}

.rounded-50 {
  border-radius: 50%;
}

.w-8px {
  width: 8px;
}

.h-8px {
  height: 8px;
}

.h-70px {
  height: 70px;
}

.h-80px {
  height: 80px;
}

.h-120px {
  height: 120px;
}

.h-500px {
  height: 500px;
}

.w-8px {
  width: 8px;
}

.h-8px {
  height: 8px;
}

:deep(.el-progress-bar__outer) {
  height: 4px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 2px;
}
</style>
