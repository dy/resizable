import test from 'node:test'
import assert from 'node:assert/strict'

class ClassList {
  names = new Set()
  add(...names) { names.forEach((name) => this.names.add(name)) }
}

class FakeElement extends EventTarget {
  constructor(rect = {}) {
    super()
    this.rect = { left: 0, top: 0, width: 200, height: 100, ...rect }
    this.style = {
      position: '',
      setProperty(name, value) { this[name] = value },
      removeProperty(name) { delete this[name] }
    }
    this.classList = new ClassList()
    this.dataset = {}
    this.children = []
    this.parentElement = null
  }
  append(child) { child.parentElement = this; this.children.push(child) }
  remove() { this.parentElement?.children.splice(this.parentElement.children.indexOf(this), 1) }
  setAttribute() {}
  setPointerCapture() {}
  closest(selector) { return selector === '.resizable-handle' && this.classList.names.has('resizable-handle') ? this : null }
  getBoundingClientRect() {
    const width = Number.parseFloat(this.style.width) || this.rect.width
    const height = Number.parseFloat(this.style.height) || this.rect.height
    const left = this.rect.left + (Number.parseFloat(this.style.left) || 0)
    const top = this.rect.top + (Number.parseFloat(this.style.top) || 0)
    return { left, top, width, height, right: left + width, bottom: top + height }
  }
}

globalThis.Element = FakeElement
globalThis.CustomEvent = class extends Event { constructor(type, options = {}) { super(type, options); this.detail = options.detail } }
globalThis.document = { createElement: () => new FakeElement() }
globalThis.getComputedStyle = (element) => ({
  position: element.style.position || 'absolute', boxSizing: 'border-box',
  left: element.style.left || '0', top: element.style.top || '0',
  minWidth: '0', minHeight: '0', maxWidth: 'none', maxHeight: 'none',
  paddingLeft: '0', paddingRight: '0', paddingTop: '0', paddingBottom: '0',
  borderLeftWidth: '0', borderRightWidth: '0', borderTopWidth: '0', borderBottomWidth: '0'
})

const { default: Resizable } = await import('../resizable.js')

function pointer(type, properties) {
  const event = new Event(type, { cancelable: true })
  Object.assign(event, { button: 0, pointerId: 1, clientX: 0, clientY: 0, shiftKey: false }, properties)
  return event
}

test('creates only the requested handles and cleans them up', () => {
  const element = new FakeElement()
  const resizable = new Resizable(element, { handles: 'e, se' })
  assert.deepEqual(Object.keys(resizable.handles), ['e', 'se'])
  assert.equal(element.children.length, 2)
  resizable.destroy()
  assert.equal(element.children.length, 0)
})

test('resizes with pointer events and emits useful detail', () => {
  const element = new FakeElement()
  const resizable = new Resizable(element, { handles: ['se'] })
  const handle = resizable.handles.se
  let detail
  resizable.on('resize', (event) => { detail = event.detail })

  handle.dispatchEvent(pointer('pointerdown', { clientX: 10, clientY: 10 }))
  handle.dispatchEvent(pointer('pointermove', { clientX: 50, clientY: 35 }))
  handle.dispatchEvent(pointer('pointerup', { clientX: 50, clientY: 35 }))

  assert.equal(element.style.width, '240px')
  assert.equal(element.style.height, '125px')
  assert.deepEqual(detail, { direction: 'se', width: 240, height: 125, left: 0, top: 0 })
})

test('north-west resizing moves the element and respects bounds', () => {
  const parent = new FakeElement({ width: 500, height: 400 })
  const element = new FakeElement({ left: 100, top: 100 })
  parent.append(element)
  const resizable = new Resizable(element, { handles: ['nw'], within: 'parent' })
  const handle = resizable.handles.nw

  handle.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100 }))
  handle.dispatchEvent(pointer('pointermove', { clientX: -100, clientY: -100 }))

  assert.equal(element.style.width, '300px')
  assert.equal(element.style.height, '200px')
  assert.equal(element.style.left, '-100px')
  assert.equal(element.style.top, '-100px')
})
