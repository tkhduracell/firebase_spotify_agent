export type LocalDB<T> = {
  get(key: string): T | null
  set(key: string, t: T): void
  update(key: string, t: Partial<T>): T | undefined
  getOrCompute(key: string, fn: () => Promise<T>): Promise<T>
  has(key: string): boolean
  clear(key: string): boolean
}

export const VERSION = 'v0'

export function createLocalDB<T> (namespace: string): LocalDB<T> {
  const key = (k: string) => `${VERSION}:${namespace}:${k}`

  Object.keys(localStorage).forEach(k => {
    if (!k.startsWith(VERSION + ':')) {
      console.warn(`[db] Deleting ${k} from storage`)
      delete localStorage[k]
    }
  })

  return {
    get (_key: string): T | null {
      const data = localStorage.getItem(key(_key))
      if (data === null || data === undefined) {
        return null
      }
      try {
        return JSON.parse(data) as T
      } catch (e) {
        delete localStorage[key(_key)]
      }
      return null
    },
    set (_key: string, t: T): void {
      localStorage.setItem(key(_key), JSON.stringify(t))
    },
    update (_key: string, delta: Partial<T>): T | undefined {
      const data = localStorage.getItem(key(_key))
      if (data !== null && data !== undefined) {
        try {
          const value = JSON.parse(data) as T
          localStorage.setItem(key(_key), JSON.stringify({ ...value, ...delta }))
          return { ...value, ...delta }
        } catch (e) {
          delete localStorage[key(_key)]
        }
      }
    },
    has (_key: string): boolean {
      const d = localStorage.getItem(key(_key))
      return d !== null && d !== undefined
    },
    clear (_key: string): boolean {
      const d = localStorage.getItem(key(_key))
      if (d !== null && d !== undefined) {
        delete localStorage[key(_key)]
        return true
      }
      return false
    },
    async getOrCompute (_key: string, fn: () => Promise<T>): Promise<T> {
      const data = localStorage.getItem(key(_key))
      if (data) {
        return Promise.resolve(JSON.parse(data) as T)
      } else {
        const value = await fn()
        localStorage.setItem(key(_key), JSON.stringify(value))
        return value
      }
    }
  }
}
