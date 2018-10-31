import { extname } from 'path'

const mimeMap: Record<string, string> = {
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.html': 'text/html'
}
const fallbackMime = 'application/octet-stream'

export function getContentType(filepath: string): string {
  const ext = extname(filepath)
  return mimeMap[ext] || fallbackMime
}
