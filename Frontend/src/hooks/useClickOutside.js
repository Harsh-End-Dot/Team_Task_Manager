import { useEffect } from 'react'

/**
 * Calls `handler` when a pointer/touch event lands outside the referenced
 * element. Used to dismiss popovers and menus.
 */
export function useClickOutside(ref, handler) {
  useEffect(() => {
    function onPointer(event) {
      const el = ref.current
      if (!el || el.contains(event.target)) return
      handler(event)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
    }
  }, [ref, handler])
}
