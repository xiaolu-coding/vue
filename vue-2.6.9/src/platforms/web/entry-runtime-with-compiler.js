/* @flow */

import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

// 从这里导入了Vue。可以去runtie/index看
import Vue from './runtime/index'
import { query } from './util/index'
import { compileToFunctions } from './compiler/index'
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat'

// 根据id查询到el 并返回innerHTML
const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})
// 扩展$mount 保存老的$mount 老的$mount也会执行以前的操作
const mount = Vue.prototype.$mount
// 进行的新的mount操作
Vue.prototype.$mount = function (
  // 传入el，也就是挂载的元素节点
  el?: string | Element,
  // todo: 等待分析 涉及服务端渲染
  hydrating?: boolean
): Component {
  // 获取el节点
  el = el && query(el)

  // 遇到这种形式的代码，可忽略 
  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }
  // 获取配置的一些选项，也就是render template el那些
  // 可从代码中得到一些选项的优先级：render>template>el
  const options = this.$options
  // resolve template/el and convert to render function
  // 如果不存在render函数，就将template/el的设置转换为render函数
  // render优先级非常高了，这些操作都是在没有render的情况下进行的
  if (!options.render) {
    // 获取template
    let template = options.template
    // 如果有template
    if (template) {
      // string "#app"这类的
      if (typeof template === 'string') {
        // #开头
        if (template.charAt(0) === '#') {
          // 将进入idToTemplate idToTemplate是接收#app这类，返回对应节点的innerHTML
          template = idToTemplate(template)
          /* istanbul ignore if 忽略*/
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) { 
        // 如果是DOM元素 document.querySelector()
        // 获取到这段内容，也就获取到了节点
        template = template.innerHTML
      } else {
        // 忽略
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
      // 如果template不存在，获取el
    } else if (el) {
      // <div id="app"></div>
      // 调用getOuterHTML，获取包括标签的内容
      template = getOuterHTML(el)
    }
    // 这里对拿到的template进行编译
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }
      // 如果是模板字符串，需要编译器去编译  也就是进入compileToFunctions这个函数
      // 可以通过这个函数查看编译器的工作机制，也就是把template转换为render:todo
      const { render, staticRenderFns } = compileToFunctions(template, {
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      // 赋值给当前选项的render
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  // 执行老mount的操作 正常的挂载渲染过程
  return mount.call(this, el, hydrating)
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
// 获取包括标签的内容
function getOuterHTML (el: Element): string {
  // 如果存在，直接使用outerHTML
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    // 不存在就创建div
    const container = document.createElement('div')
    // 将el深复制一份加入div
    container.appendChild(el.cloneNode(true))
    // 返回这个div
    return container.innerHTML
  }
}
// :todo 涉及到编译器compile的解析过程了，之后再来
Vue.compile = compileToFunctions

export default Vue
