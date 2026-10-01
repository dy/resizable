const DIRECTIONS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']
const CURSORS = { n: 'ns', s: 'ns', e: 'ew', w: 'ew', ne: 'nesw', sw: 'nesw', nw: 'nwse', se: 'nwse' }

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
const number = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback

/** A tiny, dependency-free resizer for DOM elements. */
export default class Resizable extends EventTarget {
  constructor(element, options = {}) {
    super()
    if (!(element instanceof Element)) throw new TypeError('Resizable needs a DOM element')

    this.element = element
    this.options = {
      handles: DIRECTIONS,
      within: null,
      threshold: 0,
      aspectRatio: false,
      draggable: false,
      ...options
    }
    this.handles = {}
    this._cleanups = []
    this._generated = []
    this._positionChanged = false

    if (getComputedStyle(element).position === 'static') {
      element.style.position = 'relative'
      this._positionChanged = true
    }

    this._createHandles()
    if (this.options.draggable) this._makeDraggable()
    if (typeof this.options.resize === 'function') this.on('resize', this.options.resize)
  }

  on(type, listener, options) {
    this.addEventListener(type, listener, options)
    return this
  }

  off(type, listener, options) {
    this.removeEventListener(type, listener, options)
    return this
  }

  destroy() {
    this._cleanups.splice(0).forEach((cleanup) => cleanup())
    this._generated.splice(0).forEach((handle) => handle.remove())
    if (this._positionChanged) this.element.style.removeProperty('position')
    this.handles = {}
  }

  _createHandles() {
    const configured = this.options.handles
    const entries = typeof configured === 'string'
      ? configured.split(/[\s,]+/).filter(Boolean).map((name) => [name, null])
      : Array.isArray(configured)
        ? configured.map((name) => [name, null])
        : Object.entries(configured || {})

    for (const [direction, suppliedHandle] of entries) {
      if (!DIRECTIONS.includes(direction)) throw new TypeError(`Unknown resize handle: ${direction}`)
      const handle = suppliedHandle || document.createElement('div')
      if (!suppliedHandle) this._generated.push(handle)
      handle.classList.add('resizable-handle', `resizable-handle-${direction}`)
      handle.dataset.direction = direction
      handle.setAttribute('role', 'separator')
      handle.setAttribute('aria-label', `Resize ${direction}`)
      handle.tabIndex = 0
      Object.assign(handle.style, handleStyle(direction))
      this.element.append(handle)
      this.handles[direction] = handle

      const pointerdown = (event) => this._startResize(event, direction, handle)
      const keydown = (event) => this._keyboardResize(event, direction)
      handle.addEventListener('pointerdown', pointerdown)
      handle.addEventListener('keydown', keydown)
      this._cleanups.push(() => {
        handle.removeEventListener('pointerdown', pointerdown)
        handle.removeEventListener('keydown', keydown)
      })
    }
  }

  _startResize(event, direction, handle) {
    if (event.button !== 0 || this._active) return
    event.preventDefault()
    event.stopPropagation()
    const start = this._snapshot(event)
    let started = false
    this._active = true
    handle.setPointerCapture?.(event.pointerId)

    const move = (nextEvent) => {
      const dx = nextEvent.clientX - start.x
      const dy = nextEvent.clientY - start.y
      if (!started && Math.hypot(dx, dy) < number(this.options.threshold, 0)) return
      if (!started) {
        started = true
        this._emit('resizestart', this._detail(direction))
      }
      this._applyResize(start, direction, dx, dy, nextEvent.shiftKey)
      this._emit('resize', this._detail(direction))
    }
    const end = () => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', end)
      handle.removeEventListener('pointercancel', end)
      this._active = false
      if (started) this._emit('resizeend', this._detail(direction))
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', end)
    handle.addEventListener('pointercancel', end)
  }

