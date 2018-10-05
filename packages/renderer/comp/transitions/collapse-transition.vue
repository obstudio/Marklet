<script>

const { style, emit, store, restore } = require('./utils')

module.exports = {
  functional: true,
  
  props: {
    direction: {
      type: String,
      default: 'vertical',
    },
    duration: {
      type: Number,
      default: 0.3,
    },
    timingFunction: {
      type: String,
      default: 'ease-in-out',
    },
  },

  render(createElement, {
    props: {
      direction,
      duration,
      timingFunction,
    },
    listeners,
    children,
  }) {

    let length
    let paddingEnd
    let paddingStart
    let scrollLength
    
    if (direction === 'horizontal') {
      length = 'width'
      scrollLength = 'scrollWidth'
      paddingStart = 'paddingLeft'
      paddingEnd = 'paddingRight'
    } else {
      length = 'height'
      scrollLength = 'scrollHeight'
      paddingStart = 'paddingTop'
      paddingEnd = 'paddingBottom'
    }

    const transition = style([
      length, paddingEnd, paddingStart,
    ], duration, timingFunction)
    
    return createElement('transition', {
      attrs: { css: false },
      on: {
        beforeEnter(el) {
          emit(listeners, 'before-enter', el)
          store(el, ['transition', paddingEnd, paddingStart])
          el.style.transition = transition
          el.style[paddingStart] = '0'
          el.style[paddingEnd] = '0'
          el.style[length] = '0'
        },
        enter(el, done) {
          el.dataset.overflow = el.style.overflow
          restore(el, [paddingEnd, paddingStart])
          el.style[length] = el[scrollLength] ? el[scrollLength] + 'px' : ''
          el.style.overflow = 'hidden'
          setTimeout(done, 1000 * duration)
        },
        afterEnter(el) {
          el.style[length] = ''
          restore(el, ['overflow', 'transition'])
          emit(listeners, 'after-enter', el)
        },
        beforeLeave(el) {
          emit(listeners, 'before-leave', el)
          store(el, ['overflow', 'transition', paddingEnd, paddingStart])
          el.style[length] = el[scrollLength] + 'px'
          el.style.overflow = 'hidden'
        },
        leave(el, done) {
          if (el[scrollLength] !== 0) {
            el.style.transition = transition
            el.style[length] = '0'
            el.style[paddingEnd] = '0'
            el.style[paddingStart] = '0'
          }
          setTimeout(done, 1000 * duration)
        },
        afterLeave(el) {
          el.style[length] = ''
          restore(el, [paddingEnd, paddingStart, 'overflow', 'transition'])
          emit(listeners, 'after-leave', el)
        },
      }
    }, children)
  }
}

</script>