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

const timers = {}

function start(label = '') {
  if (!timers[label]) timers[label] = { total: 0 }
  timers[label].start = Date.now()
  return _getTime(label)
}

function pause(label = '') {
  timers[label].total += Date.now() - timers[label].start
  timers[label].start = Date.now()
  return _getTime(label)
}

function finish(label = '') {
  pause(label)
  const result = _getTime(label)
  timers[label].total = 0
  return `Finished in ${result.toFixed(1)}s.`
}

function _getTime(label = '') {
  return label in timers ? timers[label].total / 1000 : 0
}

function timing(label = '', callback) {
  start(label)
  const result = callback()
  pause(label)
  return result
}

function isElectron() {
  return typeof process !== 'undefined'
    && typeof process.versions !== 'undefined'
    && typeof process.versions.electron !== 'undefined'
}

module.exports = {
  exec,
  execSync,
  resolve,
  start,
  pause,
  finish,
  timing,
  isElectron,
}