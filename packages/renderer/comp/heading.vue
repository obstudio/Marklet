<template>
  <h2 v-html="node.text" :class="[ 'level-' + node.level, { centered: node.center }]"/>
</template>

<style lang="scss" scoped>

& {
  margin-top: 24px;
  font-weight: bold;
  line-height: 1.25;

  &.level-1 {
    font-size: 2em;
    padding-top: 0.6em;
    padding-bottom: 0.3em;
  }

  &.level-2 {
    font-size: 1.5em;
    padding-top: 0.3em;
    padding-bottom: 0.3em;
  }

  &.level-1, &.level-2 {
    margin-bottom: 12px;
  }

  &.level-3, &.level-4 {
    margin-bottom: 0;
  }

  &.level-3 {
    font-size: 1.25em;
  }

  &.level-4 {
    font-size: 1em;
  }
}

</style>

