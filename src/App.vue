<script setup lang="ts">
import { computed, provide, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useHead } from '@unhead/vue'
import { buildOrganizationLd } from '@/composables/useSeoHead'
import { LANG_TAG, LOCALE_KEY, localeOfMeta, type Locale } from '@/i18n/locale'
import { switchTarget } from '@/i18n/pairs'

// 語系只看路由的 meta.locale（英文頁才有），provide 給整棵元件樹，vue-i18n 的 locale 跟著同步。
const route = useRoute()
const locale = computed<Locale>(() => localeOfMeta(route.meta))
provide(LOCALE_KEY, locale)
const i18n = useI18n({ useScope: 'global' })
watch(locale, (v) => { i18n.locale.value = v }, { immediate: true })

/** 頁首的語言切換：另一個語系的同一頁，沒有對應頁就連到那個語系的首頁 */
const switchTo = computed(() => switchTarget(route.path, locale.value === 'en' ? 'zh-TW' : 'en'))

useHead({
  htmlAttrs: { lang: computed(() => LANG_TAG[locale.value]) },
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(buildOrganizationLd()) }],
})
</script>
<template>
  <DefaultLayout :switch-to="switchTo"><RouterView :key="$route.path" /></DefaultLayout>
</template>
