<template>
  <div>
    <blockquote v-for="(usage, index) in node.content" :key="index">
      <span v-html="usage.text"/>
      <br/>
      <span v-html="usage.detail"/>
    </blockquote>
  </div>
</template>

<style lang="scss" scoped>

blockquote {
  border: 1px solid !important;
  margin: 0 0 -1px 0;
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

