import { VueConstructor } from 'vue'
import { TokenLike } from '@marklet/core'

interface MarkletTheme {
  key: string
  name: string
}

export const themes: MarkletTheme[]
export function install(Vue: VueConstructor): void
export function embed(element: string | HTMLElement, content?: TokenLike[]): void
