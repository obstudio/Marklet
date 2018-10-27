import { EventEmitter } from 'events'
import { readFileSync, watch, FSWatcher } from 'fs'
import debounce from 'lodash.debounce'
import { Server, Manager, WatchEventType } from './index'

export const MARKUP_EXTENSIONS = ['.md', '.mkl']

export default class FileManager extends EventEmitter implements Manager {
  private content: string
  private watcher: FSWatcher
  private debouncedUpdate: () => void
  public msg: string

  constructor(private filepath: string) {
    super()
    this.update()
    this.debouncedUpdate = debounce(() => this.update(), 200)
    this.watcher = watch(this.filepath, (type: WatchEventType) => {
      if (type === 'rename') {
        this.dispose()
      } else {
        this.debouncedUpdate()
      }
    })
  }

  private update(): void {
    const temp = readFileSync(this.filepath, 'utf8')
    if (this.content !== temp) {
      this.content = temp
      this.msg = JSON.stringify({
        type: 'document',
        filepath: this.filepath,
        data: this.content,
      })
      this.emit('update', this.msg)
    }
  }

  public bind(server: Server): this {
    server.wsServer.on('connection', ws => ws.send(this.msg))
    this.on('update', msg => server.wsServer.broadcast(msg))
    this.once('close', () => {
      server.dispose('Source file is gone.')
    })
    return this
  }

  public dispose(): void {
    this.watcher.close()
    this.emit('close')
  }
}
