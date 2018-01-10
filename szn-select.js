'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  const CSS_STYLES = `
%{CSS_STYLES}%
  `
  const CSS_STYLES_TAG = 'data-styles--szn-select'

  const MIN_BOTTOM_SPACE = 160 // px

  let stylesInjected = false

  SznElements['szn-select'] = class SznSelect {
    constructor(rootElement, uiContainer) {
      if (!rootElement.hasOwnProperty('minBottomSpace')) {
        Object.defineProperty(rootElement, 'minBottomSpace', {
          get: () => rootElement._broker._minBottomSpace,
          set: value => {
            rootElement._broker._minBottomSpace = value
            if (rootElement._broker._ui && rootElement._broker._ui._broker) {
              rootElement._broker._ui.minBottomSpace = value
            }
          },
        })
      }

      this._root = rootElement
      this._select = rootElement.querySelector('select')
      this._uiContainer = uiContainer
      this._ui = document.createElement('szn-select-ui')
      this._blurTimeout = null
      this._isOpen = false
      this._hasFocus = false
      this._minBottomSpace = MIN_BOTTOM_SPACE

      this._onUpdateNeeded = () => onUpdateNeeded(this)
      this._onToggleDropdown = event => onToggleDropdown(this, event)
      this._onCloseDropdown = () => onCloseDropdown(this)
      this._onFocus = () => onFocus(this)
      this._onBlur = () => onBlur(this)
      this._onKeyDown = event => onKeyDown(this, event)

      if (!stylesInjected) {
        const stylesContainer = document.createElement('style')
        stylesContainer.innerHTML = CSS_STYLES
        stylesContainer.setAttribute(CSS_STYLES_TAG, '')
        document.head.appendChild(stylesContainer)
        stylesInjected = true
      }

      this._ui.onUiInteracted = () => {
        // the mousedown event happens before the blur event, so we need to delay the callback invocation
        setTimeout(() => {
          if (this._blurTimeout) {
            clearTimeout(this._blurTimeout)
            this._blurTimeout = null
          }
          if (this._select && document.activeElement !== this._select) {
            this._select.focus()
          }
        }, 0)
      }
      if (this._uiContainer) {
        this._uiContainer.appendChild(this._ui)
      }
    }

    onMount() {
      if (!this._uiContainer) {
        this._uiContainer = this._root.querySelector('[data-szn-select-ui]')
        this._uiContainer.appendChild(this._ui)
      }

      if (!this._select) {
        this._select = this._root.querySelector('select')
      }

      SznElements.awaitElementReady(this._ui, () => {
        this._ui.minBottomSpace = this._minBottomSpace
        this._ui.setSelectElement(this._select)
        this._ui.setOpen(this._isOpen)
        this._ui.setFocus(this._hasFocus)
      })

      addEventListeners(this)
      finishInitialization(this)
    }

    onUnmount() {
      if (this._blurTimeout) {
        clearTimeout(this._blurTimeout)
        this._blurTimeout = null
      }

      removeEventListeners(this)
    }
  }

  function addEventListeners(instance) {
    instance._uiContainer.addEventListener('click', instance._onToggleDropdown)
    instance._select.addEventListener('change', instance._onUpdateNeeded)
    instance._select.addEventListener('focus', instance._onFocus)
    instance._select.addEventListener('blur', instance._onBlur)
    instance._select.addEventListener('keydown', instance._onKeyDown)
    addEventListener('click', instance._onCloseDropdown)
  }

  function removeEventListeners(instance) {
    instance._uiContainer.removeEventListener('click', instance._onToggleDropdown)
    instance._select.removeEventListener('change', instance._onUpdateNeeded)
    instance._select.removeEventListener('focus', instance._onFocus)
    instance._select.removeEventListener('blur', instance._onBlur)
    instance._select.removeEventListener('keydown', instance._onKeyDown)
    removeEventListener('click', instance._onCloseDropdown)
  }

  function onKeyDown(instance, event) {
    let shouldToggleDropdown = false
    switch (event.keyCode) {
      case 27: // escape
        shouldToggleDropdown = instance._isOpen
        break
      case 38: // up
      case 40: // down
        shouldToggleDropdown = event.altKey
        if (!instance._select.multiple && !event.altKey && navigator.platform === 'MacIntel') {
          // The macOS browsers rely on the native select dropdown, which is opened whenever the user wants to change
          // the selected value, so we have to do the change ourselves.
          event.preventDefault()
          const selectedIndexDelta = event.keyCode === 38 ? -1 : 1
          const select = instance._select
          let newIndex = select.selectedIndex
          let lastNewIndex = newIndex
          do {
            newIndex = Math.max(0, Math.min(newIndex + selectedIndexDelta, select.options.length - 1))
            if (newIndex === lastNewIndex) {
              // all options in the chosen direction are disabled
              return
            }
            lastNewIndex = newIndex
          } while (select.options.item(newIndex).disabled || select.options.item(newIndex).parentNode.disabled)
          select.selectedIndex = Math.max(0, Math.min(newIndex, select.options.length - 1))
          select.dispatchEvent(new CustomEvent('change', {bubbles: true, cancelable: true}))
        }
        break
      case 32: // space
        shouldToggleDropdown = !instance._isOpen
        if (instance._isOpen) {
          event.preventDefault() // Prevent Safari from opening the native dropdown
        }
        break
      case 13: // enter
        shouldToggleDropdown = true
        break
      default:
        break // nothing to do
    }

    if (shouldToggleDropdown) {
      event.preventDefault() // Prevent Safari from opening the native dropdown
      onToggleDropdown(instance, event)
    }
  }

  function onFocus(instance) {
    if (instance._blurTimeout) {
      clearTimeout(instance._blurTimeout)
      instance._blurTimeout = null
    }

    if (instance._ui._broker) {
      instance._ui.setFocus(true)
    }
  }

  function onBlur(instance) {
    if (instance._blurTimeout) {
      clearTimeout(instance._blurTimeout)
    }
    instance._blurTimeout = setTimeout(() => {
      if (instance._ui._broker) {
        instance._ui.setFocus(false)
      }
      onCloseDropdown(instance)
    }, 1000 / 30)
  }

  function onCloseDropdown(instance) {
    if (!instance._isOpen) {
      return
    }

    if (instance._ui._broker) {
      instance._ui.setOpen(false)
      instance._isOpen = false
    }
  }

  function onUpdateNeeded(instance) {
    if (instance._select.multiple) {
      return
    }

    const select = instance._select
    if (document.activeElement !== select) {
      select.focus()
    }
  }

  function onToggleDropdown(instance, event) {
    if (instance._select.disabled) {
      return
    }

    if (document.activeElement !== instance._select) {
      instance._select.focus()
    }

    if (instance._select.multiple) {
      return
    }

    event.stopPropagation()
    instance._isOpen = !instance._isOpen
    if (instance._ui._broker) {
      instance._ui.setOpen(instance._isOpen)
    }
  }

  function finishInitialization(instance) {
    const rootAttributes = {
      'data-szn-select-ready': '',
    }
    rootAttributes['data-szn-select-single'] = instance._select.multiple ? null : ''

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

  function setAttributes(element, attributes) {
    for (const attributeName of Object.keys(attributes)) {
      if (attributes[attributeName] === null) {
        element.removeAttribute(attributeName)
      } else {
        element.setAttribute(attributeName, attributes[attributeName])
      }
    }
  }

  if (SznElements.init) {
    SznElements.init()
  }
})(self)
