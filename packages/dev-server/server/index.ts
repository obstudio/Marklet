import * as path from 'path'
import * as http from 'http'
import * as url from 'url'
import * as fs from 'fs'
import ws from 'ws'

import { LexerConfig } from '@marklet/parser'
import { getContentType } from './util'
import ProjectManager from './project'
import FileManager from './file'

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

export type ServerType = 'watch' | 'edit'
export type SourceType = 'file' | 'project'

interface ServerOptions {
  port?: number
  filepath?: string
  config?: LexerConfig
  sourceType?: SourceType
}

class MarkletServer<T extends ServerType> {
  type: T
  port: number
  filepath: string
  sourceType: SourceType
  config: LexerConfig
  wsServer: ws.Server
  httpServer: http.Server

  constructor(type: T, options: ServerOptions = {}) {
    this.type = type
    this.config = options.config || {}
    this.filepath = options.filepath || ''
    this.port = options.port || DEFAULT_PORT
    this.sourceType = options.sourceType || 'file'
    this.createServer()
    if (this.filepath) {
      this.setupContentWatcher()
    }
  }

  private createServer() {
    this.httpServer = http.createServer((request, response) => {
      function handleError(error: Error) {
        console.error(error)
        response.writeHead(404, { 'Content-Type': 'text/html' })
        response.end()
      }
      
      function handleData(data: any, type: string = 'text/javascript') {
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
      } else if (pathname === 'initialize.js') {
        handleData(`
          marklet.type = '${this.type}'
          marklet.filepath = ${JSON.stringify(this.filepath)}
          marklet.sourceType = '${this.sourceType}'
          marklet.config = ${JSON.stringify(this.config)}
        `)
        return
      } else {
        filepath = path.join(__dirname, '..', pathname || 'index.html')
      }
      fs.readFile(filepath, (error, data) => {
        if (error) {
          handleError(error)
          return
        }

        handleData(data.toString(), getContentType(filepath))
      })
    }).listen(this.port)
    this.wsServer = new ws.Server({ server: this.httpServer })
    console.log(`Server running at http://localhost:${this.port}/`)
  }

  private setupContentWatcher() {
    if (this.sourceType === 'file') {
      this.setupFileWatcher()
    } else {
      this.setupProjectWatcher()
    }
  }

  private setupFileWatcher() {
    const manager = new FileManager(this.filepath)
    manager.once('close', () => {
      this.dispose('Source file is gone.')
    })
    this.wsServer.on('connection', ws => ws.send(manager.msg))
    manager.on('update', msg => this.wsServer.broadcast(msg))
  }

  private setupProjectWatcher() {
    const manager = new ProjectManager(this.filepath)
    this.wsServer.on('connection', ws => ws.send(manager.msg))
    manager.on('update', msg => this.wsServer.broadcast(msg))
  }

  public dispose(reason: string = '') {
    this.wsServer.close()
    this.httpServer.close()
    console.log(reason)
  }
}

export { MarkletServer as Server }

export interface WatchOptions extends ServerOptions {
  filepath: string // required
}

export function watch(options: WatchOptions): MarkletServer<'watch'> {
  return new MarkletServer('watch', options)
}

export interface EditOptions extends ServerOptions {}

export function edit(options: EditOptions): MarkletServer<'edit'> {
  const server = new MarkletServer('edit', options)
  // handle saving files and changing config and so on
  return server
}
