<script setup lang="ts">
import { ref, watch } from 'vue'
import { buildText } from '@/pure/buildText'
const emit = defineEmits<{ 'update:payload': [string] }>()
const text = ref('')
watch(text, () => emit('update:payload', buildText({ text: text.value })), { immediate: true })
</script>
<template>
  <label class="block">
    <span class="text-sm text-muted">文字內容</span>
    <textarea v-model="text" rows="4" class="input-base mt-1" placeholder="輸入任意文字" />
  </label>
</template>
