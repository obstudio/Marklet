import { makeRe } from 'minimatch'

export default function(ignores: string[]): (name: string) => boolean {
  const globs: RegExp[] = []
  ignores.forEach((pattern) => {
    if (typeof pattern === 'string') {
      globs.push(makeRe(pattern, { flipNegate: true }))
    } else {
      globs.push(pattern)
    }
  })
  return (name) => {
    let result = true
    for (const regexp of globs) {
      if (regexp.test(name)) {
        result = false
        break
      }
    }
    return result
  }
}
