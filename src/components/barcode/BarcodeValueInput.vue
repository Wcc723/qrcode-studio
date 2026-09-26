<script setup lang="ts">
import type { SymbologyMeta } from '@/config/symbologies'

defineProps<{
  modelValue: string
  meta: SymbologyMeta
  error: string | null
  notice: string | null
  liveMessage: string
}>()
const emit = defineEmits<{ 'update:modelValue': [string]; flush: [] }>()
</script>

<template>
  <div class="min-w-0">
    <!-- 隱含 label 包住 input，與 WifiInput／UrlInput 同一種寫法。不用 placeholder 當標籤。 -->
    <label class="block">
      <span class="text-sm text-muted">條碼內容</span>
      <input
        :value="modelValue" data-test="bc-value"
        class="input-base mt-1 font-mono tabular-nums"
        type="text"
        :inputmode="meta.numericOnly ? 'numeric' : 'text'"
        :placeholder="meta.placeholder"
        :maxlength="meta.maxLen"
        :aria-invalid="!!error"
        aria-describedby="bc-hint bc-status"
        autocomplete="off" autocapitalize="off" spellcheck="false"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="emit('flush')" />
    </label>

    <p id="bc-hint" data-test="bc-hint" class="text-xs text-muted font-600 mt-1 break-all">
      {{ meta.rule }}
    </p>

    <!--
      live region 必須「先存在、後填入」才會被播報，所以這個容器永遠渲染，
      只換裡面的內容；aria-describedby 指到的 id 也因此永遠存在。
      用 polite 而非 assertive／role="alert"：訊息隨按鍵變動，assertive 會不停打斷。
    -->
    <div id="bc-status" data-test="bc-status" aria-live="polite" class="mt-1 min-h-[1.5rem]">
      <span class="sr-only">{{ liveMessage }}</span>
      <p v-if="error" data-test="bc-error" aria-hidden="true" class="text-rose-600 text-sm font-700 break-all">
        <span class="i-lucide-circle-alert mr-1" aria-hidden="true" />{{ error }}
      </p>
      <p v-else-if="notice" data-test="bc-notice" aria-hidden="true" class="text-ink text-sm font-700 break-all">
        <span class="i-lucide-circle-check mr-1 text-emerald-700" aria-hidden="true" />{{ notice }}
      </p>
    </div>
  </div>
</template>
