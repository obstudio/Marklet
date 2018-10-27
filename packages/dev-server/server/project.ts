import { Server, Manager, WatchEventType } from './index'
import debounce from 'lodash.debounce'
import EventEmitter from 'events'
import FileFilter from './filter'
import DirTree from './tree'
import * as yaml from 'js-yaml'
import * as path from 'path'
import * as fs from 'fs'

export interface ProjectConfig {
  baseDir?: string
  extensions?: string[]
  ignore?: string[]
}

const JSON_EXTENSIONS = ['.js', '.json']
const YAML_EXTENSIONS = ['.yml', '.yaml']

export default class ProjectManager extends EventEmitter implements Manager {
  static EXTENSIONS = [...JSON_EXTENSIONS, ...YAML_EXTENSIONS]

  private tree: DirTree
  private filter: FileFilter
  private config: ProjectConfig
  private folderWatcher: fs.FSWatcher
  private configWatcher: fs.FSWatcher
  private debouncedUpdate: () => void
  private delSet: Set<string> = new Set()
  private addSet: Set<string> = new Set()
  private msgQueue: string[] = []
  private configUpdated: boolean
  private basepath: string
  private basename: string
  private extension: string

  constructor(private filepath: string) {
    super()
    this.basepath = path.dirname(filepath)
    this.basename = path.basename(filepath)
    this.extension = path.extname(filepath).toLowerCase()

    const config = this.getConfig()
    this.filter = new FileFilter(config.extensions, config.ignore)
    this.tree = new DirTree(config.baseDir, this.filter)

    this.update()
    this.debouncedUpdate = debounce(this.update.bind(this), 200)

    this.folderWatcher = fs.watch(this.config.baseDir, {
      recursive: true
    }, (type: WatchEventType, filename) => {
      if (!this.filter.test(filename)) return
      if (type === 'rename' && this.tree.has(filename)) {
        this.delSet.add(filename)
      } else {
        this.addSet.add(filename)
      }
      this.debouncedUpdate()
    })

    this.configWatcher = fs.watch(this.filepath, (type: WatchEventType) => {
      if (type === 'rename') {
        this.dispose('Configuration file has been removed or renamed.')
      } else {
        this.getConfig()
        this.debouncedUpdate()
      }
    })
  }

  private getConfig() {
    const beforeCreate = !this.config
    function takeTry(task: Function) {
      try {
        return task()
      } catch (error) {
        if (beforeCreate) throw error
      }
    }

    let config: ProjectConfig
    if (JSON_EXTENSIONS.includes(this.extension)) {
      require.cache[this.filepath] = null
      takeTry(() => config = require(this.filepath))
    } else if (YAML_EXTENSIONS.includes(this.extension)) {
      takeTry(() => config = yaml.safeLoad(fs.readFileSync(this.filepath).toString()))
    }
    config.baseDir = path.resolve(this.basepath, config.baseDir || '')
    if (!config.extensions) config.extensions = ['.mkl']
    if (!config.ignore) config.ignore = []
    if (this.filepath.startsWith(config.baseDir)) {
      config.ignore.push(this.filepath.slice(config.baseDir.length + 1))
    }
    this.configUpdated = true
    return this.config = config
  }

  private update() {
    for (const item of this.delSet) {
      this.tree.del(item)
    }
    this.delSet.clear()
    for (const item of this.addSet) {
      try {
        this.tree.set(item, fs.readFileSync(path.join(this.config.baseDir, item), 'utf8'))        
      } catch (_) {}
    }
    this.addSet.clear()
    const entriesMessage = JSON.stringify({
      type: 'entries',
      tree: this.tree.entryTree,
    })
    this.msgQueue.push(entriesMessage)
    this.emit('update', entriesMessage)
    if (this.configUpdated) {
      const configMessage = JSON.stringify({
        type: 'config',
        config: this.config,
      })
      this.msgQueue.push(configMessage)
      this.emit('update', configMessage)
      this.configUpdated = false
    }
    // FIXME: events when a file content was changed
  }

  public bind(server: Server): this {
    server.wsServer.on('connection', (ws) => {
      this.msgQueue.forEach(msg => ws.send(msg))
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
    this.once('close', reason => server.dispose(reason))
    return this
  }

  public getContent(path: string) {
    return this.tree.get(path)
  }

  public dispose(reason = '') {
    this.folderWatcher.close()
    this.configWatcher.close()
    this.emit('close', reason)
  }
}
