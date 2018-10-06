const Marklet = require('markletjs')
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

class TaskManager {
  constructor() {
    this.tasks = []
  }

  add(task) {
    this.tasks.push(task)
    return this
  }

  run() {
    for (const { title, test, raw } of this.tasks) {
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
        }
      }
      if (!failed) {
        console.log(chalk.greenBright(`Test '${title}' succeeded.`))
      }
      console.log()
    }
  }
}

new TaskManager()
  .add(require('./tasks/schema'))
  .add(require('./tasks/detok'))
  .add(require('./tasks/benchmark'))
  .run()
