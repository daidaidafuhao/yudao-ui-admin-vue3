<template>
  <ComponentContainerProperty v-model="formData.style" />
</template>

<script setup lang="ts">
import { UserCardVerticalProperty } from './config'
import { useVModel } from '@vueuse/core'

/** 竖排用户卡片属性配置 */
defineOptions({ name: 'UserCardVerticalProperty' })

const props = defineProps<{ modelValue: UserCardVerticalProperty }>()
const emit = defineEmits(['update:modelValue'])
const formData = useVModel(props, 'modelValue', emit)
</script>

<style scoped lang="scss"></style> 