<template>
  <div class="drone-map-container">
    <div ref="mapContainer" class="map-wrapper"></div>
    
    <!-- 地图控制面板 -->
    <div v-if="props.showControls" class="map-controls">
      
      <!-- 图例 -->
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
          <div class="legend-item">
            <div class="legend-dot cabinet-error"></div>
            <span>柜子(故障)</span>
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

interface Waypoint {
  id?: string
  index: number
  name: string
  latitude: number
  longitude: number
  altitude: number
  speed: number
  action: string
}

interface Props {
  drones: dronesVO[]
  cabinets: CabinetVO[]
  waypoints?: Waypoint[]
  showRoutePath?: boolean
  enableWaypointDrag?: boolean
  center?: [number, number]
  zoom?: number
  showControls?: boolean
  enableMapClick?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  drones: () => [],
  cabinets: () => [],
  waypoints: () => [],
  showRoutePath: true,
  center: () => [39.90923, 116.397428], // 默认北京坐标 [纬度, 经度]
  zoom: 12,
  showControls: true,
  enableMapClick: false
})

// 定义事件
const emit = defineEmits<{
  'map-click': [{ lat: number; lng: number; latlng: { lat: number; lng: number } }]
  'waypoint-drag': [{ index: number; lat: number; lng: number }]
  'waypoint-click': [{ index: number; waypoint: any }]
}>()

const mapContainer = ref<HTMLElement>()
const droneInfoVisible = ref(false)
const cabinetInfoVisible = ref(false)
const selectedDrone = ref<dronesVO>()
const selectedCabinet = ref<CabinetVO>()

// 地图相关变量
let map: any = null
let droneMarkers: any[] = []
let cabinetMarkers: any[] = []
let waypointMarkers: any[] = []
let routePath: any = null
let updateTimeout: NodeJS.Timeout | null = null

// 腾讯地图API密钥
const MAP_KEY = 'T5MBZ-4XDK3-KQQ3Q-RVDVZ-PBR7E-AMF3R'

// 地图类型
const mapType = ref<'vector' | 'satellite'>('satellite')

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

// 地图点击事件处理器
let mapClickHandler: ((evt: any) => void) | null = null

