# Marklet

[![Build Status](https://travis-ci.com/obstudio/Marklet.svg?branch=dev)](https://travis-ci.com/obstudio/Marklet)
[![dependency](https://img.shields.io/david/obstudio/Marklet.svg)](https://github.com/obstudio/Marklet/blob/master/package.json)
[![npm](https://img.shields.io/npm/v/markletjs.svg)](https://www.npmjs.com/package/markletjs)
[![npm bundle size (minified)](https://img.shields.io/bundlephobia/min/markletjs.svg)](https://www.npmjs.com/package/markletjs)

A markup language designed for API manual pages.

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
