import { makeRe } from 'minimatch'
import { extname } from 'path'

type StringLike = string | RegExp

export default class FileFilter {
  private extensions: string[]
  private globs: RegExp[] = []

  constructor(extensions: string[], ignores: StringLike[]) {
    this.extensions = extensions.map(ext => ext.toLowerCase())
    ignores.forEach((pattern) => {
      if (typeof pattern === 'string') {
        this.globs.push(makeRe(pattern, { flipNegate: true }))
      } else {
        this.globs.push(pattern)
      }
    })
  }

  public test(filename: string): boolean {
    if (this.extensions.every(ext => extname(filename) !== ext)) return false
    let result = true
    for (const regexp of this.globs) {
      if (regexp.test(filename)) {
        result = false
        break
      }
    }
    return result
  }
}