// 绑定地图点击事件
const bindMapClickEvent = () => {
  if (!map) return
  
  // 先解绑之前的事件
  if (mapClickHandler) {
    map.off('click', mapClickHandler)
    mapClickHandler = null
  }
  
  // 如果启用地图点击，则绑定新事件
  if (props.enableMapClick) {
    console.log('正在绑定地图点击事件')
    mapClickHandler = (evt: any) => {
      const lat = evt.latLng.getLat()
      const lng = evt.latLng.getLng()
      console.log('地图点击事件触发:', { lat, lng })
      emit('map-click', {
        lat,
        lng,
        latlng: { lat, lng }
      })
    }
    map.on('click', mapClickHandler)
  } else {
    console.log('地图点击事件已解绑')
  }
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
    script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${MAP_KEY}&libraries=visualization`
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
    
    // 验证和修正地图参数
    const validCenter = [
      isNaN(props.center[0]) || props.center[0] < -90 || props.center[0] > 90 ? 39.90923 : props.center[0],
      isNaN(props.center[1]) || props.center[1] < -180 || props.center[1] > 180 ? 116.397428 : props.center[1]
    ]
    const validZoom = isNaN(props.zoom) || props.zoom < 1 || props.zoom > 20 ? 12 : props.zoom
    
    console.log('地图初始化参数:', { center: validCenter, zoom: validZoom })
    
    // 创建地图实例
    map = new window.TMap.Map(mapContainer.value, {
      center: new window.TMap.LatLng(validCenter[0], validCenter[1]),
      zoom: validZoom,
      baseMap: {  // 设置卫星地图
        type: 'satellite'
      },
      // 禁用地图动画和自动调整
      viewMode: '2D',
      pitch: 0,
      rotation: 0,
      // 禁用地图的自动适应行为
      boundary: null,
      // 设置地图控制选项
      mapStyleId: 'style1'
    })
    
    // 初始化记录的中心点和缩放级别
    lastCenter = [validCenter[0], validCenter[1]]
    lastZoom = validZoom
    
    // 标记地图初始化完成
    isMapInitialized = true
    console.log('地图初始化完成',props.enableMapClick)
    
    // 绑定地图点击事件（初始化时）
    bindMapClickEvent()

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

  // 确保props.drones和props.cabinets是数组
  const drones = Array.isArray(props.drones) ? props.drones : []
  const cabinets = Array.isArray(props.cabinets) ? props.cabinets : []

  console.log('更新地图标记:', {
    drones: drones.length,
    cabinets: cabinets.length
  })

  // 清除现有标记
  clearMarkers()

  // 添加无人机标记
  drones.forEach((drone, index) => {
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
                <defs>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
                  </filter>
                </defs>
                <circle cx="16" cy="16" r="14" fill="#67c23a" stroke="white" stroke-width="2" filter="url(#shadow)"/>
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
                <defs>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
                  </filter>
                </defs>
                <circle cx="16" cy="16" r="14" fill="#409eff" stroke="white" stroke-width="2" filter="url(#shadow)"/>
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
                <defs>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
                  </filter>
                </defs>
                <circle cx="16" cy="16" r="14" fill="#f56c6c" stroke="white" stroke-width="2" filter="url(#shadow)"/>
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
          const droneIndex = geometry.properties.index
        if (Array.isArray(props.drones) && droneIndex < props.drones.length) {
          selectedDrone.value = props.drones[droneIndex]
        }
          droneInfoVisible.value = true
        }
      })

      droneMarkers.push(marker)
    }
  })

  // 添加柜子标记
  cabinets.forEach((cabinet, index) => {
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
                <defs>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
                  </filter>
                </defs>
                <rect x="4" y="4" width="20" height="20" rx="4" fill="#67c23a" stroke="white" stroke-width="2" filter="url(#shadow)"/>
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
                <defs>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
                  </filter>
                </defs>
                <rect x="4" y="4" width="20" height="20" rx="4" fill="#c0c4cc" stroke="white" stroke-width="2" filter="url(#shadow)"/>
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
                <defs>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
                  </filter>
                </defs>
                <rect x="4" y="4" width="20" height="20" rx="4" fill="#f56c6c" stroke="white" stroke-width="2" filter="url(#shadow)"/>
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
          const cabinetIndex = geometry.properties.index
          if (Array.isArray(props.cabinets) && cabinetIndex < props.cabinets.length) {
            selectedCabinet.value = props.cabinets[cabinetIndex]
          }
          cabinetInfoVisible.value = true
        }
      })

      cabinetMarkers.push(marker)
    }
  })

  // 添加航点标记
  if (props.waypoints && props.waypoints.length > 0) {
    props.waypoints.forEach((waypoint, index) => {
      if (waypoint.longitude && waypoint.latitude && waypoint.longitude !== 0 && waypoint.latitude !== 0) {
        const marker = new window.TMap.MultiMarker({
          map: map,
          styles: {
            'waypoint': new window.TMap.MarkerStyle({
              width: 24,
              height: 24,
              anchor: { x: 12, y: 12 },
              src: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
                    </filter>
                  </defs>
                  <circle cx="12" cy="12" r="10" fill="#409eff" stroke="white" stroke-width="2" filter="url(#shadow)"/>
                  <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${waypoint.index + 1}</text>
                </svg>
              `)))
            })
          },
          geometries: [{
            id: `waypoint-${index}`,
            styleId: 'waypoint',
            position: new window.TMap.LatLng(waypoint.latitude, waypoint.longitude),
            properties: {
              title: waypoint.name,
              type: 'waypoint',
              index: index
            }
          }]
        })

        // 添加航点点击事件
        marker.on('click', (evt: any) => {
          const geometry = evt.geometry
          if (geometry.properties.type === 'waypoint') {
            emit('waypoint-click', {
              index: geometry.properties.index,
              waypoint: props.waypoints[geometry.properties.index]
            })
          }
        })

        // 如果启用了航点拖拽功能，添加拖拽事件
        if (props.enableWaypointDrag) {
          marker.on('dragend', (evt: any) => {
            const geometry = evt.geometry
            if (geometry.properties.type === 'waypoint') {
              const position = geometry.position
              emit('waypoint-drag', {
                index: geometry.properties.index,
                lat: position.lat,
                lng: position.lng
              })
            }
          })

          // 设置标记为可拖拽
          marker.setDraggable(true)
        }

        waypointMarkers.push(marker)
      }
    })

    // 添加航线路径
    if (props.showRoutePath && props.waypoints.length > 1) {
      const pathPoints = props.waypoints
        .filter(wp => wp.longitude && wp.latitude && wp.longitude !== 0 && wp.latitude !== 0)
        .map(wp => new window.TMap.LatLng(wp.latitude, wp.longitude))

      if (pathPoints.length > 1) {
        routePath = new window.TMap.MultiPolyline({
          map: map,
          styles: {
            'route-path': new window.TMap.PolylineStyle({
              color: '#409eff',
              width: 3,
              borderColor: '#ffffff',
              borderWidth: 1,
              lineCap: 'round'
            })
          },
          geometries: [{
            id: 'route-path',
            styleId: 'route-path',
            paths: pathPoints
          }]
        })
      }
    }
  }
}

