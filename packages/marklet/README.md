# Marklet

[![Build Status](https://travis-ci.com/obstudio/Marklet.svg?branch=dev)](https://travis-ci.com/obstudio/Marklet)
[![dependency](https://img.shields.io/david/obstudio/Marklet.svg)](https://github.com/obstudio/Marklet/blob/master/package.json)
[![npm](https://img.shields.io/npm/v/markletjs.svg)](https://www.npmjs.com/package/markletjs)
[![npm bundle size (minified)](https://img.shields.io/bundlephobia/min/markletjs.svg)](https://www.npmjs.com/package/markletjs)

A markup language designed for API manual pages.

## Usage: CLI

```
Usage: marklet [options] [command]

A command line interface for marklet.

Options:
  -v, --version                       output the version number
  -h, --help                          output usage information

Commands:
  parse [options] [filepath]          Parse a marklet file into marklet AST.
  edit [options] [filepath|dirpath]   Edit a marklet file or project.
  watch [options] [filepath|dirpath]  Watch a marklet file or project.
```

See details [here](https://github.com/obstudio/Marklet/blob/master/packages/cli/README.md).

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
