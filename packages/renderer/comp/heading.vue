<template>
  <component :is="'h' + node.level" v-html="node.text" :class="{ centered: node.center }"/>
</template>

<style lang="scss">

h1, h2, h3, h4 {
  margin-top: 24px;
  font-weight: bold;
  line-height: 1.25;
}

h1 {
  font-size: 2em;
  padding-top: 0.6em;
  padding-bottom: 0.3em;
}

h2 {
  font-size: 1.5em;
  padding-top: 0.3em;
  padding-bottom: 0.3em;
}

h1, h2 { margin-bottom: 12px }
h3, h4 { margin-bottom: 16px }
h3 { font-size: 1.25em }
h4 { font-size: 1em }

</style>

