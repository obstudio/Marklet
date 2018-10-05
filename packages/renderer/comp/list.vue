<script>

const LowerLatin = 'abcdefghijklmnopqrstuvwxyz'
const UpperLatin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LowerGreek = 'αβγδεζηθικλμνξοπρστυφχψω'
const UpperGreek = 'ΑΒΓΔΕΖΗΘΙΚ∧ΜΝΞΟ∏Ρ∑ΤΥΦΧΨΩ'
const LowerRoman = 'ivxlcdm'
const RomanMap = {
  i: 1,
  v: 5,
  x: 10,
  l: 50,
  c: 100,
  d: 500,
  m: 1000,
}

function getValue(dictionary, chars) {
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
        const chars = order.split('')
        let value = Number(order)
        if (value === value) {
          if (order.startsWith('0') && order.length > 1) {
            this.type = 'decimal-leading-zero'
          } else {
            this.type = 'decimal'
          }
        } else if (chars.every(char => LowerRoman.includes(char.toLowerCase()))) {
          if (order.charCodeAt(0) < 96) {
            this.type = 'upper-roman'
          } else {
            this.type = 'lower-roman'
          }
          const digits = chars.map(char => RomanMap[char.toLowerCase()])
          value = digits.reduce((prev, curr, index, array) => {
            return prev + curr * (curr < array[index + 1] ? -1 : 1)
          }, 0)
        } else if ((value = getValue(LowerGreek, chars))) {
          this.type = 'lower-greek'
        } else if ((value = getValue(UpperGreek, chars))) {
          this.type = 'upper-greek'
        } else if ((value = getValue(LowerLatin, chars))) {
          this.type = 'lower-alpha'
        } else if ((value = getValue(UpperLatin, chars))) {
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
