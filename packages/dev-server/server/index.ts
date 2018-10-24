import * as path from 'path'
import * as http from 'http'
import * as url from 'url'
import * as fs from 'fs'
import ws from 'ws'

import { LexerConfig } from '@marklet/parser'
import { getContentType } from './util'
import { FileManager } from './manager'

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
export type SourceType = 'file' | 'folder'

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
    this.wsServer.on('connection', (ws) => {
      for (const message in ProjectMessages(this.filepath)) {
        ws.send(message)
      }
    })
    fs.watch(this.filepath, { recursive: true }, (eventType, filename) => {
      // FIXME: only watching the index file is far from enough
      // you need to watch the basedir and every files in it
      for (const message in ProjectMessages(this.filepath)) {
        this.wsServer.broadcast(message)
      }
    })
  }

  public dispose(reason: string = '') {
    this.wsServer.close()
    this.httpServer.close()
    console.log(reason)
  }
}

type FileTree = IterableIterator<string | Directory>
interface Directory { name: string, children: FileTree }

function* traverse(filepath: string): FileTree {
  // FIXME: get all files in a directory
}

function* ProjectMessages(filepath: string): IterableIterator<string> {
  const source = fs.readFileSync(filepath).toString()
  const options = JSON.parse(source) // FIXME: support for yaml
  yield JSON.stringify({ type: 'project', data: options })
  const basedir = options.basedir || path.dirname(filepath)
  yield JSON.stringify({ type: 'filetree', data: traverse(basedir) })
  // FIXME: add inner messages, for example file contents
}

function FileMessage(filepath: string, type = 'document') {
  return JSON.stringify({
    type,
    filepath,
    data: fs.readFileSync(filepath).toString(),
  })
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
