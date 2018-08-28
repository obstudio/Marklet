export type StringMap<V> = { [key: string]: V }
export type StringLike = string | RegExp
export type ResultMap<T extends StringMap<(...arg: any[]) => any>> = {
  [key in keyof T]: ReturnType<T[key]>
}