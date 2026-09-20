<script setup lang="ts">
import { ref, watch } from 'vue'
import { buildUrl, type UrlInputData } from '@/pure/buildUrl'
const emit = defineEmits<{ 'update:payload': [string] }>()
const props = defineProps<{ initial?: UrlInputData }>()
const url = ref(props.initial?.url ?? '')
watch(url, () => emit('update:payload', buildUrl({ url: url.value })), { immediate: true })
</script>
<template>
  <label class="block">
    <span class="text-sm text-muted">網址</span>
    <input v-model="url" class="input-base mt-1" type="url" placeholder="https://example.com" />
  </label>
</template>
