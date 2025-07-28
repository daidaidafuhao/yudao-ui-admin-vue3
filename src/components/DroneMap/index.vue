<template>
  <div class="drone-map-container">
    <div ref="mapContainer" class="map-wrapper"></div>
    
    <!-- 地图控制面板 -->
    <div class="map-controls">
      <div class="control-panel">
        <div class="control-title">图例</div>
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-dot drone-online"></div>
            <span>无人机(在线)</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot drone-flying"></div>
            <span>无人机(飞行中)</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot drone-error"></div>
            <span>无人机(故障)</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot cabinet-online"></div>
            <span>柜子(在线)</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot cabinet-offline"></div>
            <span>柜子(离线)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 无人机信息弹窗 -->
    <el-dialog
      v-model="droneInfoVisible"
      title="无人机详情"
      width="400px"
      :show-close="true"
    >
      <div v-if="selectedDrone" class="drone-info">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="无人机名称">
            {{ selectedDrone.droneName }}
          </el-descriptions-item>
          <el-descriptions-item label="无人机编号">
            {{ selectedDrone.droneCode }}
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
          <el-descriptions-item label="当前位置">
            经度: {{ selectedDrone.longitude?.toFixed(6) }}<br />
            纬度: {{ selectedDrone.latitude?.toFixed(6) }}<br />
            高度: {{ selectedDrone.altitude }}m
          </el-descriptions-item>
          <el-descriptions-item label="当前速度">
            {{ selectedDrone.speed }} m/s
          </el-descriptions-item>
          <el-descriptions-item label="航向角度">
            {{ selectedDrone.heading }}°
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedDrone.currentOrderNo" label="当前订单">
            {{ selectedDrone.currentOrderNo }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 柜子信息弹窗 -->
    <el-dialog
      v-model="cabinetInfoVisible"
      title="无人机柜详情"
      width="400px"
      :show-close="true"
    >
      <div v-if="selectedCabinet" class="cabinet-info">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="柜子名称">
            {{ selectedCabinet.name }}
          </el-descriptions-item>
          <el-descriptions-item label="柜子编号">
            {{ selectedCabinet.code }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getCabinetStatusType(selectedCabinet.status)">
              {{ getCabinetStatusText(selectedCabinet.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="格口使用情况">
            {{ selectedCabinet.availableBoxes }}/{{ selectedCabinet.totalBoxes }}
          </el-descriptions-item>
          <el-descriptions-item label="地址">
            {{ selectedCabinet.address }}
          </el-descriptions-item>
          <el-descriptions-item label="位置">
            经度: {{ selectedCabinet.longitude?.toFixed(6) }}<br />
            纬度: {{ selectedCabinet.latitude?.toFixed(6) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedCabinet.errorMessage" label="故障信息">
            {{ selectedCabinet.errorMessage }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { dronesVO } from '@/api/drone/droneComm'
import { CabinetVO } from '@/api/drone/cabinet'

interface Props {
  drones: dronesVO[]
  cabinets: CabinetVO[]
  center?: [number, number]
  zoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  center: () => [39.90923, 116.397428], // 默认北京坐标 [纬度, 经度]
  zoom: 12
})

const mapContainer = ref<HTMLElement>()
const droneInfoVisible = ref(false)
const cabinetInfoVisible = ref(false)
const selectedDrone = ref<dronesVO>()
const selectedCabinet = ref<CabinetVO>()

// 地图相关变量
let map: any = null
let droneMarkers: any[] = []
let cabinetMarkers: any[] = []

// 腾讯地图API密钥
const MAP_KEY = 'T5MBZ-4XDK3-KQQ3Q-RVDVZ-PBR7E-AMF3R'

// 状态映射函数
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

const getDroneStatusType = (status: number) => {
  const typeMap = {
    0: 'success',  // 待机
    1: 'warning',  // 飞行中
    2: 'warning',  // 返航中
    3: 'info',     // 充电中
    4: 'warning',  // 维护中
    5: 'danger',   // 故障
    6: 'info'      // 离线
  }
  return typeMap[status] || 'info'
}

const getCabinetStatusText = (status: number) => {
  const statusMap = {
    0: '离线',
    1: '在线',
    2: '故障'
  }
  return statusMap[status] || '未知'
}

const getCabinetStatusType = (status: number) => {
  const typeMap = {
    0: 'info',     // 离线
    1: 'success',  // 在线
    2: 'danger'    // 故障
  }
  return typeMap[status] || 'info'
}

const getBatteryColor = (level: number) => {
  if (level > 60) return '#67c23a'  // 绿色
  if (level > 30) return '#e6a23c'  // 黄色
  if (level > 10) return '#f56c6c'  // 红色
  return '#909399'  // 灰色
}

// 加载腾讯地图API
const loadMapAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载
    if (window.TMap) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${MAP_KEY}`
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Tencent Map API'))
    document.head.appendChild(script)
  })
}

// 初始化地图
const initMap = async () => {
  if (!mapContainer.value) return

  try {
    await loadMapAPI()
    
    // 创建地图实例
    map = new window.TMap.Map(mapContainer.value, {
      center: new window.TMap.LatLng(props.center[0], props.center[1]),
      zoom: props.zoom,
      pitch: 0,
      rotation: 0
    })

    // 初始化标记点
    updateMarkers()
  } catch (error) {
    console.error('初始化地图失败:', error)
    // 显示错误信息
    mapContainer.value.innerHTML = `
      <div class="map-error">
        <div class="error-icon">🗺️</div>
        <div class="error-text">地图加载失败</div>
        <div class="error-desc">请检查网络连接或API密钥</div>
      </div>
    `
  }
}

// 更新标记点
const updateMarkers = () => {
  if (!map) return

  console.log('更新地图标记:', {
    drones: props.drones.length,
    cabinets: props.cabinets.length
  })

  // 清除现有标记
  clearMarkers()

  // 添加无人机标记
  props.drones.forEach((drone, index) => {
    console.log(`无人机 ${index}:`, {
      name: drone.droneName,
      longitude: drone.longitude,
      latitude: drone.latitude,
      status: drone.status
    })
    
    if (drone.longitude && drone.latitude && drone.longitude !== 0 && drone.latitude !== 0) {
      const marker = new window.TMap.MultiMarker({
        map: map,
        styles: {
          'drone-online': new window.TMap.MarkerStyle({
            width: 32,
            height: 32,
            anchor: { x: 16, y: 16 },
            src: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#67c23a" stroke="white" stroke-width="2"/>
                <text x="16" y="20" text-anchor="middle" fill="white" font-size="16" font-weight="bold">&#x1F681;</text>
              </svg>
            `)))
          }),
          'drone-flying': new window.TMap.MarkerStyle({
            width: 32,
            height: 32,
            anchor: { x: 16, y: 16 },
            src: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#409eff" stroke="white" stroke-width="2"/>
                <text x="16" y="20" text-anchor="middle" fill="white" font-size="16" font-weight="bold">&#x1F681;</text>
              </svg>
            `)))
          }),
          'drone-error': new window.TMap.MarkerStyle({
            width: 32,
            height: 32,
            anchor: { x: 16, y: 16 },
            src: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#f56c6c" stroke="white" stroke-width="2"/>
                <text x="16" y="20" text-anchor="middle" fill="white" font-size="16" font-weight="bold">&#x1F681;</text>
              </svg>
            `)))
          })
        },
        geometries: [{
          id: `drone-${index}`,
          styleId: getDroneMarkerStyle(drone.status),
          position: new window.TMap.LatLng(drone.latitude, drone.longitude),
          properties: {
            title: drone.droneName,
            type: 'drone',
            index: index
          }
        }]
      })

      // 添加点击事件
      marker.on('click', (evt: any) => {
        const geometry = evt.geometry
        if (geometry.properties.type === 'drone') {
          selectedDrone.value = props.drones[geometry.properties.index]
          droneInfoVisible.value = true
        }
      })

      droneMarkers.push(marker)
    }
  })

  // 添加柜子标记
  props.cabinets.forEach((cabinet, index) => {
    console.log(`柜子 ${index}:`, {
      name: cabinet.name,
      longitude: cabinet.longitude,
      latitude: cabinet.latitude,
      status: cabinet.status
    })
    
    if (cabinet.longitude && cabinet.latitude && cabinet.longitude !== 0 && cabinet.latitude !== 0) {
      const marker = new window.TMap.MultiMarker({
        map: map,
        styles: {
          'cabinet-online': new window.TMap.MarkerStyle({
            width: 28,
            height: 28,
            anchor: { x: 14, y: 14 },
            src: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(`
              <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="20" height="20" rx="4" fill="#67c23a" stroke="white" stroke-width="2"/>
                <text x="14" y="18" text-anchor="middle" fill="white" font-size="14" font-weight="bold">&#x1F4E6;</text>
              </svg>
            `)))
          }),
          'cabinet-offline': new window.TMap.MarkerStyle({
            width: 28,
            height: 28,
            anchor: { x: 14, y: 14 },
            src: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(`
              <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="20" height="20" rx="4" fill="#c0c4cc" stroke="white" stroke-width="2"/>
                <text x="14" y="18" text-anchor="middle" fill="white" font-size="14" font-weight="bold">&#x1F4E6;</text>
              </svg>
            `)))
          }),
          'cabinet-error': new window.TMap.MarkerStyle({
            width: 28,
            height: 28,
            anchor: { x: 14, y: 14 },
            src: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(`
              <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="20" height="20" rx="4" fill="#f56c6c" stroke="white" stroke-width="2"/>
                <text x="14" y="18" text-anchor="middle" fill="white" font-size="14" font-weight="bold">&#x1F4E6;</text>
              </svg>
            `)))
          })
        },
        geometries: [{
          id: `cabinet-${index}`,
          styleId: getCabinetMarkerStyle(cabinet.status),
          position: new window.TMap.LatLng(cabinet.latitude, cabinet.longitude),
          properties: {
            title: cabinet.name,
            type: 'cabinet',
            index: index
          }
        }]
      })

      // 添加点击事件
      marker.on('click', (evt: any) => {
        const geometry = evt.geometry
        if (geometry.properties.type === 'cabinet') {
          selectedCabinet.value = props.cabinets[geometry.properties.index]
          cabinetInfoVisible.value = true
        }
      })

      cabinetMarkers.push(marker)
    }
  })
}

