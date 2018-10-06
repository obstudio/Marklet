# Marklet

[![Build Status](https://travis-ci.com/obstudio/Marklet.svg?branch=dev)](https://travis-ci.com/obstudio/Marklet)
[![dependency](https://img.shields.io/david/obstudio/Marklet.svg)](https://github.com/obstudio/Marklet/blob/master/package.json)
[![npm](https://img.shields.io/npm/v/markletjs.svg)](https://www.npmjs.com/package/markletjs)
[![npm bundle size (minified)](https://img.shields.io/bundlephobia/min/markletjs.svg)](https://www.npmjs.com/package/markletjs)

A markup language designed for API manual pages.

## Packages

| package | version |
|:-------:|:-------:|
|[@marklet/cli](https://github.com/obstudio/Marklet/tree/master/packages/cli)|[![npm](https://img.shields.io/npm/v/@marklet/cli.svg)](https://www.npmjs.com/package/@marklet/cli)|
|[@marklet/core](https://github.com/obstudio/Marklet/tree/master/packages/core)|[![npm](https://img.shields.io/npm/v/@marklet/core.svg)](https://www.npmjs.com/package/@marklet/core)|
|[@marklet/dev-server](https://github.com/obstudio/Marklet/tree/master/packages/dev-server)|[![npm](https://img.shields.io/npm/v/@marklet/dev-server.svg)](https://www.npmjs.com/package/@marklet/dev-server)|
|[@marklet/monaco](https://github.com/obstudio/Marklet/tree/master/packages/monaco)|[![npm](https://img.shields.io/npm/v/@marklet/monaco.svg)](https://www.npmjs.com/package/@marklet/monaco)|
|[@marklet/parser](https://github.com/obstudio/Marklet/tree/master/packages/parser)|[![npm](https://img.shields.io/npm/v/@marklet/parser.svg)](https://www.npmjs.com/package/@marklet/parser)|
|[@marklet/renderer](https://github.com/obstudio/Marklet/tree/master/packages/renderer)|[![npm](https://img.shields.io/npm/v/@marklet/renderer.svg)](https://www.npmjs.com/package/@marklet/renderer)|

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

