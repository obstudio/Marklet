import { dirname, join, basename } from 'path'
import { EventEmitter } from 'events'
import { readFileSync, watch, FSWatcher, readdirSync } from 'fs'
import debounce from 'lodash.debounce'

type WatchEventType = 'rename' | 'change'

interface FileTree {
  [key: string]: string | FileTree
}

interface EntryTree extends Array<SubEntry> {}
type SubEntry = EntryTree | string

export default class ProjectManager extends EventEmitter {
  private watcher: FSWatcher
  private tree: DirTree
  private debouncedUpdate: () => void
  private deleteSet: Set<string> = new Set()
  private addSet: Set<string> = new Set()
  private basePath: string
  private basename: string
  private configUpdated: boolean
  public entriesMessage: string
  public optionMessage: string

  constructor(private filepath: string) {
    super()
    this.basePath = dirname(filepath)
    this.basename = basename(filepath)
    this.tree = new DirTree(this.basePath)
    this.watcher = watch(this.basePath, { recursive: true }, this.handleWatchEvent.bind(this))
    this.debouncedUpdate = debounce(this.update.bind(this), 200)
  }

  private handleWatchEvent(eventType: WatchEventType, filename: string) {
    if (eventType === 'rename' && this.tree.has(filename)) {
      this.deleteSet.add(filename)
    } else {
      this.addSet.add(filename)
      this.configUpdated = filename === this.basename
    }
    this.debouncedUpdate()
  }

  private update() {
    for (const item of this.deleteSet) {
      this.tree.del(item)
    }
    this.deleteSet.clear()
    for (const item of this.addSet) {
      try {
        this.tree.set(item, readFileSync(join(this.basePath, item), 'utf8'))        
      } catch (_) {}
    }
    this.addSet.clear()
    this.emit('update', this.entriesMessage = JSON.stringify({
      type: 'entries',
      tree: this.tree.entryTree
    }))
    if (this.configUpdated) {
      this.emit('update', this.optionMessage = JSON.stringify({
        type: 'options',
        tree: this.tree.get(this.basename) // parse it
      }))
      this.configUpdated = false
    }
  }

  public getContent(path: string) {
    return this.tree.get(path)
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

  get entryTree() {
    return DirTree.generateEntryTree(this.tree)
  }

  static generateEntryTree(tree: FileTree) {
    const entries: EntryTree = Object.keys(tree)
    for (let i = 0; i < entries.length; i++) {
      const element = entries[i]
      const content = tree[<string>element]
      if (typeof content === 'object') {
        const sub = this.generateEntryTree(content)
        sub.unshift(element)
        entries.splice(i, 1, sub)
      }
    }
    return entries
  }
}
