<script>

const LowerLatin = 'abcdefghijklmnopqrstuvwxyz'
const UpperLatin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LowerGreek = 'αβγδεζηθικλμνξοπρστυφχψω'
const UpperGreek = 'ΑΒΓΔΕΖΗΘΙΚ∧ΜΝΞΟ∏Ρ∑ΤΥΦΧΨΩ'

function getValue(dictionary, word) {
  const chars = word.split('')
  if (chars.some(char => !dictionary.includes(char))) return
  return chars.reduce((prev, curr) => {
    return prev * dictionary.length + dictionary.indexOf(curr) + 1
  }, 0)
}

module.exports = {
  props: ['node'],

  data: () => ({
    tag: 'ul',
    start: 1,
    type: '',
  }),

  watch: {
    node: 'parseBullet'
  },

  created() {
    this.parseBullet()
  },

  methods: {
    parseBullet() {
      const children = this.node.children
      const order = children.length ? children[0].order : ''
      if (order) {
        this.tag = 'ol'
        let value = Number(order)
        if (value === value) {
          if (order.startsWith('0') && order.length > 1) {
            this.type = 'decimal-leading-zero'
          } else {
            this.type = 'decimal'
          }
        } else if ((value = getValue(LowerGreek, order))) {
          this.type = 'lower-greek'
        } else if ((value = getValue(UpperGreek, order))) {
          this.type = 'upper-greek'
        } else if ((value = getValue(LowerLatin, order))) {
          this.type = 'lower-alpha'
        } else if ((value = getValue(UpperLatin, order))) {
          this.type = 'upper-alpha'
        } else {
          this.type = 'decimal'
          value = 1
        }
        this.start = value
      } else {
        this.tag = 'ul'
        this.start = ''
        this.type = ''
      }
    }
  }
}

</script>


<template>
  <component :is="tag" :start="start" :style="{ listStyleType: type }">
    <mkl-list-item v-for="(item, index) in node.children" :key="index" :node="item">
  </component>
</template>

<style lang="scss" scoped>

& {
  padding-left: 28px;
}

li {
  line-height: 1.6em;
}

</style>
