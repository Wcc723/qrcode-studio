<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { guideBySlug } from '@/content/guides'
import { useSeoHead } from '@/composables/useSeoHead'
const route = useRoute()
const g = computed(() => guideBySlug[route.params.slug as string])
useSeoHead({ title: g.value.title, description: g.value.description, path: `/guide/${g.value.slug}` })
</script>
<template>
  <article class="max-w-screen-md mx-auto px-4 py-10">
    <h1 class="text-2xl md:text-3xl font-700 text-ink">{{ g.title }}</h1>
    <div class="mt-4 text-muted leading-7" v-html="g.bodyHtml" />
    <RouterLink to="/" class="btn-primary inline-block mt-8">開始製作 QR Code</RouterLink>
  </article>
</template>
