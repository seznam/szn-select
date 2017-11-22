'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  // TODO: disabled select
  // TODO: resize dropdown to be always fully visible
  // TODO: observe the disabled, multiple, and dom changes (the label must reflect an *existing* currently selected
  //       option)
  SznElements['szn-select'] = class SznSelect {
    constructor(rootElement, uiContainer) {
      this._root = rootElement
      this._select = rootElement.querySelector('select')
      this._uiContainer = uiContainer
      this._button = null
      this._label = null
      this._dropdown = null
      this._dropdownContent = document.createElement('szn-')
      this._dropdownContent.setAttribute('data-szn-select-dropdown', '')
      this._dropdownOptions = null
      this._dropdownContainer = document.body

      this._onUpdateNeeded = () => onUpdateNeeded(this)
      this._onToggleDropdown = event => onToggleDropdown(this, event)
      this._onCloseDropdown = () => onCloseDropdown(this)

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

      addEventListeners(this)
    }

    onUnmount() {
      if (this._dropdown) {
        this._dropdown.parentNode.removeChild(this._dropdown)
      }

      removeEventListeners(this)
    }
  }

  function addEventListeners(instance) {
    instance._uiContainer.addEventListener('click', instance._onToggleDropdown)
    instance._select.addEventListener('change', instance._onUpdateNeeded)
    addEventListener('click', instance._onCloseDropdown)
  }

  function removeEventListeners(instance) {
    instance._uiContainer.removeEventListener('click', instance._onToggleDropdown)
    instance._select.removeEventListener('change', instance._onUpdateNeeded)
    removeEventListener('click', instance._onCloseDropdown)
  }

  function onCloseDropdown(instance) {
    if (instance._select.multiple || !instance._button.hasAttribute('data-szn-select-open')) {
      return
    }

    instance._button.removeAttribute('data-szn-select-open')
    instance._dropdown.parentNode.removeChild(instance._dropdown)
  }

  function onUpdateNeeded(instance) {
    if (instance._select.multiple) {
      return
    }

    const select = instance._select
    instance._label.innerText = select.options.item(select.selectedIndex).text
    if (document.activeElement !== select) {
      select.focus()
    }
  }

  function onToggleDropdown(instance, event) {
    instance._select.focus()

    if (instance._select.multiple) {
      return
    }

    event.stopPropagation()
    if (instance._button.hasAttribute('data-szn-select-open')) {
      instance._button.removeAttribute('data-szn-select-open')
      instance._dropdown.parentNode.removeChild(instance._dropdown)
    } else {
      instance._button.setAttribute('data-szn-select-open', '')
      instance._dropdownContainer.appendChild(instance._dropdown)

      let dropdownReady = false
      let optionsReady = false
      SznElements.awaitElementReady(instance._dropdown, () => {
        dropdownReady = true
        if (optionsReady) {
          initDropdown(instance, instance._dropdown, instance._dropdownOptions)
        }
      })
      SznElements.awaitElementReady(instance._dropdownOptions, () => {
        optionsReady = true
        if (dropdownReady) {
          initDropdown(instance, instance._dropdown, instance._dropdownOptions)
        }
      })
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

    instance._dropdownOptions = document.createElement('szn-options')
    instance._dropdown = document.createElement('szn-tethered')
    instance._dropdown.appendChild(instance._dropdownContent)
    instance._dropdownContent.appendChild(instance._dropdownOptions)
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

    instance._label = label
    instance._button = button
    instance._uiContainer.appendChild(button)
  }

  function initDropdown(instance, dropdown, options) {
    dropdown.setTether(instance._uiContainer)
    options.setOptions(instance._select)
  }

  function createMultiSelectUi(instance) {
    const select = instance._select
    const options = document.createElement('szn-options')
    instance._uiContainer.appendChild(options)
    SznElements.awaitElementReady(options, () => options.setOptions(select))
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
