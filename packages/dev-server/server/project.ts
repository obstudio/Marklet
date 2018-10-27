import { dirname, join, basename } from 'path'
import { EventEmitter } from 'events'
import { readFileSync, watch, FSWatcher, readdirSync } from 'fs'
import { Server, Manager, WatchEventType } from './index'
import debounce from 'lodash.debounce'
import yaml from 'js-yaml'

export default class ProjectManager extends EventEmitter implements Manager {
  private watcher: FSWatcher
  private tree: DirTree
  private debouncedUpdate: () => void
  private delSet: Set<string> = new Set()
  private addSet: Set<string> = new Set()
  private basepath: string
  private basename: string
  private configUpdated: boolean
  public entriesMessage: string
  public optionMessage: string

  constructor(private filepath: string) {
    super()
    this.basepath = dirname(filepath)
    this.basename = basename(filepath)
    this.tree = new DirTree(this.basepath)

    this.update()
    this.debouncedUpdate = debounce(this.update.bind(this), 200)
    this.watcher = watch(this.basepath, {
      recursive: true
    }, (type: WatchEventType, filename) => {
      if (type === 'rename' && this.tree.has(filename)) {
        this.delSet.add(filename)
      } else {
        this.addSet.add(filename)
        this.configUpdated = filename === this.basename
      }
      this.debouncedUpdate()
    })
  }

  private update() {
    for (const item of this.delSet) {
      this.tree.del(item)
    }
    this.delSet.clear()
    for (const item of this.addSet) {
      try {
        this.tree.set(item, readFileSync(join(this.basepath, item), 'utf8'))        
      } catch (_) {}
    }
    this.addSet.clear()
    this.emit('update', this.entriesMessage = JSON.stringify({
      type: 'entries',
      tree: this.tree.entryTree,
    }))
    if (this.configUpdated) {
      this.emit('update', this.optionMessage = JSON.stringify({
        type: 'options',
        tree: this.tree.get(this.basename) // parse it
      }))
      this.configUpdated = false
    }
  }

  public bind(server: Server): this {
    server.wsServer.on('connection', ws => {
      ws.send(this.entriesMessage)
      ws.on('message', data => {
        const parsed = JSON.parse(<string>data)
        switch (parsed.type) {
          case 'content':
            this.getContent(parsed.data)            
            break
        }
      })
    })
    this.on('update', msg => server.wsServer.broadcast(msg))
    this.once('close', () => {
      server.dispose('Source file is gone.')
    })
    return this
  }

  public getContent(path: string): FileTree {
    return this.tree.get(path)
  }

  public dispose(): void {
    this.watcher.close()
    this.emit('close')
  }
}

interface FileTree {
  [key: string]: string | FileTree
}

interface EntryTree extends Array<SubEntry> {}
type SubEntry = EntryTree | string

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
