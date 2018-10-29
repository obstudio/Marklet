import { Server, Manager, WatchEventType } from './index'
import debounce from 'lodash.debounce'
import EventEmitter from 'events'
import * as fs from 'fs'

export const MARKUP_EXTENSIONS = ['.md', '.mkl']

export default class FileManager extends EventEmitter implements Manager {
  static EXTENSIONS = ['.md', '.mkl']
  
  private content: string
  private watcher: fs.FSWatcher
  private debouncedUpdate: () => void
  public generalFilepath: string
  public unsentMessage: string

  constructor(private filepath: string) {
    super()

    this.generalFilepath = filepath.replace(/\\/g, '/')
    this.debouncedUpdate = debounce(() => this.update(), 200)
    this.update()

    this.watcher = fs.watch(this.filepath, (type: WatchEventType) => {
      if (type === 'rename') {
        this.dispose('Source file has been removed.')
      } else {
        this.debouncedUpdate()
      }
    })
  }

  private update() {
    const temp = fs.readFileSync(this.filepath, 'utf8')
    if (this.content !== temp) {
      this.content = temp
      this.unsentMessage = JSON.stringify({
        type: 'document',
        value: this.content,
        path: this.generalFilepath,
      })
      this.emit('update', this.unsentMessage)
    }
  }

  public bind(server: Server) {
    server.wsServer.on('connection', ws => ws.send(this.unsentMessage))
    this.on('update', msg => server.wsServer.broadcast(msg))
    this.once('close', reason => server.dispose(reason))
    return this
  }

  public dispose(reason = '') {
    this.watcher.close()
    this.emit('close', reason)
  }
}
