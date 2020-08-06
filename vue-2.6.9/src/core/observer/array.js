/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */
// 导入def 也就是 Object.defineProperty
import { def } from '../util/index'
// 复制一份 Array.prototype到arrayMethods
const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)
// 获取这7个数组方法，通过def拦截这7个方法，给它们增加副作用
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]
/**
 * Intercept mutating methods and emit events
 */
// 将这7个方法遍历
methodsToPatch.forEach(function (method) {
  // cache original method
  // 从原型中把原始方法拿出，在后面会调用一次原始方法，
  // 并在原始方法的上增加副作用
  const original = arrayProto[method]
  // 额外通知更新 def相当于Object.defineProperty
  // 给arrayMehods的method方法定义一个函数mutator
  // 就是在执行push pop等方法的基础上干一些额外的事
  // 也就是下面的ob.dep.notify()通知改变
  def(arrayMethods, method, function mutator (...args) {
    // 执行数组方法原本应该做的事情
    const result = original.apply(this, args)
    // 获取到这个数组的__ob__实例
    const ob = this.__ob__
    
    let inserted
    // 这三个方法特殊，因为会对数组进行插入操作，之前数组所有元素都是已经
    // 做过响应式了，所以要对新插入的元素再进行响应式处理
    // 所以要通过inserted是否有值，对插入值的三个数组方法进行遍历响应式
    switch (method) {
      case 'push':
      case 'unshift': 
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    // 如果有插入的新值，也就是push unshift splice三个方法
    // 调用ob.observeArray，也就是遍历将数组所有元素进行observe
    // 也就是说增加和删除元素，都还是会响应式
    if (inserted) ob.observeArray(inserted)
    // notify change
    // 通知更新
    ob.dep.notify()
    // 最后返回数组方法原本操作的结果
    return result
  })
})
