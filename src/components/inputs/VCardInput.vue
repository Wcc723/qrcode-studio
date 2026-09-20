<script setup lang="ts">
import { reactive, watch } from 'vue'
import { buildVCard, type VCardInputData } from '@/pure/buildVCard'
const emit = defineEmits<{ 'update:payload': [string] }>()
const props = defineProps<{ initial?: VCardInputData }>()
const f = reactive<VCardInputData>({
  firstName: '', lastName: '', phone: '', email: '', org: '', title: '', address: '', website: '',
  ...props.initial,
})
watch(f, () => emit('update:payload', buildVCard({ ...f })), { immediate: true, deep: true })
</script>
<template>
  <div class="grid grid-cols-2 gap-3">
    <label class="block"><span class="text-sm text-muted">名</span><input v-model="f.firstName" class="input-base mt-1" /></label>
    <label class="block"><span class="text-sm text-muted">姓</span><input v-model="f.lastName" class="input-base mt-1" /></label>
    <label class="block"><span class="text-sm text-muted">電話</span><input v-model="f.phone" class="input-base mt-1" /></label>
    <label class="block"><span class="text-sm text-muted">Email</span><input v-model="f.email" class="input-base mt-1" /></label>
    <label class="block"><span class="text-sm text-muted">公司</span><input v-model="f.org" class="input-base mt-1" /></label>
    <label class="block"><span class="text-sm text-muted">職稱</span><input v-model="f.title" class="input-base mt-1" /></label>
    <label class="block col-span-2"><span class="text-sm text-muted">地址</span><input v-model="f.address" class="input-base mt-1" /></label>
    <label class="block col-span-2"><span class="text-sm text-muted">網站</span><input v-model="f.website" class="input-base mt-1" /></label>
  </div>
</template>
