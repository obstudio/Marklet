import { dirname, join } from 'path'
import { EventEmitter } from 'events'
import { readFileSync, watch, FSWatcher, readdirSync } from 'fs'
import debounce from 'lodash.debounce'

type WatchEventType = 'rename' | 'change'

// type FileTree = IterableIterator<string | Directory>
// interface Directory { name: string, children: FileTree }

interface FileTree {
  [key: string]: string | FileTree
}

// function* ProjectMessages(filepath: string): IterableIterator<string> {
//   const source = readFileSync(filepath).toString()
//   const options = JSON.parse(source) // FIXME: support for yaml
//   yield JSON.stringify({ type: 'project', data: options })
//   const basedir = options.basedir || dirname(filepath)
//   yield JSON.stringify({ type: 'filetree', data: traverse(basedir) })
//   // FIXME: add inner messages, for example file contents
// }

export default class ProjectManager extends EventEmitter {
  private watcher: FSWatcher
  private tree: DirTree
  private debouncedUpdate: () => void
  private deleteQueue: Set<string> = new Set()
  private addQueue: Set<string> = new Set()
  public msg: string

  constructor(private filepath: string) {
    super()
    this.tree = new DirTree(filepath)
    this.watcher = watch(this.filepath, { recursive: true }, this.handleWatchEvent.bind(this))
    this.debouncedUpdate = debounce(this.update.bind(this), 200)
  }

  private handleWatchEvent(eventType: WatchEventType, filename: string) {
    if (eventType === 'rename' && this.tree.has(filename)) {
      this.deleteQueue.add(filename)
    } else {
      this.addQueue.add(filename)
    }
    this.debouncedUpdate()
  }

  private update() {
    for (const item of this.deleteQueue) {
      this.tree.del(item)
    }
    this.deleteQueue.clear()
    for (const item of this.addQueue) {
      try {
        this.tree.set(item, readFileSync(join(this.filepath, item), 'utf8'))        
      } catch (_) {}
    }
    this.addQueue.clear()
    this.emit('update', this.msg = JSON.stringify({
      type: 'project',
      tree: this.tree.tree
    }))
  }

  public dispose(): void {
    this.watcher.close()
    this.emit('close')
  }
}

class DirTree {
  static separator = /[\/\\]/
  public tree: FileTree

  constructor(private filepath: string) {
    this.tree = this.init(filepath)
  }

  private init(filepath: string): FileTree {
    const children = readdirSync(filepath, { withFileTypes: true }), subtree: FileTree = {}
    for (const child of children) {
      const newPath = join(filepath, child.name)
      subtree[child.name] = child.isFile() ? readFileSync(newPath, 'utf8') : this.init(newPath)
    }
    return subtree
  }

  public get(path: string) {
    const segments = path.split(DirTree.separator)
    let result = this.tree
    for (const segment of segments) {
      result = <FileTree>result[segment]
    }
    return result
  }

  public set(path: string, value: string | FileTree) {
    const segments = path.split(DirTree.separator)
    const last = segments.pop()
    let tree = this.tree
    for (const segment of segments) {
      tree = <FileTree>(tree[segment] = tree[segment] || {})
    }
    tree[last] = value
  }

  public has(path: string) {
    const segments = path.split(DirTree.separator)
    let result = this.tree
    for (const segment of segments) {
      if (result = <FileTree>result[segment])
        continue
      return false
    }
    return true
  }

  public del(path: string) {
    const segments = path.split(DirTree.separator)
    const last = segments.pop()
    let tree = this.tree
    for (const segment of segments) {
      tree = <FileTree>tree[segment]
    }
    delete tree[last]
  }
}
