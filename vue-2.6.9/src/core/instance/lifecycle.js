/* @flow */

import config from '../config'
import Watcher from '../observer/watcher'
import {
  mark,
  measure
} from '../util/perf'
import {
  createEmptyVNode
} from '../vdom/vnode'
import {
  updateComponentListeners
} from './events'
import {
  resolveSlots
} from './render-helpers/resolve-slots'
import {
  toggleObserving
} from '../observer/index'
import {
  pushTarget,
  popTarget
} from '../observer/dep'

import {
  warn,
  noop,
  remove,
  emptyObject,
  validateProp,
  invokeWithErrorHandling
} from '../util/index'

export let activeInstance: any = null
export let isUpdatingChildComponent: boolean = false

// 设置active实例
export function setActiveInstance(vm: Component) {
  // 记录之前的activeInstance
  const prevActiveInstance = activeInstance
  // 将传入的赋给activeInstance
  activeInstance = vm
  return () => {
    // 返回之前的
    activeInstance = prevActiveInstance
  }
}
// 这里导出了initLifecycle 初始化生命周期相关的属性 以及为一些属性赋值
export function initLifecycle(vm: Component) {
  // 获取选项
  const options = vm.$options

  // locate first non-abstract parent
  // 定位第一个"非抽象"的父组件
  // https://cn.vuejs.org/v2/api/#keep-alive 在这里可以看为什么要非抽象
  // <keep-alive> 是一个抽象组件：它自身不会渲染一个 DOM 元素，也不会出现在组件的父组件链中。
  let parent = options.parent
  // 定位第一个非抽象父组件
  if (parent && !options.abstract) {
    // 判断parent父亲节点是否存在，并且判断是否存在抽象节点
    // 如果父实例parent是抽象组件，则继续找parent上的parent，直到找到非抽象组件为止
    while (parent.$options.abstract && parent.$parent) {
      // 如果有父亲抽象组件，则把父或爷爷节点给当前节点的父亲节点
      parent = parent.$parent
    }
    // 子节点添加vm
    // 把当前vm实例push到定位的第一个非抽象parent的$children属性上
    parent.$children.push(vm)
  }
  // 初始化一些属性 
  // 这里的parent可以告诉我们，子组件创建时，父组件已经存在了
  // 添加$parent
  vm.$parent = parent
  // 判断parent是否是root 如果是 则把parent.$root赋给$root
  vm.$root = parent ? parent.$root : vm
  // 当前实例的直接子组件。需要注意 $children 并不保证顺序，也不是响应式的。
  vm.$children = []
  // 获取节点的key 一个对象，持有已注册过 ref 的所有子组件。
  vm.$refs = {}
  // 内部属性，不希望被访问的
  vm._watcher = null //	组件实例相应的 watcher 实例对象
  vm._inactive = null // 表示keep-alive中组件状态，如被激活，该值为false,反之为true。
  vm._directInactive = false // 也是表示keep-alive中组件状态的属性。
  vm._isMounted = false // 当前实例是否完成挂载(对应生命周期图示中的mounted)。
  vm._isDestroyed = false // 当前实例是否已经被销毁(对应生命周期图示中的destroyed)。
  vm._isBeingDestroyed = false // 是否已经销毁的组件 如果为true 则不触发 beforeDestroy 钩子函数 和destroyed 钩子函数 当前实例是否正在被销毁,还没有销毁完成(介于生命周期图示中deforeDestroy和destroyed之间)。
}

