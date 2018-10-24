import { extname } from 'path'

const mimeMap: Record<string, string> = {
  '': 'application/octet-stream',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.html': 'text/html'
}

export function getContentType(filepath: string): string {
  const ext = extname(filepath)
  return mimeMap[ext in mimeMap ? ext : '']
}
