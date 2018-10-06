const { performance } = require('perf_hooks')
const Marklet = require('markletjs')

module.exports = {
  title: 'Benchmark',
  test({ name, content }) {
    const start1 = performance.now()
    Marklet.parse({ input: content })
    const end1 = performance.now()
    const start2 = performance.now()
    for(let i = 0; i < 1000; ++i) {
      Marklet.parse({ input: content })
    }
    const end2 = performance.now()
    console.log(name, 'initial:', end1 - start1, 'ms')
    console.log(name, 'average:', (end2 - start2) / 1000, 'ms')
  },
  raw: true
}
