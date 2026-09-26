<script setup lang="ts">
import HelpTip from '../HelpTip.vue'
import { ref, watch, useId } from 'vue'
import { buildUrl, type UrlInputData } from '@/pure/buildUrl'
const emit = defineEmits<{ 'update:payload': [string] }>()
const props = defineProps<{ initial?: UrlInputData }>()
const url = ref(props.initial?.url ?? '')
const uid = useId()
watch(url, () => emit('update:payload', buildUrl({ url: url.value })), { immediate: true })
</script>
<template>
  <div>
    <HelpTip name="網址" :id="`${uid}-help`">
      <template #head><label :for="uid" class="text-sm text-muted">網址</label></template>
      <p>開頭沒有 https:// 的話會自動補上。網址越長，QR Code 的圖案越密，要印得小可以先換成短網址；網址後面的追蹤參數（例如 ?utm_source=poster）會原樣編進去。</p>
    </HelpTip>
    <input :id="uid" v-model="url" :aria-describedby="`${uid}-help`" class="input-base mt-1" type="url" placeholder="https://example.com" />
  </div>
</template>
