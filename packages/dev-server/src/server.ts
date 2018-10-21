import * as path from 'path'
import * as http from 'http'
import * as url from 'url'
import * as fs from 'fs'
import * as ws from 'ws'

export const DEFAULT_PORT = 10826

declare module 'ws' {
  interface Server {
    broadcast(this: this, data: string): void
  }
}

ws.Server.prototype.broadcast = function (data) {
  this.clients.forEach((client) => {
    if (client.readyState === ws.OPEN) {
      client.send(data)
    }
  })
}

function toDocMessage(filename: string) {
  return JSON.stringify({
    type: 'document',
    data: fs.readFileSync(filename).toString()
  })
}

type ServerType = 'watch' | 'edit'

interface ServerOptions {
  port?: number
}

class MarkletServer<T extends ServerType> {
  type: T
  port: number
  wsServer: ws.Server
  httpServer: http.Server

  constructor(type: T, options: ServerOptions = {}) {
    this.type = type
    this.port = options.port || DEFAULT_PORT

    this.httpServer = http.createServer((request, response) => {
      function handleError(error: Error) {
        console.error(error)
        response.writeHead(404, { 'Content-Type': 'text/html' })
        response.end()
      }
      
      function handleData(data: any, type: string) {
        response.writeHead(200, { 'Content-Type': type })
        response.write(data)
        response.end()
      }
      
      let pathname = url.parse(request.url).pathname.slice(1)
      let filepath: string
      if (pathname.startsWith('~/')) {
        try {
          filepath = require.resolve(pathname.slice(2))
        } catch (error) {
          handleError(error)
          return
        }
      } else if (pathname === 'start') {
        handleData(`Marklet.start({ el: '#app', type: '${type}' })`, 'text/javascript')
        return
      } else {
        filepath = path.join(__dirname, pathname || 'index.html')
      }
      fs.readFile(filepath, (error, data) => {
        if (error) {
          handleError(error)
          return
        }

        const ext = path.extname(filepath)
        let contentType: string
        switch (ext) {
          case '.css': contentType = 'text/css'; break
          case '.js': contentType = 'text/javascript'; break
          case '.html': contentType = 'text/html'; break
          default: contentType = 'application/octet-stream'
        }
        handleData(data.toString(), contentType)
      })
    }).listen(this.port)
    this.wsServer = new ws.Server({ server: this.httpServer })
    console.log(`Server running at http://localhost:${this.port}/`)
  }
}

export { MarkletServer as Server }

export interface WatchOptions extends ServerOptions {
  source: string
}

export function watch(options: WatchOptions): MarkletServer<'watch'> {
  const server = new MarkletServer('watch', options)
  server.wsServer.on('connection', (ws) => {
    ws.send(toDocMessage(options.source))
  })
  fs.watch(options.source, () => {
    server.wsServer.broadcast(toDocMessage(options.source))
  })
  return server
}

export interface EditOptions extends ServerOptions {
  source?: string
}

export function edit(options: EditOptions): MarkletServer<'edit'> {
  const server = new MarkletServer('edit', options)
  return server
}
