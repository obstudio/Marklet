const { performance } = require('perf_hooks')
const { DocumentLexer } = require('@marklet/parser')

function timing(callback) {
  const start = performance.now()
  callback()
  return performance.now() - start
}

module.exports = {
  title: 'Benchmark',
  test({ name, content }) {
    name = name.padEnd(12)
    let lexer
    const initial = timing(() => {
      lexer = new DocumentLexer()
      lexer.parse(content)
    })
    const average = timing(() => {
      for (let i = 0; i < 1000; ++i) {
        lexer.parse(content)
      }
    })
    console.log(`${name}initial: ${initial.toFixed(6)} ms.`)
    console.log(`${name}average: ${(average / 1000).toFixed(6)} ms.`)
    return false
  },
  raw: true
}
