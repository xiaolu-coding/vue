/* @flow */

import config from '../config'
import Watcher from '../observer/watcher'
import Dep, { pushTarget, popTarget } from '../observer/dep'
import { isUpdatingChildComponent } from './lifecycle'

import {
  set,
  del,
  observe,
  defineReactive,
  toggleObserving
} from '../observer/index'

import {
  warn,
  bind,
  noop,
  hasOwn,
  hyphenate,
  isReserved,
  handleError,
  nativeWatch,
  validateProp,
  isPlainObject,
  isServerRendering,
  isReservedAttribute
} from '../util/index'

// 共享属性定义
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

// 代理 app.data.name 变成app.name
// proxy(app, 'data', 'name')
export function proxy (target: Object, sourceKey: string, key: string) {
  // 加get
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  }
  // 加set
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  // 通过Object.defineProperty给app.name加上属性

  Object.defineProperty(target, key, sharedPropertyDefinition)
}
// 初始化一些data props methods那些 
export function initState (vm: Component) {
  // 初始化watchers数组 观察者队列
  vm._watchers = []
  // 获取选项
  const opts = vm.$options
  // 初始化props
  if (opts.props) initProps(vm, opts.props)
  // 初始化methods
  if (opts.methods) initMethods(vm, opts.methods)
  // 初始化data
  if (opts.data) {
    // 如果存在，直接InitData 
    initData(vm)
  } else {
    // 如果不存在data，直接进行observe，true作为根的data observe:todo
    observe(vm._data = {}, true /* asRootData */)
  }
  // 初始化computed
  if (opts.computed) initComputed(vm, opts.computed)
  // 初始化watch
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}

// 初始化props 
function initProps (vm: Component, propsOptions: Object) {
  // 获取props数据
  const propsData = vm.$options.propsData || {}

  const props = vm._props = {}
  // cache prop keys so that future props updates can iterate using Array
  // 缓存prop keys以便以后props更新可以使用数组迭代
  // instead of dynamic object key enumeration.
  // 而不是动态 object.key枚举
  const keys = vm.$options._propKeys = []
  // 是否是根 如果不存在父节点 就是根
  const isRoot = !vm.$parent
  // root instance props should be converted
  // 根实例的props需要被响应式
  // 如果不是根
  if (!isRoot) {
    // 则不会添加监听观察者
    toggleObserving(false)
  }
  // propsOptions是传入的options.props，也就是选项中的props属性
  // 遍历props属性的key
  for (const key in propsOptions) {
    // 将key放进数组，容易迭代
    keys.push(key)
    // 判断prop.type是否是Boolean或String，如果不是，则getPropDefaultValue
    // 获取默认值，并给value添加value._ob_属性，添加到观察者模式中
    const value = validateProp(key, propsOptions, propsData, vm)
    /* istanbul ignore else */
    // 忽略
    if (process.env.NODE_ENV !== 'production') {
      // 驼峰转换 vOn v-on
      const hyphenatedKey = hyphenate(key)
      if (isReservedAttribute(hyphenatedKey) ||
          config.isReservedAttr(hyphenatedKey)) {
        warn(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        )
      }
      defineReactive(props, key, value, () => {
        if (!isRoot && !isUpdatingChildComponent) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
            `overwritten whenever the parent component re-renders. ` +
            `Instead, use a data or computed property based on the prop's ` +
            `value. Prop being mutated: "${key}"`,
            vm
          )
        }
      })
    } else {
      // 通过defineProperty的set方法去notify()通知订阅者subscribers有新的值修改
      defineReactive(props, key, value)
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    // 静态props已经在组件的原型上代理了
    // 在Vue.extend()期间. 我们只需要代理
    // 在这里实例化定义的key。
    if (!(key in vm)) {
      proxy(vm, `_props`, key)
    }
  }
  // 可加入观察者模式
  toggleObserving(true)
}
// initData 初始化data 接收组件实例
// 做了两件事：1、代理，将data的所有key代理到vm实例上
//           2、observe(data, true /* asRootData */)
function initData (vm: Component) {
  // 获取到选项中的data data可能是对象可能是函数 取决于根
  let data = vm.$options.data
  // 如果data是一个函数 执行getData，如果是对象就是根data
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  // 如果不是纯对象 报错
  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  // 获取data所有属性 准备进行代理
  const keys = Object.keys(data)
  // 获取props，因为props在data之前先初始化
  const props = vm.$options.props
  // 获取methods，因为methods在data之前先初始化
  const methods = vm.$options.methods
  // 所有属性的长度
  let i = keys.length
  // 
  while (i--) {
    // 从最后开始
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
      // 如果不是$和_开头，代理
    } else if (!isReserved(key)) {
      // 执行代理函数，将data的所有key全部挂到vm上，可以直接vm.获取
      // data:{foo: 'foo'}  vm.data.foo  vm.foo
      proxy(vm, `_data`, key)
    }
  }
  // observe data
  // 将data作为根data进行observe
  observe(data, true /* asRootData */)
}

