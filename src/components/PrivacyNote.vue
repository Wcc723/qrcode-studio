<script setup lang="ts">
/**
 * 工具卡頂部的隱私說明：畫面上只留一行，完整說明收在旁邊的「?」。
 * 以前同一句「不傳雲端」在標題貼紙、預覽框與頁尾各出現一次，現在工具裡只剩這一處（頁尾那行保留）。
 * 說明內容要跟隱私權政策一致：只描述程式真的做到的事。
 */
import HelpTip from './HelpTip.vue'
import { publisher } from '@/config/site'
import { useLocale } from '@/i18n/locale'
import { useUiCopy } from '@/locales/ui'

defineProps<{ mode: 'generate' | 'barcode' | 'scan' | 'batch' }>()
const locale = useLocale().value
const t = useUiCopy().privacy
</script>

<template>
  <div data-test="privacy-note" class="text-sm font-700 text-ink">
    <HelpTip :name="mode === 'scan' ? t.name.scan : t.name.other">
      <template #head>
        <p class="inline-flex items-center gap-1.5">
          <span class="icon-badge-sm bg-pop-mint"><span class="i-lucide-lock" aria-hidden="true" /></span>
          {{ mode === 'scan' ? t.line.scan : t.line.other }}
        </p>
      </template>
      <p v-if="mode === 'generate'">{{ t.generate }}</p>
      <p v-else-if="mode === 'barcode'">{{ t.barcode }}</p>
      <p v-else-if="mode === 'batch'">{{ t.batch }}</p>
      <p v-else>{{ t.scan }}</p>
      <!-- 英文版連到 hub 的英文隱私權政策（本站的隱私權頁只有繁中） -->
      <p v-if="locale === 'en'">{{ t.stats.before }}<a :href="publisher.privacyUrlEn">{{ t.stats.link }}</a>{{ t.stats.after }}</p>
      <p v-else>{{ t.stats.before }}<RouterLink to="/privacy/">{{ t.stats.link }}</RouterLink>{{ t.stats.after }}</p>
    </HelpTip>
  </div>
</template>
