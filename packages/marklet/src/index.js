const { parse } = require('@marklet/parser')
const renderer = require('@marklet/renderer')
renderer.parse = parse
renderer.render = (source, el, config) => renderer.embed(parse({input: source, config}), el)
module.exports = renderer