// 转换数据 如果数据
export function getData (data: Function, vm: Component): any {
  // #7573 disable dep collection when invoking data getters
  // 调用数据获取程序时禁用dep收集
  pushTarget()
  try {
    // 执行传入的函数 获取数据
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, `data()`)
    return {}
  } finally {
    // 最后禁用dep收集
    popTarget()
  }
}
// 计算属性监听
const computedWatcherOptions = { lazy: true }

// 初始化计算属性
function initComputed (vm: Component, computed: Object) {
  // $flow-disable-line
  // 创建新的监听空对象
  const watchers = vm._computedWatchers = Object.create(null)
  // computed properties are just getters during SSR
  // computed属性只是SSR期间的getter
  const isSSR = isServerRendering()
  // 遍历computed的key属性
  for (const key in computed) {
    // 每个值
    const userDef = computed[key]
    // 如果是函数 就默认，不是就获取get computed的get默认写
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn(
        `Getter is missing for computed property "${key}".`,
        vm
      )
    }
    // 如果不是ssr渲染
    if (!isSSR) {
      // create internal watcher for the computed property.
      // 为计算属性创建wathcer。
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      )
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    // 组件定义的计算属性已在组件原型上定义
    // 我们只需要定义已在这里定义实例化的计算属性
    // 如果computed 属性key 不在虚拟dom中
    if (!(key in vm)) {
      // 定义computed 并将key加入到对象监听中
      defineComputed(vm, key, userDef)
    } else if (process.env.NODE_ENV !== 'production') {
      if (key in vm.$data) { 
        // 如果key在data中，警告
        warn(`The computed property "${key}" is already defined in data.`, vm)
      } else if (vm.$options.props && key in vm.$options.props) {
        // 如果key在props中，警告
        warn(`The computed property "${key}" is already defined as a prop.`, vm)
      }
    }
  }
}

//定义计算属性 并且 把属性的数据 添加到对象监听中
export function defineComputed (
  target: any, //目标
  key: string, //属性
  userDef: Object | Function //key的值
) {
  // 是否是ssr 是浏览器
  const shouldCache = !isServerRendering()
  // 如果值是函数
  if (typeof userDef === 'function') {
    // 共享属性.get 
    sharedPropertyDefinition.get = shouldCache
    // 如果不是ssr 
      ? createComputedGetter(key)
      : createGetterInvoker(userDef)
    // .set
    sharedPropertyDefinition.set = noop
  } else {
    // 如果值不是函数
    // 值中是否有get，如果有，判断如果不是ssr并且有缓存 那么sharedPropertyDefinition.get = createComputedGetter(key)
    // 值中如果没有get，直接sharedPropertyDefinition.get = noop
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
      : noop
      // .set
    sharedPropertyDefinition.set = userDef.set || noop
  }
  if (process.env.NODE_ENV !== 'production' &&
      sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      warn(
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      )
    }
  }
  // 添加对象监听
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

