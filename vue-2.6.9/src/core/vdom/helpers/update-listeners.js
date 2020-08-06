/* @flow */

import {
  warn,
  invokeWithErrorHandling
} from 'core/util/index'
import {
  cached,
  isUndef,
  isTrue,
  isPlainObject
} from 'shared/util'

// 过滤修饰符 & ~ !
const normalizeEvent = cached((name: string): {
  name: string,
  once: boolean,
  capture: boolean,
  passive: boolean,
  handler?: Function,
  params?: Array<any>
} => {
  // 如果第一个字符是 &
  const passive = name.charAt(0) === '&'
  // 把 & 割了
  name = passive ? name.slice(1) : name
  // 判断第一个字符串是否是~
  const once = name.charAt(0) === '~' // Prefixed last, checked first
  // 割了
  name = once ? name.slice(1) : name
  // 判断第一个字符是否是!
  const capture = name.charAt(0) === '!'
  // 割了
  name = capture ? name.slice(1) : name
  return {
    name,
    once,
    capture,
    passive
  }
})
// createFnInvoker 创建一个调用程序 创建一个钩子函数
// createFnInvoker，如果事件只是个函数就为为事件添加多一个静态类， 
// invoker.fns = fns; 把真正的事件放在fns。而 invoker 则是转义fns然后再运行fns
export function createFnInvoker (
  fns: Function | Array<Function>,  //函数
  vm: ?Component // 实例
  ): Function {
  function invoker () {
    // 获取通过静态方法传进来的函数 赋值给fns
    const fns = invoker.fns
    // 如果fns是数组
    if (Array.isArray(fns)) {
      // 执行浅拷贝
      const cloned = fns.slice()
      // 循环检测执行
      for (let i = 0; i < cloned.length; i++) {
        invokeWithErrorHandling(cloned[i], null, arguments, vm, `v-on handler`)
      }
    } else {
      // return handler return value for single handlers
      // 如果fns不是数组 返回处理程序单个处理程序的返回值
      return invokeWithErrorHandling(fns, null, arguments, vm, `v-on handler`)
    }
  }
  // 重新复
  invoker.fns = fns
  return invoker
}

export function updateListeners (
  on: Object, // 新绑定事件
  oldOn: Object, // 旧绑定事件
  add: Function, // 添加事件的函数
  remove: Function, // 删除事件的函数
  createOnceHandler: Function, // 生成一次调用的函数
  vm: Component  // 实例化对象Vue
) {
  let name, def, cur, old, event
  // 遍历新的事件
  for (name in on) {
    // on[name]是新的事件的值 赋值给def cur
    def = cur = on[name]
    // 旧事件对象中 和 新事件 对象中相同的key值， 保存旧的相同的值
    old = oldOn[name]
    // 过滤事件修饰符 
    event = normalizeEvent(name)
    /* istanbul ignore if */ 
    // 忽略
    if (__WEEX__ && isPlainObject(def)) {
      cur = def.handler
      event.params = def.params
    }
    if (isUndef(cur)) {
      process.env.NODE_ENV !== 'production' && warn(
        `Invalid handler for event "${event.name}": got ` + String(cur),
        vm
      )
    } else if (isUndef(old)) { //判断旧事件值 如果为空  代表没有定义旧的事件
      // 如果函数 fns不存在，
      if (isUndef(cur.fns)) { 
        // 函数 获取钩子函数
        // 创建函数调用器并重新复制给cur和on[name]
        cur = on[name] = createFnInvoker(cur, vm)
      }
      // 如果event.once为true 代表~
      if (isTrue(event.once)) {
        cur = on[name] = createOnceHandler(event.name, cur, event.capture)
      }
      // 添加事件
      add(
        event.name,  //事件名
        cur,  // 转义过的事件 执行静态类
        event.capture,   //事件捕获或冒泡
        event.passive,  // 检测修饰符
        event.params // 事件参数
        )
    } else if (cur !== old) {
      // 如果新的值不等于旧的值
      // 则更新新旧值
      old.fns = cur
      on[name] = old
    }
  }

  for (name in oldOn) {
    //循环旧的值 为空的时候
    if (isUndef(on[name])) {
      //获取事件
      event = normalizeEvent(name)
      //删除旧的值的事件
      remove(event.name, oldOn[name], event.capture)
    }
  }
}
