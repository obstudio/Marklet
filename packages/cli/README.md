# @marklet/cli

[![Build Status](https://travis-ci.com/obstudio/Marklet.svg?branch=dev)](https://travis-ci.com/obstudio/Marklet)
[![dependency](https://img.shields.io/david/obstudio/Marklet.svg?path=packages%2Fcli)](https://github.com/obstudio/Marklet/blob/master/packages/cli/package.json)
[![npm](https://img.shields.io/npm/v/@marklet/cli.svg)](https://www.npmjs.com/package/@marklet/cli)
[![npm bundle size (minified)](https://img.shields.io/bundlephobia/min/@marklet/cli.svg)](https://www.npmjs.com/package/@marklet/cli)

A command line interface for marklet.

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

## General options

### config options

```
  -l, --language [lang]  default language in codeblocks (default: "")
  -H, --no-header-align  disable header to align at center
  -S, --no-section       disallow section syntax
```

### server options

```
  -o, --open             open in the default browser
  -p, --port [port]      port for the development server (default: 10826)
```

## CLI Commands

### parse

```
Usage: marklet parse [options] <filepath>

Parse a marklet file into marklet AST.

Options:
  (support config options)
  -B, --no-bound         prevent from recording token bounds
  -f, --format [format]  the output format (default: "json")
  -i, --indent [length]  set the indent length (default: 2)
  -p, --pretty           pretty printed (it overrides all other options)
```

### edit

```
Usage: marklet edit [options] [filepath|dirpath]

Edit a marklet file or project.

Options:
  (support config options)
  (support server options)
```

### watch

```
Usage: marklet watch [options] [filepath|dirpath]

Watch a marklet file or project.

Options:
  (support config options)
  (support server options)
```
