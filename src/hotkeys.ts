import { onMounted, onUnmounted } from '@vue/composition-api'

export type KeyMap = {
  [key: string]: () => void | Promise<void>
}

export function useHotKeys ($root: Vue, keys: KeyMap) {
  function onKeyPress (e: Event) {
    if (e.target instanceof Element && e.target.id === 'input-tempo') return
    if (e.target instanceof Element && e.target.id === 'input-search') return
    if (e instanceof KeyboardEvent) {
      console.log(e.code.toLowerCase())
      if (e.code.toLowerCase() in keys) {
        keys[e.code.toLowerCase()]()
      }
    }
  }

  onMounted(() => {
    $root.$el.ownerDocument.addEventListener('keyup', onKeyPress)
  })

  onUnmounted(() => {
    $root.$el.ownerDocument.removeEventListener('keyup', onKeyPress)
  })
}
