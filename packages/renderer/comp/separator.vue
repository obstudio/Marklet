<template>
  <hr :class="[ node.style, { thick: node.thick }]">
</template>

<style lang="scss" scoped>

& {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  overflow: hidden;
  border: 0;

  &::before {
    display: table;
    content: "";
  }

  &::after {
    display: table;
    clear: both;
    content: "";
  }
}

</style>
