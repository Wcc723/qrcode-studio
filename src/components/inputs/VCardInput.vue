<script setup lang="ts">
import HelpTip from '../HelpTip.vue'
import { reactive, watch, useId } from 'vue'
import { buildVCard, type VCardInputData } from '@/pure/buildVCard'
const emit = defineEmits<{ 'update:payload': [string] }>()
const props = defineProps<{ initial?: VCardInputData }>()
const f = reactive<VCardInputData>({
  firstName: '', lastName: '', phone: '', email: '', org: '', title: '', address: '', website: '',
  ...props.initial,
})
watch(f, () => emit('update:payload', buildVCard({ ...f })), { immediate: true, deep: true })
const uid = useId()
</script>
<template>
  <div>
    <HelpTip name="聯絡資訊" :id="`${uid}-help`">
      <template #head><span :id="`${uid}-label`" class="text-sm font-700 text-ink">聯絡資訊</span></template>
      <p>採用標準的 vCard 3.0 格式，對方掃描後可以一鍵存進手機通訊錄。留空的欄位會自動省略。</p>
      <p>欄位填得越多，QR Code 越密，印在名片上時建議只留最常用的幾項。沒有 LINE ID 欄位，可以把 LINE 加好友網址填在「網站」。</p>
    </HelpTip>
    <div role="group" :aria-labelledby="`${uid}-label`" :aria-describedby="`${uid}-help`" class="grid grid-cols-2 gap-3 mt-1">
      <label class="block"><span class="text-sm text-muted">名</span><input v-model="f.firstName" class="input-base mt-1" /></label>
      <label class="block"><span class="text-sm text-muted">姓</span><input v-model="f.lastName" class="input-base mt-1" /></label>
      <label class="block"><span class="text-sm text-muted">電話</span><input v-model="f.phone" class="input-base mt-1" /></label>
      <label class="block"><span class="text-sm text-muted">Email</span><input v-model="f.email" class="input-base mt-1" /></label>
      <label class="block"><span class="text-sm text-muted">公司</span><input v-model="f.org" class="input-base mt-1" /></label>
      <label class="block"><span class="text-sm text-muted">職稱</span><input v-model="f.title" class="input-base mt-1" /></label>
      <label class="block col-span-2"><span class="text-sm text-muted">地址</span><input v-model="f.address" class="input-base mt-1" /></label>
      <label class="block col-span-2"><span class="text-sm text-muted">網站</span><input v-model="f.website" class="input-base mt-1" /></label>
    </div>
  </div>
</template>
