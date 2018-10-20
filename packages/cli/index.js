#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const yaml = require('js-yaml')
const program = require('commander')
const { parse } = require('@marklet/parser')
const { edit, watch } = require('@marklet/dev-server')
const { description, version } = require('./package.json')
const Marklet = { parse, edit, watch }

program
  .name('marklet')
  .version(version, '-v, --version')
  .description(description)
  .usage('marklet [filepath|dirpath] [options]')
  .option('-m, --mode [mode]', 'Choose between parse, watch and edit mode', /^(parse|watch|edit)$/i, 'parse')
  .option('-s, --source [path]', 'Read text from file')
  .option('-i, --input [text]', 'Read text directly from stdin', '')
  .option('-d, --dest [path]', 'Write parsed data to file instead of stdin')
  .option('-p, --port [port]', 'Port for the development server', parseInt)
  .option('-l, --default-language [language]', 'Default language in code block', '')
  .option('-H, --no-header-align', 'Disable header to align at center')
  .option('-S, --no-section', 'Disallow section syntax')
  .parse(process.argv)

let basePath
if (!program.args.length) {
  basePath = process.cwd()
} else {
  basePath = path.resolve(process.cwd(), program.args[0])
}

function loadFromFile(filepath) {
  try {
    if (['.yml', '.yaml'].includes(path.extname(filepath))) {
      return yaml.safeLoad(fs.readFileSync(filepath).toString())
    } else {
      return require(filepath)
    }
  } catch (error) {
    if (program.args.length) {
      process.stderr.write(chalk.red('ERROR: '))
      console.error(error)
    }
    return {}
  }
}

let options = {}
if (fs.existsSync(basePath)) {
  const stat = fs.statSync(basePath)
  if (stat.isFile()) {
    options = loadFromFile(basePath)
  } else {
    options = loadFromFile(path.join(basePath, 'marklet'))
  }
}

switch (program.mode) {
case 'parse': {
  const result = Marklet.parse({
    ...options,
    source: program.source,
    input: program.input,
    dest: program.dest,
    config: {
      header_align: program.headerAlign,
      allow_section: program.section,
      default_language: program.defaultLanguage,
    },
  })
  if (!program.dest) {
    console.log(JSON.stringify(result, null, 2))
  }
  break
}
case 'watch':
case 'edit': {
  Marklet[program.mode]({
    ...options,
    source: program.source,
    port: program.port,
  })
  break
}}