// 初始化 _update $forceUpdate $destroy \src\core\instance\index.js中调用
export function lifecycleMixin(Vue: Class < Component > ) {
  // _update : 更新数据 主要功能在于第一次和后面更新是用的不同__patch__，根据preveVnode判断是否有vnode
  Vue.prototype._update = function (vnode: VNode, hydrating ? : boolean) {
    // 保存Vue实例
    const vm: Component = this
    // 获取Vue的el
    const prevEl = vm.$el
    // 获取Vue的vnode 标志上一个vnode
    const prevVnode = vm._vnode

    const restoreActiveInstance = setActiveInstance(vm)
    vm._vnode = vnode //标志上一个vnode
    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if (!prevVnode) {
      // 如果prevVnode不存在，表示上一次没有创建vnode，这个组件或者new Vue 是第一次进来
      // initial render
      // 更新虚拟dom 
      vm.$el = vm.__patch__(
        vm.$el, //真正的dom
        vnode, //vnode
        hydrating, //ssr相关
        false /* removeOnly */ )
    } else {
      // 如果prevVnode存在,表示已经创建过vnode，所以只要更新数据就行了
      // updates 
      // 更新
      vm.$el = vm.__patch__(prevVnode, vnode)
    }
    // vue的实例化对象
    restoreActiveInstance()
    // update __vue__ reference
    // 更新vue参考
    if (prevEl) {
      prevEl.__vue__ = null
    }
    if (vm.$el) { //更新vue
      vm.$el.__vue__ = vm
    }
    // if parent is an HOC, update its $el as well
    //如果parent是一个HOC，那么也要更新它的$el
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el
    }
    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
    // 调度器调用update hook以确保子节点是在父类的更新钩子中更新。
  }
  // $forceUpdate :强制更新数据 观察者数据
  Vue.prototype.$forceUpdate = function () {
    // 保存vue实例
    const vm: Component = this
    // 如果有_watcher 观察者，就更新
    if (vm._watcher) {
      // 执行update 更新观察者数据
      vm._watcher.update()
    }
  }
  // $destroy :销毁组件
  Vue.prototype.$destroy = function () {
    // 保存vue实例
    const vm: Component = this
    // 如果已经销毁过，直接返回
    if (vm._isBeingDestroyed) {
      return
    }
    // 触发生命周期beforeDestroy钩子函数
    callHook(vm, 'beforeDestroy')
    // 将这个标识设为true，表示已经开始销毁
    vm._isBeingDestroyed = true
    // remove self from parent
    // 从父节点移除self
    const parent = vm.$parent
    // 如果父节点还存在，并没有被销毁
    if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
      // 删除父节点
      remove(parent.$children, vm)
    }
    // teardown watchers
    // 如果_watcher还存在 拆卸观察者
    if (vm._watcher) {
      vm._watcher.teardown()
    }
    // 获取观察者长度
    let i = vm._watchers.length
    // 全部删除
    while (i--) {
      vm._watchers[i].teardown()
    }
    // remove reference from data ob
    // 从ob中删除引用
    // frozen object may not have observer.
    // 被冻结的对象可能没有观察者
    if (vm._data.__ob__) {
      vm._data.__ob__.vmCount--
    }
    // call the last hook...
    // 将这个设为true，表示已经完成销毁 调用最后一个钩子函数
    vm._isDestroyed = true
    // invoke destroy hooks on current rendered tree
    // 调用当前渲染树上的销毁钩子
    vm.__patch__(vm._vnode, null)
    // fire destroyed hook
    // 触发生命周期destroyed钩子函数
    callHook(vm, 'destroyed')
    // turn off all instance listeners.
    // 销毁事件监听器
    vm.$off()
    // remove __vue__ reference
    // 删除vue参数
    if (vm.$el) {
      vm.$el.__vue__ = null
    }
    // release circular reference (#6759)
    // 释放循环引用 销毁父节点
    if (vm.$vnode) {
      vm.$vnode.parent = null
    }
  }
}

