import { DocLexer, DocLexerConfig } from './Document'
import * as path from 'path'
import * as http from 'http'
import * as url from 'url'
import * as fs from 'fs'

const html = fs.readFileSync(path.join(__dirname, '../index.html'), { encoding: 'utf8' })

interface parseOptions {
  input: string
  config: DocLexerConfig
}

export function parse(options: parseOptions) {
  return new DocLexer(options.config).parse(options.input)
}

interface watchOptions {
  source: string
  port?: number
}

export function watch(options: watchOptions) {
  const port = options.port || 8080
  http.createServer((request, response) => {
    const { pathname } = url.parse(request.url)
    if (pathname === '/') {
      response.writeHead(200, { 'Content-Type': 'text/html' })
      response.write(html)
    } else {
      response.writeHead(404, { 'Content-Type': 'text/html' })
    }
    response.end()
  }).listen(port)
  console.log(`Server running at http://localhost:${port}/`)
}