// 无感更新标记点位置和状态
const updateMarkersSmoothly = () => {
  if (!map) return

  // 更新无人机标记
  props.drones.forEach((drone, index) => {
    const existingMarker = droneMarkers.find(marker => 
      marker.geometries && marker.geometries[0] && marker.geometries[0].id === `drone-${index}`
    )
    
    if (existingMarker && drone.longitude && drone.latitude && drone.longitude !== 0 && drone.latitude !== 0) {
      // 更新位置
      existingMarker.setGeometries([{
        id: `drone-${index}`,
        styleId: getDroneMarkerStyle(drone.status),
        position: new window.TMap.LatLng(drone.latitude, drone.longitude),
        properties: {
          title: drone.droneName,
          type: 'drone',
          index: index
        }
      }])
    }
  })

  // 更新柜子标记
  props.cabinets.forEach((cabinet, index) => {
    const existingMarker = cabinetMarkers.find(marker => 
      marker.geometries && marker.geometries[0] && marker.geometries[0].id === `cabinet-${index}`
    )
    
    if (existingMarker && cabinet.longitude && cabinet.latitude && cabinet.longitude !== 0 && cabinet.latitude !== 0) {
      // 更新位置
      existingMarker.setGeometries([{
        id: `cabinet-${index}`,
        styleId: getCabinetMarkerStyle(cabinet.status),
        position: new window.TMap.LatLng(cabinet.latitude, cabinet.longitude),
        properties: {
          title: cabinet.name,
          type: 'cabinet',
          index: index
        }
      }])
    }
  })
}