// 放回computedGetter 创建计算属性 获取值 收集 dep 依赖
function createComputedGetter (key) {
  return function computedGetter () {
    // Watcher 实例化之后的对象
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate()
      }
      if (Dep.target) {
        //为Watcher 添加 为Watcher.newDeps.push(dep); 一个dep对象
        //循环deps 收集 newDeps dep 当newDeps 数据被清空的时候重新收集依赖
        watcher.depend()
      }
      // 返回值
      return watcher.value
    }
  }
}
// 返回computedGetter
function createGetterInvoker(fn) {
  return function computedGetter () {
    return fn.call(this, this)
  }
}
// 初始化Methods 代理
function initMethods (vm: Component, methods: Object) {
  // 获取props
  const props = vm.$options.props
  // 遍历methods的属性key
  for (const key in methods) {
    if (process.env.NODE_ENV !== 'production') {
      // 如果不是函数
      if (typeof methods[key] !== 'function') {
        warn(
          `Method "${key}" has type "${typeof methods[key]}" in the component definition. ` +
          `Did you reference the function correctly?`,
          vm
        )
      }
      //判断key是否是改对象实例化的
      //如果属性中定义了key，则在methods中不能定义同样的key
      if (props && hasOwn(props, key)) {
        warn(
          `Method "${key}" has already been defined as a prop.`,
          vm
        )
      }
      // $ 或_
      if ((key in vm) && isReserved(key)) {
        warn(
          `Method "${key}" conflicts with an existing Vue instance method. ` +
          `Avoid defining component methods that start with _ or $.`
        )
      }
    }
    // 把事件放在最外层对象中，如果是函数为空则给一个空函数，如果是有函数则执行改函数
    // 给最外层一个相同key属性，data.methods.sum() 变成data.sum()，代理
    // 如果methods.sum不是函数 给空函数noop
    // 如果是函数，执行该函数
    vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm)
  }
}
// 初始化watch
function initWatch (vm: Component, watch: Object) {
  // 循环遍历watch属性key
  for (const key in watch) {
    // 获取值
    const handler = watch[key]
    // 如果值是数组
    if (Array.isArray(handler)) {
      // 循环这个数组 创建监听
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      // 不是数组，就直接创建监听
      createWatcher(vm, key, handler)
    }
  }
}

// 创建监听
function createWatcher (
  vm: Component, //vm
  expOrFn: string | Function, //key属性
  handler: any, // key属性值
  options?: Object
) {
  // 属性是否是纯对象 
  if (isPlainObject(handler)) {
    // options
    options = handler
    // 对象中的handler 一定是函数或者字符串
    handler = handler.handler
  }
  // 如果值是字符串
  if (typeof handler === 'string') {
    // 就是key 取值 vm 就是Vue 最外层 中的函数
    handler = vm[handler]
  }
  return vm.$watch(expOrFn, handler, options)
}
// 这里主要看 360行左右 数据绑定 $watch
export function stateMixin (Vue: Class<Component>) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  // flow在某种程度上与直接声明的定义对象有问题
  // 使用时Object.defineProperty,所以我们必须按程序建立
  // 这里的对象。
  const dataDef = {}
  // 返回this._data 只有get，作为只读属性？
  dataDef.get = function () { return this._data }
  const propsDef = {}
  // 返回this._props 只有get，作为只读属性？
  propsDef.get = function () { return this._props }
  if (process.env.NODE_ENV !== 'production') {
    dataDef.set = function () {
      warn(
        // 避免替换根实例$data
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      )
    }
    propsDef.set = function () {
      // 警告只读
      warn(`$props is readonly.`, this)
    }
  }
  // 给vue原型定义$data属性 
  Object.defineProperty(Vue.prototype, '$data', dataDef)
  // 给vue原型定义$props属性
  Object.defineProperty(Vue.prototype, '$props', propsDef)
  // $set方法 :todo 添加一个数组数据或对象数据
  Vue.prototype.$set = set
  // $delete方法 :todo 删除一个数组数据或对象数据
  Vue.prototype.$delete = del
  // $watch :todo
  Vue.prototype.$watch = function (
    expOrFn: string | Function, //手动
    cb: any, //回调函数
    options?: Object //参数 可选
  ): Function {
    // 获取实例
    const vm: Component = this
    // 如果回调是个对象，递归深层监听，直到不是对象跳出
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    // 参数
    options = options || {}
    options.user = true
    // 实例化一个watcher 观察者
    const watcher = new Watcher(vm, expOrFn, cb, options)
    // 如果
    if (options.immediate) {
      try {
        // 触发回调
        cb.call(vm, watcher.value)
      } catch (error) {
        handleError(error, vm, `callback for immediate watcher "${watcher.expression}"`)
      }
    }
    // 卸载watcher 观察者
    return function unwatchFn () {
      // 从所有依赖项的订阅方列表中删除self。
      watcher.teardown()
    }
  }
}
