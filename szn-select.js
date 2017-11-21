'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  // TODO: disabled select
  SznElements['szn-select'] = class SznSelect {
    constructor(rootElement, uiContainer) {
      this._rootElement = rootElement
      this._select = rootElement.querySelector('select')
      this._uiContainer = uiContainer
    }

    onMount() {
    }

    onUnmount() {
    }
  }

  if (SznElements.init) {
    SznElements.init()
  }
})(self)
