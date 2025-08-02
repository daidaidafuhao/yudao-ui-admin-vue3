<template>
  <div class="new-login-container">
    <!-- 登录按钮 -->
    <button class="login-button">
      登录
    </button>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'NewLogin' })
</script>

<style lang="scss" scoped>
.new-login-container {
  width: 100vw;
  height: 100vh;
  background: #FFFFFF;
  border-radius: 0px 0px 0px 0px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.login-button {
  position: absolute;
  left: 1130px;
  top: 742px;
  width: 440px;
  height: 116px;
  background: linear-gradient(270deg, #00DDFF 0%, #3351FF 100%);
  border-radius: 100px 100px 100px 100px;
  border: none;
  color: white;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 221, 255, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
}
</style> 