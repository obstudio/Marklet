import { Server, Manager, WatchEventType } from './index'
import { dirname, join, basename, extname } from 'path'
import { readFileSync, watch, FSWatcher } from 'fs'
import { FileTree, DirTree } from './tree'
import { EventEmitter } from 'events'
import { safeLoad } from 'js-yaml'
import debounce from 'lodash.debounce'
import filter from './glob'

interface ProjectConfig {
  basedir?: string
  ignore?: string[]
}

const JSON_EXTENSIONS = ['.js', '.json']
const YAML_EXTENSIONS = ['.yml', '.yaml']
export const CONFIG_EXTENSIONS = [
  ...JSON_EXTENSIONS,
  ...YAML_EXTENSIONS,
]

export default class ProjectManager extends EventEmitter implements Manager {
  private watcher: FSWatcher
  private tree: DirTree
  private debouncedUpdate: () => void
  private delSet: Set<string> = new Set()
  private addSet: Set<string> = new Set()
  private config: any
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

    this.getConfig()
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

  private getConfig(): any {
    const ext = extname(this.filepath).toLowerCase()
    let config: ProjectConfig
    if (JSON_EXTENSIONS.includes(ext)) {
      require.cache[this.filepath] = null
      config = require(this.filepath)
      // FIXME: catch error
    } else if (YAML_EXTENSIONS.includes(ext)) {
      config = safeLoad(readFileSync(this.filepath).toString())
      // FIXME: catch error
    } else {
      throw new Error('Cannot recognize file extension for configuration file.')
    }
    console.log(this.filepath, require(this.filepath))
    this.config = config
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
