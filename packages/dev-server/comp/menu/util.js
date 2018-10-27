function locateAtTopBottom(rect, style) {
  if (rect.left + 200 > innerWidth) {
    style.left = rect.left + rect.width - 200 + 'px'
  } else {
    style.left = rect.left + 'px'
  }
  style.top = rect.top + rect.height + 'px'
}

function locateAtLeftRight(style, ref) {
  if (ref.offsetRight + 200 > innerWidth) {
    style.left = null
    style.right = ref.offsetLeft + 'px'
  } else {
    style.right = null
    style.left = ref.offsetLeft + ref.offsetWidth + 'px'
  }
  style.top = ref.offsetTop + 'px'
}

function locateAtMouseEvent(event, style) {
  if (event.clientX + 200 > innerWidth) {
    style.left = event.clientX - 200 + 'px'
  } else {
    style.left = event.clientX + 'px'
  }
  if (event.clientY > innerHeight / 2) {
    style.top = ''
    style.bottom = innerHeight - event.clientY + 'px'
  } else {
    style.top = event.clientY + 'px'
    style.bottom = ''
  }
}

module.exports = {
  locateAtLeftRight,
  locateAtTopBottom,
  locateAtMouseEvent,
}
