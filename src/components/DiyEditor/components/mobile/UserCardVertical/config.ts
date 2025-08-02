import { ComponentStyle, DiyComponent } from '@/components/DiyEditor/util'

/** 竖排用户卡片属性 */
export interface UserCardVerticalProperty {
  // 组件样式
  style: ComponentStyle
}

// 定义组件
export const component = {
  id: 'UserCardVertical',
  name: '竖排用户卡片',
  icon: 'mdi:user-card-details-outline',
  property: {
    style: {
      bgType: 'color',
      bgColor: '#f8f9fa',
      marginBottom: 8
    } as ComponentStyle
  }
} as DiyComponent<UserCardVerticalProperty> 