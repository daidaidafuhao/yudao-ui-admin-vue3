import request from '@/config/axios'

// 无人机 VO
export interface dronesVO {
  droneCode: string // 无人机编号（主键）
  droneName: string // 无人机名称
  model: string // 无人机型号
  serialNumber: string // 序列号
  manufacturer: string // 制造商
  status: number // 状态（0-待机 1-飞行中 2-返航中 3-充电中 4-维护中 5-故障 6-离线）
  batteryLevel: number // 电池电量百分比（0-100）
  flightTime: number // 累计飞行时间（分钟）
  maxPayload: number // 最大载重（kg）
  maxFlightTime: number // 最大飞行时间（分钟）
  longitude: number // 当前经度
  latitude: number // 当前纬度
  altitude: number // 当前海拔高度（米）
  speed: number // 当前速度（m/s）
  heading: number // 航向角度（0-360度）
  homeLongitude: number // 起飞点经度
  homeLatitude: number // 起飞点纬度
  homeAltitude: number // 起飞点海拔高度（米）
  lastFlightTime: Date // 最后飞行时间
  lastLandingTime: Date // 最后降落时间
  lastMaintenanceTime: Date // 最后维护时间
  nextMaintenanceTime: Date // 下次维护时间
  currentMissionId: string // 当前任务ID
  currentOrderId: number // 当前运送订单编号
  currentOrderNo: string // 当前运送订单流水号
  sourceCabinetCode: string // 起送柜子编号
  targetCabinetCode: string // 目标柜子编号
  operator: string // 当前操作员
  errorMessage: string // 故障信息
  lastErrorTime: Date // 最后故障时间
  remark: string // 备注
  deptId: number // 部门编号
}

// 无人机 API
export const dronesApi = {
  // 查询无人机分页
  getdronesPage: async (params: any) => {
    return await request.get({ url: `/drone/drones/page`, params })
  },

  // 查询无人机详情
  getdrones: async (droneCode: string) => {
    return await request.get({ url: `/drone/drones/get?droneCode=` + droneCode })
  },

  // 新增无人机
  createdrones: async (data: dronesVO) => {
    return await request.post({ url: `/drone/drones/create`, data })
  },

  // 修改无人机
  updatedrones: async (data: dronesVO) => {
    return await request.put({ url: `/drone/drones/update`, data })
  },

  // 删除无人机
  deletedrones: async (droneCode: string) => {
    return await request.delete({ url: `/drone/drones/delete?droneCode=` + droneCode })
  },

  // 导出无人机 Excel
  exportdrones: async (params) => {
    return await request.download({ url: `/drone/drones/export-excel`, params })
  }
}