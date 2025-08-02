<template>
  <div class="user-card-vertical">
    <!-- 用户信息区域 -->
    <div class="user-info-section">
      <div class="avatar-container">
        <el-avatar :size="80" class="user-avatar">
          <Icon icon="ep:avatar" :size="80" />
        </el-avatar>
        <div class="vip-badge">
          <Icon icon="mdi:crown" :size="16" color="#FFD700" />
        </div>
        <div class="qr-share">
          <Icon icon="tdesign:qrcode" :size="20" />
        </div>
      </div>
      <div class="user-details">
        <h3 class="username">峰羽源码</h3>
        <p class="user-desc">点击绑定手机号</p>
        <el-button type="primary" size="small" class="bind-btn">去绑定</el-button>
      </div>
    </div>

    <!-- 数据统计区域 -->
    <div class="stats-section">
      <div class="stat-item">
        <div class="stat-icon">
          <Icon icon="mdi:heart" :size="20" color="#ff4757" />
        </div>
        <div class="stat-content">
          <div class="stat-number">128</div>
          <div class="stat-label">我的收藏</div>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon">
          <Icon icon="mdi:eye" :size="20" color="#3742fa" />
        </div>
        <div class="stat-content">
          <div class="stat-number">256</div>
          <div class="stat-label">浏览足迹</div>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon">
          <Icon icon="mdi:wallet" :size="20" color="#2ed573" />
        </div>
        <div class="stat-content">
          <div class="stat-number">¥1,280</div>
          <div class="stat-label">账户余额</div>
        </div>
      </div>
    </div>

    <!-- 功能菜单区域 -->
    <div class="menu-section">
      <div class="menu-item" @click="handleMenuClick('order')">
        <div class="menu-icon">
          <Icon icon="mdi:package-variant" :size="24" color="#ff6b35" />
        </div>
        <div class="menu-content">
          <div class="menu-title">我的订单</div>
          <div class="menu-desc">查看订单状态</div>
        </div>
        <Icon icon="ep:arrow-right" :size="16" color="#999" />
      </div>

      <div class="menu-item" @click="handleMenuClick('coupon')">
        <div class="menu-icon">
          <Icon icon="mdi:ticket-percent" :size="24" color="#ff9ff3" />
        </div>
        <div class="menu-content">
          <div class="menu-title">优惠券</div>
          <div class="menu-desc">5张可用</div>
        </div>
        <Icon icon="ep:arrow-right" :size="16" color="#999" />
      </div>

      <div class="menu-item" @click="handleMenuClick('address')">
        <div class="menu-icon">
          <Icon icon="mdi:map-marker" :size="24" color="#54a0ff" />
        </div>
        <div class="menu-content">
          <div class="menu-title">收货地址</div>
          <div class="menu-desc">管理收货地址</div>
        </div>
        <Icon icon="ep:arrow-right" :size="16" color="#999" />
      </div>

      <div class="menu-item" @click="handleMenuClick('service')">
        <div class="menu-icon">
          <Icon icon="mdi:headset" :size="24" color="#5f27cd" />
        </div>
        <div class="menu-content">
          <div class="menu-title">客服中心</div>
          <div class="menu-desc">在线客服咨询</div>
        </div>
        <Icon icon="ep:arrow-right" :size="16" color="#999" />
      </div>

      <div class="menu-item" @click="handleMenuClick('settings')">
        <div class="menu-icon">
          <Icon icon="mdi:cog" :size="24" color="#00d2d3" />
        </div>
        <div class="menu-content">
          <div class="menu-title">设置</div>
          <div class="menu-desc">账户设置</div>
        </div>
        <Icon icon="ep:arrow-right" :size="16" color="#999" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UserCardVerticalProperty } from './config'

/** 竖排用户卡片 */
defineOptions({ name: 'UserCardVertical' })

// 定义属性
defineProps<{ property: UserCardVerticalProperty }>()

// 菜单点击处理
const handleMenuClick = (type: string) => {
  console.log('菜单点击:', type)
  // 这里可以添加具体的跳转逻辑
}
</script>

<style scoped lang="scss">
.user-card-vertical {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin: 16px;
}

.user-info-section {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  
  .avatar-container {
    position: relative;
    margin-right: 16px;
    
    .user-avatar {
      border: 3px solid rgba(255, 255, 255, 0.3);
    }
    
    .vip-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      padding: 4px;
    }
    
    .qr-share {
      position: absolute;
      bottom: -5px;
      right: -5px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      padding: 4px;
      color: #333;
    }
  }
  
  .user-details {
    flex: 1;
    
    .username {
      font-size: 20px;
      font-weight: bold;
      margin: 0 0 4px 0;
    }
    
    .user-desc {
      font-size: 14px;
      opacity: 0.8;
      margin: 0 0 8px 0;
    }
    
    .bind-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      
      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }
}

.stats-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  
  .stat-item {
    display: flex;
    align-items: center;
    flex: 1;
    justify-content: center;
    
    .stat-icon {
      margin-right: 8px;
    }
    
    .stat-content {
      text-align: center;
      
      .stat-number {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 2px;
      }
      
      .stat-label {
        font-size: 12px;
        opacity: 0.8;
      }
    }
  }
}

.menu-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 8px;
  
  .menu-item {
    display: flex;
    align-items: center;
    padding: 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateX(4px);
    }
    
    &:not(:last-child) {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .menu-icon {
      margin-right: 12px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 8px;
    }
    
    .menu-content {
      flex: 1;
      
      .menu-title {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 2px;
      }
      
      .menu-desc {
        font-size: 12px;
        opacity: 0.7;
      }
    }
  }
}
</style> 