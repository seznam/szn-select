'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  // TODO: disabled select
  // TODO: resize dropdown to be always fully visible
  SznElements['szn-select'] = class SznSelect {
    constructor(rootElement, uiContainer) {
      this._root = rootElement
      this._select = rootElement.querySelector('select')
      this._uiContainer = uiContainer
      this._button = null
      this._dropdown = null
      this._dropdownContent = document.createElement('szn-')
      this._dropdownContent.setAttribute('data-szn-select-dropdown', '')
      this._dropdownContainer = document.body

      createUI(this)
    }

    onMount() {
      let updateNeeded = false
      if (!this._uiContainer) {
        this._uiContainer = this._root.querySelector('[data-szn-select-ui]')
        updateNeeded = true
      }

      if (!this._select) {
        this._select = this._root.querySelector('select')
        updateNeeded = true
      }

      if (updateNeeded) {
        createUI(this)
      }
    }

    onUnmount() {
      if (this._dropdown) {
        this._dropdown.parentNode.removeChild(this._dropdown)
        this._dropdown = null
      }
    }
  }

  function createUI(instance) {
    if (!instance._select || !instance._uiContainer) {
      return
    }

    clearUi(instance)

    if (instance._select.multiple) {
      createMultiSelectUi(instance)
    } else {
      createSingleSelectUi(instance)
    }

    finishInitialization(instance)
  }

  function createSingleSelectUi(instance) {
    initSingleSelectButton(instance)

    const select = instance._select
    const options = document.createElement('szn-options')
    instance._dropdown = document.createElement('szn-tethered')
    instance._dropdown.appendChild(instance._dropdownContent)
    instance._dropdownContent.appendChild(options)
    instance._dropdownContainer.appendChild(instance._dropdown)

    let dropDownReady = false
    let optionsReady = false
    SznElements.awaitElementReady(instance._dropdown, () => {
      dropDownReady = true
      if (optionsReady && instance._select === select) {
        initDropDown(instance, instance._dropdown, options)
      }
    })
    SznElements.awaitElementReady(options, () => {
      optionsReady = true
      if (dropDownReady && instance._select === select) {
        initDropDown(instance, instance._dropdown, options)
      }
    })
  }

  function initSingleSelectButton(instance) {
    const button = document.createElement('szn-')
    button.setAttribute('data-szn-select-button', '')
    const label = document.createElement('szn-')
    label.setAttribute('data-szn-select-label', '')
    label.innerText = instance._select.options.item(instance._select.selectedIndex).text
    button.appendChild(label)
    const mark = document.createElement('szn-')
    mark.setAttribute('data-szn-select-mark', '')
    button.appendChild(mark)

    instance._button = button
    instance._uiContainer.appendChild(button)
  }

  function initDropDown(instance, dropdown, options) {
    dropdown.setTether(instance._uiContainer)
    options.setOptions(instance._select)
  }

  function createMultiSelectUi(instance) {
    const select = instance._select
    const options = document.createElement('szn-options')
    instance._uiContainer.appendChild(options)
    SznElements.awaitElementReady(options, () => {
      if (instance._select === select) {
        options.setOptions(select)
      }
    })
  }

  function finishInitialization(instance) {
    const rootAttributes = {
      'data-szn-select-ready': '',
    }
    if (!instance._select.multiple) {
      rootAttributes['data-szn-select-single'] = ''
    }

    if (instance._root.hasAttribute('data-szn-select-standalone')) {
      setAttributes(instance._root, rootAttributes)
    } else {
      instance._root.dispatchEvent(new CustomEvent('szn-select:ready', {
        bubbles: true,
        cancelable: true,
        detail: {
          attributes: rootAttributes,
        },
      }))
    }
  }

  function clearUi(instance) {
    instance._uiContainer.innerHTML = ''
    instance._dropdownContent.innerHTML = ''
    if (instance._dropdown) {
      instance._dropdown.parentNode.removeChild(instance._dropdown)
      instance._dropdown = null
    }
  }

  function setAttributes(element, attributes) {
    for (const attributeName of Object.keys(attributes)) {
      element.setAttribute(attributeName, attributes[attributeName])
    }
  }

  if (SznElements.init) {
    SznElements.init()
  }
})(self)
