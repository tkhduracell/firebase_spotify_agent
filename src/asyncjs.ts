// eslint-disable-next-line @typescript-eslint/ban-ts-comment
/** @ts-ignore */
import postscribe from 'postscribe'

export async function loadScript (parent: Element, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    postscribe(parent, (document: Document) => {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      document.body.appendChild(script)
    }, {
      afterAsync: () => resolve(),
      error: (error: Error) => reject(error)
    })
  })
}
