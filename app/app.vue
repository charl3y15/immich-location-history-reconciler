<script setup lang="ts">
import { NuxtLink } from "#components";
</script>

<template>
  <div class="p-4">
    <header class="mb-4">
      <h1 class="text-xl">Immich location history reconciler</h1>
      <Button :as="NuxtLink" to="/" variant="link">Locations fixer</Button>
      <Button :as="NuxtLink" to="/timestamps" variant="link">
        Timestamps fixer
      </Button>
    </header>
    <NuxtPage />
  </div>
</template>