// 获取无人机标记样式
const getDroneMarkerStyle = (status: number) => {
  const styleMap = {
    0: 'drone-online',    // 待机
    1: 'drone-flying',    // 飞行中
    2: 'drone-flying',    // 返航中
    3: 'drone-online',    // 充电中
    4: 'drone-online',    // 维护中
    5: 'drone-error',     // 故障
    6: 'drone-online'     // 离线
  }
  return styleMap[status] || 'drone-online'
}

// 获取柜子标记样式
const getCabinetMarkerStyle = (status: number) => {
  const styleMap = {
    0: 'cabinet-offline', // 离线
    1: 'cabinet-online',  // 在线
    2: 'cabinet-error'    // 故障
  }
  return styleMap[status] || 'cabinet-offline'
}

// 清除标记
const clearMarkers = () => {
  droneMarkers.forEach(marker => marker.setMap(null))
  cabinetMarkers.forEach(marker => marker.setMap(null))
  droneMarkers = []
  cabinetMarkers = []
}

// 监听数据变化
watch(() => [props.drones, props.cabinets], () => {
  nextTick(() => {
    if (map) {
      updateMarkers()
    }
  })
}, { deep: true })

// 监听中心点和缩放级别变化
watch(() => [props.center, props.zoom], () => {
  nextTick(() => {
    if (map) {
      // 更新地图中心点和缩放级别
      map.setCenter(new window.TMap.LatLng(props.center[0], props.center[1]))
      map.setZoom(props.zoom)
    }
  })
}, { deep: true })

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  clearMarkers()
  if (map) {
    map.destroy()
  }
})

// 声明全局类型
declare global {
  interface Window {
    TMap: any
  }
}
</script>

<style lang="scss" scoped>
.drone-map-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-wrapper {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border-radius: 8px;
  overflow: hidden;
}

.map-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  
  .error-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  .error-text {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 8px;
  }
  
  .error-desc {
    font-size: 14px;
  }
}

.map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 100;
}

.control-panel {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  
  .control-title {
    font-weight: bold;
    margin-bottom: 12px;
    color: #303133;
  }
  
  .legend-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    font-size: 12px;
    
    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 8px;
      
      &.drone-online { background-color: #67c23a; }
      &.drone-flying { background-color: #409eff; }
      &.drone-error { background-color: #f56c6c; }
      &.cabinet-online { background-color: #67c23a; }
      &.cabinet-offline { background-color: #c0c4cc; }
    }
  }
}

.drone-info, .cabinet-info {
  .el-descriptions {
    margin-top: 16px;
  }
}
</style> 