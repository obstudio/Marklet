# Marklet
[![Build Status](https://travis-ci.com/obstudio/Marklet.svg?branch=dev)](https://travis-ci.com/obstudio/Marklet)
[![dependency](https://img.shields.io/david/obstudio/Marklet.svg)](https://github.com/obstudio/Marklet/blob/master/package.json)
[![npm](https://img.shields.io/npm/v/markletjs.svg)](https://www.npmjs.com/package/markletjs)
[![npm bundle size (minified)](https://img.shields.io/bundlephobia/min/markletjs.svg)](https://www.npmjs.com/package/markletjs)

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

