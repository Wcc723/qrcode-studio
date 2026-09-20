<script setup lang="ts">
/**
 * 解碼結果的呈現。三個不可妥協的點：
 *
 * 1. **全部走文字節點**（`{{ }}` 與 `v-text`），完全不用 `v-html`／`innerHTML`。
 *    解碼內容是別人做的 QR，內容完全不可信；一旦走 HTML 就是把別人的字串
 *    當程式碼跑。原樣顯示反而是這裡的功能：使用者要看到的就是真正的原文。
 * 2. **只有 http/https 給得出 href**。javascript:／data:／file: 這些只顯示 scheme，
 *    連可點的元素都不產生，使用者不可能「不小心按到」。
 * 3. **多碼時不提供任何單一結果的動作**，型別上就拿不到 result。
 */
import { computed } from 'vue'
import type { ScanOutcome } from '@/pure/scanResult'
import { useCopyText } from '@/composables/useCopyText'

const props = defineProps<{ outcome: ScanOutcome }>()
const emit = defineEmits<{ regenerate: [] }>()

const { copied, error: copyError, copy } = useCopyText()

const single = computed(() => (props.outcome.status === 'single' ? props.outcome.result : null))
const parsedKindLabel: Record<string, string> = {
  url: '網址', wifi: 'WiFi', vcard: '電子名片', text: '純文字',
  email: 'Email', phone: '電話', sms: '簡訊',
}

/** 一維碼一定交棒到條碼產生器；QR 只有解析得出型別時才給「重新產生」。 */
const canRegenerate = computed(() => !!single.value && (single.value.isLinear || !!single.value.parsed))
</script>

<template>
  <div class="mt-5">
    <!-- 單一結果 -->
    <div v-if="single" data-test="scan-single" class="card p-4">
      <div class="flex flex-wrap items-center gap-2">
        <span class="chip bg-pop-mint" data-test="scan-format">{{ single.formatLabel }}</span>
        <span v-if="single.parsed" class="chip bg-pop-sky" data-test="scan-kind">
          {{ parsedKindLabel[single.parsed.kind] }}
        </span>
      </div>

      <p class="text-sm text-muted font-600 mt-3">內容</p>
      <p data-test="scan-result-text"
        class="mt-1 p-3 rounded-xl bg-white border-2 border-ink/15 font-mono text-sm text-ink break-all whitespace-pre-wrap">{{ single.text }}</p>

      <!-- 網址：先講清楚會去哪，再決定給不給點 -->
      <div v-if="single.uri.scheme" class="mt-3 text-sm font-600">
        <p class="text-muted">
          通訊協定：<span data-test="scan-uri-scheme" class="text-ink">{{ single.uri.scheme }}</span>
        </p>
        <p v-if="single.uri.host" class="text-muted mt-1">
          網站主機：<span data-test="scan-uri-host" class="text-ink break-all">{{ single.uri.host }}</span>
        </p>
        <p v-if="!single.uri.openable" data-test="scan-unsafe-scheme"
          class="mt-2 text-ink/80 bg-pop-sun/40 border-2 border-ink/15 rounded-xl p-3 leading-relaxed">
          這是 {{ single.uri.scheme }} 開頭的內容，不是一般網址。本工具只對 http 與 https
          提供直接開啟，其餘一律只顯示文字，請自行判斷是否可信。
        </p>
      </div>

      <div class="flex flex-wrap gap-2 mt-4">
        <button type="button" data-test="scan-copy" class="btn-primary !bg-pop-sky"
          @click="copy(single.text)">
          {{ copied ? '✓ 已複製' : '複製內容' }}
        </button>
        <a v-if="single.uri.openable && single.uri.href" data-test="scan-open"
          class="btn-primary !bg-pop-mint" :href="single.uri.href" target="_blank" rel="noopener noreferrer">
          在新分頁開啟
        </a>
        <button v-if="canRegenerate" type="button" data-test="scan-regenerate"
          class="btn-primary !bg-pop-sun" @click="emit('regenerate')">
          用此內容重新產生
        </button>
      </div>
      <p v-if="copyError" data-test="scan-copy-error" class="text-sm text-muted font-600 mt-2">{{ copyError }}</p>
    </div>

    <!-- 多碼 -->
    <div v-else-if="outcome.status === 'multiple'" data-test="scan-multiple" class="card p-4">
      <p class="font-700 text-ink">這張圖裡有 {{ outcome.count }} 個條碼</p>
      <p class="text-muted font-600 mt-2 leading-relaxed">
        第一版不猜你想要哪一個，所以不顯示結果。請把圖裁切成只剩一個條碼再試一次。
        <template v-if="outcome.formatLabels.length">
          （偵測到的格式：{{ outcome.formatLabels.join('、') }}）
        </template>
      </p>
    </div>

    <!-- 有碼但不支援 -->
    <div v-else-if="outcome.status === 'unsupported'" data-test="scan-unsupported" class="card p-4">
      <p class="font-700 text-ink">讀到條碼了，但格式不在支援範圍</p>
      <p class="text-muted font-600 mt-2 leading-relaxed">
        本工具支援 QR Code、Code 128、EAN-13、EAN-8、Code 39 與 ITF-14。
      </p>
    </div>

    <!-- 讀不到 -->
    <div v-else data-test="scan-none" class="card p-4">
      <p class="font-700 text-ink">沒有在這張圖裡讀到條碼</p>
      <p class="text-muted font-600 mt-2 leading-relaxed">
        可以試試：把條碼那一塊裁切出來、換一張更清楚的圖，或確認條碼沒有被裁掉邊緣的留白。
      </p>
    </div>
  </div>
</template>
