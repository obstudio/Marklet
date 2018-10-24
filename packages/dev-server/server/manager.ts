import { EventEmitter } from 'events'
import { readFileSync, watch, FSWatcher } from 'fs'
import debounce from 'lodash.debounce'

type WatchEventType = 'rename' | 'change'

export class FileManager extends EventEmitter {
  private content: string
  private dirty: boolean
  private watcher: FSWatcher
  private debouncedUpdate: () => void
  public msg: string

  constructor(private filepath: string) {
    super()
    this.update()
    this.debouncedUpdate = debounce(() => this.update(), 200)
    this.watcher = watch(this.filepath, (eventType: WatchEventType) => {
      if (eventType === 'rename') {
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

  public dispose(): void {
    this.watcher.close()
    this.emit('close')
  }
}