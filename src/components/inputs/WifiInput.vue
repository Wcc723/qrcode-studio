<script setup lang="ts">
import HelpTip from '../HelpTip.vue'
import { reactive, watch, useId } from 'vue'
import { buildWifi, type WifiEncryption, type WifiInputData } from '@/pure/buildWifi'
const emit = defineEmits<{ 'update:payload': [string] }>()
const props = defineProps<{ initial?: WifiInputData }>()
const f = reactive<WifiInputData>({
  ssid: '', password: '', encryption: 'WPA' as WifiEncryption, hidden: false, ...props.initial,
})
watch(f, () => emit('update:payload', buildWifi({ ...f })), { immediate: true, deep: true })
const uid = useId()
</script>
<template>
  <div class="space-y-3">
    <div>
      <HelpTip name="WiFi 名稱" :id="`${uid}-ssid-help`">
        <template #head><label :for="`${uid}-ssid`" class="text-sm text-muted">WiFi 名稱</label></template>
        <p>手機 WiFi 清單上看到的那個名稱（路由器設定頁上叫 SSID），大小寫、空格都要跟路由器設定的一模一樣。之後換了密碼，要重新產生一張替換。</p>
      </HelpTip>
      <input :id="`${uid}-ssid`" v-model="f.ssid" :aria-describedby="`${uid}-ssid-help`" data-test="ssid" class="input-base mt-1" />
    </div>
    <label class="block"><span class="text-sm text-muted">密碼</span>
      <input v-model="f.password" data-test="password" class="input-base mt-1" :disabled="f.encryption === 'nopass'" /></label>
    <div>
      <HelpTip name="加密方式" :id="`${uid}-enc-help`">
        <template #head><label :for="`${uid}-enc`" class="text-sm font-700 text-ink">加密方式</label></template>
        <p>不確定就選 WPA/WPA2，現在的家用與店家路由器大多是它；WEP 只有很舊的設備在用；不用輸入密碼就能連的網路選「不用密碼」，密碼欄會停用。</p>
        <p>「隱藏的網路」：手機 WiFi 清單上看不到這個名稱、要手動輸入才連得上時才勾。</p>
      </HelpTip>
      <div class="flex gap-3 flex-wrap items-center mt-1">
        <select :id="`${uid}-enc`" v-model="f.encryption" :aria-describedby="`${uid}-enc-help`" class="input-base flex-1 min-w-[160px] !w-auto">
          <option value="WPA">WPA/WPA2（大多數家用、店家）</option><option value="WEP">WEP（很舊的設備）</option><option value="nopass">不用密碼</option>
        </select>
        <label class="flex items-center gap-2 cursor-pointer"><input v-model="f.hidden" type="checkbox" class="accent-brand w-4 h-4" /><span class="text-sm font-600 text-ink whitespace-nowrap">隱藏的網路</span></label>
      </div>
    </div>
  </div>
</template>
