<script setup lang="ts">
import HelpTip from '../HelpTip.vue'
import { ref, watch, useId } from 'vue'
import { buildUrl, type UrlInputData } from '@/pure/buildUrl'
import { useUiCopy } from '@/locales/ui'
const emit = defineEmits<{ 'update:payload': [string] }>()
const props = defineProps<{ initial?: UrlInputData }>()
const url = ref(props.initial?.url ?? '')
const uid = useId()
const t = useUiCopy().generator.url
watch(url, () => emit('update:payload', buildUrl({ url: url.value })), { immediate: true })
</script>
<template>
  <div>
    <HelpTip :name="t.label" :id="`${uid}-help`">
      <template #head><label :for="uid" class="text-sm text-muted">{{ t.label }}</label></template>
      <p>{{ t.help }}</p>
    </HelpTip>
    <input :id="uid" v-model="url" :aria-describedby="`${uid}-help`" class="input-base mt-1" type="url" placeholder="https://example.com" />
  </div>
</template>
