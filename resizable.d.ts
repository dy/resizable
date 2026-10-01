export type Direction = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'

export interface ResizeDetail {
  direction: Direction
  width: number
  height: number
  left: number
  top: number
}

export interface ResizableOptions {
  handles?: Direction[] | string | Partial<Record<Direction, HTMLElement>>
  within?: HTMLElement | 'parent' | null
  threshold?: number
  aspectRatio?: boolean | number
  draggable?: boolean
  resize?: (event: CustomEvent<ResizeDetail>) => void
}

export default class Resizable extends EventTarget {
  constructor(element: HTMLElement, options?: ResizableOptions)
  readonly element: HTMLElement
  readonly handles: Partial<Record<Direction, HTMLElement>>
  on(type: 'resizestart' | 'resize' | 'resizeend', listener: EventListener, options?: AddEventListenerOptions | boolean): this
  off(type: 'resizestart' | 'resize' | 'resizeend', listener: EventListener, options?: EventListenerOptions | boolean): this
  destroy(): void
}

export const DIRECTIONS: readonly Direction[]
