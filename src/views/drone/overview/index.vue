<template>
  <div class="drone-overview">
    <!-- 地图背景 -->
    <div class="map-background">
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
    </div>

    <!-- 漂浮的数据卡片 -->
    <div class="floating-cards">
      <!-- 飞行统计卡片 -->
      <div class="flight-stats-card">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <span class="text-16px font-bold">飞行统计</span>
          </template>
          <div class="flight-stats-grid">
            <div class="stat-item">
              <div class="stat-icon text-primary">
                <el-icon><Monitor /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ operationData[0].value }}</div>
                <div class="stat-label">{{ operationData[0].label }}</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon text-success">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ operationData[1].value }}</div>
                <div class="stat-label">{{ operationData[1].label }}</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon text-warning">
                <el-icon><Location /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ operationData[2].value }}</div>
                <div class="stat-label">{{ operationData[2].label }}</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon text-info">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ operationData[3].value }}</div>
                <div class="stat-label">{{ operationData[3].label }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 资源使用情况 -->
      <div class="resource-card">
        <el-card shadow="hover" class="info-card">
          <template #header>
            <span class="text-16px font-bold">资源使用情况</span>
          </template>
          <div class="resource-stats">
            <div class="stat-item" v-for="(stat, index) in resourceStats" :key="index">
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-value">
                <span class="number">{{ stat.value }}</span>
                <span class="unit">{{ stat.unit }}</span>
              </div>
              <div class="stat-rate">
                <span class="rate-label">在线率:</span>
                <span class="rate-value">{{ stat.onlineRate }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 安全预警 -->
      <div class="warning-card">
        <el-card shadow="hover" class="info-card">
          <template #header>
            <span class="text-16px font-bold">安全预警</span>
          </template>
          <div class="warning-list">
            <div class="warning-item" v-for="(warning, index) in warningList" :key="index">
              <el-tag :type="warning.level" size="small">{{ warning.levelText }}</el-tag>
              <span class="warning-text">{{ warning.message }}</span>
              <span class="warning-time">{{ warning.time }}</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 操作日志 -->
      <div class="log-card">
        <el-card shadow="hover" class="info-card">
          <template #header>
            <span class="text-16px font-bold">操作日志</span>
          </template>
          <div class="log-list">
            <div class="log-item" v-for="(log, index) in operationLogs" :key="index">
              <div class="log-time">{{ log.time }}</div>
              <div class="log-content">{{ log.content }}</div>
              <div class="log-user">{{ log.user }}</div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 右下角分析报表 -->
    <div class="bottom-right-report">
      <el-card shadow="hover" class="info-card">
        <template #header>
          <span class="text-16px font-bold">分析报表</span>
        </template>
        <div class="report-list">
          <div class="report-item" v-for="(report, index) in reportList" :key="index">
            <div class="report-title">{{ report.title }}</div>
            <div class="report-desc">{{ report.description }}</div>
            <el-button size="small" type="primary" @click="viewReport(report)">
              查看详情
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 顶部操作栏 -->
    <div class="top-actions">
      <el-button type="primary" @click="refreshData">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Monitor,
  Timer,
  Location,
  Warning,
  Refresh,
  Loading
} from '@element-plus/icons-vue'
import DroneMap from '@/components/DroneMap/index.vue'
import { dronesApi, dronesVO } from '@/api/drone/droneComm'
import { CabinetApi, CabinetVO } from '@/api/drone/cabinet'

defineOptions({ name: 'DroneOverview' })

const router = useRouter()

// 数据状态
const loading = ref(false)
const droneList = ref<dronesVO[]>([])
const cabinetList = ref<CabinetVO[]>([])

// 运营数据
const operationData = ref([
  {
    label: '飞行任务数量',
    value: '156',
    unit: '个',
    icon: 'Monitor',
    iconClass: 'text-primary'
  },
  {
    label: '飞行架次',
    value: '1,234',
    unit: '次',
    icon: 'Timer',
    iconClass: 'text-success'
  },
  {
    label: '总里程',
    value: '2,567',
    unit: '公里',
    icon: 'Location',
    iconClass: 'text-warning'
  },
  {
    label: '总时长',
    value: '456',
    unit: '小时',
    icon: 'Timer',
    iconClass: 'text-info'
  }
])

// 资源使用情况
const resourceStats = ref([
  {
    label: '飞行器',
    value: '25',
    unit: '架',
    onlineRate: 92
  },
  {
    label: '起降点',
    value: '8',
    unit: '个',
    onlineRate: 100
  }
])

// 安全预警
const warningList = ref<Array<{
  level: 'warning' | 'danger' | 'info'
  levelText: string
  message: string
  time: string
}>>([
  {
    level: 'warning',
    levelText: '警告',
    message: '飞行器DR-001电池电量低于20%',
    time: '2分钟前'
  },
  {
    level: 'danger',
    levelText: '严重',
    message: '起降点LP-003设备离线',
    time: '5分钟前'
  },
  {
    level: 'info',
    levelText: '提示',
    message: '航线RT-005需要维护检查',
    time: '10分钟前'
  }
])

// 操作日志
const operationLogs = ref([
  {
    time: '14:30:25',
    content: '创建运输任务 T-20241201-001',
    user: '张三'
  },
  {
    time: '14:25:18',
    content: '修改航线 RT-005 航点设置',
    user: '李四'
  },
  {
    time: '14:20:45',
    content: '审核通过调度任务 D-20241201-003',
    user: '王五'
  }
])

// 分析报表
const reportList = ref([
  {
    title: '任务来源分析',
    description: '统计各渠道任务来源分布情况'
  },
  {
    title: '飞行异常分析',
    description: '分析飞行异常原因及处理方案'
  },
  {
    title: '设备使用率分析',
    description: '统计设备使用率及效率分析'
  }
])

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
  
  // 根据跨度计算缩放级别
  if (maxSpan > 1) return 8
  if (maxSpan > 0.1) return 10
  if (maxSpan > 0.01) return 12
  if (maxSpan > 0.001) return 14
  return 16
})

