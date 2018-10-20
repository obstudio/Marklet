const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

function fullPath(filepath) {
  return path.resolve(process.cwd(), filepath)
}

function handleError(message) {
  console.error(chalk.redBright('error:'), message)
  process.exit(1)
}

function tryFindFile(filepath) {
  if (fs.existsSync(fullPath(filepath))) return
  if (!filepath) {
    handleError('a filepath is required.')
  } else {
    handleError(`file ${filepath} was not found.`)
  }
}

module.exports = {
  fullPath,
  handleError,
  tryFindFile,
}
