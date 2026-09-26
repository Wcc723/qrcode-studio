<script setup lang="ts">
/**
 * 欄名旁的「?」：工具區裡長、而且不看也能把欄位填完的說明收在這裡，點了才展開。
 * 從口袋工具站群另一個計算機工具的同名元件複製過來，行為與它一致。
 *
 * - `#head` 放欄名（`<label>`，或群組標題、隱私說明那一行），「?」接在它右邊。
 * - 說明在欄名下方、欄位上方展開，把下面的內容往下推；不做浮層，手機與窄欄裡都不會被切掉。
 * - 收起來是 `hidden`，文字仍在 DOM 與預渲染的 HTML 裡。輸入欄要把 `id`（說明框的 id）放進
 *   aria-describedby：被引用的隱藏節點照樣算進描述，收著的時候報讀器也念得到。
 * - 按鈕是原生 button，Enter／Space 開合；Esc 收起並把焦點還給按鈕。收著的時候不攔 Esc。
 * - 點擊時主動把焦點放到按鈕上：Mac 的 Safari 用滑鼠點按鈕不給焦點，按鍵事件落在 body，
 *   按鈕與說明框上的 Esc 監聽收不到。不改用 document 層的監聽：那會連帶收掉旁邊開著的其他說明。
 *
 * 什麼可以收進來、什麼必須留在畫面上，見 AGENTS.md「工具區與說明文章」與 src/helpNotes.test.ts。
 */
import { ref, useId } from 'vue'

const props = defineProps<{
  /** 按鈕的無障礙名稱是「{name}的說明」 */
  name: string
  /** 說明框的 id；不給就自己產一個 */
  id?: string
}>()

const uid = useId()
const panelId = props.id ?? `help-${uid}`
const open = ref(false)
const btn = ref<HTMLButtonElement | null>(null)

function toggle(): void {
  open.value = !open.value
  // 已經有焦點（鍵盤、Chromium 的滑鼠點）時是空操作。preventScroll：iOS 點下去不要捲動
  btn.value?.focus({ preventScroll: true })
}

function onEsc(e: KeyboardEvent): void {
  if (!open.value) return
  e.stopPropagation()
  open.value = false
  btn.value?.focus()
}
</script>

<template>
  <div class="field-head">
    <slot name="head" />
    <button
      ref="btn"
      type="button"
      class="help-tip-btn"
      :aria-expanded="open"
      :aria-controls="panelId"
      :aria-label="`${name}的說明`"
      @click="toggle"
      @keydown.esc="onEsc"
    >
      <span class="help-tip-mark" aria-hidden="true">?</span>
    </button>
  </div>
  <div :id="panelId" class="help-tip-panel" :hidden="!open" @keydown.esc="onEsc"><slot /></div>
</template>
