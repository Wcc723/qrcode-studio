<script setup lang="ts">
import type { QrType } from '@/types'
import { qrTypes } from '@/config/qr-types'
defineProps<{ modelValue: QrType }>()
const emit = defineEmits<{ 'update:modelValue': [QrType] }>()
</script>
<template>
  <div class="flex flex-wrap gap-2">
    <button v-for="t in qrTypes" :key="t.type"
      class="px-3.5 py-1.5 rounded-full text-sm font-display font-600 border-2 border-ink transition-all duration-150"
      :class="modelValue === t.type
        ? 'bg-pop-pink text-ink shadow-[3px_3px_0_#16130f] -translate-y-0.5'
        : 'bg-white text-ink hover:bg-pop-sun hover:shadow-[2px_2px_0_#16130f] hover:-translate-y-0.5'"
      @click="emit('update:modelValue', t.type)">{{ t.label }}</button>
  </div>
</template>
