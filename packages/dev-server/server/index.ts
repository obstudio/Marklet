import * as path from 'path'
import * as http from 'http'
import * as url from 'url'
import * as fs from 'fs'
import ws from 'ws'

import { LexerConfig } from '@marklet/parser'
import { getContentType } from './util'
import MarkletManager from './manager'
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

export interface EditorConfig {
  line_ending?: 'LF' | 'CRLF'
}

export type ServerType = 'watch' | 'edit'
export type SourceType = 'file' | 'project'
export type WatchEventType = 'rename' | 'change'

interface ServerOptions {
  port?: number
  editOptions?: EditorConfig
  parseOptions?: LexerConfig
}

function assignment(dataMap: Record<string, any>) {
  return `\
(function(marklet) {
${Object.keys(dataMap).map((key) => `\
  marklet.${key} = ${JSON.stringify(dataMap[key])}
`).join('')}\
})(marklet)`
}

class MarkletServer<T extends ServerType = ServerType> {
  public port: number
  public manager: MarkletManager
  public sourceType: SourceType
  public editOptions: EditorConfig
  public parseOptions: LexerConfig
  public wsServer: ws.Server
  public httpServer: http.Server

  constructor(public serverType: T, public filepath = '', options: ServerOptions = {}) {
    this.parseOptions = options.parseOptions || {}
    this.editOptions = options.editOptions || {}
    this.port = options.port || DEFAULT_PORT
    this.createServer()
    this.setupManager()
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
        handleData(assignment({
          filepath: this.filepath,
          serverType: this.serverType,
          sourceType: this.sourceType,
          editOptions: this.editOptions,
          parseOptions: this.parseOptions,
        }))
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

  private setupManager() {
    if (!this.filepath) {
      this.sourceType = 'file'
      // FIXME: Is a file manager is needed here so as to handle client requests?
      return
    } else if (!fs.existsSync(this.filepath)) {
      throw new Error(`${this.filepath} does not exist.`)
    }
    if (fs.statSync(this.filepath).isFile()) {
      const ext = path.extname(this.filepath).toLowerCase()
      if (ProjectManager.EXTENSIONS.includes(ext)) {
        this.sourceType = 'project'
        this.manager = new ProjectManager(this.filepath).bind(this)
      } else if (FileManager.EXTENSIONS.includes(ext)) {
        this.sourceType = 'file'
        this.manager = new FileManager(this.filepath).bind(this)
      } else {
        throw new Error('Cannot recognize the file extension.')
      }
    } else {
      const configPathWithoutExt = path.join(this.filepath, 'marklet')
      for (const ext of ProjectManager.EXTENSIONS) {
        const configPath = configPathWithoutExt + ext
        if (!fs.existsSync(configPath)) continue
        if (fs.statSync(configPath).isFile()) {
          this.sourceType = 'project'
          this.filepath = configPath
          this.manager = new ProjectManager(configPath).bind(this)
          return
        }
      }
      throw new Error(`No config file was found in ${this.filepath}.`)
    }
  }

  public dispose(reason: string = '') {
    this.wsServer.close()
    this.httpServer.close()
    console.log(reason)
  }
}

export { MarkletServer as Server }

export interface WatchOptions extends ServerOptions {
  filepath: string
  editOptions: never
}

export function watch(options: WatchOptions): MarkletServer<'watch'> {
  if (!options.filepath) {
    throw new Error('Filepath is required in watch mode.')
  }
  return new MarkletServer('watch', options.filepath, options)
}

export interface EditOptions extends ServerOptions {
  filepath?: string
}

export function edit(options: EditOptions): MarkletServer<'edit'> {
  const server = new MarkletServer('edit', options.filepath, options)
  // FIXME: handle saving files and other client requests.
  return server
}
