<script>

module.exports = {
  props: {
    value: Boolean,
    label: String,
    disabled: Boolean,
  },

  model: {
    prop: 'value',
    event: 'change',
  },

  data: () => ({
    focused: false,
  }),

  methods: {
    onFocus(event) {
      this.focused = true
      this.$emit('focus', event)
    },
    onBlur(event) {
      this.focused = false
      this.$emit('blur', event)
    },
  },
}

</script>

<template>
  <label class="marklet-checkbox" :class="{ focused, disabled, checked: value }">
    <span class="box">
      <span class="inner"></span>
      <input type="checkbox" :disabled="disabled" :value="label" v-model="value"
        @change="$emit('change', $event.target.checked)" @focus="onFocus" @blur="onBlur">
    </span>
    <span class="label" v-if="$slots.default || label">
      <slot/>
      <template v-if="!$slots.default">{{ label }}</template>
    </span>
  </label>
</template>

<style lang="scss" scoped>

& {
  font-size: 14px;
  cursor: pointer;
  user-select: none;
  display: inline-block;
  transition: 0.3s ease;
  line-height: 1em;

  > .box {
    outline: 0;
    line-height: 1em;
    vertical-align: sub;

    > .inner {
      position: relative;
      display: inline-block;
      box-sizing: border-box;
      transition: 0.3s ease;
      border: 0.07em solid;
      border-radius: 2px;
      width: 1em;
      height: 1em;
    }

    > .inner::after {
      content: "";
      box-sizing: content-box;
      border: 0.07em solid;
      border-left: 0;
      border-top: 0;
      height: 0.5em;
      left: 0.29em;
      top: 0.08em;
      width: 0.21em;
      position: absolute;
      transform: rotate(45deg) scaleY(0);
      transition: transform .15s ease-in .05s;
      transform-origin: center;
    }

    > input {
      position: absolute;
      opacity: 0;
      outline: 0;
      margin: 0;
      width: 0;
      height: 0;
      z-index: -1;
    }
  }

  > .label {
    line-height: 1em;
    margin-left: 4px;
    vertical-align: middle;
  }

  &.checked > .box > .inner::after {
    transform: rotate(45deg) scaleY(1);
  }
}

</style>
