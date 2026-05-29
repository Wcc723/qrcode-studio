<script setup lang="ts">
import { ref, watch } from 'vue'
import { buildPhone } from '@/pure/buildPhone'
const emit = defineEmits<{ 'update:payload': [string] }>()
const number = ref('')
watch(number, () => emit('update:payload', buildPhone({ number: number.value })), { immediate: true })
</script>
<template>
  <label class="block"><span class="text-sm text-muted">電話號碼</span>
    <input v-model="number" class="input-base mt-1" type="tel" placeholder="0912345678" /></label>
</template>
