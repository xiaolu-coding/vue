/* @flow */

import {
  tip,
  toArray,
  hyphenate,
  formatComponentName,
  invokeWithErrorHandling
} from '../util/index'
import { updateListeners } from '../vdom/helpers/index'

// 初始化事件
export function initEvents (vm: Component) {
  // 初始化_events事件队列
  vm._events = Object.create(null)
  // 初始化判断是否有生命周期钩子函数
  vm._hasHookEvent = false
  // init parent attached events 初始化父亲事件 
  const listeners = vm.$options._parentListeners // 旧的事件
  // 如果有旧的事件
  if (listeners) {
    // 组件初始化事件监听器 更新组件事件
    updateComponentListeners(vm, listeners)
  }
}

let target: any
// target.$on的代理 添加事件  用来updateListeners:todo
function add (
  event, //事件名
  fn //函数
  ) {
  target.$on(event, fn)
}
// target.$off 解绑事件  用来updateListeners:todo
function remove (
  event, // 事件名
  fn // 函数
  ) {
  target.$off(event, fn)
}
// 返回一个直接调用函数的方法，调用完就删除事件，用来updateListeners:todo
function createOnceHandler (
  event,  // 事件名
  fn //函数
  ) {
  // 获取target
  const _target = target
  // 返回onceHandler
  return function onceHandler () {
    // 执行fn
    const res = fn.apply(null, arguments)
    // 如果res不为空
    if (res !== null) {
      // 解绑事件，用完就删，提上裤子就是硬气
      _target.$off(event, onceHandler)
    }
  }
}
// 更新组件事件 在initEvents中会调用 在updateChildComponent中会调用
export function updateComponentListeners (
  vm: Component, //虚拟dom 实例
  listeners: Object,  //新的事件队列
  oldListeners: ?Object //旧事件队列
) {
  target = vm
  // 为listeners增加事件 为oldListeners删除事件
  updateListeners(listeners, oldListeners || {}, add, remove, createOnceHandler, vm)
  target = undefined
}
// 在eventsMixin中实现这四个方法  $on $once $emit $off
export function eventsMixin (Vue: Class<Component>) {
  // 开头为hook的字符串
  const hookRE = /^hook:/
  // $on : 添加绑定事件
  Vue.prototype.$on = function (
    event: string | Array<string>,  //事件名
    fn: Function  //函数
    ): Component { //返回组件类型
      // 获取当前Vue实例
    const vm: Component = this
    // 如果事件是数组
    if (Array.isArray(event)) {
      // 递归绑定事件
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$on(event[i], fn)
      }
    } else {
      // 如果不是数组
      // 把所有事件拆分存放到_events 事件队列中
      (vm._events[event] || (vm._events[event] = [])).push(fn)
      // optimize hook:event cost by using a boolean flag marked at registration
      // instead of a hash lookup
      // 如果是hook开头，则这个事件标记为vue声明周期钩子函数
      if (hookRE.test(event)) {
        // 标记为true
        vm._hasHookEvent = true
      }
    }
    // 返回实例
    return vm
  }
  // $once : 添加一次事件
  Vue.prototype.$once = function (
    event: string, // 事件
     fn: Function  // 函数
     ): Component { //返回组件类型
    // 获取当前Vue实例
    const vm: Component = this

    function on () {
      // 解绑事件 执行一次
      vm.$off(event, on)
      // 执行事件
      fn.apply(vm, arguments)
    }
    // 将fn传入 on中
    on.fn = fn
    // 将on绑定执行一次，在内部会解绑，也就是执行一次就解绑
    vm.$on(event, on)
    return vm
  }
  // $off : vue把事件添加到一个数组队列里面，通过删除该数组事件队列，而达到解绑事件
  // 移除自定义事件监听器。
  // 如果没有提供参数，则移除所有的事件监听器；

  // 如果只提供了事件，则移除该事件所有的监听器；

  // 如果同时提供了事件与回调，则只移除这个回调的监听器。
  Vue.prototype.$off = function (
    event?: string | Array<string>, // 事件名
    fn?: Function // 函数
    ): Component { // 返回组件类型
      // 获取当前Vue实例
    const vm: Component = this
    // all 因为两个参数都是可选参数
    // 如果没有参数的情况下 
    if (!arguments.length) {
      // 清空事件队列
      vm._events = Object.create(null)
      // 返回 vm
      return vm
    }
    // array of events 
    // 如果事件是数组
    if (Array.isArray(event)) {
      // 递归解绑
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$off(event[i], fn)
      }
      return vm
    }
    // specific event
    // 特定事件
    const cbs = vm._events[event]
    // 如果事件不存在
    if (!cbs) {
      // 返回vm
      return vm
    }
    // 如果函数不存在 只传了事件
    if (!fn) {
      // 移除当前事件的监听器
      vm._events[event] = null
      // 返回vm
      return vm
    }
    // specific handler
    let cb
    // 获取事件数组长度
    let i = cbs.length
    // 循环删除事件监听器
    while (i--) {
      cb = cbs[i]
      if (cb === fn || cb.fn === fn) {
        // 清空事件数组
        cbs.splice(i, 1)
        break
      }
    }
    return vm
  }
  // $emit : 触发事件
  Vue.prototype.$emit = function (
    event: string // 事件名
    ): Component { // 返回组件类型
    // 获取当前Vue实例
    const vm: Component = this
    if (process.env.NODE_ENV !== 'production') {
      // 获取小写的事件名
      const lowerCaseEvent = event.toLowerCase()
      // 如果小写后不等于之前事件名 并且 不存在在_events事件队列中
      if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
        // 发出警告
        tip(
          `Event "${lowerCaseEvent}" is emitted in component ` +
          `${formatComponentName(vm)} but the handler is registered for "${event}". ` +
          `Note that HTML attributes are case-insensitive and you cannot use ` +
          `v-on to listen to camelCase events when using in-DOM templates. ` +
          `You should probably use "${hyphenate(event)}" instead of "${event}".`
        )
      }
    }
    // 获取事件值
    let cbs = vm._events[event]
    // 如果存在事件值
    if (cbs) {
      // 根据长度 赋给数组和单个 
      cbs = cbs.length > 1 ? toArray(cbs) : cbs
      // 将参数变为数组 toArray:将类数组转换成真的数组 第一个参数是类数组，第二个是从第几个开始
      const args = toArray(arguments, 1)
      // 模板字符串拼接：event handler for "事件名"
      const info = `event handler for "${event}"`
      // 循环
      for (let i = 0, l = cbs.length; i < l; i++) {
        // 调用错误处理 错误处理中会有执行 
        invokeWithErrorHandling(cbs[i], vm, args, vm, info)
      }
    }
    return vm
  }
}
