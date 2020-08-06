/* @flow */

import { hasOwn } from 'shared/util'
import { warn, hasSymbol } from '../util/index'
import { defineReactive, toggleObserving } from '../observer/index'

// 这对选项需要一起使用，以允许一个祖先组件向其所有子孙后代注入一个依赖，
// 不论组件层次有多深，并在起上下游关系成立的时间里始终生效。如果你熟悉 
// React，这与 React 的上下文特性很相似。
// 参考：https://cn.vuejs.org/v2/api/#provide-inject

// 解析provide
// provide 选项应该是一个对象或返回一个对象的函数。该对象包含可注入其子孙的属性，用于组件通信。
export function initProvide (vm: Component) {
  // 获取provide
  const provide = vm.$options.provide
  // 如果存在
  if (provide) {
    // 如果是函数，立马执行，不是就还是provide
    vm._provided = typeof provide === 'function'
      ? provide.call(vm)
      : provide
  }
}
// provide 和 inject 绑定并不是可响应的。这是刻意为之的。然而，如果你传入了一个可监听的对象，那么其对象的 property 还是可响应的。
// 解析inject 注入
// inject 选项应该是一个字符串数组或一个对象，该对象的 key 代表了本地绑定的名称，value 为其 key (字符串或 Symbol) 以在可用的注入中搜索。
export function initInjections (vm: Component) {
  // 解析inject，结果为result
  const result = resolveInject(vm.$options.inject, vm)
  // 如果结果存在 对传入的数据做响应化处理
  if (result) {
    // 不可以添加到观察者模式
    toggleObserving(false)
    // 遍历
    Object.keys(result).forEach(key => {
      /* istanbul ignore else */
      // 忽略
      if (process.env.NODE_ENV !== 'production') {
        defineReactive(vm, key, result[key], () => {
          warn(
            `Avoid mutating an injected value directly since the changes will be ` +
            `overwritten whenever the provided component re-renders. ` +
            `injection being mutated: "${key}"`,
            vm
          )
        })
      } else {
        // 给每个加上响应式 这里可以证明后代注入进来的组件也是响应式的
        defineReactive(vm, key, result[key])
      }
    })
    // 可以添加到观察者模式
    toggleObserving(true)
  }
}
// ，遍历 key 数组，通过向上冒泡来
// 如果有，则将这个数据传递给 result；如果没有，检查 inject 是否有 default 选项设定默认值或者默认方法，如果有则将默认值返传给 result，最终返回 result 对象。
// 所以，inject 的写法应该是有 default 默认值的：



export function resolveInject (inject: any, vm: Component): ?Object {
  if (inject) {
    // inject is :any because flow is not smart enough to figure out cached
    // inject是:any，因为flow不够智能，无法计算缓存
    // 创建空对象
    const result = Object.create(null)
    // 如果支持hasSymbol
    // 获取inject选项的key数组
    const keys = hasSymbol
      ? Reflect.ownKeys(inject)
      : Object.keys(inject) //不支持就用 Object.keys

    // 遍历key数组
    for (let i = 0; i < keys.length; i++) {
      // 获取每个key
      const key = keys[i]
      // #6574 in case the inject object is observed...
      // 如果观察到inject的属性已经是响应式 继续下一次循环
      if (key === '__ob__') continue
      // 查找provide中是否有key与inject的from属性同名的，
      const provideKey = inject[key].from
      
      let source = vm
     
      while (source) {
        // 判断_provided 是否存在 并且是对象的时候，并且provide中有key与inject的from属性同名的，
        if (source._provided && hasOwn(source._provided, provideKey)) {
          // 将数据给result存起来
          result[key] = source._provided[provideKey]
          break
        }
        // 递归循环父节点
        source = source.$parent
      }
      // 如果vm 不存在
      if (!source) {
        // 判断是否有default key
        // 是否有default选项设定默认值或者默认方法
        if ('default' in inject[key]) {
          // 存在就获取这个default key的值
          const provideDefault = inject[key].default
          // 如果这个值是函数，执行
          result[key] = typeof provideDefault === 'function'
            ? provideDefault.call(vm)
            : provideDefault
        } else if (process.env.NODE_ENV !== 'production') {
          warn(`Injection "${key}" not found`, vm)
        }
      }
    }
    // 最后返回result
    return result
  }
}
