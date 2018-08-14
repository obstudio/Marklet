const webpack = require('webpack')
const path = require('path')

const compiler = webpack({
  target: 'web',
  entry: path.resolve(__dirname, '../html/app.js'),
  output: {
    path: path.resolve(__dirname, '../html'),
    filename: 'app.dist.js'
  },
})

new webpack.ProgressPlugin().apply(compiler)

compiler.run(error => console.log(error))