<script setup lang="ts">
import { onMounted, ref } from 'vue';

const config = ref<unknown>(null);
const error = ref('');

onMounted(async () => {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    config.value = await response.json();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error';
  }
});
</script>

<template>
  <main class="shell">
    <section class="panel">
      <p class="eyebrow">Sub Convert</p>
      <h1>配置文件读取示例</h1>
      <p class="description">
        Web 服务通过 NestJS 的 <code>/api/config</code> 接口读取 docker-compose 挂载的 public 配置目录。
      </p>

      <pre v-if="config">{{ JSON.stringify(config, null, 2) }}</pre>
      <p v-else-if="error" class="error">读取失败：{{ error }}</p>
      <p v-else>正在读取配置...</p>
    </section>
  </main>
</template>
