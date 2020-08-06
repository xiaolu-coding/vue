/* @flow */

import { warn } from 'core/util/index'

export * from './attrs'
export * from './class'
export * from './element'

/**
 * Query an element selector if it's not an element already.
 */
// 获取形式为“#app”的el的节点元素
export function query (el: string | Element): Element {
  // 如果为字符串 “#app”
  if (typeof el === 'string') {
    // 通过#app 获取到元素节点
    const selected = document.querySelector(el)
    // 如果不存在节点
    if (!selected) {
      process.env.NODE_ENV !== 'production' && warn(
        'Cannot find element: ' + el
      )
      // 返回div
      return document.createElement('div')
    }
    // 返回获取到的节点
    return selected
  } else {
    // 如果不是字符串 "#app"形式，直接返回el
    return el
  }  
}
