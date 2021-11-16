export class Timer {
  _start: number
  _prefix: string

  constructor (prefix = '') {
    this._start = new Date().getTime()
    this._prefix = prefix
  }

  start () {
    this._start = new Date().getTime()
  }

  log (task: string, logger = console.log) {
    const now = new Date().getTime()
    logger(`${this._prefix}Completed ${task} in ${this.pretty(now - this._start)}`)
  }

  pretty (ms: number) {
    if (ms > 2000) {
      return `${(ms / 1000).toFixed(1)} sec`
    }
    return `${ms} ms`
  }
}
