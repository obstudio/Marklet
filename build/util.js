const path = require('path')
const chalk = require('chalk')
const cp = require('child_process')

function exec(command) {
  return new Promise((resolve) => {
    console.log(`${chalk.blue('$')} ${command}\n`)
    const child = cp.exec(command)
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)
    child.on('close', (code) => {
      console.log()
      resolve(code)
    })
  })
}

function execSync(command) {
  console.log(`${chalk.blue('$')} ${command}\n`)
  const result = cp.execSync(command).toString('utf8')
  console.log(result)
  return result
}

function resolve(...names) {
  return path.join(__dirname, '../packages', ...names)
}

module.exports = {
  exec,
  execSync,
  resolve,
}