// 加载数据
const loadDashboardData = async () => {
  loading.value = true
  try {
    const [droneData, cabinetData] = await Promise.allSettled([
      dronesApi.getdronesPage({ pageNo: 1, pageSize: 100 }),
      CabinetApi.getCabinetPage({ pageNo: 1, pageSize: 100 })
    ])

    if (droneData.status === 'fulfilled') {
      droneList.value = droneData.value.list || []
    }

    if (cabinetData.status === 'fulfilled') {
      cabinetList.value = cabinetData.value.list || []
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 查看报表详情
const viewReport = (report: any) => {
  console.log('查看报表:', report.title)
  ElMessage.success('报表功能开发中...')
}

// 刷新数据
const refreshData = () => {
  loadDashboardData()
  ElMessage.success('数据刷新成功')
}

// 生命周期
onMounted(() => {
  loadDashboardData()
  
  // 添加鼠标滚轮事件监听
  const floatingCards = document.querySelector('.floating-cards')
  if (floatingCards) {
    floatingCards.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault()
      floatingCards.scrollTop += e.deltaY
    })
  }
})

onUnmounted(() => {
  // 清理事件监听
  const floatingCards = document.querySelector('.floating-cards')
  if (floatingCards) {
    floatingCards.removeEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault()
      floatingCards.scrollTop += e.deltaY
    })
  }
})
</script>

