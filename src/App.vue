<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useHead } from '@unhead/vue'
useHead({ htmlAttrs: { lang: 'zh-Hant-TW' } })
</script>
<template>
  <DefaultLayout><RouterView /></DefaultLayout>
</template>
