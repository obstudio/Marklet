<template>
  <div>
    <blockquote v-for="(usage, index) in node.content" :key="index">
      <template v-for="(comp, index) in usage">
        <component :is="comp.type" :node="comp" :key="index"/>
        <br :key="index"/>
      </template>
    </blockquote>
  </div>
</template>

<script>
  module.exports = { props: ['node'] }
</script>

<style lang="scss" scoped>

  blockquote {
    border: 1px solid !important;
    margin-bottom: -1px;
    padding: 8px 1em;

    &:first-child {
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
    }

    &:last-child {
      border-bottom-left-radius: 8px;
      border-bottom-right-radius: 8px;
      margin-bottom: 16px;
    }

    span:first-child {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
    }

    > br + span { padding-left: 16px }
    > br + span em { padding: 4px }
  }

</style>

