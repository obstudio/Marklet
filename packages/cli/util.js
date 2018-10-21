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

function tryFindFile(filepath, forceFile = false) {
  const basePath = fullPath(filepath)
  const isExist = fs.existsSync(basePath)
  if (isExist && (!forceFile || fs.statSync(basePath).isFile())) return
  if (!filepath) {
    handleError('a filepath is required.')
  } else if (!isExist) {
    handleError(chalk`file {cyanBright ${filepath}} was not found.`)
  } else {
    handleError(chalk`{cyanBright ${filepath}} is not a file.`)
  }
}

module.exports = {
  fullPath,
  handleError,
  tryFindFile,
}
