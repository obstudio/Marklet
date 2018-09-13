#!/usr/bin/env node

const program = require('commander')
// const chalk = require('chalk').default
const Marklet = require('../dist/Marklet')

program
  .name('marklet')
  .description('Marklet language command-line interface.')
  .version('1.0.0')
  .option('-m, --mode [mode]', 'Choose between parse, watch and edit mode', /^(parse|watch|edit)$/i, 'parse')
  .option('-s, --source [path]', 'Read text from file')
  .option('-i, --input [text]', 'Read text directly from stdin', '')
  .option('-d, --dest [path]', 'Write parsed data to file instead of stdin')
  .option('-p, --port [port]', 'Port for the development server', parseInt)
  .option('-l, --default-language [language]', 'Default language in code block', '')
  .option('-H, --no-header-align', 'Disable header to align at center')
  .option('-S, --no-section', 'Disallow section syntax')
  .parse(process.argv)

switch (program.mode) {
case 'parse': {
  const options = {
    source: program.source,
    input: program.input,
    dest: program.dest,
    config: {
      header_align: program.headerAlign,
      allow_section: program.section,
      default_language: program.defaultLanguage
    }
  }
  const result = Marklet.parse(options)
  if (!program.dest) {
    console.log(JSON.stringify(result, null, 2))
  }
  break
}
case 'watch':
case 'edit': {
  const options = {
    source: program.source,
    port: program.port
  }
  Marklet[program.mode](options)
  break
}}