<template>
  <div
    class="login-page relative h-[100%] lt-md:px-10px lt-sm:px-10px lt-xl:px-10px lt-xl:px-10px"
    style="background: #FFFFFF; border-radius: 0px 0px 0px 0px;"
  >
    <div class="relative mx-auto h-full flex">
      <div
        class="login-page__left flex-2 relative p-30px lt-xl:hidden overflow-hidden"
        style="flex: 2; background: #FFFFFF;"
      >
                <!-- 左边的背景图 + 欢迎语 -->
        <div class="h-full flex items-center justify-center relative">
          <!-- 左下角不规则阴影 -->
          <div class="absolute bottom-0 left-0 w-96 h-96 bg-[#F2F5FF] opacity-60 rounded-tl-[100px] rounded-tr-[50px] rounded-br-[80px] rounded-bl-[30px] z-0"></div>
          
          <div class="relative z-10" style="width: 700px; height: 700px;">
            <!-- 无人机底座 -->
            <img alt="无人机底座" class="w-700px" src="@/assets/imgs/login/无人机底座.png" />
            <!-- 无人机 -->
            <img alt="无人机" class="w-335px absolute top-0 left-0" src="@/assets/imgs/login/无人机.png" style="transform: translate(185px,130px);" />
          </div>
        </div>
      </div>
      <div
        class="relative flex-1 p-30px lt-sm:p-10px overflow-x-hidden overflow-y-auto"
        style="flex: 1; background: #FFFFFF;"
      >
        <!-- 右侧内容区域 -->
        <div class="h-full flex flex-col justify-center items-center relative">
        
          
          <!-- 主要内容区域 -->
          <div class="text-left max-w-md">
            <!-- 欢迎文字 -->
            <div class="text-gray-500 text-lg mb-2">欢迎使用</div>
            
            <!-- 主标题 -->
            <div class="text-4xl font-bold text-blue-800 mb-4">物流无人机系统</div>
            
            <!-- 副标题 -->
            <div class="text-gray-500 text-base mb-12">全方位飞行监控系统，您的可靠物流伙伴</div>
            
            <!-- 登录按钮 -->
            <button 
              @click="showLoginForm = true"
              class="w-64 h-14 text-white font-bold text-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-0 outline-none"
              style="background: linear-gradient(270deg, #00DDFF 0%, #3351FF 100%); border-radius: 100px 100px 100px 100px; border: none;"
            >
              立即登录
            </button>
          </div>
        </div>
        
        <!-- 登录表单弹窗 -->
        <div v-if="showLoginForm" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 scale-100">
            <div class="flex justify-between items-center mb-8">
              <h2 class="text-2xl font-bold text-gray-800">登录系统</h2>
              <button @click="showLoginForm = false" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 border border-gray-200 hover:border-red-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="bg-gray-50 rounded-xl p-6">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { underlineToHump } from '@/utils'

import { useDesign } from '@/hooks/web/useDesign'
import { useAppStore } from '@/store/modules/app'


import { LoginForm, MobileForm, QrCodeForm, RegisterForm, SSOLoginVue, ForgetPasswordForm } from './components'

defineOptions({ name: 'Login' })

const { t } = useI18n()
const appStore = useAppStore()

// 控制登录表单显示状态
const showLoginForm = ref(false)
</script>

<style lang="scss" scoped>
.login-page {
  overflow: auto;

  &__left {
    background: #FFFFFF;
    
    &::before {
      position: absolute;
      top: 0;
      left: 0;
      z-index: -1;
      width: 100%;
      height: 100%;
      background: #FFFFFF;
      content: '';
    }
  }
}
</style>


