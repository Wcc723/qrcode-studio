<script setup lang="ts">
import { reactive, watch } from 'vue'
import { buildEmail } from '@/pure/buildEmail'
const emit = defineEmits<{ 'update:payload': [string] }>()
const f = reactive({ to: '', subject: '', body: '' })
watch(f, () => emit('update:payload', buildEmail({ ...f })), { immediate: true, deep: true })
</script>
<template>
  <div class="space-y-3">
    <label class="block"><span class="text-sm text-muted">收件者</span><input v-model="f.to" class="input-base mt-1" type="email" /></label>
    <label class="block"><span class="text-sm text-muted">主旨</span><input v-model="f.subject" class="input-base mt-1" /></label>
    <label class="block"><span class="text-sm text-muted">內文</span><textarea v-model="f.body" rows="3" class="input-base mt-1" /></label>
  </div>
</template>