// mountComponent :安装组件
export function mountComponent(
  vm: Component, //vnode
  el: ? Element, //dom
  hydrating ? : boolean //ssr相关
): Component {
  // 获取el，也就是dom
  vm.$el = el
  // 如果选项中没有render函数 这里说的render就是实例化vm的render，虚拟dom调用的渲染函数
  if (!vm.$options.render) {
    // render等于 createEmptyVNode函数
    // createEmptyVNode是一个创建一个节点 空的vNode的函数
    vm.$options.render = createEmptyVNode
    if (process.env.NODE_ENV !== 'production') {
      /* istanbul ignore if */
      // 如果template第一个不是#，就警告
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el || el) {
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        )
      } else {
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        )
      }
    }
  }
  // 执行生命周期 beforeMount 钩子函数
  callHook(vm, 'beforeMount')
  // 更新组件 
  let updateComponent
  /* istanbul ignore if */
  // 忽略 如果开发环境
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    updateComponent = () => {
      const name = vm._name
      const id = vm._uid
      const startTag = `vue-perf-start:${id}`
      const endTag = `vue-perf-end:${id}`

      mark(startTag)
      const vnode = vm._render()
      mark(endTag)
      measure(`vue ${name} render`, startTag, endTag)

      mark(startTag)
      vm._update(vnode, hydrating)
      mark(endTag)
      measure(`vue ${name} patch`, startTag, endTag)
    }
  } else {
    // updateComponet函数 直接更新view视图
    updateComponent = () => {
      
      vm._update(
        /*
          render 是  虚拟dom，需要执行的编译函数 类似于这样的函数
          (function anonymous( ) {
          with(this){return _c('div',{attrs:{"id":"app"}},[_c('input',{directives:[{name:"info",rawName:"v-info"},{name:"data",rawName:"v-data"}],attrs:{"type":"text"}}),_v(" "),_m(0)])}
          })
        */
        vm._render(), 
        // ssr相关
        hydrating
        )
    }
  }

  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  // 我们在观察者的构造函数中设置vm._watcher
  // 因为观察者的初始patch可能调用$foreceUpdate(例如 inside child 组件的挂载钩子)
  // 它依赖于已经定义的vm._watcher
  new Watcher(
    vm, //vnode
    updateComponent, //上面的更新视图函数
    noop, //回调函数
    {
      before() {
        // 如果已经挂载并且没有被销毁
        if (vm._isMounted && !vm._isDestroyed) {
          // 触发生命周期 beforeUpdate 钩子函数
          callHook(vm, 'beforeUpdate')
        }
      }
    }, 
    true /* isRenderWatcher */ )
  hydrating = false

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  // 手动挂载实例，调用挂载在self上
  // 在插入的钩子中为呈现器创建的子组件调用
  // 如果没有vnode，代表挂载完毕
  if (vm.$vnode == null) {
    // 将这个设为true
    vm._isMounted = true
    // 触发生命周期 mounted 钩子函数
    callHook(vm, 'mounted')
  }
  // return vm
  return vm
}
// 更新子组件
export function updateChildComponent(
  vm: Component, //vnode
  propsData: ? Object, //props
  listeners : ? Object, //事件监听
  parentVnode : MountedComponentVNode, //父亲vnode
  renderChildren: ? Array < VNode > //子节点
) {
  if (process.env.NODE_ENV !== 'production') {
    // 将这个设为true 是否更新过了子组件
    isUpdatingChildComponent = true
  }
  
  // determine whether component has slot children
  // we need to do this before overwriting $options._renderChildren.
  // 确定组件是否有子级插槽
  // 我们需要在覆盖$options._renderChildren之前执行此操作。


  // check if there are dynamic scopedSlots (hand-written or compiled but with
  // dynamic slot names). Static scoped slots compiled from template has the
  // "$stable" marker.
  // 检查是否有动态scopedslot（手工编写或编译，但使用
  // 动态插槽名称）。从模板编译的静态作用域插槽具有
  // “$stable”标记。
  
  // 新的作用域插槽
  const newScopedSlots = parentVnode.data.scopedSlots
  // 旧的作用域插槽
  const oldScopedSlots = vm.$scopedSlots
  // 是否有动态作用域插槽
  const hasDynamicScopedSlot = !!(
    (newScopedSlots && !newScopedSlots.$stable) || // has new dynamic scoped slots 是否有新的动态作用域插槽
    (oldScopedSlots !== emptyObject && !oldScopedSlots.$stable) || // has old dynamic scoped slots  是否有旧的动态作用域插槽 
    (newScopedSlots && vm.$scopedSlots.$key !== newScopedSlots.$key) // has different key scoped slots 是否有不同key的新的动态作用域插槽
  )

  // Any static slot children from the parent may have changed during parent's
  // update. Dynamic scoped slots may also have changed. In such cases, a forced
  // update is necessary to ensure correctness.
  // 父级的任何静态槽子级都可能在父级的更新中改变。动态作用域插槽也可能已更改。在这种情况下必须进行更新以确保正确性。
  const needsForceUpdate = !!(
    renderChildren || // has new static slots 是否有新的静态插槽
    vm.$options._renderChildren || // has old static slots 是否有进的静态插槽
    hasDynamicScopedSlot  //是否有动态作用域插槽
  )
  // 父亲vnode
  vm.$options._parentVnode = parentVnode
  // 无需重新渲染即可更新vm的占位符节点
  vm.$vnode = parentVnode // update vm's placeholder node without re-render
  // 如果_vnode存在
  if (vm._vnode) { // update child tree's parent 
    // 更新子树的父树
    vm._vnode.parent = parentVnode
  }
  // 子节点
  vm.$options._renderChildren = renderChildren

  // update $attrs and $listeners hash
  // these are also reactive so they may trigger child update if the child
  // used them during render
  //更新$attrs和$listener散列
  //它们也是相应性的，因此如果子进程更新，它们可能触发子进程更新
  //渲染时使用它们

  // 获取虚拟dom的属性attrs
  vm.$attrs = parentVnode.data.attrs || emptyObject
  // 获取事件
  vm.$listeners = listeners || emptyObject

  // update props 更新props属性
  if (propsData && vm.$options.props) {
    // 这个函数只是返回一个 shouldObserve = boolean 
    toggleObserving(false) // 是否可以添加到观察者模式
    // 获取属性
    const props = vm._props
    // 获取属性的propKeys
    const propKeys = vm.$options._propKeys || []
    // 遍历props
    for (let i = 0; i < propKeys.length; i++) {
      // 每一个props
      const key = propKeys[i]
      // 获取原始props 用来进行validateProp函数
      const propOptions: any = vm.$options.props // wtf flow?
      /**
      * 验证 prosp 是否是规范数据 并且为props 添加 value.__ob__  属性，把prosp添加到观察者中
      * 校验 props 参数 就是组建 定义的props 类型数据，校验类型
      * 判断prop.type的类型是不是Boolean或者String，如果不是他们两类型，调用getPropDefaultValue获取默认值并且把value添加到观察者模式中
      **/
      props[key] = validateProp(key, propOptions, propsData, vm)
    }
    // 可添加到观察者模式中
    toggleObserving(true)
    // keep a copy of raw propsData
    // 保留原始propsData的副本
    vm.$options.propsData = propsData
  }

  // update listeners 更新事件
  // 判断listeners并赋值
  listeners = listeners || emptyObject
  // 旧的事件
  const oldListeners = vm.$options._parentListeners
  // 新的事件
  vm.$options._parentListeners = listeners
  // 更新组件事件 :todo
  updateComponentListeners(vm, listeners, oldListeners)

  // resolve slots + force update if has children
  // 解决插槽+强制更新如果有 子节点
  // 如果需要ForceUpdate
  if (needsForceUpdate) {
    //判断children 有没有分发式插槽 并且过滤掉空的插槽,并且收集插槽
    vm.$slots = resolveSlots(renderChildren, parentVnode.context)
    //更新数据 观察者数据
    vm.$forceUpdate()
  }

  if (process.env.NODE_ENV !== 'production') {
    // 将这设为false 代表不是要update的子组件
    isUpdatingChildComponent = false
  }
}

