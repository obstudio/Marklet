const { performance } = require('perf_hooks')

const Marklet = require('../dist/Marklet')

module.exports = ({name, content}) => {
  const start1 = performance.now()
  Marklet.parse({ input: content })
  const end1 = performance.now()
  const start2 = performance.now()
  for(let i = 0; i < 10000; ++i) {
    Marklet.parse({ input: content })
  }
  const end2 = performance.now()
  console.log(name, 'initial:', end1 - start1)
  console.log(name, 'average:', (end2 - start2) / 10000)
}