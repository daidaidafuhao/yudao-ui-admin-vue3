<template>
  <div class="compass-container">
    <div class="compass">
      <div class="compass-ring">
        <!-- 方向标记 -->
        <div class="direction-n">N</div>
        <div class="direction-e">E</div>
        <div class="direction-s">S</div>
        <div class="direction-w">W</div>

        <!-- 指针 -->
        <div
          class="compass-needle"
          :style="{ transform: `translate(-50%, -50%) rotate(${heading}deg)` }"
        ></div>

        <!-- 中心点 -->
        <div class="compass-center"></div>
      </div>
    </div>

    <div class="compass-info">
      <div class="heading-value">{{ heading.toFixed(1) }}°</div>
      <div class="direction-text">{{ getDirectionText(heading) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  heading: number
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 120
})

const compassSize = computed(() => `${props.size}px`)

const getDirectionText = (heading: number): string => {
  if (heading >= 337.5 || heading < 22.5) return '北'
  if (heading >= 22.5 && heading < 67.5) return '东北'
  if (heading >= 67.5 && heading < 112.5) return '东'
  if (heading >= 112.5 && heading < 157.5) return '东南'
  if (heading >= 157.5 && heading < 202.5) return '南'
  if (heading >= 202.5 && heading < 247.5) return '西南'
  if (heading >= 247.5 && heading < 292.5) return '西'
  if (heading >= 292.5 && heading < 337.5) return '西北'
  return '北'
}
</script>

<style lang="scss" scoped>
.compass-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.compass {
  position: relative;
  width: v-bind(compassSize);
  height: v-bind(compassSize);
}

.compass-ring {
  position: relative;
  width: 100%;
  height: 100%;
  border: 3px solid #409eff;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%);
  box-shadow:
    0 4px 16px rgba(64, 158, 255, 0.2),
    inset 0 0 20px rgba(64, 158, 255, 0.1);
}

.direction-n,
.direction-e,
.direction-s,
.direction-w {
  position: absolute;
  font-size: 16px;
  font-weight: bold;
}
.direction-n {
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  color: #409eff;
}
.direction-e {
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  color: #67c23a;
}
.direction-s {
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  color: #f56c6c;
}
.direction-w {
  top: 50%;
  left: 8px;
  transform: translateY(-50%);
  color: #e6a23c;
}

.compass-needle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 90%;
  transform-origin: center center;
  transition: transform 0.3s ease;
  border-radius: 2px;
  /* 上半段(北) */
  background: linear-gradient(to bottom, #f56c6c 50%, #409eff 50%);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
}

.compass-center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  background: #fff;
  border: 2px solid #666;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.compass-info {
  text-align: center;

  .heading-value {
    font-size: 20px;
    font-weight: 700;
    color: #409eff;
    margin-bottom: 4px;
  }

  .direction-text {
    font-size: 14px;
    color: #606266;
  }
}
</style>
