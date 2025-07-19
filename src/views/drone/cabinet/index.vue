<template>
  <ContentWrap>
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-20px">
      <el-col :span="6">
        <el-card shadow="hover" class="h-100px">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-14px text-gray-500">总柜子数</div>
              <div class="text-24px font-bold mt-5px">{{ total }}</div>
            </div>
            <el-icon class="text-40px text-primary"><Monitor /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="h-100px">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-14px text-gray-500">在线柜子</div>
              <div class="text-24px font-bold mt-5px text-success">{{ onlineCount }}</div>
            </div>
            <el-icon class="text-40px text-success"><Connection /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="h-100px">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-14px text-gray-500">离线柜子</div>
              <div class="text-24px font-bold mt-5px text-gray-500">{{ offlineCount }}</div>
            </div>
            <el-icon class="text-40px text-gray-500"><SwitchButton /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="h-100px">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-14px text-gray-500">故障柜子</div>
              <div class="text-24px font-bold mt-5px text-danger">{{ errorCount }}</div>
            </div>
            <el-icon class="text-40px text-danger"><Warning /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索表单 -->
    <el-form
      ref="queryFormRef"
      :model="queryParams"
      :inline="true"
      v-show="showSearch"
      label-width="100px"
      class="mb-3"
    >
      <el-row :gutter="20">
        <el-col :span="6">
      <el-form-item label="柜子名称" prop="name">
            <el-input v-model="queryParams.name" placeholder="请输入柜子名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
        </el-col>
        <el-col :span="6">
      <el-form-item label="柜子编号" prop="code">
            <el-input v-model="queryParams.code" placeholder="请输入柜子编号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="Modbus IP" prop="ip">
            <el-input v-model="queryParams.ip" placeholder="请输入Modbus IP" clearable @keyup.enter="handleQuery" />
      </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="min-width: 120px; width: 100%;">
              <el-option label="离线" :value="0" />
              <el-option label="在线" :value="1" />
              <el-option label="故障" :value="2" />
        </el-select>
      </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="6">
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          type="daterange"
              range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
        />
      </el-form-item>
        </el-col>
        <el-col :span="18" class="text-right">
      <el-form-item>
            <el-button type="primary" @click="handleQuery">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button @click="resetQuery">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <!-- 操作工具栏 -->
    <el-row :gutter="10" class="mb-3">
      <el-col :span="1.5">
        <el-button type="primary" @click="openForm('create')">
          <el-icon><Plus /></el-icon>新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" :loading="exportLoading" @click="handleExport">
          <el-icon><Download /></el-icon>导出
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" @click="handleQuery">
          <el-icon><Refresh /></el-icon>刷新
          </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" @click="toggleSearch">
          <el-icon><Search /></el-icon>{{ showSearch ? '收起' : '展开' }}
          </el-button>
      </el-col>
    </el-row>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="list">
      <el-table-column type="index" label="序号" width="50" />
      <el-table-column label="柜子名称" prop="name" min-width="120" show-overflow-tooltip />
      <el-table-column label="柜子编号" prop="code" min-width="120" show-overflow-tooltip />
      <el-table-column label="Modbus IP" prop="ip" min-width="120" show-overflow-tooltip />
      <el-table-column label="Modbus端口" prop="port" width="100" />
      <el-table-column label="Modbus从站ID" prop="slaveId" width="120" />
      <el-table-column label="实际地址" prop="address" min-width="150" show-overflow-tooltip />
      <el-table-column label="经度" prop="longitude" width="100" />
      <el-table-column label="纬度" prop="latitude" width="100" />
      <el-table-column label="状态" prop="status" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="格口数" width="120">
        <template #default="{ row }">
          {{ row.availableBoxes }}/{{ row.totalBoxes }}
        </template>
      </el-table-column>
      <el-table-column label="故障信息" prop="errorMessage" min-width="150" show-overflow-tooltip />
      <el-table-column label="备注" prop="remark" min-width="150" show-overflow-tooltip />
      <el-table-column label="操作" align="center" width="220" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openForm('update', row.id)">修改</el-button>
          <el-button type="danger" link @click="handleDelete(row.id)">删除</el-button>
          <el-button type="info" link @click="openActionPanel(row)">远程操作</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <CabinetForm ref="formRef" @success="getList" />

  <CabinetActionPanel
    v-if="actionPanelVisible"
    v-model:visible="actionPanelVisible"
    :ip="actionPanelData.ip"
    :port="actionPanelData.port"
    :slave-id="actionPanelData.slaveId"
    :code="actionPanelData.code"
    :name="actionPanelData.name"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CabinetApi, type CabinetVO } from '@/api/drone/cabinet'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Monitor, Connection, SwitchButton, Warning, Search, Refresh, Plus, Download } from '@element-plus/icons-vue'
