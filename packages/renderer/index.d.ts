import { VueConstructor } from 'vue'
import { TokenLike } from '@marklet/core'

export function install(Vue: VueConstructor): void
export function embed(element: string | HTMLElement, content?: TokenLike[]): void
