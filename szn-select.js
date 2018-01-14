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

      this.isOpen = false

      this._root = rootElement
      this._select = rootElement.querySelector('select')
      this._uiContainer = uiContainer
      this._ui = document.createElement('szn-select-ui')
      this._minBottomSpace = MIN_BOTTOM_SPACE
      this._accessiblityBroker = null
      this._mounted = false

      this._onUiClicked = onUiClicked.bind(null, this)
      this._onChange = onChange.bind(null, this)

      if (!stylesInjected) {
        const stylesContainer = document.createElement('style')
        stylesContainer.innerHTML = CSS_STYLES
        stylesContainer.setAttribute(CSS_STYLES_TAG, '')
        document.head.appendChild(stylesContainer)
        stylesInjected = true
      }

      this._ui.onUiInteracted = () => {
        if (this._accessiblityBroker) {
          this._accessiblityBroker.onUiClicked()
        }
      }
      if (this._uiContainer) {
        this._uiContainer.appendChild(this._ui)
      }
    }

    onMount() {
      this._mounted = true
      if (!this._uiContainer) {
        this._uiContainer = this._root.querySelector('[data-szn-select-ui]')
        this._uiContainer.appendChild(this._ui)
      }

      if (!this._select) {
        this._select = this._root.querySelector('select')
      }

      SznElements.awaitElementReady(this._ui, () => {
        if (!this._mounted) {
          return
        }

        this._ui.minBottomSpace = this._minBottomSpace
        this._ui.setSelectElement(this._select)

        // TODO: select accessibility broker
        this._accessiblityBroker = new SznSelectRichNativeSelect(this._select, this._ui, this)
        this._accessiblityBroker.onMount()

        addEventListeners(this)
        finishInitialization(this)
      })
    }

    onUnmount() {
      this._mounted = false

      if (this._accessiblityBroker) {
        this._accessiblityBroker.onUnmount()
      }

      removeEventListeners(this)
    }
  }

  function addEventListeners(instance) {
    instance._uiContainer.addEventListener('click', instance._onUiClicked)
    instance._uiContainer.addEventListener('change', instance._onChange)
  }

  function removeEventListeners(instance) {
    instance._uiContainer.removeEventListener('click', instance._onUiClicked)
    instance._uiContainer.removeEventListener('change', instance._onChange)
  }

  function onUiClicked(instance, event) {
    instance._accessiblityBroker.onUiClicked(event)
  }

  function onChange(instance) {
    instance._accessiblityBroker.onChange()
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

  class SznSelectAccessibilityBroker {
    constructor(select, ui, sznSelect) {
      this.select = select
      this.sznSelect = sznSelect
      this.ui = ui
    }

    setOpen(isOpen) {
      this.sznSelect.isOpen = isOpen
      this.ui.setOpen(isOpen)
    }

    onMount() {}

    onUnmount() {}

    onUiClicked(event) {}

    onChange() {}
  }

  class SznSelectRichNativeSelect extends SznSelectAccessibilityBroker {
    constructor(select, ui, sznSelect) {
      super(select, ui, sznSelect)

      this._onFocus = this.onFocus.bind(this)
      this._onBlur = this.onBlur.bind(this)
      this._onKeyDown = this.onKeyDown.bind(this)
      this._onCloseDropdown = this.onCloseDropdown.bind(this)

      this._blurTimeout = null
    }

    onMount() {
      super.onMount()

      this._addEventListeners()
    }

    onUnmount() {
      super.onUnmount()

      if (this._blurTimeout) {
        clearTimeout(this._blurTimeout)
        this._blurTimeout = null
      }

      this._removeEventListeners()
    }

    onFocus() {
      if (this._blurTimeout) {
        clearTimeout(this._blurTimeout)
        this._blurTimeout = null
      }

      this.ui.setFocus(true)
    }

    onBlur() {
      if (this._blurTimeout) {
        clearTimeout(this._blurTimeout)
      }
      this._blurTimeout = setTimeout(() => {
        this.ui.setFocus(false)
        this.onCloseDropdown()
      }, 1000 / 30)
    }

    onUiClicked(event) {
      super.onUiClicked(event)

      if (this.select.disabled) {
        return
      }

      if (document.activeElement !== this.select) {
        this.select.focus()
      }

      if (this.select.multiple) {
        return
      }

      if (event) {
        event.stopPropagation()
      }
      if (!this.sznSelect.isOpen) {
        this.setOpen(!this.sznSelect.isOpen)
      }

      // the mousedown event happens before the blur event, so we need to delay the callback invocation
      setTimeout(() => {
        if (this._blurTimeout) {
          clearTimeout(this._blurTimeout)
          this._blurTimeout = null
        }
        if (document.activeElement !== this.select) {
          this.select.focus()
        }
      }, 0)
    }

    onChange() {
      super.onChange()

      const {select} = this
      if (!select.multiple && document.activeElement !== select) {
        select.focus()
      }
    }

    onKeyDown(event) {
      let shouldToggleDropdown = false
      switch (event.keyCode) {
        case 27: // escape
          shouldToggleDropdown = this.sznSelect.isOpen
          break
        case 38: // up
        case 40: // down
          shouldToggleDropdown = event.altKey
          if (!this.select.multiple && !event.altKey && navigator.platform === 'MacIntel') {
            // The macOS browsers rely on the native select dropdown, which is opened whenever the user wants to change
            // the selected value, so we have to do the change ourselves.
            event.preventDefault()
            const selectedIndexDelta = event.keyCode === 38 ? -1 : 1
            const {select} = this
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
          shouldToggleDropdown = !this.sznSelect.isOpen
          if (this.sznSelect.isOpen) {
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
        this.setOpen(!this.sznSelect.isOpen)
      }
    }

    onCloseDropdown() {
      if (!this.sznSelect.isOpen) {
        return
      }

      this.setOpen(false)
    }

    _addEventListeners() {
      this.select.addEventListener('focus', this._onFocus)
      this.select.addEventListener('blur', this._onBlur)
      this.select.addEventListener('keydown', this._onKeyDown)
      addEventListener('click', this._onCloseDropdown)
    }

    _removeEventListeners() {
      this.select.removeEventListener('focus', this._onFocus)
      this.select.removeEventListener('blur', this._onBlur)
      this.select.removeEventListener('keydown', this._onKeyDown)
      removeEventListener('click', this._onCloseDropdown)
    }
  }
  SznSelectAccessibilityBroker.compatibilityTest = () => true

  SznSelectAccessibilityBroker.implementations = [
    SznSelectRichNativeSelect,
  ]

  if (SznElements.init) {
    SznElements.init()
  }
})(self)
