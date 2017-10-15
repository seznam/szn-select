'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  // TODO: skip disabled options
  // TODO: fix selecting option from a detached dropdown using mouse
  SznElements['szn-select'] = class SznSelect {
    constructor(rootElement, uiContainer) {
      this._rootElement = rootElement
      this._select = rootElement.querySelector('select')
      this._uiContainer = uiContainer
      this._toggleButton = null
      this._currentOptionLabel = null
      this._isOpened = false
      this._isFocused = false

      this.onKeyPress = event => {
        if (!this._isFocused) {
          return
        }

        switch (event.keyCode) {
          case 13: // enter
            this._toggle()
            break
          case 32: // space
            if (!this._isOpened) {
              this._open()
            }
            break
        }
      }

      this.onKeyUp = event => {
        if (!this._isFocused) {
          return
        }

        switch (event.keyCode) {
          case 27: // escape
            if (this._isOpened) {
              this._close()
            }
            break
          case 38: // up
            if (event.altKey) {
              this._toggle()
            } else {
              this._changeSelectedOption(-1)
            }
            break
          case 40: // down
            if (event.altKey) {
              this._toggle()
            } else {
              this._changeSelectedOption(1)
            }
            break
        }
      }

      this.onChange = () => {
        const options = this._select.querySelectorAll('option')
        this._currentOptionLabel.nodeValue = options[this._select.selectedIndex].innerText
      }

      this.onToggleDropDown = () => {
        this._toggle()
      }

      this.onDropDownOptionClicked = () => {
        this._close()
      }

      this.onFocus = () => {
        this._isFocused = true
      }

      this.onBlur = () => {
        this._isFocused = false
        if (this._isOpened) {
          this._close()
        }
      }
    }

    onMount() {
      this._currentOptionLabel = document.createTextNode('')
      this._toggleButton = makeElement({'data-button': ''},
        makeElement({'data-text': ''},
          this._currentOptionLabel,
        ),
        makeElement({'data-caret': ''}),
      )
      this.onChange()
      this._uiContainer.appendChild(
        this._toggleButton,
      )

      this._toggleButton.addEventListener('click', this.onToggleDropDown)
      this._rootElement.addEventListener('focus', this.onFocus)
      this._rootElement.addEventListener('blur', this.onBlur)
      this._rootElement.addEventListener('change', this.onChange)
      this._rootElement.addEventListener('szn-options-selected', this.onDropDownOptionClicked)
      addEventListener('keypress', this.onKeyPress)
      addEventListener('keyup', this.onKeyUp)

      if (this._rootElement.hasAttribute('data-standalone')) {
        this._rootElement.tabIndex = 0
        this._rootElement.setAttribute('role', 'combobox')
      } else {
        this._rootElement.dispatchEvent(new CustomEvent('szn-select-ready', {bubbles: true, cancelable: true}))
      }
    }

    onUnmount() {
      this._toggleButton.removeEventListener('click', this.onToggleDropDown)
      this._rootElement.removeEventListener('focus', this.onFocus)
      this._rootElement.removeEventListener('blur', this.onBlur)
      this._rootElement.removeEventListener('change', this.onChange)
      this._rootElement.removeEventListener('szn-options-selected', this.onDropDownOptionClicked)
      removeEventListener('keypress', this.onKeyPress)
      removeEventListener('keyup', this.onKeyUp)
    }

    _changeSelectedOption(indexDelta) {
      const newSelectedIndex = Math.max(0, Math.min(this._select.selectedIndex + indexDelta, this._select.length - 1))
      this._select.selectedIndex = newSelectedIndex
      this._select.dispatchEvent(new CustomEvent('change', {bubbles: true, cancelable: true}))
    }

    _toggle() {
      if (this._isOpened) {
        this._close()
      } else {
        this._open()
      }
    }

    _open() {
      const optionsElement = document.createElement('szn-options')
      const optionsUiContainer = document.createElement('div')
      optionsUiContainer.setAttribute('data-szn-options-ui', '')
      optionsElement.appendChild(optionsUiContainer)
      this._uiContainer.appendChild(optionsElement)
      const options = optionsElement._broker
      options.setOptionsContainerElement(this._select)
      this._toggleButton.setAttribute('data-drop-down-opened', '')
      this._isOpened = true
    }

    _close() {
      this._toggleButton.removeAttribute('data-drop-down-opened')
      this._uiContainer.removeChild(this._uiContainer.lastChild)
      this._isOpened = false
    }
  }

  function makeElement(attributes, ...children) {
    const element = document.createElement('szn-')
    for (const attributeName of Object.keys(attributes)) {
      element.setAttribute(attributeName, attributes[attributeName])
    }
    for (const child of children) {
      element.appendChild(child)
    }
    return element
  }

  if (SznElements.init) {
    SznElements.init()
  }
})(self)
