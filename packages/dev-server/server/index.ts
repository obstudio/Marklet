import * as path from 'path'
import * as http from 'http'
import * as url from 'url'
import * as fs from 'fs'
import ws from 'ws'

import { LexerConfig } from '@marklet/parser'
import { getContentType } from './util'
import { EventEmitter } from 'events'
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

interface MarkletManager extends EventEmitter {
  bind(server: MarkletServer): this
  dispose(): void
}

export type ServerType = 'watch' | 'edit'
export type SourceType = 'file' | 'project'
export type WatchEventType = 'rename' | 'change'

interface ServerOptions {
  port?: number
  filepath?: string
  config?: LexerConfig
  sourceType?: SourceType
}

class MarkletServer<T extends ServerType = ServerType> {
  public port: number
  public filepath: string
  public manager: MarkletManager
  public sourceType: SourceType
  public config: LexerConfig
  public wsServer: ws.Server
  public httpServer: http.Server

  constructor(public serverType: T, options: ServerOptions = {}) {
    this.config = options.config || {}
    this.filepath = options.filepath || ''
    this.port = options.port || DEFAULT_PORT
    this.sourceType = options.sourceType || 'file'
    this.createServer()
    if (this.filepath) {
      if (this.sourceType === 'file') {
        this.manager = new FileManager(this.filepath).bind(this)
      } else {
        this.manager = new ProjectManager(this.filepath).bind(this)
      }
    }
  }

  private createServer() {
    this.httpServer = http.createServer((request, response) => {
      function handleError(error: Error) {
        console.error(error)
        response.writeHead(404, { 'Content-Type': 'text/html' })
        response.end()
      }
      
      function handleData(data: any, type = 'text/javascript') {
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
          marklet.serverType = '${this.serverType}'
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

  public dispose(reason: string = '') {
    this.wsServer.close()
    this.httpServer.close()
    console.log(reason)
  }
}

export { MarkletServer as Server, MarkletManager as Manager }

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