import download from '@/utils/download'
import CabinetForm from './CabinetForm.vue'
import CabinetActionPanel from './CabinetActionPanel.vue'

/** 无人机柜 列表 */
defineOptions({ name: 'Cabinet' })

// 列表数据
const list = ref<CabinetVO[]>([])
const loading = ref(false)
const total = ref(0)
const showSearch = ref(true)

// 统计数据
const onlineCount = ref(0)
const offlineCount = ref(0)
const errorCount = ref(0)

// 查询参数
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
  name: '',
  code: '',
  ip: '',
  status: undefined as number | undefined,
  createTime: [] as string[]
})

// 查询表单
const queryFormRef = ref()

// 导出加载状态
const exportLoading = ref(false)

// 表单引用
const formRef = ref()

const actionPanelVisible = ref(false)
const actionPanelData = ref({ ip: '', port: 0, slaveId: 0, code: '', name: '' })

/** 获取列表数据 */
const getList = async () => {
  loading.value = true
  try {
    const res = await CabinetApi.getCabinetPage(queryParams.value)
    console.log('API Response:', res) // 调试日志
    if (res && res.list) {
      list.value = res.list
      total.value = res.total || 0
      // 更新统计数据
      if (Array.isArray(list.value)) {
        onlineCount.value = list.value.filter(item => item?.status === 1).length
        offlineCount.value = list.value.filter(item => item?.status === 0).length
        errorCount.value = list.value.filter(item => item?.status === 2).length
      } else {
        console.error('list.value is not an array:', list.value)
        list.value = []
        onlineCount.value = 0
        offlineCount.value = 0
        errorCount.value = 0
      }
    } else {
      console.error('Invalid API response:', res)
      list.value = []
      total.value = 0
      onlineCount.value = 0
      offlineCount.value = 0
      errorCount.value = 0
    }
  } catch (error) {
    console.error('Error fetching cabinet list:', error)
    list.value = []
    total.value = 0
    onlineCount.value = 0
    offlineCount.value = 0
    errorCount.value = 0
  } finally {
    loading.value = false
  }
}

/** 查询操作 */
const handleQuery = () => {
  queryParams.value.pageNo = 1
  getList()
}

/** 重置操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 切换搜索表单显示 */
const toggleSearch = () => {
  showSearch.value = !showSearch.value
}

/** 获取状态标签 */
const getStatusLabel = (status: number) => {
  const statusMap: Record<number, string> = {
    0: '离线',
    1: '在线',
    2: '故障'
  }
  return statusMap[status] ?? '未知'
}

/** 获取状态类型 */
const getStatusType = (status: number): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  const typeMap: Record<number, 'success' | 'warning' | 'info' | 'primary' | 'danger'> = {
    0: 'info',
    1: 'success',
    2: 'danger'
  }
  return typeMap[status] ?? 'info'
}

/** 添加/修改操作 */
const openForm = (type: 'create' | 'update', id?: number) => {
  formRef.value?.open(type, id)
}

/** 删除操作 */
const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('是否确认删除该柜子？', '提示', {
      type: 'warning'
    })
    await CabinetApi.deleteCabinet(id)
    ElMessage.success('删除成功')
    getList()
  } catch (error) {
    // 用户取消删除
  }
}

/** 导出操作 */
const handleExport = async () => {
    exportLoading.value = true
  try {
    const data = await CabinetApi.exportCabinet(queryParams.value)
    download.excel(data, '无人机柜.xls')
    ElMessage.success('导出成功')
  } finally {
    exportLoading.value = false
  }
}

const openActionPanel = (row: any) => {
  actionPanelData.value = {
    ip: row.ip,
    port: row.port,
    slaveId: row.slaveId,
    code: row.code,
    name: row.name
  }
  actionPanelVisible.value = true
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.el-card {
  margin-bottom: 15px;
}
</style>