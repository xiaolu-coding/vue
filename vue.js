/*!
 * Vue.js v2.6.9
 * (c) 2014-2020 Evan You
 * Released under the MIT License.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Vue = factory());
}(this, (function () { 'use strict';

  /*  */

  var emptyObject = Object.freeze({});

  // These helpers produce better VM code in JS engines due to their
  // explicitness and function inlining.
  function isUndef (v) {
    return v === undefined || v === null
  }

  function isDef (v) {
    return v !== undefined && v !== null
  }

  function isTrue (v) {
    return v === true
  }

  function isFalse (v) {
    return v === false
  }

  /**
   * Check if value is primitive.
   */
  function isPrimitive (value) {
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      // $flow-disable-line
      typeof value === 'symbol' ||
      typeof value === 'boolean'
    )
  }

  /**
   * Quick object check - this is primarily used to tell
   * Objects from primitive values when we know the value
   * is a JSON-compliant type.
   */
  function isObject (obj) {
    return obj !== null && typeof obj === 'object'
  }

  /**
   * Get the raw type string of a value, e.g., [object Object].
   */
  var _toString = Object.prototype.toString;

  function toRawType (value) {
    return _toString.call(value).slice(8, -1)
  }

  /**
   * Strict object type check. Only returns true
   * for plain JavaScript objects.
   */
  function isPlainObject (obj) {
    return _toString.call(obj) === '[object Object]'
  }

  function isRegExp (v) {
    return _toString.call(v) === '[object RegExp]'
  }

  /**
   * Check if val is a valid array index.
   * 检查val是否是有效的数组索引
   */
  function isValidArrayIndex (val) {
    var n = parseFloat(String(val));
    return n >= 0 && Math.floor(n) === n && isFinite(val)
  }
  // 检测是否是Promise
  function isPromise (val) {
    return (
      isDef(val) &&
      typeof val.then === 'function' &&
      typeof val.catch === 'function'
    )
  }

  /**
   * Convert a value to a string that is actually rendered.
   */
  function toString (val) {
    return val == null
      ? ''
      : Array.isArray(val) || (isPlainObject(val) && val.toString === _toString)
        ? JSON.stringify(val, null, 2)
        : String(val)
  }

  /**
   * Convert an input value to a number for persistence.
   * If the conversion fails, return original string.
   */
  function toNumber (val) {
    var n = parseFloat(val);
    return isNaN(n) ? val : n
  }

  /**
   * Make a map and return a function for checking if a key
   * is in that map.
   */
  function makeMap (
    str,
    expectsLowerCase
  ) {
    var map = Object.create(null);
    var list = str.split(',');
    for (var i = 0; i < list.length; i++) {
      map[list[i]] = true;
    }
    return expectsLowerCase
      ? function (val) { return map[val.toLowerCase()]; }
      : function (val) { return map[val]; }
  }

  /**
   * Check if a tag is a built-in tag.
   */
  var isBuiltInTag = makeMap('slot,component', true);

  /**
   * Check if an attribute is a reserved attribute.
   */
  var isReservedAttribute = makeMap('key,ref,slot,slot-scope,is');

  /**
   * Remove an item from an array.
   */
  function remove (arr, item) {
    if (arr.length) {
      var index = arr.indexOf(item);
      if (index > -1) {
        return arr.splice(index, 1)
      }
    }
  }

  /**
   * Check whether an object has the property.
   */
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  function hasOwn (obj, key) {
    return hasOwnProperty.call(obj, key)
  }

  /**
   * Create a cached version of a pure function.
   * 创建一个纯函数的缓存版本
   * 可以不同函数名调用不同版本
   * let p = cached(function string(str){return str})
   * let p2 = cached(function dobule(num){return num * 2})
   * console.log(p(1))
   * console.log(p(2))
   * console.log(p(3))
   * console.log(p2(1))
   * console.log(p2(2))
   * console.log(p2(3))
   */
  function cached (fn) {
    var cache = Object.create(null);
    return (function cachedFn (str) {
      var hit = cache[str];
      return hit || (cache[str] = fn(str))
    })
  }


  /**
   * Camelize a hyphen-delimited string.
   * 用连字符分隔的字符串。
   */
  // 将v-on 转换为vOn
  var camelizeRE = /-(\w)/g;
  var camelize = cached(function (str) {
    return str.replace(camelizeRE, function (_, c) { return c ? c.toUpperCase() : ''; })
  });

  /**
   * Capitalize a string.
   * 首字母大写
   */
  var capitalize = cached(function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  });

  /**
   * Hyphenate a camelCase string.
   * 为camelCase字符串断字
    */
  // 匹配所有大写字母
  var hyphenateRE = /\B([A-Z])/g;
  var hyphenate = cached(function (str) {
    //大写字母，加完减号又转成小写了 比如把驼峰 aBc 变成了 a-bc
    //匹配大写字母并且两面不是空白的 替换成 '-' + '字母' 再转换成小写
    return str.replace(hyphenateRE, '-$1').toLowerCase()
  });

  /**
   * Simple bind polyfill for environments that do not support it,
   * e.g., PhantomJS 1.x. Technically, we don't need this anymore
   * since native bind is now performant enough in most browsers.
   * But removing it would mean breaking code that was able to run in
   * PhantomJS 1.x, so this must be kept for backward compatibility.
   */

  /* istanbul ignore next */
  function polyfillBind (fn, ctx) {
    function boundFn (a) {
      var l = arguments.length;
      return l
        ? l > 1
          ? fn.apply(ctx, arguments)
          : fn.call(ctx, a)
        : fn.call(ctx)
    }

    boundFn._length = fn.length;
    return boundFn
  }

  function nativeBind (fn, ctx) {
    return fn.bind(ctx)
  }

  var bind = Function.prototype.bind
    ? nativeBind
    : polyfillBind;

  /**
   * Convert an Array-like object to a real Array.
   * 将类数组转换成真的数组
   */
  function toArray (list, start) {
    start = start || 0;
    var i = list.length - start;
    var ret = new Array(i);
    while (i--) {
      ret[i] = list[i + start];
    }
    return ret
  }

  /**
   * Mix properties into target object.
   * 将属性混合到目标对象中。
   */
  function extend (to, _from) {
    // 把from中的所有枚举属性添加到to对象中，混合
    for (var key in _from) {
      to[key] = _from[key];
    }
    return to
  }

  /**
   * Merge an Array of Objects into a single Object.
   */
  function toObject (arr) {
    var res = {};
    for (var i = 0; i < arr.length; i++) {
      if (arr[i]) {
        extend(res, arr[i]);
      }
    }
    return res
  }

  /* eslint-disable no-unused-vars */

  /**
   * Perform no operation.
   * Stubbing args to make Flow happy without leaving useless transpiled code
   * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/).
   */
  function noop (a, b, c) {}

  /**
   * Always return false.
   */
  var no = function (a, b, c) { return false; };

  /* eslint-enable no-unused-vars */

  /**
   * Return the same value.
   */
  var identity = function (_) { return _; };

  /**
   * Generate a string containing static keys from compiler modules.
   */
  function genStaticKeys (modules) {
    return modules.reduce(function (keys, m) {
      return keys.concat(m.staticKeys || [])
    }, []).join(',')
  }

  /**
   * Check if two values are loosely equal - that is,
   * if they are plain objects, do they have the same shape?
   */
  function looseEqual (a, b) {
    if (a === b) { return true }
    var isObjectA = isObject(a);
    var isObjectB = isObject(b);
    if (isObjectA && isObjectB) {
      try {
        var isArrayA = Array.isArray(a);
        var isArrayB = Array.isArray(b);
        if (isArrayA && isArrayB) {
          return a.length === b.length && a.every(function (e, i) {
            return looseEqual(e, b[i])
          })
        } else if (a instanceof Date && b instanceof Date) {
          return a.getTime() === b.getTime()
        } else if (!isArrayA && !isArrayB) {
          var keysA = Object.keys(a);
          var keysB = Object.keys(b);
          return keysA.length === keysB.length && keysA.every(function (key) {
            return looseEqual(a[key], b[key])
          })
        } else {
          /* istanbul ignore next */
          return false
        }
      } catch (e) {
        /* istanbul ignore next */
        return false
      }
    } else if (!isObjectA && !isObjectB) {
      return String(a) === String(b)
    } else {
      return false
    }
  }

  /**
   * Return the first index at which a loosely equal value can be
   * found in the array (if value is a plain object, the array must
   * contain an object of the same shape), or -1 if it is not present.
   */
  function looseIndexOf (arr, val) {
    for (var i = 0; i < arr.length; i++) {
      if (looseEqual(arr[i], val)) { return i }
    }
    return -1
  }

  /**
   * Ensure a function is called only once.
   */
  function once (fn) {
    var called = false;
    return function () {
      if (!called) {
        called = true;
        fn.apply(this, arguments);
      }
    }
  }

  var SSR_ATTR = 'data-server-rendered';

  var ASSET_TYPES = [
    'component',
    'directive',
    'filter'
  ];

  var LIFECYCLE_HOOKS = [
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted',
    'beforeUpdate',
    'updated',
    'beforeDestroy',
    'destroyed',
    'activated',
    'deactivated',
    'errorCaptured',
    'serverPrefetch'
  ];

  /*  */



  var config = ({
    /**
     * Option merge strategies (used in core/util/options)
     */
    // $flow-disable-line
    optionMergeStrategies: Object.create(null),

    /**
     * Whether to suppress warnings.
     */
    silent: false,

    /**
     * Show production mode tip message on boot?
     */
    productionTip: "development" !== 'production',

    /**
     * Whether to enable devtools
     */
    devtools: "development" !== 'production',

    /**
     * Whether to record perf
     */
    performance: false,

    /**
     * Error handler for watcher errors
     */
    errorHandler: null,

    /**
     * Warn handler for watcher warns
     */
    warnHandler: null,

    /**
     * Ignore certain custom elements
     */
    ignoredElements: [],

    /**
     * Custom user key aliases for v-on
     */
    // $flow-disable-line
    keyCodes: Object.create(null),

    /**
     * Check if a tag is reserved so that it cannot be registered as a
     * component. This is platform-dependent and may be overwritten.
     */
    isReservedTag: no,

    /**
     * Check if an attribute is reserved so that it cannot be used as a component
     * prop. This is platform-dependent and may be overwritten.
     */
    isReservedAttr: no,

    /**
     * Check if a tag is an unknown element.
     * Platform-dependent.
     */
    isUnknownElement: no,

    /**
     * Get the namespace of an element
     */
    getTagNamespace: noop,

    /**
     * Parse the real tag name for the specific platform.
     */
    parsePlatformTagName: identity,

    /**
     * Check if an attribute must be bound using property, e.g. value
     * Platform-dependent.
     */
    mustUseProp: no,

    /**
     * Perform updates asynchronously. Intended to be used by Vue Test Utils
     * This will significantly reduce performance if set to false.
     */
    async: true,

    /**
     * Exposed for legacy reasons
     */
    _lifecycleHooks: LIFECYCLE_HOOKS
  });

  /*  */

  /**
   * unicode letters used for parsing html tags, component names and property paths.
   * using https://www.w3.org/TR/html53/semantics-scripting.html#potentialcustomelementname
   * skipping \u10000-\uEFFFF due to it freezing up PhantomJS
   */
  var unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;

  /**
   * Check if a string starts with $ or _
   */
  function isReserved (str) {
    var c = (str + '').charCodeAt(0);
    return c === 0x24 || c === 0x5F
  }

  /**
   * Define a property.
   */
  // def其实就是 Object.defineProperty
  function def (obj, key, val, enumerable) {
    Object.defineProperty(obj, key, {
      value: val,
      enumerable: !!enumerable,
      writable: true,
      configurable: true
    });
  }

  /**
   * Parse simple path.
   * 
   */
  var bailRE = new RegExp(("[^" + (unicodeRegExp.source) + ".$_\\d]"));
  function parsePath (path) {
    // 匹配不是 数字字母下划线 $符号   开头的为true
    if (bailRE.test(path)) {
      return
    }
    var segments = path.split('.');
    return function (obj) {
      for (var i = 0; i < segments.length; i++) {
        if (!obj) { return }
        //将对象中的一个key值 赋值给该对象 相当于 obj = obj[segments[segments.length-1]];
        obj = obj[segments[i]];
      }
      return obj
    }
  }

  /*  */

  // can we use __proto__?
  var hasProto = '__proto__' in {};

  // Browser environment sniffing
  var inBrowser = typeof window !== 'undefined';
  var inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform;
  var weexPlatform = inWeex && WXEnvironment.platform.toLowerCase();
  var UA = inBrowser && window.navigator.userAgent.toLowerCase();
  var isIE = UA && /msie|trident/.test(UA);
  var isIE9 = UA && UA.indexOf('msie 9.0') > 0;
  var isEdge = UA && UA.indexOf('edge/') > 0;
  var isAndroid = (UA && UA.indexOf('android') > 0) || (weexPlatform === 'android');
  var isIOS = (UA && /iphone|ipad|ipod|ios/.test(UA)) || (weexPlatform === 'ios');
  var isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge;
  var isPhantomJS = UA && /phantomjs/.test(UA);
  var isFF = UA && UA.match(/firefox\/(\d+)/);

  // Firefox has a "watch" function on Object.prototype...
  var nativeWatch = ({}).watch;

  var supportsPassive = false;
  if (inBrowser) {
    try {
      var opts = {};
      Object.defineProperty(opts, 'passive', ({
        get: function get () {
          /* istanbul ignore next */
          supportsPassive = true;
        }
      })); // https://github.com/facebook/flow/issues/285
      window.addEventListener('test-passive', null, opts);
    } catch (e) {}
  }

  // this needs to be lazy-evaled because vue may be required before
  // vue-server-renderer can set VUE_ENV
  var _isServer;
  var isServerRendering = function () {
    if (_isServer === undefined) {
      /* istanbul ignore if */
      if (!inBrowser && !inWeex && typeof global !== 'undefined') {
        // detect presence of vue-server-renderer and avoid
        // Webpack shimming the process
        _isServer = global['process'] && global['process'].env.VUE_ENV === 'server';
      } else {
        _isServer = false;
      }
    }
    return _isServer
  };

  // detect devtools
  var devtools = inBrowser && window.__VUE_DEVTOOLS_GLOBAL_HOOK__;

  /* istanbul ignore next */
  function isNative (Ctor) {
    return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
  }

  var hasSymbol =
    typeof Symbol !== 'undefined' && isNative(Symbol) &&
    typeof Reflect !== 'undefined' && isNative(Reflect.ownKeys);

  var _Set;
  /* istanbul ignore if */ // $flow-disable-line
  if (typeof Set !== 'undefined' && isNative(Set)) {
    // use native Set when available.
    _Set = Set;
  } else {
    // a non-standard Set polyfill that only works with primitive keys.
    _Set = /*@__PURE__*/(function () {
      function Set () {
        this.set = Object.create(null);
      }
      Set.prototype.has = function has (key) {
        return this.set[key] === true
      };
      Set.prototype.add = function add (key) {
        this.set[key] = true;
      };
      Set.prototype.clear = function clear () {
        this.set = Object.create(null);
      };

      return Set;
    }());
  }

  /*  */

  var warn = noop;
  var tip = noop;
  var generateComponentTrace = (noop); // work around flow check
  var formatComponentName = (noop);

  {
    var hasConsole = typeof console !== 'undefined';
    var classifyRE = /(?:^|[-_])(\w)/g;
    var classify = function (str) { return str
      .replace(classifyRE, function (c) { return c.toUpperCase(); })
      .replace(/[-_]/g, ''); };

    warn = function (msg, vm) {
      var trace = vm ? generateComponentTrace(vm) : '';

      if (config.warnHandler) {
        config.warnHandler.call(null, msg, vm, trace);
      } else if (hasConsole && (!config.silent)) {
        console.error(("[Vue warn]: " + msg + trace));
      }
    };

    tip = function (msg, vm) {
      if (hasConsole && (!config.silent)) {
        console.warn("[Vue tip]: " + msg + (
          vm ? generateComponentTrace(vm) : ''
        ));
      }
    };

    formatComponentName = function (vm, includeFile) {
      if (vm.$root === vm) {
        return '<Root>'
      }
      var options = typeof vm === 'function' && vm.cid != null
        ? vm.options
        : vm._isVue
          ? vm.$options || vm.constructor.options
          : vm;
      var name = options.name || options._componentTag;
      var file = options.__file;
      if (!name && file) {
        var match = file.match(/([^/\\]+)\.vue$/);
        name = match && match[1];
      }

      return (
        (name ? ("<" + (classify(name)) + ">") : "<Anonymous>") +
        (file && includeFile !== false ? (" at " + file) : '')
      )
    };

    var repeat = function (str, n) {
      var res = '';
      while (n) {
        if (n % 2 === 1) { res += str; }
        if (n > 1) { str += str; }
        n >>= 1;
      }
      return res
    };

    generateComponentTrace = function (vm) {
      if (vm._isVue && vm.$parent) {
        var tree = [];
        var currentRecursiveSequence = 0;
        while (vm) {
          if (tree.length > 0) {
            var last = tree[tree.length - 1];
            if (last.constructor === vm.constructor) {
              currentRecursiveSequence++;
              vm = vm.$parent;
              continue
            } else if (currentRecursiveSequence > 0) {
              tree[tree.length - 1] = [last, currentRecursiveSequence];
              currentRecursiveSequence = 0;
            }
          }
          tree.push(vm);
          vm = vm.$parent;
        }
        return '\n\nfound in\n\n' + tree
          .map(function (vm, i) { return ("" + (i === 0 ? '---> ' : repeat(' ', 5 + i * 2)) + (Array.isArray(vm)
              ? ((formatComponentName(vm[0])) + "... (" + (vm[1]) + " recursive calls)")
              : formatComponentName(vm))); })
          .join('\n')
      } else {
        return ("\n\n(found in " + (formatComponentName(vm)) + ")")
      }
    };
  }

  /*  */

  var uid = 0;

  /**
   * A dep is an observable that can have multiple
   * directives subscribing to it.
   * dep是一个可观测到的，可以有多个订阅它的指令
   */
  var Dep = function Dep () {
    // uid
    this.id = uid++;
    // 存放Watcher对象的数组
    this.subs = [];
  };

  Dep.prototype.addSub = function addSub (sub) {
    // 给subs数组添加一个Watcher对象
    this.subs.push(sub);
  };

  Dep.prototype.removeSub = function removeSub (sub) {
    // 删除watcher对象
    remove(this.subs, sub);
  };
  // 添加watcher 
  // 为Watcher.newDeps.push(dep) 一个dep对象
  Dep.prototype.depend = function depend () {
    // target就是Watcher dep就是dep对象，dep中是否有watcher对象
    if (Dep.target) {
      // 用当前的watcher调用addDep
      // :todo 为了多对多关系，得分析addDep
      Dep.target.addDep(this);
    }
  };
  // 通知所有watcher对象更新视图，也就是执行update
  Dep.prototype.notify = function notify () {
    // stabilize the subscriber list first
    // 浅拷贝一份subs数组，也就是Watchers列表
    var subs = this.subs.slice();
    if ( !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      // 如果不运行async，则不会在调度程序中对sub进行排序
      // 我们现在需要对它们进行分类以确保它们发射正确秩序
      subs.sort(function (a, b) { return a.id - b.id; });
    }
    // 所有subs中的wathcers执行update函数，也就是更新
    for (var i = 0, l = subs.length; i < l; i++) {
      subs[i].update();
    }
  };

  // The current target watcher being evaluated.
  // This is globally unique because only one watcher
  // can be evaluated at a time.
  // 正在评估的当前目标观察程序。
  // 这是全局的的，因为只有一个观察者，可以在任何时候都被评估。

  Dep.target = null;
  var targetStack = [];
  // 压栈
  function pushTarget (target) {
    // 压栈
    targetStack.push(target);
    // target就是watcher dep是Dep对象
    Dep.target = target;
  }

  function popTarget () {
    // 出栈
    targetStack.pop();
    // 成为最后一个元素
    Dep.target = targetStack[targetStack.length - 1];
  }

  /*  */

  var VNode = function VNode (
    tag,
    data,
    children,
    text,
    elm,
    context,
    componentOptions,
    asyncFactory
  ) {
    this.tag = tag;
    this.data = data;
    this.children = children;
    this.text = text;
    this.elm = elm;
    this.ns = undefined;
    this.context = context;
    this.fnContext = undefined;
    this.fnOptions = undefined;
    this.fnScopeId = undefined;
    this.key = data && data.key;
    this.componentOptions = componentOptions;
    this.componentInstance = undefined;
    this.parent = undefined;
    this.raw = false;
    this.isStatic = false;
    this.isRootInsert = true;
    this.isComment = false;
    this.isCloned = false;
    this.isOnce = false;
    this.asyncFactory = asyncFactory;
    this.asyncMeta = undefined;
    this.isAsyncPlaceholder = false;
  };

  var prototypeAccessors = { child: { configurable: true } };

  // DEPRECATED: alias for componentInstance for backwards compat.
  /* istanbul ignore next */
  prototypeAccessors.child.get = function () {
    return this.componentInstance
  };

  Object.defineProperties( VNode.prototype, prototypeAccessors );
  // 创建一个节点 空的vNode
  var createEmptyVNode = function (text) {
    if ( text === void 0 ) text = '';

    var node = new VNode();
    node.text = text;
    node.isComment = true;
    return node
  };

  function createTextVNode (val) {
    return new VNode(undefined, undefined, undefined, String(val))
  }

  // optimized shallow clone
  // used for static nodes and slot nodes because they may be reused across
  // multiple renders, cloning them avoids errors when DOM manipulations rely
  // on their elm reference.
  function cloneVNode (vnode) {
    var cloned = new VNode(
      vnode.tag,
      vnode.data,
      // #7975
      // clone children array to avoid mutating original in case of cloning
      // a child.
      vnode.children && vnode.children.slice(),
      vnode.text,
      vnode.elm,
      vnode.context,
      vnode.componentOptions,
      vnode.asyncFactory
    );
    cloned.ns = vnode.ns;
    cloned.isStatic = vnode.isStatic;
    cloned.key = vnode.key;
    cloned.isComment = vnode.isComment;
    cloned.fnContext = vnode.fnContext;
    cloned.fnOptions = vnode.fnOptions;
    cloned.fnScopeId = vnode.fnScopeId;
    cloned.asyncMeta = vnode.asyncMeta;
    cloned.isCloned = true;
    return cloned
  }

  /*
   * not type checking this file because flow doesn't play well with
   * dynamically accessing methods on Array prototype
   */
  // 复制一份 Array.prototype到arrayMethods
  var arrayProto = Array.prototype;
  // arrarMethods是Array.proto的复制
  var arrayMethods = Object.create(arrayProto);
  // 获取这7个数组方法，通过def拦截这7个方法，给它们增加副作用
  var methodsToPatch = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse'
  ];
  /**
   * Intercept mutating methods and emit events
   * 拦截转换方法并发出事件
   */
  // 将这7个方法遍历
  methodsToPatch.forEach(function (method) {
    // cache original method
    // 从原型中把原始方法拿出，在后面会调用一次原始方法，
    // 并在原始方法的上增加副作用
    var original = arrayProto[method];
    // 额外通知更新 def相当于Object.defineProperty
    // 给arrayMehods的method方法定义一个函数mutator
    // 就是在执行push pop等方法的基础上干一些额外的事
    // 也就是下面的ob.dep.notify()通知改变
    def(arrayMethods, method, function mutator () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      // 执行数组方法原本应该做的事情
      var result = original.apply(this, args);
      // 获取到这个数组的__ob__实例
      var ob = this.__ob__;
      
      var inserted;
      // 这三个方法特殊，因为会对数组进行增加操作，之前数组所有元素都是已经
      // 做过响应式了，所以要对新增加的元素再进行响应式处理
      // 所以要通过inserted是否有值，对新增值的三个数组方法进行再次遍历响应式
      switch (method) {
        case 'push':
        case 'unshift': 
          inserted = args;
          break
        case 'splice':
          inserted = args.slice(2);
          break
      }
      // 如果有新增的值，也就是使用了push unshift splice三个方法
      // 调用ob.observeArray，也就是遍历将数组所有元素进行observe
      // 也就是说增加和删除元素，都还是会响应式
      if (inserted) { ob.observeArray(inserted); }
      // notify change
      // 通知更新
      ob.dep.notify();
      // 最后返回数组方法原本操作的结果
      return result
    });
  });

  /*  */
  // 方法返回一个由指定对象的所有自身属性的属性名（包括不可枚举属性但不包括Symbol值作
  // 为名称的属性）组成的数组,只包括实例化的属性和方法，不包括原型上的。
  var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

  /**
   * In some cases we may want to disable observation inside a component's
   * update computation.
   * 在某些情况下，我们可能希望禁用组件内部的观察更新计算。
   */
  var shouldObserve = true;

  // 是否可以添加到观察者模式
  function toggleObserving (value) {
    shouldObserve = value;
  }

  /**
   * Observer class that is attached to each observed
   * object. Once attached, the observer converts the target
   * object's property keys into getter/setters that
   * collect dependencies and dispatch updates.
   * 附加到每个被观察者的观察者类对象。一旦链接，观察者就会转换目标对象的属性键放入getter/setters中收集依赖项并发送更新。
   */

  var Observer = function Observer (value) {
    this.value = value;
    // 这里会new一个Dep实例
    this.dep = new Dep();
    this.vmCount = 0;
    // def添加__ob__属性，value必须是对象
    def(value, '__ob__', this);
    // 判断当前value是不是数组
    if (Array.isArray(value)) {
      // 如果是数组
      // 检测当前浏览器中有没有Array.prototype
      // 当能使用__proto__时
      // 这里完成了数组的响应式，不使用这7个方法都不会触发响应式
      if (hasProto) {
        // 有原型时将arrayMethods覆盖value.__proto__，也就是把增加了副作用的7个数组方法放了进来
        protoAugment(value, arrayMethods);
      } else {
        // 复制增加了副作用的7个数组方法
        copyAugment(value, arrayMethods, arrayKeys);
      }
      // 遍历将数组所有元素进行observe
      this.observeArray(value);
    } else {
      // 不是数组是对象，执行这里
      // walk就是给对象的所有key进行响应化
      this.walk(value);
    }
  };

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   * 遍历所有属性，将其转换为getter/setters。这个方法只应该在value的类型为对象时调用
   */
  // walk就是给对象的所有key进行响应化
  Observer.prototype.walk = function walk (obj) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      // 遍历对象的每个key，通过defineReactive进行响应化
      defineReactive(obj, keys[i]);
    }
  };

  /**
   * Observe a list of Array items.
   */
  // 遍历将数组所有元素进行observe
  Observer.prototype.observeArray = function observeArray (items) {
    for (var i = 0, l = items.length; i < l; i++) {
      observe(items[i]);
    }
  };

  // helpers

  /**
   * Augment a target Object or Array by intercepting
   * the prototype chain using __proto__
   * 通过拦截来扩充目标对象或数组原型链使用__proto__
   */
  function protoAugment (target, src) {
    /* eslint-disable no-proto */
    // 这里直接用劫持的7个数组覆盖
    target.__proto__ = src;
    /* eslint-enable no-proto */
  }

  /**
   * Augment a target Object or Array by defining
   * hidden properties.
   * 通过定义隐藏属性。
   */
  /* istanbul ignore next */
  // target: value数组 src arrayMethods  keys arrayKeys
  function copyAugment (target, src, keys) {
    for (var i = 0, l = keys.length; i < l; i++) {
      var key = keys[i];
      // 给target设置key属性 内容为src[key] 也就是arrayMethods的值
      def(target, key, src[key]);
    }
  }

  /**
   * Attempt to create an observer instance for a value,
   * returns the new observer if successfully observed,
   * or the existing observer if the value already has one.
   * 尝试给一个value对象创建一个observer实例，
   * 如果观察成功，返回一个新的observer实例
   * 或者返回一个已经存在的observer 如果这个value对象早已拥有
   */
  // observe作用就是为了拿到Observe实例并返回，从缓存中或者new一个
  function observe (value, asRootData) {
    // 判断是否为对象 判断是否为VNode
    if (!isObject(value) || value instanceof VNode) {
      // 如果不是对象 或者 是实例化的Vnode 也就是vdom
      return
    }
    // 观察者 创建一个ob
    var ob;
    // 检测是否有缓存ob
    if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
      // 直接将缓存的ob拿到
      ob = value.__ob__;
    } else if (
      // 如果没有缓存的ob
      shouldObserve && // 当前状态是否能添加观察者
      !isServerRendering() && // 不是ssr
      (Array.isArray(value) || isPlainObject(value)) && // 是对象或数组
      Object.isExtensible(value) && // 是否可以在它上面添加新的属性
      !value._isVue  // 是否是Vue实例
    ) {
      // new 一个Observer实例 复制给ob
      // 也是把value进行响应化，并返回一个ob实例，还添加了__ob__属性
      ob = new Observer(value);
    }
    // 如果作为根data 并且当前ob已有值
    if (asRootData && ob) {
      // ++
      ob.vmCount++;
    }
    // 最后返回ob，也就是一个Obesrver实例 有这个实例就有__ob__，然后其对象和数组都进行了响应化
    return ob
  }

  /**
   * Define a reactive property on an Object.
   * 在对象上定义一个响应式属性
   */
  function defineReactive (
    obj,  // 对象
    key,  // 对象的key
    val, // 监听的数据
    customSetter, //日志函数
    shallow // 是否要添加__ob__属性
  ) {
    // 实例化一个Dep对象， 其中有空的观察者列表
    // 这个 dep 常量所引用的 Dep 实例对象才与我们前面讲过的“筐”的作用相同
    // 即 每一个数据字段都通过闭包引用着属于自己的 dep 常量
    // 每次调用 defineReactive 定义访问器属性时，该属性的 setter/getter 都闭包引用了一个属于自己的“筐
    var dep = new Dep();
    
    // 获取obj的key的描述符
    var property = Object.getOwnPropertyDescriptor(obj, key);
    // 检测key中是否有描述符 如果是不可配置 直接返回
    if (property && property.configurable === false) {
      return
    }

    // cater for pre-defined getter/setters
    // 满足预定义的getter/setters
    // 获取key中的get
    // 保存了来自 property 对象的 get 和 set 
    // 避免原有的 set 和 get 方法被覆盖
    var getter = property && property.get;
    // 获取key中的set
    var setter = property && property.set;
    // 如果getter不存在或setter存在 并且参数长度为2
    if ((!getter || setter) && arguments.length === 2) {
      // 获取到了对象属性的值 val，但是 val 本身有可能也是一个对象
      val = obj[key];
    }
    // 递归响应式处理 给每一层属性附加一个Obeserver实例
    // shallow不存在时代表没有__ob__属性 将val进行observe返回一个ob实例赋值给childOb
    // 如果是对象继续调用 observe(val) 函数观测该对象从而深度观测数据对象
    // walk 函数中调用 defineReactive 函数时没有传递 shallow 参数，所以该参数是 undefined
    // 默认就是深度观测
    var childOb = !shallow && observe(val);
    // 数据拦截
    // 通过Object.defineProperty对obj的key进行数据拦截
    Object.defineProperty(obj, key, {
      // 枚举描述符
      enumerable: true,
      // 描述符
      configurable: true,
      get: function reactiveGetter () {
        // 获取值
        var value = getter ? getter.call(obj) : val;
        // 判断是否有Dep.target 如果有就代表Dep添加了Watcher实例化对象
        if (Dep.target) {
          // 加入到dep去管理watcher 
          dep.depend();
          // 如果存在子对象
          if (childOb) {
            // 也加进去管理
            childOb.dep.depend();
            // 如果值是数组，要特殊处理
            if (Array.isArray(value)) {
              // 循环添加watcher
              dependArray(value);
            }
          }
        }
        return value
      },
      set: function reactiveSetter (newVal) {
        // 获取value值
        var value = getter ? getter.call(obj) : val;
        /* eslint-disable no-self-compare */
        if (newVal === value || (newVal !== newVal && value !== value)) {
          // 新旧值比较 如果是一样则不执行了
          return
        }
        /* eslint-enable no-self-compare 不是生产环境的情况下*/
        if ( customSetter) {
          customSetter();
        }
        // #7981: for accessor properties without setter
        // 对于没有setter的访问器属性 返回
        if (getter && !setter) { return }
        // 如果setter存在
        if (setter) {
          // 设置新值
          setter.call(obj, newVal);
        } else {
          // 如果没有setter ，直接给新值
          val = newVal;
        }
        // 递归，对新来的值 对新值进行observe 返回ob实例
        childOb = !shallow && observe(newVal);
        // 当set时触发通知
        dep.notify();
      }
    });
  }

  /**
   * Set a property on an object. Adds the new property and
   * triggers change notification if the property doesn't
   * already exist.
   * 给对象设置一个属性，添加新属性和添加触发更改通知(dep.notify)，如果这个属性不是早已存在
   * Vue.set
   */
  function set (target, key, val) {
    if (
      // 判断数据 是否是undefined或者null
      // 判断数据类型是否是string，number，symbol，boolean
      (isUndef(target) || isPrimitive(target))
    ) {
      // target必须是对象或者数组，否则发出警告
      warn(("Cannot set reactive property on undefined, null, or primitive value: " + ((target))));
    }
    // 如果是数组 并且检查key是否是有效的数组索引
    if (Array.isArray(target) && isValidArrayIndex(key)) {
      // 设置数组长度
      target.length = Math.max(target.length, key);
      // 像数组尾部添加一个新数据，相当于push
      target.splice(key, 1, val);
      // 返回val
      return val
    }
    // 如果key在target上 并且不是通过原型链查找的 
    if (key in target && !(key in Object.prototype)) {
      // 赋值
      target[key] = val;
      return val
    }
    // 声明一个对象ob 值为该target对象中的原型上面的所有方法和属性，表明该数据加入过观察者中
    var ob = (target).__ob__;
    // 如果是vue 或者  检测vue被实例化的次数 vmCount
    if (target._isVue || (ob && ob.vmCount)) {
      // 如果不是生产环境，发出警告 
      // 避免添加响应式属性给vue实例或者根$data
       warn(
        'Avoid adding reactive properties to a Vue instance or its root $data ' +
        'at runtime - declare it upfront in the data option.'
      );
      return val
    }
    // 如果ob不存在，证明没有添加观察者，不是相应，直接赋值返回
    if (!ob) {
      target[key] = val;
      return val
    }
    // 通过defineReactive将ob.value加入的观察者
    defineReactive(ob.value, key, val);
    // 触发通知更新，通知订阅者obj.value更新数据
    ob.dep.notify();
    return val
  }

  /**
   * Delete a property and trigger change if necessary.
   * 删除属性并在必要时触发更改数据。
   * Vue.delete
   */
  function del (target, key) {
    // 如果不是生产环境
    if (
      // 是否是undefined null sttring boolean symbol number
      (isUndef(target) || isPrimitive(target))
    ) {
      // 发出警告，无法删除这些值
      warn(("Cannot delete reactive property on undefined, null, or primitive value: " + ((target))));
    }
    // 如果是数组 并且检查key是否是有效的数组索引
    if (Array.isArray(target) && isValidArrayIndex(key)) {
      // 使用splice删除
      target.splice(key, 1);
      // 返回
      return
    }
    // 获取__ob__属性
    var ob = (target).__ob__;
    // 如果是vue 或者vue的实例化次数不为0
    if (target._isVue || (ob && ob.vmCount)) {
      // 如果生产环境 发出警告 不能删除vue实例上的响应式属性
       warn(
        'Avoid deleting properties on a Vue instance or its root $data ' +
        '- just set it to null.'
      );
      // 返回
      return
    }
    // 如果不是target对象本身的属性，因为delete只能删除自身对象的属性
    if (!hasOwn(target, key)) {
      // 返回
      return
    }
    // 删除对象中的属性方法
    delete target[key];
    // 如果没有__ob__属性，代表没有添加观察者
    if (!ob) {
      // 直接返回
      return
    }  
    // 通知更新 更新数据
    ob.dep.notify();
  }

  /**
   * Collect dependencies on array elements when the array is touched, since
   * we cannot intercept array element access like property getters.
   * 在接触数组时收集对数组元素的依赖关系，因为我们不能像属性getter那样拦截数组元素访问。
   */
  function dependArray (value) {
    for (var e = (void 0), i = 0, l = value.length; i < l; i++) {
      e = value[i];
      // 判断是否存在__ob__实例，并且每个都调用depend添加wathcer管理
      e && e.__ob__ && e.__ob__.dep.depend();
      // 递归完数组所有内容，直到不是数组，跳出递归
      if (Array.isArray(e)) {
        dependArray(e);
      }
    }
  }

  /*  */

  /**
   * Option overwriting strategies are functions that handle
   * how to merge a parent option value and a child option
   * value into the final value.
   */
  var strats = config.optionMergeStrategies;

  /**
   * Options with restrictions
   */
  {
    strats.el = strats.propsData = function (parent, child, vm, key) {
      if (!vm) {
        warn(
          "option \"" + key + "\" can only be used during instance " +
          'creation with the `new` keyword.'
        );
      }
      return defaultStrat(parent, child)
    };
  }

  /**
   * Helper that recursively merges two data objects together.
   */
  function mergeData (to, from) {
    if (!from) { return to }
    var key, toVal, fromVal;

    var keys = hasSymbol
      ? Reflect.ownKeys(from)
      : Object.keys(from);

    for (var i = 0; i < keys.length; i++) {
      key = keys[i];
      // in case the object is already observed...
      if (key === '__ob__') { continue }
      toVal = to[key];
      fromVal = from[key];
      if (!hasOwn(to, key)) {
        set(to, key, fromVal);
      } else if (
        toVal !== fromVal &&
        isPlainObject(toVal) &&
        isPlainObject(fromVal)
      ) {
        mergeData(toVal, fromVal);
      }
    }
    return to
  }

  /**
   * Data
   */
  function mergeDataOrFn (
    parentVal,
    childVal,
    vm
  ) {
    if (!vm) {
      // in a Vue.extend merge, both should be functions
      if (!childVal) {
        return parentVal
      }
      if (!parentVal) {
        return childVal
      }
      // when parentVal & childVal are both present,
      // we need to return a function that returns the
      // merged result of both functions... no need to
      // check if parentVal is a function here because
      // it has to be a function to pass previous merges.
      return function mergedDataFn () {
        return mergeData(
          typeof childVal === 'function' ? childVal.call(this, this) : childVal,
          typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
        )
      }
    } else {
      return function mergedInstanceDataFn () {
        // instance merge
        var instanceData = typeof childVal === 'function'
          ? childVal.call(vm, vm)
          : childVal;
        var defaultData = typeof parentVal === 'function'
          ? parentVal.call(vm, vm)
          : parentVal;
        if (instanceData) {
          return mergeData(instanceData, defaultData)
        } else {
          return defaultData
        }
      }
    }
  }

  strats.data = function (
    parentVal,
    childVal,
    vm
  ) {
    if (!vm) {
      if (childVal && typeof childVal !== 'function') {
         warn(
          'The "data" option should be a function ' +
          'that returns a per-instance value in component ' +
          'definitions.',
          vm
        );

        return parentVal
      }
      return mergeDataOrFn(parentVal, childVal)
    }

    return mergeDataOrFn(parentVal, childVal, vm)
  };

  /**
   * Hooks and props are merged as arrays.
   */
  function mergeHook (
    parentVal,
    childVal
  ) {
    var res = childVal
      ? parentVal
        ? parentVal.concat(childVal)
        : Array.isArray(childVal)
          ? childVal
          : [childVal]
      : parentVal;
    return res
      ? dedupeHooks(res)
      : res
  }

  function dedupeHooks (hooks) {
    var res = [];
    for (var i = 0; i < hooks.length; i++) {
      if (res.indexOf(hooks[i]) === -1) {
        res.push(hooks[i]);
      }
    }
    return res
  }

  LIFECYCLE_HOOKS.forEach(function (hook) {
    strats[hook] = mergeHook;
  });

  /**
   * Assets
   *
   * When a vm is present (instance creation), we need to do
   * a three-way merge between constructor options, instance
   * options and parent options.
   */
  function mergeAssets (
    parentVal,
    childVal,
    vm,
    key
  ) {
    var res = Object.create(parentVal || null);
    if (childVal) {
       assertObjectType(key, childVal, vm);
      return extend(res, childVal)
    } else {
      return res
    }
  }

  ASSET_TYPES.forEach(function (type) {
    strats[type + 's'] = mergeAssets;
  });

  /**
   * Watchers.
   *
   * Watchers hashes should not overwrite one
   * another, so we merge them as arrays.
   */
  strats.watch = function (
    parentVal,
    childVal,
    vm,
    key
  ) {
    // work around Firefox's Object.prototype.watch...
    if (parentVal === nativeWatch) { parentVal = undefined; }
    if (childVal === nativeWatch) { childVal = undefined; }
    /* istanbul ignore if */
    if (!childVal) { return Object.create(parentVal || null) }
    {
      assertObjectType(key, childVal, vm);
    }
    if (!parentVal) { return childVal }
    var ret = {};
    extend(ret, parentVal);
    for (var key$1 in childVal) {
      var parent = ret[key$1];
      var child = childVal[key$1];
      if (parent && !Array.isArray(parent)) {
        parent = [parent];
      }
      ret[key$1] = parent
        ? parent.concat(child)
        : Array.isArray(child) ? child : [child];
    }
    return ret
  };

  /**
   * Other object hashes.
   */
  strats.props =
  strats.methods =
  strats.inject =
  strats.computed = function (
    parentVal,
    childVal,
    vm,
    key
  ) {
    if (childVal && "development" !== 'production') {
      assertObjectType(key, childVal, vm);
    }
    if (!parentVal) { return childVal }
    var ret = Object.create(null);
    extend(ret, parentVal);
    if (childVal) { extend(ret, childVal); }
    return ret
  };
  strats.provide = mergeDataOrFn;

  /**
   * Default strategy.
   */
  var defaultStrat = function (parentVal, childVal) {
    return childVal === undefined
      ? parentVal
      : childVal
  };

  /**
   * Validate component names
   */
  function checkComponents (options) {
    for (var key in options.components) {
      validateComponentName(key);
    }
  }

  function validateComponentName (name) {
    if (!new RegExp(("^[a-zA-Z][\\-\\.0-9_" + (unicodeRegExp.source) + "]*$")).test(name)) {
      warn(
        'Invalid component name: "' + name + '". Component names ' +
        'should conform to valid custom element name in html5 specification.'
      );
    }
    if (isBuiltInTag(name) || config.isReservedTag(name)) {
      warn(
        'Do not use built-in or reserved HTML elements as component ' +
        'id: ' + name
      );
    }
  }

  /**
   * Ensure all props option syntax are normalized into the
   * Object-based format.
   */
  function normalizeProps (options, vm) {
    var props = options.props;
    if (!props) { return }
    var res = {};
    var i, val, name;
    if (Array.isArray(props)) {
      i = props.length;
      while (i--) {
        val = props[i];
        if (typeof val === 'string') {
          name = camelize(val);
          res[name] = { type: null };
        } else {
          warn('props must be strings when using array syntax.');
        }
      }
    } else if (isPlainObject(props)) {
      for (var key in props) {
        val = props[key];
        name = camelize(key);
        res[name] = isPlainObject(val)
          ? val
          : { type: val };
      }
    } else {
      warn(
        "Invalid value for option \"props\": expected an Array or an Object, " +
        "but got " + (toRawType(props)) + ".",
        vm
      );
    }
    options.props = res;
  }

  /**
   * Normalize all injections into Object-based format
   */
  function normalizeInject (options, vm) {
    var inject = options.inject;
    if (!inject) { return }
    var normalized = options.inject = {};
    if (Array.isArray(inject)) {
      for (var i = 0; i < inject.length; i++) {
        normalized[inject[i]] = { from: inject[i] };
      }
    } else if (isPlainObject(inject)) {
      for (var key in inject) {
        var val = inject[key];
        normalized[key] = isPlainObject(val)
          ? extend({ from: key }, val)
          : { from: val };
      }
    } else {
      warn(
        "Invalid value for option \"inject\": expected an Array or an Object, " +
        "but got " + (toRawType(inject)) + ".",
        vm
      );
    }
  }

  /**
   * Normalize raw function directives into object format.
   */
  function normalizeDirectives (options) {
    var dirs = options.directives;
    if (dirs) {
      for (var key in dirs) {
        var def = dirs[key];
        if (typeof def === 'function') {
          dirs[key] = { bind: def, update: def };
        }
      }
    }
  }

  function assertObjectType (name, value, vm) {
    if (!isPlainObject(value)) {
      warn(
        "Invalid value for option \"" + name + "\": expected an Object, " +
        "but got " + (toRawType(value)) + ".",
        vm
      );
    }
  }

  /**
   * Merge two option objects into a new one.
   * Core utility used in both instantiation and inheritance.
   */
  function mergeOptions (
    parent,
    child,
    vm
  ) {
    {
      checkComponents(child);
    }

    if (typeof child === 'function') {
      child = child.options;
    }

    normalizeProps(child, vm);
    normalizeInject(child, vm);
    normalizeDirectives(child);

    // Apply extends and mixins on the child options,
    // but only if it is a raw options object that isn't
    // the result of another mergeOptions call.
    // Only merged options has the _base property.
    if (!child._base) {
      if (child.extends) {
        parent = mergeOptions(parent, child.extends, vm);
      }
      if (child.mixins) {
        for (var i = 0, l = child.mixins.length; i < l; i++) {
          parent = mergeOptions(parent, child.mixins[i], vm);
        }
      }
    }

    var options = {};
    var key;
    for (key in parent) {
      mergeField(key);
    }
    for (key in child) {
      if (!hasOwn(parent, key)) {
        mergeField(key);
      }
    }
    function mergeField (key) {
      var strat = strats[key] || defaultStrat;
      options[key] = strat(parent[key], child[key], vm, key);
    }
    return options
  }

  /**
   * Resolve an asset.
   * This function is used because child instances need access
   * to assets defined in its ancestor chain.
   */
  function resolveAsset (
    options,
    type,
    id,
    warnMissing
  ) {
    /* istanbul ignore if */
    if (typeof id !== 'string') {
      return
    }
    var assets = options[type];
    // check local registration variations first
    if (hasOwn(assets, id)) { return assets[id] }
    var camelizedId = camelize(id);
    if (hasOwn(assets, camelizedId)) { return assets[camelizedId] }
    var PascalCaseId = capitalize(camelizedId);
    if (hasOwn(assets, PascalCaseId)) { return assets[PascalCaseId] }
    // fallback to prototype chain
    var res = assets[id] || assets[camelizedId] || assets[PascalCaseId];
    if ( warnMissing && !res) {
      warn(
        'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
        options
      );
    }
    return res
  }

  /*  */



  function validateProp (
    key, //key
    propOptions, //原始props参数
    propsData,  //转义过的组件props数据
    vm     //VueComponent 组件构造函数
  ) {
    // 获取组件定义的props属性
    var prop = propOptions[key];
    // 如果该为假的那么可能  a-b 这样的key才能获取到值
    // Object.prototype.hasOwnProperty.call(propsData, key)
    var absent = !hasOwn(propsData, key);
    // 获取值
    var value = propsData[key]; 
    // boolean casting
    // Boolean 传一个布尔值  但是 一般是函数或者数组函数才有意义，而且是函数声明的函数并不是 函数表达式prop.type 也需要是函数
    // 返回的是相同的索引  判断 属性类型定义的是否是Boolean
    // 判断prop.type是否是Boolean，如果是返回对应的index或0
    var booleanIndex = getTypeIndex(Boolean, prop.type);
    // 0或index大于-1 所以这里判断是Boolean值
    if (booleanIndex > -1) { 
      // 如果key 不是propsData 实例化，或者 没有定义default 默认值的时候 
      if (absent && !hasOwn(prop, 'default')) {
        // 设置value 为false
        value = false;
      } else if (
        value === '' // 如果value是空
        || value === hyphenate(key) //或者key转出 - 形式 和value相等 驼峰转发 toString to-string
        ) {
        // only cast empty string / same name to boolean if
        // 仅将空字符串/相同名称转换为boolean if
        // boolean has higher priority
        // 获取到相同的
        // 判断prop.type 的类型是否是string字符串类型
        var stringIndex = getTypeIndex(String, prop.type);
        if (
          stringIndex < 0  //如果匹配不到字符串
          || booleanIndex < stringIndex //或者布尔值索引小于字符串索引的时候
          ) {
            // 设置value为true
          value = true;
        }
      }
    }
    // check default value 检查默认值
    // 如果没有值 value不是boolean也不是string时
    if (value === undefined) {
      // 有可能是函数
      value = getPropDefaultValue(vm, prop, key);
      // since the default value is a fresh copy,由于默认值是一个新的副本，
      // make sure to observe it. 一定要observe
      // 获取shouldObserve
      var prevShouldObserve = shouldObserve;
      // 可放进观察者模式
      toggleObserving(true);
      // 为 value添加 value.__ob__属性，把value添加到观察者中
      observe(value);
      // 设为之前的 prevShouldObserve
      toggleObserving(prevShouldObserve);
    }
    {
      // 检查prop是否合格
      assertProp(
        prop, //属性type值
        key,  //props中的key
        value,  //view 属性的值
        vm,  //Vuecomponent 组件构造函数
        absent //false
        );
    }
    return value
  }

  /**
   * Get the default value of a prop.
   */
  function getPropDefaultValue (vm, prop, key) {
    // no default, return undefined
    if (!hasOwn(prop, 'default')) {
      return undefined
    }
    var def = prop.default;
    // warn against non-factory defaults for Object & Array
    if ( isObject(def)) {
      warn(
        'Invalid default value for prop "' + key + '": ' +
        'Props with type Object/Array must use a factory function ' +
        'to return the default value.',
        vm
      );
    }
    // the raw prop value was also undefined from previous render,
    // return previous default value to avoid unnecessary watcher trigger
    if (vm && vm.$options.propsData &&
      vm.$options.propsData[key] === undefined &&
      vm._props[key] !== undefined
    ) {
      return vm._props[key]
    }
    // call factory function for non-Function types
    // a value is Function if its prototype is function even across different execution context
    return typeof def === 'function' && getType(prop.type) !== 'Function'
      ? def.call(vm)
      : def
  }

  /**
   * Assert whether a prop is valid.
   */
  function assertProp (
    prop,
    name,
    value,
    vm,
    absent
  ) {
    if (prop.required && absent) {
      warn(
        'Missing required prop: "' + name + '"',
        vm
      );
      return
    }
    if (value == null && !prop.required) {
      return
    }
    var type = prop.type;
    var valid = !type || type === true;
    var expectedTypes = [];
    if (type) {
      if (!Array.isArray(type)) {
        type = [type];
      }
      for (var i = 0; i < type.length && !valid; i++) {
        var assertedType = assertType(value, type[i]);
        expectedTypes.push(assertedType.expectedType || '');
        valid = assertedType.valid;
      }
    }

    if (!valid) {
      warn(
        getInvalidTypeMessage(name, value, expectedTypes),
        vm
      );
      return
    }
    var validator = prop.validator;
    if (validator) {
      if (!validator(value)) {
        warn(
          'Invalid prop: custom validator check failed for prop "' + name + '".',
          vm
        );
      }
    }
  }

  var simpleCheckRE = /^(String|Number|Boolean|Function|Symbol)$/;

  function assertType (value, type) {
    var valid;
    var expectedType = getType(type);
    if (simpleCheckRE.test(expectedType)) {
      var t = typeof value;
      valid = t === expectedType.toLowerCase();
      // for primitive wrapper objects
      if (!valid && t === 'object') {
        valid = value instanceof type;
      }
    } else if (expectedType === 'Object') {
      valid = isPlainObject(value);
    } else if (expectedType === 'Array') {
      valid = Array.isArray(value);
    } else {
      valid = value instanceof type;
    }
    return {
      valid: valid,
      expectedType: expectedType
    }
  }

  /**
   * Use function string name to check built-in types,
   * because a simple equality check will fail when running
   * across different vms / iframes.
   * 检查函数是否是函数声明  如果是函数表达式或者匿名函数是匹配不上的
   */
  // 检测声明函数，并不是函数表达式和匿名函数
  function getType (fn) {
    var match = fn && fn.toString().match(/^\s*function (\w+)/);
    return match ? match[1] : ''
  }
  // 两个函数声明是否相等
  function isSameType (a, b) {
    return getType(a) === getType(b)
  }
  // 判断expectedTypes 中的函数和 type 函数是否有相等的如有有则返回索引index 如果没有则返回-1
  function getTypeIndex (type, expectedTypes) {
    // 如果expectedTypes不是数组直接比较，
    if (!Array.isArray(expectedTypes)) {
      // 如果是相同的类型 返回0 否则返回1
      return isSameType(expectedTypes, type) ? 0 : -1
    }
    // 如果是数组。遍历
    for (var i = 0, len = expectedTypes.length; i < len; i++) {
      // 如果相同的，返回相应索引Index
      if (isSameType(expectedTypes[i], type)) {
        return i
      }
    }
    // 没有则返回-1
    return -1
  }

  function getInvalidTypeMessage (name, value, expectedTypes) {
    var message = "Invalid prop: type check failed for prop \"" + name + "\"." +
      " Expected " + (expectedTypes.map(capitalize).join(', '));
    var expectedType = expectedTypes[0];
    var receivedType = toRawType(value);
    var expectedValue = styleValue(value, expectedType);
    var receivedValue = styleValue(value, receivedType);
    // check if we need to specify expected value
    if (expectedTypes.length === 1 &&
        isExplicable(expectedType) &&
        !isBoolean(expectedType, receivedType)) {
      message += " with value " + expectedValue;
    }
    message += ", got " + receivedType + " ";
    // check if we need to specify received value
    if (isExplicable(receivedType)) {
      message += "with value " + receivedValue + ".";
    }
    return message
  }

  function styleValue (value, type) {
    if (type === 'String') {
      return ("\"" + value + "\"")
    } else if (type === 'Number') {
      return ("" + (Number(value)))
    } else {
      return ("" + value)
    }
  }

  function isExplicable (value) {
    var explicitTypes = ['string', 'number', 'boolean'];
    return explicitTypes.some(function (elem) { return value.toLowerCase() === elem; })
  }

  function isBoolean () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return args.some(function (elem) { return elem.toLowerCase() === 'boolean'; })
  }

  /*  */

  function handleError (err, vm, info) {
    // Deactivate deps tracking while processing error handler to avoid possible infinite rendering.
    // See: https://github.com/vuejs/vuex/issues/1505
    pushTarget();
    try {
      if (vm) {
        var cur = vm;
        while ((cur = cur.$parent)) {
          var hooks = cur.$options.errorCaptured;
          if (hooks) {
            for (var i = 0; i < hooks.length; i++) {
              try {
                var capture = hooks[i].call(cur, err, vm, info) === false;
                if (capture) { return }
              } catch (e) {
                globalHandleError(e, cur, 'errorCaptured hook');
              }
            }
          }
        }
      }
      globalHandleError(err, vm, info);
    } finally {
      popTarget();
    }
  }

  function invokeWithErrorHandling (
    handler,
    context,
    args,
    vm,
    info
  ) {
    var res;
    try {
      // 根据是否传参，执行对应操作
      res = args ? handler.apply(context, args) : handler.call(context);
      // 如果res  res._isVue:todo 检测是否为Promise res._handled:todo
      if (res && !res._isVue && isPromise(res) && !res._handled) {
        // 报异步错
        res.catch(function (e) { return handleError(e, vm, info + " (Promise/async)"); });
        // issue #9511
        // avoid catch triggering multiple times when nested calls
        // 避免在嵌套调用时多次触发catch
        res._handled = true;
      }
    } catch (e) {
      handleError(e, vm, info);
    }
    // 如果没有，就返回res
    return res
  }

  function globalHandleError (err, vm, info) {
    if (config.errorHandler) {
      try {
        return config.errorHandler.call(null, err, vm, info)
      } catch (e) {
        // if the user intentionally throws the original error in the handler,
        // do not log it twice
        if (e !== err) {
          logError(e, null, 'config.errorHandler');
        }
      }
    }
    logError(err, vm, info);
  }

  function logError (err, vm, info) {
    {
      warn(("Error in " + info + ": \"" + (err.toString()) + "\""), vm);
    }
    /* istanbul ignore else */
    if ((inBrowser || inWeex) && typeof console !== 'undefined') {
      console.error(err);
    } else {
      throw err
    }
  }

  /*  */

  var isUsingMicroTask = false;

  // 回调函数队列
  var callbacks = [];
  // pending状态
  var pending = false;

  // 执行所有Callback队列中的所有函数
  function flushCallbacks () {
    pending = false;
    var copies = callbacks.slice(0);
    callbacks.length = 0;
    for (var i = 0; i < copies.length; i++) {
      copies[i]();
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
  var timerFunc;

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
    var p = Promise.resolve();
    timerFunc = function () {
      // 通过Promise微任务清空回调队列
      p.then(flushCallbacks);
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
      if (isIOS) { setTimeout(noop); }
    };
    // 使用微任务 为true
    isUsingMicroTask = true;
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
    var counter = 1;
    var observer = new MutationObserver(flushCallbacks);
    var textNode = document.createTextNode(String(counter));
    observer.observe(textNode, {
      characterData: true
    });
    timerFunc = function () {
      counter = (counter + 1) % 2;
      textNode.data = String(counter);
    };
    // MutationObserver还是微任务
    isUsingMicroTask = true;
    // 如果MutationObserver还不能用，判断setImmediate是否存在并native，用setImmediate
  } else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
    // Fallback to setImmediate.
    // Techinically it leverages the (macro) task queue,
    // but it is still a better choice than setTimeout.

    // 回退到setImmediate。
    // 在技术上，它利用（宏）任务队列
    // 但它仍然是比setTimeout更好的选择。
    timerFunc = function () {
      setImmediate(flushCallbacks);
    };
  } else {
    // Fallback to setTimeout.
    // 最后回退到使用setTimeout
    timerFunc = function () {
      setTimeout(flushCallbacks, 0);
    };
  }

  // 为callbacks 收集队列cb函数 并且根据 pending 状态是否要触发callbacks 队列函数
  // 异步清空回调函数队列
  function nextTick (
    cb,  // 回调函数
    ctx //this指向
    ) {
    var _resolve;
    // 向callbacks回调函数队列添加一个函数
    callbacks.push(function () {
      // 如果cb存在
      if (cb) {
        try {
          // 指向cb这个函数
          cb.call(ctx);
        } catch (e) {
          // 如果不是函数，报错
          handleError(e, ctx, 'nextTick');
        }
        // 如果_resolve存在
      } else if (_resolve) {
        // 执行_resolve
        _resolve(ctx);
      }
    });
    if (!pending) {
      pending = true;
      // 通过异步 清空回调任务队列
      timerFunc();
    }
    // $flow-disable-line
    // 如果cb不存在 并且Promise存在
    if (!cb && typeof Promise !== 'undefined') {
      // 返回一个Promise
      return new Promise(function (resolve) {
        _resolve = resolve;
      })
    }
  }

  var mark;
  var measure;

  {
    var perf = inBrowser && window.performance;
    /* istanbul ignore if */
    if (
      perf &&
      perf.mark &&
      perf.measure &&
      perf.clearMarks &&
      perf.clearMeasures
    ) {
      mark = function (tag) { return perf.mark(tag); };
      measure = function (name, startTag, endTag) {
        perf.measure(name, startTag, endTag);
        perf.clearMarks(startTag);
        perf.clearMarks(endTag);
        // perf.clearMeasures(name)
      };
    }
  }

  /* not type checking this file because flow doesn't play well with Proxy */

  var initProxy;

  {
    var allowedGlobals = makeMap(
      'Infinity,undefined,NaN,isFinite,isNaN,' +
      'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
      'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
      'require' // for Webpack/Browserify
    );

    var warnNonPresent = function (target, key) {
      warn(
        "Property or method \"" + key + "\" is not defined on the instance but " +
        'referenced during render. Make sure that this property is reactive, ' +
        'either in the data option, or for class-based components, by ' +
        'initializing the property. ' +
        'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.',
        target
      );
    };

    var warnReservedPrefix = function (target, key) {
      warn(
        "Property \"" + key + "\" must be accessed with \"$data." + key + "\" because " +
        'properties starting with "$" or "_" are not proxied in the Vue instance to ' +
        'prevent conflicts with Vue internals' +
        'See: https://vuejs.org/v2/api/#data',
        target
      );
    };

    var hasProxy =
      typeof Proxy !== 'undefined' && isNative(Proxy);

    if (hasProxy) {
      var isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta,exact');
      config.keyCodes = new Proxy(config.keyCodes, {
        set: function set (target, key, value) {
          if (isBuiltInModifier(key)) {
            warn(("Avoid overwriting built-in modifier in config.keyCodes: ." + key));
            return false
          } else {
            target[key] = value;
            return true
          }
        }
      });
    }

    var hasHandler = {
      has: function has (target, key) {
        var has = key in target;
        var isAllowed = allowedGlobals(key) ||
          (typeof key === 'string' && key.charAt(0) === '_' && !(key in target.$data));
        if (!has && !isAllowed) {
          if (key in target.$data) { warnReservedPrefix(target, key); }
          else { warnNonPresent(target, key); }
        }
        return has || !isAllowed
      }
    };

    var getHandler = {
      get: function get (target, key) {
        if (typeof key === 'string' && !(key in target)) {
          if (key in target.$data) { warnReservedPrefix(target, key); }
          else { warnNonPresent(target, key); }
        }
        return target[key]
      }
    };

    initProxy = function initProxy (vm) {
      if (hasProxy) {
        // determine which proxy handler to use
        var options = vm.$options;
        var handlers = options.render && options.render._withStripped
          ? getHandler
          : hasHandler;
        vm._renderProxy = new Proxy(vm, handlers);
      } else {
        vm._renderProxy = vm;
      }
    };
  }

  /*  */

  // seenObjects是Set实例
  var seenObjects = new _Set();

  /**
   * Recursively traverse an object to evoke all converted
   * getters, so that every nested property inside the object
   * is collected as a "deep" dependency.
   * 递归地遍历一个对象以唤起所有已转换的
   * getter，以便对象内的每个嵌套属性
   * 作为“深层”依赖关系收集。
   * 为 seenObjects深度收集val中的key
   */
  function traverse (val) {
    // 为seenObjects深度收集val中的key
    _traverse(val, seenObjects);
    seenObjects.clear();
  }

  // 为seenObjects深度收集val中的key
  function _traverse (val, seen) {
    var i, keys;
    // 是否是数组
    var isA = Array.isArray(val);
    // 如果不是数组并且不是对象或被冻结 或是Vnode实例
    if ((!isA && !isObject(val)) || Object.isFrozen(val) || val instanceof VNode) {
      // 返回
      return
    }
    // 如果val存在__ob__属性
    if (val.__ob__) {
      // 获取__ob__的dep.id
      var depId = val.__ob__.dep.id;
      // 如果seenObjects中有这个depId
      if (seen.has(depId)) {
        // 返回
        return
      }
      // 如果没有这个depId，给seenObjects这个set添加一个depId
      seen.add(depId);
    }
    // 如果是数组
    if (isA) {
      i = val.length;
      // 遍历所有值，进行递归检查添加
      while (i--) { _traverse(val[i], seen); }
    } else {
      // 如果不是数组，获取所有key
      keys = Object.keys(val);
      i = keys.length;
      // 遍历对象的所有key进行循环递归检查添加
      while (i--) { _traverse(val[keys[i]], seen); }
    }
  }

  /*  */

  // 过滤修饰符 & ~ !
  var normalizeEvent = cached(function (name) {
    // 如果第一个字符是 &
    var passive = name.charAt(0) === '&';
    // 把 & 割了
    name = passive ? name.slice(1) : name;
    // 判断第一个字符串是否是~
    var once = name.charAt(0) === '~'; // Prefixed last, checked first
    // 割了
    name = once ? name.slice(1) : name;
    // 判断第一个字符是否是!
    var capture = name.charAt(0) === '!';
    // 割了
    name = capture ? name.slice(1) : name;
    return {
      name: name,
      once: once,
      capture: capture,
      passive: passive
    }
  });
  // createFnInvoker 创建一个调用程序 创建一个钩子函数
  // createFnInvoker，如果事件只是个函数就为为事件添加多一个静态类， 
  // invoker.fns = fns; 把真正的事件放在fns。而 invoker 则是转义fns然后再运行fns
  function createFnInvoker (
    fns,  //函数
    vm // 实例
    ) {
    function invoker () {
      var arguments$1 = arguments;

      // 获取通过静态方法传进来的函数 赋值给fns
      var fns = invoker.fns;
      // 如果fns是数组
      if (Array.isArray(fns)) {
        // 执行浅拷贝
        var cloned = fns.slice();
        // 循环检测执行
        for (var i = 0; i < cloned.length; i++) {
          invokeWithErrorHandling(cloned[i], null, arguments$1, vm, "v-on handler");
        }
      } else {
        // return handler return value for single handlers
        // 如果fns不是数组 返回处理程序单个处理程序的返回值
        return invokeWithErrorHandling(fns, null, arguments, vm, "v-on handler")
      }
    }
    // 重新复
    invoker.fns = fns;
    return invoker
  }

  function updateListeners (
    on, // 新绑定事件
    oldOn, // 旧绑定事件
    add, // 添加事件的函数
    remove, // 删除事件的函数
    createOnceHandler, // 生成一次调用的函数
    vm  // 实例化对象Vue
  ) {
    var name, def, cur, old, event;
    // 遍历新的事件
    for (name in on) {
      // on[name]是新的事件的值 赋值给def cur
      def = cur = on[name];
      // 旧事件对象中 和 新事件 对象中相同的key值， 保存旧的相同的值
      old = oldOn[name];
      // 过滤事件修饰符 
      event = normalizeEvent(name);
      if (isUndef(cur)) {
         warn(
          "Invalid handler for event \"" + (event.name) + "\": got " + String(cur),
          vm
        );
      } else if (isUndef(old)) { //判断旧事件值 如果为空  代表没有定义旧的事件
        // 如果函数 fns不存在，
        if (isUndef(cur.fns)) { 
          // 函数 获取钩子函数
          // 创建函数调用器并重新复制给cur和on[name]
          cur = on[name] = createFnInvoker(cur, vm);
        }
        // 如果event.once为true 代表~
        if (isTrue(event.once)) {
          cur = on[name] = createOnceHandler(event.name, cur, event.capture);
        }
        // 添加事件
        add(
          event.name,  //事件名
          cur,  // 转义过的事件 执行静态类
          event.capture,   //事件捕获或冒泡
          event.passive,  // 检测修饰符
          event.params // 事件参数
          );
      } else if (cur !== old) {
        // 如果新的值不等于旧的值
        // 则更新新旧值
        old.fns = cur;
        on[name] = old;
      }
    }

    for (name in oldOn) {
      //循环旧的值 为空的时候
      if (isUndef(on[name])) {
        //获取事件
        event = normalizeEvent(name);
        //删除旧的值的事件
        remove(event.name, oldOn[name], event.capture);
      }
    }
  }

  /*  */

  function mergeVNodeHook (def, hookKey, hook) {
    if (def instanceof VNode) {
      def = def.data.hook || (def.data.hook = {});
    }
    var invoker;
    var oldHook = def[hookKey];

    function wrappedHook () {
      hook.apply(this, arguments);
      // important: remove merged hook to ensure it's called only once
      // and prevent memory leak
      remove(invoker.fns, wrappedHook);
    }

    if (isUndef(oldHook)) {
      // no existing hook
      invoker = createFnInvoker([wrappedHook]);
    } else {
      /* istanbul ignore if */
      if (isDef(oldHook.fns) && isTrue(oldHook.merged)) {
        // already a merged invoker
        invoker = oldHook;
        invoker.fns.push(wrappedHook);
      } else {
        // existing plain hook
        invoker = createFnInvoker([oldHook, wrappedHook]);
      }
    }

    invoker.merged = true;
    def[hookKey] = invoker;
  }

  /*  */

  function extractPropsFromVNodeData (
    data,
    Ctor,
    tag
  ) {
    // we are only extracting raw values here.
    // validation and default values are handled in the child
    // component itself.
    var propOptions = Ctor.options.props;
    if (isUndef(propOptions)) {
      return
    }
    var res = {};
    var attrs = data.attrs;
    var props = data.props;
    if (isDef(attrs) || isDef(props)) {
      for (var key in propOptions) {
        var altKey = hyphenate(key);
        {
          var keyInLowerCase = key.toLowerCase();
          if (
            key !== keyInLowerCase &&
            attrs && hasOwn(attrs, keyInLowerCase)
          ) {
            tip(
              "Prop \"" + keyInLowerCase + "\" is passed to component " +
              (formatComponentName(tag || Ctor)) + ", but the declared prop name is" +
              " \"" + key + "\". " +
              "Note that HTML attributes are case-insensitive and camelCased " +
              "props need to use their kebab-case equivalents when using in-DOM " +
              "templates. You should probably use \"" + altKey + "\" instead of \"" + key + "\"."
            );
          }
        }
        checkProp(res, props, key, altKey, true) ||
        checkProp(res, attrs, key, altKey, false);
      }
    }
    return res
  }

  function checkProp (
    res,
    hash,
    key,
    altKey,
    preserve
  ) {
    if (isDef(hash)) {
      if (hasOwn(hash, key)) {
        res[key] = hash[key];
        if (!preserve) {
          delete hash[key];
        }
        return true
      } else if (hasOwn(hash, altKey)) {
        res[key] = hash[altKey];
        if (!preserve) {
          delete hash[altKey];
        }
        return true
      }
    }
    return false
  }

  /*  */

  // The template compiler attempts to minimize the need for normalization by
  // statically analyzing the template at compile time.
  //
  // For plain HTML markup, normalization can be completely skipped because the
  // generated render function is guaranteed to return Array<VNode>. There are
  // two cases where extra normalization is needed:

  // 1. When the children contains components - because a functional component
  // may return an Array instead of a single root. In this case, just a simple
  // normalization is needed - if any child is an Array, we flatten the whole
  // thing with Array.prototype.concat. It is guaranteed to be only 1-level deep
  // because functional components already normalize their own children.
  function simpleNormalizeChildren (children) {
    for (var i = 0; i < children.length; i++) {
      if (Array.isArray(children[i])) {
        return Array.prototype.concat.apply([], children)
      }
    }
    return children
  }

  // 2. When the children contains constructs that always generated nested Arrays,
  // e.g. <template>, <slot>, v-for, or when the children is provided by user
  // with hand-written render functions / JSX. In such cases a full normalization
  // is needed to cater to all possible types of children values.
  function normalizeChildren (children) {
    return isPrimitive(children)
      ? [createTextVNode(children)]
      : Array.isArray(children)
        ? normalizeArrayChildren(children)
        : undefined
  }

  function isTextNode (node) {
    return isDef(node) && isDef(node.text) && isFalse(node.isComment)
  }

  function normalizeArrayChildren (children, nestedIndex) {
    var res = [];
    var i, c, lastIndex, last;
    for (i = 0; i < children.length; i++) {
      c = children[i];
      if (isUndef(c) || typeof c === 'boolean') { continue }
      lastIndex = res.length - 1;
      last = res[lastIndex];
      //  nested
      if (Array.isArray(c)) {
        if (c.length > 0) {
          c = normalizeArrayChildren(c, ((nestedIndex || '') + "_" + i));
          // merge adjacent text nodes
          if (isTextNode(c[0]) && isTextNode(last)) {
            res[lastIndex] = createTextVNode(last.text + (c[0]).text);
            c.shift();
          }
          res.push.apply(res, c);
        }
      } else if (isPrimitive(c)) {
        if (isTextNode(last)) {
          // merge adjacent text nodes
          // this is necessary for SSR hydration because text nodes are
          // essentially merged when rendered to HTML strings
          res[lastIndex] = createTextVNode(last.text + c);
        } else if (c !== '') {
          // convert primitive to vnode
          res.push(createTextVNode(c));
        }
      } else {
        if (isTextNode(c) && isTextNode(last)) {
          // merge adjacent text nodes
          res[lastIndex] = createTextVNode(last.text + c.text);
        } else {
          // default key for nested array children (likely generated by v-for)
          if (isTrue(children._isVList) &&
            isDef(c.tag) &&
            isUndef(c.key) &&
            isDef(nestedIndex)) {
            c.key = "__vlist" + nestedIndex + "_" + i + "__";
          }
          res.push(c);
        }
      }
    }
    return res
  }

  /*  */

  // 这对选项需要一起使用，以允许一个祖先组件向其所有子孙后代注入一个依赖，
  // 不论组件层次有多深，并在起上下游关系成立的时间里始终生效。如果你熟悉 
  // React，这与 React 的上下文特性很相似。
  // 参考：https://cn.vuejs.org/v2/api/#provide-inject

  // 解析provide
  // provide 选项应该是一个对象或返回一个对象的函数。该对象包含可注入其子孙的属性，用于组件通信。
  function initProvide (vm) {
    // 获取provide
    var provide = vm.$options.provide;
    // 如果存在
    if (provide) {
      // 如果是函数，立马执行，不是就还是provide
      vm._provided = typeof provide === 'function'
        ? provide.call(vm)
        : provide;
    }
  }
  // provide 和 inject 绑定并不是可响应的。这是刻意为之的。然而，如果你传入了一个可监听的对象，那么其对象的 property 还是可响应的。
  // 解析inject 注入
  // inject 选项应该是一个字符串数组或一个对象，该对象的 key 代表了本地绑定的名称，value 为其 key (字符串或 Symbol) 以在可用的注入中搜索。
  function initInjections (vm) {
    // 解析inject，结果为result
    var result = resolveInject(vm.$options.inject, vm);
    // 如果结果存在 对传入的数据做响应化处理
    if (result) {
      // 不可以添加到观察者模式
      toggleObserving(false);
      // 遍历
      Object.keys(result).forEach(function (key) {
        /* istanbul ignore else */
        // 忽略
        {
          defineReactive(vm, key, result[key], function () {
            warn(
              "Avoid mutating an injected value directly since the changes will be " +
              "overwritten whenever the provided component re-renders. " +
              "injection being mutated: \"" + key + "\"",
              vm
            );
          });
        }
      });
      // 可以添加到观察者模式
      toggleObserving(true);
    }
  }
  // ，遍历 key 数组，通过向上冒泡来
  // 如果有，则将这个数据传递给 result；如果没有，检查 inject 是否有 default 选项设定默认值或者默认方法，如果有则将默认值返传给 result，最终返回 result 对象。
  // 所以，inject 的写法应该是有 default 默认值的：



  function resolveInject (inject, vm) {
    if (inject) {
      // inject is :any because flow is not smart enough to figure out cached
      // inject是:any，因为flow不够智能，无法计算缓存
      // 创建空对象
      var result = Object.create(null);
      // 如果支持hasSymbol
      // 获取inject选项的key数组
      var keys = hasSymbol
        ? Reflect.ownKeys(inject)
        : Object.keys(inject); //不支持就用 Object.keys

      // 遍历key数组
      for (var i = 0; i < keys.length; i++) {
        // 获取每个key
        var key = keys[i];
        // #6574 in case the inject object is observed...
        // 如果观察到inject的属性已经是响应式 继续下一次循环
        if (key === '__ob__') { continue }
        // 查找provide中是否有key与inject的from属性同名的，
        var provideKey = inject[key].from;
        
        var source = vm;
       
        while (source) {
          // 判断_provided 是否存在 并且是对象的时候，并且provide中有key与inject的from属性同名的，
          if (source._provided && hasOwn(source._provided, provideKey)) {
            // 将数据给result存起来
            result[key] = source._provided[provideKey];
            break
          }
          // 递归循环父节点
          source = source.$parent;
        }
        // 如果vm 不存在
        if (!source) {
          // 判断是否有default key
          // 是否有default选项设定默认值或者默认方法
          if ('default' in inject[key]) {
            // 存在就获取这个default key的值
            var provideDefault = inject[key].default;
            // 如果这个值是函数，执行
            result[key] = typeof provideDefault === 'function'
              ? provideDefault.call(vm)
              : provideDefault;
          } else {
            warn(("Injection \"" + key + "\" not found"), vm);
          }
        }
      }
      // 最后返回result
      return result
    }
  }

  /*  */



  /**
   * Runtime helper for resolving raw children VNodes into a slot object.
   */
  function resolveSlots (
    children,
    context
  ) {
    if (!children || !children.length) {
      return {}
    }
    var slots = {};
    for (var i = 0, l = children.length; i < l; i++) {
      var child = children[i];
      var data = child.data;
      // remove slot attribute if the node is resolved as a Vue slot node
      if (data && data.attrs && data.attrs.slot) {
        delete data.attrs.slot;
      }
      // named slots should only be respected if the vnode was rendered in the
      // same context.
      if ((child.context === context || child.fnContext === context) &&
        data && data.slot != null
      ) {
        var name = data.slot;
        var slot = (slots[name] || (slots[name] = []));
        if (child.tag === 'template') {
          slot.push.apply(slot, child.children || []);
        } else {
          slot.push(child);
        }
      } else {
        (slots.default || (slots.default = [])).push(child);
      }
    }
    // ignore slots that contains only whitespace
    for (var name$1 in slots) {
      if (slots[name$1].every(isWhitespace)) {
        delete slots[name$1];
      }
    }
    return slots
  }

  function isWhitespace (node) {
    return (node.isComment && !node.asyncFactory) || node.text === ' '
  }

  /*  */

  function normalizeScopedSlots (
    slots,
    normalSlots,
    prevSlots
  ) {
    var res;
    var isStable = slots ? !!slots.$stable : true;
    var hasNormalSlots = Object.keys(normalSlots).length > 0;
    var key = slots && slots.$key;
    if (!slots) {
      res = {};
    } else if (slots._normalized) {
      // fast path 1: child component re-render only, parent did not change
      return slots._normalized
    } else if (
      isStable &&
      prevSlots &&
      prevSlots !== emptyObject &&
      key === prevSlots.$key &&
      !hasNormalSlots &&
      !prevSlots.$hasNormal
    ) {
      // fast path 2: stable scoped slots w/ no normal slots to proxy,
      // only need to normalize once
      return prevSlots
    } else {
      res = {};
      for (var key$1 in slots) {
        if (slots[key$1] && key$1[0] !== '$') {
          res[key$1] = normalizeScopedSlot(normalSlots, key$1, slots[key$1]);
        }
      }
    }
    // expose normal slots on scopedSlots
    for (var key$2 in normalSlots) {
      if (!(key$2 in res)) {
        res[key$2] = proxyNormalSlot(normalSlots, key$2);
      }
    }
    // avoriaz seems to mock a non-extensible $scopedSlots object
    // and when that is passed down this would cause an error
    if (slots && Object.isExtensible(slots)) {
      (slots)._normalized = res;
    }
    def(res, '$stable', isStable);
    def(res, '$key', key);
    def(res, '$hasNormal', hasNormalSlots);
    return res
  }

  function normalizeScopedSlot(normalSlots, key, fn) {
    var normalized = function () {
      var res = arguments.length ? fn.apply(null, arguments) : fn({});
      res = res && typeof res === 'object' && !Array.isArray(res)
        ? [res] // single vnode
        : normalizeChildren(res);
      return res && (
        res.length === 0 ||
        (res.length === 1 && res[0].isComment) // #9658
      ) ? undefined
        : res
    };
    // this is a slot using the new v-slot syntax without scope. although it is
    // compiled as a scoped slot, render fn users would expect it to be present
    // on this.$slots because the usage is semantically a normal slot.
    if (fn.proxy) {
      Object.defineProperty(normalSlots, key, {
        get: normalized,
        enumerable: true,
        configurable: true
      });
    }
    return normalized
  }

  function proxyNormalSlot(slots, key) {
    return function () { return slots[key]; }
  }

  /*  */

  /**
   * Runtime helper for rendering v-for lists.
   */
  function renderList (
    val,
    render
  ) {
    var ret, i, l, keys, key;
    if (Array.isArray(val) || typeof val === 'string') {
      ret = new Array(val.length);
      for (i = 0, l = val.length; i < l; i++) {
        ret[i] = render(val[i], i);
      }
    } else if (typeof val === 'number') {
      ret = new Array(val);
      for (i = 0; i < val; i++) {
        ret[i] = render(i + 1, i);
      }
    } else if (isObject(val)) {
      if (hasSymbol && val[Symbol.iterator]) {
        ret = [];
        var iterator = val[Symbol.iterator]();
        var result = iterator.next();
        while (!result.done) {
          ret.push(render(result.value, ret.length));
          result = iterator.next();
        }
      } else {
        keys = Object.keys(val);
        ret = new Array(keys.length);
        for (i = 0, l = keys.length; i < l; i++) {
          key = keys[i];
          ret[i] = render(val[key], key, i);
        }
      }
    }
    if (!isDef(ret)) {
      ret = [];
    }
    (ret)._isVList = true;
    return ret
  }

  /*  */

  /**
   * Runtime helper for rendering <slot>
   */
  function renderSlot (
    name,
    fallback,
    props,
    bindObject
  ) {
    var scopedSlotFn = this.$scopedSlots[name];
    var nodes;
    if (scopedSlotFn) { // scoped slot
      props = props || {};
      if (bindObject) {
        if ( !isObject(bindObject)) {
          warn(
            'slot v-bind without argument expects an Object',
            this
          );
        }
        props = extend(extend({}, bindObject), props);
      }
      nodes = scopedSlotFn(props) || fallback;
    } else {
      nodes = this.$slots[name] || fallback;
    }

    var target = props && props.slot;
    if (target) {
      return this.$createElement('template', { slot: target }, nodes)
    } else {
      return nodes
    }
  }

  /*  */

  /**
   * Runtime helper for resolving filters
   */
  function resolveFilter (id) {
    return resolveAsset(this.$options, 'filters', id, true) || identity
  }

  /*  */

  function isKeyNotMatch (expect, actual) {
    if (Array.isArray(expect)) {
      return expect.indexOf(actual) === -1
    } else {
      return expect !== actual
    }
  }

  /**
   * Runtime helper for checking keyCodes from config.
   * exposed as Vue.prototype._k
   * passing in eventKeyName as last argument separately for backwards compat
   */
  function checkKeyCodes (
    eventKeyCode,
    key,
    builtInKeyCode,
    eventKeyName,
    builtInKeyName
  ) {
    var mappedKeyCode = config.keyCodes[key] || builtInKeyCode;
    if (builtInKeyName && eventKeyName && !config.keyCodes[key]) {
      return isKeyNotMatch(builtInKeyName, eventKeyName)
    } else if (mappedKeyCode) {
      return isKeyNotMatch(mappedKeyCode, eventKeyCode)
    } else if (eventKeyName) {
      return hyphenate(eventKeyName) !== key
    }
  }

  /*  */

  /**
   * Runtime helper for merging v-bind="object" into a VNode's data.
   */
  function bindObjectProps (
    data,
    tag,
    value,
    asProp,
    isSync
  ) {
    if (value) {
      if (!isObject(value)) {
         warn(
          'v-bind without argument expects an Object or Array value',
          this
        );
      } else {
        if (Array.isArray(value)) {
          value = toObject(value);
        }
        var hash;
        var loop = function ( key ) {
          if (
            key === 'class' ||
            key === 'style' ||
            isReservedAttribute(key)
          ) {
            hash = data;
          } else {
            var type = data.attrs && data.attrs.type;
            hash = asProp || config.mustUseProp(tag, type, key)
              ? data.domProps || (data.domProps = {})
              : data.attrs || (data.attrs = {});
          }
          var camelizedKey = camelize(key);
          var hyphenatedKey = hyphenate(key);
          if (!(camelizedKey in hash) && !(hyphenatedKey in hash)) {
            hash[key] = value[key];

            if (isSync) {
              var on = data.on || (data.on = {});
              on[("update:" + key)] = function ($event) {
                value[key] = $event;
              };
            }
          }
        };

        for (var key in value) loop( key );
      }
    }
    return data
  }

  /*  */

  /**
   * Runtime helper for rendering static trees.
   */
  function renderStatic (
    index,
    isInFor
  ) {
    var cached = this._staticTrees || (this._staticTrees = []);
    var tree = cached[index];
    // if has already-rendered static tree and not inside v-for,
    // we can reuse the same tree.
    if (tree && !isInFor) {
      return tree
    }
    // otherwise, render a fresh tree.
    tree = cached[index] = this.$options.staticRenderFns[index].call(
      this._renderProxy,
      null,
      this // for render fns generated for functional component templates
    );
    markStatic(tree, ("__static__" + index), false);
    return tree
  }

  /**
   * Runtime helper for v-once.
   * Effectively it means marking the node as static with a unique key.
   */
  function markOnce (
    tree,
    index,
    key
  ) {
    markStatic(tree, ("__once__" + index + (key ? ("_" + key) : "")), true);
    return tree
  }

  function markStatic (
    tree,
    key,
    isOnce
  ) {
    if (Array.isArray(tree)) {
      for (var i = 0; i < tree.length; i++) {
        if (tree[i] && typeof tree[i] !== 'string') {
          markStaticNode(tree[i], (key + "_" + i), isOnce);
        }
      }
    } else {
      markStaticNode(tree, key, isOnce);
    }
  }

  function markStaticNode (node, key, isOnce) {
    node.isStatic = true;
    node.key = key;
    node.isOnce = isOnce;
  }

  /*  */

  function bindObjectListeners (data, value) {
    if (value) {
      if (!isPlainObject(value)) {
         warn(
          'v-on without argument expects an Object value',
          this
        );
      } else {
        var on = data.on = data.on ? extend({}, data.on) : {};
        for (var key in value) {
          var existing = on[key];
          var ours = value[key];
          on[key] = existing ? [].concat(existing, ours) : ours;
        }
      }
    }
    return data
  }

  /*  */

  function resolveScopedSlots (
    fns, // see flow/vnode
    res,
    // the following are added in 2.6
    hasDynamicKeys,
    contentHashKey
  ) {
    res = res || { $stable: !hasDynamicKeys };
    for (var i = 0; i < fns.length; i++) {
      var slot = fns[i];
      if (Array.isArray(slot)) {
        resolveScopedSlots(slot, res, hasDynamicKeys);
      } else if (slot) {
        // marker for reverse proxying v-slot without scope on this.$slots
        if (slot.proxy) {
          slot.fn.proxy = true;
        }
        res[slot.key] = slot.fn;
      }
    }
    if (contentHashKey) {
      (res).$key = contentHashKey;
    }
    return res
  }

  /*  */

  function bindDynamicKeys (baseObj, values) {
    for (var i = 0; i < values.length; i += 2) {
      var key = values[i];
      if (typeof key === 'string' && key) {
        baseObj[values[i]] = values[i + 1];
      } else if ( key !== '' && key !== null) {
        // null is a speical value for explicitly removing a binding
        warn(
          ("Invalid value for dynamic directive argument (expected string or null): " + key),
          this
        );
      }
    }
    return baseObj
  }

  // helper to dynamically append modifier runtime markers to event names.
  // ensure only append when value is already string, otherwise it will be cast
  // to string and cause the type check to miss.
  function prependModifier (value, symbol) {
    return typeof value === 'string' ? symbol + value : value
  }

  /*  */

  function installRenderHelpers (target) {
    target._o = markOnce;
    target._n = toNumber;
    target._s = toString;
    target._l = renderList;
    target._t = renderSlot;
    target._q = looseEqual;
    target._i = looseIndexOf;
    target._m = renderStatic;
    target._f = resolveFilter;
    target._k = checkKeyCodes;
    target._b = bindObjectProps;
    target._v = createTextVNode;
    target._e = createEmptyVNode;
    target._u = resolveScopedSlots;
    target._g = bindObjectListeners;
    target._d = bindDynamicKeys;
    target._p = prependModifier;
  }

  /*  */

  function FunctionalRenderContext (
    data,
    props,
    children,
    parent,
    Ctor
  ) {
    var this$1 = this;

    var options = Ctor.options;
    // ensure the createElement function in functional components
    // gets a unique context - this is necessary for correct named slot check
    var contextVm;
    if (hasOwn(parent, '_uid')) {
      contextVm = Object.create(parent);
      // $flow-disable-line
      contextVm._original = parent;
    } else {
      // the context vm passed in is a functional context as well.
      // in this case we want to make sure we are able to get a hold to the
      // real context instance.
      contextVm = parent;
      // $flow-disable-line
      parent = parent._original;
    }
    var isCompiled = isTrue(options._compiled);
    var needNormalization = !isCompiled;

    this.data = data;
    this.props = props;
    this.children = children;
    this.parent = parent;
    this.listeners = data.on || emptyObject;
    this.injections = resolveInject(options.inject, parent);
    this.slots = function () {
      if (!this$1.$slots) {
        normalizeScopedSlots(
          data.scopedSlots,
          this$1.$slots = resolveSlots(children, parent)
        );
      }
      return this$1.$slots
    };

    Object.defineProperty(this, 'scopedSlots', ({
      enumerable: true,
      get: function get () {
        return normalizeScopedSlots(data.scopedSlots, this.slots())
      }
    }));

    // support for compiled functional template
    if (isCompiled) {
      // exposing $options for renderStatic()
      this.$options = options;
      // pre-resolve slots for renderSlot()
      this.$slots = this.slots();
      this.$scopedSlots = normalizeScopedSlots(data.scopedSlots, this.$slots);
    }

    if (options._scopeId) {
      this._c = function (a, b, c, d) {
        var vnode = createElement(contextVm, a, b, c, d, needNormalization);
        if (vnode && !Array.isArray(vnode)) {
          vnode.fnScopeId = options._scopeId;
          vnode.fnContext = parent;
        }
        return vnode
      };
    } else {
      this._c = function (a, b, c, d) { return createElement(contextVm, a, b, c, d, needNormalization); };
    }
  }

  installRenderHelpers(FunctionalRenderContext.prototype);

  function createFunctionalComponent (
    Ctor,
    propsData,
    data,
    contextVm,
    children
  ) {
    var options = Ctor.options;
    var props = {};
    var propOptions = options.props;
    if (isDef(propOptions)) {
      for (var key in propOptions) {
        props[key] = validateProp(key, propOptions, propsData || emptyObject);
      }
    } else {
      if (isDef(data.attrs)) { mergeProps(props, data.attrs); }
      if (isDef(data.props)) { mergeProps(props, data.props); }
    }

    var renderContext = new FunctionalRenderContext(
      data,
      props,
      children,
      contextVm,
      Ctor
    );

    var vnode = options.render.call(null, renderContext._c, renderContext);

    if (vnode instanceof VNode) {
      return cloneAndMarkFunctionalResult(vnode, data, renderContext.parent, options, renderContext)
    } else if (Array.isArray(vnode)) {
      var vnodes = normalizeChildren(vnode) || [];
      var res = new Array(vnodes.length);
      for (var i = 0; i < vnodes.length; i++) {
        res[i] = cloneAndMarkFunctionalResult(vnodes[i], data, renderContext.parent, options, renderContext);
      }
      return res
    }
  }

  function cloneAndMarkFunctionalResult (vnode, data, contextVm, options, renderContext) {
    // #7817 clone node before setting fnContext, otherwise if the node is reused
    // (e.g. it was from a cached normal slot) the fnContext causes named slots
    // that should not be matched to match.
    var clone = cloneVNode(vnode);
    clone.fnContext = contextVm;
    clone.fnOptions = options;
    {
      (clone.devtoolsMeta = clone.devtoolsMeta || {}).renderContext = renderContext;
    }
    if (data.slot) {
      (clone.data || (clone.data = {})).slot = data.slot;
    }
    return clone
  }

  function mergeProps (to, from) {
    for (var key in from) {
      to[camelize(key)] = from[key];
    }
  }

  /*  */

  // inline hooks to be invoked on component VNodes during patch
  var componentVNodeHooks = {
    init: function init (vnode, hydrating) {
      if (
        vnode.componentInstance &&
        !vnode.componentInstance._isDestroyed &&
        vnode.data.keepAlive
      ) {
        // kept-alive components, treat as a patch
        var mountedNode = vnode; // work around flow
        componentVNodeHooks.prepatch(mountedNode, mountedNode);
      } else {
        var child = vnode.componentInstance = createComponentInstanceForVnode(
          vnode,
          activeInstance
        );
        child.$mount(hydrating ? vnode.elm : undefined, hydrating);
      }
    },

    prepatch: function prepatch (oldVnode, vnode) {
      var options = vnode.componentOptions;
      var child = vnode.componentInstance = oldVnode.componentInstance;
      updateChildComponent(
        child,
        options.propsData, // updated props
        options.listeners, // updated listeners
        vnode, // new parent vnode
        options.children // new children
      );
    },

    insert: function insert (vnode) {
      var context = vnode.context;
      var componentInstance = vnode.componentInstance;
      if (!componentInstance._isMounted) {
        componentInstance._isMounted = true;
        callHook(componentInstance, 'mounted');
      }
      if (vnode.data.keepAlive) {
        if (context._isMounted) {
          // vue-router#1212
          // During updates, a kept-alive component's child components may
          // change, so directly walking the tree here may call activated hooks
          // on incorrect children. Instead we push them into a queue which will
          // be processed after the whole patch process ended.
          queueActivatedComponent(componentInstance);
        } else {
          activateChildComponent(componentInstance, true /* direct */);
        }
      }
    },

    destroy: function destroy (vnode) {
      var componentInstance = vnode.componentInstance;
      if (!componentInstance._isDestroyed) {
        if (!vnode.data.keepAlive) {
          componentInstance.$destroy();
        } else {
          deactivateChildComponent(componentInstance, true /* direct */);
        }
      }
    }
  };

  var hooksToMerge = Object.keys(componentVNodeHooks);

  function createComponent (
    Ctor,
    data,
    context,
    children,
    tag
  ) {
    if (isUndef(Ctor)) {
      return
    }

    var baseCtor = context.$options._base;

    // plain options object: turn it into a constructor
    if (isObject(Ctor)) {
      Ctor = baseCtor.extend(Ctor);
    }

    // if at this stage it's not a constructor or an async component factory,
    // reject.
    if (typeof Ctor !== 'function') {
      {
        warn(("Invalid Component definition: " + (String(Ctor))), context);
      }
      return
    }

    // async component
    var asyncFactory;
    if (isUndef(Ctor.cid)) {
      asyncFactory = Ctor;
      Ctor = resolveAsyncComponent(asyncFactory, baseCtor);
      if (Ctor === undefined) {
        // return a placeholder node for async component, which is rendered
        // as a comment node but preserves all the raw information for the node.
        // the information will be used for async server-rendering and hydration.
        return createAsyncPlaceholder(
          asyncFactory,
          data,
          context,
          children,
          tag
        )
      }
    }

    data = data || {};

    // resolve constructor options in case global mixins are applied after
    // component constructor creation
    resolveConstructorOptions(Ctor);

    // transform component v-model data into props & events
    if (isDef(data.model)) {
      transformModel(Ctor.options, data);
    }

    // extract props
    var propsData = extractPropsFromVNodeData(data, Ctor, tag);

    // functional component
    if (isTrue(Ctor.options.functional)) {
      return createFunctionalComponent(Ctor, propsData, data, context, children)
    }

    // extract listeners, since these needs to be treated as
    // child component listeners instead of DOM listeners
    var listeners = data.on;
    // replace with listeners with .native modifier
    // so it gets processed during parent component patch.
    data.on = data.nativeOn;

    if (isTrue(Ctor.options.abstract)) {
      // abstract components do not keep anything
      // other than props & listeners & slot

      // work around flow
      var slot = data.slot;
      data = {};
      if (slot) {
        data.slot = slot;
      }
    }

    // install component management hooks onto the placeholder node
    installComponentHooks(data);

    // return a placeholder vnode
    var name = Ctor.options.name || tag;
    var vnode = new VNode(
      ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
      data, undefined, undefined, undefined, context,
      { Ctor: Ctor, propsData: propsData, listeners: listeners, tag: tag, children: children },
      asyncFactory
    );

    return vnode
  }

  function createComponentInstanceForVnode (
    vnode, // we know it's MountedComponentVNode but flow doesn't
    parent // activeInstance in lifecycle state
  ) {
    var options = {
      _isComponent: true,
      _parentVnode: vnode,
      parent: parent
    };
    // check inline-template render functions
    var inlineTemplate = vnode.data.inlineTemplate;
    if (isDef(inlineTemplate)) {
      options.render = inlineTemplate.render;
      options.staticRenderFns = inlineTemplate.staticRenderFns;
    }
    return new vnode.componentOptions.Ctor(options)
  }

  function installComponentHooks (data) {
    var hooks = data.hook || (data.hook = {});
    for (var i = 0; i < hooksToMerge.length; i++) {
      var key = hooksToMerge[i];
      var existing = hooks[key];
      var toMerge = componentVNodeHooks[key];
      if (existing !== toMerge && !(existing && existing._merged)) {
        hooks[key] = existing ? mergeHook$1(toMerge, existing) : toMerge;
      }
    }
  }

  function mergeHook$1 (f1, f2) {
    var merged = function (a, b) {
      // flow complains about extra args which is why we use any
      f1(a, b);
      f2(a, b);
    };
    merged._merged = true;
    return merged
  }

  // transform component v-model info (value and callback) into
  // prop and event handler respectively.
  function transformModel (options, data) {
    var prop = (options.model && options.model.prop) || 'value';
    var event = (options.model && options.model.event) || 'input'
    ;(data.attrs || (data.attrs = {}))[prop] = data.model.value;
    var on = data.on || (data.on = {});
    var existing = on[event];
    var callback = data.model.callback;
    if (isDef(existing)) {
      if (
        Array.isArray(existing)
          ? existing.indexOf(callback) === -1
          : existing !== callback
      ) {
        on[event] = [callback].concat(existing);
      }
    } else {
      on[event] = callback;
    }
  }

  /*  */

  var SIMPLE_NORMALIZE = 1;
  var ALWAYS_NORMALIZE = 2;

  // wrapper function for providing a more flexible interface
  // without getting yelled at by flow
  function createElement (
    context,
    tag,
    data,
    children,
    normalizationType,
    alwaysNormalize
  ) {
    // isPrimitive在../util/index引入 :todo
    if (Array.isArray(data) || isPrimitive(data)) {
      normalizationType = children;
      children = data;
      data = undefined;
    }
    if (isTrue(alwaysNormalize)) {
      normalizationType = ALWAYS_NORMALIZE;
    }
    return _createElement(context, tag, data, children, normalizationType)
  }

  function _createElement (
    context,
    tag,
    data,
    children,
    normalizationType
  ) {
    if (isDef(data) && isDef((data).__ob__)) {
       warn(
        "Avoid using observed data object as vnode data: " + (JSON.stringify(data)) + "\n" +
        'Always create fresh vnode data objects in each render!',
        context
      );
      return createEmptyVNode()
    }
    // object syntax in v-bind
    if (isDef(data) && isDef(data.is)) {
      tag = data.is;
    }
    if (!tag) {
      // in case of component :is set to falsy value
      return createEmptyVNode()
    }
    // warn against non-primitive key
    if (
      isDef(data) && isDef(data.key) && !isPrimitive(data.key)
    ) {
      {
        warn(
          'Avoid using non-primitive value as key, ' +
          'use string/number value instead.',
          context
        );
      }
    }
    // support single function children as default scoped slot
    if (Array.isArray(children) &&
      typeof children[0] === 'function'
    ) {
      data = data || {};
      data.scopedSlots = { default: children[0] };
      children.length = 0;
    }
    if (normalizationType === ALWAYS_NORMALIZE) {
      children = normalizeChildren(children);
    } else if (normalizationType === SIMPLE_NORMALIZE) {
      children = simpleNormalizeChildren(children);
    }
    var vnode, ns;
    if (typeof tag === 'string') {
      var Ctor;
      ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag);
      if (config.isReservedTag(tag)) {
        // platform built-in elements
        vnode = new VNode(
          config.parsePlatformTagName(tag), data, children,
          undefined, undefined, context
        );
      } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
        // component
        vnode = createComponent(Ctor, data, context, children, tag);
      } else {
        // unknown or unlisted namespaced elements
        // check at runtime because it may get assigned a namespace when its
        // parent normalizes children
        vnode = new VNode(
          tag, data, children,
          undefined, undefined, context
        );
      }
    } else {
      // direct component options / constructor
      vnode = createComponent(tag, data, context, children);
    }
    if (Array.isArray(vnode)) {
      return vnode
    } else if (isDef(vnode)) {
      if (isDef(ns)) { applyNS(vnode, ns); }
      if (isDef(data)) { registerDeepBindings(data); }
      return vnode
    } else {
      return createEmptyVNode()
    }
  }

  function applyNS (vnode, ns, force) {
    vnode.ns = ns;
    if (vnode.tag === 'foreignObject') {
      // use default namespace inside foreignObject
      ns = undefined;
      force = true;
    }
    if (isDef(vnode.children)) {
      for (var i = 0, l = vnode.children.length; i < l; i++) {
        var child = vnode.children[i];
        if (isDef(child.tag) && (
          isUndef(child.ns) || (isTrue(force) && child.tag !== 'svg'))) {
          applyNS(child, ns, force);
        }
      }
    }
  }

  // ref #5318
  // necessary to ensure parent re-render when deep bindings like :style and
  // :class are used on slot nodes
  function registerDeepBindings (data) {
    if (isObject(data.style)) {
      traverse(data.style);
    }
    if (isObject(data.class)) {
      traverse(data.class);
    }
  }

  /*  */

  // 初始化渲染 _c $createElement 和$attrs listeners的响应化
  function initRender (vm) {
    // 子树的根
    vm._vnode = null; // the root of the child tree
    // v-once 上缓存的树
    vm._staticTrees = null; // v-once cached trees
    // 选项
    var options = vm.$options;
    // 虚拟DOM
    var parentVnode = vm.$vnode = options._parentVnode; // the placeholder node in parent tree
    // 上下文
    var renderContext = parentVnode && parentVnode.context;
    // 插槽信息 resolveSlots:todo
    vm.$slots = resolveSlots(options._renderChildren, renderContext);
    // 作用域插槽
    vm.$scopedSlots = emptyObject;
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
    vm._c = function (a, b, c, d) { return createElement(vm, a, b, c, d, false); };
    // normalization is always applied for the public version, used in
    // user-written render functions.
    // 用户编写的渲染函数
    // $createElement h函数 也就是在initRender中声明
    // 自己写的render中的h
    vm.$createElement = function (a, b, c, d) { return createElement(vm, a, b, c, d, true); };

    // $attrs & $listeners are exposed for easier HOC creation.
    // $attrs和$listeners要被公开，以便更容易地进行临时创建
    // they need to be reactive so that HOCs using them are always updated
    // 他们是要被响应式的，以便使用它们的HOCs时总是能响应式更新

    // 获取父节点 
    var parentData = parentVnode && parentVnode.data;

    /* istanbul ignore else */
    // 忽略
    {
      defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, function () {
        !isUpdatingChildComponent && warn("$attrs is readonly.", vm);
      }, true);
      defineReactive(vm, '$listeners', options._parentListeners || emptyObject, function () {
        !isUpdatingChildComponent && warn("$listeners is readonly.", vm);
      }, true);
    }
  }

  var currentRenderingInstance = null;
  // $nextTick _render
  function renderMixin (Vue) {
    // install runtime convenience helpers
    // 安装运行时助手
    installRenderHelpers(Vue.prototype);
    // $nextTick :todo 涉及到timerFunc 从Promise选择到Settimeout 涉及宏、微任务 
    Vue.prototype.$nextTick = function (fn) {
      return nextTick(fn, this)
    };
    // _render  获取自己写的render 
    Vue.prototype._render = function () {
      // vue实例
      var vm = this;
      // 拿到render和父节点
      var ref = vm.$options;
      var render = ref.render;
      var _parentVnode = ref._parentVnode;

      // 如果父节点存在
      if (_parentVnode) {
        // 获取作用域插槽
        vm.$scopedSlots = normalizeScopedSlots(
          _parentVnode.data.scopedSlots,
          vm.$slots,
          vm.$scopedSlots
        );
      }

      // set parent vnode. this allows render functions to have access
      // 设置父vnode,这允许渲染函数访问
      // to the data on the placeholder node.
      // 占位符节点上的数据。
      // 把父vnode赋给$vnode
      vm.$vnode = _parentVnode;
      // render self
      // 渲染自己
      var vnode;
      try {
        // There's no need to maintain a stack becaues all render fns are called
        // separately from one another. Nested component's render fns are called
        // when parent component is patched.
        // 不需要维护堆栈，因为所有渲染fn都是彼此独立调用的。
        // 当修补父组件时，将调用嵌套组件的render fn。
        currentRenderingInstance = vm;
        // render调用一次返回vdom
        vnode = render.call(vm._renderProxy, vm.$createElement);
      } catch (e) {
        // 收集错误 抛出错误
        handleError(e, vm, "render");
        // return error render result,
        // or previous vnode to prevent render error causing blank component
        /* istanbul ignore else */
        if ( vm.$options.renderError) {
          try {
            vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e);
          } catch (e) {
            handleError(e, vm, "renderError");
            vnode = vm._vnode;
          }
        } else {
          vnode = vm._vnode;
        }
      } finally {
        currentRenderingInstance = null;
      }
      // if the returned array contains only a single node, allow it
      // 如果返回的vdom是数组并且长度为一，则允许他
      if (Array.isArray(vnode) && vnode.length === 1) {
        vnode = vnode[0];
      }
      // return empty vnode in case the render function errored out
      // 如果render函数出错，则返回空的vnode
      if (!(vnode instanceof VNode)) {
        if ( Array.isArray(vnode)) {
          warn(
            'Multiple root nodes returned from render function. Render function ' +
            'should return a single root node.',
            vm
          );
        }
        // 创建一个空vnode 
        vnode = createEmptyVNode();
      }
      // set parent
      // 设置父vnode
      vnode.parent = _parentVnode;
      // 返回vdom
      return vnode
    };
  }

  /*  */

  function ensureCtor (comp, base) {
    if (
      comp.__esModule ||
      (hasSymbol && comp[Symbol.toStringTag] === 'Module')
    ) {
      comp = comp.default;
    }
    return isObject(comp)
      ? base.extend(comp)
      : comp
  }

  function createAsyncPlaceholder (
    factory,
    data,
    context,
    children,
    tag
  ) {
    var node = createEmptyVNode();
    node.asyncFactory = factory;
    node.asyncMeta = { data: data, context: context, children: children, tag: tag };
    return node
  }

  function resolveAsyncComponent (
    factory,
    baseCtor
  ) {
    if (isTrue(factory.error) && isDef(factory.errorComp)) {
      return factory.errorComp
    }

    if (isDef(factory.resolved)) {
      return factory.resolved
    }

    var owner = currentRenderingInstance;
    if (owner && isDef(factory.owners) && factory.owners.indexOf(owner) === -1) {
      // already pending
      factory.owners.push(owner);
    }

    if (isTrue(factory.loading) && isDef(factory.loadingComp)) {
      return factory.loadingComp
    }

    if (owner && !isDef(factory.owners)) {
      var owners = factory.owners = [owner];
      var sync = true

      ;(owner).$on('hook:destroyed', function () { return remove(owners, owner); });

      var forceRender = function (renderCompleted) {
        for (var i = 0, l = owners.length; i < l; i++) {
          (owners[i]).$forceUpdate();
        }

        if (renderCompleted) {
          owners.length = 0;
        }
      };

      var resolve = once(function (res) {
        // cache resolved
        factory.resolved = ensureCtor(res, baseCtor);
        // invoke callbacks only if this is not a synchronous resolve
        // (async resolves are shimmed as synchronous during SSR)
        if (!sync) {
          forceRender(true);
        } else {
          owners.length = 0;
        }
      });

      var reject = once(function (reason) {
         warn(
          "Failed to resolve async component: " + (String(factory)) +
          (reason ? ("\nReason: " + reason) : '')
        );
        if (isDef(factory.errorComp)) {
          factory.error = true;
          forceRender(true);
        }
      });

      var res = factory(resolve, reject);

      if (isObject(res)) {
        if (isPromise(res)) {
          // () => Promise
          if (isUndef(factory.resolved)) {
            res.then(resolve, reject);
          }
        } else if (isPromise(res.component)) {
          res.component.then(resolve, reject);

          if (isDef(res.error)) {
            factory.errorComp = ensureCtor(res.error, baseCtor);
          }

          if (isDef(res.loading)) {
            factory.loadingComp = ensureCtor(res.loading, baseCtor);
            if (res.delay === 0) {
              factory.loading = true;
            } else {
              setTimeout(function () {
                if (isUndef(factory.resolved) && isUndef(factory.error)) {
                  factory.loading = true;
                  forceRender(false);
                }
              }, res.delay || 200);
            }
          }

          if (isDef(res.timeout)) {
            setTimeout(function () {
              if (isUndef(factory.resolved)) {
                reject(
                   ("timeout (" + (res.timeout) + "ms)")
                    
                );
              }
            }, res.timeout);
          }
        }
      }

      sync = false;
      // return in case resolved synchronously
      return factory.loading
        ? factory.loadingComp
        : factory.resolved
    }
  }

  /*  */

  function isAsyncPlaceholder (node) {
    return node.isComment && node.asyncFactory
  }

  /*  */

  function getFirstComponentChild (children) {
    if (Array.isArray(children)) {
      for (var i = 0; i < children.length; i++) {
        var c = children[i];
        if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
          return c
        }
      }
    }
  }

  /*  */

  // 初始化事件
  function initEvents (vm) {
    // 初始化_events事件队列
    vm._events = Object.create(null);
    // 初始化判断是否有生命周期钩子函数
    vm._hasHookEvent = false;
    // init parent attached events 初始化父亲事件 
    var listeners = vm.$options._parentListeners; // 旧的事件
    // 如果有旧的事件
    if (listeners) {
      // 组件初始化事件监听器 更新组件事件
      updateComponentListeners(vm, listeners);
    }
  }

  var target;
  // target.$on的代理 添加事件  用来updateListeners:todo
  function add (
    event, //事件名
    fn //函数
    ) {
    target.$on(event, fn);
  }
  // target.$off 解绑事件  用来updateListeners:todo
  function remove$1 (
    event, // 事件名
    fn // 函数
    ) {
    target.$off(event, fn);
  }
  // 返回一个直接调用函数的方法，调用完就删除事件，用来updateListeners:todo
  function createOnceHandler (
    event,  // 事件名
    fn //函数
    ) {
    // 获取target
    var _target = target;
    // 返回onceHandler
    return function onceHandler () {
      // 执行fn
      var res = fn.apply(null, arguments);
      // 如果res不为空
      if (res !== null) {
        // 解绑事件，用完就删，提上裤子就是硬气
        _target.$off(event, onceHandler);
      }
    }
  }
  // 更新组件事件 在initEvents中会调用 在updateChildComponent中会调用
  function updateComponentListeners (
    vm, //虚拟dom 实例
    listeners,  //新的事件队列
    oldListeners //旧事件队列
  ) {
    target = vm;
    // 为listeners增加事件 为oldListeners删除事件
    updateListeners(listeners, oldListeners || {}, add, remove$1, createOnceHandler, vm);
    target = undefined;
  }
  // 在eventsMixin中实现这四个方法  $on $once $emit $off
  function eventsMixin (Vue) {
    // 开头为hook的字符串
    var hookRE = /^hook:/;
    // $on : 添加绑定事件
    Vue.prototype.$on = function (
      event,  //事件名
      fn  //函数
      ) { //返回组件类型
        // 获取当前Vue实例
      var vm = this;
      // 如果事件是数组
      if (Array.isArray(event)) {
        // 递归绑定事件
        for (var i = 0, l = event.length; i < l; i++) {
          vm.$on(event[i], fn);
        }
      } else {
        // 如果不是数组
        // 把所有事件拆分存放到_events 事件队列中
        (vm._events[event] || (vm._events[event] = [])).push(fn);
        // optimize hook:event cost by using a boolean flag marked at registration
        // instead of a hash lookup
        // 如果是hook开头，则这个事件标记为vue声明周期钩子函数
        if (hookRE.test(event)) {
          // 标记为true
          vm._hasHookEvent = true;
        }
      }
      // 返回实例
      return vm
    };
    // $once : 添加一次事件
    Vue.prototype.$once = function (
      event, // 事件
       fn  // 函数
       ) { //返回组件类型
      // 获取当前Vue实例
      var vm = this;

      function on () {
        // 解绑事件 执行一次
        vm.$off(event, on);
        // 执行事件
        fn.apply(vm, arguments);
      }
      // 将fn传入 on中
      on.fn = fn;
      // 将on绑定执行一次，在内部会解绑，也就是执行一次就解绑
      vm.$on(event, on);
      return vm
    };
    // $off : vue把事件添加到一个数组队列里面，通过删除该数组事件队列，而达到解绑事件
    // 移除自定义事件监听器。
    // 如果没有提供参数，则移除所有的事件监听器；

    // 如果只提供了事件，则移除该事件所有的监听器；

    // 如果同时提供了事件与回调，则只移除这个回调的监听器。
    Vue.prototype.$off = function (
      event, // 事件名
      fn // 函数
      ) { // 返回组件类型
        // 获取当前Vue实例
      var vm = this;
      // all 因为两个参数都是可选参数
      // 如果没有参数的情况下 
      if (!arguments.length) {
        // 清空事件队列
        vm._events = Object.create(null);
        // 返回 vm
        return vm
      }
      // array of events 
      // 如果事件是数组
      if (Array.isArray(event)) {
        // 递归解绑
        for (var i$1 = 0, l = event.length; i$1 < l; i$1++) {
          vm.$off(event[i$1], fn);
        }
        return vm
      }
      // specific event
      // 特定事件
      var cbs = vm._events[event];
      // 如果事件不存在
      if (!cbs) {
        // 返回vm
        return vm
      }
      // 如果函数不存在 只传了事件
      if (!fn) {
        // 移除当前事件的监听器
        vm._events[event] = null;
        // 返回vm
        return vm
      }
      // specific handler
      var cb;
      // 获取事件数组长度
      var i = cbs.length;
      // 循环删除事件监听器
      while (i--) {
        cb = cbs[i];
        if (cb === fn || cb.fn === fn) {
          // 清空事件数组
          cbs.splice(i, 1);
          break
        }
      }
      return vm
    };
    // $emit : 触发事件
    Vue.prototype.$emit = function (
      event // 事件名
      ) { // 返回组件类型
      // 获取当前Vue实例
      var vm = this;
      {
        // 获取小写的事件名
        var lowerCaseEvent = event.toLowerCase();
        // 如果小写后不等于之前事件名 并且 不存在在_events事件队列中
        if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
          // 发出警告
          tip(
            "Event \"" + lowerCaseEvent + "\" is emitted in component " +
            (formatComponentName(vm)) + " but the handler is registered for \"" + event + "\". " +
            "Note that HTML attributes are case-insensitive and you cannot use " +
            "v-on to listen to camelCase events when using in-DOM templates. " +
            "You should probably use \"" + (hyphenate(event)) + "\" instead of \"" + event + "\"."
          );
        }
      }
      // 获取事件值
      var cbs = vm._events[event];
      // 如果存在事件值
      if (cbs) {
        // 根据长度 赋给数组和单个 
        cbs = cbs.length > 1 ? toArray(cbs) : cbs;
        // 将参数变为数组 toArray:将类数组转换成真的数组 第一个参数是类数组，第二个是从第几个开始
        var args = toArray(arguments, 1);
        // 模板字符串拼接：event handler for "事件名"
        var info = "event handler for \"" + event + "\"";
        // 循环
        for (var i = 0, l = cbs.length; i < l; i++) {
          // 调用错误处理 错误处理中会有执行 
          invokeWithErrorHandling(cbs[i], vm, args, vm, info);
        }
      }
      return vm
    };
  }

  /*  */

  var activeInstance = null;
  var isUpdatingChildComponent = false;

  // 设置active实例
  function setActiveInstance(vm) {
    // 记录之前的activeInstance
    var prevActiveInstance = activeInstance;
    // 将传入的赋给activeInstance
    activeInstance = vm;
    return function () {
      // 返回之前的
      activeInstance = prevActiveInstance;
    }
  }
  // 这里导出了initLifecycle 初始化生命周期相关的属性 以及为一些属性赋值
  function initLifecycle(vm) {
    // 获取选项
    var options = vm.$options;

    // locate first non-abstract parent
    // 定位第一个"非抽象"的父组件
    // https://cn.vuejs.org/v2/api/#keep-alive 在这里可以看为什么要非抽象
    // <keep-alive> 是一个抽象组件：它自身不会渲染一个 DOM 元素，也不会出现在组件的父组件链中。
    var parent = options.parent;
    // 定位第一个非抽象父组件
    if (parent && !options.abstract) {
      // 判断parent父亲节点是否存在，并且判断是否存在抽象节点
      // 如果父实例parent是抽象组件，则继续找parent上的parent，直到找到非抽象组件为止
      while (parent.$options.abstract && parent.$parent) {
        // 如果有父亲抽象组件，则把父或爷爷节点给当前节点的父亲节点
        parent = parent.$parent;
      }
      // 子节点添加vm
      // 把当前vm实例push到定位的第一个非抽象parent的$children属性上
      parent.$children.push(vm);
    }
    // 初始化一些属性 
    // 这里的parent可以告诉我们，子组件创建时，父组件已经存在了
    // 添加$parent
    vm.$parent = parent;
    // 判断parent是否是root 如果是 则把parent.$root赋给$root
    vm.$root = parent ? parent.$root : vm;
    // 当前实例的直接子组件。需要注意 $children 并不保证顺序，也不是响应式的。
    vm.$children = [];
    // 获取节点的key 一个对象，持有已注册过 ref 的所有子组件。
    vm.$refs = {};
    // 内部属性，不希望被访问的
    vm._watcher = null; //	组件实例相应的 watcher 实例对象
    vm._inactive = null; // 表示keep-alive中组件状态，如被激活，该值为false,反之为true。
    vm._directInactive = false; // 也是表示keep-alive中组件状态的属性。
    vm._isMounted = false; // 当前实例是否完成挂载(对应生命周期图示中的mounted)。
    vm._isDestroyed = false; // 当前实例是否已经被销毁(对应生命周期图示中的destroyed)。
    vm._isBeingDestroyed = false; // 是否已经销毁的组件 如果为true 则不触发 beforeDestroy 钩子函数 和destroyed 钩子函数 当前实例是否正在被销毁,还没有销毁完成(介于生命周期图示中deforeDestroy和destroyed之间)。
  }

  // 初始化 _update $forceUpdate $destroy \src\core\instance\index.js中调用
  function lifecycleMixin(Vue ) {
    // _update : 更新数据 主要功能在于第一次和后面更新是用的不同__patch__，根据preveVnode判断是否有vnode
    Vue.prototype._update = function (vnode, hydrating  ) {
      // 保存Vue实例
      var vm = this;
      // 获取Vue的el
      var prevEl = vm.$el;
      // 获取Vue的vnode 标志上一个vnode
      var prevVnode = vm._vnode;

      var restoreActiveInstance = setActiveInstance(vm);
      vm._vnode = vnode; //标志上一个vnode
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
          false /* removeOnly */ );
      } else {
        // 如果prevVnode存在,表示已经创建过vnode，所以只要更新数据就行了
        // updates 
        // 更新
        vm.$el = vm.__patch__(prevVnode, vnode);
      }
      // vue的实例化对象
      restoreActiveInstance();
      // update __vue__ reference
      // 更新vue参考
      if (prevEl) {
        prevEl.__vue__ = null;
      }
      if (vm.$el) { //更新vue
        vm.$el.__vue__ = vm;
      }
      // if parent is an HOC, update its $el as well
      //如果parent是一个HOC，那么也要更新它的$el
      if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
        vm.$parent.$el = vm.$el;
      }
      // updated hook is called by the scheduler to ensure that children are
      // updated in a parent's updated hook.
      // 调度器调用update hook以确保子节点是在父类的更新钩子中更新。
    };
    // $forceUpdate :强制更新数据 观察者数据
    Vue.prototype.$forceUpdate = function () {
      // 保存vue实例
      var vm = this;
      // 如果有_watcher 观察者，就更新
      if (vm._watcher) {
        // 执行update 更新观察者数据
        vm._watcher.update();
      }
    };
    // $destroy :销毁组件
    Vue.prototype.$destroy = function () {
      // 保存vue实例
      var vm = this;
      // 如果已经销毁过，直接返回
      if (vm._isBeingDestroyed) {
        return
      }
      // 触发生命周期beforeDestroy钩子函数
      callHook(vm, 'beforeDestroy');
      // 将这个标识设为true，表示已经开始销毁
      vm._isBeingDestroyed = true;
      // remove self from parent
      // 从父节点移除self
      var parent = vm.$parent;
      // 如果父节点还存在，并没有被销毁
      if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
        // 删除父节点
        remove(parent.$children, vm);
      }
      // teardown watchers
      // 如果_watcher还存在 拆卸观察者
      if (vm._watcher) {
        vm._watcher.teardown();
      }
      // 获取观察者长度
      var i = vm._watchers.length;
      // 全部删除
      while (i--) {
        vm._watchers[i].teardown();
      }
      // remove reference from data ob
      // 从ob中删除引用
      // frozen object may not have observer.
      // 被冻结的对象可能没有观察者
      if (vm._data.__ob__) {
        vm._data.__ob__.vmCount--;
      }
      // call the last hook...
      // 将这个设为true，表示已经完成销毁 调用最后一个钩子函数
      vm._isDestroyed = true;
      // invoke destroy hooks on current rendered tree
      // 调用当前渲染树上的销毁钩子
      vm.__patch__(vm._vnode, null);
      // fire destroyed hook
      // 触发生命周期destroyed钩子函数
      callHook(vm, 'destroyed');
      // turn off all instance listeners.
      // 销毁事件监听器
      vm.$off();
      // remove __vue__ reference
      // 删除vue参数
      if (vm.$el) {
        vm.$el.__vue__ = null;
      }
      // release circular reference (#6759)
      // 释放循环引用 销毁父节点
      if (vm.$vnode) {
        vm.$vnode.parent = null;
      }
    };
  }

  // mountComponent :安装组件
  function mountComponent(
    vm, //vnode
    el, //dom
    hydrating   //ssr相关
  ) {
    // 获取el，也就是dom
    vm.$el = el;
    // 如果选项中没有render函数 这里说的render就是实例化vm的render，虚拟dom调用的渲染函数
    if (!vm.$options.render) {
      // render等于 createEmptyVNode函数
      // createEmptyVNode是一个创建一个节点 空的vNode的函数
      vm.$options.render = createEmptyVNode;
      {
        /* istanbul ignore if */
        // 如果template第一个不是#，就警告
        if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
          vm.$options.el || el) {
          warn(
            'You are using the runtime-only build of Vue where the template ' +
            'compiler is not available. Either pre-compile the templates into ' +
            'render functions, or use the compiler-included build.',
            vm
          );
        } else {
          warn(
            'Failed to mount component: template or render function not defined.',
            vm
          );
        }
      }
    }
    // 执行生命周期 beforeMount 钩子函数
    callHook(vm, 'beforeMount');
    // 更新组件 
    var updateComponent;
    /* istanbul ignore if */
    // 忽略 如果开发环境
    if ( config.performance && mark) {
      updateComponent = function () {
        var name = vm._name;
        var id = vm._uid;
        var startTag = "vue-perf-start:" + id;
        var endTag = "vue-perf-end:" + id;

        mark(startTag);
        var vnode = vm._render();
        mark(endTag);
        measure(("vue " + name + " render"), startTag, endTag);

        mark(startTag);
        vm._update(vnode, hydrating);
        mark(endTag);
        measure(("vue " + name + " patch"), startTag, endTag);
      };
    } else {
      // updateComponet函数 直接更新view视图
      updateComponent = function () {
        
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
          );
      };
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
        before: function before() {
          // 如果已经挂载并且没有被销毁
          if (vm._isMounted && !vm._isDestroyed) {
            // 触发生命周期 beforeUpdate 钩子函数
            callHook(vm, 'beforeUpdate');
          }
        }
      }, 
      true /* isRenderWatcher */ );
    hydrating = false;

    // manually mounted instance, call mounted on self
    // mounted is called for render-created child components in its inserted hook
    // 手动挂载实例，调用挂载在self上
    // 在插入的钩子中为呈现器创建的子组件调用
    // 如果没有vnode，代表挂载完毕
    if (vm.$vnode == null) {
      // 将这个设为true
      vm._isMounted = true;
      // 触发生命周期 mounted 钩子函数
      callHook(vm, 'mounted');
    }
    // return vm
    return vm
  }
  // 更新子组件
  function updateChildComponent(
    vm, //vnode
    propsData, //props
    listeners , //事件监听
    parentVnode , //父亲vnode
    renderChildren //子节点
  ) {
    {
      // 将这个设为true 是否更新过了子组件
      isUpdatingChildComponent = true;
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
    var newScopedSlots = parentVnode.data.scopedSlots;
    // 旧的作用域插槽
    var oldScopedSlots = vm.$scopedSlots;
    // 是否有动态作用域插槽
    var hasDynamicScopedSlot = !!(
      (newScopedSlots && !newScopedSlots.$stable) || // has new dynamic scoped slots 是否有新的动态作用域插槽
      (oldScopedSlots !== emptyObject && !oldScopedSlots.$stable) || // has old dynamic scoped slots  是否有旧的动态作用域插槽 
      (newScopedSlots && vm.$scopedSlots.$key !== newScopedSlots.$key) // has different key scoped slots 是否有不同key的新的动态作用域插槽
    );

    // Any static slot children from the parent may have changed during parent's
    // update. Dynamic scoped slots may also have changed. In such cases, a forced
    // update is necessary to ensure correctness.
    // 父级的任何静态槽子级都可能在父级的更新中改变。动态作用域插槽也可能已更改。在这种情况下必须进行更新以确保正确性。
    var needsForceUpdate = !!(
      renderChildren || // has new static slots 是否有新的静态插槽
      vm.$options._renderChildren || // has old static slots 是否有进的静态插槽
      hasDynamicScopedSlot  //是否有动态作用域插槽
    );
    // 父亲vnode
    vm.$options._parentVnode = parentVnode;
    // 无需重新渲染即可更新vm的占位符节点
    vm.$vnode = parentVnode; // update vm's placeholder node without re-render
    // 如果_vnode存在
    if (vm._vnode) { // update child tree's parent 
      // 更新子树的父树
      vm._vnode.parent = parentVnode;
    }
    // 子节点
    vm.$options._renderChildren = renderChildren;

    // update $attrs and $listeners hash
    // these are also reactive so they may trigger child update if the child
    // used them during render
    //更新$attrs和$listener散列
    //它们也是相应性的，因此如果子进程更新，它们可能触发子进程更新
    //渲染时使用它们

    // 获取虚拟dom的属性attrs
    vm.$attrs = parentVnode.data.attrs || emptyObject;
    // 获取事件
    vm.$listeners = listeners || emptyObject;

    // update props 更新props属性
    if (propsData && vm.$options.props) {
      // 这个函数只是返回一个 shouldObserve = boolean 
      toggleObserving(false); // 是否可以添加到观察者模式
      // 获取属性
      var props = vm._props;
      // 获取属性的propKeys
      var propKeys = vm.$options._propKeys || [];
      // 遍历props
      for (var i = 0; i < propKeys.length; i++) {
        // 每一个props
        var key = propKeys[i];
        // 获取原始props 用来进行validateProp函数
        var propOptions = vm.$options.props; // wtf flow?
        /**
        * 验证 prosp 是否是规范数据 并且为props 添加 value.__ob__  属性，把prosp添加到观察者中
        * 校验 props 参数 就是组建 定义的props 类型数据，校验类型
        * 判断prop.type的类型是不是Boolean或者String，如果不是他们两类型，调用getPropDefaultValue获取默认值并且把value添加到观察者模式中
        **/
        props[key] = validateProp(key, propOptions, propsData, vm);
      }
      // 可添加到观察者模式中
      toggleObserving(true);
      // keep a copy of raw propsData
      // 保留原始propsData的副本
      vm.$options.propsData = propsData;
    }

    // update listeners 更新事件
    // 判断listeners并赋值
    listeners = listeners || emptyObject;
    // 旧的事件
    var oldListeners = vm.$options._parentListeners;
    // 新的事件
    vm.$options._parentListeners = listeners;
    // 更新组件事件 :todo
    updateComponentListeners(vm, listeners, oldListeners);

    // resolve slots + force update if has children
    // 解决插槽+强制更新如果有 子节点
    // 如果需要ForceUpdate
    if (needsForceUpdate) {
      //判断children 有没有分发式插槽 并且过滤掉空的插槽,并且收集插槽
      vm.$slots = resolveSlots(renderChildren, parentVnode.context);
      //更新数据 观察者数据
      vm.$forceUpdate();
    }

    {
      // 将这设为false 代表不是要update的子组件
      isUpdatingChildComponent = false;
    }
  }

  // 这三个函数都是判断keep-alive相关的 包括之前的非抽象父组件，也是排除keep-alive :todo
  // 循环父组件dom，如果有不活跃的返回true
  function isInInactiveTree(vm) {
    // 循环父节点
    while (vm && (vm = vm.$parent)) {
      // 如果父节点有_inactive 则返回true
      if (vm._inactive) { return true }
    }
    return false
  }
  // 判断是否有不活跃的组件 禁用他 如果有活跃组件则触发钩子函数activated
  function activateChildComponent(
    vm, // 虚拟dom vnode
    direct    //布尔值
    ) {
    if (direct) {
      // _directInactive 设为false
      vm._directInactive = false;
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
      vm._inactive = false;
      // 循环禁止子组件
      for (var i = 0; i < vm.$children.length; i++) {
        // 递归循环 禁用子组件
        activateChildComponent(vm.$children[i]);
      }
      // 触发activated 生命周期钩子函数
      callHook(vm, 'activated');
    }
  }
  // 循环子组件 和父组件 判断是否有禁止的组件 如果有活跃组件则执行生命后期函数deactivated
  function deactivateChildComponent(
    vm, // 虚拟dom vnode
    direct   // 布尔值
    ) {
    if (direct) {
      vm._directInactive = true;
      if (isInInactiveTree(vm)) {
        return
      }
    }
    // 如果该组件是活跃的
    if (!vm._inactive) {
      vm._inactive = true; // 设置活动中的树
      for (var i = 0; i < vm.$children.length; i++) {
        deactivateChildComponent(vm.$children[i]);
      }
      // 触发deactivated 生命周期钩子函数
      callHook(vm, 'deactivated');
    }
  }
  // 在initLifeCycle中初始化callHook   触发钩子函数
  function callHook(
    vm, // 虚拟dom vnode
    hook   // 钩子函数的key 也就是生命周期
    ) {
    // #7573 disable dep collection when invoking lifecycle hooks
    //调用生命周期钩子时禁用dep集合
    //Dep.target = _target; 压栈
    pushTarget();
    // 获得传入的钩子 beforeCreated这些
    // 在vm 中添加声明周期函数
    var handlers = vm.$options[hook];
    // 模板字符串拼接
    var info = hook + " hook";
    // 如果获取到钩子周期
    if (handlers) {
      // 遍历执行
      for (var i = 0, j = handlers.length; i < j; i++) {
        // 判断是否异步
        invokeWithErrorHandling(handlers[i], vm, null, vm, info);
      }
    }
    // 如果存在vm._hasHookEvent
    if (vm._hasHookEvent) {
      // 提交事件
      vm.$emit('hook:' + hook);
    }
    // 出栈
    popTarget();
  }

  /*  */

  var MAX_UPDATE_COUNT = 100;

  var queue = []; // 记录观察者队列的数组
  var activatedChildren = [];  //记录活跃的子组件
  var has = {}; //记录观察者的id
  var circular = {}; // 持续循环更新的次数，如果超过100次 则判断已经进入了死循环，则会报错
  var waiting = false; //观察者在更新数据时候 等待的标志
  var flushing = false; //进入flushSchedulerQueue 函数等待标志
  var index = 0; //queue 观察者队列的索引

  /**
   * Reset the scheduler's state.
   * 重置计划程序的状态
   * 也就是清空观察者watcher队列中所有数据
   */
  function resetSchedulerState () {
    // 观察队列长度和活跃子组件长度都变为0
    index = queue.length = activatedChildren.length = 0;
    // 观察者记录的id
    has = {};
    {
      circular = {};
    }
    // 两个等待标志设为false
    waiting = flushing = false;
  }

  // Async edge case #6566 requires saving the timestamp when event listeners are
  // attached. However, calling performance.now() has a perf overhead especially
  // if the page has thousands of event listeners. Instead, we take a timestamp
  // every time the scheduler flushes and use that for all event listeners
  // attached during that flush.

  // 异步边缘情况要求在附加事件侦听器时保存时间戳
  // 但是，当performance.now()现在的性能开销很大，如果页面有上千个事件监听器
  // 相反，我们在每次调度程序刷新时获取一个时间戳，并将其用于刷新期间附加的所有事件侦听器

  // 调度程序刷新时获取的时间戳
  var currentFlushTimestamp = 0;

  // Async edge case fix requires storing an event listener's attach timestamp.
  // 异步边缘情况修复需要存储事件侦听器的附加时间戳。

  // 获取当前时间戳
  var getNow = Date.now;

  // Determine what event timestamp the browser is using. Annoyingly, the
  // timestamp can either be hi-res (relative to page load) or low-res
  // (relative to UNIX epoch), so in order to compare time we have to use the
  // same timestamp type when saving the flush timestamp.

  // 确定浏览器正在使用的事件时间戳。
  // 令人恼火的是，时间戳可以是高分辨率（相对于页面加载）或低分辨率（相对于UNIX epoch）
  // 所以为了比较时间，我们在保存刷新时间戳时必须使用相同的时间戳类型。
  if (
    inBrowser && //如果是浏览器
    window.performance && //如果performance存在
    typeof performance.now === 'function' && // 如果performance.now是函数
    document.createEvent('Event').timeStamp <= performance.now()  //如果时间戳小于现在
  ) {
    // if the event timestamp is bigger than the hi-res timestamp
    // (which is evaluated AFTER) it means the event is using a lo-res timestamp,
    // and we need to use the lo-res version for event listeners as well.

    // 如果事件时间戳大于高分辨率时间戳（之后计算），则表示事件使用低分辨率时间戳，
    // 我们还需要为事件侦听器使用lores版本。

    // performance.now()是当前时间与performance.timing.navigationStart的时间差，
    // 以微秒（百万分之一秒）为单位的时间，与 Date.now()-performance.timing.navigationStart
    // 的区别是不受系统程序执行阻塞的影响，因此更加精准。
    getNow = function () { return performance.now(); };
  }

  /**
   * Flush both queues and run the watchers.
   * 刷新两个队列并运行观察程序
   * 更新观察者，运行watcher.run()，并且调用组件更新和激活的钩子
   */
  function flushSchedulerQueue () {
    // 获取当前时间戳，可能以Date.now或者performance.now获取
    currentFlushTimestamp = getNow();
    // 然后进入flushSchedulerQueue 函数等待标志位true
    flushing = true;
    var watcher, id;

    // Sort queue before flush.
    // This ensures that:
    // 1. Components are updated from parent to child. (because parent is always
    //    created before the child)
    // 2. A component's user watchers are run before its render watcher (because
    //    user watchers are created before the render watcher)
    // 3. If a component is destroyed during a parent component's watcher run,
    //    its watchers can be skipped.

    // 刷新前对队列排序
    // 这样可以确保：
    // 1. 组件从父级更新到子级。（因为父对象总是在子对象之前创建）
    // 2. 组件的用户观察程序在其渲染观察程序之前运行（因为用户观察程序是在渲染观察程序之前创建的）
    // 3. 如果某个组件在父组件的观察程序运行期间被破坏，则可以跳过它的观察程序。

    // 刷新前对队列进行排序 根据id排序
    queue.sort(function (a, b) { return a.id - b.id; });

    // do not cache length because more watchers might be pushed
    // as we run existing watchers

    // 当我们运行现有的观察者时，不要缓存长度，因为可能会推送更多观察者

    // 遍历观察者数组
    for (index = 0; index < queue.length; index++) {
      // 获取单个观察者
      watcher = queue[index];
      // 如果存在before
      if (watcher.before) {
        watcher.before();
      }
      // 获取id
      id = watcher.id;
      has[id] = null;
      // 运行观察者
      watcher.run();
      // in dev build, check and stop circular updates.
      // 在dev build中，检查并停止循环更新。
      if ( has[id] != null) {
        circular[id] = (circular[id] || 0) + 1;
        if (circular[id] > MAX_UPDATE_COUNT) {
          warn(
            'You may have an infinite update loop ' + (
              watcher.user
                ? ("in watcher with expression \"" + (watcher.expression) + "\"")
                : "in a component render function."
            ),
            watcher.vm
          );
          break
        }
      }
    }

    // keep copies of post queues before resetting state
    // 在重置状态之前保留投递队列的副本 都是浅拷贝
    var activatedQueue = activatedChildren.slice();
    var updatedQueue = queue.slice();
    // 重置状态
    resetSchedulerState();

    // call component updated and activated hooks
    // 调用组件更新并激活钩子函数
    callActivatedHooks(activatedQueue);
    callUpdatedHooks(updatedQueue);

    // devtool hook
    /* istanbul ignore if */
    // 触发父层flush事件钩子函数
    if (devtools && config.devtools) {
      devtools.emit('flush');
    }
  }

  // 触发 updated生命周期钩子函数
  function callUpdatedHooks (queue) {
    // 获取观察者队列长度
    var i = queue.length;
    // 遍历
    while (i--) {
      var watcher = queue[i];
      // 获取到虚拟dom
      var vm = watcher.vm;
      // 如果是渲染函数的watcher 并且 已经mounted并且没被Destroyed
      if (vm._watcher === watcher && vm._isMounted && !vm._isDestroyed) {
        // 触发updated生命周期钩子函数
        callHook(vm, 'updated');
      }
    }
  }

  /**
   * Queue a kept-alive component that was activated during patch.
   * The queue will be processed after the entire tree has been patched.
   * 
   * 对修补期间激活的保持活动状态的组件进行排队。
   * 将在修补整个树之后处理队列。
   * 
   * 添加活跃的组件函数，把活跃的vm添加到activatedChildren中
   */
  function queueActivatedComponent (vm) {
    // setting _inactive to false here so that a render function can
    // rely on checking whether it's in an inactive tree (e.g. router-view)
    // 在这里将“inactive”设置为false，以便呈现函数可以
    // 依靠检查它是否在不活动的树中（例如路由器视图）
    // 将_inactive设为false，然后加入到activatedChildren，记录活跃子组件队列中
    vm._inactive = false;
    activatedChildren.push(vm);
  }

  // 调用组件激活的钩子
  function callActivatedHooks (queue) {
    // 遍历观察者队列
    for (var i = 0; i < queue.length; i++) {
      // 所有置为true
      queue[i]._inactive = true;
      //判断是否有不活跃的组件 禁用他 如果有活跃组件则触发钩子函数activated
      activateChildComponent(queue[i], true /* true */);
    }
  }

  /**
   * Push a watcher into the watcher queue.
   * Jobs with duplicate IDs will be skipped unless it's
   * pushed when the queue is being flushed.
   * 
   * 将观察者推入观察者队列。
   * 具有重复ID的作业将被跳过，除非在刷新队列时推送。
   * 
   * 将观察者watcher推进到观察者队列中，过滤重复id，除非是刷新队列时推送
   */
  function queueWatcher (watcher) {
    // 获取id
    var id = watcher.id;
    if (has[id] == null) {
      has[id] = true;
      // 如果进入flushSchedulerQueue 函数等待标志 为false
      if (!flushing) {
        // 把观察者添加到队列中
        queue.push(watcher);
      } else {
        // if already flushing, splice the watcher based on its id
        // if already past its id, it will be run next immediately.
        // 如果已经在更新了，则根据其id拼接观察程序
        // 如果已经超过了它的id，它将在下一个立即运行。
        var i = queue.length - 1;
        while (i > index && queue[i].id > watcher.id) {
          i--;
        }
        //根据id大小拼接插入在数组的哪个位置
        queue.splice(i + 1, 0, watcher);
      }
      // queue the flush
      // 观察者在更新数据时候 等待的标志 为false
      if (!waiting) {
        waiting = true;

        if ( !config.async) {
          // 刷新两个队列并运行观察程序
          // 更新观察者，运行watcher.run()，并且调用组件更新和激活的钩子
          flushSchedulerQueue();
          return
        }
        // 更新观察者 运行观察者watcher.run() 函数 并且调用组件更新和激活的钩子
        // 异步清空回调函数队列
        nextTick(flushSchedulerQueue);
      }
    }
  }

  /*  */



  var uid$1 = 0;

  /**
   * A watcher parses an expression, collects dependencies,
   * and fires callback when the expression value changes.
   * This is used for both the $watch() api and directives.
   * 观察者分析表达式，收集依赖关系，
   * 并在表达式值更改时触发回调。
   * 它同时用于$watch（）api和指令。
   */
  var Watcher = function Watcher (
    vm,// dom
    expOrFn, //获取值的函数，或是更新视图的函数
    cb, //回调函数
    options, //参数
    isRenderWatcher //是否是渲染过的watcher
  ) {
    // 获取到vm 也代表了哪个组件
    this.vm = vm;
    // 如果是渲染函数的watcher 
    if (isRenderWatcher) {
      // 把当前Watcher对象给_wathcer
      vm._watcher = this;
    }
    // 把观察者添加到_watchers数组中
    vm._watchers.push(this);
    // options 
    // 如果有options
    if (options) {
      // 获取参数
      this.deep = !!options.deep; // 是否深度观察
      this.user = !!options.user; // 
      this.lazy = !!options.lazy; // 是否懒惰观察，也就是不观察
      this.sync = !!options.sync; // 是否同步求值
      this.before = options.before; // before 算是回调钩子函数 组件更新前触发
    } else {
      // 否则都为false
      this.deep = this.user = this.lazy = this.sync = false;
    }
    this.cb = cb; // 回调函数
    this.id = ++uid$1; // uid for batching uid用于批处理
    this.active = true; // 激活
    this.dirty = this.lazy; // for lazy watchers用于懒惰的观察者
    this.deps = []; // 观察者队列
    this.newDeps = []; // 新的观察者队列
    this.depIds = new _Set(); // depId 不可重复
    this.newDepIds = new _Set(); // 新depId 不可重复
    this.expression =  expOrFn.toString() // 函数变成字符串形式
      ;
    // parse expression for getter
    // getter的解析表达式
    // 如果是函数
    if (typeof expOrFn === 'function') {
      // 获取值函数
      this.getter = expOrFn;
    } else {
      // 如果是keepAlive 组件则走这里
      // 调用parsePath返回值 返回一个遍历所有属性的函数，也是触发get
      this.getter = parsePath(expOrFn); //updateComponent
      if (!this.getter) {
        // 如果不存在
        // 给一个noop空函数
        this.getter = noop;
         warn(
          "Failed watching path: \"" + expOrFn + "\" " +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        );
      }
    }
    // 
    this.value = this.lazy
      ? undefined // 当lazy为真时
      : this.get(); // lazy不在时 计算getter，并重新收集依赖项。
  };

  /**
   * Evaluate the getter, and re-collect dependencies.
   * 计算getter，并重新收集依赖项。
   */
  Watcher.prototype.get = function get () {
    // 添加dep.target dep.target = this
    pushTarget(this);
    var value;
    var vm = this.vm;
    try {
      // 这时dep.target = this ，然后执行this.getter.call也就触发get方法，判断dep.target是否存在，存在则dep.depend()
      // 获取值 触发get 也就触发Object.definePorperty的get中的dep.depend()，依赖收集
      // 每个watcher第一次实例化的时候，都会作为订阅者订阅其相应的Dep。
      value = this.getter.call(vm, vm);
    } catch (e) {
      // 如果报错
      if (this.user) {
        handleError(e, vm, ("getter for watcher \"" + (this.expression) + "\""));
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      // “触摸”每个属性，以便它们都被跟踪为深度监视的依赖项
      if (this.deep) {
        // 为 seenObjects 深度收集val 中的key
        traverse(value);
      }
      // 出栈一个dep.target
      popTarget();
      // 清理依赖项集合
      this.cleanupDeps();
    }
    // 返回值
    return value
  };

  /**
   * Add a dependency to this directive.
   * 向该指令添加依赖项
   */
  Watcher.prototype.addDep = function addDep (dep) {
    // dep.id 陆续自+
    var id = dep.id; 
    // 如果id不存在
    if (!this.newDepIds.has(id)) {
      // :todo
      // 你保存我的引用
      // 我也要保存你的引用
      // newDepIds添加一个id
      this.newDepIds.add(id);
      // newDeps添加一个dep
      this.newDeps.push(dep);
      // 如果depIds中id不存在
      if (!this.depIds.has(id)) {
        // 给subs数组添加一个Watcher对象
        dep.addSub(this);
      }
    }
  };

  /**
   * Clean up for dependency collection.
   * 清理依赖项集合。
   */
  Watcher.prototype.cleanupDeps = function cleanupDeps () {
    // 获取deps长度
    var i = this.deps.length;
    // 遍历
    while (i--) {
      var dep = this.deps[i];
      // 如果在newDepIds中不存在dep的id
      if (!this.newDepIds.has(dep.id)) {
        // 清楚依赖项
        dep.removeSub(this);
      }
    }
    var tmp = this.depIds; //获取depid
    this.depIds = this.newDepIds; // 获取新depids
    this.newDepIds = tmp; // 旧覆盖新
    this.newDepIds.clear(); // 清空对象
    // 互换
    tmp = this.deps;
    this.deps = this.newDeps;
    this.newDeps = tmp;
    this.newDeps.length = 0;
  };

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   * 观察者接口
   * 将在依赖项更改时触发
   */
  Watcher.prototype.update = function update () {
    /* istanbul ignore else */
    // 如果是懒惰的lazy
    if (this.lazy) {
      // 
      this.dirty = true;
    } else if (this.sync) { //如果是同步
      // 
      this.run();
    } else {
      // :todo 异步队列
      // 数据并不会立即更新，而是异步，批量排队执行
      queueWatcher(this);
    }
  };

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   * 调度程序作业接口。将由调度程序调用。
   */
  Watcher.prototype.run = function run () {
    // 如果是活跃
    if (this.active) {
      // 获取值
      var value = this.get();
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        // 深度观察者和对象/数组上的观察者应该是相同的
        // 当值相同时，因为值可能变异了。
        // 是否是对象
        isObject(value) ||
        // 获取deep 如果为true
        this.deep
      ) {
        // set new value
        // 设置新值
        var oldValue = this.value;
        // 赋值新值
        this.value = value;
        // 如果是user
        if (this.user) {
          try {
            // 更新回调函数
            this.cb.call(this.vm, value, oldValue);
          } catch (e) {
            // 如果出错
            handleError(e, this.vm, ("callback for watcher \"" + (this.expression) + "\""));
          }
        } else {
          // 如果不是user，更新回调函数 获取到新的值 和旧的值
          this.cb.call(this.vm, value, oldValue);
        }
      }
    }
  };

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   * 评估观察者的价值。这只适用于懒惰的观察者
   */
  Watcher.prototype.evaluate = function evaluate () {
    // 获取值
    this.value = this.get(); 
    // 懒惰lazy标志，标志已经获取过一次值
    this.dirty = false;
  };

  /**
   * Depend on all deps collected by this watcher.
   * 依赖于此观察者收集的所有DEP。
   * 循环deps 收集 newDeps dep 当newDeps 数据被清空的时候重新收集依赖
   */
  Watcher.prototype.depend = function depend () {
    var i = this.deps.length;
    while (i--) {
      this.deps[i].depend();
    }
  };

  /**
   * Remove self from all dependencies' subscriber list.
   * 从所有依赖项的订阅服务器列表中删除self。
   */
  Watcher.prototype.teardown = function teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.

      // 从vm的观察者列表中删除自身
      // 这是一个有点贵的手术，所以我们跳过它
      // 如果虚拟机正在被销毁。

      // 是否被销毁
      if (!this.vm._isBeingDestroyed) {
        // 删除观察者
        remove(this.vm._watchers, this);
      }
      // 遍历删除
      var i = this.deps.length;
      while (i--) {
        this.deps[i].removeSub(this);
      }
      // 变成不活跃
      this.active = false;
    }
  };

  /*  */

  // 共享属性定义
  var sharedPropertyDefinition = {
    enumerable: true,
    configurable: true,
    get: noop,
    set: noop
  };

  // 代理 app.data.name 变成app.name
  // proxy(app, 'data', 'name')
  function proxy (target, sourceKey, key) {
    // 加get
    sharedPropertyDefinition.get = function proxyGetter () {
      return this[sourceKey][key]
    };
    // 加set
    sharedPropertyDefinition.set = function proxySetter (val) {
      this[sourceKey][key] = val;
    };
    // 通过Object.defineProperty给app.name加上属性
    Object.defineProperty(target, key, sharedPropertyDefinition);
  }
  // 初始化一些data props methods那些 
  function initState (vm) {
    // 初始化watchers数组 观察者队列
    vm._watchers = [];
    // 获取选项
    var opts = vm.$options;
    // 初始化props
    if (opts.props) { initProps(vm, opts.props); }
    // 初始化methods
    if (opts.methods) { initMethods(vm, opts.methods); }
    // 初始化data
    if (opts.data) {
      // 如果存在，直接InitData 
      initData(vm);
    } else {
      // 如果不存在data，直接进行observe，true作为根的data observe:todo
      observe(vm._data = {}, true /* asRootData */);
    }
    // 初始化computed
    if (opts.computed) { initComputed(vm, opts.computed); }
    // 初始化watch
    if (opts.watch && opts.watch !== nativeWatch) {
      initWatch(vm, opts.watch);
    }
  }

  // 初始化props 
  function initProps (vm, propsOptions) {
    // 获取props数据
    var propsData = vm.$options.propsData || {};

    var props = vm._props = {};
    // cache prop keys so that future props updates can iterate using Array
    // 缓存prop keys以便以后props更新可以使用数组迭代
    // instead of dynamic object key enumeration.
    // 而不是动态 object.key枚举
    var keys = vm.$options._propKeys = [];
    // 是否是根 如果不存在父节点 就是根
    var isRoot = !vm.$parent;
    // root instance props should be converted
    // 根实例的props需要被响应式
    // 如果不是根
    if (!isRoot) {
      // 则不会添加监听观察者
      toggleObserving(false);
    }
    // propsOptions是传入的options.props，也就是选项中的props属性
    // 遍历props属性的key
    var loop = function ( key ) {
      // 将key放进数组，容易迭代
      keys.push(key);
      // 判断prop.type是否是Boolean或String，如果不是，则getPropDefaultValue
      // 获取默认值，并给value添加value._ob_属性，添加到观察者模式中
      var value = validateProp(key, propsOptions, propsData, vm);
      /* istanbul ignore else */
      // 忽略
      {
        // 驼峰转换 vOn v-on
        var hyphenatedKey = hyphenate(key);
        if (isReservedAttribute(hyphenatedKey) ||
            config.isReservedAttr(hyphenatedKey)) {
          warn(
            ("\"" + hyphenatedKey + "\" is a reserved attribute and cannot be used as component prop."),
            vm
          );
        }
        defineReactive(props, key, value, function () {
          if (!isRoot && !isUpdatingChildComponent) {
            warn(
              "Avoid mutating a prop directly since the value will be " +
              "overwritten whenever the parent component re-renders. " +
              "Instead, use a data or computed property based on the prop's " +
              "value. Prop being mutated: \"" + key + "\"",
              vm
            );
          }
        });
      }
      // static props are already proxied on the component's prototype
      // during Vue.extend(). We only need to proxy props defined at
      // instantiation here.
      // 静态props已经在组件的原型上代理了
      // 在Vue.extend()期间. 我们只需要代理
      // 在这里实例化定义的key。
      if (!(key in vm)) {
        proxy(vm, "_props", key);
      }
    };

    for (var key in propsOptions) loop( key );
    // 可加入观察者模式
    toggleObserving(true);
  }
  // initData 初始化data 接收组件实例
  // 做了两件事：1、代理，将data的所有key代理到vm实例上
  //           2、observe(data, true /* asRootData */)
  function initData (vm) {
    // 获取到选项中的data data可能是对象可能是函数 取决于根
    var data = vm.$options.data;
    // 如果data是一个函数 执行getData，如果是对象就是根data
    data = vm._data = typeof data === 'function'
      ? getData(data, vm)
      : data || {};
    // 如果不是纯对象 报错
    if (!isPlainObject(data)) {
      data = {};
       warn(
        'data functions should return an object:\n' +
        'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
        vm
      );
    }
    // proxy data on instance
    // 获取data所有属性 准备进行代理
    var keys = Object.keys(data);
    // 获取props，因为props在data之前先初始化
    var props = vm.$options.props;
    // 获取methods，因为methods在data之前先初始化
    var methods = vm.$options.methods;
    // 所有属性的长度
    var i = keys.length;
    // 
    while (i--) {
      // 从最后开始
      var key = keys[i];
      {
        if (methods && hasOwn(methods, key)) {
          warn(
            ("Method \"" + key + "\" has already been defined as a data property."),
            vm
          );
        }
      }
      if (props && hasOwn(props, key)) {
         warn(
          "The data property \"" + key + "\" is already declared as a prop. " +
          "Use prop default value instead.",
          vm
        );
        // 如果不是$和_开头，代理
      } else if (!isReserved(key)) {
        // 执行代理函数，将data的所有key全部挂到vm上，可以直接vm.获取
        // data:{foo: 'foo'}  vm.data.foo  vm.foo
        proxy(vm, "_data", key);
      }
    }
    // observe data
    // 将data作为根data进行observe
    observe(data, true /* asRootData */);
  }

  // 转换数据 如果数据
  function getData (data, vm) {
    // #7573 disable dep collection when invoking data getters
    // 调用数据获取程序时禁用dep收集
    pushTarget();
    try {
      // 执行传入的函数 获取数据
      return data.call(vm, vm)
    } catch (e) {
      handleError(e, vm, "data()");
      return {}
    } finally {
      // 最后禁用dep收集
      popTarget();
    }
  }
  // 计算属性监听
  var computedWatcherOptions = { lazy: true };

  // 初始化计算属性
  function initComputed (vm, computed) {
    // $flow-disable-line
    // 创建新的监听空对象
    var watchers = vm._computedWatchers = Object.create(null);
    // computed properties are just getters during SSR
    // computed属性只是SSR期间的getter
    var isSSR = isServerRendering();
    // 遍历computed的key属性
    for (var key in computed) {
      // 每个值
      var userDef = computed[key];
      // 如果是函数 就默认，不是就获取get computed的get默认写
      var getter = typeof userDef === 'function' ? userDef : userDef.get;
      if ( getter == null) {
        warn(
          ("Getter is missing for computed property \"" + key + "\"."),
          vm
        );
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
        );
      }

      // component-defined computed properties are already defined on the
      // component prototype. We only need to define computed properties defined
      // at instantiation here.
      // 组件定义的计算属性已在组件原型上定义
      // 我们只需要定义已在这里定义实例化的计算属性
      // 如果computed 属性key 不在虚拟dom中
      if (!(key in vm)) {
        // 定义computed 并将key加入到对象监听中
        defineComputed(vm, key, userDef);
      } else {
        if (key in vm.$data) { 
          // 如果key在data中，警告
          warn(("The computed property \"" + key + "\" is already defined in data."), vm);
        } else if (vm.$options.props && key in vm.$options.props) {
          // 如果key在props中，警告
          warn(("The computed property \"" + key + "\" is already defined as a prop."), vm);
        }
      }
    }
  }

  //定义计算属性 并且 把属性的数据 添加到对象监听中
  function defineComputed (
    target, //目标
    key, //属性
    userDef //key的值
  ) {
    // 是否是ssr 是浏览器
    var shouldCache = !isServerRendering();
    // 如果值是函数
    if (typeof userDef === 'function') {
      // 共享属性.get 
      sharedPropertyDefinition.get = shouldCache
      // 如果不是ssr 
        ? createComputedGetter(key)
        : createGetterInvoker(userDef);
      // .set
      sharedPropertyDefinition.set = noop;
    } else {
      // 如果值不是函数
      // 值中是否有get，如果有，判断如果不是ssr并且有缓存 那么sharedPropertyDefinition.get = createComputedGetter(key)
      // 值中如果没有get，直接sharedPropertyDefinition.get = noop
      sharedPropertyDefinition.get = userDef.get
        ? shouldCache && userDef.cache !== false
          ? createComputedGetter(key)
          : createGetterInvoker(userDef.get)
        : noop;
        // .set
      sharedPropertyDefinition.set = userDef.set || noop;
    }
    if (
        sharedPropertyDefinition.set === noop) {
      sharedPropertyDefinition.set = function () {
        warn(
          ("Computed property \"" + key + "\" was assigned to but it has no setter."),
          this
        );
      };
    }
    // 添加对象监听
    Object.defineProperty(target, key, sharedPropertyDefinition);
  }

  // 放回computedGetter 创建计算属性 获取值 收集 dep 依赖
  function createComputedGetter (key) {
    return function computedGetter () {
      // Watcher 实例化之后的对象
      var watcher = this._computedWatchers && this._computedWatchers[key];
      if (watcher) {
        if (watcher.dirty) {
          watcher.evaluate();
        }
        if (Dep.target) {
          //为Watcher 添加 为Watcher.newDeps.push(dep); 一个dep对象
          //循环deps 收集 newDeps dep 当newDeps 数据被清空的时候重新收集依赖
          watcher.depend();
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
  function initMethods (vm, methods) {
    // 获取props
    var props = vm.$options.props;
    // 遍历methods的属性key
    for (var key in methods) {
      {
        // 如果不是函数
        if (typeof methods[key] !== 'function') {
          warn(
            "Method \"" + key + "\" has type \"" + (typeof methods[key]) + "\" in the component definition. " +
            "Did you reference the function correctly?",
            vm
          );
        }
        //判断key是否是改对象实例化的
        //如果属性中定义了key，则在methods中不能定义同样的key
        if (props && hasOwn(props, key)) {
          warn(
            ("Method \"" + key + "\" has already been defined as a prop."),
            vm
          );
        }
        // $ 或_
        if ((key in vm) && isReserved(key)) {
          warn(
            "Method \"" + key + "\" conflicts with an existing Vue instance method. " +
            "Avoid defining component methods that start with _ or $."
          );
        }
      }
      // 把事件放在最外层对象中，如果是函数为空则给一个空函数，如果是有函数则执行改函数
      // 给最外层一个相同key属性，data.methods.sum() 变成data.sum()，代理
      // 如果methods.sum不是函数 给空函数noop
      // 如果是函数，执行该函数
      vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm);
    }
  }
  // 初始化watch
  function initWatch (vm, watch) {
    // 循环遍历watch属性key
    for (var key in watch) {
      // 获取值
      var handler = watch[key];
      // 如果值是数组
      if (Array.isArray(handler)) {
        // 循环这个数组 创建监听
        for (var i = 0; i < handler.length; i++) {
          createWatcher(vm, key, handler[i]);
        }
      } else {
        // 不是数组，就直接创建监听
        createWatcher(vm, key, handler);
      }
    }
  }

  // 创建监听
  function createWatcher (
    vm, //vm
    expOrFn, //key属性
    handler, // key属性值
    options
  ) {
    // 属性是否是纯对象 
    if (isPlainObject(handler)) {
      // options
      options = handler;
      // 对象中的handler 一定是函数或者字符串
      handler = handler.handler;
    }
    // 如果值是字符串
    if (typeof handler === 'string') {
      // 就是key 取值 vm 就是Vue 最外层 中的函数
      handler = vm[handler];
    }
    return vm.$watch(expOrFn, handler, options)
  }
  // 这里主要看 360行左右 数据绑定 $watch
  function stateMixin (Vue) {
    // flow somehow has problems with directly declared definition object
    // when using Object.defineProperty, so we have to procedurally build up
    // the object here.
    // flow在某种程度上与直接声明的定义对象有问题
    // 使用时Object.defineProperty,所以我们必须按程序建立
    // 这里的对象。
    var dataDef = {};
    // 返回this._data 只有get，作为只读属性？
    dataDef.get = function () { return this._data };
    var propsDef = {};
    // 返回this._props 只有get，作为只读属性？
    propsDef.get = function () { return this._props };
    {
      dataDef.set = function () {
        warn(
          // 避免替换根实例$data
          'Avoid replacing instance root $data. ' +
          'Use nested data properties instead.',
          this
        );
      };
      propsDef.set = function () {
        // 警告只读
        warn("$props is readonly.", this);
      };
    }
    // 给vue原型定义$data属性 
    Object.defineProperty(Vue.prototype, '$data', dataDef);
    // 给vue原型定义$props属性
    Object.defineProperty(Vue.prototype, '$props', propsDef);
    // $set方法 :todo 添加一个数组数据或对象数据
    Vue.prototype.$set = set;
    // $delete方法 :todo 删除一个数组数据或对象数据
    Vue.prototype.$delete = del;
    // $watch :todo
    Vue.prototype.$watch = function (
      expOrFn, //手动
      cb, //回调函数
      options //参数 可选
    ) {
      // 获取实例
      var vm = this;
      // 如果回调是个对象，递归深层监听，直到不是对象跳出
      if (isPlainObject(cb)) {
        return createWatcher(vm, expOrFn, cb, options)
      }
      // 参数
      options = options || {};
      options.user = true;
      // 实例化一个watcher 观察者
      var watcher = new Watcher(vm, expOrFn, cb, options);
      // 如果
      if (options.immediate) {
        try {
          // 触发回调
          cb.call(vm, watcher.value);
        } catch (error) {
          handleError(error, vm, ("callback for immediate watcher \"" + (watcher.expression) + "\""));
        }
      }
      // 卸载watcher 观察者
      return function unwatchFn () {
        // 从所有依赖项的订阅方列表中删除self。
        watcher.teardown();
      }
    };
  }

  /*  */

  var uid$2 = 0;

  function initMixin (Vue) {
    // _init
    Vue.prototype._init = function (options) {
      // vm获取当前实例
      var vm = this;
      // a uid
      // 给vm一个uid
      vm._uid = uid$2++;

      var startTag, endTag;
      /* istanbul ignore if */
      if ( config.performance && mark) {
        startTag = "vue-perf-start:" + (vm._uid);
        endTag = "vue-perf-end:" + (vm._uid);
        mark(startTag);
      }

      // a flag to avoid this being observed
      vm._isVue = true;
      // merge options
      if (options && options._isComponent) {
        // optimize internal component instantiation
        // since dynamic options merging is pretty slow, and none of the
        // internal component options needs special treatment.
        // 优化内部组件实例化
        // 因为动态选项合并非常慢，而且
        // 内部组件选项需要特殊处理。
        initInternalComponent(vm, options);
      } else {
        vm.$options = mergeOptions(
          resolveConstructorOptions(vm.constructor),
          options || {},
          vm
        );
      }
      /* istanbul ignore else */
      {
        initProxy(vm);
      }
      // expose real self
      vm._self = vm;
      // 核心代码在这里
      initLifecycle(vm); //初始化一些属性 和内部属性 $parent $root $refs $children
      initEvents(vm); //监听器的初始化
      initRender(vm); //vm.$creatElement
      // 在beforeCreate之前会做这些initLifecycle initEvents initRender
      callHook(vm, 'beforeCreate'); //触发钩子函数
      initInjections(vm); // resolve injections before data/props 也就是响应化注入的
      initState(vm); //初始化组件各种状态，从props methods data computed watch按顺序初始化
      initProvide(vm); // resolve provide after data/props
      // 在created之前会做这些initInjections initState initProvide
      callHook(vm, 'created');//触发钩子函数

      /* istanbul ignore if */
      if ( config.performance && mark) {
        vm._name = formatComponentName(vm, false);
        mark(endTag);
        measure(("vue " + (vm._name) + " init"), startTag, endTag);
      }

      if (vm.$options.el) {
        // 这里手动挂载
        vm.$mount(vm.$options.el);
      }
    };
  }
  // :todo
  function initInternalComponent (vm, options) {
    var opts = vm.$options = Object.create(vm.constructor.options);
    // doing this because it's faster than dynamic enumeration.
    var parentVnode = options._parentVnode;
    opts.parent = options.parent;
    opts._parentVnode = parentVnode;

    var vnodeComponentOptions = parentVnode.componentOptions;
    opts.propsData = vnodeComponentOptions.propsData;
    opts._parentListeners = vnodeComponentOptions.listeners;
    opts._renderChildren = vnodeComponentOptions.children;
    opts._componentTag = vnodeComponentOptions.tag;

    if (options.render) {
      opts.render = options.render;
      opts.staticRenderFns = options.staticRenderFns;
    }
  }
  // :todo
  function resolveConstructorOptions (Ctor) {
    var options = Ctor.options;
    if (Ctor.super) {
      var superOptions = resolveConstructorOptions(Ctor.super);
      var cachedSuperOptions = Ctor.superOptions;
      if (superOptions !== cachedSuperOptions) {
        // super option changed,
        // need to resolve new options.
        Ctor.superOptions = superOptions;
        // check if there are any late-modified/attached options (#4976)
        var modifiedOptions = resolveModifiedOptions(Ctor);
        // update base extend options
        if (modifiedOptions) {
          extend(Ctor.extendOptions, modifiedOptions);
        }
        options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
        if (options.name) {
          options.components[options.name] = Ctor;
        }
      }
    }
    return options
  }
  // :todo
  function resolveModifiedOptions (Ctor) {
    var modified;
    var latest = Ctor.options;
    var sealed = Ctor.sealedOptions;
    for (var key in latest) {
      if (latest[key] !== sealed[key]) {
        if (!modified) { modified = {}; }
        modified[key] = latest[key];
      }
    }
    return modified
  }

  // 好了，这里就是Vue的构造函数啦！
  function Vue (options) {
    if (
      !(this instanceof Vue)
    ) {
      warn('Vue is a constructor and should be called with the `new` keyword');
    }
    // 当new Vue实例时，执行_init方法
    this._init(options);
  }
  // 
  initMixin(Vue); //实现_init初始化方法
  stateMixin(Vue); //实现$set $delete $watch方法。还定义了只读$data $props
  eventsMixin(Vue); //:实现$on $once $off $emit四个方法
  lifecycleMixin(Vue); //:实现_update $forceUpdate $destroy三个方法
  renderMixin(Vue); //实现_render $nextTick方法

  /*  */

  function initUse (Vue) {
    Vue.use = function (plugin) {
      var installedPlugins = (this._installedPlugins || (this._installedPlugins = []));
      if (installedPlugins.indexOf(plugin) > -1) {
        return this
      }

      // additional parameters
      var args = toArray(arguments, 1);
      args.unshift(this);
      if (typeof plugin.install === 'function') {
        plugin.install.apply(plugin, args);
      } else if (typeof plugin === 'function') {
        plugin.apply(null, args);
      }
      installedPlugins.push(plugin);
      return this
    };
  }

  /*  */

  function initMixin$1 (Vue) {
    Vue.mixin = function (mixin) {
      this.options = mergeOptions(this.options, mixin);
      return this
    };
  }

  /*  */

  function initExtend (Vue) {
    /**
     * Each instance constructor, including Vue, has a unique
     * cid. This enables us to create wrapped "child
     * constructors" for prototypal inheritance and cache them.
     */
    Vue.cid = 0;
    var cid = 1;

    /**
     * Class inheritance
     */
    Vue.extend = function (extendOptions) {
      extendOptions = extendOptions || {};
      var Super = this;
      var SuperId = Super.cid;
      var cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {});
      if (cachedCtors[SuperId]) {
        return cachedCtors[SuperId]
      }

      var name = extendOptions.name || Super.options.name;
      if ( name) {
        validateComponentName(name);
      }

      var Sub = function VueComponent (options) {
        this._init(options);
      };
      Sub.prototype = Object.create(Super.prototype);
      Sub.prototype.constructor = Sub;
      Sub.cid = cid++;
      Sub.options = mergeOptions(
        Super.options,
        extendOptions
      );
      Sub['super'] = Super;

      // For props and computed properties, we define the proxy getters on
      // the Vue instances at extension time, on the extended prototype. This
      // avoids Object.defineProperty calls for each instance created.
      if (Sub.options.props) {
        initProps$1(Sub);
      }
      if (Sub.options.computed) {
        initComputed$1(Sub);
      }

      // allow further extension/mixin/plugin usage
      Sub.extend = Super.extend;
      Sub.mixin = Super.mixin;
      Sub.use = Super.use;

      // create asset registers, so extended classes
      // can have their private assets too.
      ASSET_TYPES.forEach(function (type) {
        Sub[type] = Super[type];
      });
      // enable recursive self-lookup
      if (name) {
        Sub.options.components[name] = Sub;
      }

      // keep a reference to the super options at extension time.
      // later at instantiation we can check if Super's options have
      // been updated.
      Sub.superOptions = Super.options;
      Sub.extendOptions = extendOptions;
      Sub.sealedOptions = extend({}, Sub.options);

      // cache constructor
      cachedCtors[SuperId] = Sub;
      return Sub
    };
  }

  function initProps$1 (Comp) {
    var props = Comp.options.props;
    for (var key in props) {
      proxy(Comp.prototype, "_props", key);
    }
  }

  function initComputed$1 (Comp) {
    var computed = Comp.options.computed;
    for (var key in computed) {
      defineComputed(Comp.prototype, key, computed[key]);
    }
  }

  /*  */

  function initAssetRegisters (Vue) {
    /**
     * Create asset registration methods.
     */
    ASSET_TYPES.forEach(function (type) {
      Vue[type] = function (
        id,
        definition
      ) {
        if (!definition) {
          return this.options[type + 's'][id]
        } else {
          /* istanbul ignore if */
          if ( type === 'component') {
            validateComponentName(id);
          }
          if (type === 'component' && isPlainObject(definition)) {
            definition.name = definition.name || id;
            definition = this.options._base.extend(definition);
          }
          if (type === 'directive' && typeof definition === 'function') {
            definition = { bind: definition, update: definition };
          }
          this.options[type + 's'][id] = definition;
          return definition
        }
      };
    });
  }

  /*  */



  function getComponentName (opts) {
    return opts && (opts.Ctor.options.name || opts.tag)
  }

  function matches (pattern, name) {
    if (Array.isArray(pattern)) {
      return pattern.indexOf(name) > -1
    } else if (typeof pattern === 'string') {
      return pattern.split(',').indexOf(name) > -1
    } else if (isRegExp(pattern)) {
      return pattern.test(name)
    }
    /* istanbul ignore next */
    return false
  }

  function pruneCache (keepAliveInstance, filter) {
    var cache = keepAliveInstance.cache;
    var keys = keepAliveInstance.keys;
    var _vnode = keepAliveInstance._vnode;
    for (var key in cache) {
      var cachedNode = cache[key];
      if (cachedNode) {
        var name = getComponentName(cachedNode.componentOptions);
        if (name && !filter(name)) {
          pruneCacheEntry(cache, key, keys, _vnode);
        }
      }
    }
  }

  function pruneCacheEntry (
    cache,
    key,
    keys,
    current
  ) {
    var cached = cache[key];
    if (cached && (!current || cached.tag !== current.tag)) {
      cached.componentInstance.$destroy();
    }
    cache[key] = null;
    remove(keys, key);
  }

  var patternTypes = [String, RegExp, Array];

  var KeepAlive = {
    name: 'keep-alive',
    abstract: true,

    props: {
      include: patternTypes,
      exclude: patternTypes,
      max: [String, Number]
    },

    created: function created () {
      this.cache = Object.create(null);
      this.keys = [];
    },

    destroyed: function destroyed () {
      for (var key in this.cache) {
        pruneCacheEntry(this.cache, key, this.keys);
      }
    },

    mounted: function mounted () {
      var this$1 = this;

      this.$watch('include', function (val) {
        pruneCache(this$1, function (name) { return matches(val, name); });
      });
      this.$watch('exclude', function (val) {
        pruneCache(this$1, function (name) { return !matches(val, name); });
      });
    },

    render: function render () {
      var slot = this.$slots.default;
      var vnode = getFirstComponentChild(slot);
      var componentOptions = vnode && vnode.componentOptions;
      if (componentOptions) {
        // check pattern
        var name = getComponentName(componentOptions);
        var ref = this;
        var include = ref.include;
        var exclude = ref.exclude;
        if (
          // not included
          (include && (!name || !matches(include, name))) ||
          // excluded
          (exclude && name && matches(exclude, name))
        ) {
          return vnode
        }

        var ref$1 = this;
        var cache = ref$1.cache;
        var keys = ref$1.keys;
        var key = vnode.key == null
          // same constructor may get registered as different local components
          // so cid alone is not enough (#3269)
          ? componentOptions.Ctor.cid + (componentOptions.tag ? ("::" + (componentOptions.tag)) : '')
          : vnode.key;
        if (cache[key]) {
          vnode.componentInstance = cache[key].componentInstance;
          // make current key freshest
          remove(keys, key);
          keys.push(key);
        } else {
          cache[key] = vnode;
          keys.push(key);
          // prune oldest entry
          if (this.max && keys.length > parseInt(this.max)) {
            pruneCacheEntry(cache, keys[0], keys, this._vnode);
          }
        }

        vnode.data.keepAlive = true;
      }
      return vnode || (slot && slot[0])
    }
  };

  var builtInComponents = {
    KeepAlive: KeepAlive
  };

  /*  */

  function initGlobalAPI (Vue) {
    // config
    var configDef = {};
    configDef.get = function () { return config; };
    {
      configDef.set = function () {
        warn(
          'Do not replace the Vue.config object, set individual fields instead.'
        );
      };
    }
    Object.defineProperty(Vue, 'config', configDef);

    // exposed util methods.
    // NOTE: these are not considered part of the public API - avoid relying on
    // them unless you are aware of the risk.
    Vue.util = {
      warn: warn,
      extend: extend,
      mergeOptions: mergeOptions,
      defineReactive: defineReactive
    };

    Vue.set = set;
    Vue.delete = del;
    Vue.nextTick = nextTick;

    // 2.6 explicit observable API
    // <T>(obj: T):
    Vue.observable =  function (T) {
      observe(obj);
      return obj
    };

    Vue.options = Object.create(null);
    ASSET_TYPES.forEach(function (type) {
      Vue.options[type + 's'] = Object.create(null);
    });

    // this is used to identify the "base" constructor to extend all plain-object
    // components with in Weex's multi-instance scenarios.
    Vue.options._base = Vue;

    extend(Vue.options.components, builtInComponents);

    initUse(Vue);
    initMixin$1(Vue);
    initExtend(Vue);
    initAssetRegisters(Vue);
  }

  // 这里又引入了Vue

  // 初始化全局API //例如use extend mixin set del todo:
  initGlobalAPI(Vue);

  Object.defineProperty(Vue.prototype, '$isServer', {
    get: isServerRendering
  });

  Object.defineProperty(Vue.prototype, '$ssrContext', {
    get: function get () {
      /* istanbul ignore next */
      return this.$vnode && this.$vnode.ssrContext
    }
  });

  // expose FunctionalRenderContext for ssr runtime helper installation
  // 暴露 FunctionalRenderContext 给 ssr runtime安装助手
  Object.defineProperty(Vue, 'FunctionalRenderContext', {
    value: FunctionalRenderContext
  });

  Vue.version = '2.6.9';

  /*  */

  // these are reserved for web because they are directly compiled away
  // during template compilation
  var isReservedAttr = makeMap('style,class');

  // attributes that should be using props for binding
  // 应该使用属性进行绑定的属性
  var acceptValue = makeMap('input,textarea,option,select,progress');
  var mustUseProp = function (tag, type, attr) {
    return (
      (attr === 'value' && acceptValue(tag)) && type !== 'button' ||
      (attr === 'selected' && tag === 'option') ||
      (attr === 'checked' && tag === 'input') ||
      (attr === 'muted' && tag === 'video')
    )
  };

  var isEnumeratedAttr = makeMap('contenteditable,draggable,spellcheck');

  var isValidContentEditableValue = makeMap('events,caret,typing,plaintext-only');

  var convertEnumeratedValue = function (key, value) {
    return isFalsyAttrValue(value) || value === 'false'
      ? 'false'
      // allow arbitrary string value for contenteditable
      : key === 'contenteditable' && isValidContentEditableValue(value)
        ? value
        : 'true'
  };

  var isBooleanAttr = makeMap(
    'allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,' +
    'default,defaultchecked,defaultmuted,defaultselected,defer,disabled,' +
    'enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,' +
    'muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,' +
    'required,reversed,scoped,seamless,selected,sortable,translate,' +
    'truespeed,typemustmatch,visible'
  );

  var xlinkNS = 'http://www.w3.org/1999/xlink';

  var isXlink = function (name) {
    return name.charAt(5) === ':' && name.slice(0, 5) === 'xlink'
  };

  var getXlinkProp = function (name) {
    return isXlink(name) ? name.slice(6, name.length) : ''
  };

  var isFalsyAttrValue = function (val) {
    return val == null || val === false
  };

  /*  */

  function genClassForVnode (vnode) {
    var data = vnode.data;
    var parentNode = vnode;
    var childNode = vnode;
    while (isDef(childNode.componentInstance)) {
      childNode = childNode.componentInstance._vnode;
      if (childNode && childNode.data) {
        data = mergeClassData(childNode.data, data);
      }
    }
    while (isDef(parentNode = parentNode.parent)) {
      if (parentNode && parentNode.data) {
        data = mergeClassData(data, parentNode.data);
      }
    }
    return renderClass(data.staticClass, data.class)
  }

  function mergeClassData (child, parent) {
    return {
      staticClass: concat(child.staticClass, parent.staticClass),
      class: isDef(child.class)
        ? [child.class, parent.class]
        : parent.class
    }
  }

  function renderClass (
    staticClass,
    dynamicClass
  ) {
    if (isDef(staticClass) || isDef(dynamicClass)) {
      return concat(staticClass, stringifyClass(dynamicClass))
    }
    /* istanbul ignore next */
    return ''
  }

  function concat (a, b) {
    return a ? b ? (a + ' ' + b) : a : (b || '')
  }

  function stringifyClass (value) {
    if (Array.isArray(value)) {
      return stringifyArray(value)
    }
    if (isObject(value)) {
      return stringifyObject(value)
    }
    if (typeof value === 'string') {
      return value
    }
    /* istanbul ignore next */
    return ''
  }

  function stringifyArray (value) {
    var res = '';
    var stringified;
    for (var i = 0, l = value.length; i < l; i++) {
      if (isDef(stringified = stringifyClass(value[i])) && stringified !== '') {
        if (res) { res += ' '; }
        res += stringified;
      }
    }
    return res
  }

  function stringifyObject (value) {
    var res = '';
    for (var key in value) {
      if (value[key]) {
        if (res) { res += ' '; }
        res += key;
      }
    }
    return res
  }

  /*  */

  var namespaceMap = {
    svg: 'http://www.w3.org/2000/svg',
    math: 'http://www.w3.org/1998/Math/MathML'
  };

  var isHTMLTag = makeMap(
    'html,body,base,head,link,meta,style,title,' +
    'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
    'div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,' +
    'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
    's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
    'embed,object,param,source,canvas,script,noscript,del,ins,' +
    'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
    'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
    'output,progress,select,textarea,' +
    'details,dialog,menu,menuitem,summary,' +
    'content,element,shadow,template,blockquote,iframe,tfoot'
  );

  // this map is intentionally selective, only covering SVG elements that may
  // contain child elements.
  var isSVG = makeMap(
    'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,' +
    'foreignObject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
    'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
    true
  );

  // 判断是否是pre
  var isPreTag = function (tag) { return tag === 'pre'; };

  // 是否是HTML标签或是SVG标签
  var isReservedTag = function (tag) {
    return isHTMLTag(tag) || isSVG(tag)
  };

  // 判断是否是svg或math标签
  function getTagNamespace (tag) {
    if (isSVG(tag)) {
      return 'svg'
    }
    // basic support for MathML
    // note it doesn't support other MathML elements being component roots
    // 对MathML的基本支持注意，它不支持其他MathML元素作为组件根
    if (tag === 'math') {
      return 'math'
    }
  }

  var unknownElementCache = Object.create(null);
  function isUnknownElement (tag) {
    /* istanbul ignore if */
    if (!inBrowser) {
      return true
    }
    if (isReservedTag(tag)) {
      return false
    }
    tag = tag.toLowerCase();
    /* istanbul ignore if */
    if (unknownElementCache[tag] != null) {
      return unknownElementCache[tag]
    }
    var el = document.createElement(tag);
    if (tag.indexOf('-') > -1) {
      // http://stackoverflow.com/a/28210364/1070244
      return (unknownElementCache[tag] = (
        el.constructor === window.HTMLUnknownElement ||
        el.constructor === window.HTMLElement
      ))
    } else {
      return (unknownElementCache[tag] = /HTMLUnknownElement/.test(el.toString()))
    }
  }

  var isTextInputType = makeMap('text,number,password,search,email,tel,url');

  /*  */

  /**
   * Query an element selector if it's not an element already.
   */
  // 获取形式为“#app”的el的节点元素
  function query (el) {
    // 如果为字符串 “#app”
    if (typeof el === 'string') {
      // 通过#app 获取到元素节点
      var selected = document.querySelector(el);
      // 如果不存在节点
      if (!selected) {
         warn(
          'Cannot find element: ' + el
        );
        // 返回div
        return document.createElement('div')
      }
      // 返回获取到的节点
      return selected
    } else {
      // 如果不是字符串 "#app"形式，直接返回el
      return el
    }  
  }

  /*  */

  function createElement$1 (tagName, vnode) {
    var elm = document.createElement(tagName);
    if (tagName !== 'select') {
      return elm
    }
    // false or null will remove the attribute but undefined will not
    if (vnode.data && vnode.data.attrs && vnode.data.attrs.multiple !== undefined) {
      elm.setAttribute('multiple', 'multiple');
    }
    return elm
  }

  function createElementNS (namespace, tagName) {
    return document.createElementNS(namespaceMap[namespace], tagName)
  }

  function createTextNode (text) {
    return document.createTextNode(text)
  }

  function createComment (text) {
    return document.createComment(text)
  }

  function insertBefore (parentNode, newNode, referenceNode) {
    parentNode.insertBefore(newNode, referenceNode);
  }

  function removeChild (node, child) {
    node.removeChild(child);
  }

  function appendChild (node, child) {
    node.appendChild(child);
  }

  function parentNode (node) {
    return node.parentNode
  }

  function nextSibling (node) {
    return node.nextSibling
  }

  function tagName (node) {
    return node.tagName
  }

  function setTextContent (node, text) {
    node.textContent = text;
  }

  function setStyleScope (node, scopeId) {
    node.setAttribute(scopeId, '');
  }

  var nodeOps = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createElement: createElement$1,
    createElementNS: createElementNS,
    createTextNode: createTextNode,
    createComment: createComment,
    insertBefore: insertBefore,
    removeChild: removeChild,
    appendChild: appendChild,
    parentNode: parentNode,
    nextSibling: nextSibling,
    tagName: tagName,
    setTextContent: setTextContent,
    setStyleScope: setStyleScope
  });

  /*  */

  var ref = {
    create: function create (_, vnode) {
      registerRef(vnode);
    },
    update: function update (oldVnode, vnode) {
      if (oldVnode.data.ref !== vnode.data.ref) {
        registerRef(oldVnode, true);
        registerRef(vnode);
      }
    },
    destroy: function destroy (vnode) {
      registerRef(vnode, true);
    }
  };

  function registerRef (vnode, isRemoval) {
    var key = vnode.data.ref;
    if (!isDef(key)) { return }

    var vm = vnode.context;
    var ref = vnode.componentInstance || vnode.elm;
    var refs = vm.$refs;
    if (isRemoval) {
      if (Array.isArray(refs[key])) {
        remove(refs[key], ref);
      } else if (refs[key] === ref) {
        refs[key] = undefined;
      }
    } else {
      if (vnode.data.refInFor) {
        if (!Array.isArray(refs[key])) {
          refs[key] = [ref];
        } else if (refs[key].indexOf(ref) < 0) {
          // $flow-disable-line
          refs[key].push(ref);
        }
      } else {
        refs[key] = ref;
      }
    }
  }

  /**
   * Virtual DOM patching algorithm based on Snabbdom by
   * Simon Friis Vindum (@paldepind)
   * Licensed under the MIT License
   * https://github.com/paldepind/snabbdom/blob/master/LICENSE
   *
   * modified by Evan You (@yyx990803)
   *
   * Not type-checking this because this file is perf-critical and the cost
   * of making flow understand it is not worth it.
   */

  var emptyNode = new VNode('', {}, []);

  var hooks = ['create', 'activate', 'update', 'remove', 'destroy'];

  function sameVnode (a, b) {
    return (
      a.key === b.key && (
        (
          a.tag === b.tag &&
          a.isComment === b.isComment &&
          isDef(a.data) === isDef(b.data) &&
          sameInputType(a, b)
        ) || (
          isTrue(a.isAsyncPlaceholder) &&
          a.asyncFactory === b.asyncFactory &&
          isUndef(b.asyncFactory.error)
        )
      )
    )
  }

  function sameInputType (a, b) {
    if (a.tag !== 'input') { return true }
    var i;
    var typeA = isDef(i = a.data) && isDef(i = i.attrs) && i.type;
    var typeB = isDef(i = b.data) && isDef(i = i.attrs) && i.type;
    return typeA === typeB || isTextInputType(typeA) && isTextInputType(typeB)
  }
  // 创建map函数
  function createKeyToOldIdx (children, beginIdx, endIdx) {
    var i, key;
    var map = {};
    for (i = beginIdx; i <= endIdx; ++i) {
      key = children[i].key;
      if (isDef(key)) { map[key] = i; }
    }
    return map
  }

  function createPatchFunction (backend) {
    var i, j;
    var cbs = {};

    var modules = backend.modules;
    var nodeOps = backend.nodeOps;

    for (i = 0; i < hooks.length; ++i) {
      cbs[hooks[i]] = [];
      for (j = 0; j < modules.length; ++j) {
        if (isDef(modules[j][hooks[i]])) {
          cbs[hooks[i]].push(modules[j][hooks[i]]);
        }
      }
    }

    function emptyNodeAt (elm) {
      return new VNode(nodeOps.tagName(elm).toLowerCase(), {}, [], undefined, elm)
    }

    function createRmCb (childElm, listeners) {
      function remove () {
        if (--remove.listeners === 0) {
          removeNode(childElm);
        }
      }
      remove.listeners = listeners;
      return remove
    }

    function removeNode (el) {
      var parent = nodeOps.parentNode(el);
      // element may have already been removed due to v-html / v-text
      if (isDef(parent)) {
        nodeOps.removeChild(parent, el);
      }
    }

    function isUnknownElement (vnode, inVPre) {
      return (
        !inVPre &&
        !vnode.ns &&
        !(
          config.ignoredElements.length &&
          config.ignoredElements.some(function (ignore) {
            return isRegExp(ignore)
              ? ignore.test(vnode.tag)
              : ignore === vnode.tag
          })
        ) &&
        config.isUnknownElement(vnode.tag)
      )
    }

    var creatingElmInVPre = 0;

    function createElm (
      vnode,
      insertedVnodeQueue,
      parentElm,
      refElm,
      nested,
      ownerArray,
      index
    ) {
      if (isDef(vnode.elm) && isDef(ownerArray)) {
        // This vnode was used in a previous render!
        // now it's used as a new node, overwriting its elm would cause
        // potential patch errors down the road when it's used as an insertion
        // reference node. Instead, we clone the node on-demand before creating
        // associated DOM element for it.
        vnode = ownerArray[index] = cloneVNode(vnode);
      }

      vnode.isRootInsert = !nested; // for transition enter check
      if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
        return
      }

      var data = vnode.data;
      var children = vnode.children;
      var tag = vnode.tag;
      if (isDef(tag)) {
        {
          if (data && data.pre) {
            creatingElmInVPre++;
          }
          if (isUnknownElement(vnode, creatingElmInVPre)) {
            warn(
              'Unknown custom element: <' + tag + '> - did you ' +
              'register the component correctly? For recursive components, ' +
              'make sure to provide the "name" option.',
              vnode.context
            );
          }
        }

        vnode.elm = vnode.ns
          ? nodeOps.createElementNS(vnode.ns, tag)
          : nodeOps.createElement(tag, vnode);
        setScope(vnode);

        /* istanbul ignore if */
        {
          createChildren(vnode, children, insertedVnodeQueue);
          if (isDef(data)) {
            invokeCreateHooks(vnode, insertedVnodeQueue);
          }
          insert(parentElm, vnode.elm, refElm);
        }

        if ( data && data.pre) {
          creatingElmInVPre--;
        }
      } else if (isTrue(vnode.isComment)) {
        vnode.elm = nodeOps.createComment(vnode.text);
        insert(parentElm, vnode.elm, refElm);
      } else {
        vnode.elm = nodeOps.createTextNode(vnode.text);
        insert(parentElm, vnode.elm, refElm);
      }
    }

    function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
      var i = vnode.data;
      if (isDef(i)) {
        var isReactivated = isDef(vnode.componentInstance) && i.keepAlive;
        if (isDef(i = i.hook) && isDef(i = i.init)) {
          i(vnode, false /* hydrating */);
        }
        // after calling the init hook, if the vnode is a child component
        // it should've created a child instance and mounted it. the child
        // component also has set the placeholder vnode's elm.
        // in that case we can just return the element and be done.
        // 调用init hook之后，如果vnode是子组件它应该创建一个子实例并挂载它。孩子组件还设置了占位符vnode的elm。在这种情况下，我们只需返回元素就可以了。
        if (isDef(vnode.componentInstance)) {
          initComponent(vnode, insertedVnodeQueue);
          insert(parentElm, vnode.elm, refElm);
          if (isTrue(isReactivated)) {
            reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm);
          }
          return true
        }
      }
    }

    function initComponent (vnode, insertedVnodeQueue) {
      if (isDef(vnode.data.pendingInsert)) {
        insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert);
        vnode.data.pendingInsert = null;
      }
      vnode.elm = vnode.componentInstance.$el;
      if (isPatchable(vnode)) {
        invokeCreateHooks(vnode, insertedVnodeQueue);
        setScope(vnode);
      } else {
        // empty component root.
        // skip all element-related modules except for ref (#3455)
        registerRef(vnode);
        // make sure to invoke the insert hook
        insertedVnodeQueue.push(vnode);
      }
    }

    function reactivateComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
      var i;
      // hack for #4339: a reactivated component with inner transition
      // does not trigger because the inner node's created hooks are not called
      // again. It's not ideal to involve module-specific logic in here but
      // there doesn't seem to be a better way to do it.
      var innerNode = vnode;
      while (innerNode.componentInstance) {
        innerNode = innerNode.componentInstance._vnode;
        if (isDef(i = innerNode.data) && isDef(i = i.transition)) {
          for (i = 0; i < cbs.activate.length; ++i) {
            cbs.activate[i](emptyNode, innerNode);
          }
          insertedVnodeQueue.push(innerNode);
          break
        }
      }
      // unlike a newly created component,
      // a reactivated keep-alive component doesn't insert itself
      insert(parentElm, vnode.elm, refElm);
    }

    function insert (parent, elm, ref) {
      if (isDef(parent)) {
        if (isDef(ref)) {
          if (nodeOps.parentNode(ref) === parent) {
            nodeOps.insertBefore(parent, elm, ref);
          }
        } else {
          nodeOps.appendChild(parent, elm);
        }
      }
    }

    function createChildren (vnode, children, insertedVnodeQueue) {
      if (Array.isArray(children)) {
        {
          checkDuplicateKeys(children);
        }
        for (var i = 0; i < children.length; ++i) {
          createElm(children[i], insertedVnodeQueue, vnode.elm, null, true, children, i);
        }
      } else if (isPrimitive(vnode.text)) {
        nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)));
      }
    }

    function isPatchable (vnode) {
      while (vnode.componentInstance) {
        vnode = vnode.componentInstance._vnode;
      }
      return isDef(vnode.tag)
    }

    function invokeCreateHooks (vnode, insertedVnodeQueue) {
      for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
        cbs.create[i$1](emptyNode, vnode);
      }
      i = vnode.data.hook; // Reuse variable
      if (isDef(i)) {
        if (isDef(i.create)) { i.create(emptyNode, vnode); }
        if (isDef(i.insert)) { insertedVnodeQueue.push(vnode); }
      }
    }

    // set scope id attribute for scoped CSS.
    // this is implemented as a special case to avoid the overhead
    // of going through the normal attribute patching process.
    function setScope (vnode) {
      var i;
      if (isDef(i = vnode.fnScopeId)) {
        nodeOps.setStyleScope(vnode.elm, i);
      } else {
        var ancestor = vnode;
        while (ancestor) {
          if (isDef(i = ancestor.context) && isDef(i = i.$options._scopeId)) {
            nodeOps.setStyleScope(vnode.elm, i);
          }
          ancestor = ancestor.parent;
        }
      }
      // for slot content they should also get the scopeId from the host instance.
      if (isDef(i = activeInstance) &&
        i !== vnode.context &&
        i !== vnode.fnContext &&
        isDef(i = i.$options._scopeId)
      ) {
        nodeOps.setStyleScope(vnode.elm, i);
      }
    }

    function addVnodes (parentElm, refElm, vnodes, startIdx, endIdx, insertedVnodeQueue) {
      for (; startIdx <= endIdx; ++startIdx) {
        createElm(vnodes[startIdx], insertedVnodeQueue, parentElm, refElm, false, vnodes, startIdx);
      }
    }

    function invokeDestroyHook (vnode) {
      var i, j;
      var data = vnode.data;
      if (isDef(data)) {
        if (isDef(i = data.hook) && isDef(i = i.destroy)) { i(vnode); }
        for (i = 0; i < cbs.destroy.length; ++i) { cbs.destroy[i](vnode); }
      }
      if (isDef(i = vnode.children)) {
        for (j = 0; j < vnode.children.length; ++j) {
          invokeDestroyHook(vnode.children[j]);
        }
      }
    }

    function removeVnodes (parentElm, vnodes, startIdx, endIdx) {
      for (; startIdx <= endIdx; ++startIdx) {
        var ch = vnodes[startIdx];
        if (isDef(ch)) {
          if (isDef(ch.tag)) {
            removeAndInvokeRemoveHook(ch);
            invokeDestroyHook(ch);
          } else { // Text node
            removeNode(ch.elm);
          }
        }
      }
    }

    function removeAndInvokeRemoveHook (vnode, rm) {
      if (isDef(rm) || isDef(vnode.data)) {
        var i;
        var listeners = cbs.remove.length + 1;
        if (isDef(rm)) {
          // we have a recursively passed down rm callback
          // increase the listeners count
          rm.listeners += listeners;
        } else {
          // directly removing
          rm = createRmCb(vnode.elm, listeners);
        }
        // recursively invoke hooks on child component root node
        if (isDef(i = vnode.componentInstance) && isDef(i = i._vnode) && isDef(i.data)) {
          removeAndInvokeRemoveHook(i, rm);
        }
        for (i = 0; i < cbs.remove.length; ++i) {
          cbs.remove[i](vnode, rm);
        }
        if (isDef(i = vnode.data.hook) && isDef(i = i.remove)) {
          i(vnode, rm);
        } else {
          rm();
        }
      } else {
        removeNode(vnode.elm);
      }
    }



  // 新老都是数组 由于有些数据可能只是位置变了
  // vue针对web业务的特点，在数组diff的时候，做了几个小优化
  // 因为web数组常见的修改如下，所以它会对dom改变进行猜测
  // 1.新增元素
  // 2.删除元素
  // 3.倒序排列一个元素

  // 所以每次遍历前，他会猜测一下
  // 老的数组派头，新的数组派头，如果他两一样，直接就进行更新元素的逻辑，而不是用数组diff这个元素了
  //  中间细呢子一个元素
  // 老的数组排尾，新的数组排尾 如果一样
  // 老数组的排头， 新数组的排尾
  // 老数组的排尾， 新数组的排头
  // 4波猜测对比，如果猜中了，就会缩小便利的范围
  // 上面都没中，那就只能走遍历的逻辑
  // dom diff最核心的逻辑 vm._update 执行的diff
    function updateChildren (parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
      // dom diff核心逻辑
      var oldStartIdx = 0;
      var newStartIdx = 0;
      var oldEndIdx = oldCh.length - 1;
      var oldStartVnode = oldCh[0];
      var oldEndVnode = oldCh[oldEndIdx];
      var newEndIdx = newCh.length - 1;
      var newStartVnode = newCh[0];
      var newEndVnode = newCh[newEndIdx];
      var oldKeyToIdx, idxInOld, vnodeToMove, refElm;

      // removeOnly is a special flag used only by <transition-group>
      // to ensure removed elements stay in correct relative positions
      // during leaving transitions
      var canMove = !removeOnly;

      {
        checkDuplicateKeys(newCh);
      }

      while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
        if (isUndef(oldStartVnode)) {
          oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
        } else if (isUndef(oldEndVnode)) {
          oldEndVnode = oldCh[--oldEndIdx];
          // 如果老排头和新排头一样
        } else if (sameVnode(oldStartVnode, newStartVnode)) {
          patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
          oldStartVnode = oldCh[++oldStartIdx];
          newStartVnode = newCh[++newStartIdx];
        } else if (sameVnode(oldEndVnode, newEndVnode)) {
          patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
          oldEndVnode = oldCh[--oldEndIdx];
          newEndVnode = newCh[--newEndIdx];
        } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
          patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
          canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
          oldStartVnode = oldCh[++oldStartIdx];
          newEndVnode = newCh[--newEndIdx];
        } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
          patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
          canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
          oldEndVnode = oldCh[--oldEndIdx];
          newStartVnode = newCh[++newStartIdx];
        } else {
          // 如果四种情况都没猜中
          // oldch 是一个旧虚拟节点数组
          if (isUndef(oldKeyToIdx)) { oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx); }
          idxInOld = isDef(newStartVnode.key)
            // map方式获取
            ? oldKeyToIdx[newStartVnode.key]
            // 遍历方式获取
            : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
          if (isUndef(idxInOld)) { // New element
            createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
          } else {
            vnodeToMove = oldCh[idxInOld];
            if (sameVnode(vnodeToMove, newStartVnode)) {
              patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
              oldCh[idxInOld] = undefined;
              canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
            } else {
              // same key but different element. treat as new element
              createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
            }
          }
          newStartVnode = newCh[++newStartIdx];
        }
      }
      if (oldStartIdx > oldEndIdx) {
        refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
        addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
      } else if (newStartIdx > newEndIdx) {
        removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
      }
    }

    function checkDuplicateKeys (children) {
      var seenKeys = {};
      for (var i = 0; i < children.length; i++) {
        var vnode = children[i];
        var key = vnode.key;
        if (isDef(key)) {
          if (seenKeys[key]) {
            warn(
              ("Duplicate keys detected: '" + key + "'. This may cause an update error."),
              vnode.context
            );
          } else {
            seenKeys[key] = true;
          }
        }
      }
    }
    // sameVnode 是对比新旧节点是否相同的函数 
    // 遍历寻找
    function findIdxInOld (node, oldCh, start, end) {
      for (var i = start; i < end; i++) {
        var c = oldCh[i];
        if (isDef(c) && sameVnode(node, c)) { return i }
      }
    }

    function patchVnode (
      oldVnode,
      vnode,
      insertedVnodeQueue,
      ownerArray,
      index,
      removeOnly
    ) {
      if (oldVnode === vnode) {
        return
      }

      if (isDef(vnode.elm) && isDef(ownerArray)) {
        // clone reused vnode
        vnode = ownerArray[index] = cloneVNode(vnode);
      }

      var elm = vnode.elm = oldVnode.elm;

      if (isTrue(oldVnode.isAsyncPlaceholder)) {
        if (isDef(vnode.asyncFactory.resolved)) {
          hydrate(oldVnode.elm, vnode, insertedVnodeQueue);
        } else {
          vnode.isAsyncPlaceholder = true;
        }
        return
      }

      // reuse element for static trees.
      // note we only do this if the vnode is cloned -
      // if the new node is not cloned it means the render functions have been
      // reset by the hot-reload-api and we need to do a proper re-render.
      if (isTrue(vnode.isStatic) &&
        isTrue(oldVnode.isStatic) &&
        vnode.key === oldVnode.key &&
        (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
      ) {
        vnode.componentInstance = oldVnode.componentInstance;
        return
      }

      var i;
      var data = vnode.data;
      if (isDef(data) && isDef(i = data.hook) && isDef(i = i.prepatch)) {
        i(oldVnode, vnode);
      }

      var oldCh = oldVnode.children;
      var ch = vnode.children;
      if (isDef(data) && isPatchable(vnode)) {
        for (i = 0; i < cbs.update.length; ++i) { cbs.update[i](oldVnode, vnode); }
        if (isDef(i = data.hook) && isDef(i = i.update)) { i(oldVnode, vnode); }
      }
      if (isUndef(vnode.text)) {
        if (isDef(oldCh) && isDef(ch)) {
          if (oldCh !== ch) { updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly); }
        } else if (isDef(ch)) {
          {
            checkDuplicateKeys(ch);
          }
          if (isDef(oldVnode.text)) { nodeOps.setTextContent(elm, ''); }
          addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
        } else if (isDef(oldCh)) {
          removeVnodes(elm, oldCh, 0, oldCh.length - 1);
        } else if (isDef(oldVnode.text)) {
          nodeOps.setTextContent(elm, '');
        }
      } else if (oldVnode.text !== vnode.text) {
        nodeOps.setTextContent(elm, vnode.text);
      }
      if (isDef(data)) {
        if (isDef(i = data.hook) && isDef(i = i.postpatch)) { i(oldVnode, vnode); }
      }
    }

    function invokeInsertHook (vnode, queue, initial) {
      // delay insert hooks for component root nodes, invoke them after the
      // element is really inserted
      if (isTrue(initial) && isDef(vnode.parent)) {
        vnode.parent.data.pendingInsert = queue;
      } else {
        for (var i = 0; i < queue.length; ++i) {
          queue[i].data.hook.insert(queue[i]);
        }
      }
    }

    var hydrationBailed = false;
    // list of modules that can skip create hook during hydration because they
    // are already rendered on the client or has no need for initialization
    // Note: style is excluded because it relies on initial clone for future
    // deep updates (#7063).
    var isRenderedModule = makeMap('attrs,class,staticClass,staticStyle,key');

    // Note: this is a browser-only function so we can assume elms are DOM nodes.
    function hydrate (elm, vnode, insertedVnodeQueue, inVPre) {
      var i;
      var tag = vnode.tag;
      var data = vnode.data;
      var children = vnode.children;
      inVPre = inVPre || (data && data.pre);
      vnode.elm = elm;

      if (isTrue(vnode.isComment) && isDef(vnode.asyncFactory)) {
        vnode.isAsyncPlaceholder = true;
        return true
      }
      // assert node match
      {
        if (!assertNodeMatch(elm, vnode, inVPre)) {
          return false
        }
      }
      if (isDef(data)) {
        if (isDef(i = data.hook) && isDef(i = i.init)) { i(vnode, true /* hydrating */); }
        if (isDef(i = vnode.componentInstance)) {
          // child component. it should have hydrated its own tree.
          initComponent(vnode, insertedVnodeQueue);
          return true
        }
      }
      if (isDef(tag)) {
        if (isDef(children)) {
          // empty element, allow client to pick up and populate children
          if (!elm.hasChildNodes()) {
            createChildren(vnode, children, insertedVnodeQueue);
          } else {
            // v-html and domProps: innerHTML
            if (isDef(i = data) && isDef(i = i.domProps) && isDef(i = i.innerHTML)) {
              if (i !== elm.innerHTML) {
                /* istanbul ignore if */
                if (
                  typeof console !== 'undefined' &&
                  !hydrationBailed
                ) {
                  hydrationBailed = true;
                  console.warn('Parent: ', elm);
                  console.warn('server innerHTML: ', i);
                  console.warn('client innerHTML: ', elm.innerHTML);
                }
                return false
              }
            } else {
              // iterate and compare children lists
              var childrenMatch = true;
              var childNode = elm.firstChild;
              for (var i$1 = 0; i$1 < children.length; i$1++) {
                if (!childNode || !hydrate(childNode, children[i$1], insertedVnodeQueue, inVPre)) {
                  childrenMatch = false;
                  break
                }
                childNode = childNode.nextSibling;
              }
              // if childNode is not null, it means the actual childNodes list is
              // longer than the virtual children list.
              if (!childrenMatch || childNode) {
                /* istanbul ignore if */
                if (
                  typeof console !== 'undefined' &&
                  !hydrationBailed
                ) {
                  hydrationBailed = true;
                  console.warn('Parent: ', elm);
                  console.warn('Mismatching childNodes vs. VNodes: ', elm.childNodes, children);
                }
                return false
              }
            }
          }
        }
        if (isDef(data)) {
          var fullInvoke = false;
          for (var key in data) {
            if (!isRenderedModule(key)) {
              fullInvoke = true;
              invokeCreateHooks(vnode, insertedVnodeQueue);
              break
            }
          }
          if (!fullInvoke && data['class']) {
            // ensure collecting deps for deep class bindings for future updates
            traverse(data['class']);
          }
        }
      } else if (elm.data !== vnode.text) {
        elm.data = vnode.text;
      }
      return true
    }

    function assertNodeMatch (node, vnode, inVPre) {
      if (isDef(vnode.tag)) {
        return vnode.tag.indexOf('vue-component') === 0 || (
          !isUnknownElement(vnode, inVPre) &&
          vnode.tag.toLowerCase() === (node.tagName && node.tagName.toLowerCase())
        )
      } else {
        return node.nodeType === (vnode.isComment ? 8 : 3)
      }
    }
    // 返回
    return function patch (oldVnode, vnode, hydrating, removeOnly) {
      if (isUndef(vnode)) {
        if (isDef(oldVnode)) { invokeDestroyHook(oldVnode); }
        return
      }

      var isInitialPatch = false;
      var insertedVnodeQueue = [];

      if (isUndef(oldVnode)) {
        // empty mount (likely as component), create new root element
        isInitialPatch = true;
        createElm(vnode, insertedVnodeQueue);
      } else { //这里开始核心逻辑
        var isRealElement = isDef(oldVnode.nodeType);
        if (!isRealElement && sameVnode(oldVnode, vnode)) {
          // patch existing root node
          patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly);
        } else {
          if (isRealElement) {
            // mounting to a real element
            // check if this is server-rendered content and if we can perform
            // a successful hydration.
            if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
              oldVnode.removeAttribute(SSR_ATTR);
              hydrating = true;
            }
            if (isTrue(hydrating)) {
              if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
                invokeInsertHook(vnode, insertedVnodeQueue, true);
                return oldVnode
              } else {
                warn(
                  'The client-side rendered virtual DOM tree is not matching ' +
                  'server-rendered content. This is likely caused by incorrect ' +
                  'HTML markup, for example nesting block-level elements inside ' +
                  '<p>, or missing <tbody>. Bailing hydration and performing ' +
                  'full client-side render.'
                );
              }
            }
            // either not server-rendered, or hydration failed.
            // create an empty node and replace it
            oldVnode = emptyNodeAt(oldVnode);
          }

          // replacing existing element
          var oldElm = oldVnode.elm;
          var parentElm = nodeOps.parentNode(oldElm);

          // create new node
          createElm(
            vnode,
            insertedVnodeQueue,
            // extremely rare edge case: do not insert if old element is in a
            // leaving transition. Only happens when combining transition +
            // keep-alive + HOCs. (#4590)
            oldElm._leaveCb ? null : parentElm,
            nodeOps.nextSibling(oldElm)
          );

          // update parent placeholder node element, recursively
          if (isDef(vnode.parent)) {
            var ancestor = vnode.parent;
            var patchable = isPatchable(vnode);
            while (ancestor) {
              for (var i = 0; i < cbs.destroy.length; ++i) {
                cbs.destroy[i](ancestor);
              }
              ancestor.elm = vnode.elm;
              if (patchable) {
                for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
                  cbs.create[i$1](emptyNode, ancestor);
                }
                // #6513
                // invoke insert hooks that may have been merged by create hooks.
                // e.g. for directives that uses the "inserted" hook.
                var insert = ancestor.data.hook.insert;
                if (insert.merged) {
                  // start at index 1 to avoid re-invoking component mounted hook
                  for (var i$2 = 1; i$2 < insert.fns.length; i$2++) {
                    insert.fns[i$2]();
                  }
                }
              } else {
                registerRef(ancestor);
              }
              ancestor = ancestor.parent;
            }
          }

          // destroy old node
          if (isDef(parentElm)) {
            removeVnodes(parentElm, [oldVnode], 0, 0);
          } else if (isDef(oldVnode.tag)) {
            invokeDestroyHook(oldVnode);
          }
        }
      }

      invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
      return vnode.elm
    }
  }

  /*  */

  var directives = {
    create: updateDirectives,
    update: updateDirectives,
    destroy: function unbindDirectives (vnode) {
      updateDirectives(vnode, emptyNode);
    }
  };

  function updateDirectives (oldVnode, vnode) {
    if (oldVnode.data.directives || vnode.data.directives) {
      _update(oldVnode, vnode);
    }
  }

  function _update (oldVnode, vnode) {
    var isCreate = oldVnode === emptyNode;
    var isDestroy = vnode === emptyNode;
    var oldDirs = normalizeDirectives$1(oldVnode.data.directives, oldVnode.context);
    var newDirs = normalizeDirectives$1(vnode.data.directives, vnode.context);

    var dirsWithInsert = [];
    var dirsWithPostpatch = [];

    var key, oldDir, dir;
    for (key in newDirs) {
      oldDir = oldDirs[key];
      dir = newDirs[key];
      if (!oldDir) {
        // new directive, bind
        callHook$1(dir, 'bind', vnode, oldVnode);
        if (dir.def && dir.def.inserted) {
          dirsWithInsert.push(dir);
        }
      } else {
        // existing directive, update
        dir.oldValue = oldDir.value;
        dir.oldArg = oldDir.arg;
        callHook$1(dir, 'update', vnode, oldVnode);
        if (dir.def && dir.def.componentUpdated) {
          dirsWithPostpatch.push(dir);
        }
      }
    }

    if (dirsWithInsert.length) {
      var callInsert = function () {
        for (var i = 0; i < dirsWithInsert.length; i++) {
          callHook$1(dirsWithInsert[i], 'inserted', vnode, oldVnode);
        }
      };
      if (isCreate) {
        mergeVNodeHook(vnode, 'insert', callInsert);
      } else {
        callInsert();
      }
    }

    if (dirsWithPostpatch.length) {
      mergeVNodeHook(vnode, 'postpatch', function () {
        for (var i = 0; i < dirsWithPostpatch.length; i++) {
          callHook$1(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode);
        }
      });
    }

    if (!isCreate) {
      for (key in oldDirs) {
        if (!newDirs[key]) {
          // no longer present, unbind
          callHook$1(oldDirs[key], 'unbind', oldVnode, oldVnode, isDestroy);
        }
      }
    }
  }

  var emptyModifiers = Object.create(null);

  function normalizeDirectives$1 (
    dirs,
    vm
  ) {
    var res = Object.create(null);
    if (!dirs) {
      // $flow-disable-line
      return res
    }
    var i, dir;
    for (i = 0; i < dirs.length; i++) {
      dir = dirs[i];
      if (!dir.modifiers) {
        // $flow-disable-line
        dir.modifiers = emptyModifiers;
      }
      res[getRawDirName(dir)] = dir;
      dir.def = resolveAsset(vm.$options, 'directives', dir.name, true);
    }
    // $flow-disable-line
    return res
  }

  function getRawDirName (dir) {
    return dir.rawName || ((dir.name) + "." + (Object.keys(dir.modifiers || {}).join('.')))
  }

  function callHook$1 (dir, hook, vnode, oldVnode, isDestroy) {
    var fn = dir.def && dir.def[hook];
    if (fn) {
      try {
        fn(vnode.elm, dir, vnode, oldVnode, isDestroy);
      } catch (e) {
        handleError(e, vnode.context, ("directive " + (dir.name) + " " + hook + " hook"));
      }
    }
  }

  var baseModules = [
    ref,
    directives
  ];

  /*  */

  function updateAttrs (oldVnode, vnode) {
    var opts = vnode.componentOptions;
    if (isDef(opts) && opts.Ctor.options.inheritAttrs === false) {
      return
    }
    if (isUndef(oldVnode.data.attrs) && isUndef(vnode.data.attrs)) {
      return
    }
    var key, cur, old;
    var elm = vnode.elm;
    var oldAttrs = oldVnode.data.attrs || {};
    var attrs = vnode.data.attrs || {};
    // clone observed objects, as the user probably wants to mutate it
    if (isDef(attrs.__ob__)) {
      attrs = vnode.data.attrs = extend({}, attrs);
    }

    for (key in attrs) {
      cur = attrs[key];
      old = oldAttrs[key];
      if (old !== cur) {
        setAttr(elm, key, cur);
      }
    }
    // #4391: in IE9, setting type can reset value for input[type=radio]
    // #6666: IE/Edge forces progress value down to 1 before setting a max
    /* istanbul ignore if */
    if ((isIE || isEdge) && attrs.value !== oldAttrs.value) {
      setAttr(elm, 'value', attrs.value);
    }
    for (key in oldAttrs) {
      if (isUndef(attrs[key])) {
        if (isXlink(key)) {
          elm.removeAttributeNS(xlinkNS, getXlinkProp(key));
        } else if (!isEnumeratedAttr(key)) {
          elm.removeAttribute(key);
        }
      }
    }
  }

  function setAttr (el, key, value) {
    if (el.tagName.indexOf('-') > -1) {
      baseSetAttr(el, key, value);
    } else if (isBooleanAttr(key)) {
      // set attribute for blank value
      // e.g. <option disabled>Select one</option>
      if (isFalsyAttrValue(value)) {
        el.removeAttribute(key);
      } else {
        // technically allowfullscreen is a boolean attribute for <iframe>,
        // but Flash expects a value of "true" when used on <embed> tag
        value = key === 'allowfullscreen' && el.tagName === 'EMBED'
          ? 'true'
          : key;
        el.setAttribute(key, value);
      }
    } else if (isEnumeratedAttr(key)) {
      el.setAttribute(key, convertEnumeratedValue(key, value));
    } else if (isXlink(key)) {
      if (isFalsyAttrValue(value)) {
        el.removeAttributeNS(xlinkNS, getXlinkProp(key));
      } else {
        el.setAttributeNS(xlinkNS, key, value);
      }
    } else {
      baseSetAttr(el, key, value);
    }
  }

  function baseSetAttr (el, key, value) {
    if (isFalsyAttrValue(value)) {
      el.removeAttribute(key);
    } else {
      // #7138: IE10 & 11 fires input event when setting placeholder on
      // <textarea>... block the first input event and remove the blocker
      // immediately.
      /* istanbul ignore if */
      if (
        isIE && !isIE9 &&
        el.tagName === 'TEXTAREA' &&
        key === 'placeholder' && value !== '' && !el.__ieph
      ) {
        var blocker = function (e) {
          e.stopImmediatePropagation();
          el.removeEventListener('input', blocker);
        };
        el.addEventListener('input', blocker);
        // $flow-disable-line
        el.__ieph = true; /* IE placeholder patched */
      }
      el.setAttribute(key, value);
    }
  }

  var attrs = {
    create: updateAttrs,
    update: updateAttrs
  };

  /*  */

  function updateClass (oldVnode, vnode) {
    var el = vnode.elm;
    var data = vnode.data;
    var oldData = oldVnode.data;
    if (
      isUndef(data.staticClass) &&
      isUndef(data.class) && (
        isUndef(oldData) || (
          isUndef(oldData.staticClass) &&
          isUndef(oldData.class)
        )
      )
    ) {
      return
    }

    var cls = genClassForVnode(vnode);

    // handle transition classes
    var transitionClass = el._transitionClasses;
    if (isDef(transitionClass)) {
      cls = concat(cls, stringifyClass(transitionClass));
    }

    // set the class
    if (cls !== el._prevClass) {
      el.setAttribute('class', cls);
      el._prevClass = cls;
    }
  }

  var klass = {
    create: updateClass,
    update: updateClass
  };

  /*  */

  // 匹配 ) 或 . 或 + 或 - 或 _ 或 $ 或 ]
  var validDivisionCharRE = /[\w).+\-_$\]]/;

  // 过滤器解析
  function parseFilters (exp) {
    // 是否在 单引号 ''中
    var inSingle = false;
    // 是否在 双引号 ""中
    var inDouble = false;
    // 是否在 模板字符串 ``中
    var inTemplateString = false;
    // 是否在 正则表达式 \\中
    var inRegex = false;
    // 这个是用来验证{} 括号的，遇到一个{ ，curly+1，遇到} -1 ，变成0就代表 {}
    var curly = 0;
    // 验证 [] 这个 括号的，跟上面一样
    var square = 0;
    // 验证 () 这个 括号的，跟上面一样
    var paren = 0;
    var lastFilterIndex = 0;
    var c, prev, i, expression, filters;

    // 开始循环传入的字符串，
    for (i = 0; i < exp.length; i++) {
      // 获取前一位
      prev = c;
      // 获取当前i的字符
      c = exp.charCodeAt(i);


      if (inSingle) {
        // ' 并且 前一个 不是 \ 转义
        if (c === 0x27 && prev !== 0x5C) { inSingle = false; }
      } else if (inDouble) {
        // " 并且 前一个 不是 \ 转义
        if (c === 0x22 && prev !== 0x5C) { inDouble = false; }
      } else if (inTemplateString) {
        // ` 并且 前一个 不是 \ 转义
        if (c === 0x60 && prev !== 0x5C) { inTemplateString = false; }
      } else if (inRegex) {
        // / 并且 前一个 不是 \ 转义
        if (c === 0x2f && prev !== 0x5C) { inRegex = false; }
      } else if (
        // 如果在 之前不在 ' " ` / 即字符串 或者正则中

        // 那么说明此时是过滤器的一个 分界点
        c === 0x7C && // pipe 当前字符是否是 |
        exp.charCodeAt(i + 1) !== 0x7C && // 并且前一个和后一个都不为 |
        exp.charCodeAt(i - 1) !== 0x7C && // |
        !curly && !square && !paren // 不在{}中 不在[]中 不在()中
      ) {
        // expression 为 undefined 代表前面没有表达式 那么说明这是第一个 "|"
        if (expression === undefined) {
          // first filter, end of expression
          // 第一个过滤器，表达式结束
          lastFilterIndex = i + 1;
          // 存储过滤器的表达式
          expression = exp.slice(0, i).trim();
        } else {
          // 如果之前expression有值，执行PushFilter
          pushFilter();
        }
      } else {
        // 对c 进行匹配
        switch (c) {
          case 0x22: inDouble = true; break         // 匹配 "
          case 0x27: inSingle = true; break         // 匹配 '
          case 0x60: inTemplateString = true; break // 匹配 `
          case 0x28: paren++; break                 // 匹配 (
          case 0x29: paren--; break                 // 匹配 )
          case 0x5B: square++; break                // 匹配 [
          case 0x5D: square--; break                // 匹配 ]
          case 0x7B: curly++; break                 // 匹配 {
          case 0x7D: curly--; break                 // 匹配 }
        }
        if (c === 0x2f) { // /
          var j = i - 1;
          var p = (void 0);
          // find first non-whitespace prev char
          // 查找第一个非空白前一个字符
          for (; j >= 0; j--) {
            p = exp.charAt(j);
            if (p !== ' ') { break }
          }
          // 如果p不存在， 或者p不匹配 ) 或 . 或 + 或 - 或 _ 或 $ 或 ]
          if (!p || !validDivisionCharRE.test(p)) {
            inRegex = true;
          }
        }
      }
    }

    // 如果现在expression 还是 undefined
    if (expression === undefined) {
      // 截取所有
      expression = exp.slice(0, i).trim();
    } else if (lastFilterIndex !== 0) {
      // 如果不为0 代表有单词  执行 pushFilter
      pushFilter();
    }

    // 其实就是获取当前过滤器 并将其存在fliters数组中
    // filters = ['fiter', 'filter']
    function pushFilter () {
      // filters添加 截取的过滤器
      (filters || (filters = [])).push(exp.slice(lastFilterIndex, i).trim());
      lastFilterIndex = i + 1;
    }

    // 如果filter数组存在，代表有过滤器
    if (filters) {
      // 遍历过滤器
      for (i = 0; i < filters.length; i++) {
        // 执行wrapFilter
        // 把过滤器封装成函数 虚拟dom需要渲染的函数
        expression = wrapFilter(expression, filters[i]);
      }
    }

    // 返回执行wrapFilter后的expression
    return expression
  }



  function wrapFilter (exp, filter) {
    // 获取过滤器中的 '(' 的位置信息
    var i = filter.indexOf('(');
    // 小于0 代表过滤器中没有 '('
    if (i < 0) {
      // _f: resolveFilter
      // 按这样式返回
      return ("_f(\"" + filter + "\")(" + exp + ")")
    } else {
      // name 截取到 ( ，也就是(之前的所有字符串 不包括 (
      var name = filter.slice(0, i);
      // args 是从( 截取到最后 也不包含 (
      var args = filter.slice(i + 1);
      // 最后返回这样式
      return ("_f(\"" + name + "\")(" + exp + (args !== ')' ? ',' + args : args))
    }
  }

  /*  */



  /* eslint-disable no-unused-vars */
  function baseWarn (msg, range) {
    console.error(("[Vue compiler]: " + msg));
  }
  /* eslint-enable no-unused-vars */

  // 循环过滤数组或者对象的值，根据key循环 过滤对象或者数组[key]值，
  // 如果不存在则丢弃，如果有相同多个的key值，返回多个值的数组
  function pluckModuleFunction (
    modules,
    key
  ) {
    // 如果存在
    return modules
      // 循环过滤数组，过滤对象或数组的[key]值如果有相同多个的key值，返回多个值的数组
      ? modules.map(function (m) { return m[key]; }).filter(function (_) { return _; })
      // 如果不存在,丢弃
      : []
  }
  // 给AST添加props属性
  function addProp (el, name, value, range, dynamic) {
    // 给el.props添加进经过rangeSetItem的属性
    (el.props || (el.props = [])).push(rangeSetItem({ name: name, value: value, dynamic: dynamic }, range));
    el.plain = false;
  }

  // 添加attrs属性 并将plain置为false
  // addAttr(el, 'slot', slotTarget, getRawBindingAttr(el, 'slot'))
  function addAttr (el, name, value, range, dynamic) {
    var attrs = dynamic
      ? (el.dynamicAttrs || (el.dynamicAttrs = []))
      : (el.attrs || (el.attrs = []));
    attrs.push(rangeSetItem({ name: name, value: value, dynamic: dynamic }, range));
    el.plain = false;
  }

  // add a raw attr (use this in preTransforms)
  // 添加原始属性（在preTransforms中使用）
  // addRawAttr(branch0, 'type', 'checkbox')
  function addRawAttr (el, name, value, range) {
    // 添加attrsMap[type] = checkbox
    el.attrsMap[name] = value;
    // 添加attrsList {type: value}
    el.attrsList.push(rangeSetItem({ name: name, value: value }, range));
  }

  // 为AST添加一个 经过rangeSetItem的directive对象
  function addDirective (
    el,
    name,
    rawName,
    value,
    arg,
    isDynamicArg,
    modifiers,
    range
  ) {
    (el.directives || (el.directives = [])).push(rangeSetItem({
      name: name,
      rawName: rawName,
      value: value,
      arg: arg,
      isDynamicArg: isDynamicArg,
      modifiers: modifiers
    }, range));
    el.plain = false;
  }
  // 返回 symbol+name
  // prependModifierMarker('!', name, dynamic)
  function prependModifierMarker (symbol, name, dynamic) {
    return dynamic
      ? ("_p(" + name + ",\"" + symbol + "\")")
      : symbol + name // mark the event as captured 将事件标记为已捕获
  }

  // addHandler(
  //   el,
  //   `update:${camelize(name)}`,
  //   syncGen,
  //   null,
  //   false,
  //   warn,
  //   list[i]
  // )

  // 为AST添加events 事件对象属性，如果添加@update='updateEvent' 
  // 则此时 AST为el.events.update.value="updateEvent"
  // 或者AST添加nativeEvents 事件对象属性，如果添加@update.native='updateEvent' 
  // 则此时 AST为el.nativeEvents.update.value="updateEvent"
  function addHandler (
    el, // AST
    name, // 事件名
    value, // 事件函数名
    modifiers, // 修饰符
    important, // 根据important为true 把事件添加在前面 假就添加在尾部 
    warn, // 警告函数
    range, // 
    dynamic // 
  ) {
    // 获取修饰符  
    modifiers = modifiers || emptyObject;
    // warn prevent and passive modifier
    /* istanbul ignore if */
    // 如果修饰符同时拥有prevent和passive，直接发出警告
    if (
       warn &&
      modifiers.prevent && modifiers.passive
    ) {
      warn(
        'passive and prevent can\'t be used together. ' +
        'Passive handler can\'t prevent default event.',
        range
      );
    }

    // normalize click.right and click.middle since they don't actually fire
    // this is technically browser-specific, but at least for now browsers are
    // the only target envs that have right/middle clicks.
    // 规范化单击右键以及单击鼠标中键因为他们实际上没有开火
    // 这在技术上是特定于浏览器的，但至少现在浏览器是
    // 只有右键/中键单击的目标环境。

    // 如果修饰符有right 单击鼠标右键
    if (modifiers.right) {
      // 如果有括号
      if (dynamic) {
        // 如果是click事件 则name变成contextment 菜单
        name = "(" + name + ")==='click'?'contextmenu':(" + name + ")";
      // 如果没括号
      } else if (name === 'click') {
        // name变成contextment 菜单
        name = 'contextmenu';
        // 移除modifiers.right
        delete modifiers.right;
      }
    // 如果是鼠标左键点击
    } else if (modifiers.middle) {
      if (dynamic) {
        // 抬起事件
        name = "(" + name + ")==='click'?'mouseup':(" + name + ")";
      } else if (name === 'click') {
        // 抬起事件
        name = 'mouseup';
      }
    }

    // check capture modifier
    // 检查capture修饰符
    // 如果有capture
    if (modifiers.capture) {
      // 删除这个属性
      delete modifiers.capture;
      // !name 标记为capture
      name = prependModifierMarker('!', name, dynamic);
    }
    // 如果是once修饰符
    if (modifiers.once) {
      // 删除once属性
      delete modifiers.once;
      // ~name 标记为once
      name = prependModifierMarker('~', name, dynamic);
    }
    /* istanbul ignore if */
    // 忽略
    // 如果是passive修饰符
    if (modifiers.passive) {
      // 删除passive属性
      delete modifiers.passive;
      // &name 标记为passive
      name = prependModifierMarker('&', name, dynamic);
    }

    var events;
    // 如果有native修饰符
    // 就是在父组件中给子组件绑定一个原生的事件，就将子组件变成了普通的HTML标签，
    // 不加'. native'事件是无法触 发的。
    /*
    * 比如<my-component @click="outClick"></my-component> 这样是不会触发事件的
    * 需要加修饰符<my-component @click.native="outClick"></my-component> 这样是不会触发事件的
    * */
    if (modifiers.native) {
      // 删除natvie属性
      delete modifiers.native;
      // events = nativeEvents
      events = el.nativeEvents || (el.nativeEvents = {});
    // 如果没有native属性
    } else {
      // 直接获取事件对象，如果AST没有events属性则为他添加一个
      events = el.events || (el.events = {});
    }
    // 此时下面操作events 就相当于操作 el.nativeEvents 或者 el.events 对象

    // 把事件函数 去除两边空格  rangeSetItem把start和end也弄过来了
    var newHandler = rangeSetItem({ value: value.trim(), dynamic: dynamic }, range);
    // 如果有修饰符
    if (modifiers !== emptyObject) {
      // 把修饰符也弄过来
      newHandler.modifiers = modifiers;
    }

    // 获取events事件的值
    var handlers = events[name];
    // 忽略
    /* istanbul ignore if */
    // 如果事件是数组
    if (Array.isArray(handlers)) {
      // 根据传入的important 判断是在头部加入事件还是在尾部加入事件
      important ? handlers.unshift(newHandler) : handlers.push(newHandler);
      // 如果handlers已经存在，但是不是数组，所以现在要变成数组
    } else if (handlers) {
      // 将handlers 修改为数组，新的事件和旧的事件一起 
      // 同样顺序也是important决定
      events[name] = important ? [newHandler, handlers] : [handlers, newHandler];
    } else {
      // 不存在，直接获取 
      events[name] = newHandler;
    }
    // plain为false方便取值
    el.plain = false;
  }

  // 通常是warn时，提示用 
  // 返回:name v-bind:name 或name
  function getRawBindingAttr (
    el,
    name
  ) {
    return el.rawAttrsMap[':' + name] ||
      el.rawAttrsMap['v-bind:' + name] ||
      el.rawAttrsMap[name]
  }

  // el class false
  // 获取v-bind:name="属性名" 和 :name="属性名" ，返回属性名经过过滤器解析后的值
  function getBindingAttr (
    el, // el 虚拟dom
    name, // 传入的属性名 class之类
    getStatic // 
  ) {
    // 通过getAndRemoveAttr 获取 :name v-bind:name这种形式 没有的为undefined
    var dynamicValue =
      getAndRemoveAttr(el, ':' + name) ||
      getAndRemoveAttr(el, 'v-bind:' + name);
    // console.log(dynamicValue)
    if (dynamicValue != null) {
      // 返回过滤器解析后的，也就是处理dynamicValue)
      // 如果没过滤器，就返回原值
      return parseFilters(dynamicValue)
    } else if (getStatic !== false) {
      var staticValue = getAndRemoveAttr(el, name);
      if (staticValue != null) {
        return JSON.stringify(staticValue)
      }
    }
  }

  // note: this only removes the attr from the Array (attrsList) so that it
  // doesn't get processed by processAttrs.
  // By default it does NOT remove it from the map (attrsMap) because the map is
  // needed during codegen.
  // 注意：这只会从数组（attrsList）中删除attr，以便
  // 不会被processAttrs处理。
  // 默认情况下，它不会从映射（attrsMap）中删除它，因为映射是
  // 代码生成期间需要。

  // 会从当前el中 将为name的取出，没有的就是undefined
  function getAndRemoveAttr (
    el, // 虚拟dom
    name, // 属性名称 需要删除的属性 name, 获取值的name属性
    removeFromMap // 是否要删除属性的标志
  ) {
    var val;
    // 如果el.attrsMap中name不为Null
    if ((val = el.attrsMap[name]) != null) {
      // el.attrsMap[name]  在name为class时，为全部class
      // console.log(el.attrsMap[name])
      // 按地址引用
      var list = el.attrsList;
      // console.log(list) 属性列表
      // 遍历
      for (var i = 0, l = list.length; i < l; i++) {
        if (list[i].name === name) {
          // 按地址引用 删除一个属性name
          list.splice(i, 1);
          break
        }
      }
    }
    // 如果传入true，则删除掉属性的中那个属性
    if (removeFromMap) { // 如果要删除属性
      // delete删除
      delete el.attrsMap[name];
    }
    return val
  }


  // 通过正则匹配返回并移除掉属性列表上的属性，
  function getAndRemoveAttrByRegex (
    el,
    name
  ) {
    // 获取attrsList 属性列表
    var list = el.attrsList;
    // 遍历属性列表
    for (var i = 0, l = list.length; i < l; i++) {
      // 获取每个属性
      var attr = list[i];
      // 用regexp去验证属性名
      if (name.test(attr.name)) {
        // 如果验证成功，
        // 切割属性
        list.splice(i, 1);
        // 返回被regexp验证的属性
        return attr
      }
    }
  }

  // 如果传了range 也就是把start 和end坐标也赋过去
  // rangeSetItem({ name, value }, range)
  // rangeSetItem({ name, value, dynamic }, range)
  function rangeSetItem (
    item,
    range
  ) {
    if (range) {
      if (range.start != null) {
        item.start = range.start;
      }
      if (range.end != null) {
        item.end = range.end;
      }
    }
    return item
  }

  /*  */

  /**
   * Cross-platform code generation for component v-model
   */
  function genComponentModel (
    el,
    value,
    modifiers
  ) {
    var ref = modifiers || {};
    var number = ref.number;
    var trim = ref.trim;

    var baseValueExpression = '$$v';
    var valueExpression = baseValueExpression;
    if (trim) {
      valueExpression =
        "(typeof " + baseValueExpression + " === 'string'" +
        "? " + baseValueExpression + ".trim()" +
        ": " + baseValueExpression + ")";
    }
    if (number) {
      valueExpression = "_n(" + valueExpression + ")";
    }
    var assignment = genAssignmentCode(value, valueExpression);

    el.model = {
      value: ("(" + value + ")"),
      expression: JSON.stringify(value),
      callback: ("function (" + baseValueExpression + ") {" + assignment + "}")
    };
  }

  /**
   * Cross-platform codegen helper for generating v-model value assignment code.
   * 用于生成v模型值分配代码的跨平台codegen助手。
   * 创赋值代码，转义字符串对象拆分字符串对象  把后一位key分离出来
   * 
   * 返回 key"=" value
   * 或者 $set(object[info],key,value)
   */
  // genAssignmentCode(value, `$event`)
  function genAssignmentCode (
    value,
    assignment
  ) {
    // console.log(parseModel('test'))
    // console.log(parseModel('test[key]'))
    // console.log(parseModel('test[test1[key]]'))
    // console.log(parseModel('test["a"][key]'))
    // console.log(parseModel('xxx.test[a[a].test1[key]]'))
    // console.log(parseModel('test.xxx.a["asa"][test1[key]]'))
    //{exp: "test", key: null}
    //{exp: "test", key: "key"}
    //{exp: "test", key: "test1[key]"}
    //{exp: "test["a"]", key: "key"}
    //{exp: "xxx.test", key: "a[a].test1[key]"}
    //{exp: "test.xxx.a["asa"]", key: "test1[key]"}

    // 把 value 拆分成exp 和 key如上所示
    var res = parseModel(value);
    // 如果key === null 代表 v-model = test这种
    if (res.key === null) {
      // 返回 test = $event
      return (value + "=" + assignment)
    } else {
      // 返回 $set(test, key, $event)
      return ("$set(" + (res.exp) + ", " + (res.key) + ", " + assignment + ")")
    }
  }

  /**
   * Parse a v-model expression into a base path and a final key segment.
   * Handles both dot-path and possible square brackets.
   *
   * 将v-model表达式解析为基路径和最终的键段。 
   * 
   * - test {exp: "test", key: null}
   * - test[key]  {exp: "test"}
   * - test[test1[key]]
   * - test["a"][key]
   * - xxx.test[a[a].test1[key]]
   * - test.xxx.a["asa"][test1[key]]
   *
   */

  var len, str, chr, index$1, expressionPos, expressionEndPos;



  // /转义字符串对象拆分字符串对象  把后一位key分离出来
  // 两种情况分析1 如果数据是object.info.name的情况下 则返回是 {exp: "object.info",key: "name"}
  // 如果数据是object[info][name]的情况下 则返回是 {exp: "object[info]",key: "name"}
  function parseModel (val) {
    // Fix https://github.com/vuejs/vue/pull/7730
    // allow v-model="obj.val " (trailing whitespace) 允许空格

    // 先取出两边空格
    val = val.trim();
    // 获取长度
    len = val.length;


    // 如果这个字符串没有出现过 [ 
    // 或者这个字符串 没有出现过] 或者是出现位置不是在最后一位的时候
    if (val.indexOf('[') < 0 || val.lastIndexOf(']') < len - 1) {
      // 获取最后一次 . 出现的位置下标
      index$1 = val.lastIndexOf('.');
      // > -1 代表有 . 
      if (index$1 > -1) {
        return {
          // 丢弃最后一位 比如data.xiaolu.lu 丢弃lu 获取data.xiaolu
          exp: val.slice(0, index$1),
          // 获取最后一位 lu
          key: '"' + val.slice(index$1 + 1) + '"'
        }
      // 如果没 . 
      } else {
        // 直接返回
        return {
          // exp 直接原样返回
          exp: val,
          // key为null。因为没有 .
          key: null
        }
      }
    }

    // 把val赋值给str
    str = val;
    // 这些属性都设为0 expressionPos和expressionEndPos用来保存[] 左右两个括号的下标
    index$1 = expressionPos = expressionEndPos = 0;

    // 当index大于len时，跳出循环
    while (!eof()) {
      // 获取字符串编码
      chr = next();
      // 忽略
      /* istanbul ignore if */
      //  如果是 " 或者 ' 的时候返回真 
      if (isStringStart(chr)) {
        // 循环匹配一对''或者""符号 
        parseString(chr);
      // 如果字符编码是0x5B 也就是 [
      } else if (chr === 0x5B) {
        // 这会匹配到最后一对[]
        // 匹配[] 一对这样的括号 并保存了expressionEndPos下标
        parseBracket(chr);
      }
    }

    return {
      // 返回 0到第一个括号 [ 的位置
      exp: val.slice(0, expressionPos),
      // 返回那个 [] 内部的东西
      key: val.slice(expressionPos + 1, expressionEndPos)
    }
  }

  // 返回字符串的编码
  function next () {
    //charCodeAt() 方法可返回指定位置的字符的 Unicode 编码。这个返回值是 0 - 65535 之间的整数。
    return str.charCodeAt(++index$1)
  }

  // 判断index是否大于len 返回布尔值
  function eof () {
    return index$1 >= len
  }
  // 如果是 " 或者 ' 的时候返回真
  function isStringStart (chr) {
    // 0x22 "  0x27 '
    return chr === 0x22 || chr === 0x27
  }
  // 检测 匹配[] 一对这样的=括号
  function parseBracket (chr) {
    // 标记
    var inBracket = 1;
    // 保存expressionPos 初始括号 [ 的位置
    expressionPos = index$1;
    // 循环
    while (!eof()) {
      chr = next();
      // 匹配一对 "" 或 ''
      if (isStringStart(chr)) {
        parseString(chr);
        continue
      }
      // 如果匹配上 [  ++
      if (chr === 0x5B) { inBracket++; }
      // 如果匹配上 ] --
      if (chr === 0x5D) { inBracket--; }
      // 如果等于0 就代表匹配上了一对 [] 跳出
      // [[ ]]
      if (inBracket === 0) {
        // 保存expressionEndPos下标 也就是 当正好括号匹配时的 ] 的位置
        expressionEndPos = index$1;
        break
      }
    }
  }

  // 循环匹配一对''或者""符号 
  function parseString (chr) {
    var stringQuote = chr;
    // 循环遍历编码
    while (!eof()) {
      chr = next();
      // chr如果等于传入的字符编码 就返回，也就是循环匹配' "
      if (chr === stringQuote) {
        break
      }
    }
  }

  /*  */

  var warn$1;

  // in some cases, the event used has to be determined at runtime
  // so we used some reserved tokens during compile.
  var RANGE_TOKEN = '__r';
  var CHECKBOX_RADIO_TOKEN = '__c';

  function model (
    el,
    dir,
    _warn
  ) {
    warn$1 = _warn;
    var value = dir.value;
    var modifiers = dir.modifiers;
    var tag = el.tag;
    var type = el.attrsMap.type;

    {
      // inputs with type="file" are read only and setting the input's
      // value will throw an error.
      if (tag === 'input' && type === 'file') {
        warn$1(
          "<" + (el.tag) + " v-model=\"" + value + "\" type=\"file\">:\n" +
          "File inputs are read only. Use a v-on:change listener instead.",
          el.rawAttrsMap['v-model']
        );
      }
    }

    if (el.component) {
      genComponentModel(el, value, modifiers);
      // component v-model doesn't need extra runtime
      return false
    } else if (tag === 'select') {
      genSelect(el, value, modifiers);
    } else if (tag === 'input' && type === 'checkbox') {
      genCheckboxModel(el, value, modifiers);
    } else if (tag === 'input' && type === 'radio') {
      genRadioModel(el, value, modifiers);
    } else if (tag === 'input' || tag === 'textarea') {
      genDefaultModel(el, value, modifiers);
    } else if (!config.isReservedTag(tag)) {
      genComponentModel(el, value, modifiers);
      // component v-model doesn't need extra runtime
      return false
    } else {
      warn$1(
        "<" + (el.tag) + " v-model=\"" + value + "\">: " +
        "v-model is not supported on this element type. " +
        'If you are working with contenteditable, it\'s recommended to ' +
        'wrap a library dedicated for that purpose inside a custom component.',
        el.rawAttrsMap['v-model']
      );
    }

    // ensure runtime directive metadata
    return true
  }

  function genCheckboxModel (
    el,
    value,
    modifiers
  ) {
    var number = modifiers && modifiers.number;
    var valueBinding = getBindingAttr(el, 'value') || 'null';
    var trueValueBinding = getBindingAttr(el, 'true-value') || 'true';
    var falseValueBinding = getBindingAttr(el, 'false-value') || 'false';
    addProp(el, 'checked',
      "Array.isArray(" + value + ")" +
      "?_i(" + value + "," + valueBinding + ")>-1" + (
        trueValueBinding === 'true'
          ? (":(" + value + ")")
          : (":_q(" + value + "," + trueValueBinding + ")")
      )
    );
    addHandler(el, 'change',
      "var $$a=" + value + "," +
          '$$el=$event.target,' +
          "$$c=$$el.checked?(" + trueValueBinding + "):(" + falseValueBinding + ");" +
      'if(Array.isArray($$a)){' +
        "var $$v=" + (number ? '_n(' + valueBinding + ')' : valueBinding) + "," +
            '$$i=_i($$a,$$v);' +
        "if($$el.checked){$$i<0&&(" + (genAssignmentCode(value, '$$a.concat([$$v])')) + ")}" +
        "else{$$i>-1&&(" + (genAssignmentCode(value, '$$a.slice(0,$$i).concat($$a.slice($$i+1))')) + ")}" +
      "}else{" + (genAssignmentCode(value, '$$c')) + "}",
      null, true
    );
  }

  function genRadioModel (
    el,
    value,
    modifiers
  ) {
    var number = modifiers && modifiers.number;
    var valueBinding = getBindingAttr(el, 'value') || 'null';
    valueBinding = number ? ("_n(" + valueBinding + ")") : valueBinding;
    addProp(el, 'checked', ("_q(" + value + "," + valueBinding + ")"));
    addHandler(el, 'change', genAssignmentCode(value, valueBinding), null, true);
  }

  function genSelect (
    el,
    value,
    modifiers
  ) {
    var number = modifiers && modifiers.number;
    var selectedVal = "Array.prototype.filter" +
      ".call($event.target.options,function(o){return o.selected})" +
      ".map(function(o){var val = \"_value\" in o ? o._value : o.value;" +
      "return " + (number ? '_n(val)' : 'val') + "})";

    var assignment = '$event.target.multiple ? $$selectedVal : $$selectedVal[0]';
    var code = "var $$selectedVal = " + selectedVal + ";";
    code = code + " " + (genAssignmentCode(value, assignment));
    addHandler(el, 'change', code, null, true);
  }

  function genDefaultModel (
    el,
    value,
    modifiers
  ) {
    var type = el.attrsMap.type;

    // warn if v-bind:value conflicts with v-model
    // except for inputs with v-bind:type
    {
      var value$1 = el.attrsMap['v-bind:value'] || el.attrsMap[':value'];
      var typeBinding = el.attrsMap['v-bind:type'] || el.attrsMap[':type'];
      if (value$1 && !typeBinding) {
        var binding = el.attrsMap['v-bind:value'] ? 'v-bind:value' : ':value';
        warn$1(
          binding + "=\"" + value$1 + "\" conflicts with v-model on the same element " +
          'because the latter already expands to a value binding internally',
          el.rawAttrsMap[binding]
        );
      }
    }

    var ref = modifiers || {};
    var lazy = ref.lazy;
    var number = ref.number;
    var trim = ref.trim;
    var needCompositionGuard = !lazy && type !== 'range';
    var event = lazy
      ? 'change'
      : type === 'range'
        ? RANGE_TOKEN
        : 'input';

    var valueExpression = '$event.target.value';
    if (trim) {
      valueExpression = "$event.target.value.trim()";
    }
    if (number) {
      valueExpression = "_n(" + valueExpression + ")";
    }

    var code = genAssignmentCode(value, valueExpression);
    if (needCompositionGuard) {
      code = "if($event.target.composing)return;" + code;
    }

    addProp(el, 'value', ("(" + value + ")"));
    addHandler(el, event, code, null, true);
    if (trim || number) {
      addHandler(el, 'blur', '$forceUpdate()');
    }
  }

  /*  */

  // normalize v-model event tokens that can only be determined at runtime.
  // it's important to place the event as the first in the array because
  // the whole point is ensuring the v-model callback gets called before
  // user-attached handlers.
  function normalizeEvents (on) {
    /* istanbul ignore if */
    if (isDef(on[RANGE_TOKEN])) {
      // IE input[type=range] only supports `change` event
      var event = isIE ? 'change' : 'input';
      on[event] = [].concat(on[RANGE_TOKEN], on[event] || []);
      delete on[RANGE_TOKEN];
    }
    // This was originally intended to fix #4521 but no longer necessary
    // after 2.5. Keeping it for backwards compat with generated code from < 2.4
    /* istanbul ignore if */
    if (isDef(on[CHECKBOX_RADIO_TOKEN])) {
      on.change = [].concat(on[CHECKBOX_RADIO_TOKEN], on.change || []);
      delete on[CHECKBOX_RADIO_TOKEN];
    }
  }

  var target$1;

  function createOnceHandler$1 (event, handler, capture) {
    var _target = target$1; // save current target element in closure
    return function onceHandler () {
      var res = handler.apply(null, arguments);
      if (res !== null) {
        remove$2(event, onceHandler, capture, _target);
      }
    }
  }

  // #9446: Firefox <= 53 (in particular, ESR 52) has incorrect Event.timeStamp
  // implementation and does not fire microtasks in between event propagation, so
  // safe to exclude.
  var useMicrotaskFix = isUsingMicroTask && !(isFF && Number(isFF[1]) <= 53);

  function add$1 (
    name,
    handler,
    capture,
    passive
  ) {
    // async edge case #6566: inner click event triggers patch, event handler
    // attached to outer element during patch, and triggered again. This
    // happens because browsers fire microtask ticks between event propagation.
    // the solution is simple: we save the timestamp when a handler is attached,
    // and the handler would only fire if the event passed to it was fired
    // AFTER it was attached.
    if (useMicrotaskFix) {
      var attachedTimestamp = currentFlushTimestamp;
      var original = handler;
      handler = original._wrapper = function (e) {
        if (
          // no bubbling, should always fire.
          // this is just a safety net in case event.timeStamp is unreliable in
          // certain weird environments...
          e.target === e.currentTarget ||
          // event is fired after handler attachment
          e.timeStamp >= attachedTimestamp ||
          // bail for environments that have buggy event.timeStamp implementations
          // #9462 iOS 9 bug: event.timeStamp is 0 after history.pushState
          // #9681 QtWebEngine event.timeStamp is negative value
          e.timeStamp <= 0 ||
          // #9448 bail if event is fired in another document in a multi-page
          // electron/nw.js app, since event.timeStamp will be using a different
          // starting reference
          e.target.ownerDocument !== document
        ) {
          return original.apply(this, arguments)
        }
      };
    }
    target$1.addEventListener(
      name,
      handler,
      supportsPassive
        ? { capture: capture, passive: passive }
        : capture
    );
  }

  function remove$2 (
    name,
    handler,
    capture,
    _target
  ) {
    (_target || target$1).removeEventListener(
      name,
      handler._wrapper || handler,
      capture
    );
  }

  function updateDOMListeners (oldVnode, vnode) {
    if (isUndef(oldVnode.data.on) && isUndef(vnode.data.on)) {
      return
    }
    var on = vnode.data.on || {};
    var oldOn = oldVnode.data.on || {};
    target$1 = vnode.elm;
    normalizeEvents(on);
    updateListeners(on, oldOn, add$1, remove$2, createOnceHandler$1, vnode.context);
    target$1 = undefined;
  }

  var events = {
    create: updateDOMListeners,
    update: updateDOMListeners
  };

  /*  */

  var svgContainer;

  function updateDOMProps (oldVnode, vnode) {
    if (isUndef(oldVnode.data.domProps) && isUndef(vnode.data.domProps)) {
      return
    }
    var key, cur;
    var elm = vnode.elm;
    var oldProps = oldVnode.data.domProps || {};
    var props = vnode.data.domProps || {};
    // clone observed objects, as the user probably wants to mutate it
    if (isDef(props.__ob__)) {
      props = vnode.data.domProps = extend({}, props);
    }

    for (key in oldProps) {
      if (isUndef(props[key])) {
        elm[key] = '';
      }
    }
    for (key in props) {
      cur = props[key];
      // ignore children if the node has textContent or innerHTML,
      // as these will throw away existing DOM nodes and cause removal errors
      // on subsequent patches (#3360)
      if (key === 'textContent' || key === 'innerHTML') {
        if (vnode.children) { vnode.children.length = 0; }
        if (cur === oldProps[key]) { continue }
        // #6601 work around Chrome version <= 55 bug where single textNode
        // replaced by innerHTML/textContent retains its parentNode property
        if (elm.childNodes.length === 1) {
          elm.removeChild(elm.childNodes[0]);
        }
      }

      if (key === 'value' && elm.tagName !== 'PROGRESS') {
        // store value as _value as well since
        // non-string values will be stringified
        elm._value = cur;
        // avoid resetting cursor position when value is the same
        var strCur = isUndef(cur) ? '' : String(cur);
        if (shouldUpdateValue(elm, strCur)) {
          elm.value = strCur;
        }
      } else if (key === 'innerHTML' && isSVG(elm.tagName) && isUndef(elm.innerHTML)) {
        // IE doesn't support innerHTML for SVG elements
        svgContainer = svgContainer || document.createElement('div');
        svgContainer.innerHTML = "<svg>" + cur + "</svg>";
        var svg = svgContainer.firstChild;
        while (elm.firstChild) {
          elm.removeChild(elm.firstChild);
        }
        while (svg.firstChild) {
          elm.appendChild(svg.firstChild);
        }
      } else if (
        // skip the update if old and new VDOM state is the same.
        // `value` is handled separately because the DOM value may be temporarily
        // out of sync with VDOM state due to focus, composition and modifiers.
        // This  #4521 by skipping the unnecesarry `checked` update.
        cur !== oldProps[key]
      ) {
        // some property updates can throw
        // e.g. `value` on <progress> w/ non-finite value
        try {
          elm[key] = cur;
        } catch (e) {}
      }
    }
  }

  // check platforms/web/util/attrs.js acceptValue


  function shouldUpdateValue (elm, checkVal) {
    return (!elm.composing && (
      elm.tagName === 'OPTION' ||
      isNotInFocusAndDirty(elm, checkVal) ||
      isDirtyWithModifiers(elm, checkVal)
    ))
  }

  function isNotInFocusAndDirty (elm, checkVal) {
    // return true when textbox (.number and .trim) loses focus and its value is
    // not equal to the updated value
    var notInFocus = true;
    // #6157
    // work around IE bug when accessing document.activeElement in an iframe
    try { notInFocus = document.activeElement !== elm; } catch (e) {}
    return notInFocus && elm.value !== checkVal
  }

  function isDirtyWithModifiers (elm, newVal) {
    var value = elm.value;
    var modifiers = elm._vModifiers; // injected by v-model runtime
    if (isDef(modifiers)) {
      if (modifiers.number) {
        return toNumber(value) !== toNumber(newVal)
      }
      if (modifiers.trim) {
        return value.trim() !== newVal.trim()
      }
    }
    return value !== newVal
  }

  var domProps = {
    create: updateDOMProps,
    update: updateDOMProps
  };

  /*  */

  // 将 width:100px; height:200px;'这种形式转换成{width: "100px", height: "200px"}这样
  var parseStyleText = cached(function (cssText) {
    var res = {};
    // 匹配不是括号中的 ; 
    var listDelimiter = /;(?![^(]*\))/g;
    // 匹配 :+任意字符串
    var propertyDelimiter = /:(.+)/;
    // 以;切割 然后遍历切割的数组 
    // 比如 style = "width: 200px;"
    cssText.split(listDelimiter).forEach(function (item) {
      if (item) {
        // item: width: 200px
        // console.log(`item: ${item}`)
        // 以:和字符串切割
        // tmp: width, 200px
        var tmp = item.split(propertyDelimiter);
        // console.log(`tmp: ${tmp}`)
        // 当tmp长度大于1时 并且res的 width属性 = 200px
        // 也就是 res: {width: 200px}
        tmp.length > 1 && (res[tmp[0].trim()] = tmp[1].trim());
      }
    });
    // 最后返回res
    return res
  });

  // merge static and dynamic style data on the same vnode
  function normalizeStyleData (data) {
    var style = normalizeStyleBinding(data.style);
    // static style is pre-processed into an object during compilation
    // and is always a fresh object, so it's safe to merge into it
    return data.staticStyle
      ? extend(data.staticStyle, style)
      : style
  }

  // normalize possible array / string values into Object
  function normalizeStyleBinding (bindingStyle) {
    if (Array.isArray(bindingStyle)) {
      return toObject(bindingStyle)
    }
    if (typeof bindingStyle === 'string') {
      return parseStyleText(bindingStyle)
    }
    return bindingStyle
  }

  /**
   * parent component style should be after child's
   * so that parent component's style could override it
   */
  function getStyle (vnode, checkChild) {
    var res = {};
    var styleData;

    if (checkChild) {
      var childNode = vnode;
      while (childNode.componentInstance) {
        childNode = childNode.componentInstance._vnode;
        if (
          childNode && childNode.data &&
          (styleData = normalizeStyleData(childNode.data))
        ) {
          extend(res, styleData);
        }
      }
    }

    if ((styleData = normalizeStyleData(vnode.data))) {
      extend(res, styleData);
    }

    var parentNode = vnode;
    while ((parentNode = parentNode.parent)) {
      if (parentNode.data && (styleData = normalizeStyleData(parentNode.data))) {
        extend(res, styleData);
      }
    }
    return res
  }

  /*  */

  var cssVarRE = /^--/;
  var importantRE = /\s*!important$/;
  var setProp = function (el, name, val) {
    /* istanbul ignore if */
    if (cssVarRE.test(name)) {
      el.style.setProperty(name, val);
    } else if (importantRE.test(val)) {
      el.style.setProperty(hyphenate(name), val.replace(importantRE, ''), 'important');
    } else {
      var normalizedName = normalize(name);
      if (Array.isArray(val)) {
        // Support values array created by autoprefixer, e.g.
        // {display: ["-webkit-box", "-ms-flexbox", "flex"]}
        // Set them one by one, and the browser will only set those it can recognize
        for (var i = 0, len = val.length; i < len; i++) {
          el.style[normalizedName] = val[i];
        }
      } else {
        el.style[normalizedName] = val;
      }
    }
  };

  var vendorNames = ['Webkit', 'Moz', 'ms'];

  var emptyStyle;
  var normalize = cached(function (prop) {
    emptyStyle = emptyStyle || document.createElement('div').style;
    prop = camelize(prop);
    if (prop !== 'filter' && (prop in emptyStyle)) {
      return prop
    }
    var capName = prop.charAt(0).toUpperCase() + prop.slice(1);
    for (var i = 0; i < vendorNames.length; i++) {
      var name = vendorNames[i] + capName;
      if (name in emptyStyle) {
        return name
      }
    }
  });

  function updateStyle (oldVnode, vnode) {
    var data = vnode.data;
    var oldData = oldVnode.data;

    if (isUndef(data.staticStyle) && isUndef(data.style) &&
      isUndef(oldData.staticStyle) && isUndef(oldData.style)
    ) {
      return
    }

    var cur, name;
    var el = vnode.elm;
    var oldStaticStyle = oldData.staticStyle;
    var oldStyleBinding = oldData.normalizedStyle || oldData.style || {};

    // if static style exists, stylebinding already merged into it when doing normalizeStyleData
    var oldStyle = oldStaticStyle || oldStyleBinding;

    var style = normalizeStyleBinding(vnode.data.style) || {};

    // store normalized style under a different key for next diff
    // make sure to clone it if it's reactive, since the user likely wants
    // to mutate it.
    vnode.data.normalizedStyle = isDef(style.__ob__)
      ? extend({}, style)
      : style;

    var newStyle = getStyle(vnode, true);

    for (name in oldStyle) {
      if (isUndef(newStyle[name])) {
        setProp(el, name, '');
      }
    }
    for (name in newStyle) {
      cur = newStyle[name];
      if (cur !== oldStyle[name]) {
        // ie9 setting to null has no effect, must use empty string
        setProp(el, name, cur == null ? '' : cur);
      }
    }
  }

  var style = {
    create: updateStyle,
    update: updateStyle
  };

  /*  */

  var whitespaceRE = /\s+/;

  /**
   * Add class with compatibility for SVG since classList is not supported on
   * SVG elements in IE
   */
  function addClass (el, cls) {
    /* istanbul ignore if */
    if (!cls || !(cls = cls.trim())) {
      return
    }

    /* istanbul ignore else */
    if (el.classList) {
      if (cls.indexOf(' ') > -1) {
        cls.split(whitespaceRE).forEach(function (c) { return el.classList.add(c); });
      } else {
        el.classList.add(cls);
      }
    } else {
      var cur = " " + (el.getAttribute('class') || '') + " ";
      if (cur.indexOf(' ' + cls + ' ') < 0) {
        el.setAttribute('class', (cur + cls).trim());
      }
    }
  }

  /**
   * Remove class with compatibility for SVG since classList is not supported on
   * SVG elements in IE
   */
  function removeClass (el, cls) {
    /* istanbul ignore if */
    if (!cls || !(cls = cls.trim())) {
      return
    }

    /* istanbul ignore else */
    if (el.classList) {
      if (cls.indexOf(' ') > -1) {
        cls.split(whitespaceRE).forEach(function (c) { return el.classList.remove(c); });
      } else {
        el.classList.remove(cls);
      }
      if (!el.classList.length) {
        el.removeAttribute('class');
      }
    } else {
      var cur = " " + (el.getAttribute('class') || '') + " ";
      var tar = ' ' + cls + ' ';
      while (cur.indexOf(tar) >= 0) {
        cur = cur.replace(tar, ' ');
      }
      cur = cur.trim();
      if (cur) {
        el.setAttribute('class', cur);
      } else {
        el.removeAttribute('class');
      }
    }
  }

  /*  */

  function resolveTransition (def) {
    if (!def) {
      return
    }
    /* istanbul ignore else */
    if (typeof def === 'object') {
      var res = {};
      if (def.css !== false) {
        extend(res, autoCssTransition(def.name || 'v'));
      }
      extend(res, def);
      return res
    } else if (typeof def === 'string') {
      return autoCssTransition(def)
    }
  }

  var autoCssTransition = cached(function (name) {
    return {
      enterClass: (name + "-enter"),
      enterToClass: (name + "-enter-to"),
      enterActiveClass: (name + "-enter-active"),
      leaveClass: (name + "-leave"),
      leaveToClass: (name + "-leave-to"),
      leaveActiveClass: (name + "-leave-active")
    }
  });

  var hasTransition = inBrowser && !isIE9;
  var TRANSITION = 'transition';
  var ANIMATION = 'animation';

  // Transition property/event sniffing
  var transitionProp = 'transition';
  var transitionEndEvent = 'transitionend';
  var animationProp = 'animation';
  var animationEndEvent = 'animationend';
  if (hasTransition) {
    /* istanbul ignore if */
    if (window.ontransitionend === undefined &&
      window.onwebkittransitionend !== undefined
    ) {
      transitionProp = 'WebkitTransition';
      transitionEndEvent = 'webkitTransitionEnd';
    }
    if (window.onanimationend === undefined &&
      window.onwebkitanimationend !== undefined
    ) {
      animationProp = 'WebkitAnimation';
      animationEndEvent = 'webkitAnimationEnd';
    }
  }

  // binding to window is necessary to make hot reload work in IE in strict mode
  var raf = inBrowser
    ? window.requestAnimationFrame
      ? window.requestAnimationFrame.bind(window)
      : setTimeout
    : /* istanbul ignore next */ function (fn) { return fn(); };

  function nextFrame (fn) {
    raf(function () {
      raf(fn);
    });
  }

  function addTransitionClass (el, cls) {
    var transitionClasses = el._transitionClasses || (el._transitionClasses = []);
    if (transitionClasses.indexOf(cls) < 0) {
      transitionClasses.push(cls);
      addClass(el, cls);
    }
  }

  function removeTransitionClass (el, cls) {
    if (el._transitionClasses) {
      remove(el._transitionClasses, cls);
    }
    removeClass(el, cls);
  }

  function whenTransitionEnds (
    el,
    expectedType,
    cb
  ) {
    var ref = getTransitionInfo(el, expectedType);
    var type = ref.type;
    var timeout = ref.timeout;
    var propCount = ref.propCount;
    if (!type) { return cb() }
    var event = type === TRANSITION ? transitionEndEvent : animationEndEvent;
    var ended = 0;
    var end = function () {
      el.removeEventListener(event, onEnd);
      cb();
    };
    var onEnd = function (e) {
      if (e.target === el) {
        if (++ended >= propCount) {
          end();
        }
      }
    };
    setTimeout(function () {
      if (ended < propCount) {
        end();
      }
    }, timeout + 1);
    el.addEventListener(event, onEnd);
  }

  var transformRE = /\b(transform|all)(,|$)/;

  function getTransitionInfo (el, expectedType) {
    var styles = window.getComputedStyle(el);
    // JSDOM may return undefined for transition properties
    var transitionDelays = (styles[transitionProp + 'Delay'] || '').split(', ');
    var transitionDurations = (styles[transitionProp + 'Duration'] || '').split(', ');
    var transitionTimeout = getTimeout(transitionDelays, transitionDurations);
    var animationDelays = (styles[animationProp + 'Delay'] || '').split(', ');
    var animationDurations = (styles[animationProp + 'Duration'] || '').split(', ');
    var animationTimeout = getTimeout(animationDelays, animationDurations);

    var type;
    var timeout = 0;
    var propCount = 0;
    /* istanbul ignore if */
    if (expectedType === TRANSITION) {
      if (transitionTimeout > 0) {
        type = TRANSITION;
        timeout = transitionTimeout;
        propCount = transitionDurations.length;
      }
    } else if (expectedType === ANIMATION) {
      if (animationTimeout > 0) {
        type = ANIMATION;
        timeout = animationTimeout;
        propCount = animationDurations.length;
      }
    } else {
      timeout = Math.max(transitionTimeout, animationTimeout);
      type = timeout > 0
        ? transitionTimeout > animationTimeout
          ? TRANSITION
          : ANIMATION
        : null;
      propCount = type
        ? type === TRANSITION
          ? transitionDurations.length
          : animationDurations.length
        : 0;
    }
    var hasTransform =
      type === TRANSITION &&
      transformRE.test(styles[transitionProp + 'Property']);
    return {
      type: type,
      timeout: timeout,
      propCount: propCount,
      hasTransform: hasTransform
    }
  }

  function getTimeout (delays, durations) {
    /* istanbul ignore next */
    while (delays.length < durations.length) {
      delays = delays.concat(delays);
    }

    return Math.max.apply(null, durations.map(function (d, i) {
      return toMs(d) + toMs(delays[i])
    }))
  }

  // Old versions of Chromium (below 61.0.3163.100) formats floating pointer numbers
  // in a locale-dependent way, using a comma instead of a dot.
  // If comma is not replaced with a dot, the input will be rounded down (i.e. acting
  // as a floor function) causing unexpected behaviors
  function toMs (s) {
    return Number(s.slice(0, -1).replace(',', '.')) * 1000
  }

  /*  */

  function enter (vnode, toggleDisplay) {
    var el = vnode.elm;

    // call leave callback now
    if (isDef(el._leaveCb)) {
      el._leaveCb.cancelled = true;
      el._leaveCb();
    }

    var data = resolveTransition(vnode.data.transition);
    if (isUndef(data)) {
      return
    }

    /* istanbul ignore if */
    if (isDef(el._enterCb) || el.nodeType !== 1) {
      return
    }

    var css = data.css;
    var type = data.type;
    var enterClass = data.enterClass;
    var enterToClass = data.enterToClass;
    var enterActiveClass = data.enterActiveClass;
    var appearClass = data.appearClass;
    var appearToClass = data.appearToClass;
    var appearActiveClass = data.appearActiveClass;
    var beforeEnter = data.beforeEnter;
    var enter = data.enter;
    var afterEnter = data.afterEnter;
    var enterCancelled = data.enterCancelled;
    var beforeAppear = data.beforeAppear;
    var appear = data.appear;
    var afterAppear = data.afterAppear;
    var appearCancelled = data.appearCancelled;
    var duration = data.duration;

    // activeInstance will always be the <transition> component managing this
    // transition. One edge case to check is when the <transition> is placed
    // as the root node of a child component. In that case we need to check
    // <transition>'s parent for appear check.
    var context = activeInstance;
    var transitionNode = activeInstance.$vnode;
    while (transitionNode && transitionNode.parent) {
      context = transitionNode.context;
      transitionNode = transitionNode.parent;
    }

    var isAppear = !context._isMounted || !vnode.isRootInsert;

    if (isAppear && !appear && appear !== '') {
      return
    }

    var startClass = isAppear && appearClass
      ? appearClass
      : enterClass;
    var activeClass = isAppear && appearActiveClass
      ? appearActiveClass
      : enterActiveClass;
    var toClass = isAppear && appearToClass
      ? appearToClass
      : enterToClass;

    var beforeEnterHook = isAppear
      ? (beforeAppear || beforeEnter)
      : beforeEnter;
    var enterHook = isAppear
      ? (typeof appear === 'function' ? appear : enter)
      : enter;
    var afterEnterHook = isAppear
      ? (afterAppear || afterEnter)
      : afterEnter;
    var enterCancelledHook = isAppear
      ? (appearCancelled || enterCancelled)
      : enterCancelled;

    var explicitEnterDuration = toNumber(
      isObject(duration)
        ? duration.enter
        : duration
    );

    if ( explicitEnterDuration != null) {
      checkDuration(explicitEnterDuration, 'enter', vnode);
    }

    var expectsCSS = css !== false && !isIE9;
    var userWantsControl = getHookArgumentsLength(enterHook);

    var cb = el._enterCb = once(function () {
      if (expectsCSS) {
        removeTransitionClass(el, toClass);
        removeTransitionClass(el, activeClass);
      }
      if (cb.cancelled) {
        if (expectsCSS) {
          removeTransitionClass(el, startClass);
        }
        enterCancelledHook && enterCancelledHook(el);
      } else {
        afterEnterHook && afterEnterHook(el);
      }
      el._enterCb = null;
    });

    if (!vnode.data.show) {
      // remove pending leave element on enter by injecting an insert hook
      mergeVNodeHook(vnode, 'insert', function () {
        var parent = el.parentNode;
        var pendingNode = parent && parent._pending && parent._pending[vnode.key];
        if (pendingNode &&
          pendingNode.tag === vnode.tag &&
          pendingNode.elm._leaveCb
        ) {
          pendingNode.elm._leaveCb();
        }
        enterHook && enterHook(el, cb);
      });
    }

    // start enter transition
    beforeEnterHook && beforeEnterHook(el);
    if (expectsCSS) {
      addTransitionClass(el, startClass);
      addTransitionClass(el, activeClass);
      nextFrame(function () {
        removeTransitionClass(el, startClass);
        if (!cb.cancelled) {
          addTransitionClass(el, toClass);
          if (!userWantsControl) {
            if (isValidDuration(explicitEnterDuration)) {
              setTimeout(cb, explicitEnterDuration);
            } else {
              whenTransitionEnds(el, type, cb);
            }
          }
        }
      });
    }

    if (vnode.data.show) {
      toggleDisplay && toggleDisplay();
      enterHook && enterHook(el, cb);
    }

    if (!expectsCSS && !userWantsControl) {
      cb();
    }
  }

  function leave (vnode, rm) {
    var el = vnode.elm;

    // call enter callback now
    if (isDef(el._enterCb)) {
      el._enterCb.cancelled = true;
      el._enterCb();
    }

    var data = resolveTransition(vnode.data.transition);
    if (isUndef(data) || el.nodeType !== 1) {
      return rm()
    }

    /* istanbul ignore if */
    if (isDef(el._leaveCb)) {
      return
    }

    var css = data.css;
    var type = data.type;
    var leaveClass = data.leaveClass;
    var leaveToClass = data.leaveToClass;
    var leaveActiveClass = data.leaveActiveClass;
    var beforeLeave = data.beforeLeave;
    var leave = data.leave;
    var afterLeave = data.afterLeave;
    var leaveCancelled = data.leaveCancelled;
    var delayLeave = data.delayLeave;
    var duration = data.duration;

    var expectsCSS = css !== false && !isIE9;
    var userWantsControl = getHookArgumentsLength(leave);

    var explicitLeaveDuration = toNumber(
      isObject(duration)
        ? duration.leave
        : duration
    );

    if ( isDef(explicitLeaveDuration)) {
      checkDuration(explicitLeaveDuration, 'leave', vnode);
    }

    var cb = el._leaveCb = once(function () {
      if (el.parentNode && el.parentNode._pending) {
        el.parentNode._pending[vnode.key] = null;
      }
      if (expectsCSS) {
        removeTransitionClass(el, leaveToClass);
        removeTransitionClass(el, leaveActiveClass);
      }
      if (cb.cancelled) {
        if (expectsCSS) {
          removeTransitionClass(el, leaveClass);
        }
        leaveCancelled && leaveCancelled(el);
      } else {
        rm();
        afterLeave && afterLeave(el);
      }
      el._leaveCb = null;
    });

    if (delayLeave) {
      delayLeave(performLeave);
    } else {
      performLeave();
    }

    function performLeave () {
      // the delayed leave may have already been cancelled
      if (cb.cancelled) {
        return
      }
      // record leaving element
      if (!vnode.data.show && el.parentNode) {
        (el.parentNode._pending || (el.parentNode._pending = {}))[(vnode.key)] = vnode;
      }
      beforeLeave && beforeLeave(el);
      if (expectsCSS) {
        addTransitionClass(el, leaveClass);
        addTransitionClass(el, leaveActiveClass);
        nextFrame(function () {
          removeTransitionClass(el, leaveClass);
          if (!cb.cancelled) {
            addTransitionClass(el, leaveToClass);
            if (!userWantsControl) {
              if (isValidDuration(explicitLeaveDuration)) {
                setTimeout(cb, explicitLeaveDuration);
              } else {
                whenTransitionEnds(el, type, cb);
              }
            }
          }
        });
      }
      leave && leave(el, cb);
      if (!expectsCSS && !userWantsControl) {
        cb();
      }
    }
  }

  // only used in dev mode
  function checkDuration (val, name, vnode) {
    if (typeof val !== 'number') {
      warn(
        "<transition> explicit " + name + " duration is not a valid number - " +
        "got " + (JSON.stringify(val)) + ".",
        vnode.context
      );
    } else if (isNaN(val)) {
      warn(
        "<transition> explicit " + name + " duration is NaN - " +
        'the duration expression might be incorrect.',
        vnode.context
      );
    }
  }

  function isValidDuration (val) {
    return typeof val === 'number' && !isNaN(val)
  }

  /**
   * Normalize a transition hook's argument length. The hook may be:
   * - a merged hook (invoker) with the original in .fns
   * - a wrapped component method (check ._length)
   * - a plain function (.length)
   */
  function getHookArgumentsLength (fn) {
    if (isUndef(fn)) {
      return false
    }
    var invokerFns = fn.fns;
    if (isDef(invokerFns)) {
      // invoker
      return getHookArgumentsLength(
        Array.isArray(invokerFns)
          ? invokerFns[0]
          : invokerFns
      )
    } else {
      return (fn._length || fn.length) > 1
    }
  }

  function _enter (_, vnode) {
    if (vnode.data.show !== true) {
      enter(vnode);
    }
  }

  var transition = inBrowser ? {
    create: _enter,
    activate: _enter,
    remove: function remove (vnode, rm) {
      /* istanbul ignore else */
      if (vnode.data.show !== true) {
        leave(vnode, rm);
      } else {
        rm();
      }
    }
  } : {};

  var platformModules = [
    attrs,
    klass,
    events,
    domProps,
    style,
    transition
  ];

  /*  */

  // the directive module should be applied last, after all
  // built-in modules have been applied.
  var modules = platformModules.concat(baseModules);

  var patch = createPatchFunction({ nodeOps: nodeOps, modules: modules });

  /**
   * Not type checking this file because flow doesn't like attaching
   * properties to Elements.
   */

  /* istanbul ignore if */
  if (isIE9) {
    // http://www.matts411.com/post/internet-explorer-9-oninput/
    document.addEventListener('selectionchange', function () {
      var el = document.activeElement;
      if (el && el.vmodel) {
        trigger(el, 'input');
      }
    });
  }

  var directive = {
    inserted: function inserted (el, binding, vnode, oldVnode) {
      if (vnode.tag === 'select') {
        // #6903
        if (oldVnode.elm && !oldVnode.elm._vOptions) {
          mergeVNodeHook(vnode, 'postpatch', function () {
            directive.componentUpdated(el, binding, vnode);
          });
        } else {
          setSelected(el, binding, vnode.context);
        }
        el._vOptions = [].map.call(el.options, getValue);
      } else if (vnode.tag === 'textarea' || isTextInputType(el.type)) {
        el._vModifiers = binding.modifiers;
        if (!binding.modifiers.lazy) {
          el.addEventListener('compositionstart', onCompositionStart);
          el.addEventListener('compositionend', onCompositionEnd);
          // Safari < 10.2 & UIWebView doesn't fire compositionend when
          // switching focus before confirming composition choice
          // this also fixes the issue where some browsers e.g. iOS Chrome
          // fires "change" instead of "input" on autocomplete.
          el.addEventListener('change', onCompositionEnd);
          /* istanbul ignore if */
          if (isIE9) {
            el.vmodel = true;
          }
        }
      }
    },

    componentUpdated: function componentUpdated (el, binding, vnode) {
      if (vnode.tag === 'select') {
        setSelected(el, binding, vnode.context);
        // in case the options rendered by v-for have changed,
        // it's possible that the value is out-of-sync with the rendered options.
        // detect such cases and filter out values that no longer has a matching
        // option in the DOM.
        var prevOptions = el._vOptions;
        var curOptions = el._vOptions = [].map.call(el.options, getValue);
        if (curOptions.some(function (o, i) { return !looseEqual(o, prevOptions[i]); })) {
          // trigger change event if
          // no matching option found for at least one value
          var needReset = el.multiple
            ? binding.value.some(function (v) { return hasNoMatchingOption(v, curOptions); })
            : binding.value !== binding.oldValue && hasNoMatchingOption(binding.value, curOptions);
          if (needReset) {
            trigger(el, 'change');
          }
        }
      }
    }
  };

  function setSelected (el, binding, vm) {
    actuallySetSelected(el, binding, vm);
    /* istanbul ignore if */
    if (isIE || isEdge) {
      setTimeout(function () {
        actuallySetSelected(el, binding, vm);
      }, 0);
    }
  }

  function actuallySetSelected (el, binding, vm) {
    var value = binding.value;
    var isMultiple = el.multiple;
    if (isMultiple && !Array.isArray(value)) {
       warn(
        "<select multiple v-model=\"" + (binding.expression) + "\"> " +
        "expects an Array value for its binding, but got " + (Object.prototype.toString.call(value).slice(8, -1)),
        vm
      );
      return
    }
    var selected, option;
    for (var i = 0, l = el.options.length; i < l; i++) {
      option = el.options[i];
      if (isMultiple) {
        selected = looseIndexOf(value, getValue(option)) > -1;
        if (option.selected !== selected) {
          option.selected = selected;
        }
      } else {
        if (looseEqual(getValue(option), value)) {
          if (el.selectedIndex !== i) {
            el.selectedIndex = i;
          }
          return
        }
      }
    }
    if (!isMultiple) {
      el.selectedIndex = -1;
    }
  }

  function hasNoMatchingOption (value, options) {
    return options.every(function (o) { return !looseEqual(o, value); })
  }

  function getValue (option) {
    return '_value' in option
      ? option._value
      : option.value
  }

  function onCompositionStart (e) {
    e.target.composing = true;
  }

  function onCompositionEnd (e) {
    // prevent triggering an input event for no reason
    if (!e.target.composing) { return }
    e.target.composing = false;
    trigger(e.target, 'input');
  }

  function trigger (el, type) {
    var e = document.createEvent('HTMLEvents');
    e.initEvent(type, true, true);
    el.dispatchEvent(e);
  }

  /*  */

  // recursively search for possible transition defined inside the component root
  function locateNode (vnode) {
    return vnode.componentInstance && (!vnode.data || !vnode.data.transition)
      ? locateNode(vnode.componentInstance._vnode)
      : vnode
  }

  var show = {
    bind: function bind (el, ref, vnode) {
      var value = ref.value;

      vnode = locateNode(vnode);
      var transition = vnode.data && vnode.data.transition;
      var originalDisplay = el.__vOriginalDisplay =
        el.style.display === 'none' ? '' : el.style.display;
      if (value && transition) {
        vnode.data.show = true;
        enter(vnode, function () {
          el.style.display = originalDisplay;
        });
      } else {
        el.style.display = value ? originalDisplay : 'none';
      }
    },

    update: function update (el, ref, vnode) {
      var value = ref.value;
      var oldValue = ref.oldValue;

      /* istanbul ignore if */
      if (!value === !oldValue) { return }
      vnode = locateNode(vnode);
      var transition = vnode.data && vnode.data.transition;
      if (transition) {
        vnode.data.show = true;
        if (value) {
          enter(vnode, function () {
            el.style.display = el.__vOriginalDisplay;
          });
        } else {
          leave(vnode, function () {
            el.style.display = 'none';
          });
        }
      } else {
        el.style.display = value ? el.__vOriginalDisplay : 'none';
      }
    },

    unbind: function unbind (
      el,
      binding,
      vnode,
      oldVnode,
      isDestroy
    ) {
      if (!isDestroy) {
        el.style.display = el.__vOriginalDisplay;
      }
    }
  };

  var platformDirectives = {
    model: directive,
    show: show
  };

  /*  */

  var transitionProps = {
    name: String,
    appear: Boolean,
    css: Boolean,
    mode: String,
    type: String,
    enterClass: String,
    leaveClass: String,
    enterToClass: String,
    leaveToClass: String,
    enterActiveClass: String,
    leaveActiveClass: String,
    appearClass: String,
    appearActiveClass: String,
    appearToClass: String,
    duration: [Number, String, Object]
  };

  // in case the child is also an abstract component, e.g. <keep-alive>
  // we want to recursively retrieve the real component to be rendered
  function getRealChild (vnode) {
    var compOptions = vnode && vnode.componentOptions;
    if (compOptions && compOptions.Ctor.options.abstract) {
      return getRealChild(getFirstComponentChild(compOptions.children))
    } else {
      return vnode
    }
  }

  function extractTransitionData (comp) {
    var data = {};
    var options = comp.$options;
    // props
    for (var key in options.propsData) {
      data[key] = comp[key];
    }
    // events.
    // extract listeners and pass them directly to the transition methods
    var listeners = options._parentListeners;
    for (var key$1 in listeners) {
      data[camelize(key$1)] = listeners[key$1];
    }
    return data
  }

  function placeholder (h, rawChild) {
    if (/\d-keep-alive$/.test(rawChild.tag)) {
      return h('keep-alive', {
        props: rawChild.componentOptions.propsData
      })
    }
  }

  function hasParentTransition (vnode) {
    while ((vnode = vnode.parent)) {
      if (vnode.data.transition) {
        return true
      }
    }
  }

  function isSameChild (child, oldChild) {
    return oldChild.key === child.key && oldChild.tag === child.tag
  }

  var isNotTextNode = function (c) { return c.tag || isAsyncPlaceholder(c); };

  var isVShowDirective = function (d) { return d.name === 'show'; };

  var Transition = {
    name: 'transition',
    props: transitionProps,
    abstract: true,

    render: function render (h) {
      var this$1 = this;

      var children = this.$slots.default;
      if (!children) {
        return
      }

      // filter out text nodes (possible whitespaces)
      children = children.filter(isNotTextNode);
      /* istanbul ignore if */
      if (!children.length) {
        return
      }

      // warn multiple elements
      if ( children.length > 1) {
        warn(
          '<transition> can only be used on a single element. Use ' +
          '<transition-group> for lists.',
          this.$parent
        );
      }

      var mode = this.mode;

      // warn invalid mode
      if (
        mode && mode !== 'in-out' && mode !== 'out-in'
      ) {
        warn(
          'invalid <transition> mode: ' + mode,
          this.$parent
        );
      }

      var rawChild = children[0];

      // if this is a component root node and the component's
      // parent container node also has transition, skip.
      if (hasParentTransition(this.$vnode)) {
        return rawChild
      }

      // apply transition data to child
      // use getRealChild() to ignore abstract components e.g. keep-alive
      var child = getRealChild(rawChild);
      /* istanbul ignore if */
      if (!child) {
        return rawChild
      }

      if (this._leaving) {
        return placeholder(h, rawChild)
      }

      // ensure a key that is unique to the vnode type and to this transition
      // component instance. This key will be used to remove pending leaving nodes
      // during entering.
      var id = "__transition-" + (this._uid) + "-";
      child.key = child.key == null
        ? child.isComment
          ? id + 'comment'
          : id + child.tag
        : isPrimitive(child.key)
          ? (String(child.key).indexOf(id) === 0 ? child.key : id + child.key)
          : child.key;

      var data = (child.data || (child.data = {})).transition = extractTransitionData(this);
      var oldRawChild = this._vnode;
      var oldChild = getRealChild(oldRawChild);

      // mark v-show
      // so that the transition module can hand over the control to the directive
      if (child.data.directives && child.data.directives.some(isVShowDirective)) {
        child.data.show = true;
      }

      if (
        oldChild &&
        oldChild.data &&
        !isSameChild(child, oldChild) &&
        !isAsyncPlaceholder(oldChild) &&
        // #6687 component root is a comment node
        !(oldChild.componentInstance && oldChild.componentInstance._vnode.isComment)
      ) {
        // replace old child transition data with fresh one
        // important for dynamic transitions!
        var oldData = oldChild.data.transition = extend({}, data);
        // handle transition mode
        if (mode === 'out-in') {
          // return placeholder node and queue update when leave finishes
          this._leaving = true;
          mergeVNodeHook(oldData, 'afterLeave', function () {
            this$1._leaving = false;
            this$1.$forceUpdate();
          });
          return placeholder(h, rawChild)
        } else if (mode === 'in-out') {
          if (isAsyncPlaceholder(child)) {
            return oldRawChild
          }
          var delayedLeave;
          var performLeave = function () { delayedLeave(); };
          mergeVNodeHook(data, 'afterEnter', performLeave);
          mergeVNodeHook(data, 'enterCancelled', performLeave);
          mergeVNodeHook(oldData, 'delayLeave', function (leave) { delayedLeave = leave; });
        }
      }

      return rawChild
    }
  };

  /*  */

  var props = extend({
    tag: String,
    moveClass: String
  }, transitionProps);

  delete props.mode;

  var TransitionGroup = {
    props: props,

    beforeMount: function beforeMount () {
      var this$1 = this;

      var update = this._update;
      this._update = function (vnode, hydrating) {
        var restoreActiveInstance = setActiveInstance(this$1);
        // force removing pass
        this$1.__patch__(
          this$1._vnode,
          this$1.kept,
          false, // hydrating
          true // removeOnly (!important, avoids unnecessary moves)
        );
        this$1._vnode = this$1.kept;
        restoreActiveInstance();
        update.call(this$1, vnode, hydrating);
      };
    },

    render: function render (h) {
      var tag = this.tag || this.$vnode.data.tag || 'span';
      var map = Object.create(null);
      var prevChildren = this.prevChildren = this.children;
      var rawChildren = this.$slots.default || [];
      var children = this.children = [];
      var transitionData = extractTransitionData(this);

      for (var i = 0; i < rawChildren.length; i++) {
        var c = rawChildren[i];
        if (c.tag) {
          if (c.key != null && String(c.key).indexOf('__vlist') !== 0) {
            children.push(c);
            map[c.key] = c
            ;(c.data || (c.data = {})).transition = transitionData;
          } else {
            var opts = c.componentOptions;
            var name = opts ? (opts.Ctor.options.name || opts.tag || '') : c.tag;
            warn(("<transition-group> children must be keyed: <" + name + ">"));
          }
        }
      }

      if (prevChildren) {
        var kept = [];
        var removed = [];
        for (var i$1 = 0; i$1 < prevChildren.length; i$1++) {
          var c$1 = prevChildren[i$1];
          c$1.data.transition = transitionData;
          c$1.data.pos = c$1.elm.getBoundingClientRect();
          if (map[c$1.key]) {
            kept.push(c$1);
          } else {
            removed.push(c$1);
          }
        }
        this.kept = h(tag, null, kept);
        this.removed = removed;
      }

      return h(tag, null, children)
    },

    updated: function updated () {
      var children = this.prevChildren;
      var moveClass = this.moveClass || ((this.name || 'v') + '-move');
      if (!children.length || !this.hasMove(children[0].elm, moveClass)) {
        return
      }

      // we divide the work into three loops to avoid mixing DOM reads and writes
      // in each iteration - which helps prevent layout thrashing.
      children.forEach(callPendingCbs);
      children.forEach(recordPosition);
      children.forEach(applyTranslation);

      // force reflow to put everything in position
      // assign to this to avoid being removed in tree-shaking
      // $flow-disable-line
      this._reflow = document.body.offsetHeight;

      children.forEach(function (c) {
        if (c.data.moved) {
          var el = c.elm;
          var s = el.style;
          addTransitionClass(el, moveClass);
          s.transform = s.WebkitTransform = s.transitionDuration = '';
          el.addEventListener(transitionEndEvent, el._moveCb = function cb (e) {
            if (e && e.target !== el) {
              return
            }
            if (!e || /transform$/.test(e.propertyName)) {
              el.removeEventListener(transitionEndEvent, cb);
              el._moveCb = null;
              removeTransitionClass(el, moveClass);
            }
          });
        }
      });
    },

    methods: {
      hasMove: function hasMove (el, moveClass) {
        /* istanbul ignore if */
        if (!hasTransition) {
          return false
        }
        /* istanbul ignore if */
        if (this._hasMove) {
          return this._hasMove
        }
        // Detect whether an element with the move class applied has
        // CSS transitions. Since the element may be inside an entering
        // transition at this very moment, we make a clone of it and remove
        // all other transition classes applied to ensure only the move class
        // is applied.
        var clone = el.cloneNode();
        if (el._transitionClasses) {
          el._transitionClasses.forEach(function (cls) { removeClass(clone, cls); });
        }
        addClass(clone, moveClass);
        clone.style.display = 'none';
        this.$el.appendChild(clone);
        var info = getTransitionInfo(clone);
        this.$el.removeChild(clone);
        return (this._hasMove = info.hasTransform)
      }
    }
  };

  function callPendingCbs (c) {
    /* istanbul ignore if */
    if (c.elm._moveCb) {
      c.elm._moveCb();
    }
    /* istanbul ignore if */
    if (c.elm._enterCb) {
      c.elm._enterCb();
    }
  }

  function recordPosition (c) {
    c.data.newPos = c.elm.getBoundingClientRect();
  }

  function applyTranslation (c) {
    var oldPos = c.data.pos;
    var newPos = c.data.newPos;
    var dx = oldPos.left - newPos.left;
    var dy = oldPos.top - newPos.top;
    if (dx || dy) {
      c.data.moved = true;
      var s = c.elm.style;
      s.transform = s.WebkitTransform = "translate(" + dx + "px," + dy + "px)";
      s.transitionDuration = '0s';
    }
  }

  var platformComponents = {
    Transition: Transition,
    TransitionGroup: TransitionGroup
  };

  /*  */

  // install platform specific utils
  Vue.config.mustUseProp = mustUseProp;
  Vue.config.isReservedTag = isReservedTag;
  Vue.config.isReservedAttr = isReservedAttr;
  Vue.config.getTagNamespace = getTagNamespace;
  Vue.config.isUnknownElement = isUnknownElement;

  // install platform runtime directives & components
  extend(Vue.options.directives, platformDirectives);
  extend(Vue.options.components, platformComponents);

  // install platform patch function
  // 给添加patch 补丁 虚拟DOM转为真实DOM
  Vue.prototype.__patch__ = inBrowser ? patch : noop;

  // public mount method
  // 实现$mount 也就是entry-runtime-with-compiler赋给mount的那个函数
  Vue.prototype.$mount = function (
    el,
    hydrating
  ) {
    // 只进行了一个操作
    el = el && inBrowser ? query(el) : undefined;
    // 返回mountComponent这个函数 在上方引入了，可以去看 todo:
    // 在initLiftCycle中导出
    return mountComponent(this, el, hydrating)
  };

  // devtools global hook
  /* istanbul ignore next */
  if (inBrowser) {
    setTimeout(function () {
      if (config.devtools) {
        if (devtools) {
          devtools.emit('init', Vue);
        } else {
          console[console.info ? 'info' : 'log'](
            'Download the Vue Devtools extension for a better development experience:\n' +
            'https://github.com/vuejs/vue-devtools'
          );
        }
      }
      if (
        config.productionTip !== false &&
        typeof console !== 'undefined'
      ) {
        console[console.info ? 'info' : 'log'](
          "You are running Vue in development mode.\n" +
          "Make sure to turn on production mode when deploying for production.\n" +
          "See more tips at https://vuejs.org/guide/deployment.html"
        );
      }
    }, 0);
  }

  /*  */

  // 匹配 {{}} 指令
  var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;
  // 匹配特殊符号  - 或者. 或者* 或者+ 或者? 或者^ 或者$ 或者{ 或者} 或者( 或者) 或者| 或者[ 或者] 或者/ 或者\
  var regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g;

  // 如果是使用了delimiters
  var buildRegex = cached(function (delimiters) {
    // $&与regexp相匹配的子串。 这里的意思是遇到了特殊符号的时候在正则里面需要替换加多一个/斜杠 
    var open = delimiters[0].replace(regexEscapeRE, '\\$&');
    var close = delimiters[1].replace(regexEscapeRE, '\\$&');
    // 匹配开始的open +任意字符或者换行符+ close 全局匹配
    return new RegExp(open + '((?:.|\\n)+?)' + close, 'g')
  });




  //匹配{{}} 指令，并且把他转换成 虚拟dom vonde 需要渲染的函数,比如指令{{name}}转换成 _s(name)
  //<p>{{name}} + {{age}} + {{sex}} + {{obj.a}}</p> 会转换成 _s(name)+" + "+_s(age)+" + "+_s(sex)+" + "+_s(obj.a)
  function parseText (
    text,  // 字符串
    delimiters  // delimiters 手动修改的插值
  ) {
    // 如果有delimiter就使用 buildRegex去匹配  没有就使用defaultTagRe匹配{{}}指令
    var tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE;
    // 如果没有匹配到 直接返回
    if (!tagRE.test(text)) {
      return
    }

    var tokens = [];
    var rawTokens = [];
    var lastIndex = tagRE.lastIndex = 0;
    var match, index, tokenValue;
    // 通过exec和lastIndex找到全局中匹配的属性
    // 也就是找到所有被{{}}包括的
    while ((match = tagRE.exec(text))) {
      // 循环能匹配上的指令，全局匹配代码：的时候会有个lastIndex  
      // 执行exec方法后，lastIndex就会记录匹配的字符串在原始字符串中最后一位的索引加一，

      // 当前匹配上的字符串位置，也可以是上一次匹配出来的位置
      index = match.index;
      // push text token
      if (index > lastIndex) {
        // 截取匹配到字符串指令前面的字符串，并添加到rawTokens
        rawTokens.push(tokenValue = text.slice(lastIndex, index));
        // 添加匹配到字符串指令前面的字符串
        tokens.push(JSON.stringify(tokenValue));
      }
      // tag token
      // 处理value 解析成正确的value，把过滤器 转换成vue 
      // 虚拟dom的解析方法函数 比如把过滤器 ' ab | c | d' 转换成 _f("d")(_f("c")(ab))
      var exp = parseFilters(match[1].trim());
      // 这里exp 其实就是将 {{内部内容}}  内部内容拿出来了
      // <p>{{name}} + {{age}} + {{sex}} + {{obj.a}}</p>
      // name age sex obj.a
      // console.log(exp)
      // 把指令转义成函数，便于vonde 虚拟dom 渲染 比如指令{{name}} 转换成 _s(name)
      tokens.push(("_s(" + exp + ")"));
      // tokens: ["_s(name)", "" + "", "_s(age)", "" + "", "_s(sex)", "" + "", "_s(obj.a)"]
      // console.log(tokens)
      // 绑定指令{{name}} 指令转换成  [{@binding: "name"}]
      rawTokens.push({ '@binding': exp });
      // 上一次匹配出来的字符串的位置+上一次字符串的长度  
      lastIndex = index + match[0].length;
    }
    // 拼接最后一个字符， 把最后一个{{}}之后的字符串连接起来
    if (lastIndex < text.length) {
      // 截取字符串。到最后一位
      rawTokens.push(tokenValue = text.slice(lastIndex));
      // 拼接最后一位字符串
      tokens.push(JSON.stringify(tokenValue));
    }
    // console.log(rawTokens)
    // console.log(tokens.join('+'))
    return {
      expression: tokens.join('+'),//把数组变成字符串，用加号链接 _s(name)+" + "+_s(age)+" + "+_s(sex)+" + "+_s(obj.a)
      tokens: rawTokens // (7) [{…}, " + ", {…}, " + ", {…}, " + ", {…}]
                        // 0: {@binding: "name"}
                        // 1: " + "
                        // 2: {@binding: "age"}
                        // 3: " + "
                        // 4: {@binding: "sex"}
                        // 5: " + "
                        // 6: {@binding: "obj.a"}
    }
  }

  /*  */

  // 获取class属性和v-bind:class或:class的属性名
  function transformNode (el, options) {
    // 获取警告函数
    var warn = options.warn || baseWarn;
    // 获取到el下所有的class 没有class的标签为undefined
    var staticClass = getAndRemoveAttr(el, 'class');
    // console.log(staticClass)
    if ( staticClass) {
      // 返回那些{{}}的值 parseText 传入staticClass
      // 如果有返回值，代表有的class 使用了 {{}} 语法
      var res = parseText(staticClass, options.delimiters);
      // 如果存在，代表使用了class =  {{val}}，这是错误的，所以应该用v-bind 或:class 
      // 发出警告
      if (res) {
        warn(
          "class=\"" + staticClass + "\": " +
          'Interpolation inside attributes has been removed. ' +
          'Use v-bind or the colon shorthand instead. For example, ' +
          'instead of <div class="{{ val }}">, use <div :class="val">.',
          el.rawAttrsMap['class']
        );
      }
    }
    // 如果staticClass存在，代表有class属性，转字符串
    if (staticClass) {
      // 将之前的class 加上双引号，也就是转字符串  比如之前staticclass是 btn 现在是 "btn"
      el.staticClass = JSON.stringify(staticClass);
    }
    // 获取到v-bind:class = ''  和 :class = ''
    var classBinding = getBindingAttr(el, 'class', false /* getStatic */);
    if (classBinding) {
      // 赋给el.classBinding 通过v-bind:class 和:class绑定的属性名
      el.classBinding = classBinding;
    }
  }

  function genData (el) {
    var data = '';
    if (el.staticClass) {
      data += "staticClass:" + (el.staticClass) + ",";
    }
    if (el.classBinding) {
      data += "class:" + (el.classBinding) + ",";
    }
    return data
  }

  var klass$1 = {
    staticKeys: ['staticClass'],
    transformNode: transformNode,
    genData: genData
  };

  /*  */

  // 获取style和v-bind:style和:style的值，并对static的style值进行转换后
  // 'width:100px; height:200px;'最后会转为{"width": "100px", "height": "200px"}
  function transformNode$1 (el, options) {
    // 获取警告函数
    var warn = options.warn || baseWarn;
    // 获取所有style的属性值
    var staticStyle = getAndRemoveAttr(el, 'style');
    // 如果style的值存在
    if (staticStyle) {
      /* istanbul ignore if */
      {
        // 进行{{}}解析 如果有返回值，代表出现了 style = {{red}}这种，报错
        var res = parseText(staticStyle, options.delimiters);
        if (res) {
          warn(
            "style=\"" + staticStyle + "\": " +
            'Interpolation inside attributes has been removed. ' +
            'Use v-bind or the colon shorthand instead. For example, ' +
            'instead of <div style="{{ val }}">, use <div :style="val">.',
            el.rawAttrsMap['style']
          );
        }
      }
      // console.log(parseStyleText('width:100px; height:200px;'))
      // {width: "100px", height: "200px"}
      // 将style属性值经过这样的变化后再转为json字符串，如下
      el.staticStyle = JSON.stringify(parseStyleText(staticStyle));
      // {"width": "100px", "height": "200px"}
    }

    // 获取 v-bind:style="xxx" :style="xxx" 放在styleBinding
    var styleBinding = getBindingAttr(el, 'style', false /* getStatic */);
    // 将v-bind:style 和 :style的值赋给el.styleBinding
    if (styleBinding) {
      el.styleBinding = styleBinding;
    }
  }

  function genData$1 (el) {
    var data = '';
    if (el.staticStyle) {
      data += "staticStyle:" + (el.staticStyle) + ",";
    }
    if (el.styleBinding) {
      data += "style:(" + (el.styleBinding) + "),";
    }
    return data
  }

  var style$1 = {
    staticKeys: ['staticStyle'],
    transformNode: transformNode$1,
    genData: genData$1
  };

  /*  */

  var decoder;

  var he = {
    decode: function decode (html) {
      decoder = decoder || document.createElement('div');
      decoder.innerHTML = html;
      return decoder.textContent
    }
  };

  /*  */

  var isUnaryTag = makeMap(
    'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
    'link,meta,param,source,track,wbr'
  );

  // Elements that you can, intentionally, leave open
  // (and which close themselves)
  var canBeLeftOpenTag = makeMap(
    'colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source'
  );

  // HTML5 tags https://html.spec.whatwg.org/multipage/indices.html#elements-3
  // Phrasing Content https://html.spec.whatwg.org/multipage/dom.html#phrasing-content
  var isNonPhrasingTag = makeMap(
    'address,article,aside,base,blockquote,body,caption,col,colgroup,dd,' +
    'details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,' +
    'h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,' +
    'optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,' +
    'title,tr,track'
  );

  /**
   * Not type-checking this file because it's mostly vendor code.
   */

  // Regular Expressions for parsing tags and attributes
  var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  var dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z" + (unicodeRegExp.source) + "]*";
  var qnameCapture = "((?:" + ncname + "\\:)?" + ncname + ")";
  var startTagOpen = new RegExp(("^<" + qnameCapture));
  var startTagClose = /^\s*(\/?)>/;
  var endTag = new RegExp(("^<\\/" + qnameCapture + "[^>]*>"));
  var doctype = /^<!DOCTYPE [^>]+>/i;
  // #7298: escape - to avoid being pased as HTML comment when inlined in page
  var comment = /^<!\--/;
  var conditionalComment = /^<!\[/;

  // Special Elements (can contain anything)
  var isPlainTextElement = makeMap('script,style,textarea', true);
  var reCache = {};

  var decodingMap = {
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&amp;': '&',
    '&#10;': '\n',
    '&#9;': '\t',
    '&#39;': "'"
  };
  var encodedAttr = /&(?:lt|gt|quot|amp|#39);/g;
  var encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#39|#10|#9);/g;

  // #5992
  var isIgnoreNewlineTag = makeMap('pre,textarea', true);
  var shouldIgnoreFirstNewline = function (tag, html) { return tag && isIgnoreNewlineTag(tag) && html[0] === '\n'; };

  function decodeAttr (value, shouldDecodeNewlines) {
    var re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr;
    return value.replace(re, function (match) { return decodingMap[match]; })
  }

  function parseHTML (html, options) {
    var stack = [];
    var expectHTML = options.expectHTML;
    var isUnaryTag = options.isUnaryTag || no;
    var canBeLeftOpenTag = options.canBeLeftOpenTag || no;
    var index = 0;
    var last, lastTag;
    while (html) {
      last = html;
      // Make sure we're not in a plaintext content element like script/style
      if (!lastTag || !isPlainTextElement(lastTag)) {
        var textEnd = html.indexOf('<');
        if (textEnd === 0) {
          // Comment:
          if (comment.test(html)) {
            var commentEnd = html.indexOf('-->');

            if (commentEnd >= 0) {
              if (options.shouldKeepComment) {
                options.comment(html.substring(4, commentEnd), index, index + commentEnd + 3);
              }
              advance(commentEnd + 3);
              continue
            }
          }

          // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
          if (conditionalComment.test(html)) {
            var conditionalEnd = html.indexOf(']>');

            if (conditionalEnd >= 0) {
              advance(conditionalEnd + 2);
              continue
            }
          }

          // Doctype:
          var doctypeMatch = html.match(doctype);
          if (doctypeMatch) {
            advance(doctypeMatch[0].length);
            continue
          }

          // End tag:
          var endTagMatch = html.match(endTag);
          if (endTagMatch) {
            var curIndex = index;
            advance(endTagMatch[0].length);
            parseEndTag(endTagMatch[1], curIndex, index);
            continue
          }

          // Start tag:
          var startTagMatch = parseStartTag();
          if (startTagMatch) {
            handleStartTag(startTagMatch);
            if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
              advance(1);
            }
            continue
          }
        }

        var text = (void 0), rest = (void 0), next = (void 0);
        if (textEnd >= 0) {
          rest = html.slice(textEnd);
          while (
            !endTag.test(rest) &&
            !startTagOpen.test(rest) &&
            !comment.test(rest) &&
            !conditionalComment.test(rest)
          ) {
            // < in plain text, be forgiving and treat it as text
            next = rest.indexOf('<', 1);
            if (next < 0) { break }
            textEnd += next;
            rest = html.slice(textEnd);
          }
          text = html.substring(0, textEnd);
        }

        if (textEnd < 0) {
          text = html;
        }

        if (text) {
          advance(text.length);
        }

        if (options.chars && text) {
          options.chars(text, index - text.length, index);
        }
      } else {
        var endTagLength = 0;
        var stackedTag = lastTag.toLowerCase();
        var reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'));
        var rest$1 = html.replace(reStackedTag, function (all, text, endTag) {
          endTagLength = endTag.length;
          if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
            text = text
              .replace(/<!\--([\s\S]*?)-->/g, '$1') // #7298
              .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1');
          }
          if (shouldIgnoreFirstNewline(stackedTag, text)) {
            text = text.slice(1);
          }
          if (options.chars) {
            options.chars(text);
          }
          return ''
        });
        index += html.length - rest$1.length;
        html = rest$1;
        parseEndTag(stackedTag, index - endTagLength, index);
      }

      if (html === last) {
        options.chars && options.chars(html);
        if ( !stack.length && options.warn) {
          options.warn(("Mal-formatted tag at end of template: \"" + html + "\""), { start: index + html.length });
        }
        break
      }
    }

    // Clean up any remaining tags
    parseEndTag();

    function advance (n) {
      index += n;
      html = html.substring(n);
    }

    function parseStartTag () {
      var start = html.match(startTagOpen);
      if (start) {
        var match = {
          tagName: start[1],
          attrs: [],
          start: index
        };
        advance(start[0].length);
        var end, attr;
        while (!(end = html.match(startTagClose)) && (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
          attr.start = index;
          advance(attr[0].length);
          attr.end = index;
          match.attrs.push(attr);
        }
        if (end) {
          match.unarySlash = end[1];
          advance(end[0].length);
          match.end = index;
          return match
        }
      }
    }

    function handleStartTag (match) {
      var tagName = match.tagName;
      var unarySlash = match.unarySlash;

      if (expectHTML) {
        if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
          parseEndTag(lastTag);
        }
        if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
          parseEndTag(tagName);
        }
      }

      var unary = isUnaryTag(tagName) || !!unarySlash;

      var l = match.attrs.length;
      var attrs = new Array(l);
      for (var i = 0; i < l; i++) {
        var args = match.attrs[i];
        var value = args[3] || args[4] || args[5] || '';
        var shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
          ? options.shouldDecodeNewlinesForHref
          : options.shouldDecodeNewlines;
        attrs[i] = {
          name: args[1],
          value: decodeAttr(value, shouldDecodeNewlines)
        };
        if ( options.outputSourceRange) {
          attrs[i].start = args.start + args[0].match(/^\s*/).length;
          attrs[i].end = args.end;
        }
      }

      if (!unary) {
        stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs, start: match.start, end: match.end });
        lastTag = tagName;
      }

      if (options.start) {
        options.start(tagName, attrs, unary, match.start, match.end);
      }
    }

    function parseEndTag (tagName, start, end) {
      var pos, lowerCasedTagName;
      if (start == null) { start = index; }
      if (end == null) { end = index; }

      // Find the closest opened tag of the same type
      if (tagName) {
        lowerCasedTagName = tagName.toLowerCase();
        for (pos = stack.length - 1; pos >= 0; pos--) {
          if (stack[pos].lowerCasedTag === lowerCasedTagName) {
            break
          }
        }
      } else {
        // If no tag name is provided, clean shop
        pos = 0;
      }

      if (pos >= 0) {
        // Close all the open elements, up the stack
        for (var i = stack.length - 1; i >= pos; i--) {
          if (
            (i > pos || !tagName) &&
            options.warn
          ) {
            options.warn(
              ("tag <" + (stack[i].tag) + "> has no matching end tag."),
              { start: stack[i].start, end: stack[i].end }
            );
          }
          if (options.end) {
            options.end(stack[i].tag, start, end);
          }
        }

        // Remove the open elements from the stack
        stack.length = pos;
        lastTag = pos && stack[pos - 1].tag;
      } else if (lowerCasedTagName === 'br') {
        if (options.start) {
          options.start(tagName, [], true, start, end);
        }
      } else if (lowerCasedTagName === 'p') {
        if (options.start) {
          options.start(tagName, [], false, start, end);
        }
        if (options.end) {
          options.end(tagName, start, end);
        }
      }
    }
  }

  /*  */

  // 判断是否是 @ 或 v-on: 开头的
  var onRE = /^@|^v-on:/;
  // 判断是否是 v- 或 @ 或 : 开头的 或. 开头的
  var dirRE = 
    /^v-|^@|^:/;
  // 匹配 含有 字符串 in 字符串 或者 字符串 of 字符串
  var forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
  // 匹配上,  但是属于两边是 [{ , 点 , }]  所以匹配上   ,+字符串
  var forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
  // 匹配括号 ()
  var stripParensRE = /^\(|\)$/g;
  // 匹配 []
  var dynamicArgRE = /^\[.*\]$/;

  // 匹配字符串是否含有 :
  var argRE = /:(.*)$/;
  // 匹配 以:或.或v-bind开头的
  var bindRE = /^:|^\.|^v-bind:/;
  // 匹配修饰符 . .] .]] 
  var modifierRE = /\.[^.\]]+(?=[^\]]*$)/g;

  // 以v-slot:开头 或以#开头
  var slotRE = /^v-slot(:|$)|^#/;

  var lineBreakRE = /[\r\n]/;
  var whitespaceRE$1 = /\s+/g;

  var invalidAttributeRE = /[\s"'<>\/=]/;

  var decodeHTMLCached = cached(he.decode);

  var emptySlotScopeToken = "_empty_";

  // configurable state
  var warn$2;
  var delimiters;
  var transforms;
  var preTransforms;
  var postTransforms;
  var platformIsPreTag;
  var platformMustUseProp;
  var platformGetTagNamespace;
  var maybeComponent;

  // 
  function createASTElement(
    tag, // 标签名
    attrs , // 属性列表数组
    parent // 父层
  ) {
    return {
      type: 1, // dom类型
      tag: tag, // 标签名
      attrsList: attrs, // 属性数组
      attrsMap: makeAttrsMap(attrs), 
      rawAttrsMap: {}, // 
      parent: parent, // 父层
      children: [] // children 
    }
  }

  /**
   * Convert HTML string to AST.
   * 将HTML字符串转换为AST。
   */
  // 这里面的一些options可以去看src\platforms\web\compiler\options.js
  function parse(
    template, // 传入 模板字符串 template.trim()
    options // 传入 finalOptions
  ) {
    // 获取警告函数
    warn$2 = options.warn || baseWarn;
    // isPreTag 判断是否是pre
    // export const isPreTag = (tag: ?string): boolean => tag === 'pre'
    platformIsPreTag = options.isPreTag || no; //方法
    // const acceptValue = makeMap('input,textarea,option,select,progress')
    // (attr === 'value' && acceptValue(tag)) && type !== 'button' ||
    // (attr === 'selected' && tag === 'option') ||
    // (attr === 'checked' && tag === 'input') ||
    // (attr === 'muted' && tag === 'video')
    // 
    /* mustUseProp 校验属性
     * 1. attr === 'value', tag 必须是 'input,textarea,option,select,progress' 其中一个 type !== 'button'
     * 2. attr === 'selected' && tag === 'option'
     * 3. attr === 'checked' && tag === 'input'
     * 4. attr === 'muted' && tag === 'video'
     * 的情况下为真
     * */
    platformMustUseProp = options.mustUseProp || no; // 方法
    // 判断 tag 是否是svg或者math 标签
    platformGetTagNamespace = options.getTagNamespace || no;
    // 判断 tag是否是HTML标签或是SVG标签
    var isReservedTag = options.isReservedTag || no;
    // el是否是组件或el.tag是否是HTMl标签或svg标签
    maybeComponent = function (el) { return !!el.component || !isReservedTag(el.tag); };
    // 如果options.moudles存在，循环遍历过滤options.modules[transformNode]属性，返回这个[key]的数组
    transforms = pluckModuleFunction(options.modules, 'transformNode');
    // 如果options.moudles存在，循环遍历过滤options.modules[preTransformNode]属性，返回这个[key]的数组
    preTransforms = pluckModuleFunction(options.modules, 'preTransformNode');
    // 如果options.moudles存在，循环遍历过滤options.modules[postTransformNode]属性，返回这个[key]的数组
    postTransforms = pluckModuleFunction(options.modules, 'postTransformNode');
    // 获取delimiters 转换插值操作的属性
    delimiters = options.delimiters;

    // console.log('=====transforms=====')
    /**
     * transforms = [
     *    transformNode,
     *    transformNode$1
     * ]
     */
    // transformNode,
    // 获取 class 属性和:class或者v-bind的动态属性值，
    // 并且转化成字符串 添加到staticClass和classBinding 属性中
    // staticClass存放 class的  classBinding存放 v-bind:class和:class的
    // function transformNode (el, options) {
    //   var warn = options.warn || baseWarn;
    //   var staticClass = getAndRemoveAttr(el, 'class');
    //   if ( staticClass) {
    //     var res = parseText(staticClass, options.delimiters);
    //     if (res) {
    //       warn(
    //         "class=\"" + staticClass + "\": " +
    //         'Interpolation inside attributes has been removed. ' +
    //         'Use v-bind or the colon shorthand instead. For example, ' +
    //         'instead of <div class="{{ val }}">, use <div :class="val">.',
    //         el.rawAttrsMap['class']
    //       );
    //     }
    //   }
    //   if (staticClass) {
    //     el.staticClass = JSON.stringify(staticClass);
    //   }
    //   var classBinding = getBindingAttr(el, 'class', false /* getStatic */);
    //   if (classBinding) {
    //     el.classBinding = classBinding;
    //   }
    // }
    // transformNode$1
    // transformNode$1获取 style属性和:style或者v-bind的动态属性值，
    // 并且转化成字符串 添加到staticStyle和styleBinding属性中
    // style在staticStyle中 v-bind:style和:stlye在styleBinding中
    // function transformNode$1 (el, options) {
    //   var warn = options.warn || baseWarn;
    //   var staticStyle = getAndRemoveAttr(el, 'style');
    //   if (staticStyle) {
    //     /* istanbul ignore if */
    //     {
    //       var res = parseText(staticStyle, options.delimiters);
    //       if (res) {
    //         warn(
    //           "style=\"" + staticStyle + "\": " +
    //           'Interpolation inside attributes has been removed. ' +
    //           'Use v-bind or the colon shorthand instead. For example, ' +
    //           'instead of <div style="{{ val }}">, use <div :style="val">.',
    //           el.rawAttrsMap['style']
    //         );
    //       }
    //     }
    //     el.staticStyle = JSON.stringify(parseStyleText(staticStyle));
    //   }

    //   var styleBinding = getBindingAttr(el, 'style', false /* getStatic */);
    //   if (styleBinding) {
    //     el.styleBinding = styleBinding;
    //   }
    // }




    // console.log(transforms)


    // console.log('=====preTransforms=====')
    /**
     * preTransforms = [
     *    preTransfornNode
     * ]
     */
    // preTransforms
    // preTransformNode把attrsMap与attrsList属性值转换添加到el   
    // ast虚拟dom中为虚拟dom添加for，alias，iterator1，iterator2， 
    // addRawAttr ，type ，key， ref，slotName或者slotScope
    // 或者slot，component或者inlineTemplate ， plain，if ，else，elseif 属性

    // function preTransformNode (el, options) {
    //   if (el.tag === 'input') {
    //     var map = el.attrsMap;
    //     if (!map['v-model']) {
    //       return
    //     }

    //     var typeBinding;
    //     if (map[':type'] || map['v-bind:type']) {
    //       typeBinding = getBindingAttr(el, 'type');
    //     }
    //     if (!map.type && !typeBinding && map['v-bind']) {
    //       typeBinding = "(" + (map['v-bind']) + ").type";
    //     }

    //     if (typeBinding) {
    //       var ifCondition = getAndRemoveAttr(el, 'v-if', true);
    //       var ifConditionExtra = ifCondition ? ("&&(" + ifCondition + ")") : "";
    //       var hasElse = getAndRemoveAttr(el, 'v-else', true) != null;
    //       var elseIfCondition = getAndRemoveAttr(el, 'v-else-if', true);
    //       // 1. checkbox
    //       var branch0 = cloneASTElement(el);
    //       // process for on the main node
    //       processFor(branch0);
    //       addRawAttr(branch0, 'type', 'checkbox');
    //       processElement(branch0, options);
    //       branch0.processed = true; // prevent it from double-processed
    //       branch0.if = "(" + typeBinding + ")==='checkbox'" + ifConditionExtra;
    //       addIfCondition(branch0, {
    //         exp: branch0.if,
    //         block: branch0
    //       });
    //       // 2. add radio else-if condition
    //       var branch1 = cloneASTElement(el);
    //       getAndRemoveAttr(branch1, 'v-for', true);
    //       addRawAttr(branch1, 'type', 'radio');
    //       processElement(branch1, options);
    //       addIfCondition(branch0, {
    //         exp: "(" + typeBinding + ")==='radio'" + ifConditionExtra,
    //         block: branch1
    //       });
    //       // 3. other
    //       var branch2 = cloneASTElement(el);
    //       getAndRemoveAttr(branch2, 'v-for', true);
    //       addRawAttr(branch2, ':type', typeBinding);
    //       processElement(branch2, options);
    //       addIfCondition(branch0, {
    //         exp: ifCondition,
    //         block: branch2
    //       });

    //       if (hasElse) {
    //         branch0.else = true;
    //       } else if (elseIfCondition) {
    //         branch0.elseif = elseIfCondition;
    //       }

    //       return branch0
    //     }
    //   }
    // }
    // console.log(preTransforms)






    // console.log('=====postTransforms=====')

    /**
     * postTramsforms = [
     *    空
     * ]
     */
    // console.log(postTransforms)


    // 到这
    var stack = [];
    var preserveWhitespace = options.preserveWhitespace !== false;
    var whitespaceOption = options.whitespace;
    var root;
    var currentParent;
    var inVPre = false;
    var inPre = false;
    var warned = false;

    function warnOnce(msg, range) {
      if (!warned) {
        warned = true;
        warn$2(msg, range);
      }
    }

    function closeElement(element) {
      trimEndingWhitespace(element);
      if (!inVPre && !element.processed) {
        element = processElement(element, options);
      }
      // tree management
      if (!stack.length && element !== root) {
        // allow root elements with v-if, v-else-if and v-else
        if (root.if && (element.elseif || element.else)) {
          {
            checkRootConstraints(element);
          }
          addIfCondition(root, {
            exp: element.elseif,
            block: element
          });
        } else {
          warnOnce(
            "Component template should contain exactly one root element. " +
            "If you are using v-if on multiple elements, " +
            "use v-else-if to chain them instead.", {
              start: element.start
            }
          );
        }
      }
      if (currentParent && !element.forbidden) {
        if (element.elseif || element.else) {
          processIfConditions(element, currentParent);
        } else {
          if (element.slotScope) {
            // scoped slot
            // keep it in the children list so that v-else(-if) conditions can
            // find it as the prev node.
            var name = element.slotTarget || '"default"';
            (currentParent.scopedSlots || (currentParent.scopedSlots = {}))[name] = element;
          }
          currentParent.children.push(element);
          element.parent = currentParent;
        }
      }

      // final children cleanup
      // filter out scoped slots
      element.children = element.children.filter(function (c) { return !(c).slotScope; });
      // remove trailing whitespace node again
      trimEndingWhitespace(element);

      // check pre state
      if (element.pre) {
        inVPre = false;
      }
      if (platformIsPreTag(element.tag)) {
        inPre = false;
      }
      // apply post-transforms
      for (var i = 0; i < postTransforms.length; i++) {
        postTransforms[i](element, options);
      }
    }

    function trimEndingWhitespace(el) {
      // remove trailing whitespace node
      if (!inPre) {
        var lastNode;
        while (
          (lastNode = el.children[el.children.length - 1]) &&
          lastNode.type === 3 &&
          lastNode.text === ' '
        ) {
          el.children.pop();
        }
      }
    }

    function checkRootConstraints(el) {
      if (el.tag === 'slot' || el.tag === 'template') {
        warnOnce(
          "Cannot use <" + (el.tag) + "> as component root element because it may " +
          'contain multiple nodes.', {
            start: el.start
          }
        );
      }
      if (el.attrsMap.hasOwnProperty('v-for')) {
        warnOnce(
          'Cannot use v-for on stateful component root element because ' +
          'it renders multiple elements.',
          el.rawAttrsMap['v-for']
        );
      }
    }

    parseHTML(template, {
      warn: warn$2,
      expectHTML: options.expectHTML,
      isUnaryTag: options.isUnaryTag,
      canBeLeftOpenTag: options.canBeLeftOpenTag,
      shouldDecodeNewlines: options.shouldDecodeNewlines,
      shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
      shouldKeepComment: options.comments,
      outputSourceRange: options.outputSourceRange,
      start: function start(tag, attrs, unary, start$1, end) {
        // check namespace.
        // inherit parent ns if there is one
        var ns = (currentParent && currentParent.ns) || platformGetTagNamespace(tag);

        // handle IE svg bug
        /* istanbul ignore if */
        if (isIE && ns === 'svg') {
          attrs = guardIESVGBug(attrs);
        }

        var element = createASTElement(tag, attrs, currentParent);
        if (ns) {
          element.ns = ns;
        }

        {
          if (options.outputSourceRange) {
            element.start = start$1;
            element.end = end;
            element.rawAttrsMap = element.attrsList.reduce(function (cumulated, attr) {
              cumulated[attr.name] = attr;
              return cumulated
            }, {});
          }
          attrs.forEach(function (attr) {
            if (invalidAttributeRE.test(attr.name)) {
              warn$2(
                "Invalid dynamic argument expression: attribute names cannot contain " +
                "spaces, quotes, <, >, / or =.", {
                  start: attr.start + attr.name.indexOf("["),
                  end: attr.start + attr.name.length
                }
              );
            }
          });
        }

        if (isForbiddenTag(element) && !isServerRendering()) {
          element.forbidden = true;
           warn$2(
            'Templates should only be responsible for mapping the state to the ' +
            'UI. Avoid placing tags with side-effects in your templates, such as ' +
            "<" + tag + ">" + ', as they will not be parsed.', {
              start: element.start
            }
          );
        }

        // apply pre-transforms
        for (var i = 0; i < preTransforms.length; i++) {
          element = preTransforms[i](element, options) || element;
        }

        if (!inVPre) {
          processPre(element);
          if (element.pre) {
            inVPre = true;
          }
        }
        if (platformIsPreTag(element.tag)) {
          inPre = true;
        }
        if (inVPre) {
          processRawAttrs(element);
        } else if (!element.processed) {
          // structural directives
          processFor(element);
          processIf(element);
          processOnce(element);
        }

        if (!root) {
          root = element;
          {
            checkRootConstraints(root);
          }
        }

        if (!unary) {
          currentParent = element;
          stack.push(element);
        } else {
          closeElement(element);
        }
      },

      end: function end(tag, start, end$1) {
        var element = stack[stack.length - 1];
        // pop stack
        stack.length -= 1;
        currentParent = stack[stack.length - 1];
        if ( options.outputSourceRange) {
          element.end = end$1;
        }
        closeElement(element);
      },

      chars: function chars(text, start, end) {
        if (!currentParent) {
          {
            if (text === template) {
              warnOnce(
                'Component template requires a root element, rather than just text.', {
                  start: start
                }
              );
            } else if ((text = text.trim())) {
              warnOnce(
                ("text \"" + text + "\" outside root element will be ignored."), {
                  start: start
                }
              );
            }
          }
          return
        }
        // IE textarea placeholder bug
        /* istanbul ignore if */
        if (isIE &&
          currentParent.tag === 'textarea' &&
          currentParent.attrsMap.placeholder === text
        ) {
          return
        }
        var children = currentParent.children;
        if (inPre || text.trim()) {
          text = isTextTag(currentParent) ? text : decodeHTMLCached(text);
        } else if (!children.length) {
          // remove the whitespace-only node right after an opening tag
          text = '';
        } else if (whitespaceOption) {
          if (whitespaceOption === 'condense') {
            // in condense mode, remove the whitespace node if it contains
            // line break, otherwise condense to a single space
            text = lineBreakRE.test(text) ? '' : ' ';
          } else {
            text = ' ';
          }
        } else {
          text = preserveWhitespace ? ' ' : '';
        }
        if (text) {
          if (!inPre && whitespaceOption === 'condense') {
            // condense consecutive whitespaces into single space
            text = text.replace(whitespaceRE$1, ' ');
          }
          var res;
          var child;
          if (!inVPre && text !== ' ' && (res = parseText(text, delimiters))) {
            child = {
              type: 2,
              expression: res.expression,
              tokens: res.tokens,
              text: text
            };
          } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
            child = {
              type: 3,
              text: text
            };
          }
          if (child) {
            if ( options.outputSourceRange) {
              child.start = start;
              child.end = end;
            }
            children.push(child);
          }
        }
      },
      comment: function comment(text, start, end) {
        // adding anyting as a sibling to the root node is forbidden
        // comments should still be allowed, but ignored
        if (currentParent) {
          var child = {
            type: 3,
            text: text,
            isComment: true
          };
          if ( options.outputSourceRange) {
            child.start = start;
            child.end = end;
          }
          currentParent.children.push(child);
        }
      }
    });
    return root
  }

  function processPre(el) {
    if (getAndRemoveAttr(el, 'v-pre') != null) {
      el.pre = true;
    }
  }

  function processRawAttrs(el) {
    var list = el.attrsList;
    var len = list.length;
    if (len) {
      var attrs = el.attrs = new Array(len);
      for (var i = 0; i < len; i++) {
        attrs[i] = {
          name: list[i].name,
          value: JSON.stringify(list[i].value)
        };
        if (list[i].start != null) {
          attrs[i].start = list[i].start;
          attrs[i].end = list[i].end;
        }
      }
    } else if (!el.pre) {
      // non root node in pre blocks with no attributes
      el.plain = true;
    }
  }
  // branch0是AST
  // processElement(branch0, options)
  function processElement(
    element,
    options
  ) {
    // 获取动态绑定的key值，并且给AST添加key属性 也就是动态绑定的key值，
    // 如果在template中报错或者不能使用v-for的index作为 <transition-group> 儿子的key
    processKey(element);

    // determine whether this is a plain element after
    // removing structural attributes
    // 确定这是否是一个普通元素后
    // 删除结构属性
    element.plain = (
      !element.key && // 如果key值不存在
      !element.scopedSlots && // 并且scopedSlots不存在
      !element.attrsList.length // 并且attrsList.length为0时
    );
    // 满足上面三种情况，element.plain为true，否则反之

    // 获取动态绑定的ref属性值，给AST添加ref属性 值为动态绑定的ref的值
    // 给AST添加refInfor属性，根据是否拥有v-for指令进行赋值
    processRef(element);

    // 处理作为slot传递给组件的内容
    processSlotContent(element);
    // 处理<slot/>
    processSlotOutlet(element);
    // 处理:is 动态组件的 如果存在:is 给el添加component属性为:is的值，
    // 如果有inline-template属性，也会添加inlineTemplate属性为true
    processComponent(element);

    // 遍历transforms方法数组  里面的方法就是获取所有class和style，
    // 静态的放staticClass和staticStyle
    // 动态的放classBinding和styleBinding

    // 获取 class 属性和:class或者v-bind的动态属性值，
    // 并且转化成字符串 添加到staticClass和classBinding 属性中
    // transformNode$1获取 style属性和:style或者v-bind的动态属性值
    // 并且转化成字符串 添加到staticStyle和styleBinding属性中
    // style在staticStyle中 v-bind:style和:stlye在styleBinding中
    for (var i = 0; i < transforms.length; i++) {
      // 给element添加了staticClass和staticStyle和calssBinding和styleBinding属性
      element = transforms[i](element, options) || element;
    }
    // 检查属性，为虚拟dom属性转换成对应需要的虚拟dom vonde数据 
    // 为AST 添加muted， events，nativeEvents，directives
    processAttrs(element);
    // 经过这些操作后，返回这个AST
    return element
  }

  function processKey(el) {
    // 获取 v-bind:key或:key的属性值 并经过过滤器解析后返回的值，
    // 其实就是:key和v-bind:key后面的值
    var exp = getBindingAttr(el, 'key');
    // 如果exp存在，也就是有动态绑定的key值
    if (exp) {
      {
        // 如果这个AST的标签名是template 警告
        if (el.tag === 'template') {
          warn$2(
            "<template> cannot be keyed. Place the key on real elements instead.",
            getRawBindingAttr(el, 'key')
          );
        }
        // 如果AST中有for 也就是 v-for = item in list的list时
        if (el.for) {
          // 获取iterator  iterator2是(item, index, value) 中的第三个，如果没有
          // 就取iterator1 也就是index 如果没有就是undefined
          var iterator = el.iterator2 || el.iterator1;
          // 获取父层属性
          var parent = el.parent;
          // 如果iterator存在并且 等于 exp也就是key值 并且父标签为transition-group
          if (iterator && iterator === exp && parent && parent.tag === 'transition-group') {
            // 报错
            // 不能使用v-for的index作为 <transition-group> 儿子的key
            warn$2(
              "Do not use v-for index as key on <transition-group> children, " +
              "this is the same as not using keys.",
              getRawBindingAttr(el, 'key'),
              true /* tip */
            );
          }
        }
      }
      // 给AST添加key属性 也就是动态绑定的key值
      el.key = exp;
    }
  }
  //获取ref 属性，并且判断ref 是否含有v-for指令
  function processRef(el) {
    // 通过getBindingAttr获取动态绑定的ref属性值，并且这个值是经过过滤器解析后的值
    var ref = getBindingAttr(el, 'ref');
    // 如果有动态绑定的ref的值
    if (ref) {
      // 给AST添加ref属性 值为动态绑定的ref的值
      el.ref = ref;
      // 遍历当前AST， 如果v-for，返回true，没有v-for 返回false
      // 给AST添加refInfor属性，根据是否拥有v-for指令进行赋值
      el.refInFor = checkInFor(el);
    }
  }
  // 判断v-for属性是否存在 如果有则通过parseFor转义v-for指令 
  // 把for，alias，iterator1，iterator2属性添加到虚拟dom中
  function processFor(el) {
    var exp;
    // 获取el的v-for属性并进行判断，如果v-for属性存在，执行下面
    if ((exp = getAndRemoveAttr(el, 'v-for'))) {
      // 通过parseFor能获取到 res.for是for后面的值， 
      // res.alias和res.iterator1和res.iterator2分别根据参数个数来
      // 根据v-for="(item, index, value) in list"这个参数来，依次对应
      var res = parseFor(exp);
      // 如果res存在
      if (res) {
        // 将res中的属性for，alias，iterator1，iterator2混合到el中
        extend(el, res);
      } else {
        warn$2(
          ("Invalid v-for expression: " + exp),
          el.rawAttrsMap['v-for']
        );
      }
    }
  }



  // v-for="item in list" 
  // inMatch = [
  // 0: "(item, key) in list"
  // 1: "(item, key)"
  // 2: "list"
  // groups: undefined
  // index: 0
  // input: "(item, key) in list"
  // length: 3
  // ]
  function parseFor(exp) {
    // forAliasRE 匹配 含有 字符串 in 字符串 或者 字符串 of 字符串
    var inMatch = exp.match(forAliasRE);
    // console.log(inMatch)
    // 如果没有这种匹配，直接返回
    if (!inMatch) { return }
    // res空对象
    var res = {};
    // res.for = list 也就是 for后面的内容
    res.for = inMatch[2].trim();
    // stripParensRE 匹配括号 () 也就是把括号替换成''
    // 去除括号 比如(item, key) in list 变成 item, key 
    var alias = inMatch[1].trim().replace(stripParensRE, '');

    // item, key 去通过 forIteratorRE匹配 
    // iteratorMatch = [
    //   0: ", key"
    //   1: " key"
    //   2: undefined
    //   groups: undefined
    //   index: 4
    //   input: "item, key"
    //   length: 3
    //   ]
    // 如果是item in list 是匹配不到的

    // 匹配上,  但是属于两边是 [{ , 点 , }]  所以匹配上   ,+字符串
    // export const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/
    var iteratorMatch = alias.match(forIteratorRE);

    // 如果iteratorMatch存在 代表传入的是 (item, index) in list 起码两个参数或以上
    if (iteratorMatch) {
      // item
      res.alias = alias.replace(forIteratorRE, '').trim();
      // console.log(res.alias)
      // key
      res.iterator1 = iteratorMatch[1].trim();
      if (iteratorMatch[2]) {
        // 如果2存在 给赋值2
        res.iterator2 = iteratorMatch[2].trim();
      }
    } else {
      // 如果iteratorMatch不存在，代表只是v-for="item in list"
      // 所以alias = item
      res.alias = alias;
    }
    // 返回res
    return res
  }

  function processIf(el) {
    var exp = getAndRemoveAttr(el, 'v-if');
    if (exp) {
      el.if = exp;
      addIfCondition(el, {
        exp: exp,
        block: el
      });
    } else {
      if (getAndRemoveAttr(el, 'v-else') != null) {
        el.else = true;
      }
      var elseif = getAndRemoveAttr(el, 'v-else-if');
      if (elseif) {
        el.elseif = elseif;
      }
    }
  }

  function processIfConditions(el, parent) {
    var prev = findPrevElement(parent.children);
    if (prev && prev.if) {
      addIfCondition(prev, {
        exp: el.elseif,
        block: el
      });
    } else {
      warn$2(
        "v-" + (el.elseif ? ('else-if="' + el.elseif + '"') : 'else') + " " +
        "used on element <" + (el.tag) + "> without corresponding v-if.",
        el.rawAttrsMap[el.elseif ? 'v-else-if' : 'v-else']
      );
    }
  }

  function findPrevElement(children )  {
    var i = children.length;
    while (i--) {
      if (children[i].type === 1) {
        return children[i]
      } else {
        if ( children[i].text !== ' ') {
          warn$2(
            "text \"" + (children[i].text.trim()) + "\" between v-if and v-else(-if) " +
            "will be ignored.",
            children[i]
          );
        }
        children.pop();
      }
    }
  }

  // 为if指令添加标记
  function addIfCondition(el, condition) {
    // 如果ifConditions不存在
    if (!el.ifConditions) {
      // 给空数组
      el.ifConditions = [];
    }
    // 存在，就添加condition
    el.ifConditions.push(condition);
  }

  function processOnce(el) {
    var once = getAndRemoveAttr(el, 'v-once');
    if (once != null) {
      el.once = true;
    }
  }

  // handle content being passed to a component as slot,
  // e.g. <template slot="xxx">, <div slot-scope="xxx">
  // 处理作为slot传递给组件的内容，
  // e、 g.<template slot=“xxx”>，<div slot scope=“xxx”></div>
  function processSlotContent(el) {
    var slotScope;
    // 如果AST是template
    if (el.tag === 'template') {
      // 通过getAndRemoveAttr将el的scope属性取出
      slotScope = getAndRemoveAttr(el, 'scope');
      // 忽略
      /* istanbul ignore if */
      if ( slotScope) {
        warn$2(
          "the \"scope\" attribute for scoped slots have been deprecated and " +
          "replaced by \"slot-scope\" since 2.5. The new \"slot-scope\" attribute " +
          "can also be used on plain elements in addition to <template> to " +
          "denote scoped slots.",
          el.rawAttrsMap['scope'],
          true
        );
      }
      el.slotScope = slotScope || getAndRemoveAttr(el, 'slot-scope');
    // 如果获取到slot-scope属性
    } else if ((slotScope = getAndRemoveAttr(el, 'slot-scope'))) {
      /* istanbul ignore if */
      if ( el.attrsMap['v-for']) {
        warn$2(
          "Ambiguous combined usage of slot-scope and v-for on <" + (el.tag) + "> " +
          "(v-for takes higher priority). Use a wrapper <template> for the " +
          "scoped slot to make it clearer.",
          el.rawAttrsMap['slot-scope'],
          true
        );
      }
      el.slotScope = slotScope;
    }

    // slot="xxx"
    // 获取动态绑定的slot值，而这个值是经过过滤器解析的
    var slotTarget = getBindingAttr(el, 'slot');
    // 如果存在动态绑定的slot值
    if (slotTarget) {
      // 如果slot是空值就为default默认值，否则为原本值
      el.slotTarget = slotTarget === '""' ? '"default"' : slotTarget;
      // 如果有:slot或者v-bind:slot 就为true
      el.slotTargetDynamic = !!(el.attrsMap[':slot'] || el.attrsMap['v-bind:slot']);

      // preserve slot as an attribute for native shadow DOM compat
      // only for non-scoped slots.
      // 将slot保留为原生shadow DOM compat的属性仅适用于非作用域插槽。

      // 如果不是template 并且 sloctScope不存在
      if (el.tag !== 'template' && !el.slotScope) {
        // 添加attrs属性 并将plain置为false
        addAttr(el, 'slot', slotTarget, getRawBindingAttr(el, 'slot'));
      }
    }

    // 2.6 v-slot syntax
    // 2.6版本的v-slot 语法
    {
      // 如果是template标签
      if (el.tag === 'template') {
        // v-slot on <template>  以v-slot:开头 或以#开头
        // 通过正则匹配返回并移除掉属性列表上的属性，这里是返回v-slot，如果有的话
        var slotBinding = getAndRemoveAttrByRegex(el, slotRE);
        // {name: "v-slot", value: "abc", start: 31, end: 43}

        // 如果存在v-slot属性
        if (slotBinding) {
          {
            // slotTarget是动态绑定的slot值 slotScope是slot值
            // 也就是说如果存在slot 警告
            if (el.slotTarget || el.slotScope) {
              warn$2(
                "Unexpected mixed usage of different slot syntaxes.",
                el
              );
            }
            // 如果AST有父级 并且 el不是组件
            // 警告 v-slot只能在root级组件
            if (el.parent && !maybeComponent(el.parent)) {
              warn$2(
                "<template v-slot> can only appear at the root level inside " +
                "the receiving the component",
                el
              );
            }
          }

          // 获取v-slot的name和dynamic
          var ref = getSlotName(slotBinding);
          var name = ref.name;
          var dynamic = ref.dynamic;
          // 赋值
          el.slotTarget = name;
          el.slotTargetDynamic = dynamic;
          // 获取v-slot的值
          // 强制它进入perf的作用域插槽
          el.slotScope = slotBinding.value || emptySlotScopeToken; // force it into a scoped slot for perf
        }
      } else {
        // 如果不是template上的v-slot
        // v-slot on component, denotes default slot
        // 获取并移除属性列表上的 v-slot: v-slot #
        var slotBinding$1 = getAndRemoveAttrByRegex(el, slotRE);
        // 如果存在v-slot这些属性
        if (slotBinding$1) {
          {
            // 如果不是组件 警告
            if (!maybeComponent(el)) {
              warn$2(
                "v-slot can only be used on components or <template>.",
                slotBinding$1
              );
            }
            // 如果有slot或动态绑定的slot 警告
            if (el.slotScope || el.slotTarget) {
              warn$2(
                "Unexpected mixed usage of different slot syntaxes.",
                el
              );
            }
            // 如果scopedSlots存在 警告
            if (el.scopedSlots) {
              warn$2(
                "To avoid scope ambiguity, the default slot should also use " +
                "<template> syntax when there are other named slots.",
                slotBinding$1
              );
            }
          }
          // add the component's children to its default slot
          // 将组件的子级添加到其默认插槽中
          var slots = el.scopedSlots || (el.scopedSlots = {});
          // 获取v-slot的name和dynamic
          var ref$1 = getSlotName(slotBinding$1);
          var name$1 = ref$1.name;
          var dynamic$1 = ref$1.dynamic;
          // 创建父级为el的template的AST
          var slotContainer = slots[name$1] = createASTElement('template', [], el);
          赋值;
          slotContainer.slotTarget = name$1;
          slotContainer.slotTargetDynamic = dynamic$1;

          slotContainer.children = el.children.filter(function (c) {
            // 如果slot不存在
            if (!c.slotScope) {
              // 父亲的附值
              c.parent = slotContainer;
              return true
            }
          });
          // 
          slotContainer.slotScope = slotBinding$1.value || emptySlotScopeToken;
          // remove children as they are returned from scopedSlots now
          // 从scopedSlots返回子级时立即删除它们
          el.children = [];
          // mark el non-plain so data gets generated
          // 标记el.plain为false以便生成数据
          el.plain = false;
        }
      }
    }
  }

  // 获取slot的name和dynamic
  function getSlotName(binding) {
    // 传入的属性的name  将其正则匹配替换成''
    var name = binding.name.replace(slotRE, '');
    // 此时name为空

    // 如果name为空或不存在
    if (!name) {
      // 如果binding.name[0]不是# 那么把name变成default
      if (binding.name[0] !== '#') {
        name = 'default';
      } else {
        // 如果是#
        // v-slot简写语法需要插槽名称。 
        warn$2(
          "v-slot shorthand syntax requires a slot name.",
          binding
        );
      }
    }
    // dynamicArgRE匹配 [] 括号
    
    // 如果有[]括号 返回dynamic true  name为name
    
    return dynamicArgRE.test(name)
      // dynamic [name]
      ?
      {
        name: name.slice(1, -1),
        dynamic: true
      }
      // static name
      :
      {
        name: ("\"" + name + "\""),
        dynamic: false
      }
  }

  // handle <slot/> outlets
  // 处理<slot/>
  function processSlotOutlet(el) {
    // 如果标签是slot
    if (el.tag === 'slot') {
      // 获取动态绑定的name属性赋值给slotName
      el.slotName = getBindingAttr(el, 'name');
      // 如果el.key存在 警告
      if ( el.key) {
        warn$2(
          "`key` does not work on <slot> because slots are abstract outlets " +
          "and can possibly expand into multiple elements. " +
          "Use the key on a wrapping element instead.",
          getRawBindingAttr(el, 'key')
        );
      }
    }
  }
  // 处理:is 动态组件的 如果存在:is 给el添加component属性为:is的值，
  // 如果有inline-template属性，也会添加inlineTemplate属性为true
  function processComponent(el) {
    var binding;
    // 获取动态绑定的is属性的值并判断，如果存在
    if ((binding = getBindingAttr(el, 'is'))) {
      // el.component属性则为is的值
      el.component = binding;
    }
    // 获取值并移除属性列表的inline-template属性 并且存在的话
    if (getAndRemoveAttr(el, 'inline-template') != null) {
      // el.inlineTemplate属性为true
      el.inlineTemplate = true;
    }
  }
  // 检查属性，为虚拟dom属性转换成对应需要的虚拟dom vonde数据 
  // 为AST 添加muted， events，nativeEvents，directives
  function processAttrs(el) {
    // 获取属性列表
    var list = el.attrsList;
    
    // 变量
    var i, l, name, rawName, value, modifiers, syncGen, isDynamic;
    // 遍历属性列表
    for (i = 0, l = list.length; i < l; i++) {
      // name 和 rawName都为 属性名

      name = rawName = list[i].name;
      // value为属性值
      value = list[i].value;
      // 判断是否是 v- 或 @ 或 : 开头的 或. 开头的 如果是，执行
      if (dirRE.test(name)) {
        // mark element as dynamic
        // 将元素标记为动态
        el.hasBindings = true;
        // modifiers
        // 修饰语
        // name.replace(dirRe, '')  
        // 其实是把@click v-show @input.enter之类的转换成click 和 show和input.enter
        // 解析修饰符并返回一个ret对象，属性名为修饰符名，值为true
        // 所以modifiers是一个对象，属性名为修饰符名，值为true
        modifiers = parseModifiers(name.replace(dirRE, ''));
        // support .foo shorthand syntax for the .prop modifier
        // 支持.prop修饰符的.foo简写语法 propBindRE 匹配 以.开头的
        if (modifiers) {
          // 把修饰符替换掉 @input.enter
          name = name.replace(modifierRE, '');
          // 变成@input
          // console.log(name)
        }
        // 匹配 以:或.或v-bind开头的
        // 如果是v-bind 或: 
        // 假如 :v-show 
        if (bindRE.test(name)) { // v-bind
          // 替换掉 : v-bind 因此:v-show 变成了 v-show
          name = name.replace(bindRE, '');
          // 然后值要经过一次过滤器解析
          value = parseFilters(value);
          // 匹配 []
          isDynamic = dynamicArgRE.test(name);
          // 如果有[]括号
          if (isDynamic) {
            // 把括号摘了
            name = name.slice(1, -1);
          }
          // 如果value也就是v-bind绑定的值长度为0
          if (
            
            value.trim().length === 0
          ) {
          // 警告
            warn$2(
              ("The value for a v-bind expression cannot be empty. Found in \"v-bind:" + name + "\"")
            );
          }
          // 如果修饰符对象存在
          if (modifiers) {
            // 如果修饰符的prop属性存在 并且 没有[]括号
            if (modifiers.prop && !isDynamic) {
              // 将v-show 转换为vShow 驼峰转换
              name = camelize(name);
              // 对innerHtml做了特殊处理
              if (name === 'innerHtml') { name = 'innerHTML'; }
            }
            // 如果修饰符对象的camel属性存在 并且 没有 []括号
            if (modifiers.camel && !isDynamic) {
              // 将v-show 转换为vShow 驼峰转换
              name = camelize(name);
            }
            // 如果修饰符对象的sync属性存在
            if (modifiers.sync) {
              // 用于生成v模型值分配代码的跨平台codegen助手。
              // 创赋值代码，转义字符串对象拆分字符串对象  把后一位key分离出来
              // 返回 key"=" value
              // 或者 $set(object[info],key,value)
              syncGen = genAssignmentCode(value, "$event");
              // 如果没有 []括号
              if (!isDynamic) {
                // 给AST添加update事件
                addHandler(
                  el,
                  ("update:" + (camelize(name))),
                  syncGen,
                  null,
                  false,
                  warn$2,
                  list[i]
                );
                // hyphenate 比如把驼峰 aBc 变成了 a-bc 
                // 如果转后不等于驼峰
                if (hyphenate(name) !== camelize(name)) {
                  addHandler(
                    el,
                    ("update:" + (hyphenate(name))),
                    syncGen,
                    null,
                    false,
                    warn$2,
                    list[i]
                  );
                }
              } else {
                // handler w/ dynamic event name
                // 带动态事件名称的处理程序
                addHandler(
                  el,
                  ("\"update:\"+(" + name + ")"),
                  syncGen,
                  null,
                  false,
                  warn$2,
                  list[i],
                  true // dynamic
                );
              }
            }
          }
          // 如果存在prop修饰符
          if ((modifiers && modifiers.prop) || (
              // 如果没有component属性并且 mustUseProp 校验属性
              !el.component && platformMustUseProp(el.tag, el.attrsMap.type, name)
            )) {
              // 给AST添加props属性
            addProp(el, name, value, list[i], isDynamic);
          } else {
            // 给AST添加attrs属性
            addAttr(el, name, value, list[i], isDynamic);
          }
          // 如果是v-on
        } else if (onRE.test(name)) { // v-on
          // 把v-on: 或 @ 替换成 ''
          name = name.replace(onRE, '');
          // 匹配 []括号
          isDynamic = dynamicArgRE.test(name);
          // 如果有 []括号
          if (isDynamic) {
            // 把[] 括号摘了
            name = name.slice(1, -1);
          }
          // 然后给AST添加attrs
          addHandler(el, name, value, modifiers, false, warn$2, list[i], isDynamic);
          // 其他指令
        } else { // normal directives
          //  v- 或 @ 或 : 开头的 或. 开头的 替换
          name = name.replace(dirRE, '');
          // parse arg
          // 解析参数 匹配字符串是否含有 :
          var argMatch = name.match(argRE);
          // 如果参数有值
          // 获取后面的参数值
          var arg = argMatch && argMatch[1];
          // 
          isDynamic = false;
          // 如果后面参数值有
          if (arg) {
            // 从数组尾部开始 截取Arg的长度
            name = name.slice(0, -(arg.length + 1));
            // 如果有[] 括号
            if (dynamicArgRE.test(arg)) {
              // 括号去掉
              arg = arg.slice(1, -1);
              isDynamic = true;
            }
          }
          // 给AST添加directives对象
          addDirective(el, name, rawName, value, arg, isDynamic, modifiers, list[i]);
          if ( name === 'model') {
            checkForAliasModel(el, value);
          }
        }
      } else {
      // 如果不是这些开头
        // literal attribute
        // 文字属性
        {
          // 匹配{{}} 指令，并且把他转换成 虚拟dom vonde 需要渲染的函数
          var res = parseText(value, delimiters);
          // 如果有res 代表出现了 id="{{val}}"情况 警告
          if (res) {
            warn$2(
              name + "=\"" + value + "\": " +
              'Interpolation inside attributes has been removed. ' +
              'Use v-bind or the colon shorthand instead. For example, ' +
              'instead of <div id="{{ val }}">, use <div :id="val">.',
              list[i]
            );
          }
        }
        // 添加静态书
        addAttr(el, name, JSON.stringify(value), list[i]);
        // #6887 firefox doesn't update muted state if set via attribute
        // even immediately after element creation
        // #6887如果通过属性设置，firefox不更新静音状态甚至在元素创建之后

        // 如果AST不存在component属性，并且属性名为muted， 并且通过属性验证
        if (!el.component &&
          name === 'muted' &&
          platformMustUseProp(el.tag, el.attrsMap.type, name)) {
            // 添加props属性
          addProp(el, name, 'true', list[i]);
        }
      }
    }
  }

  // 遍历当前AST， 如果v-for，返回true，没有v-for 返回false
  function checkInFor(el) {
    // 获取当前AST
    var parent = el;
    // 向上遍历当前AST
    while (parent) {
      // 如果当前AST有for属性，代表有v-for
      if (parent.for !== undefined) {
        // 返回true
        return true
      }
      // 向父层AST遍历
      parent = parent.parent;
    }
    // 如果遍历完AST后，没有v-for，返回false
    return false
  }

  // 解析修饰符并返回一个ret对象，属性名为修饰符名，值为true
  function parseModifiers(name) {
    // 传入的show click input.enter之类的方法名
    var match = name.match(modifierRE);
    // match就是修饰符名 如果有修饰符
    if (match) {
      // 创建ret空对象
      var ret = {};
      // 遍历match数组 因为是所有传入的方法都会匹配修饰符，没有就是undefined，因此是数组
      match.forEach(function (m) {
        // 也就是有修饰符的，修饰符变为ret的属性
        // 比如input.enter enter修饰符
        // ret: {enter : true}
        ret[m.slice(1)] = true;
      });
      // 返回ret对象
      return ret
    }
  }

  // 把数组对象转换成对象
  // attrs = [{name: "v-model", value: "inputVal", start: 51, end: 69}]
  // attrs = [
  //   {name: "v-model", value: "inputVal", start: 51, end: 69}
  //   {name: "class", value: "next", start: 70, end: 82}
  // ]
  // 转换成 map = {v-model: "inputVal", class: "next"}

  function makeAttrsMap(attrs ) {
    // 创建map对象
    var map = {};
    // 遍历属性数组
    for (var i = 0, l = attrs.length; i < l; i++) {
      // 无论
      if (
        
        map[attrs[i].name] && !isIE && !isEdge
      ) {
        warn$2('duplicate attribute: ' + attrs[i].name, attrs[i]);
      }
      // 给map对象的属性添加属性值
      map[attrs[i].name] = attrs[i].value;
    }
    return map
  }

  // for script (e.g. type="x/template") or style, do not decode content
  function isTextTag(el) {
    return el.tag === 'script' || el.tag === 'style'
  }

  function isForbiddenTag(el) {
    return (
      el.tag === 'style' ||
      (el.tag === 'script' && (
        !el.attrsMap.type ||
        el.attrsMap.type === 'text/javascript'
      ))
    )
  }

  var ieNSBug = /^xmlns:NS\d+/;
  var ieNSPrefix = /^NS\d+:/;

  /* istanbul ignore next */
  function guardIESVGBug(attrs) {
    var res = [];
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      if (!ieNSBug.test(attr.name)) {
        attr.name = attr.name.replace(ieNSPrefix, '');
        res.push(attr);
      }
    }
    return res
  }

  function checkForAliasModel(el, value) {
    var _el = el;
    while (_el) {
      if (_el.for && _el.alias === value) {
        warn$2(
          "<" + (el.tag) + " v-model=\"" + value + "\">: " +
          "You are binding v-model directly to a v-for iteration alias. " +
          "This will not be able to modify the v-for source array because " +
          "writing to the alias is like modifying a function local variable. " +
          "Consider using an array of objects and use v-model on an object property instead.",
          el.rawAttrsMap['v-model']
        );
      }
      _el = _el.parent;
    }
  }

  /*  */

  function preTransformNode (el, options) {
    // 如果是input标签
    if (el.tag === 'input') {
      // attrsMap其实就是input标签的属性对象
      var map = el.attrsMap;
      // 如果没有v-model属性，直接返回
      if (!map['v-model']) {
        return
      }

      // 类型
      var typeBinding;
      // 如果存在:type 或 v-bind:type 属性
      if (map[':type'] || map['v-bind:type']) {
        // 就通过getBindingAttr 返回通过过滤器解析后的值 也其实就是type后面的值
        typeBinding = getBindingAttr(el, 'type');
      }
      // 如果没有type属性也没有找到v-bind:type和:type，但拥有v-bind属性时
      if (!map.type && !typeBinding && map['v-bind']) {
        // ().type 就把那个v-bind绑定的值的type赋给typeBinding
        typeBinding = "(" + (map['v-bind']) + ").type";
      }

      // 如果typeBinding存在
      if (typeBinding) {
        // 获取v-if属性，并删除掉el中的v-if属性
        var ifCondition = getAndRemoveAttr(el, 'v-if', true);
        // 假如 v-if="isShow"
        // 如果有v-if， ifConditionExtra 变成 &&(isShow) 
        // 没有v-if，就是空
        var ifConditionExtra = ifCondition ? ("&&(" + ifCondition + ")") : "";
        // 获取v-else并删除el的v-else属性，然后判断其是否不等于null 返回一个boolean值
        // 如果有v-else hasElse为true 
        // 如果没有v-else hasElse为false
        var hasElse = getAndRemoveAttr(el, 'v-else', true) != null;
        // 获取v-else-if并删除el的v-else-if属性
        var elseIfCondition = getAndRemoveAttr(el, 'v-else-if', true);
        // 1. checkbox
        // 根据el创建AST 分支0
        // branch0是一个AST
        var branch0 = cloneASTElement(el);
        // process for on the main node
        // 主节点上的进程
        // processFor
        // 判断v-for属性是否存在 如果有则通过parseFor转义v-for指令 
        // 把for，alias，iterator1，iterator2属性添加到虚拟dom中
        processFor(branch0);
        // addRawAttr
        // 添加type 属性 值为checkbox
        addRawAttr(branch0, 'type', 'checkbox');
        // 给branch0添加很多属性，经过一系列执行的判断
        processElement(branch0, options);
        // 为true防止二次加工
        branch0.processed = true; // prevent it from double-processed 防止二次加工
        // 如果类型为checkbox + ifConditionExtra
        branch0.if = "(" + typeBinding + ")==='checkbox'" + ifConditionExtra;
        // console.log(branch0.if)
        // (type)==='checkbox'&&(isShow)

        // 给barnch0添加if指令
        addIfCondition(branch0, {
          exp: branch0.if,
          block: branch0
        });
        // 2. add radio else-if condition
        // 创建branch1AST
        var branch1 = cloneASTElement(el);
        // 获取v-for属性，并删除属性列表的v-for
        getAndRemoveAttr(branch1, 'v-for', true);
        // 添加type 属性 值为radio
        addRawAttr(branch1, 'type', 'radio');
        // 给branch1添加很多属性，经过一系列执行的判断
        processElement(branch1, options);
        //给barnch0添加else-if指令
        addIfCondition(branch0, {
          exp: "(" + typeBinding + ")==='radio'" + ifConditionExtra,
          block: branch1
        });
        // 3. other
        // 创建brach2
        var branch2 = cloneASTElement(el);
        // 获取v-for属性，并删除属性列表的v-for
        getAndRemoveAttr(branch2, 'v-for', true);
        // 添加动态type 属性 值为typeBinding
        addRawAttr(branch2, ':type', typeBinding);
        // 给branch2添加很多属性，经过一系列执行的判断
        processElement(branch2, options);
        // 给barnch0添加else-if指令
        addIfCondition(branch0, {
          exp: ifCondition,
          block: branch2
        });

        if (hasElse) {
          branch0.else = true;
        } else if (elseIfCondition) {
          branch0.elseif = elseIfCondition;
        }

        return branch0
      }
    }
  }

  function cloneASTElement (el) {
    // 传入标签 浅拷贝的属性数组， 和爸爸
    return createASTElement(el.tag, el.attrsList.slice(), el.parent)
  }

  var model$1 = {
    preTransformNode: preTransformNode
  };

  var modules$1 = [
    klass$1,
    style$1,
    model$1
  ];

  /*  */

  function text (el, dir) {
    if (dir.value) {
      addProp(el, 'textContent', ("_s(" + (dir.value) + ")"), dir);
    }
  }

  /*  */

  function html (el, dir) {
    if (dir.value) {
      addProp(el, 'innerHTML', ("_s(" + (dir.value) + ")"), dir);
    }
  }

  var directives$1 = {
    model: model,
    text: text,
    html: html
  };

  /*  */

  var baseOptions = {
    expectHTML: true,
    modules: modules$1,
    // modules:
    // {
    //   staticKeys: ['staticClass'],
    //   transformNode,
    //   genData
    // }
    // {
    //   staticKeys: ['staticStyle'],
    //   transformNode,
    //   genData
    // }
    // {
    //   preTransformNode
    // }
    directives: directives$1,
    // model:
    // src\platforms\web\compiler\directives\model.js
    // text:
    // export default function text (el: ASTElement, dir: ASTDirective) {
    //   if (dir.value) {
    //     addProp(el, 'textContent', `_s(${dir.value})`, dir)
    //   }
    // }
    // html:
    // export default function html (el: ASTElement, dir: ASTDirective) {
    //   if (dir.value) {
    //     addProp(el, 'innerHTML', `_s(${dir.value})`, dir)
    //   }
    // }
    isPreTag: isPreTag, 
    // isPreTag 判断是否是pre
    // export const isPreTag = (tag: ?string): boolean => tag === 'pre'
    isUnaryTag: isUnaryTag,
    mustUseProp: mustUseProp,
    // mustUseProp:
    // attributes that should be using props for binding
    // 应该使用属性进行绑定的属性
    // const acceptValue = makeMap('input,textarea,option,select,progress')
    // export const mustUseProp = (tag: string, type: ?string, attr: string): boolean => {
    //   return (
    //     (attr === 'value' && acceptValue(tag)) && type !== 'button' ||
    //     (attr === 'selected' && tag === 'option') ||
    //     (attr === 'checked' && tag === 'input') ||
    //     (attr === 'muted' && tag === 'video')
    //   )
    // }

    canBeLeftOpenTag: canBeLeftOpenTag,
    isReservedTag: isReservedTag,
    // isReservedTag:
    // 是否是HTML标签或是SVG标签
    // export const isReservedTag = (tag: string): ?boolean => {
    //   return isHTMLTag(tag) || isSVG(tag)
    // }
    getTagNamespace: getTagNamespace,
    // getTagNamespace:
    // export function getTagNamespace (tag: string): ?string {
    //   if (isSVG(tag)) {
    //     return 'svg'
    //   }
    //   // basic support for MathML
    //   // note it doesn't support other MathML elements being component roots
    //   // 对MathML的基本支持注意，它不支持其他MathML元素作为组件根
    //   if (tag === 'math') {
    //     return 'math'
    //   }
    // }
    staticKeys: genStaticKeys(modules$1)
  };

  /*  */

  var isStaticKey;
  var isPlatformReservedTag;

  var genStaticKeysCached = cached(genStaticKeys$1);

  /**
   * Goal of the optimizer: walk the generated template AST tree
   * and detect sub-trees that are purely static, i.e. parts of
   * the DOM that never needs to change.
   *
   * Once we detect these sub-trees, we can:
   *
   * 1. Hoist them into constants, so that we no longer need to
   *    create fresh nodes for them on each re-render;
   * 2. Completely skip them in the patching process.
   */
  function optimize (root, options) {
    if (!root) { return }
    isStaticKey = genStaticKeysCached(options.staticKeys || '');
    isPlatformReservedTag = options.isReservedTag || no;
    // first pass: mark all non-static nodes.
    markStatic$1(root);
    // second pass: mark static roots.
    markStaticRoots(root, false);
  }

  function genStaticKeys$1 (keys) {
    return makeMap(
      'type,tag,attrsList,attrsMap,plain,parent,children,attrs,start,end,rawAttrsMap' +
      (keys ? ',' + keys : '')
    )
  }

  function markStatic$1 (node) {
    node.static = isStatic(node);
    if (node.type === 1) {
      // do not make component slot content static. this avoids
      // 1. components not able to mutate slot nodes
      // 2. static slot content fails for hot-reloading
      if (
        !isPlatformReservedTag(node.tag) &&
        node.tag !== 'slot' &&
        node.attrsMap['inline-template'] == null
      ) {
        return
      }
      for (var i = 0, l = node.children.length; i < l; i++) {
        var child = node.children[i];
        markStatic$1(child);
        if (!child.static) {
          node.static = false;
        }
      }
      if (node.ifConditions) {
        for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
          var block = node.ifConditions[i$1].block;
          markStatic$1(block);
          if (!block.static) {
            node.static = false;
          }
        }
      }
    }
  }

  function markStaticRoots (node, isInFor) {
    if (node.type === 1) {
      if (node.static || node.once) {
        node.staticInFor = isInFor;
      }
      // For a node to qualify as a static root, it should have children that
      // are not just static text. Otherwise the cost of hoisting out will
      // outweigh the benefits and it's better off to just always render it fresh.
      if (node.static && node.children.length && !(
        node.children.length === 1 &&
        node.children[0].type === 3
      )) {
        node.staticRoot = true;
        return
      } else {
        node.staticRoot = false;
      }
      if (node.children) {
        for (var i = 0, l = node.children.length; i < l; i++) {
          markStaticRoots(node.children[i], isInFor || !!node.for);
        }
      }
      if (node.ifConditions) {
        for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
          markStaticRoots(node.ifConditions[i$1].block, isInFor);
        }
      }
    }
  }

  function isStatic (node) {
    if (node.type === 2) { // expression
      return false
    }
    if (node.type === 3) { // text
      return true
    }
    return !!(node.pre || (
      !node.hasBindings && // no dynamic bindings
      !node.if && !node.for && // not v-if or v-for or v-else
      !isBuiltInTag(node.tag) && // not a built-in
      isPlatformReservedTag(node.tag) && // not a component
      !isDirectChildOfTemplateFor(node) &&
      Object.keys(node).every(isStaticKey)
    ))
  }

  function isDirectChildOfTemplateFor (node) {
    while (node.parent) {
      node = node.parent;
      if (node.tag !== 'template') {
        return false
      }
      if (node.for) {
        return true
      }
    }
    return false
  }

  /*  */

  var fnExpRE = /^([\w$_]+|\([^)]*?\))\s*=>|^function\s*\(/;
  var fnInvokeRE = /\([^)]*?\);*$/;
  var simplePathRE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/;

  // KeyboardEvent.keyCode aliases
  var keyCodes = {
    esc: 27,
    tab: 9,
    enter: 13,
    space: 32,
    up: 38,
    left: 37,
    right: 39,
    down: 40,
    'delete': [8, 46]
  };

  // KeyboardEvent.key aliases
  var keyNames = {
    // #7880: IE11 and Edge use `Esc` for Escape key name.
    esc: ['Esc', 'Escape'],
    tab: 'Tab',
    enter: 'Enter',
    // #9112: IE11 uses `Spacebar` for Space key name.
    space: [' ', 'Spacebar'],
    // #7806: IE11 uses key names without `Arrow` prefix for arrow keys.
    up: ['Up', 'ArrowUp'],
    left: ['Left', 'ArrowLeft'],
    right: ['Right', 'ArrowRight'],
    down: ['Down', 'ArrowDown'],
    // #9112: IE11 uses `Del` for Delete key name.
    'delete': ['Backspace', 'Delete', 'Del']
  };

  // #4868: modifiers that prevent the execution of the listener
  // need to explicitly return null so that we can determine whether to remove
  // the listener for .once
  var genGuard = function (condition) { return ("if(" + condition + ")return null;"); };

  var modifierCode = {
    stop: '$event.stopPropagation();',
    prevent: '$event.preventDefault();',
    self: genGuard("$event.target !== $event.currentTarget"),
    ctrl: genGuard("!$event.ctrlKey"),
    shift: genGuard("!$event.shiftKey"),
    alt: genGuard("!$event.altKey"),
    meta: genGuard("!$event.metaKey"),
    left: genGuard("'button' in $event && $event.button !== 0"),
    middle: genGuard("'button' in $event && $event.button !== 1"),
    right: genGuard("'button' in $event && $event.button !== 2")
  };

  function genHandlers (
    events,
    isNative
  ) {
    var prefix = isNative ? 'nativeOn:' : 'on:';
    var staticHandlers = "";
    var dynamicHandlers = "";
    for (var name in events) {
      var handlerCode = genHandler(events[name]);
      if (events[name] && events[name].dynamic) {
        dynamicHandlers += name + "," + handlerCode + ",";
      } else {
        staticHandlers += "\"" + name + "\":" + handlerCode + ",";
      }
    }
    staticHandlers = "{" + (staticHandlers.slice(0, -1)) + "}";
    if (dynamicHandlers) {
      return prefix + "_d(" + staticHandlers + ",[" + (dynamicHandlers.slice(0, -1)) + "])"
    } else {
      return prefix + staticHandlers
    }
  }

  function genHandler (handler) {
    if (!handler) {
      return 'function(){}'
    }

    if (Array.isArray(handler)) {
      return ("[" + (handler.map(function (handler) { return genHandler(handler); }).join(',')) + "]")
    }

    var isMethodPath = simplePathRE.test(handler.value);
    var isFunctionExpression = fnExpRE.test(handler.value);
    var isFunctionInvocation = simplePathRE.test(handler.value.replace(fnInvokeRE, ''));

    if (!handler.modifiers) {
      if (isMethodPath || isFunctionExpression) {
        return handler.value
      }
      return ("function($event){" + (isFunctionInvocation ? ("return " + (handler.value)) : handler.value) + "}") // inline statement
    } else {
      var code = '';
      var genModifierCode = '';
      var keys = [];
      for (var key in handler.modifiers) {
        if (modifierCode[key]) {
          genModifierCode += modifierCode[key];
          // left/right
          if (keyCodes[key]) {
            keys.push(key);
          }
        } else if (key === 'exact') {
          var modifiers = (handler.modifiers);
          genModifierCode += genGuard(
            ['ctrl', 'shift', 'alt', 'meta']
              .filter(function (keyModifier) { return !modifiers[keyModifier]; })
              .map(function (keyModifier) { return ("$event." + keyModifier + "Key"); })
              .join('||')
          );
        } else {
          keys.push(key);
        }
      }
      if (keys.length) {
        code += genKeyFilter(keys);
      }
      // Make sure modifiers like prevent and stop get executed after key filtering
      if (genModifierCode) {
        code += genModifierCode;
      }
      var handlerCode = isMethodPath
        ? ("return " + (handler.value) + "($event)")
        : isFunctionExpression
          ? ("return (" + (handler.value) + ")($event)")
          : isFunctionInvocation
            ? ("return " + (handler.value))
            : handler.value;
      return ("function($event){" + code + handlerCode + "}")
    }
  }

  function genKeyFilter (keys) {
    return (
      // make sure the key filters only apply to KeyboardEvents
      // #9441: can't use 'keyCode' in $event because Chrome autofill fires fake
      // key events that do not have keyCode property...
      "if(!$event.type.indexOf('key')&&" +
      (keys.map(genFilterCode).join('&&')) + ")return null;"
    )
  }

  function genFilterCode (key) {
    var keyVal = parseInt(key, 10);
    if (keyVal) {
      return ("$event.keyCode!==" + keyVal)
    }
    var keyCode = keyCodes[key];
    var keyName = keyNames[key];
    return (
      "_k($event.keyCode," +
      (JSON.stringify(key)) + "," +
      (JSON.stringify(keyCode)) + "," +
      "$event.key," +
      "" + (JSON.stringify(keyName)) +
      ")"
    )
  }

  /*  */

  function on (el, dir) {
    if ( dir.modifiers) {
      warn("v-on without argument does not support modifiers.");
    }
    el.wrapListeners = function (code) { return ("_g(" + code + "," + (dir.value) + ")"); };
  }

  /*  */

  function bind$1 (el, dir) {
    el.wrapData = function (code) {
      return ("_b(" + code + ",'" + (el.tag) + "'," + (dir.value) + "," + (dir.modifiers && dir.modifiers.prop ? 'true' : 'false') + (dir.modifiers && dir.modifiers.sync ? ',true' : '') + ")")
    };
  }

  /*  */

  var baseDirectives = {
    on: on,
    bind: bind$1,
    cloak: noop
  };

  /*  */





  var CodegenState = function CodegenState (options) {
    this.options = options;
    this.warn = options.warn || baseWarn;
    this.transforms = pluckModuleFunction(options.modules, 'transformCode');
    this.dataGenFns = pluckModuleFunction(options.modules, 'genData');
    this.directives = extend(extend({}, baseDirectives), options.directives);
    var isReservedTag = options.isReservedTag || no;
    this.maybeComponent = function (el) { return !!el.component || !isReservedTag(el.tag); };
    this.onceId = 0;
    this.staticRenderFns = [];
    this.pre = false;
  };



  function generate (
    ast,
    options
  ) {
    var state = new CodegenState(options);
    var code = ast ? genElement(ast, state) : '_c("div")';
    return {
      render: ("with(this){return " + code + "}"),
      staticRenderFns: state.staticRenderFns
    }
  }

  function genElement (el, state) {
    if (el.parent) {
      el.pre = el.pre || el.parent.pre;
    }

    if (el.staticRoot && !el.staticProcessed) {
      return genStatic(el, state)
    } else if (el.once && !el.onceProcessed) {
      return genOnce(el, state)
    } else if (el.for && !el.forProcessed) {
      return genFor(el, state)
    } else if (el.if && !el.ifProcessed) {
      return genIf(el, state)
    } else if (el.tag === 'template' && !el.slotTarget && !state.pre) {
      return genChildren(el, state) || 'void 0'
    } else if (el.tag === 'slot') {
      return genSlot(el, state)
    } else {
      // component or element
      var code;
      if (el.component) {
        code = genComponent(el.component, el, state);
      } else {
        var data;
        if (!el.plain || (el.pre && state.maybeComponent(el))) {
          data = genData$2(el, state);
        }

        var children = el.inlineTemplate ? null : genChildren(el, state, true);
        code = "_c('" + (el.tag) + "'" + (data ? ("," + data) : '') + (children ? ("," + children) : '') + ")";
      }
      // module transforms
      for (var i = 0; i < state.transforms.length; i++) {
        code = state.transforms[i](el, code);
      }
      return code
    }
  }

  // hoist static sub-trees out
  function genStatic (el, state) {
    el.staticProcessed = true;
    // Some elements (templates) need to behave differently inside of a v-pre
    // node.  All pre nodes are static roots, so we can use this as a location to
    // wrap a state change and reset it upon exiting the pre node.
    var originalPreState = state.pre;
    if (el.pre) {
      state.pre = el.pre;
    }
    state.staticRenderFns.push(("with(this){return " + (genElement(el, state)) + "}"));
    state.pre = originalPreState;
    return ("_m(" + (state.staticRenderFns.length - 1) + (el.staticInFor ? ',true' : '') + ")")
  }

  // v-once
  function genOnce (el, state) {
    el.onceProcessed = true;
    if (el.if && !el.ifProcessed) {
      return genIf(el, state)
    } else if (el.staticInFor) {
      var key = '';
      var parent = el.parent;
      while (parent) {
        if (parent.for) {
          key = parent.key;
          break
        }
        parent = parent.parent;
      }
      if (!key) {
         state.warn(
          "v-once can only be used inside v-for that is keyed. ",
          el.rawAttrsMap['v-once']
        );
        return genElement(el, state)
      }
      return ("_o(" + (genElement(el, state)) + "," + (state.onceId++) + "," + key + ")")
    } else {
      return genStatic(el, state)
    }
  }

  function genIf (
    el,
    state,
    altGen,
    altEmpty
  ) {
    el.ifProcessed = true; // avoid recursion
    return genIfConditions(el.ifConditions.slice(), state, altGen, altEmpty)
  }

  function genIfConditions (
    conditions,
    state,
    altGen,
    altEmpty
  ) {
    if (!conditions.length) {
      return altEmpty || '_e()'
    }

    var condition = conditions.shift();
    if (condition.exp) {
      return ("(" + (condition.exp) + ")?" + (genTernaryExp(condition.block)) + ":" + (genIfConditions(conditions, state, altGen, altEmpty)))
    } else {
      return ("" + (genTernaryExp(condition.block)))
    }

    // v-if with v-once should generate code like (a)?_m(0):_m(1)
    function genTernaryExp (el) {
      return altGen
        ? altGen(el, state)
        : el.once
          ? genOnce(el, state)
          : genElement(el, state)
    }
  }

  function genFor (
    el,
    state,
    altGen,
    altHelper
  ) {
    var exp = el.for;
    var alias = el.alias;
    var iterator1 = el.iterator1 ? ("," + (el.iterator1)) : '';
    var iterator2 = el.iterator2 ? ("," + (el.iterator2)) : '';

    if (
      state.maybeComponent(el) &&
      el.tag !== 'slot' &&
      el.tag !== 'template' &&
      !el.key
    ) {
      state.warn(
        "<" + (el.tag) + " v-for=\"" + alias + " in " + exp + "\">: component lists rendered with " +
        "v-for should have explicit keys. " +
        "See https://vuejs.org/guide/list.html#key for more info.",
        el.rawAttrsMap['v-for'],
        true /* tip */
      );
    }

    el.forProcessed = true; // avoid recursion
    return (altHelper || '_l') + "((" + exp + ")," +
      "function(" + alias + iterator1 + iterator2 + "){" +
        "return " + ((altGen || genElement)(el, state)) +
      '})'
  }

  function genData$2 (el, state) {
    var data = '{';

    // directives first.
    // directives may mutate the el's other properties before they are generated.
    var dirs = genDirectives(el, state);
    if (dirs) { data += dirs + ','; }

    // key
    if (el.key) {
      data += "key:" + (el.key) + ",";
    }
    // ref
    if (el.ref) {
      data += "ref:" + (el.ref) + ",";
    }
    if (el.refInFor) {
      data += "refInFor:true,";
    }
    // pre
    if (el.pre) {
      data += "pre:true,";
    }
    // record original tag name for components using "is" attribute
    if (el.component) {
      data += "tag:\"" + (el.tag) + "\",";
    }
    // module data generation functions
    for (var i = 0; i < state.dataGenFns.length; i++) {
      data += state.dataGenFns[i](el);
    }
    // attributes
    if (el.attrs) {
      data += "attrs:" + (genProps(el.attrs)) + ",";
    }
    // DOM props
    if (el.props) {
      data += "domProps:" + (genProps(el.props)) + ",";
    }
    // event handlers
    if (el.events) {
      data += (genHandlers(el.events, false)) + ",";
    }
    if (el.nativeEvents) {
      data += (genHandlers(el.nativeEvents, true)) + ",";
    }
    // slot target
    // only for non-scoped slots
    if (el.slotTarget && !el.slotScope) {
      data += "slot:" + (el.slotTarget) + ",";
    }
    // scoped slots
    if (el.scopedSlots) {
      data += (genScopedSlots(el, el.scopedSlots, state)) + ",";
    }
    // component v-model
    if (el.model) {
      data += "model:{value:" + (el.model.value) + ",callback:" + (el.model.callback) + ",expression:" + (el.model.expression) + "},";
    }
    // inline-template
    if (el.inlineTemplate) {
      var inlineTemplate = genInlineTemplate(el, state);
      if (inlineTemplate) {
        data += inlineTemplate + ",";
      }
    }
    data = data.replace(/,$/, '') + '}';
    // v-bind dynamic argument wrap
    // v-bind with dynamic arguments must be applied using the same v-bind object
    // merge helper so that class/style/mustUseProp attrs are handled correctly.
    if (el.dynamicAttrs) {
      data = "_b(" + data + ",\"" + (el.tag) + "\"," + (genProps(el.dynamicAttrs)) + ")";
    }
    // v-bind data wrap
    if (el.wrapData) {
      data = el.wrapData(data);
    }
    // v-on data wrap
    if (el.wrapListeners) {
      data = el.wrapListeners(data);
    }
    return data
  }

  function genDirectives (el, state) {
    var dirs = el.directives;
    if (!dirs) { return }
    var res = 'directives:[';
    var hasRuntime = false;
    var i, l, dir, needRuntime;
    for (i = 0, l = dirs.length; i < l; i++) {
      dir = dirs[i];
      needRuntime = true;
      var gen = state.directives[dir.name];
      if (gen) {
        // compile-time directive that manipulates AST.
        // returns true if it also needs a runtime counterpart.
        needRuntime = !!gen(el, dir, state.warn);
      }
      if (needRuntime) {
        hasRuntime = true;
        res += "{name:\"" + (dir.name) + "\",rawName:\"" + (dir.rawName) + "\"" + (dir.value ? (",value:(" + (dir.value) + "),expression:" + (JSON.stringify(dir.value))) : '') + (dir.arg ? (",arg:" + (dir.isDynamicArg ? dir.arg : ("\"" + (dir.arg) + "\""))) : '') + (dir.modifiers ? (",modifiers:" + (JSON.stringify(dir.modifiers))) : '') + "},";
      }
    }
    if (hasRuntime) {
      return res.slice(0, -1) + ']'
    }
  }

  function genInlineTemplate (el, state) {
    var ast = el.children[0];
    if ( (
      el.children.length !== 1 || ast.type !== 1
    )) {
      state.warn(
        'Inline-template components must have exactly one child element.',
        { start: el.start }
      );
    }
    if (ast && ast.type === 1) {
      var inlineRenderFns = generate(ast, state.options);
      return ("inlineTemplate:{render:function(){" + (inlineRenderFns.render) + "},staticRenderFns:[" + (inlineRenderFns.staticRenderFns.map(function (code) { return ("function(){" + code + "}"); }).join(',')) + "]}")
    }
  }

  function genScopedSlots (
    el,
    slots,
    state
  ) {
    // by default scoped slots are considered "stable", this allows child
    // components with only scoped slots to skip forced updates from parent.
    // but in some cases we have to bail-out of this optimization
    // for example if the slot contains dynamic names, has v-if or v-for on them...
    var needsForceUpdate = el.for || Object.keys(slots).some(function (key) {
      var slot = slots[key];
      return (
        slot.slotTargetDynamic ||
        slot.if ||
        slot.for ||
        containsSlotChild(slot) // is passing down slot from parent which may be dynamic
      )
    });

    // #9534: if a component with scoped slots is inside a conditional branch,
    // it's possible for the same component to be reused but with different
    // compiled slot content. To avoid that, we generate a unique key based on
    // the generated code of all the slot contents.
    var needsKey = !!el.if;

    // OR when it is inside another scoped slot or v-for (the reactivity may be
    // disconnected due to the intermediate scope variable)
    // #9438, #9506
    // TODO: this can be further optimized by properly analyzing in-scope bindings
    // and skip force updating ones that do not actually use scope variables.
    if (!needsForceUpdate) {
      var parent = el.parent;
      while (parent) {
        if (
          (parent.slotScope && parent.slotScope !== emptySlotScopeToken) ||
          parent.for
        ) {
          needsForceUpdate = true;
          break
        }
        if (parent.if) {
          needsKey = true;
        }
        parent = parent.parent;
      }
    }

    var generatedSlots = Object.keys(slots)
      .map(function (key) { return genScopedSlot(slots[key], state); })
      .join(',');

    return ("scopedSlots:_u([" + generatedSlots + "]" + (needsForceUpdate ? ",null,true" : "") + (!needsForceUpdate && needsKey ? (",null,false," + (hash(generatedSlots))) : "") + ")")
  }

  function hash(str) {
    var hash = 5381;
    var i = str.length;
    while(i) {
      hash = (hash * 33) ^ str.charCodeAt(--i);
    }
    return hash >>> 0
  }

  function containsSlotChild (el) {
    if (el.type === 1) {
      if (el.tag === 'slot') {
        return true
      }
      return el.children.some(containsSlotChild)
    }
    return false
  }

  function genScopedSlot (
    el,
    state
  ) {
    var isLegacySyntax = el.attrsMap['slot-scope'];
    if (el.if && !el.ifProcessed && !isLegacySyntax) {
      return genIf(el, state, genScopedSlot, "null")
    }
    if (el.for && !el.forProcessed) {
      return genFor(el, state, genScopedSlot)
    }
    var slotScope = el.slotScope === emptySlotScopeToken
      ? ""
      : String(el.slotScope);
    var fn = "function(" + slotScope + "){" +
      "return " + (el.tag === 'template'
        ? el.if && isLegacySyntax
          ? ("(" + (el.if) + ")?" + (genChildren(el, state) || 'undefined') + ":undefined")
          : genChildren(el, state) || 'undefined'
        : genElement(el, state)) + "}";
    // reverse proxy v-slot without scope on this.$slots
    var reverseProxy = slotScope ? "" : ",proxy:true";
    return ("{key:" + (el.slotTarget || "\"default\"") + ",fn:" + fn + reverseProxy + "}")
  }

  function genChildren (
    el,
    state,
    checkSkip,
    altGenElement,
    altGenNode
  ) {
    var children = el.children;
    if (children.length) {
      var el$1 = children[0];
      // optimize single v-for
      if (children.length === 1 &&
        el$1.for &&
        el$1.tag !== 'template' &&
        el$1.tag !== 'slot'
      ) {
        var normalizationType = checkSkip
          ? state.maybeComponent(el$1) ? ",1" : ",0"
          : "";
        return ("" + ((altGenElement || genElement)(el$1, state)) + normalizationType)
      }
      var normalizationType$1 = checkSkip
        ? getNormalizationType(children, state.maybeComponent)
        : 0;
      var gen = altGenNode || genNode;
      return ("[" + (children.map(function (c) { return gen(c, state); }).join(',')) + "]" + (normalizationType$1 ? ("," + normalizationType$1) : ''))
    }
  }

  // determine the normalization needed for the children array.
  // 0: no normalization needed
  // 1: simple normalization needed (possible 1-level deep nested array)
  // 2: full normalization needed
  function getNormalizationType (
    children,
    maybeComponent
  ) {
    var res = 0;
    for (var i = 0; i < children.length; i++) {
      var el = children[i];
      if (el.type !== 1) {
        continue
      }
      if (needsNormalization(el) ||
          (el.ifConditions && el.ifConditions.some(function (c) { return needsNormalization(c.block); }))) {
        res = 2;
        break
      }
      if (maybeComponent(el) ||
          (el.ifConditions && el.ifConditions.some(function (c) { return maybeComponent(c.block); }))) {
        res = 1;
      }
    }
    return res
  }

  function needsNormalization (el) {
    return el.for !== undefined || el.tag === 'template' || el.tag === 'slot'
  }

  function genNode (node, state) {
    if (node.type === 1) {
      return genElement(node, state)
    } else if (node.type === 3 && node.isComment) {
      return genComment(node)
    } else {
      return genText(node)
    }
  }

  function genText (text) {
    return ("_v(" + (text.type === 2
      ? text.expression // no need for () because already wrapped in _s()
      : transformSpecialNewlines(JSON.stringify(text.text))) + ")")
  }

  function genComment (comment) {
    return ("_e(" + (JSON.stringify(comment.text)) + ")")
  }

  function genSlot (el, state) {
    var slotName = el.slotName || '"default"';
    var children = genChildren(el, state);
    var res = "_t(" + slotName + (children ? ("," + children) : '');
    var attrs = el.attrs || el.dynamicAttrs
      ? genProps((el.attrs || []).concat(el.dynamicAttrs || []).map(function (attr) { return ({
          // slot props are camelized
          name: camelize(attr.name),
          value: attr.value,
          dynamic: attr.dynamic
        }); }))
      : null;
    var bind = el.attrsMap['v-bind'];
    if ((attrs || bind) && !children) {
      res += ",null";
    }
    if (attrs) {
      res += "," + attrs;
    }
    if (bind) {
      res += (attrs ? '' : ',null') + "," + bind;
    }
    return res + ')'
  }

  // componentName is el.component, take it as argument to shun flow's pessimistic refinement
  function genComponent (
    componentName,
    el,
    state
  ) {
    var children = el.inlineTemplate ? null : genChildren(el, state, true);
    return ("_c(" + componentName + "," + (genData$2(el, state)) + (children ? ("," + children) : '') + ")")
  }

  function genProps (props) {
    var staticProps = "";
    var dynamicProps = "";
    for (var i = 0; i < props.length; i++) {
      var prop = props[i];
      var value =  transformSpecialNewlines(prop.value);
      if (prop.dynamic) {
        dynamicProps += (prop.name) + "," + value + ",";
      } else {
        staticProps += "\"" + (prop.name) + "\":" + value + ",";
      }
    }
    staticProps = "{" + (staticProps.slice(0, -1)) + "}";
    if (dynamicProps) {
      return ("_d(" + staticProps + ",[" + (dynamicProps.slice(0, -1)) + "])")
    } else {
      return staticProps
    }
  }

  // #3895, #4268
  function transformSpecialNewlines (text) {
    return text
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029')
  }

  /*  */



  // these keywords should not appear inside expressions, but operators like
  // typeof, instanceof and in are allowed
  var prohibitedKeywordRE = new RegExp('\\b' + (
    'do,if,for,let,new,try,var,case,else,with,await,break,catch,class,const,' +
    'super,throw,while,yield,delete,export,import,return,switch,default,' +
    'extends,finally,continue,debugger,function,arguments'
  ).split(',').join('\\b|\\b') + '\\b');

  // these unary operators should not be used as property/method names
  var unaryOperatorsRE = new RegExp('\\b' + (
    'delete,typeof,void'
  ).split(',').join('\\s*\\([^\\)]*\\)|\\b') + '\\s*\\([^\\)]*\\)');

  // strip strings in expressions
  var stripStringRE = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`/g;

  // detect problematic expressions in a template
  function detectErrors (ast, warn) {
    if (ast) {
      checkNode(ast, warn);
    }
  }

  function checkNode (node, warn) {
    if (node.type === 1) {
      for (var name in node.attrsMap) {
        if (dirRE.test(name)) {
          var value = node.attrsMap[name];
          if (value) {
            var range = node.rawAttrsMap[name];
            if (name === 'v-for') {
              checkFor(node, ("v-for=\"" + value + "\""), warn, range);
            } else if (onRE.test(name)) {
              checkEvent(value, (name + "=\"" + value + "\""), warn, range);
            } else {
              checkExpression(value, (name + "=\"" + value + "\""), warn, range);
            }
          }
        }
      }
      if (node.children) {
        for (var i = 0; i < node.children.length; i++) {
          checkNode(node.children[i], warn);
        }
      }
    } else if (node.type === 2) {
      checkExpression(node.expression, node.text, warn, node);
    }
  }

  function checkEvent (exp, text, warn, range) {
    var stipped = exp.replace(stripStringRE, '');
    var keywordMatch = stipped.match(unaryOperatorsRE);
    if (keywordMatch && stipped.charAt(keywordMatch.index - 1) !== '$') {
      warn(
        "avoid using JavaScript unary operator as property name: " +
        "\"" + (keywordMatch[0]) + "\" in expression " + (text.trim()),
        range
      );
    }
    checkExpression(exp, text, warn, range);
  }

  function checkFor (node, text, warn, range) {
    checkExpression(node.for || '', text, warn, range);
    checkIdentifier(node.alias, 'v-for alias', text, warn, range);
    checkIdentifier(node.iterator1, 'v-for iterator', text, warn, range);
    checkIdentifier(node.iterator2, 'v-for iterator', text, warn, range);
  }

  function checkIdentifier (
    ident,
    type,
    text,
    warn,
    range
  ) {
    if (typeof ident === 'string') {
      try {
        new Function(("var " + ident + "=_"));
      } catch (e) {
        warn(("invalid " + type + " \"" + ident + "\" in expression: " + (text.trim())), range);
      }
    }
  }

  function checkExpression (exp, text, warn, range) {
    try {
      new Function(("return " + exp));
    } catch (e) {
      var keywordMatch = exp.replace(stripStringRE, '').match(prohibitedKeywordRE);
      if (keywordMatch) {
        warn(
          "avoid using JavaScript keyword as property name: " +
          "\"" + (keywordMatch[0]) + "\"\n  Raw expression: " + (text.trim()),
          range
        );
      } else {
        warn(
          "invalid expression: " + (e.message) + " in\n\n" +
          "    " + exp + "\n\n" +
          "  Raw expression: " + (text.trim()) + "\n",
          range
        );
      }
    }
  }

  /*  */

  var range = 2;

  function generateCodeFrame (
    source,
    start,
    end
  ) {
    if ( start === void 0 ) start = 0;
    if ( end === void 0 ) end = source.length;

    var lines = source.split(/\r?\n/);
    var count = 0;
    var res = [];
    for (var i = 0; i < lines.length; i++) {
      count += lines[i].length + 1;
      if (count >= start) {
        for (var j = i - range; j <= i + range || end > count; j++) {
          if (j < 0 || j >= lines.length) { continue }
          res.push(("" + (j + 1) + (repeat$1(" ", 3 - String(j + 1).length)) + "|  " + (lines[j])));
          var lineLength = lines[j].length;
          if (j === i) {
            // push underline
            var pad = start - (count - lineLength) + 1;
            var length = end > count ? lineLength - pad : end - start;
            res.push("   |  " + repeat$1(" ", pad) + repeat$1("^", length));
          } else if (j > i) {
            if (end > count) {
              var length$1 = Math.min(end - count, lineLength);
              res.push("   |  " + repeat$1("^", length$1));
            }
            count += lineLength + 1;
          }
        }
        break
      }
    }
    return res.join('\n')
  }

  function repeat$1 (str, n) {
    var result = '';
    if (n > 0) {
      while (true) { // eslint-disable-line
        if (n & 1) { result += str; }
        n >>>= 1;
        if (n <= 0) { break }
        str += str;
      }
    }
    return result
  }

  /*  */



  // 把字符串 转成真正的js 并且以一个函数形式导出去
  function createFunction (code, errors) {
    try {
      return new Function(code)
    } catch (err) {
      errors.push({ err: err, code: code });
      return noop
    }
  }

  function createCompileToFunctionFn (compile) {
    // 创建一个空对象
    var cache = Object.create(null);


    // compileToFunctions中传入的options:
    // template,  
    //  {
    //   outputSourceRange: "development" !== 'production',
    //   shouldDecodeNewlines,
    //   shouldDecodeNewlinesForHref,
    //   delimiters: options.delimiters,
    //   comments: options.comments
    //  }, 
    // this
    return function compileToFunctions (
      template, // 字符串模板 template 也就是经过那些操作获取之后的template
      options, // 参数
      vm // 虚拟dom
    ) {
      // 把options和空对象混合，也就是获取options，相当于浅拷贝一份options
      options = extend({}, options);
      // 获取警告
      var warn$1 = options.warn || warn;
      // 删除options.warn属性
      delete options.warn;

      /* istanbul ignore if */
      // 忽略
      {
        // detect possible CSP restriction
        try {
          new Function('return 1');
        } catch (e) {
          if (e.toString().match(/unsafe-eval|CSP/)) {
            warn$1(
              'It seems you are using the standalone build of Vue.js in an ' +
              'environment with Content Security Policy that prohibits unsafe-eval. ' +
              'The template compiler cannot work in this environment. Consider ' +
              'relaxing the policy to allow unsafe-eval or pre-compiling your ' +
              'templates into render functions.'
            );
          }
        }
      }

      // check cache

      // options中是否有delimiters 一般的delimiters都是delimiters: ['${', '}']这种
      var key = options.delimiters
        // 如果有delimiters  String(['${', '}'])返回 '${,}' + template
        ? String(options.delimiters) + template
        // 如果没有delimiters
        : template;
      // 如果cache对象中有此key属性，直接返回
      if (cache[key]) {
        return cache[key]
      }

      // compile  路径：src\compiler\create-compiler.js
      // 执行compiled  传入template和options参数
      var compiled = compile(template, options);

      // check compilation errors/tips
      {
        if (compiled.errors && compiled.errors.length) {
          if (options.outputSourceRange) {
            compiled.errors.forEach(function (e) {
              warn$1(
                "Error compiling template:\n\n" + (e.msg) + "\n\n" +
                generateCodeFrame(template, e.start, e.end),
                vm
              );
            });
          } else {
            warn$1(
              "Error compiling template:\n\n" + template + "\n\n" +
              compiled.errors.map(function (e) { return ("- " + e); }).join('\n') + '\n',
              vm
            );
          }
        }
        if (compiled.tips && compiled.tips.length) {
          if (options.outputSourceRange) {
            compiled.tips.forEach(function (e) { return tip(e.msg, vm); });
          } else {
            compiled.tips.forEach(function (msg) { return tip(msg, vm); });
          }
        }
      }

      // turn code into functions
      var res = {};
      var fnGenErrors = [];
      res.render = createFunction(compiled.render, fnGenErrors);
      res.staticRenderFns = compiled.staticRenderFns.map(function (code) {
        return createFunction(code, fnGenErrors)
      });

      // check function generation errors.
      // this should only happen if there is a bug in the compiler itself.
      // mostly for codegen development use
      /* istanbul ignore if */
      {
        if ((!compiled.errors || !compiled.errors.length) && fnGenErrors.length) {
          warn$1(
            "Failed to generate render function:\n\n" +
            fnGenErrors.map(function (ref) {
              var err = ref.err;
              var code = ref.code;

              return ((err.toString()) + " in\n\n" + code + "\n");
          }).join('\n'),
            vm
          );
        }
      }

      return (cache[key] = res)
    }
  }

  /*  */

  function createCompilerCreator (baseCompile) {
    return function createCompiler (baseOptions) {
      // compile函数 
      function compile (
        template, // 接收template 字符串模板
        options  // 接收options 也就是传给compileToFunctions的函数
      ) {
        // baseOptions: 
        // expectHTML: true,
        // modules,
        // directives,
        // isPreTag,
        // isUnaryTag,
        // mustUseProp,
        // canBeLeftOpenTag,
        // isReservedTag,
        // getTagNamespace,
        // staticKeys: genStaticKeys(modules)
        // 创建一个对象finalOptions 使其可通过原型链访问到baseOptions的一些属性
        var finalOptions = Object.create(baseOptions);
        // errors数组
        var errors = [];
        // tips数组
        var tips = [];

        // 警告函数
        var warn = function (msg, range, tip) {
          // 如果tip存在，tips增加msg  不存在 errors增加msg
          (tip ? tips : errors).push(msg);
        };

        // 如果options存在
        if (options) {
          // 忽略
          if ( options.outputSourceRange) {
            // $flow-disable-line
            var leadingSpaceLength = template.match(/^\s*/)[0].length;

            warn = function (msg, range, tip) {
              var data = { msg: msg };
              if (range) {
                if (range.start != null) {
                  data.start = range.start + leadingSpaceLength;
                }
                if (range.end != null) {
                  data.end = range.end + leadingSpaceLength;
                }
              }
              (tip ? tips : errors).push(data);
            };
          }
          // merge custom modules
          // 合并自定义模块

          // baseOptions.modules: 在baseOptions中有引入modules 分别引入了下面3个
          // {
          //   staticKeys: ['staticClass'],
          //   transformNode,
          //   genData
          // }
          // {
          //   staticKeys: ['staticStyle'],
          //   transformNode,
          //   genData
          // }
          // {
          //   preTransformNode
          // }

          // 如果options.modules存在
          if (options.modules) {
            // 将baseOptions和options.modules合并
            finalOptions.modules =
              (baseOptions.modules || []).concat(options.modules);
          }
          // merge custom directives
          // 合并自定义指令

          // 如果options.directives存在
          if (options.directives) {
            // 合并指令
            finalOptions.directives = extend(
              // 通过extend 将 options.directives中的directives中所有属性
              // 混合到以baseOptions.directives为原型创建的对象
              Object.create(baseOptions.directives || null),
              options.directives
            );
          }

          // options 为：

          // comments: undefined
          // delimiters: undefined
          // shouldDecodeNewlines: false
          // shouldDecodeNewlinesForHref: true

          // copy other options
          // 复制其他的options
          for (var key in options) {
            // 把不是modules 和不是directives，就复制进去
            if (key !== 'modules' && key !== 'directives') {
              finalOptions[key] = options[key];
            }
          }
        }

        // 给finalOptions添加警告函数
        finalOptions.warn = warn;

        // 执行baseCompile 路径：src\compiler\index.js
        // baseCompile是参数传进来的一个函数，找到createCompilerCreator
        // 可以看到baseCompile内部进行了parse optimize generate

        // 传入去除空格后的template模板字符串，和最终的finalOptions属性 
        var compiled = baseCompile(template.trim(), finalOptions);
        {
          detectErrors(compiled.ast, warn);
        }
        compiled.errors = errors;
        compiled.tips = tips;
        return compiled
      }

      return {
        compile: compile,
        compileToFunctions: createCompileToFunctionFn(compile)
      }
    }
  }

  /*  */

  // `createCompilerCreator` allows creating compilers that use alternative
  // parser/optimizer/codegen, e.g the SSR optimizing compiler.
  // Here we just export a default compiler using the default parts.
  // `createCompilerCreator`允许创建使用替代方法的编译器
  // 解析器/优化器/codegen，例如SSR优化编译器。
  // 这里我们只导出一个使用默认部分的默认编译器。

  // 此内部为传入的baseCompile函数，在src\compiler\create-compiler.js中合并完finalOptions后调用
  var createCompiler = createCompilerCreator(function baseCompile (
    template, // 传入的 template.trim() 字符串模板
    options // 传入的 finalOptions 合并后的
  ) {
    // parse函数 解析模块 把template解析成语法解析树 抽象语法树 AST
    var ast = parse(template.trim(), options);
    // optimize 语法优化 比如静态节点标记 
    if (options.optimize !== false) {
      optimize(ast, options);
    }

    // <div v-if="isShow">
    //   哈哈
    // </div>
    // <div v-else>
    //   嘿嘿
    // </div>
    // v-if实际就是一个三元表达式
    // _c是新建虚拟dom的函数别名
    // return isShow ? _c('div', {children:['哈哈']}) : _c('div', {children:['嘿嘿']})
    // 把ast生成可执行的代码 代码生成
    var code = generate(ast, options);
    return {
      ast: ast,
      render: code.render,
      staticRenderFns: code.staticRenderFns
    }
  });

  /*  */

  var ref$1 = createCompiler(baseOptions);
  var compileToFunctions = ref$1.compileToFunctions;

  /*  */

  // check whether current browser encodes a char inside attribute values
  var div;
  function getShouldDecode (href) {
    div = div || document.createElement('div');
    div.innerHTML = href ? "<a href=\"\n\"/>" : "<div a=\"\n\"/>";
    return div.innerHTML.indexOf('&#10;') > 0
  }

  // #3663: IE encodes newlines inside attribute values while other browsers don't
  var shouldDecodeNewlines = inBrowser ? getShouldDecode(false) : false;
  // #6828: chrome encodes content in a[href]
  var shouldDecodeNewlinesForHref = inBrowser ? getShouldDecode(true) : false;

  /*  */

  // 根据id查询到el 并返回innerHTML
  var idToTemplate = cached(function (id) {
    var el = query(id);
    return el && el.innerHTML
  });
  // 扩展$mount 保存老的$mount 老的$mount也会执行以前的操作
  var mount = Vue.prototype.$mount;
  // 进行的新的mount操作
  Vue.prototype.$mount = function (
    // 传入el，也就是挂载的元素节点
    el,
    // todo: 等待分析 涉及服务端渲染
    hydrating
  ) {
    // 获取el节点
    el = el && query(el);

    // 遇到这种形式的代码，可忽略 
    /* istanbul ignore if */
    if (el === document.body || el === document.documentElement) {
       warn(
        "Do not mount Vue to <html> or <body> - mount to normal elements instead."
      );
      return this
    }
    // 获取配置的一些选项，也就是render template el那些
    // 可从代码中得到一些选项的优先级：render>template>el
    var options = this.$options;
    // resolve template/el and convert to render function
    // 如果不存在render函数，就将template/el的设置转换为render函数
    // render优先级非常高了，这些操作都是在没有render的情况下进行的
    if (!options.render) {
      // 获取template
      var template = options.template;
      // 如果有template
      if (template) {
        // string "#app"这类的
        if (typeof template === 'string') {
          // #开头
          if (template.charAt(0) === '#') {
            // 将进入idToTemplate idToTemplate是接收#app这类，返回对应节点的innerHTML
            template = idToTemplate(template);
            /* istanbul ignore if 忽略*/
            if ( !template) {
              warn(
                ("Template element not found or is empty: " + (options.template)),
                this
              );
            }
          }
        } else if (template.nodeType) { 
          // 如果是DOM元素 document.querySelector()
          // 获取到这段内容，也就获取到了节点
          template = template.innerHTML;
        } else {
          // 忽略
          {
            warn('invalid template option:' + template, this);
          }
          return this
        }
        // 如果template不存在，获取el
      } else if (el) {
        // <div id="app"></div>
        // 调用getOuterHTML，获取包括标签的内容
        template = getOuterHTML(el);
      }
      // 这里对拿到的template进行编译
      if (template) {
        /* istanbul ignore if */
        if ( config.performance && mark) {
          mark('compile');
        }
        // 如果是模板字符串，需要编译器去编译  也就是进入compileToFunctions这个函数
        // 可以通过这个函数查看编译器的工作机制，也就是把template转换为render
        var ref = compileToFunctions(template, {
          outputSourceRange: "development" !== 'production',
          shouldDecodeNewlines: shouldDecodeNewlines,
          shouldDecodeNewlinesForHref: shouldDecodeNewlinesForHref,
          delimiters: options.delimiters,
          comments: options.comments
        }, this);
        var render = ref.render;
        var staticRenderFns = ref.staticRenderFns;
        // 赋值给当前选项的render
        options.render = render;
        options.staticRenderFns = staticRenderFns;

        /* istanbul ignore if */
        if ( config.performance && mark) {
          mark('compile end');
          measure(("vue " + (this._name) + " compile"), 'compile', 'compile end');
        }
      }
    }
    // 执行老mount的操作 正常的挂载渲染过程
    return mount.call(this, el, hydrating)
  };

  /**
   * Get outerHTML of elements, taking care
   * of SVG elements in IE as well.
   */
  // 获取包括标签的内容
  function getOuterHTML (el) {
    // 如果存在，直接使用outerHTML
    if (el.outerHTML) {
      return el.outerHTML
    } else {
      // 不存在就创建div
      var container = document.createElement('div');
      // 将el深复制一份加入div
      container.appendChild(el.cloneNode(true));
      // 返回这个div
      return container.innerHTML
    }
  }
  // :todo 涉及到编译器compile的解析过程了，之后再来
  Vue.compile = compileToFunctions;

  return Vue;

})));
//# sourceMappingURL=vue.js.map
