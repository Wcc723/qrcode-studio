<script setup lang="ts">
/**
 * 頁尾本站專屬區的一欄（DefaultLayout.vue 傳給共用頁尾的 slot）：手機收合成可展開的標題，桌機一律展開。
 * 2026-11 站長裁示：手機頁尾的連結一路排下去太長。
 *
 * 寫法照 WAI-ARIA 的手風琴（標題裡放按鈕），不用 <details>：h2 放在 <summary> 裡，部分報讀器會把它當按鈕的一部分，
 * 標題清單裡就找不到；桌機也不該有一顆按了沒反應的「按鈕」。
 * - 預渲染與桌機（wide）：純標題加清單，連結全部看得到，爬蟲與還沒跑 JS 的人也一樣。
 * - 掛載後的手機：標題換成按鈕（aria-expanded、aria-controls），清單收起；寬度由 DefaultLayout 在 onMounted 之後才讀（hydrate 規則）。
 * 樣式在 main.css 的 .foot-toggle；按鈕至少 48px 高、字 16px，符合頁尾「每個連結至少 44px、字 16px 以上」。
 */
import { ref } from 'vue'

defineProps<{
  title: string
  /**
   * 清單的 id（按鈕的 aria-controls 指到它）。頁尾每頁只有一份，所以用固定的字；不用 useId：
   * 頁尾前面只要有元件 hydrate 對不上，流水號就會錯開，清單留著伺服器給的 id，掛載後的按鈕卻指到別的號碼
   */
  listId: string
  /** 768px 以上（或還沒掛載）：一律展開，不出現按鈕 */
  wide: boolean
  listClass: string
}>()

const open = ref(false)
</script>
<template>
  <section>
    <h2 v-if="wide" class="font-display font-700 text-ink text-base">{{ title }}</h2>
    <h2 v-else class="font-display font-700 text-ink text-base"><button type="button" class="foot-toggle" :aria-expanded="open" :aria-controls="listId" @click="open = !open">{{ title }}<span class="i-lucide-chevron-down foot-chevron text-muted" aria-hidden="true" /></button></h2>
    <ul v-show="wide || open" :id="listId" :class="listClass">
      <slot />
    </ul>
    <slot name="after" />
  </section>
</template>
