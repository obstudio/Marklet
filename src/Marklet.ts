import { DocLexer, DocLexerConfig } from './Document'
import { Server as WSServer } from 'ws'
import * as path from 'path'
import * as http from 'http'
import * as url from 'url'
import * as fs from 'fs'

declare module 'ws' {
  interface Server {
    broadcast(data: any): void
  }
}

WSServer.prototype.broadcast = function(data) {
  this.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  })
}

interface parseOptions {
  source?: string
  input?: string
  dest?: string
  config?: DocLexerConfig
}

export function parse(options: parseOptions) {
  let source
  if (options.source) {
    source = fs.readFileSync(options.source).toString()
  } else if (options.input) {
    source = options.input
  } else {
    throw new Error("'source' of 'input' option is required.")
  }
  const result = new DocLexer(options.config).parse(source)
  if (options.dest) {
    fs.writeFileSync(options.dest, result)
  }
  return result
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
  wsServer.on('connection', (ws) => {
    ws.send(JSON.stringify({
      type: 'doc',
      data: parse(options)
    }))
  })
  fs.watch(options.source, (_, name) => {
    wsServer.broadcast(JSON.stringify({
      type: 'doc',
      data: parse(options)
    }))
  })
  console.log(`Server running at http://localhost:${port}/`)
}
