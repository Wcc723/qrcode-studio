<script setup lang="ts">
import HelpTip from '../HelpTip.vue'
import { ref, watch, useId } from 'vue'
import { buildText, type TextInputData } from '@/pure/buildText'
const emit = defineEmits<{ 'update:payload': [string] }>()
const props = defineProps<{ initial?: TextInputData }>()
const text = ref(props.initial?.text ?? '')
const uid = useId()
watch(text, () => emit('update:payload', buildText({ text: text.value })), { immediate: true })
</script>
<template>
  <div>
    <HelpTip name="文字內容" :id="`${uid}-help`">
      <template #head><label :for="uid" class="text-sm text-muted">文字內容</label></template>
      <p>掃描後手機會直接顯示這段文字，不會開啟任何網頁。內容越長圖案越密；中文一個字佔 3 個位元組，能放的字數大約是英文字母的三分之一，超出容量時預覽會提示。</p>
    </HelpTip>
    <textarea :id="uid" v-model="text" :aria-describedby="`${uid}-help`" rows="4" class="input-base mt-1" placeholder="輸入任意文字" />
  </div>
</template>
