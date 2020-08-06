import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'
// 好了，这里就是Vue的构造函数啦！
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  // 当new Vue实例时，执行_init方法
  this._init(options)
}
// 
initMixin(Vue) //实现_init初始化方法
stateMixin(Vue) //实现$set $delete $watch方法。还定义了只读$data $props
eventsMixin(Vue) //:实现$on $once $off $emit四个方法
lifecycleMixin(Vue) //:实现_update $forceUpdate $destroy三个方法
renderMixin(Vue) //实现_render $nextTick方法

export default Vue
