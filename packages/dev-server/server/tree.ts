import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

export interface FileTree {
  [key: string]: string | FileTree
}

interface EntryTree extends Array<SubEntry> {}
type SubEntry = EntryTree | string

export class DirTree {
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
