const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const semver = require('semver')
const cp = require('child_process')
const program = require('commander')

function exec(command, show = true) {
  try {
    if (show) console.log(`${chalk.blue('$')} ${command}`)
    return cp.execSync(command).toString('utf8')
  } catch (error) {
    console.log(chalk.red(error.message))
    process.exit(1)
  }
}

function toVersion(version) {
  return `${version.major}.${version.minor}.${version.patch}`
}

class Package {
  constructor(name) {
    this.current = require(`../packages/${name}/package.json`)
    this.previous = JSON.parse(exec(`git show HEAD:packages/${name}/package.json`, false))
    this.major = semver.major(this.current.version)
    this.minor = semver.minor(this.current.version)
    this.patch = semver.patch(this.current.version)
    delete this.current.gitHead
  }
  
  bump(flag) {
    const result = {
      major: this.major,
      minor: this.minor,
      patch: this.patch,
    }
    result[flag] ++
    if (flag !== 'patch') result.patch = 0
    if (flag === 'major') result.minor = 0
    if (semver.gt(toVersion(result), this.version)) {
      Object.assign(this, result)
    }
  }

  get version() {
    return toVersion(this)
  }

  toJSON() {
    this.current.version = this.version
    return this.current
  }
}

const packages = {}
const packageNames = fs.readdirSync(path.join(__dirname, '../packages'))
packageNames.forEach(name => packages[name] = new Package(name))

program
  .usage('<major|minor|patch> [names...]')
  .parse(process.argv)

let flag = 'patch'
const flags = [ 'major', 'minor', 'patch' ]
if (flags.includes(program.args[0])) flag = program.args.shift()

program.args.forEach(name => packages[name] && packages[name].bump(flag))

packageNames.forEach((name) => {
  fs.writeFileSync(
    path.join(__dirname, `../packages/${name}/package.json`),
    JSON.stringify(packages[name], null, 2),
  )
})
