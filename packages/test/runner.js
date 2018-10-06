const Marklet = require('markletjs')
const benchmark = require('./benchmark')
const schema = require('./schema')
const detok = require('./detok')
const chalk = require('chalk')
const path = require('path')
const fs = require('fs')

const testFiles = fs.readdirSync(path.join(__dirname, 'data')).map((file) => ({
  name: file.slice(0, -4),
  content: fs.readFileSync(path.join(__dirname, 'data', file)).toString()
}))

const parsedFiles = testFiles.map((file) => ({
  name: file.name,
  content: Marklet.parse({ input: file.content })
}))

const testProcess = {
  tests: [],
  add(title, test, raw = false) {
    this.tests.push({ title, test, raw })
    return this
  },
  run() {
    for (const { title, test, raw } of this.tests) {
      console.log(chalk.blueBright(`Test started: ${title}`))
      const testData = raw ? testFiles : parsedFiles
      let result = true
      for (const testUnit of testData) {
        if (!test(testUnit)) {
          result = false
          console.log(chalk.redBright(`Test ${title} on ${testUnit.name} failed.`))
        }
      }
      if (result) console.log(chalk.greenBright(`Test ${title} succeeded.`))
      console.log()
    }
  }
}

testProcess
  .add('Shape correctness', schema)
  .add('Detokenize', detok)
  .add('Benchmark', (result) => {
    benchmark(result)
    return true
  }, true)
  .run()
