export type LocalDB<T> = {
  get(key: string): T | null
  set(key: string, t: T): void
  getOrCompute(key: string, fn: () => Promise<T>): Promise<T>
  has(key: string): boolean
}
export function createLocalDB<T>(namespace: string): LocalDB<T> {
  return {
    get(key: string): T | null {
      const data = localStorage.getItem(namespace + ':' + key)
      if (data === null || data === undefined) {
        return null
      }
      try {
        return JSON.parse(data) as T
      } catch (e) {
        delete localStorage[namespace + ':' + key]
      }
      return null
    },
    set(key: string, t: T): void {
      localStorage.setItem(namespace + ':' + key, JSON.stringify(t))
    },
    has(key: string): boolean {
      const d = localStorage.getItem(namespace + ':' + key)
      return d !== null && d !== undefined
    },
    async getOrCompute(key: string, fn: () => Promise<T>): Promise<T> {
      const data = localStorage.getItem(namespace + ':' + key)
      if (data) {
        return Promise.resolve(JSON.parse(data) as T)
      } else {
        const value = await fn()
        localStorage.setItem(namespace + ':' + key, JSON.stringify(value))
        return value
      }
    },
  }
}
