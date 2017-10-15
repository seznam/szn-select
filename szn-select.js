'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  // TODO: fix selecting option from a detached dropdown using mouse
  // TODO: disabled select
  SznElements['szn-select'] = class SznSelect {
    constructor(rootElement, uiContainer) {
      this._rootElement = rootElement
      this._select = rootElement.querySelector('select')
      this._uiContainer = uiContainer
      this._toggleButton = null
      this._currentOptionLabel = null
      this._isOpened = false
      this._isFocused = false
      this._optionsPollingIntervalId = null

      this.onKeyPress = event => {
        if (!this._isFocused) {
          return
        }

        switch (event.keyCode) {
          case 13: // enter
            this._toggle()
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
          case 32: // space
            if (!this._isOpened) {
              this._open()
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
      const options = this._select.querySelectorAll('option')
      let newSelectedIndex = this._select.selectedIndex + indexDelta

      let newSelectedOption = options[newSelectedIndex]
      while (
        newSelectedIndex > -1 &&
        newSelectedIndex < this._select.length &&
        (newSelectedOption.disabled || newSelectedOption.parentNode.disabled)
      ) {
        newSelectedIndex += indexDelta
        newSelectedOption = options[newSelectedIndex]
      }

      if (newSelectedOption) {
        this._select.selectedIndex = newSelectedIndex
        this._select.dispatchEvent(new CustomEvent('change', {bubbles: true, cancelable: true}))
      }
    }

    _toggle() {
      if (this._isOpened) {
        this._close()
      } else {
        this._open()
      }
    }

    _open() {
      this._isOpened = true
      const optionsElement = document.createElement('szn-options')
      const optionsUiContainer = document.createElement('div')
      optionsUiContainer.setAttribute('data-szn-options-ui', '')
      optionsElement.appendChild(optionsUiContainer)
      this._uiContainer.appendChild(optionsElement)

      this._toggleButton.setAttribute('data-drop-down-opened', '')
      const select = this._select

      // the mutation observer runtime cannot initialize the elements synchronously, we have to wait
      if (!checkAndInitOptions()) {
        this._optionsPollingIntervalId = setInterval(() => {
          if (checkAndInitOptions()) {
            clearInterval(this._optionsPollingIntervalId)
            this._optionsPollingIntervalId = null
          }
        }, 10)
      }

      function checkAndInitOptions() {
        if (optionsElement._broker) {
          optionsElement._broker.setOptionsContainerElement(select)
          return true
        }

        return false
      }
    }

    _close() {
      if (this._optionsPollingIntervalId) {
        clearInterval(this._optionsPollingIntervalId)
        this._optionsPollingIntervalId = null
      }
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
