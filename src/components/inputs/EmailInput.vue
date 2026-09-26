<script setup lang="ts">
import HelpTip from '../HelpTip.vue'
import { reactive, watch, useId } from 'vue'
import { buildEmail, type EmailInputData } from '@/pure/buildEmail'
const emit = defineEmits<{ 'update:payload': [string] }>()
const props = defineProps<{ initial?: EmailInputData }>()
const f = reactive<EmailInputData>({ to: '', subject: '', body: '', ...props.initial })
const uid = useId()
watch(f, () => emit('update:payload', buildEmail({ ...f })), { immediate: true, deep: true })
</script>
<template>
  <div class="space-y-3">
    <div>
      <HelpTip name="收件者" :id="`${uid}-help`">
        <template #head><label :for="`${uid}-to`" class="text-sm text-muted">收件者</label></template>
        <p>掃描後會開啟郵件 App，帶入收件者、主旨與內文，由對方確認後自己按下寄出，不會自動寄信。沒有副本欄位，要讓多人收到可以填共用的群組信箱。</p>
      </HelpTip>
      <input :id="`${uid}-to`" v-model="f.to" :aria-describedby="`${uid}-help`" class="input-base mt-1" type="email" />
    </div>
    <label class="block"><span class="text-sm text-muted">主旨</span><input v-model="f.subject" class="input-base mt-1" /></label>
    <label class="block"><span class="text-sm text-muted">內文</span><textarea v-model="f.body" rows="3" class="input-base mt-1" /></label>
  </div>
</template>
