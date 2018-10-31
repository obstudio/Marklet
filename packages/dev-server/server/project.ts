import { WatchEventType, EditorConfig } from './index'
import FileFilter, { StringLike } from './filter'
import { LexerConfig } from '@marklet/parser'
import MarkletManager from './manager'
import equal from 'fast-deep-equal'
import DirTree from './tree'
import * as yaml from 'js-yaml'
import * as path from 'path'
import * as fs from 'fs'

export interface ProjectConfig {
  baseDir?: string
  extensions?: string[]
  ignore?: StringLike[]
  editOptions?: EditorConfig
  parseOptions?: LexerConfig
}

const JSON_EXTENSIONS = ['.js', '.json']
const YAML_EXTENSIONS = ['.yml', '.yaml']

export default class ProjectManager extends MarkletManager {
  static EXTENSIONS = [...JSON_EXTENSIONS, ...YAML_EXTENSIONS]

  private tree: DirTree
  private filter: FileFilter
  private rawConfig: string
  private config: ProjectConfig
  private oldConfig: ProjectConfig
  private folderWatcher: fs.FSWatcher
  private configWatcher: fs.FSWatcher
  private delSet: Set<string> = new Set()
  private addSet: Set<string> = new Set()
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
    this.tree.entryList.forEach(filepath => this.addSet.add(filepath))

    this.initialize()

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
        this.dispose('Configuration file has been removed.')
      } else {
        this.getConfig()
        this.debouncedUpdate()
      }
    })
  }

  private getConfig() {
    this.oldConfig = this.config || {}
    const beforeCreate = !this.config
    function takeTry(task: Function) {
      try {
        return task()
      } catch (error) {
        if (beforeCreate) throw error
      }
    }

    let config: ProjectConfig
    this.rawConfig = fs.readFileSync(this.filepath).toString()
    if (JSON_EXTENSIONS.includes(this.extension)) {
      require.cache[this.filepath] = null
      takeTry(() => config = require(this.filepath))
    } else if (YAML_EXTENSIONS.includes(this.extension)) {
      takeTry(() => config = yaml.safeLoad(this.rawConfig))
    }
    config.baseDir = path.resolve(this.basepath, config.baseDir || '')
    if (!config.extensions) config.extensions = ['.mkl']
    if (!config.ignore) config.ignore = []
    if (!config.editOptions) config.editOptions = {}
    if (!config.parseOptions) config.parseOptions = {}
    if (this.filepath.startsWith(config.baseDir)) {
      config.ignore.push(this.filepath.slice(config.baseDir.length + 1))
    }
    this.configUpdated = true
    return this.config = config
  }

  public update() {
    for (const item of this.delSet) {
      this.tree.del(item)
    }
    this.delSet.clear()
    for (const item of this.addSet) {
      try {
        const content = fs.readFileSync(path.join(this.config.baseDir, item), 'utf8')
        this.tree.set(item, content)
        this.emit('update', {
          type: 'document',
          value: content,
          path: item.replace(/\\/g, '/'),
        })
      } catch (_) {}
    }
    this.addSet.clear()
    this.emit('update', {
      type: 'entries',
      path: this.config.baseDir,
      tree: this.tree.entryTree,
    })
    if (this.configUpdated) {
      this.emit('update', {
        type: 'config',
        config: this.config,
        content: this.rawConfig,
      })
      if (!equal(this.config.parseOptions, this.oldConfig.parseOptions)) {
        this.emit('update', {
          type: 'config.parseOptions',
          options: this.config.parseOptions,
        })
      }
      if (!equal(this.config.editOptions, this.oldConfig.editOptions)) {
        this.emit('update', {
          type: 'config.editOptions',
          options: this.config.editOptions,
        })
      }
      this.configUpdated = false
    }
    // FIXME: events when a file content was changed
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
