<template>
  <el-dialog :model-value="visible" :title="`远程操作 - ${name || code}`" width="600px" @close="close">
    <el-descriptions :column="1" border>
      <el-descriptions-item label="IP">{{ ip }}</el-descriptions-item>
      <el-descriptions-item label="端口">{{ port }}</el-descriptions-item>
      <el-descriptions-item label="Slave ID">{{ slaveId }}</el-descriptions-item>
    </el-descriptions>
    
    <el-divider>用户端操作</el-divider>
    <el-row :gutter="20" class="mb-4">
      <el-col :span="12" class="mb-4">
        <el-button :loading="loading==='can-store'" @click="call('can-store')" class="w-full">检查可存件</el-button>
      </el-col>
      <el-col :span="12" class="mb-4">
        <el-button :loading="loading==='can-deposit'" @click="call('can-deposit')" class="w-full">检查可寄件</el-button>
      </el-col>
      <el-col :span="12" class="mb-4">
        <el-input-number v-model="boxNo" :min="1" :max="99" placeholder="格口号" class="w-full mb-2" />
        <el-button :loading="loading==='user-pickup-by-box'" @click="call('user-pickup-by-box')" class="w-full">用户取件(格口号)</el-button>
      </el-col>
      <el-col :span="12" class="mb-4">
        <el-input-number v-model="pickupCode" :min="100000" :max="999999" placeholder="取件码" class="w-full mb-2" />
        <el-button :loading="loading==='user-pickup-by-code'" @click="call('user-pickup-by-code')" class="w-full">用户取件(取件码)</el-button>
      </el-col>
      <el-col :span="12" class="mb-4">
        <el-button :loading="loading==='user-pickup-empty'" @click="call('user-pickup-empty')" class="w-full">取空包裹</el-button>
      </el-col>
    </el-row>

    <el-divider>管理端操作</el-divider>
    <el-row :gutter="20" class="mb-4">
      <el-col :span="12" class="mb-4">
        <el-button :loading="loading==='door-open'" @click="call('door-open')" class="w-full">开舱门</el-button>
      </el-col>
      <el-col :span="12" class="mb-4">
        <el-button :loading="loading==='door-close'" @click="call('door-close')" class="w-full">关舱门</el-button>
      </el-col>
      <el-col :span="12" class="mb-4">
        <el-button :loading="loading==='confirm-arrived'" @click="call('confirm-arrived')" class="w-full">确认有飞机</el-button>
      </el-col>
      <el-col :span="12" class="mb-4">
        <el-button :loading="loading==='confirm-left'" @click="call('confirm-left')" class="w-full">确认无飞机</el-button>
      </el-col>
      <el-col :span="12" class="mb-4">
        <el-input-number v-model="storeBoxNo" :min="1" :max="99" placeholder="存件格口号" class="w-full mb-2" />
        <el-button :loading="loading==='store'" @click="call('store')" class="w-full">无人机存件</el-button>
      </el-col>
      <el-col :span="12" class="mb-4">
        <el-button :loading="loading==='recycle-empty'" @click="call('recycle-empty')" class="w-full">空包裹回收</el-button>
      </el-col>
      <el-col :span="12" class="mb-4">
        <el-button :loading="loading==='remote-recycle'" @click="call('remote-recycle')" class="w-full">远程回收</el-button>
      </el-col>
      <el-col :span="12" class="mb-4">
        <el-button :loading="loading==='remote-deposit'" @click="call('remote-deposit')" class="w-full">远程寄件</el-button>
      </el-col>
    </el-row>

    <el-alert v-if="resultMsg" :title="resultMsg" :type="resultType" show-icon class="mt-2" />
    <template #footer>
      <el-button @click="close">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { CabinetActionApi } from '@/api/drone/cabinet/action'

const props = defineProps({
  ip: String,
  port: Number,
  slaveId: Number,
  code: String,
  name: String,
  visible: Boolean
})

const emit = defineEmits(['update:visible'])
const loading = ref('')
const resultMsg = ref('')
const resultType = ref<'success'|'error'|'info'>('info')
const boxNo = ref(1)
const storeBoxNo = ref(1)
const pickupCode = ref(100000)

const close = () => emit('update:visible', false)

const apiMap = {
  'can-store': CabinetActionApi.canStore,
  'user-pickup-by-box': CabinetActionApi.userPickupByBox,
  'user-pickup-by-code': CabinetActionApi.userPickupByCode,
  'user-pickup-empty': CabinetActionApi.userPickupEmpty,
  'can-deposit': CabinetActionApi.canDeposit,
  'door-open': CabinetActionApi.doorOpen,
  'door-close': CabinetActionApi.doorClose,
  'confirm-arrived': CabinetActionApi.confirmArrived,
  'confirm-left': CabinetActionApi.confirmLeft,
  'store': CabinetActionApi.store,
  'recycle-empty': CabinetActionApi.recycleEmpty,
  'remote-recycle': CabinetActionApi.remoteRecycle,
  'remote-deposit': CabinetActionApi.remoteDeposit,
}

async function call(key: string) {
  loading.value = key
  resultMsg.value = ''
  resultType.value = 'info'
  const apiFn = apiMap[key]
  const data = {
    ip: props.ip,
    port: props.port,
    slaveId: props.slaveId,
  }
  const params = {
    ...(key === 'user-pickup-by-box' ? { boxNo: boxNo.value } : {}),
    ...(key === 'user-pickup-by-code' ? { code: pickupCode.value } : {}),
    ...(key === 'store' ? { boxNo: storeBoxNo.value } : {}),
  }
  try {
    const res = await apiFn(data, params)
    if (res.code === 0) {
      resultMsg.value = '操作成功: ' + (typeof res.data === 'boolean' ? (res.data ? '成功' : '失败') : JSON.stringify(res.data))
      resultType.value = res.data ? 'success' : 'error'
    } else {
      resultMsg.value = '操作失败: ' + res.msg
      resultType.value = 'error'
    }
  } catch (e: any) {
    resultMsg.value = '请求异常: ' + (e.message || e)
    resultType.value = 'error'
  } finally {
    loading.value = ''
  }
}

watch(() => props.visible, v => { 
  if (!v) {
    resultMsg.value = ''
    boxNo.value = 1
    storeBoxNo.value = 1
    pickupCode.value = 100000
  }
})
</script>

<style scoped>
.w-full {
  width: 100%;
}
.mb-2 {
  margin-bottom: 8px;
}
.mb-4 {
  margin-bottom: 16px;
}
.mt-2 {
  margin-top: 8px;
}
</style> 