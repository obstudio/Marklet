<template>
  <li>
    <span v-html="node.text"/>
    <mkl-list v-if="node.children" :node="node"/>
  </li>
</template>
