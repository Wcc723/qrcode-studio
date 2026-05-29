<script setup lang="ts">
import { reactive, watch } from 'vue'
import { buildSms } from '@/pure/buildSms'
const emit = defineEmits<{ 'update:payload': [string] }>()
const f = reactive({ number: '', message: '' })
watch(f, () => emit('update:payload', buildSms({ ...f })), { immediate: true, deep: true })
</script>
<template>
  <div class="space-y-3">
    <label class="block"><span class="text-sm text-muted">號碼</span><input v-model="f.number" class="input-base mt-1" type="tel" /></label>
    <label class="block"><span class="text-sm text-muted">訊息</span><textarea v-model="f.message" rows="3" class="input-base mt-1" /></label>
  </div>
</template>