<style lang="scss" scoped>
.drone-overview {
  position: relative;
  width: 100%;
  height: 90vh;
  overflow: hidden;

  .map-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .floating-cards {
    position: absolute;
    top: 20px;
    left: 20px;
    width: 320px;
    height: calc(100vh - 40px); /* 增加高度，减少顶部边距 */
    display: flex;
    flex-direction: column;
    gap: 16px; /* 减少间距以节省空间 */
    z-index: 15;
    pointer-events: auto;
    overflow-y: auto;
    padding: 0 0 20px 0; /* 只保留底部内边距 */
    
    /* 隐藏滚动条但保持滚动功能 */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
    
    /* Webkit浏览器隐藏滚动条 */
    &::-webkit-scrollbar {
      display: none;
    }
    
    /* 鼠标悬停时启用滚动 */
    &:hover {
      cursor: grab;
      
      &:active {
        cursor: grabbing;
      }
    }

    .flight-stats-card,
    .resource-card,
    .warning-card,
    .log-card {
      position: relative;
      width: 100%;
      flex-shrink: 0;
      min-height: fit-content; /* 确保卡片不会被压缩 */

      .stat-card,
      .info-card {
        background: rgba(0, 123, 255, 0.1);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(0, 123, 255, 0.3);
        border-radius: 16px;
        box-shadow: 
          0 8px 32px rgba(0, 123, 255, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
        transition: all 0.3s;
        max-height: none; /* 移除最大高度限制 */

        &:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 12px 32px rgba(0, 123, 255, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        :deep(.el-card__header) {
          background: rgba(0, 123, 255, 0.1);
          border-bottom: 1px solid rgba(0, 123, 255, 0.2);
          border-radius: 16px 16px 0 0;
          
          .text-16px {
            color: #ffffff;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
        }

        :deep(.el-card__body) {
          background: transparent;
        }
      }
    }
  }

  .bottom-right-report {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 320px;
    z-index: 15;
    pointer-events: auto;

    .info-card {
      background: rgba(0, 123, 255, 0.1);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(0, 123, 255, 0.3);
      border-radius: 16px;
      box-shadow: 
        0 8px 32px rgba(0, 123, 255, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 
          0 12px 32px rgba(0, 123, 255, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
      }

      :deep(.el-card__header) {
        background: rgba(0, 123, 255, 0.1);
        border-bottom: 1px solid rgba(0, 123, 255, 0.2);
        border-radius: 16px 16px 0 0;
        
        .text-16px {
          color: #ffffff;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      }

      :deep(.el-card__body) {
        background: transparent;
      }
    }

    .report-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 300px; /* 增加最大高度 */
      overflow-y: auto;
      
      /* 隐藏滚动条 */
      scrollbar-width: none;
      -ms-overflow-style: none;
      &::-webkit-scrollbar {
        display: none;
      }
      
      .report-item {
        width: 100%;
        padding: 10px; /* 稍微增加内边距 */
        border: 1px solid rgba(0, 123, 255, 0.3);
        border-radius: 12px;
        background: rgba(0, 123, 255, 0.08);
        flex-shrink: 0;
        backdrop-filter: blur(10px);
        
        .report-title {
          font-size: 14px; /* 稍微增加字体 */
          font-weight: bold;
          color: #ffffff;
          margin-bottom: 4px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .report-desc {
          font-size: 12px; /* 稍微增加字体 */
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 8px;
          line-height: 1.4;
        }
        
        .el-button {
          padding: 6px 12px; /* 稍微增加按钮内边距 */
          font-size: 12px; /* 稍微增加按钮字体 */
          height: 28px; /* 稍微增加按钮高度 */
          background: rgba(0, 123, 255, 0.3);
          border: 1px solid rgba(0, 123, 255, 0.5);
          color: #ffffff;
          backdrop-filter: blur(10px);
          
          &:hover {
            background: rgba(0, 123, 255, 0.4);
            border-color: rgba(0, 123, 255, 0.7);
            box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
          }
        }
      }
    }
  }

  .top-actions {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    pointer-events: auto;
  }

  .loading-tip, .no-data-tip {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: #fff;
    z-index: 5;

    .loading-text {
      margin-top: 16px;
      font-size: 16px;
    }
  }

  .resource-stats {
    .stat-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0; /* 减少内边距 */
      border-bottom: 1px solid rgba(0, 123, 255, 0.2);
      
      &:last-child {
        border-bottom: none;
      }
      
      .stat-label {
        font-size: 13px; /* 稍微减小字体 */
        color: rgba(255, 255, 255, 0.8);
      }
      
      .stat-value {
        .number {
          font-size: 15px; /* 稍微减小字体 */
          font-weight: bold;
          color: #ffffff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .unit {
          font-size: 11px; /* 稍微减小字体 */
          color: rgba(255, 255, 255, 0.6);
          margin-left: 4px;
        }
      }
      
      .stat-rate {
        .rate-label {
          font-size: 11px; /* 稍微减小字体 */
          color: rgba(255, 255, 255, 0.6);
        }
        
        .rate-value {
          font-size: 13px; /* 稍微减小字体 */
          color: #00d4ff;
          font-weight: bold;
          margin-left: 4px;
          text-shadow: 0 0 8px rgba(0, 212, 255, 0.6);
        }
      }
    }
  }

  .warning-list {
    .warning-item {
      display: flex;
      align-items: center;
      padding: 4px 0; /* 减少内边距 */
      border-bottom: 1px solid rgba(0, 123, 255, 0.2);
      
      &:last-child {
        border-bottom: none;
      }
      
      .warning-text {
        flex: 1;
        margin-left: 6px; /* 减少左边距 */
        font-size: 12px; /* 稍微减小字体 */
        color: rgba(255, 255, 255, 0.8);
      }
      
      .warning-time {
        font-size: 10px; /* 稍微减小字体 */
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }

  .log-list {
    .log-item {
      padding: 4px 0; /* 减少内边距 */
      border-bottom: 1px solid rgba(0, 123, 255, 0.2);
      
      &:last-child {
        border-bottom: none;
      }
      
      .log-time {
        font-size: 10px; /* 稍微减小字体 */
        color: rgba(255, 255, 255, 0.6);
      }
      
      .log-content {
        font-size: 12px; /* 稍微减小字体 */
        color: rgba(255, 255, 255, 0.8);
        margin: 1px 0; /* 减少边距 */
      }
      
      .log-user {
        font-size: 10px; /* 稍微减小字体 */
        color: #00d4ff;
        text-shadow: 0 0 8px rgba(0, 212, 255, 0.6);
      }
    }
  }

  .flight-stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px; /* 减少间距 */
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px; /* 减少间距 */
      padding: 8px; /* 减少内边距 */
      border-radius: 12px; /* 稍微减小圆角 */
      background: rgba(0, 123, 255, 0.08);
      border: 1px solid rgba(0, 123, 255, 0.2);
      backdrop-filter: blur(10px);
      
      .stat-icon {
        font-size: 20px; /* 稍微减小图标 */
        width: 32px; /* 减小宽度 */
        height: 32px; /* 减小高度 */
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px; /* 稍微减小圆角 */
        background: rgba(0, 123, 255, 0.2);
        border: 1px solid rgba(0, 123, 255, 0.3);
        color: #ffffff;
      }
      
      .stat-content {
        flex: 1;
        
        .stat-value {
          font-size: 16px; /* 稍微减小字体 */
          font-weight: bold;
          color: #ffffff;
          line-height: 1.2;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .stat-label {
          font-size: 11px; /* 稍微减小字体 */
          color: rgba(255, 255, 255, 0.7);
          margin-top: 1px; /* 减少顶部边距 */
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .drone-overview {
    .floating-cards {
      .flight-stats-card,
      .resource-card,
      .warning-card,
      .log-card {
        position: relative;
        width: auto;
        margin: 10px;
        left: auto;
      }
    }
  }
}

@media (max-width: 768px) {
  .drone-overview {
    .floating-cards {
      .flight-stats-card,
      .resource-card,
      .warning-card,
      .log-card {
        position: relative;
        width: auto;
        margin: 10px;
        left: auto;
      }
    }
  }
}
</style> 