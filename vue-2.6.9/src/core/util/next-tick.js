/* @flow */
/* globals MutationObserver */

import { noop } from 'shared/util'
import { handleError } from './error'
import { isIE, isIOS, isNative } from './env'

export let isUsingMicroTask = false

// 回调函数队列
const callbacks = []
// pending状态
let pending = false

// 执行所有Callback队列中的所有函数
function flushCallbacks () {
  pending = false
  const copies = callbacks.slice(0)
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}

// Here we have async deferring wrappers using microtasks.
// In 2.5 we used (macro) tasks (in combination with microtasks).
// However, it has subtle problems when state is changed right before repaint
// (e.g. #6813, out-in transitions).
// Also, using (macro) tasks in event handler would cause some weird behaviors
// that cannot be circumvented (e.g. #7109, #7153, #7546, #7834, #8109).
// So we now use microtasks everywhere, again.
// A major drawback of this tradeoff is that there are some scenarios
// where microtasks have too high a priority and fire in between supposedly
// sequential events (e.g. #4521, #6690, which have workarounds)
// or even between bubbling of the same event (#6566).

// 这里我们有使用微任务的异步延迟包装器。
// 在2.5中，我们使用了（宏）任务（与微任务相结合）。
// 然而，当状态在重新绘制之前被更改时，它会有一些微妙的问题
// （例如#6813，输出转换）。
// 另外，在事件处理程序中使用（宏）任务会导致一些奇怪的行为
// 这是无法回避的（例如#7109，#7153，#7546，#7834，#8109）。
// 所以我们现在到处都在使用微任务。
// 这种权衡的一个主要缺点是存在一些情况
// 如果微任务的优先级太高，而且可能介于两者之间
// 顺序事件（例如#4521，#6690，有解决办法）
// 甚至是在同一事件的冒泡之间。

// timerFunc函数
let timerFunc

// The nextTick behavior leverages the microtask queue, which can be accessed
// via either native Promise.then or MutationObserver.
// MutationObserver has wider support, however it is seriously bugged in
// UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
// completely stops working after triggering a few times... so, if native
// Promise is available, we will use it:

// nextTick行为利用可以访问的微任务队列
// 通过自带的Promise.then。或是MutationObserver。
// MutationObserver有更广泛的支持，但是它被严重地窃听进来了
// 当触发in-touch事件处理程序时，iOS>=9.3.3中的UIWebView。它
// 触发几次后完全停止工作。。。所以，如果是有自带的
// Promise可用，我们将使用它：

// 默认使用Promise解决方法 关于宏任务微任务 优先度 Promise是微任务
/* istanbul ignore next, $flow-disable-line */
// 如果Promise存在并且native
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  // 使用Promise
  const p = Promise.resolve()
  timerFunc = () => {
    // 通过Promise微任务清空回调队列
    p.then(flushCallbacks)
    // In problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.

    // 在有问题的uiwebview中，Promise.then不会完全崩溃，但是
    // 它可能会陷入一种奇怪的状态，即回调被推送到
    // 微任务队列，但队列不会被刷新，直到浏览器
    // 需要做一些其他的工作，例如处理计时器。所以我们可以
    // 通过添加空计时器“强制”刷新微任务队列。

    // 添加空计时器 强制刷新微任务队列
    if (isIOS) setTimeout(noop)
  }
  // 使用微任务 为true
  isUsingMicroTask = true
  // 如果Promise不能用，用MutationObserver
  // 如果不是IE 并且MutationObserver存在并native
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  // Use MutationObserver where native Promise is not available,
  // e.g. PhantomJS, iOS7, Android 4.4
  // (#6466 MutationObserver is unreliable in IE11)

  // 如果本地的Promise不可用，请使用MutationObserver，
  // 例如PhantomJS，iOS7，Android 4.4
  //（#6466 MutationObserver在IE11中不可靠）它会在指定的DOM发生变化时被调用。

  // 通过MutationObserver的方式执行
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  // MutationObserver还是微任务
  isUsingMicroTask = true
  // 如果MutationObserver还不能用，判断setImmediate是否存在并native，用setImmediate
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // Fallback to setImmediate.
  // Techinically it leverages the (macro) task queue,
  // but it is still a better choice than setTimeout.

  // 回退到setImmediate。
  // 在技术上，它利用（宏）任务队列
  // 但它仍然是比setTimeout更好的选择。
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  // Fallback to setTimeout.
  // 最后回退到使用setTimeout
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}

// 看timerFunc :todo
export function nextTick (cb?: Function, ctx?: Object) {
  let _resolve
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  if (!pending) {
    pending = true
    timerFunc()
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}
