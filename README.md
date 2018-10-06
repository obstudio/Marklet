# Marklet
[![Build Status](https://travis-ci.com/obstudio/Marklet.svg?branch=dev)](https://travis-ci.com/obstudio/Marklet)
[![dependency](https://img.shields.io/david/obstudio/Marklet.svg)](https://github.com/obstudio/Marklet/blob/master/package.json)
[![npm](https://img.shields.io/npm/v/markletjs.svg)](https://www.npmjs.com/package/markletjs)
[![npm bundle size (minified)](https://img.shields.io/bundlephobia/min/markletjs.svg)](https://www.npmjs.com/package/markletjs)

A markup language designed for API manual pages.

## Packages

- [markletjs](https://www.npmjs.com/package/markletjs): 1.2.0
- [@marklet/cli](https://www.npmjs.com/package/@marklet/cli): 1.1.14
- [@marklet/core](https://www.npmjs.com/package/@marklet/core): 3.2.1
- [@marklet/dev-server](https://www.npmjs.com/package/@marklet/dev-server): 1.0.21
- [@marklet/monaco](https://www.npmjs.com/package/@marklet/monaco): 1.2.0
- [@marklet/parser](https://www.npmjs.com/package/@marklet/parser): 1.5.0
- [@marklet/renderer](https://www.npmjs.com/package/@marklet/renderer): 1.3.0

## Usage: CLI

```
Usage: marklet [filepath|dirpath] [options]

Options:

  -v, --version                      output the version number
  -m, --mode [mode]                  Choose between parse, watch and edit mode (default: parse)
  -s, --source [path]                Read text from file
  -i, --input [text]                 Read text directly from stdin
  -d, --dest [path]                  Write parsed data to file instead of stdin
  -p, --port [port]                  Port for the development server
  -l, --default-language [language]  Default language in code block
  -H, --no-header-align              Disable header to align at center
  -S, --no-section                   Disallow section syntax
  -h, --help                         output usage information
```

## Usage: Node

```shell
npm i markletjs
```

```js
const Marklet = require('marklet')
Marklet.watch({ source: 'path/to/file' })
```

## Usage: Web

```html
<script src="marklet.dist.js"></script>
```

```html
<div id="#editor"></div>
<script>
  window.marklet.start({ el: '#editor' })
</script>
```

