import { StringMap } from './types'

class TemplateRegExp {
  variables: StringMap<string>

  private pattern: string
  private flags: string
  private changed: boolean
  private lastRegExp: RegExp

  constructor(pattern: string, flags: string = '', macros: StringMap<string> = {}, variables: StringMap<string> = {}) {
    for (const key in macros) {
      pattern = pattern.replace(new RegExp(`{{${key}}}`, 'g'), `(?:${macros[key]})`)
    }
    this.pattern = pattern
    this.flags = flags
    this.variables = variables
    this.changed = true
  }

  setVariable(key: string, value: string) {
    this.variables[key] = value
    this.changed = true
  }

  exec(str: string) {
    if (this.changed) {
      let pat = this.pattern
      for (const key in this.variables) {
        pat = pat.replace(new RegExp(`{{${key}}}`, 'g'), `(?:${this.variables[key]})`)
      }
      this.lastRegExp = new RegExp(pat, this.flags) // TODO: more comprehensive cache instead of last cache
      this.changed = false
    }
    return this.lastRegExp.exec(str)
  }
}
