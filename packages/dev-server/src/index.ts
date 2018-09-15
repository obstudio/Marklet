import { Server as WSServer, OPEN as WSOPEN } from 'ws'
import * as path from 'path'
import * as http from 'http'
import * as url from 'url'
import * as fs from 'fs'

declare module 'ws' {
  interface Server {
    broadcast(this: this, data: string): void
  }
}

WSServer.prototype.broadcast = function (data) {
  this.clients.forEach((client) => {
    if (client.readyState === WSOPEN) {
      client.send(data)
    }
  })
}

function toDocMessage(filename) {
  return JSON.stringify({
    type: 'document',
    data: fs.readFileSync(filename).toString()
  })
}

function createServer(type: 'edit' | 'watch') {
  const httpServer = http.createServer((request, response) => {
    let pathname = url.parse(request.url).pathname.slice(1)
    if (!pathname) {
      pathname = 'index.html'
    } /* else if (pathname.startsWith('node_modules')) {
      pathname = '../' + pathname
    }  */else if (pathname === 'start') {
      response.writeHead(200, { 'Content-Type': 'text/javascript' })
      response.write(`Marklet.start({ el: '#app', type: '${type}' })`)
      response.end()
      return
    }
    fs.readFile(path.join(__dirname, pathname), (error, data) => {
      if (error) {
        console.log(error)
        response.writeHead(404, { 'Content-Type': 'text/html' })
      } else {
        const ext = path.extname(pathname)
        let contentType: string
        switch (ext) {
          case '.css':
            contentType = 'text/css'
            break
          case '.js':
            contentType = 'text/javascript'
            break
          case '.html':
            contentType = 'text/html'
            break
          default:
            contentType = 'application/octet-stream'
        }
        response.writeHead(200, { 'Content-Type': contentType })
        response.write(data.toString())
      }
      response.end()
    })
  })
  const wsServer = new WSServer({ server: httpServer })
  return {
    httpServer,
    wsServer
  }
}

interface WatchOptions {
  source: string
  port?: number
}

export function watch(options: WatchOptions): void {
  const port = options.port || 8080
  const { httpServer, wsServer } = createServer('watch')
  httpServer.listen(port)
  wsServer.on('connection', (ws) => {
    ws.send(toDocMessage(options.source))
  })
  fs.watch(options.source, () => {
    wsServer.broadcast(toDocMessage(options.source))
  })
  console.log(`Server running at http://localhost:${port}/`)
}

interface EditOptions {
  source?: string
  port?: number
}

export function edit(options: EditOptions): void {
  const port = options.port || 8080
  const { httpServer } = createServer('edit')
  httpServer.listen(port)
  console.log(`Server running at http://localhost:${port}/`)
}
