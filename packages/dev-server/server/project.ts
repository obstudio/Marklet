import { dirname } from 'path'
import { EventEmitter } from 'events'
import { readFileSync, watch, FSWatcher } from 'fs'
import debounce from 'lodash.debounce'

type WatchEventType = 'rename' | 'change'

type FileTree = IterableIterator<string | Directory>
interface Directory { name: string, children: FileTree }

function* traverse(filepath: string): FileTree {
  // FIXME: get all files in a directory
}

function* ProjectMessages(filepath: string): IterableIterator<string> {
  const source = readFileSync(filepath).toString()
  const options = JSON.parse(source) // FIXME: support for yaml
  yield JSON.stringify({ type: 'project', data: options })
  const basedir = options.basedir || dirname(filepath)
  yield JSON.stringify({ type: 'filetree', data: traverse(basedir) })
  // FIXME: add inner messages, for example file contents
}

export default class ProjectManager extends EventEmitter {
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
