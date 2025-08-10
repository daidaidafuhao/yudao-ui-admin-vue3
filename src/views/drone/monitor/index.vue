<template>
  <div class="drone-monitor">
    <!-- 地图背景 -->
    <div class="map-background">
      <DroneMap 
        ref="droneMapRef"
        :drones="droneList" 
        :cabinets="[]"
        :show-controls="showMapControls"
      />
    </div>

    <!-- 左侧无人机列表容器 -->
    <div class="drone-list-container">
      <div class="list-header">
        <h3>无人机列表</h3>
        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索无人机名称"
            clearable
            size="small"
            prefix-icon="Search"
          />
        </div>
      </div>
      
      <div class="drone-list">
        <div
          v-for="drone in filteredDrones"
          :key="drone.droneCode"
          class="drone-item"
          :class="{ active: selectedDrone?.droneCode === drone.droneCode }"
          @click="selectDrone(drone)"
        >
          <div class="drone-info">
            <div class="drone-name">{{ drone.droneName }}</div>
            <div class="drone-code">{{ drone.droneCode }}</div>
            <div class="drone-status">
              <el-tag :type="getStatusType(drone.status)" size="small">
                {{ getStatusText(drone.status) }}
              </el-tag>
            </div>
          </div>
          <div class="drone-battery">
            <el-progress
              :percentage="drone.batteryLevel"
              :color="getBatteryColor(drone.batteryLevel)"
              :stroke-width="4"
              :show-text="false"
            />
            <span class="battery-text">{{ Math.floor(drone.batteryLevel) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧详细信息卡片 -->
    <div v-if="selectedDrone" class="detail-card">
      <div class="card-header">
        <h3>{{ selectedDrone.droneName }}</h3>
        <el-button 
          type="primary" 
          size="small" 
          @click="locateDrone(selectedDrone)"
        >
          定位无人机
        </el-button>
      </div>

      <!-- 航向角仪表盘和高度速度信息 -->
      <div class="metrics-row">
        <!-- 高度信息 -->
        <div class="metric-item">
          <div class="metric-label">相对高度</div>
          <div class="metric-value">{{ selectedDrone.altitude.toFixed(2) }}m</div>
          <div class="metric-bar">
            <div 
              class="metric-indicator altitude"
              :style="{ bottom: `${Math.max(0, (selectedDrone.altitude + 20) / 140 * 100)}%` }"
            ></div>
          </div>
          <div class="metric-range">-20m ~ 120m</div>
        </div>

        <!-- 航向角仪表盘 -->
        <div class="compass-section">
          <HeadingGauge 
            :heading="selectedDrone.heading"
            :size="150"
          />
        </div>

        <!-- 速度信息 -->
        <div class="metric-item">
          <div class="metric-label">水平速度</div>
          <div class="metric-value">{{ selectedDrone.speed.toFixed(2) }}m/s</div>
          <div class="metric-bar">
            <div 
              class="metric-indicator speed"
              :style="{ bottom: `${Math.max(0, (selectedDrone.speed + 20) / 40 * 100)}%` }"
            ></div>
          </div>
          <div class="metric-range">-20m/s ~ 20m/s</div>
        </div>
      </div>

      <!-- 其他详细信息 -->
      <div class="info-section">
        <div class="info-row">
          <span class="info-label">无人机编号:</span>
          <span class="info-value">{{ selectedDrone.droneCode }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">状态:</span>
          <el-tag :type="getStatusType(selectedDrone.status)" size="small">
            {{ getStatusText(selectedDrone.status) }}
          </el-tag>
        </div>
        <div class="info-row">
          <span class="info-label">任务状态:</span>
          <el-tag :type="getTaskStatusType(selectedDrone.currentMissionId)" size="small">
            {{ getTaskStatusText(selectedDrone.currentMissionId) }}
          </el-tag>
        </div>
        <div class="info-row">
          <span class="info-label">当前位置:</span>
          <span class="info-value">{{ selectedDrone.longitude?.toFixed(6) }}, {{ selectedDrone.latitude?.toFixed(6) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">当前任务:</span>
          <span class="info-value">{{ selectedDrone.currentMissionId || '无' }}</span>
        </div>
      </div>

      <!-- 控制按钮 -->
      <div class="control-section">
        <div class="control-row">
          <el-button type="primary" size="small" @click="executeMission(selectedDrone)">
            执行任务
          </el-button>
          <el-button type="warning" size="small" @click="returnMission(selectedDrone)">
            返航任务
          </el-button>
        </div>
        <div class="control-row">
          <el-button type="info" size="small" @click="returnHome(selectedDrone)">
            返航
          </el-button>
          <el-button type="success" size="small" @click="land(selectedDrone)">
            降落
          </el-button>
        </div>
        <div class="control-row single-button">
          <el-button type="danger" size="small" @click="emergencyStop(selectedDrone)">
            紧急停止
          </el-button>
        </div>
      </div>
    </div>

    <!-- 无选中无人机时的提示 -->
    <div v-else class="no-selection">
      <el-empty description="请选择左侧的无人机查看详细信息" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import DroneMap from '@/components/DroneMap/index.vue'
import HeadingGauge from '@/components/HeadingGauge/index.vue'
import type { dronesVO } from '@/api/drone/droneComm'

defineOptions({ name: 'DroneMonitor' })

// 搜索关键词
const searchKeyword = ref('')

// 无人机列表
const droneList = ref<dronesVO[]>([
  {
    droneCode: 'DR-001',
    droneName: '人人航空1号机',
    model: 'DJI-M300',
    serialNumber: 'SN001',
    manufacturer: 'DJI',
    status: 1, // 飞行中
    batteryLevel: 85,
    flightTime: 120,
    maxPayload: 2.7,
    maxFlightTime: 55,
    longitude: 116.307503,
    latitude: 39.984104,
    altitude: 120,
    speed: 15,
    heading: 45,
    homeLongitude: 116.307503,
    homeLatitude: 39.984104,
    homeAltitude: 0,
    lastFlightTime: new Date(),
    lastLandingTime: new Date(),
    lastMaintenanceTime: new Date(),
    nextMaintenanceTime: new Date(),
    currentMissionId: 'T-20241201-001',
    currentOrderId: 1,
    currentOrderNo: 'T-20241201-001',
    sourceCabinetCode: 'CAB001',
    targetCabinetCode: 'CAB002',
    operator: '张三',
    errorMessage: '',
    lastErrorTime: new Date(),
    remark: '',
    deptId: 1
  },
  {
    droneCode: 'DR-002',
    droneName: '人人航空2号机',
    model: 'DJI-M300',
    serialNumber: 'SN002',
    manufacturer: 'DJI',
    status: 1, // 飞行中
    batteryLevel: 65,
    flightTime: 180,
    maxPayload: 2.7,
    maxFlightTime: 55,
    longitude: 116.317503,
    latitude: 39.994104,
    altitude: 150,
    speed: 18,
    heading: 90,
    homeLongitude: 116.317503,
    homeLatitude: 39.994104,
    homeAltitude: 0,
    lastFlightTime: new Date(),
    lastLandingTime: new Date(),
    lastMaintenanceTime: new Date(),
    nextMaintenanceTime: new Date(),
    currentMissionId: 'T-20241201-002',
    currentOrderId: 2,
    currentOrderNo: 'T-20241201-002',
    sourceCabinetCode: 'CAB002',
    targetCabinetCode: 'CAB003',
    operator: '李四',
    errorMessage: '',
    lastErrorTime: new Date(),
    remark: '',
    deptId: 1
  },
  {
    droneCode: 'DR-003',
    droneName: '人人航空3号机',
    model: 'DJI-M300',
    serialNumber: 'SN003',
    manufacturer: 'DJI',
    status: 0, // 待机
    batteryLevel: 95,
    flightTime: 90,
    maxPayload: 2.7,
    maxFlightTime: 55,
    longitude: 116.297503,
    latitude: 39.974104,
    altitude: 0,
    speed: 0,
    heading: 0,
    homeLongitude: 116.297503,
    homeLatitude: 39.974104,
    homeAltitude: 0,
    lastFlightTime: new Date(),
    lastLandingTime: new Date(),
    lastMaintenanceTime: new Date(),
    nextMaintenanceTime: new Date(),
    currentMissionId: '',
    currentOrderId: 0,
    currentOrderNo: '',
    sourceCabinetCode: '',
    targetCabinetCode: '',
    operator: '',
    errorMessage: '',
    lastErrorTime: new Date(),
    remark: '',
    deptId: 1
  },
  {
    droneCode: 'DR-004',
    droneName: '人人航空4号机',
    model: 'DJI-M300',
    serialNumber: 'SN004',
    manufacturer: 'DJI',
    status: 3, // 充电中
    batteryLevel: 100,
    flightTime: 150,
    maxPayload: 2.7,
    maxFlightTime: 55,
    longitude: 116.327503,
    latitude: 39.964104,
    altitude: 0,
    speed: 0,
    heading: 0,
    homeLongitude: 116.327503,
    homeLatitude: 39.964104,
    homeAltitude: 0,
    lastFlightTime: new Date(),
    lastLandingTime: new Date(),
    lastMaintenanceTime: new Date(),
    nextMaintenanceTime: new Date(),
    currentMissionId: '',
    currentOrderId: 0,
    currentOrderNo: '',
    sourceCabinetCode: '',
    targetCabinetCode: '',
    operator: '',
    errorMessage: '',
    lastErrorTime: new Date(),
    remark: '',
    deptId: 1
  }
])

// 选中的无人机
const selectedDrone = ref<dronesVO | null>(null)

// 地图组件引用
const droneMapRef = ref()

// 控制开关
const showMapControls = ref(false)

// 过滤后的无人机列表
const filteredDrones = computed(() => {
  if (!searchKeyword.value) return droneList.value
  return droneList.value.filter(drone => 
    drone.droneName.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    drone.droneCode.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 状态映射
const getStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
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

const getStatusType = (status: number): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  const typeMap: Record<number, 'success' | 'warning' | 'info' | 'primary' | 'danger'> = {
    0: 'success',
    1: 'warning',
    2: 'info',
    3: 'info',
    4: 'warning',
    5: 'danger',
    6: 'info'
  }
  return typeMap[status] || 'info'
}

const getTaskStatusText = (status: string) => {
  if (!status) return '无任务'
  return '执行中'
}

const getTaskStatusType = (status: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  if (!status) return 'info'
  return 'warning'
}

const getBatteryColor = (level: number) => {
  if (level > 60) return '#67c23a'
  if (level > 30) return '#e6a23c'
  return '#f56c6c'
}

// 选择无人机
const selectDrone = (drone: dronesVO) => {
  selectedDrone.value = drone
}

// 无人机点击事件
const handleDroneClick = (drone: dronesVO) => {
  selectDrone(drone)
}

// 定位无人机
const locateDrone = (drone: dronesVO) => {
  if (drone.longitude && drone.latitude) {
    // 调用地图组件的定位方法
    droneMapRef.value?.moveToDrone(drone.longitude, drone.latitude)
    ElMessage.success(`正在定位无人机 ${drone.droneName}`)
  } else {
    ElMessage.warning('该无人机暂无位置信息')
  }
}

// 控制操作
const executeMission = async (drone: dronesVO) => {
  try {
    await ElMessageBox.confirm(`确定要执行无人机 ${drone.droneName} 的任务吗？`, '确认操作')
    ElMessage.success('任务执行成功')
  } catch {
    // 用户取消
  }
}

const returnMission = async (drone: dronesVO) => {
  try {
    await ElMessageBox.confirm(`确定要返航无人机 ${drone.droneName} 的任务吗？`, '确认操作')
    ElMessage.success('返航任务成功')
  } catch {
    // 用户取消
  }
}

const returnHome = async (drone: dronesVO) => {
  try {
    await ElMessageBox.confirm(`确定要返航无人机 ${drone.droneName} 吗？`, '确认操作')
    ElMessage.success('返航成功')
  } catch {
    // 用户取消
  }
}

const land = async (drone: dronesVO) => {
  try {
    await ElMessageBox.confirm(`确定要降落无人机 ${drone.droneName} 吗？`, '确认操作')
    ElMessage.success('降落成功')
  } catch {
    // 用户取消
  }
}

const emergencyStop = async (drone: dronesVO) => {
  try {
    await ElMessageBox.confirm(`确定要紧急停止无人机 ${drone.droneName} 吗？此操作不可撤销！`, '紧急停止', {
      confirmButtonText: '确定停止',
      confirmButtonClass: 'el-button--danger',
      type: 'warning'
    })
    ElMessage.success('紧急停止成功')
  } catch {
    // 用户取消
  }
}

// 模拟实时数据更新
let updateTimer: NodeJS.Timeout | null = null

onMounted(() => {
  // 自动选择第一个无人机
  if (droneList.value.length > 0) {
    selectedDrone.value = droneList.value[0]
  }

  // 模拟实时数据更新
  updateTimer = setInterval(() => {
    droneList.value.forEach(drone => {
      if (drone.status === 1) { // 飞行中
        // 随机更新飞行数据，生成更合理的数值
        drone.altitude += (Math.random() - 0.5) * 2
        drone.speed += (Math.random() - 0.5) * 1
        drone.heading += (Math.random() - 0.5) * 5
        
        // 让飞行中的无人机在合理范围内移动
        const moveRange = 0.001 // 移动范围
        drone.longitude += (Math.random() - 0.5) * moveRange
        drone.latitude += (Math.random() - 0.5) * moveRange
        
        // 限制范围
        drone.altitude = Math.max(-20, Math.min(120, drone.altitude))
        drone.speed = Math.max(-20, Math.min(20, drone.speed))
        drone.heading = (drone.heading + 360) % 360
        
        // 更新电池电量，保持为整数
        drone.batteryLevel = Math.max(0, Math.floor(drone.batteryLevel - 0.1))
      }
    })
  }, 1000)
})

onUnmounted(() => {
  if (updateTimer) {
    clearInterval(updateTimer)
  }
})
</script>

<style lang="scss" scoped>
.drone-monitor {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.map-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.drone-list-container {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 320px;
  height: calc(100vh - 40px);
  background: rgba(0, 123, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 123, 255, 0.3);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 123, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  z-index: 10;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .list-header {
    padding: 20px 20px 16px;
    border-bottom: 1px solid rgba(0, 123, 255, 0.2);

    h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
      color: #ffffff;
      line-height: 1.2;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .search-box {
      .el-input {
        .el-input__wrapper {
          background: rgba(0, 123, 255, 0.1);
          border: 1px solid rgba(0, 123, 255, 0.4);
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
          
          &:focus-within {
            border-color: rgba(0, 123, 255, 0.8);
            box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
          }
        }
        
        .el-input__inner {
          color: #ffffff;
          
          &::placeholder {
            color: rgba(255, 255, 255, 0.6);
          }
        }
      }
    }

    .control-toggle {
      margin-top: 16px;
      text-align: center;
      padding: 8px 0;
      border-top: 1px solid rgba(0, 123, 255, 0.2);
      
      .el-switch {
        .el-switch__label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }
  }

  .drone-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;

    .drone-item {
      padding: 16px;
      margin-bottom: 12px;
      background: rgba(0, 123, 255, 0.08);
      border: 1px solid rgba(0, 123, 255, 0.2);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);

      &:hover {
        background: rgba(0, 123, 255, 0.15);
        transform: translateY(-2px);
        box-shadow: 
          0 8px 24px rgba(0, 123, 255, 0.3),
          0 0 0 1px rgba(0, 123, 255, 0.4);
      }

      &.active {
        background: rgba(0, 123, 255, 0.2);
        border-color: rgba(0, 123, 255, 0.8);
        box-shadow: 
          0 0 0 2px rgba(0, 123, 255, 0.3),
          0 8px 24px rgba(0, 123, 255, 0.4);
      }

      .drone-info {
        margin-bottom: 12px;

        .drone-name {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 6px;
          line-height: 1.2;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .drone-code {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 10px;
          line-height: 1.2;
        }

        .drone-status {
          .el-tag {
            font-size: 11px;
            height: 20px;
            line-height: 18px;
            background: rgba(0, 123, 255, 0.2);
            border: 1px solid rgba(0, 123, 255, 0.4);
            color: #ffffff;
          }
        }
      }

      .drone-battery {
        display: flex;
        align-items: center;
        gap: 12px;

        .el-progress {
          flex: 1;
          
          .el-progress__bar {
            height: 6px;
            background: rgba(0, 123, 255, 0.2);
            
            .el-progress__inner {
              background: linear-gradient(90deg, #00d4ff, #0099ff);
            }
          }
        }

        .battery-text {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
          min-width: 35px;
          text-align: right;
          font-weight: 500;
        }
      }
    }
  }
}

.detail-card {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 400px;
  height: calc(100vh - 40px);
  background: rgba(0, 123, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 123, 255, 0.3);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 123, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  z-index: 10;
  padding: 24px;
  overflow-y: auto;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(0, 123, 255, 0.2);

    h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #ffffff;
      line-height: 1.2;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
  }

  .metrics-row {
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin-bottom: 32px;

    .metric-item {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      max-width: 120px;

      .metric-label {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 8px;
        width: 100%;
      }

      .metric-value {
        font-size: 20px;
        font-weight: 600;
        color: #ffffff;
        margin-bottom: 12px;
        width: 100%;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      .metric-bar {
        position: relative;
        width: 20px;
        height: 120px;
        background: rgba(0, 123, 255, 0.2);
        border-radius: 10px;
        margin: 0 auto 8px;
        overflow: hidden;
        border: 1px solid rgba(0, 123, 255, 0.3);

        .metric-indicator {
          position: absolute;
          left: 0;
          width: 100%;
          height: 8px;
          border-radius: 4px;
          transition: bottom 0.3s ease;

          &.altitude {
            background: linear-gradient(90deg, #00d4ff, #0099ff);
            box-shadow: 0 0 8px rgba(0, 212, 255, 0.6);
          }

          &.speed {
            background: linear-gradient(90deg, #ffd700, #ffa500);
            box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
          }
        }
      }

      .metric-range {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.6);
        width: 100%;
      }
    }

    .compass-section {
      text-align: center;
      flex-shrink: 0;
    }
  }

  .info-section {
    margin-bottom: 32px;

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid rgba(0, 123, 255, 0.2);

      &:last-child {
        border-bottom: none;
      }

      .info-label {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
        flex-shrink: 0;
        margin-right: 16px;
      }

      .info-value {
        font-size: 14px;
        color: #ffffff;
        font-weight: 500;
        text-align: right;
        flex: 1;
        word-break: break-all;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }
    }
  }

  .control-section {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .control-row {
      display: flex;
      gap: 12px;

      &.single-button {
        justify-content: center;
      }

      .el-button {
        flex: 1;
        height: 36px;
        font-size: 14px;
        background: rgba(0, 123, 255, 0.2);
        border: 1px solid rgba(0, 123, 255, 0.4);
        color: #ffffff;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;

        &:hover {
          background: rgba(0, 123, 255, 0.3);
          border-color: rgba(0, 123, 255, 0.6);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }

        &.el-button--primary {
          background: rgba(0, 123, 255, 0.4);
          border-color: rgba(0, 123, 255, 0.6);
        }

        &.el-button--warning {
          background: rgba(255, 193, 7, 0.4);
          border-color: rgba(255, 193, 7, 0.6);
        }

        &.el-button--info {
          background: rgba(23, 162, 184, 0.4);
          border-color: rgba(23, 162, 184, 0.6);
        }

        &.el-button--success {
          background: rgba(40, 167, 69, 0.4);
          border-color: rgba(40, 167, 69, 0.6);
        }

        &.el-button--danger {
          background: rgba(220, 53, 69, 0.4);
          border-color: rgba(220, 53, 69, 0.6);
        }
      }
    }
  }
}

.no-selection {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  background: rgba(0, 123, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 123, 255, 0.3);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 
    0 8px 32px rgba(0, 123, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

// 滚动条样式
.drone-list::-webkit-scrollbar,
.detail-card::-webkit-scrollbar {
  width: 6px;
}

.drone-list::-webkit-scrollbar-track,
.detail-card::-webkit-scrollbar-track {
  background: rgba(0, 123, 255, 0.1);
  border-radius: 3px;
}

.drone-list::-webkit-scrollbar-thumb,
.detail-card::-webkit-scrollbar-thumb {
  background: rgba(0, 123, 255, 0.4);
  border-radius: 3px;

  &:hover {
    background: rgba(0, 123, 255, 0.6);
  }
}
</style> 