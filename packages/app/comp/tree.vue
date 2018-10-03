<script>

module.exports = {
  props: ['ast'],
}

</script>

<template>
  <div>
    <div v-for="(node, index) in ast" :key="index">
      {{ JSON.stringify(node) }}
    </div>
  </div>
</template>

