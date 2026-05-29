<script setup lang="ts">
import type { QrType } from '@/types'
import { qrTypes } from '@/config/qr-types'
defineProps<{ modelValue: QrType }>()
const emit = defineEmits<{ 'update:modelValue': [QrType] }>()
</script>
<template>
  <div class="flex flex-wrap gap-2">
    <button v-for="t in qrTypes" :key="t.type"
      class="px-3 py-1.5 rounded-full text-sm transition"
      :class="modelValue === t.type ? 'bg-brand text-white' : 'bg-brand-50 text-brand hover:bg-brand/10'"
      @click="emit('update:modelValue', t.type)">{{ t.label }}</button>
  </div>
</template>
