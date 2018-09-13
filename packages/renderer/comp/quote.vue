<template>
  <nodes tag="blockquote" :class="node.style" :content="node.content"/>
</template>

<style lang="scss" scoped>

  & {
    margin: 0 0 16px;
    padding: 4px 1em;
    border-left: 0.25em solid;

    > :first-child { margin-top: 0 }
    > :last-child { margin-bottom: 0 }
    code { background-color: inherit !important }
  }

</style>

