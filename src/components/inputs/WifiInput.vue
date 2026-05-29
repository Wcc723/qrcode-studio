<script setup lang="ts">
import { reactive, watch } from 'vue'
import { buildWifi, type WifiEncryption } from '@/pure/buildWifi'
const emit = defineEmits<{ 'update:payload': [string] }>()
const f = reactive({ ssid: '', password: '', encryption: 'WPA' as WifiEncryption, hidden: false })
watch(f, () => emit('update:payload', buildWifi({ ...f })), { immediate: true, deep: true })
</script>
<template>
  <div class="space-y-3">
    <label class="block"><span class="text-sm text-muted">網路名稱 (SSID)</span>
      <input v-model="f.ssid" data-test="ssid" class="input-base mt-1" /></label>
    <label class="block"><span class="text-sm text-muted">密碼</span>
      <input v-model="f.password" data-test="password" class="input-base mt-1" :disabled="f.encryption === 'nopass'" /></label>
    <div class="flex gap-3">
      <label class="block flex-1"><span class="text-sm text-muted">加密</span>
        <select v-model="f.encryption" class="input-base mt-1">
          <option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">無密碼</option>
        </select></label>
      <label class="flex items-end gap-2 pb-2"><input v-model="f.hidden" type="checkbox" /><span class="text-sm text-muted">隱藏網路</span></label>
    </div>
  </div>
</template>
