import { WatchEventType } from './index'
import MarkletManager from './manager'
import * as fs from 'fs'

export const MARKUP_EXTENSIONS = ['.md', '.mkl']

export default class FileManager extends MarkletManager {
  static EXTENSIONS = MARKUP_EXTENSIONS
  
  private content: string
  private watcher: fs.FSWatcher
  public generalFilepath: string
  public unsentMessage: string

  constructor(private filepath: string) {
    super()

    this.generalFilepath = filepath.replace(/\\/g, '/')

    this.initialize()

    this.watcher = fs.watch(this.filepath, (type: WatchEventType) => {
      if (type === 'rename') {
        this.dispose('Source file has been removed.')
      } else {
        this.debouncedUpdate()
      }
    })
  }

  public update() {
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

  public dispose(reason = '') {
    this.watcher.close()
    this.emit('close', reason)
  }
}
