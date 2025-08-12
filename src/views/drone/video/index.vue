<template>
  <div class="drone-video">
    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <el-icon class="mr-8px"><VideoPlay /></el-icon>
            <span class="text-18px font-bold">视频墙</span>
          </div>
          <div class="flex items-center space-x-8px">
            <el-button type="primary" @click="saveLayout">保存布局</el-button>
            <el-button @click="resetLayout">重置布局</el-button>
            <el-button @click="fullscreen">全屏</el-button>
          </div>
        </div>
      </template>
      
      <div class="video-content">
        <div class="main-layout">
          <!-- 左侧设备选择区域 -->
          <div class="left-panel">
            <el-card shadow="never" class="device-panel">
              <template #header>
                <span class="text-16px font-bold">设备选择</span>
              </template>
              
              <!-- 搜索框 -->
              <div class="search-box">
                <el-input
                  v-model="searchKeyword"
                  placeholder="搜索设备名称"
                  clearable
                  @input="handleSearch"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>
              
              <!-- 设备类型标签页 -->
              <el-tabs v-model="activeTab" class="device-tabs">
                <el-tab-pane label="无人机" name="drone">
                  <div class="device-list">
                    <div 
                      v-for="drone in filteredDroneList" 
                      :key="drone.id"
                      class="device-item"
                      :class="{ 'selected': selectedDevices.includes(drone.id) }"
                      @click="toggleDevice(drone.id, 'drone')"
                    >
                      <div class="device-info">
                        <div class="device-name">{{ drone.name }}</div>
                        <div class="device-status">
                          <el-tag :type="drone.status === 'online' ? 'success' : 'danger'" size="small">
                            {{ drone.status === 'online' ? '在线' : '离线' }}
                          </el-tag>
                        </div>
                      </div>
                      <div class="device-actions">
                        <el-icon v-if="selectedDevices.includes(drone.id)" class="selected-icon"><Check /></el-icon>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>
                
                <el-tab-pane label="起降点" name="landing">
                  <div class="device-list">
                    <div 
                      v-for="point in filteredLandingPointList" 
                      :key="point.id"
                      class="device-item"
                      :class="{ 'selected': selectedDevices.includes(point.id) }"
                      @click="toggleDevice(point.id, 'landing')"
                    >
                      <div class="device-info">
                        <div class="device-name">{{ point.name }}</div>
                        <div class="device-status">
                          <el-tag :type="point.status === 'online' ? 'success' : 'danger'" size="small">
                            {{ point.status === 'online' ? '在线' : '离线' }}
                          </el-tag>
                        </div>
                      </div>
                      <div class="device-actions">
                        <el-icon v-if="selectedDevices.includes(point.id)" class="selected-icon"><Check /></el-icon>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
              
              <!-- 布局选择 -->
              <div class="layout-section">
                  <div class="section-title">布局设置</div>
                  <el-radio-group v-model="currentLayout" @change="changeLayout" size="small">
                  <el-radio-button label="1x1">1x1</el-radio-button>
                  <el-radio-button label="2x2">2x2</el-radio-button>
                  <el-radio-button label="3x3">3x3</el-radio-button>
                  <el-radio-button label="4x3">4x3</el-radio-button>
                </el-radio-group>
              </div>
            </el-card>
          </div>
          
          <!-- 右侧视频墙区域 -->
          <div class="right-panel">
            <el-card shadow="never" class="video-panel">
              <template #header>
                <span class="text-16px font-bold">视频监控</span>
              </template>
              
              <div class="video-wall" :class="`layout-${currentLayout}`">
                <div 
                  v-for="(video, index) in videoList" 
                  :key="index"
                  class="video-item"
                  :class="{ 'has-video': video.deviceId }"
                >
                  <div v-if="video.deviceId" class="video-container">
                    <div class="video-header">
                      <span class="device-name">{{ getDeviceName(video.deviceId) }}</span>
                      <div class="video-controls">
                        <el-button size="small" @click="toggleFullscreen(index)">
                          <el-icon><FullScreen /></el-icon>
                        </el-button>
                        <el-button size="small" @click="closeVideo(index)">
                          <el-icon><Close /></el-icon>
                        </el-button>
                      </div>
                    </div>
                    <div class="video-content">
                      <!-- 实际视频播放器 -->
                      <video 
                        v-if="video.videoUrl" 
                        class="video-player" 
                        :src="video.videoUrl" 
                        autoplay 
                        muted 
                        loop
                      ></video>
                      
                      <!-- 视频占位符 -->
                      <div class="video-placeholder">
                        <el-icon class="video-icon"><VideoPlay /></el-icon>
                        <div class="video-text">视频流加载中...</div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="video-placeholder empty">
                    <el-icon class="video-icon"><VideoCamera /></el-icon>
                    <div class="video-text">点击左侧设备添加视频</div>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, VideoCamera, FullScreen, Close, Search, Check } from '@element-plus/icons-vue'

