export class ErrorClass extends Error {
  constructor(message) {
    super(message)
    this.name = this.constructor.name
    this.message = message
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    } else {
      this.stack = (new Error(message)).stack
    }
  }
}

export class ErrorUnknownComponentType extends ErrorClass {
  constructor(type) {
    super(`unknown component ${type}`)
  }
}

// deprecate
export class ErrorWrongStoreStatePath extends ErrorClass {
  constructor(path, pathMissing) {
    super(`store state path do no exist '${path}', missing from '${pathMissing}'`)
  }
}

export class ErrorWrongStateTreePath extends ErrorClass {
  constructor(path, pathMissing) {
    super(`store state path do no exist '${path}', missing from '${pathMissing}'`)
  }
}

export class ErrorWrongScopeIndex extends ErrorClass {
  constructor(scopeLength, index) {
    super(`only have ${scopeLength} scopes, you passed index ${index}`)
  }
}

export class ErrorOnlyPrimitiveTypeWithInterpolation extends ErrorClass {
  constructor(type) {
    super(`only primitive types can be interpolated, you passed type ${type}`)
  }
}

export class ErrorCreateItemBeforeCreateForm extends ErrorClass {
  constructor(itemName) {
    super(`you should create a form before create control item ${itemName}`)
  }
}

export class ErrorDuplicateFormName extends ErrorClass {
  constructor(formName) {
    super(`form ${formName} already exist`)
  }
}

export class ErrorWrongFormControlPath extends ErrorClass {
  constructor(path) {
    super(`wrong form control path ${path}`)
  }
}

export class ErrorDuplicateFormControl extends ErrorClass {
  constructor(formName, itemName) {
    super(`form control ${itemName} already exist in form ${formName}`)
  }
}

export class ErrorFormControlNotBind extends ErrorClass {
  constructor(itemName) {
    super(`form control ${itemName} must bind to store`)
  }
}

export class ErrorPromiseCancel extends ErrorClass {
  constructor(promiseName) {
    super(`promise ${promiseName} canceled`)
  }
}

export class ErrorPromiseAlreadyPending extends ErrorClass {
  constructor(promiseName) {
    super(`promise ${promiseName} is already pending`)
  }
}

export class ErrorSetDefaultStateAfterStoreSealed extends ErrorClass {
  constructor(path) {
    super(`cannot set default state for ${path} after store sealed`)
  }
}

export class ErrorInterpolation extends ErrorClass {
  constructor(str, source) {
    let sourceStr
    if (typeof source !== 'object') {
      sourceStr = source
    } else {
      sourceStr = Array.isArray(source) ?
        `Array[${source.length}]` :
        `Object{${Object.keys(source).join(', ')}}`
    }
    super(`cannot interpolate '${str}' with source: ${sourceStr}`)
  }
}

export class ErrorSameStoreStateReference extends ErrorClass {
  constructor(path) {
    super(`Can not change store state with path: ${path}, you returned the same reference of the origin data.`)
  }
}

export class ErrorComposeWithoutBind extends ErrorClass {
  constructor(type) {
    super(`compose must have bind field in config, type: ${type}`)
  }
}

export class ErrorLinkStateTargetIsNotAncestor extends ErrorClass {
  constructor(target, source) {
    super(`link state target should be ancestor of source, you passed: ${target}, ${source}`)
  }
}

export class ErrorConflictLinkStateTarget extends ErrorClass {
  constructor(target) {
    super(`link state target '${target}' already exist`)
  }
}

export class ErrorUnknownExposedListener extends ErrorClass {
  constructor(name) {
    super(`unknown exposed listener name '${name}'.`)
  }
}

export class ErrorMultipleWrapperChangedChildren extends ErrorClass {
  constructor() {
    super('only one wrapper can change children at compile time')
  }
}

export class ErrorScopeChildren extends ErrorClass {
  constructor(count) {
    super(`Scope must have one and only one child, you passed ${count}`)
  }
}

export class ErrorCicadaMultipleRender extends ErrorClass {
  constructor() {
    super('Cicada should render only once')
  }
}

export class ErrorNotCicadaComponent extends ErrorClass {
  constructor(name) {
    super(`${name} is not a Cicada component, thus you can not use store attributes like bind.`)
  }
}

export class ErrorWrongSubscriber extends ErrorClass {
  constructor(fn) {
    super(`store subscriber should be a function, got ${fn}`)
  }
}

export class ErrorDuplicateSubscriber extends ErrorClass {
  constructor(fn) {
    super(`store subscriber should be unique, one function should not subscribe twice, fn: ${fn}`)
  }
}

export class ErrorDuplicateOriginDataPath extends ErrorClass {
  constructor(path) {
    super(`origin data path should be unique, your path already exist: ${path}`)
  }
}
