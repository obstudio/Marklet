import debounce from 'lodash.debounce'
import EventEmitter from 'events'
import { Server } from './index'

interface ServerMessage {
  type: string
  [ key: string ]: any
}

export default class MarkletManager extends EventEmitter {
  private messageQueue: ServerMessage[] = []
  private server: Server

  public update?(): void
  public dispose?(reason: string): void
  public debouncedUpdate: () => void

  public initialize() {
    this.on('update', (data) => {
      if (!this.server) {
        this.messageQueue.push(data)
      } else {
        this.server.wsServer.broadcast(JSON.stringify(data))
      }
    })

    this.debouncedUpdate = debounce(() => this.update(), 200)
    this.update()
  }

  public bind(server: Server) {
    this.server = server
    this.once('close', reason => server.dispose(reason))
    server.wsServer.on('connection', (ws) => {
      this.messageQueue.forEach(msg => ws.send(JSON.stringify(msg)))
      if (server.serverType !== 'edit') return
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message)
          this.emit('client.message', data)
          this.emit('client.' + data.type, data)
        } catch (error) {
          this.emit('client.error', error)
        }
      })
    })
    return this
  }
}
