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
  public msg: string

  constructor(private filepath: string) {
    super()
    this.update()
    this.debouncedUpdate = debounce(() => this.update(), 200)
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
      this.msg = JSON.stringify({
        type: 'document',
        path: this.filepath,
        data: this.content,
      })
      this.emit('update', this.msg)
    }
  }

  public bind(server: Server) {
    server.wsServer.on('connection', ws => ws.send(this.msg))
    this.on('update', msg => server.wsServer.broadcast(msg))
    this.once('close', reason => server.dispose(reason))
    return this
  }

  public dispose(reason = '') {
    this.watcher.close()
    this.emit('close', reason)
  }
}
