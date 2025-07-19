import request from '@/config/axios'

// 无人机柜 VO
export interface CabinetVO {
  id: number // 主键ID
  name: string // 柜子名称
  code: string // 柜子编号
  ip: string // Modbus IP地址
  port: number // Modbus端口
  slaveId: number // Modbus从站ID
  address: string // 实际地址
  longitude: number // 经度
  latitude: number // 纬度
  status: number // 状态（0-离线 1-在线 2-故障）
  totalBoxes: number // 总格口数
  availableBoxes: number // 可用格口数
  lastOnlineTime: Date // 最后在线时间
  lastOfflineTime: Date // 最后离线时间
  lastErrorTime: Date // 最后故障时间
  errorMessage: string // 故障信息
  remark: string // 备注
}

// 无人机柜 API
export const CabinetApi = {
  // 查询无人机柜分页
  getCabinetPage: async (params: any) => {
    return await request.get({ url: `/drone/cabinet/page`, params })
  },

  // 查询无人机柜详情
  getCabinet: async (id: number) => {
    return await request.get({ url: `/drone/cabinet/get?id=` + id })
  },

  // 新增无人机柜
  createCabinet: async (data: CabinetVO) => {
    return await request.post({ url: `/drone/cabinet/create`, data })
  },

  // 修改无人机柜
  updateCabinet: async (data: CabinetVO) => {
    return await request.put({ url: `/drone/cabinet/update`, data })
  },

  // 删除无人机柜
  deleteCabinet: async (id: number) => {
    return await request.delete({ url: `/drone/cabinet/delete?id=` + id })
  },

  // 导出无人机柜 Excel
  exportCabinet: async (params) => {
    return await request.download({ url: `/drone/cabinet/export-excel`, params })
  }
}