// 这三个函数都是判断keep-alive相关的 包括之前的非抽象父组件，也是排除keep-alive :todo
// 循环父组件dom，如果有不活跃的返回true
function isInInactiveTree(vm) {
  // 循环父节点
  while (vm && (vm = vm.$parent)) {
    // 如果父节点有_inactive 则返回true
    if (vm._inactive) return true
  }
  return false
}
// 判断是否有不活跃的组件 禁用他 如果有活跃组件则触发钩子函数activated
export function activateChildComponent(
  vm: Component, // 虚拟dom vnode
  direct ? : boolean  //布尔值
  ) {
  if (direct) {
    // _directInactive 设为false
    vm._directInactive = false
    // 如果有不活跃的树，或者被禁用组件
    if (isInInactiveTree(vm)) {
      return
    }
  } else if (vm._directInactive) {
    // 单个不活跃的
    return
  }
  // 如果 _inactive=true 不活跃组件 或者 vm._inactive === null
  if (vm._inactive || vm._inactive === null) {
    vm._inactive = false
    // 循环禁止子组件
    for (let i = 0; i < vm.$children.length; i++) {
      // 递归循环 禁用子组件
      activateChildComponent(vm.$children[i])
    }
    // 触发activated 生命周期钩子函数
    callHook(vm, 'activated')
  }
}
// 循环子组件 和父组件 判断是否有禁止的组件 如果有活跃组件则执行生命后期函数deactivated
export function deactivateChildComponent(
  vm: Component, // 虚拟dom vnode
  direct ? : boolean // 布尔值
  ) {
  if (direct) {
    vm._directInactive = true
    if (isInInactiveTree(vm)) {
      return
    }
  }
  // 如果该组件是活跃的
  if (!vm._inactive) {
    vm._inactive = true // 设置活动中的树
    for (let i = 0; i < vm.$children.length; i++) {
      deactivateChildComponent(vm.$children[i])
    }
    // 触发deactivated 生命周期钩子函数
    callHook(vm, 'deactivated')
  }
}
// 在initLifeCycle中初始化callHook   触发钩子函数
export function callHook(
  vm: Component, // 虚拟dom vnode
  hook: string   // 钩子函数的key 也就是生命周期
  ) {
  // #7573 disable dep collection when invoking lifecycle hooks
  //调用生命周期钩子时禁用dep集合
  //Dep.target = _target; 压栈
  pushTarget()
  // 获得传入的钩子 beforeCreated这些
  // 在vm 中添加声明周期函数
  const handlers = vm.$options[hook]
  // 模板字符串拼接
  const info = `${hook} hook`
  // 如果获取到钩子周期
  if (handlers) {
    // 遍历执行
    for (let i = 0, j = handlers.length; i < j; i++) {
      // 判断是否异步
      invokeWithErrorHandling(handlers[i], vm, null, vm, info)
    }
  }
  // 如果存在vm._hasHookEvent
  if (vm._hasHookEvent) {
    // 提交事件
    vm.$emit('hook:' + hook)
  }
  // 出栈
  popTarget()
}