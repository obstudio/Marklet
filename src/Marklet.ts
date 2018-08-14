import { DocLexer, DocLexerConfig } from './Document'
import * as path from 'path'
import * as http from 'http'
import * as url from 'url'
import * as fs from 'fs'
import { Server as WSServer } from 'ws'

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
  const httpServer = http.createServer((request, response) => {
    let pathname = url.parse(request.url).pathname.slice(1)
    if (!pathname) {
      pathname = 'index.html'
    } else if (pathname.startsWith('node_modules')) {
      pathname = '../' + pathname
    }
    fs.readFile(path.join(__dirname, '../html', pathname), (error, data) => {
      if (error) {
        console.log(error)
        response.writeHead(404, { 'Content-Type': 'text/html' })
      } else {
        response.writeHead(200, { 'Content-Type': 'text/html' })
        response.write(data.toString())
      }
      response.end()
    })
  }).listen(port)
  const wsServer = new WSServer({server: httpServer})
  const broadcast = (data) => wsServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  })
  wsServer.on('connection', (ws) => {
    ws.send(fs.readFileSync(options.source, 'utf8')) // TODO: add parse process
  })
  fs.watch(options.source, (ev, name) => {
    broadcast(fs.readFileSync(name, 'utf8')) // TODO: add parse process
  })
  console.log(`Server running at http://localhost:${port}/`)
}