defineOptions({ name: 'DroneVideo' })

// 设备列表
const droneList = ref([
  { id: 1, name: '飞行器001', status: 'online' },
  { id: 2, name: '飞行器002', status: 'online' },
  { id: 3, name: '飞行器003', status: 'offline' },
  { id: 4, name: '飞行器004', status: 'online' }
])

const landingPointList = ref([
  { id: 101, name: '起降点A', status: 'online' },
  { id: 102, name: '起降点B', status: 'online' },
  { id: 103, name: '起降点C', status: 'offline' }
])

// 搜索和标签页
const searchKeyword = ref('')
const activeTab = ref('drone')

// 选中的设备（统一管理）
const selectedDevices = ref<number[]>([])
const deviceTypes = ref<Record<number, string>>({})

// 布局设置
const currentLayout = ref('2x2')

// 布局选项
const layoutOptions = [
  { label: '1×1', value: '1x1' },
  { label: '2×2', value: '2x2' },
  { label: '3×3', value: '3x3' },
  { label: '4×3', value: '4x3' }
]

// 视频列表
const videoList = ref<any[]>([])

// 过滤后的设备列表
const filteredDroneList = computed(() => {
  if (!searchKeyword.value) return droneList.value
  return droneList.value.filter(drone => 
    drone.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

const filteredLandingPointList = computed(() => {
  if (!searchKeyword.value) return landingPointList.value
  return landingPointList.value.filter(point => 
    point.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑已通过计算属性实现
}

// 切换设备选择
const toggleDevice = (deviceId: number, deviceType: string) => {
  const index = selectedDevices.value.indexOf(deviceId)
  if (index > -1) {
    // 取消选择
    selectedDevices.value.splice(index, 1)
    delete deviceTypes.value[deviceId]
    // 从视频列表中移除
    const videoIndex = videoList.value.findIndex(v => v.deviceId === deviceId)
    if (videoIndex > -1) {
      videoList.value[videoIndex].deviceId = null
      videoList.value[videoIndex].deviceType = null
      videoList.value[videoIndex].videoUrl = null
    }
  } else {
    // 选择设备
    const emptyIndex = videoList.value.findIndex(v => !v.deviceId)
    
    if (emptyIndex > -1) {
      // 有空位，直接添加
      selectedDevices.value.push(deviceId)
      deviceTypes.value[deviceId] = deviceType
      videoList.value[emptyIndex].deviceId = deviceId
      videoList.value[emptyIndex].deviceType = deviceType
      videoList.value[emptyIndex].videoUrl = `https://sample-videos.com/zip/10/mp4/SampleVideo_${deviceId}.mp4`
    } else {
      // 视频墙满了，顶替第一个
      const firstDeviceId = videoList.value[0].deviceId
      if (firstDeviceId) {
        // 移除第一个设备的选中状态
        const firstIndex = selectedDevices.value.indexOf(firstDeviceId)
        if (firstIndex > -1) {
          selectedDevices.value.splice(firstIndex, 1)
          delete deviceTypes.value[firstDeviceId]
        }
      }
      
      // 添加新设备到第一个位置
      selectedDevices.value.push(deviceId)
      deviceTypes.value[deviceId] = deviceType
      videoList.value[0].deviceId = deviceId
      videoList.value[0].deviceType = deviceType
      videoList.value[0].videoUrl = `https://sample-videos.com/zip/10/mp4/SampleVideo_${deviceId}.mp4`
    }
  }
}

// 初始化视频列表
const initVideoList = () => {
  const layoutMap = {
    '1x1': 1,
    '2x2': 4,
    '3x3': 9,
    '4x3': 12
  }
  
  const count = layoutMap[currentLayout.value] || 4
  videoList.value = Array(count).fill(null).map(() => ({ 
    deviceId: null, 
    deviceType: null,
    videoUrl: null // 添加视频URL字段
  }))
}

// 获取设备名称
const getDeviceName = (deviceId: number) => {
  const drone = droneList.value.find(d => d.id === deviceId)
  if (drone) return drone.name
  
  const point = landingPointList.value.find(p => p.id === deviceId)
  if (point) return point.name
  
  return '未知设备'
}

// 监听设备选择变化（已在toggleDevice中处理，无需额外监听器）

// 切换布局
const changeLayout = () => {
  const oldVideoList = [...videoList.value]
  initVideoList()
  
  // 如果新布局容量小于当前选中设备数量，需要移除多余的设备
  const newCapacity = videoList.value.length
  if (selectedDevices.value.length > newCapacity) {
    const removedDevices = selectedDevices.value.slice(newCapacity)
    removedDevices.forEach(deviceId => {
      delete deviceTypes.value[deviceId]
    })
    selectedDevices.value = selectedDevices.value.slice(0, newCapacity)
  }
  
  // 重新分配已选择的设备到新布局
  selectedDevices.value.forEach((deviceId, index) => {
    if (index < videoList.value.length) {
      videoList.value[index].deviceId = deviceId
      videoList.value[index].deviceType = deviceTypes.value[deviceId]
      videoList.value[index].videoUrl = `https://sample-videos.com/zip/10/mp4/SampleVideo_${deviceId}.mp4`
    }
  })
}

// 切换全屏
const toggleFullscreen = (index: number) => {
  console.log('切换全屏:', index)
  ElMessage.success('全屏功能开发中...')
}

// 关闭视频
const closeVideo = (index: number) => {
  const deviceId = videoList.value[index].deviceId
  
  if (deviceId) {
    // 从选中列表中移除
    const deviceIndex = selectedDevices.value.indexOf(deviceId)
    if (deviceIndex > -1) {
      selectedDevices.value.splice(deviceIndex, 1)
      delete deviceTypes.value[deviceId]
    }
  }
  
  // 清空视频位置
  videoList.value[index].deviceId = null
  videoList.value[index].deviceType = null
  videoList.value[index].videoUrl = null
}

// 保存布局
const saveLayout = () => {
  const layout = {
    layout: currentLayout.value,
    selectedDevices: selectedDevices.value,
    deviceTypes: deviceTypes.value,
    videoList: videoList.value
  }
  
  localStorage.setItem('drone-video-layout', JSON.stringify(layout))
  ElMessage.success('布局保存成功')
}

// 重置布局
const resetLayout = () => {
  selectedDevices.value = []
  deviceTypes.value = {}
  initVideoList()
  ElMessage.success('布局已重置')
}

// 全屏
const fullscreen = () => {
  console.log('进入全屏模式')
  ElMessage.success('全屏功能开发中...')
}

// 初始化
initVideoList()
</script>

<style lang="scss" scoped>
.drone-video {
  position: relative;
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #0a1a2e 0%, #16213e 50%, #0f3460 100%);
  overflow: hidden;

  // 添加背景纹理
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: 
      radial-gradient(circle at 20% 50%, rgba(0, 123, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(0, 212, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(0, 123, 255, 0.08) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  :deep(.el-card) {
    background: transparent;
    border: none;
    box-shadow: none;
    
    .el-card__header {
      background: rgba(0, 123, 255, 0.1);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(0, 123, 255, 0.3);
      border-radius: 16px 16px 0 0;
      padding: 20px 24px;
      
      .flex {
        .text-18px {
          color: #ffffff;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .el-button {
          background: rgba(0, 123, 255, 0.2);
          border: 1px solid rgba(0, 123, 255, 0.4);
          color: #ffffff;
          backdrop-filter: blur(10px);
          
          &:hover {
            background: rgba(0, 123, 255, 0.3);
            border-color: rgba(0, 123, 255, 0.6);
            box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
          }
          
          &.el-button--primary {
            background: rgba(0, 123, 255, 0.4);
            border-color: rgba(0, 123, 255, 0.6);
          }
        }
      }
    }
    
    .el-card__body {
      background: rgba(0, 123, 255, 0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(0, 123, 255, 0.2);
      border-top: none;
      border-radius: 0 0 16px 16px;
      padding: 0;
    }
  }

  .video-content {
    padding: 0;
    position: relative;
    z-index: 1;
  }

  .main-layout {
    display: flex;
    gap: 20px;
    height: calc(100vh - 120px);
    max-height: calc(100vh - 120px); // 限制最大高度
    min-height: 600px;
    padding: 20px;
    overflow: hidden; // 防止整体布局溢出
  }

  .left-panel {
    width: 350px;
    flex-shrink: 0;
    
    .device-panel {
      height: 100%;
      background: rgba(0, 123, 255, 0.1);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(0, 123, 255, 0.3);
      border-radius: 16px;
      box-shadow: 
        0 8px 32px rgba(0, 123, 255, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      
      :deep(.el-card__header) {
        background: rgba(0, 123, 255, 0.15);
        border-bottom: 1px solid rgba(0, 123, 255, 0.2);
        
        .text-16px {
          color: #ffffff;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      }
      
      :deep(.el-card__body) {
        height: calc(100% - 60px);
        display: flex;
        flex-direction: column;
        background: transparent;
        border: none;
        padding: 20px;
      }
    }
  }

  .right-panel {
    flex: 1;
    min-height: 0; // 允许flex子项收缩
    
    .video-panel {
      height: 100%;
      max-height: 100%; // 限制面板高度
      background: rgba(0, 123, 255, 0.1);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(0, 123, 255, 0.3);
      border-radius: 16px;
      box-shadow: 
        0 8px 32px rgba(0, 123, 255, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      
      :deep(.el-card__header) {
        background: rgba(0, 123, 255, 0.15);
        border-bottom: 1px solid rgba(0, 123, 255, 0.2);
        
        .text-16px {
          color: #ffffff;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      }
      
      :deep(.el-card__body) {
        height: calc(100% - 60px);
        max-height: calc(100% - 60px);
        background: transparent;
        border: none;
        padding: 20px;
        overflow: hidden; // 防止内容溢出
      }
    }
  }

  .search-box {
    margin-bottom: 16px;
    
    .el-input {
      :deep(.el-input__wrapper) {
        background: rgba(0, 123, 255, 0.1);
        border: 1px solid rgba(0, 123, 255, 0.4);
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
        
        &:focus-within {
          border-color: rgba(0, 123, 255, 0.8);
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
        }
      }
      
      :deep(.el-input__inner) {
        color: #ffffff;
        
        &::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }
      }
    }
  }

  .device-tabs {
    flex: 1;
    display: flex;
    flex-direction: column;
    
    :deep(.el-tabs__header) {
      margin-bottom: 16px;
      
      .el-tabs__nav-wrap {
        &::after {
          background: rgba(0, 123, 255, 0.2);
        }
      }
      
      .el-tabs__item {
        color: rgba(255, 255, 255, 0.7);
        
        &.is-active {
          color: #ffffff;
        }
        
        &:hover {
          color: rgba(255, 255, 255, 0.9);
        }
      }
      
      .el-tabs__active-bar {
        background: rgba(0, 123, 255, 0.8);
      }
    }
    
    :deep(.el-tabs__content) {
      flex: 1;
      overflow: hidden;
    }
    
    :deep(.el-tab-pane) {
      height: 100%;
      overflow-y: auto;
    }
  }

  .device-list {
    .device-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
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
      
      &.selected {
        background: rgba(0, 123, 255, 0.2);
        border-color: rgba(0, 123, 255, 0.8);
        box-shadow: 
          0 0 0 2px rgba(0, 123, 255, 0.3),
          0 8px 24px rgba(0, 123, 255, 0.4);
      }
      
      .device-info {
        flex: 1;
        
        .device-name {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 6px;
          line-height: 1.2;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .device-status {
          :deep(.el-tag) {
            font-size: 11px;
            height: 20px;
            line-height: 18px;
            background: rgba(0, 123, 255, 0.2);
            border: 1px solid rgba(0, 123, 255, 0.4);
            color: #ffffff;
            
            &.el-tag--success {
              background: rgba(40, 167, 69, 0.2);
              border-color: rgba(40, 167, 69, 0.4);
            }
            
            &.el-tag--danger {
              background: rgba(220, 53, 69, 0.2);
              border-color: rgba(220, 53, 69, 0.4);
            }
          }
        }
      }
      
      .device-actions {
        .selected-icon {
          color: rgba(0, 212, 255, 0.9);
          font-size: 18px;
          filter: drop-shadow(0 0 4px rgba(0, 212, 255, 0.6));
        }
      }
    }
  }

  .layout-section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(0, 123, 255, 0.2);
    
    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 12px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    .el-radio-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      :deep(.el-radio-button) {
        .el-radio-button__inner {
          background: rgba(0, 123, 255, 0.1);
          border: 1px solid rgba(0, 123, 255, 0.3);
          color: rgba(255, 255, 255, 0.8);
          
          &:hover {
            background: rgba(0, 123, 255, 0.2);
            border-color: rgba(0, 123, 255, 0.5);
          }
        }
        
        &.is-active {
          .el-radio-button__inner {
            background: rgba(0, 123, 255, 0.4);
            border-color: rgba(0, 123, 255, 0.6);
            color: #ffffff;
            box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
          }
        }
      }
    }
  }

  .video-wall {
    display: grid;
    gap: 16px;
    width: 100%;
    height: 100%; // 使用父容器的完整高度
    max-height: 100%; // 限制在父容器内
    overflow: hidden; // 防止内容溢出
    
    &.layout-1x1 {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr;
    }
    
    &.layout-2x2 {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
    }
    
    &.layout-3x3 {
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-rows: 1fr 1fr 1fr;
    }
    
    &.layout-4x3 {
      grid-template-columns: 1fr 1fr 1fr 1fr;
      grid-template-rows: 1fr 1fr 1fr;
    }
    
    .video-item {
      background: rgba(0, 123, 255, 0.08);
      border: 2px solid rgba(0, 123, 255, 0.2);
      border-radius: 12px;
      overflow: hidden;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      min-height: 200px; // 确保每个视频卡片有最小高度
      
      &.has-video {
        border-color: rgba(0, 123, 255, 0.6);
        box-shadow: 
          0 4px 16px rgba(0, 123, 255, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
      }
      
      .video-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        
        .video-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(0, 123, 255, 0.15);
          border-bottom: 1px solid rgba(0, 123, 255, 0.2);
          backdrop-filter: blur(10px);
          min-height: 40px;
          flex-shrink: 0;
          
          .device-name {
            font-size: 13px;
            font-weight: 600;
            color: #ffffff;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            line-height: 1.2;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: calc(100% - 80px);
          }
          
          .video-controls {
            display: flex;
            gap: 6px;
            flex-shrink: 0;
            
            .el-button {
              background: rgba(0, 123, 255, 0.2);
              border: 1px solid rgba(0, 123, 255, 0.4);
              color: #ffffff;
              width: 28px;
              height: 28px;
              padding: 0;
              
              &:hover {
                background: rgba(0, 123, 255, 0.3);
                border-color: rgba(0, 123, 255, 0.6);
                box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
              }
            }
          }
        }
        
        .video-content {
          flex: 1;
          position: relative;
          background: rgba(0, 20, 40, 0.3);
          overflow: hidden;
          
          // 实际视频播放区域
          .video-player {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            background: #000;
          }
          
          // 占位符样式
          .video-placeholder {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: rgba(255, 255, 255, 0.6);
            
            .video-icon {
              font-size: 48px;
              margin-bottom: 16px;
              color: rgba(0, 212, 255, 0.7);
              filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.4));
            }
            
            .video-text {
              font-size: 14px;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            }
          }
        }
      }
      
      .video-placeholder {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.4);
        background: rgba(0, 20, 40, 0.2);
        
        &.empty {
          .video-icon {
            font-size: 48px;
            margin-bottom: 16px;
            color: rgba(0, 123, 255, 0.4);
          }
          
          .video-text {
            font-size: 14px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }
        }
      }
    }
  }
}

// 滚动条样式
.device-list::-webkit-scrollbar,
.el-tab-pane::-webkit-scrollbar {
  width: 6px;
}

.device-list::-webkit-scrollbar-track,
.el-tab-pane::-webkit-scrollbar-track {
  background: rgba(0, 123, 255, 0.1);
  border-radius: 3px;
}

.device-list::-webkit-scrollbar-thumb,
.el-tab-pane::-webkit-scrollbar-thumb {
  background: rgba(0, 123, 255, 0.4);
  border-radius: 3px;

  &:hover {
    background: rgba(0, 123, 255, 0.6);
  }
}
</style>