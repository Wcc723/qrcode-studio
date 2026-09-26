<script setup lang="ts">
import HelpTip from '../HelpTip.vue'
import { reactive, watch, useId } from 'vue'
import { buildSms, type SmsInputData } from '@/pure/buildSms'
const emit = defineEmits<{ 'update:payload': [string] }>()
const props = defineProps<{ initial?: SmsInputData }>()
const f = reactive<SmsInputData>({ number: '', message: '', ...props.initial })
const uid = useId()
watch(f, () => emit('update:payload', buildSms({ ...f })), { immediate: true, deep: true })
</script>
<template>
  <div class="space-y-3">
    <div>
      <HelpTip name="號碼" :id="`${uid}-help`">
        <template #head><label :for="`${uid}-number`" class="text-sm text-muted">號碼</label></template>
        <p>掃描後會開啟簡訊 App，帶入號碼與訊息，由對方確認後自己按下傳送，不會自動送出。iPhone 與 Android 帶入的方式可能略有差異，印刷前兩種手機各掃一次；簡訊費依傳送者自己的電信方案計算。</p>
      </HelpTip>
      <input :id="`${uid}-number`" v-model="f.number" :aria-describedby="`${uid}-help`" class="input-base mt-1" type="tel" />
    </div>
    <label class="block"><span class="text-sm text-muted">訊息</span><textarea v-model="f.message" rows="3" class="input-base mt-1" /></label>
  </div>
</template>
