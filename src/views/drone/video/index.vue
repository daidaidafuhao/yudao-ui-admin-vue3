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
        <!-- 设备选择区域 -->
        <el-row :gutter="16" class="mb-16px">
          <el-col :span="12">
            <el-card shadow="never">
              <template #header>
                <span class="text-16px font-bold">飞行器视频</span>
              </template>
              <div class="device-list">
                <el-checkbox-group v-model="selectedDrones">
                  <el-checkbox 
                    v-for="drone in droneList" 
                    :key="drone.id" 
                    :label="drone.id"
                    class="device-item"
                  >
                    <div class="device-info">
                      <div class="device-name">{{ drone.name }}</div>
                      <div class="device-status">
                        <el-tag :type="drone.status === 'online' ? 'success' : 'danger'" size="small">
                          {{ drone.status === 'online' ? '在线' : '离线' }}
                        </el-tag>
                      </div>
                    </div>
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="12">
            <el-card shadow="never">
              <template #header>
                <span class="text-16px font-bold">起降点视频</span>
              </template>
              <div class="device-list">
                <el-checkbox-group v-model="selectedLandingPoints">
                  <el-checkbox 
                    v-for="point in landingPointList" 
                    :key="point.id" 
                    :label="point.id"
                    class="device-item"
                  >
                    <div class="device-info">
                      <div class="device-name">{{ point.name }}</div>
                      <div class="device-status">
                        <el-tag :type="point.status === 'online' ? 'success' : 'danger'" size="small">
                          {{ point.status === 'online' ? '在线' : '离线' }}
                        </el-tag>
                      </div>
                    </div>
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 布局选择 -->
        <el-row :gutter="16" class="mb-16px">
          <el-col :span="24">
            <el-card shadow="never">
              <template #header>
                <span class="text-16px font-bold">布局设置</span>
              </template>
              <div class="layout-options">
                <el-radio-group v-model="currentLayout" @change="changeLayout">
                  <el-radio-button label="1x1">1x1</el-radio-button>
                  <el-radio-button label="2x2">2x2</el-radio-button>
                  <el-radio-button label="3x3">3x3</el-radio-button>
                  <el-radio-button label="4x4">4x4</el-radio-button>
                  <el-radio-button label="custom">自定义</el-radio-button>
                </el-radio-group>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 视频显示区域 -->
        <el-row :gutter="16">
          <el-col :span="24">
            <el-card shadow="never">
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
                      <div class="video-placeholder">
                        <el-icon class="video-icon"><VideoPlay /></el-icon>
                        <div class="video-text">视频流加载中...</div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="video-placeholder empty">
                    <el-icon class="video-icon"><VideoCamera /></el-icon>
                    <div class="video-text">点击上方设备添加视频</div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, VideoCamera, FullScreen, Close } from '@element-plus/icons-vue'

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

// 选中的设备
const selectedDrones = ref<number[]>([])
const selectedLandingPoints = ref<number[]>([])

// 布局设置
const currentLayout = ref('2x2')

// 视频列表
const videoList = ref<any[]>([])

// 初始化视频列表
const initVideoList = () => {
  const layoutMap = {
    '1x1': 1,
    '2x2': 4,
    '3x3': 9,
    '4x4': 16
  }
  
  const count = layoutMap[currentLayout.value] || 4
  videoList.value = Array(count).fill(null).map(() => ({ deviceId: null, deviceType: null }))
}

// 获取设备名称
const getDeviceName = (deviceId: number) => {
  const drone = droneList.value.find(d => d.id === deviceId)
  if (drone) return drone.name
  
  const point = landingPointList.value.find(p => p.id === deviceId)
  if (point) return point.name
  
  return '未知设备'
}

// 监听设备选择变化
watch([selectedDrones, selectedLandingPoints], () => {
  updateVideoList()
}, { deep: true })

// 更新视频列表
const updateVideoList = () => {
  const allDevices = [
    ...selectedDrones.value.map(id => ({ id, type: 'drone' })),
    ...selectedLandingPoints.value.map(id => ({ id, type: 'landing' }))
  ]
  
  // 清空视频列表
  videoList.value.forEach(video => {
    video.deviceId = null
    video.deviceType = null
  })
  
  // 分配设备到视频位置
  allDevices.forEach((device, index) => {
    if (index < videoList.value.length) {
      videoList.value[index].deviceId = device.id
      videoList.value[index].deviceType = device.type
    }
  })
}

// 切换布局
const changeLayout = () => {
  initVideoList()
  updateVideoList()
}

// 切换全屏
const toggleFullscreen = (index: number) => {
  console.log('切换全屏:', index)
  ElMessage.success('全屏功能开发中...')
}

// 关闭视频
const closeVideo = (index: number) => {
  videoList.value[index].deviceId = null
  videoList.value[index].deviceType = null
  
  // 从选中列表中移除
  const deviceId = videoList.value[index].deviceId
  const deviceType = videoList.value[index].deviceType
  
  if (deviceType === 'drone') {
    const droneIndex = selectedDrones.value.indexOf(deviceId)
    if (droneIndex > -1) {
      selectedDrones.value.splice(droneIndex, 1)
    }
  } else if (deviceType === 'landing') {
    const pointIndex = selectedLandingPoints.value.indexOf(deviceId)
    if (pointIndex > -1) {
      selectedLandingPoints.value.splice(pointIndex, 1)
    }
  }
}

// 保存布局
const saveLayout = () => {
  const layout = {
    layout: currentLayout.value,
    selectedDrones: selectedDrones.value,
    selectedLandingPoints: selectedLandingPoints.value,
    videoList: videoList.value
  }
  
  localStorage.setItem('drone-video-layout', JSON.stringify(layout))
  ElMessage.success('布局保存成功')
}

// 重置布局
const resetLayout = () => {
  selectedDrones.value = []
  selectedLandingPoints.value = []
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
  .video-content {
    padding: 16px 0;
  }

  .device-list {
    .device-item {
      display: block;
      margin-bottom: 8px;
      
      .device-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-left: 8px;
        
        .device-name {
          font-size: 14px;
          color: #303133;
        }
        
        .device-status {
          margin-left: 8px;
        }
      }
    }
  }

  .layout-options {
    .el-radio-group {
      .el-radio-button {
        margin-right: 8px;
      }
    }
  }

  .video-wall {
    display: grid;
    gap: 16px;
    min-height: 400px;
    
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
    
    &.layout-4x4 {
      grid-template-columns: 1fr 1fr 1fr 1fr;
      grid-template-rows: 1fr 1fr 1fr 1fr;
    }
    
    .video-item {
      border: 2px solid #e4e7ed;
      border-radius: 8px;
      overflow: hidden;
      background: #f5f7fa;
      
      &.has-video {
        border-color: #409eff;
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
          background: #f0f2f5;
          border-bottom: 1px solid #e4e7ed;
          
          .device-name {
            font-size: 14px;
            font-weight: bold;
            color: #303133;
          }
          
          .video-controls {
            display: flex;
            gap: 4px;
          }
        }
        
        .video-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          
          .video-placeholder {
            text-align: center;
            color: #909399;
            
            .video-icon {
              font-size: 48px;
              margin-bottom: 16px;
            }
            
            .video-text {
              font-size: 14px;
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
        color: #c0c4cc;
        
        &.empty {
          .video-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          
          .video-text {
            font-size: 14px;
          }
        }
      }
    }
  }
}
</style> 