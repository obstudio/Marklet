# Marklet

A markup language designed for API manual pages.

## Node

```shell
npm i marklet
```

```javascript
const Marklet = require('marklet')
Marklet.watch({ source: 'path/to/file' })
```

## Web

```html
<script src="marklet.dist.js"></script>
```

```html
<div id="#editor"></div>
<script>
  window.marklet.start({ el: '#editor' })
</script>
```

