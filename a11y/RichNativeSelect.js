class RichNativeSelect extends AccessibilityBroker {
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
RichNativeSelect.compatibilityTest = () => true
