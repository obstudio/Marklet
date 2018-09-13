const path = require('path')
const fs = require('fs')
const equal = require('fast-deep-equal')
const detok = require('marklet-detokenizer')
const Marklet = require('markletjs')
const benchmark = require('./benchmark')
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
