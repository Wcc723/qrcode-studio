<script setup lang="ts">
import type { QrType } from '@/types'
import { qrTypes } from '@/config/qr-types'
defineProps<{ modelValue: QrType }>()
const emit = defineEmits<{ 'update:modelValue': [QrType] }>()
</script>
<template>
  <div class="flex flex-wrap gap-2">
    <button v-for="t in qrTypes" :key="t.type"
      class="inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-full font-700 border transition-colors duration-150 whitespace-nowrap"
      :class="modelValue === t.type
        ? 'bg-brand-50 border-link text-link-700'
        : 'bg-white border-line text-ink hover:border-brand'"
      @click="emit('update:modelValue', t.type)"><span :class="t.icon" aria-hidden="true" />{{ t.label }}</button>
  </div>
</template>
