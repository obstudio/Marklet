const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const semver = require('semver')
const cp = require('child_process')
const program = require('commander')
const { exec, execSync } = require('./util')

function toVersion(version) {
  return `${version.major}.${version.minor}.${version.patch}`
}

class Package {
  constructor(name) {
    this.current = require(`../packages/${name}/package.json`)
    this.previous = JSON.parse(cp.execSync(`git show HEAD:packages/${name}/package.json`).toString('utf8'))
    this.major = semver.major(this.previous.version)
    this.minor = semver.minor(this.previous.version)
    this.patch = semver.patch(this.previous.version)
    this.newVersion = this.current.version
    delete this.current.gitHead
  }
  
  bump(flag) {
    const result = {
      major: this.major,
      minor: this.minor,
      patch: this.patch,
    }
    result[flag] += 1
    if (flag !== 'patch') result.patch = 0
    if (flag === 'major') result.minor = 0
    if (semver.gt(toVersion(result), this.newVersion)) {
      this.newVersion = toVersion(result)
    }
  }

  toJSON() {
    this.current.version = this.newVersion
    return this.current
  }
}

const packages = {}
const packageNames = fs.readdirSync(path.join(__dirname, '../packages'))
packageNames.forEach(name => packages[name] = new Package(name))

program
  .usage('[options] [names...]')
  .option('-a, --all')
  .option('-M, --major')
  .option('-m, --minor')
  .option('-p, --patch')
  .parse(process.argv)

const flag = program.major ? 'major' : program.minor ? 'minor' : 'patch'
if (program.all) program.args = packageNames

function bump(name, flag) {
  packages[name].bump(flag || 'patch')
  const npmName = packages[name].current.name
  packageNames.forEach((next) => {
    if (npmName in (packages[next].current.devDependencies || {})) {
      packages[next].current.devDependencies[npmName] = '^' + packages[name].newVersion
      bump(next)
    } else if (npmName in (packages[next].current.dependencies || {})) {
      packages[next].current.dependencies[npmName] = '^' + packages[name].newVersion
      bump(next)
    }
  })
}

program.args.forEach(name => packages[name] && bump(name, flag))

packageNames.forEach((name) => {
  if (packages[name].newVersion !== packages[name].current.version) {
    console.log(` - ${name} (${packages[name].current.name}): \
${chalk.cyan(packages[name].current.version)} => \
${chalk.cyanBright(packages[name].newVersion)}`)
  }
})

let counter = 0, promise = Promise.resolve(), failed = false
packageNames.forEach((name) => {
  if (packages[name].newVersion !== packages[name].previous.version) {
    if (packages[name].current.private) return
    const npmVersion = execSync(`npm show ${packages[name].current.name} version`)
    if (semver.gte(npmVersion, packages[name].newVersion)) return
    counter += 1
    fs.writeFileSync(
      path.join(__dirname, `../packages/${name}/package.json`),
      JSON.stringify(packages[name], null, 2),
    )
    promise = promise.then((code) => {
      failed = failed || code
      return exec(`cd packages/${name} && npm publish`)
    })
  }
})

promise.then(() => {
  if (!counter) {
    console.log('No packages to publish.')
  } else if (failed) {
    console.log('Publish failed.')
  } else {
    console.log('Publish succeed.')
  }
})
