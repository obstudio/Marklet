const { DocumentLexer } = require('@marklet/parser')
const chalk = require('chalk')
const path = require('path')
const fs = require('fs')

const lexer = new DocumentLexer()

const testFiles = fs.readdirSync(path.join(__dirname, 'data')).map((file) => ({
  name: file.slice(0, -4),
  content: fs.readFileSync(path.join(__dirname, 'data', file)).toString()
}))

const parsedFiles = testFiles.map((file) => ({
  name: file.name,
  content: lexer.parse(file.content)
}))

class TaskManager {
  constructor() {
    this.tasks = []
  }

  add(task) {
    this.tasks.push(task)
    return this
  }

  runTask({ title, test, raw }) {
    console.log(chalk.blueBright(`Test Started: ${title}`))
    const testData = raw ? testFiles : parsedFiles
    let failed = false
    for (const testUnit of testData) {
      let result
      try {
        result = test(testUnit)
      } catch (error) {
        console.log(error)
        result = true
      }
      failed |= result
      if (result) {
        console.log(chalk.redBright(`Test '${title}' on ${testUnit.name} failed.`))
      } else if (result !== false) {
        console.log(`Test '${title}' on ${testUnit.name} succeeded.`)
      }
    }
    if (!failed) {
      console.log(chalk.greenBright(`Test '${title}' succeeded.`))
    }
    console.log()
    return failed
  }

  run() {
    if (this.tasks.some(task => this.runTask(task))) {
      process.exit(1)
    }
  }
}

new TaskManager()
  .add(require('./tasks/schema'))
  .add(require('./tasks/detok'))
  .add(require('./tasks/benchmark'))
  .run()
