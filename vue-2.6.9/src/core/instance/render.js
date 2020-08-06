/* @flow */

import {
  warn,
  nextTick,
  emptyObject,
  handleError,
  defineReactive
} from '../util/index'

import { createElement } from '../vdom/create-element'
import { installRenderHelpers } from './render-helpers/index'
import { resolveSlots } from './render-helpers/resolve-slots'
import { normalizeScopedSlots } from '../vdom/helpers/normalize-scoped-slots'
import VNode, { createEmptyVNode } from '../vdom/vnode'

import { isUpdatingChildComponent } from './lifecycle'

// 初始化渲染 _c $createElement 和$attrs listeners的响应化
export function initRender (vm: Component) {
  // 子树的根
  vm._vnode = null // the root of the child tree
  // v-once 上缓存的树
  vm._staticTrees = null // v-once cached trees
  // 选项
  const options = vm.$options
  // 虚拟DOM
  const parentVnode = vm.$vnode = options._parentVnode // the placeholder node in parent tree
  // 上下文
  const renderContext = parentVnode && parentVnode.context
  // 插槽信息 resolveSlots:todo
  vm.$slots = resolveSlots(options._renderChildren, renderContext)
  // 作用域插槽
  vm.$scopedSlots = emptyObject
  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates
  // 将createElement fn绑定在这个实例上
  // 这样我们就能得到合适的渲染上下文
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // 内部版本由模板编译的呈现函数使用
  // _c 就是creatElement :todo createElement
  // 默认编译器 内部由模板编译的函数 _c
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
  // normalization is always applied for the public version, used in
  // user-written render functions.
  // 用户编写的渲染函数
  // $createElement h函数 也就是在initRender中声明
  // 自己写的render中的h
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)

  // $attrs & $listeners are exposed for easier HOC creation.
  // $attrs和$listeners要被公开，以便更容易地进行临时创建
  // they need to be reactive so that HOCs using them are always updated
  // 他们是要被响应式的，以便使用它们的HOCs时总是能响应式更新

  // 获取父节点 
  const parentData = parentVnode && parentVnode.data

  /* istanbul ignore else */
  // 忽略
  if (process.env.NODE_ENV !== 'production') {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$attrs is readonly.`, vm)
    }, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$listeners is readonly.`, vm)
    }, true)
  } else {
    
    // 响应化：通过defineProperty的set去notify()通知subscribers有值被修改，并执行watchers的update函数
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, null, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, null, true)
  }
}

export let currentRenderingInstance: Component | null = null

// for testing only
// :忽略 测试用
export function setCurrentRenderingInstance (vm: Component) {
  currentRenderingInstance = vm
}
// $nextTick _render
export function renderMixin (Vue: Class<Component>) {
  // install runtime convenience helpers
  // 安装运行时助手
  installRenderHelpers(Vue.prototype)
  // $nextTick :todo 涉及到timerFunc 从Promise选择到Settimeout 涉及宏、微任务 
  Vue.prototype.$nextTick = function (fn: Function) {
    return nextTick(fn, this)
  }
  // _render  获取自己写的render 
  Vue.prototype._render = function (): VNode {
    // vue实例
    const vm: Component = this
    // 拿到render和父节点
    const { render, _parentVnode } = vm.$options

    // 如果父节点存在
    if (_parentVnode) {
      // 获取作用域插槽
      vm.$scopedSlots = normalizeScopedSlots(
        _parentVnode.data.scopedSlots,
        vm.$slots,
        vm.$scopedSlots
      )
    }

    // set parent vnode. this allows render functions to have access
    // 设置父vnode,这允许渲染函数访问
    // to the data on the placeholder node.
    // 占位符节点上的数据。
    // 把父vnode赋给$vnode
    vm.$vnode = _parentVnode
    // render self
    // 渲染自己
    let vnode
    try {
      // There's no need to maintain a stack becaues all render fns are called
      // separately from one another. Nested component's render fns are called
      // when parent component is patched.
      // 不需要维护堆栈，因为所有渲染fn都是彼此独立调用的。
      // 当修补父组件时，将调用嵌套组件的render fn。
      currentRenderingInstance = vm
      // render调用一次返回vdom
      vnode = render.call(vm._renderProxy, vm.$createElement)
    } catch (e) {
      // 收集错误 抛出错误
      handleError(e, vm, `render`)
      // return error render result,
      // or previous vnode to prevent render error causing blank component
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production' && vm.$options.renderError) {
        try {
          vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e)
        } catch (e) {
          handleError(e, vm, `renderError`)
          vnode = vm._vnode
        }
      } else {
        vnode = vm._vnode
      }
    } finally {
      currentRenderingInstance = null
    }
    // if the returned array contains only a single node, allow it
    // 如果返回的vdom是数组并且长度为一，则允许他
    if (Array.isArray(vnode) && vnode.length === 1) {
      vnode = vnode[0]
    }
    // return empty vnode in case the render function errored out
    // 如果render函数出错，则返回空的vnode
    if (!(vnode instanceof VNode)) {
      if (process.env.NODE_ENV !== 'production' && Array.isArray(vnode)) {
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        )
      }
      // 创建一个空vnode 
      vnode = createEmptyVNode()
    }
    // set parent
    // 设置父vnode
    vnode.parent = _parentVnode
    // 返回vdom
    return vnode
  }
}
