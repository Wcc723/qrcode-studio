<script setup lang="ts">
import HelpTip from '../HelpTip.vue'
import { ref, watch, useId } from 'vue'
import { buildPhone, type PhoneInputData } from '@/pure/buildPhone'
const emit = defineEmits<{ 'update:payload': [string] }>()
const props = defineProps<{ initial?: PhoneInputData }>()
const number = ref(props.initial?.number ?? '')
const uid = useId()
watch(number, () => emit('update:payload', buildPhone({ number: number.value })), { immediate: true })
</script>
<template>
  <div>
    <HelpTip name="電話號碼" :id="`${uid}-help`">
      <template #head><label :for="uid" class="text-sm text-muted">電話號碼</label></template>
      <p>掃描後手機會跳到撥號畫面並帶好號碼，由對方按下才撥出。空格與連字號會自動去掉。</p>
      <p>要給國外的人掃，改用國際格式：+886 加上去掉開頭 0 的號碼，例如 0912-345-678 寫成 +886912345678。</p>
    </HelpTip>
    <input :id="uid" v-model="number" :aria-describedby="`${uid}-help`" class="input-base mt-1" type="tel" placeholder="0912345678" />
  </div>
</template>