  _snapshot(event) {
    const rect = this.element.getBoundingClientRect()
    const style = getComputedStyle(this.element)
    const container = this.options.within === 'parent' ? this.element.parentElement : this.options.within
    return {
      x: event.clientX,
      y: event.clientY,
      width: rect.width,
      height: rect.height,
      left: Number.parseFloat(style.left) || 0,
      top: Number.parseFloat(style.top) || 0,
      rect,
      bounds: container instanceof Element ? container.getBoundingClientRect() : null,
      minWidth: Number.parseFloat(style.minWidth) || 0,
      minHeight: Number.parseFloat(style.minHeight) || 0,
      maxWidth: Number.parseFloat(style.maxWidth) || Infinity,
      maxHeight: Number.parseFloat(style.maxHeight) || Infinity,
      borderX: style.boxSizing === 'border-box' ? 0 : Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight) + Number.parseFloat(style.borderLeftWidth) + Number.parseFloat(style.borderRightWidth),
      borderY: style.boxSizing === 'border-box' ? 0 : Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom) + Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth)
    }
  }

  _applyResize(start, direction, dx, dy, shiftKey = false) {
    const west = direction.includes('w')
    const north = direction.includes('n')
    const horizontal = /e|w/.test(direction)
    const vertical = /n|s/.test(direction)
    let width = start.width + (horizontal ? (west ? -dx : dx) : 0)
    let height = start.height + (vertical ? (north ? -dy : dy) : 0)

    const ratioOption = this.options.aspectRatio
    const ratio = ratioOption === true || shiftKey ? start.width / start.height : number(ratioOption, 0)
    if (ratio && horizontal && vertical) {
      if (Math.abs(dx) > Math.abs(dy)) height = width / ratio
      else width = height * ratio
    }

    let maxWidth = start.maxWidth
    let maxHeight = start.maxHeight
    if (start.bounds) {
      maxWidth = Math.min(maxWidth, west ? start.rect.right - start.bounds.left : start.bounds.right - start.rect.left)
      maxHeight = Math.min(maxHeight, north ? start.rect.bottom - start.bounds.top : start.bounds.bottom - start.rect.top)
    }
    width = clamp(width, start.minWidth, maxWidth)
    height = clamp(height, start.minHeight, maxHeight)

    if (horizontal) this.element.style.width = `${Math.max(0, width - start.borderX)}px`
    if (vertical) this.element.style.height = `${Math.max(0, height - start.borderY)}px`
    if (west) this.element.style.left = `${start.left + start.width - width}px`
    if (north) this.element.style.top = `${start.top + start.height - height}px`
  }

  _keyboardResize(event, direction) {
    const delta = event.shiftKey ? 10 : 1
    const movement = { ArrowLeft: [-delta, 0], ArrowRight: [delta, 0], ArrowUp: [0, -delta], ArrowDown: [0, delta] }[event.key]
    if (!movement) return
    event.preventDefault()
    const start = this._snapshot({ clientX: 0, clientY: 0 })
    this._emit('resizestart', this._detail(direction))
    this._applyResize(start, direction, ...movement)
    this._emit('resize', this._detail(direction))
    this._emit('resizeend', this._detail(direction))
  }

  _makeDraggable() {
    const down = (event) => {
      if (event.button !== 0 || event.target.closest('.resizable-handle')) return
      const start = this._snapshot(event)
      const move = (nextEvent) => {
        let left = start.left + nextEvent.clientX - start.x
        let top = start.top + nextEvent.clientY - start.y
        if (start.bounds) {
          left += clamp(start.rect.left + nextEvent.clientX - start.x, start.bounds.left, start.bounds.right - start.width) - (start.rect.left + nextEvent.clientX - start.x)
          top += clamp(start.rect.top + nextEvent.clientY - start.y, start.bounds.top, start.bounds.bottom - start.height) - (start.rect.top + nextEvent.clientY - start.y)
        }
        this.element.style.left = `${left}px`
        this.element.style.top = `${top}px`
      }
      const up = () => {
        this.element.removeEventListener('pointermove', move)
        this.element.removeEventListener('pointerup', up)
      }
      this.element.setPointerCapture?.(event.pointerId)
      this.element.addEventListener('pointermove', move)
      this.element.addEventListener('pointerup', up)
    }
    this.element.addEventListener('pointerdown', down)
    this._cleanups.push(() => this.element.removeEventListener('pointerdown', down))
  }

  _detail(direction) {
    const { width, height, left, top } = this.element.getBoundingClientRect()
    return { direction, width, height, left, top }
  }

  _emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }))
    this.element.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }))
  }
}

function handleStyle(direction) {
  const corner = direction.length === 2
  return {
    position: 'absolute',
    zIndex: '1',
    touchAction: 'none',
    userSelect: 'none',
    cursor: `${CURSORS[direction]}-resize`,
    width: corner || /e|w/.test(direction) ? '12px' : 'auto',
    height: corner || /n|s/.test(direction) ? '12px' : 'auto',
    top: direction.includes('n') ? '-6px' : direction.includes('s') ? 'auto' : '0',
    bottom: direction.includes('s') ? '-6px' : direction.includes('n') ? 'auto' : '0',
    left: direction.includes('w') ? '-6px' : direction.includes('e') ? 'auto' : '0',
    right: direction.includes('e') ? '-6px' : direction.includes('w') ? 'auto' : '0'
  }
}

export { DIRECTIONS }
