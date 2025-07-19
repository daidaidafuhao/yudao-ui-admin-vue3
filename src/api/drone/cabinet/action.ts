import request from '@/config/axios'

const prefix = '/drone'

export const CabinetActionApi = {
  // 用户端
  canStore: async (data: any) => await request.post({ url: `${prefix}/package/can-store`, data }),
  userPickupByBox: async (data: any, params: any) => await request.post({ url: `${prefix}/package/user-pickup-by-box`, data, params }),
  userPickupByCode: async (data: any, params: any) => await request.post({ url: `${prefix}/package/user-pickup-by-code`, data, params }),
  userPickupEmpty: async (data: any) => await request.post({ url: `${prefix}/package/user-pickup-empty`, data }),
  canDeposit: async (data: any) => await request.post({ url: `${prefix}/package/can-deposit`, data }),
  // 管理端
  doorOpen: async (data: any) => await request.post({ url: `${prefix}/door/open`, data }),
  doorClose: async (data: any) => await request.post({ url: `${prefix}/door/close`, data }),
  confirmArrived: async (data: any) => await request.post({ url: `${prefix}/drone/confirm-arrived`, data }),
  confirmLeft: async (data: any) => await request.post({ url: `${prefix}/drone/confirm-left`, data }),
  store: async (data: any, params: any) => await request.post({ url: `${prefix}/package/store`, data, params }),
  recycleEmpty: async (data: any) => await request.post({ url: `${prefix}/package/recycle-empty`, data }),
  remoteRecycle: async (data: any) => await request.post({ url: `${prefix}/package/remote-recycle`, data }),
  remoteDeposit: async (data: any) => await request.post({ url: `${prefix}/package/remote-deposit`, data }),
} 