// const { promisify } = require('util')

// const exec = promisify(require('child_process').exec)

// async function benchmark() {
//   // await exec('git stash push -m __TEMP__')
//   // await exec('node_modules/.bin/tsc', {
//   //   cwd: root
//   // })
//   // bench1
//   // await exec('git stash pop')
//   // await exec('node_modules/.bin/tsc', {
//   //   cwd: root
//   // })
//   // bench2
//   const { stdout } = await exec('node --prof --logfile=v8.log --no-logfile-per-isolate ./benchmark.js', { cwd: __dirname })
//   console.log(stdout)
//   // const logPath = fs.readdirSync(__dirname).filter((name) => name.match(/^isolate-.*?-v8.log/))
//   const logPath = path.join(__dirname, 'v8.log')
//   const content = fs.readFileSync(logPath, 'utf8')
//   fs.writeFileSync(logPath, content/* .replace(/([A-Z]:\\[^,]+)/g, (r) => r.replace(/\\/g, '/')).replace(/([A-Z]:\/[^,]+)/g, '"$1"').replace(/^(code-creation,RegExp,4,(?:.*?,)+)(.*)$/gm, '$1"$2"') */, 'utf8')
//   await exec('node --prof-process v8.log > analysis.txt', { cwd: __dirname })
//   // console.log(stdout1)
//   // fs.unlinkSync(logPath)
// }

const path = require('path')
const fs = require('fs')
const equal = require('fast-deep-equal')
const Marklet = require('../dist/Marklet')
const benchmark = require('./benchmark')
const detok = require('./detokenize')
const schema = require('./schema')

const testFiles = fs.readdirSync(path.join(__dirname, 'data')).map((file) => ({
  name: file,
  content: fs.readFileSync(path.join(__dirname, 'data', file), 'utf8')
}))
const parsedFiles = testFiles.map((file) => ({name: file.name, content: Marklet.parse({ input: file.content })}))

const testProcess = {
  tests: [],
  add(title, test, raw = false) {
    this.tests.push({ title, test, raw })
    return this
  },
  run() {
    for (const { title, test, raw } of this.tests) {
      console.log('Test:', title)
      const testData = raw ? testFiles : parsedFiles
      let res = true
      for (const testUnit of testData) {
        if (!test(testUnit)) {
          res = false
          console.log(`Test on ${testUnit.name} failed`)
          break
        }
      }
      if (res) {
        console.log(`Test ${title} succeeded`)
      } else {
        console.log(`Test ${title} failed\n`)
      }
    }
  }
}

testProcess
  .add('Shape correctness', (res) => {
    return schema(res.content)
  })
  .add('Detok', (res) => {
    return equal(Marklet.parse({ input: detok.detokenize(res.content) }), res.content)
  })
  .add('Benchmark', (res) => {
    benchmark(res)
    return true
  }, true)
  .run()
