/* @flow */

import { warn } from './debug'
import { observe, toggleObserving, shouldObserve } from '../observer/index'
import {
  hasOwn,
  isObject,
  toRawType,
  hyphenate,
  capitalize,
  isPlainObject
} from 'shared/util'

type PropOptions = {
  type: Function | Array<Function> | null,
  default: any,
  required: ?boolean,
  validator: ?Function
};

export function validateProp (
  key: string, //key
  propOptions: Object, //原始props参数
  propsData: Object,  //转义过的组件props数据
  vm?: Component     //VueComponent 组件构造函数
): any {
  // 获取组件定义的props属性
  const prop = propOptions[key]
  // 如果该为假的那么可能  a-b 这样的key才能获取到值
  // Object.prototype.hasOwnProperty.call(propsData, key)
  const absent = !hasOwn(propsData, key)
  // 获取值
  let value = propsData[key] 
  // boolean casting
  // Boolean 传一个布尔值  但是 一般是函数或者数组函数才有意义，而且是函数声明的函数并不是 函数表达式prop.type 也需要是函数
  // 返回的是相同的索引  判断 属性类型定义的是否是Boolean
  // 判断prop.type是否是Boolean，如果是返回对应的index或0
  const booleanIndex = getTypeIndex(Boolean, prop.type)
  // 0或index大于-1 所以这里判断是Boolean值
  if (booleanIndex > -1) { 
    // 如果key 不是propsData 实例化，或者 没有定义default 默认值的时候 
    if (absent && !hasOwn(prop, 'default')) {
      // 设置value 为false
      value = false
    } else if (
      value === '' // 如果value是空
      || value === hyphenate(key) //或者key转出 - 形式 和value相等 驼峰转发 toString to-string
      ) {
      // only cast empty string / same name to boolean if
      // 仅将空字符串/相同名称转换为boolean if
      // boolean has higher priority
      // 获取到相同的
      // 判断prop.type 的类型是否是string字符串类型
      const stringIndex = getTypeIndex(String, prop.type)
      if (
        stringIndex < 0  //如果匹配不到字符串
        || booleanIndex < stringIndex //或者布尔值索引小于字符串索引的时候
        ) {
          // 设置value为true
        value = true
      }
    }
  }
  // check default value 检查默认值
  // 如果没有值 value不是boolean也不是string时
  if (value === undefined) {
    // 有可能是函数
    value = getPropDefaultValue(vm, prop, key)
    // since the default value is a fresh copy,由于默认值是一个新的副本，
    // make sure to observe it. 一定要observe
    // 获取shouldObserve
    const prevShouldObserve = shouldObserve
    // 可放进观察者模式
    toggleObserving(true)
    // 为 value添加 value.__ob__属性，把value添加到观察者中
    observe(value)
    // 设为之前的 prevShouldObserve
    toggleObserving(prevShouldObserve)
  }
  if (
    process.env.NODE_ENV !== 'production' &&
    // skip validation for weex recycle-list child component props
    !(__WEEX__ && isObject(value) && ('@binding' in value))
  ) {
    // 检查prop是否合格
    assertProp(
      prop, //属性type值
      key,  //props中的key
      value,  //view 属性的值
      vm,  //Vuecomponent 组件构造函数
      absent //false
      )
  }
  return value
}

/**
 * Get the default value of a prop.
 */
function getPropDefaultValue (vm: ?Component, prop: PropOptions, key: string): any {
  // no default, return undefined
  if (!hasOwn(prop, 'default')) {
    return undefined
  }
  const def = prop.default
  // warn against non-factory defaults for Object & Array
  if (process.env.NODE_ENV !== 'production' && isObject(def)) {
    warn(
      'Invalid default value for prop "' + key + '": ' +
      'Props with type Object/Array must use a factory function ' +
      'to return the default value.',
      vm
    )
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
  prop: PropOptions,
  name: string,
  value: any,
  vm: ?Component,
  absent: boolean
) {
  if (prop.required && absent) {
    warn(
      'Missing required prop: "' + name + '"',
      vm
    )
    return
  }
  if (value == null && !prop.required) {
    return
  }
  let type = prop.type
  let valid = !type || type === true
  const expectedTypes = []
  if (type) {
    if (!Array.isArray(type)) {
      type = [type]
    }
    for (let i = 0; i < type.length && !valid; i++) {
      const assertedType = assertType(value, type[i])
      expectedTypes.push(assertedType.expectedType || '')
      valid = assertedType.valid
    }
  }

  if (!valid) {
    warn(
      getInvalidTypeMessage(name, value, expectedTypes),
      vm
    )
    return
  }
  const validator = prop.validator
  if (validator) {
    if (!validator(value)) {
      warn(
        'Invalid prop: custom validator check failed for prop "' + name + '".',
        vm
      )
    }
  }
}

const simpleCheckRE = /^(String|Number|Boolean|Function|Symbol)$/

function assertType (value: any, type: Function): {
  valid: boolean;
  expectedType: string;
} {
  let valid
  const expectedType = getType(type)
  if (simpleCheckRE.test(expectedType)) {
    const t = typeof value
    valid = t === expectedType.toLowerCase()
    // for primitive wrapper objects
    if (!valid && t === 'object') {
      valid = value instanceof type
    }
  } else if (expectedType === 'Object') {
    valid = isPlainObject(value)
  } else if (expectedType === 'Array') {
    valid = Array.isArray(value)
  } else {
    valid = value instanceof type
  }
  return {
    valid,
    expectedType
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
  const match = fn && fn.toString().match(/^\s*function (\w+)/)
  return match ? match[1] : ''
}
// 两个函数声明是否相等
function isSameType (a, b) {
  return getType(a) === getType(b)
}
// 判断expectedTypes 中的函数和 type 函数是否有相等的如有有则返回索引index 如果没有则返回-1
function getTypeIndex (type, expectedTypes): number {
  // 如果expectedTypes不是数组直接比较，
  if (!Array.isArray(expectedTypes)) {
    // 如果是相同的类型 返回0 否则返回1
    return isSameType(expectedTypes, type) ? 0 : -1
  }
  // 如果是数组。遍历
  for (let i = 0, len = expectedTypes.length; i < len; i++) {
    // 如果相同的，返回相应索引Index
    if (isSameType(expectedTypes[i], type)) {
      return i
    }
  }
  // 没有则返回-1
  return -1
}

function getInvalidTypeMessage (name, value, expectedTypes) {
  let message = `Invalid prop: type check failed for prop "${name}".` +
    ` Expected ${expectedTypes.map(capitalize).join(', ')}`
  const expectedType = expectedTypes[0]
  const receivedType = toRawType(value)
  const expectedValue = styleValue(value, expectedType)
  const receivedValue = styleValue(value, receivedType)
  // check if we need to specify expected value
  if (expectedTypes.length === 1 &&
      isExplicable(expectedType) &&
      !isBoolean(expectedType, receivedType)) {
    message += ` with value ${expectedValue}`
  }
  message += `, got ${receivedType} `
  // check if we need to specify received value
  if (isExplicable(receivedType)) {
    message += `with value ${receivedValue}.`
  }
  return message
}

function styleValue (value, type) {
  if (type === 'String') {
    return `"${value}"`
  } else if (type === 'Number') {
    return `${Number(value)}`
  } else {
    return `${value}`
  }
}

function isExplicable (value) {
  const explicitTypes = ['string', 'number', 'boolean']
  return explicitTypes.some(elem => value.toLowerCase() === elem)
}

function isBoolean (...args) {
  return args.some(elem => elem.toLowerCase() === 'boolean')
}