// 智能更新：只在数据真正变化时才更新
const smartUpdateMarkers = () => {
  if (!map) return

  // 清除之前的定时器
  if (updateTimeout) {
    clearTimeout(updateTimeout)
  }

  // 防抖：延迟100ms执行更新
  updateTimeout = setTimeout(() => {
    // 检查是否有新的无人机或柜子需要添加
    const hasNewDrones = props.drones.length > droneMarkers.length
    const hasNewCabinets = props.cabinets.length > cabinetMarkers.length
    
    // 检查是否有数据被删除
    const hasRemovedDrones = props.drones.length < droneMarkers.length
    const hasRemovedCabinets = props.cabinets.length < cabinetMarkers.length

    // 如果有新增或删除，则完全重新创建标记
    if (hasNewDrones || hasNewCabinets || hasRemovedDrones || hasRemovedCabinets) {
      updateMarkers()
    } else {
      // 否则只更新现有标记的位置和状态
      updateMarkersSmoothly()
    }
  }, 100)
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

// 切换地图类型
const switchMapType = (type: 'vector' | 'satellite') => {
  mapType.value = type
  if (map) {
    if (type === 'satellite') {
      map.setBaseMap({ type: 'satellite' })
    } else {
      map.setBaseMap({ type: 'roadmap' })
    }
  }
}

// 移动地图到指定无人机位置
const moveToDrone = (longitude: number, latitude: number, zoom: number = 15) => {
  if (map && longitude && latitude) {
    map.setCenter(new window.TMap.LatLng(latitude, longitude))
    map.setZoom(zoom)
  }
}

// 清除标记
const clearMarkers = () => {
  droneMarkers.forEach(marker => marker.setMap(null))
  cabinetMarkers.forEach(marker => marker.setMap(null))
  waypointMarkers.forEach(marker => marker.setMap(null))
  if (routePath) {
    routePath.setMap(null)
    routePath = null
  }
  droneMarkers = []
  cabinetMarkers = []
  waypointMarkers = []
}

// 监听数据变化
watch(() => [props.drones, props.cabinets, props.waypoints], () => {
  nextTick(() => {
    if (map) {
      smartUpdateMarkers()
    }
  })
}, { deep: true, flush: 'post' })

// 监听中心点和缩放级别变化
let centerUpdateTimeout: NodeJS.Timeout | null = null
let lastCenter: [number, number] | null = null
let lastZoom: number | null = null
let isMapInitialized = false

watch(() => [props.center, props.zoom], ([newCenter, newZoom]) => {
  // 如果地图还未初始化完成，不执行更新
  if (!isMapInitialized || !map) {
    return
  }
  
  // 检查是否真的发生了变化
  const centerChanged = !lastCenter || lastCenter[0] !== newCenter[0] || lastCenter[1] !== newCenter[1]
  const zoomChanged = lastZoom !== newZoom
  
  if (!centerChanged && !zoomChanged) {
    return
  }
  
  // 防抖处理，避免频繁更新
  if (centerUpdateTimeout) {
    clearTimeout(centerUpdateTimeout)
  }
  
  centerUpdateTimeout = setTimeout(() => {
    nextTick(() => {
      if (map && isMapInitialized) {
        // 只在真正需要时更新地图中心点和缩放级别
        if (centerChanged) {
          map.setCenter(new window.TMap.LatLng(newCenter[0], newCenter[1]))
          lastCenter = [newCenter[0], newCenter[1]]
        }
        if (zoomChanged) {
          map.setZoom(newZoom)
          lastZoom = newZoom
        }
      }
    })
  }, 100) // 100ms防抖延迟
}, { deep: true })

// 监听enableMapClick变化，动态绑定/解绑地图点击事件
watch(() => props.enableMapClick, (newValue) => {
  console.log('enableMapClick变化:', newValue)
  if (isMapInitialized) {
    bindMapClickEvent()
  }
})

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (updateTimeout) {
    clearTimeout(updateTimeout)
  }
  if (centerUpdateTimeout) {
    clearTimeout(centerUpdateTimeout)
  }
  
  // 清理地图点击事件
  if (mapClickHandler && map) {
    map.off('click', mapClickHandler)
    mapClickHandler = null
  }
  
  isMapInitialized = false
  clearMarkers()
  if (map) {
    map.destroy()
  }
})

// 暴露方法给父组件
defineExpose({
  moveToDrone
})

// 声明全局类型
declare global {
  interface Window {
    TMap: {
      Map: any
      LatLng: any
      MultiMarker: any
      MarkerStyle: any
    }
  }
}
</script>

<style lang="scss" scoped>
.drone-map-container {
  position: relative;
  width: 100%;
  height: 100%;
  contain: layout style; /* 优化渲染性能，防止不必要的重排 */
}

.map-wrapper {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border-radius: 8px;
  overflow: hidden;
  transform: translateZ(0); /* 启用硬件加速，稳定渲染 */
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
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.map-type-control {
  .el-button-group {
    .el-button {
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 12px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      
      &:first-child {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }
      &:last-child {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }
      
      &.el-button--primary {
        background: #409eff;
        color: white;
      }
    }
  }
}

.control-panel {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px;
  min-width: 160px;
  
  .control-title {
    font-size: 14px;
    font-weight: bold;
    color: #303133;
    margin-bottom: 8px;
    text-align: center;
  }
  
  .legend-items {
    display: flex;
    flex-direction: column;
    gap: 6px;
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #606266;
      
      .legend-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        
        &.drone-online {
          background: #67c23a;
        }
        
        &.drone-flying {
          background: #409eff;
        }
        
        &.drone-error {
          background: #f56c6c;
        }
        
        &.cabinet-online {
          background: #67c23a;
        }
        
        &.cabinet-offline {
          background: #c0c4cc;
        }
        
        &.cabinet-error {
          background: #f56c6c;
        }
      }
    }
  }
}

.drone-info, .cabinet-info {
  .el-descriptions {
    margin-top: 16px;
  }
}
</style>