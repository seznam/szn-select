/* global AccessibilityBroker */

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

    if (document.activeElement !== this.select) {
      this.select.focus()
    }

    switch (event.type) {
      case 'click':
        event.stopPropagation()
        if (!this.ui.contains(event.target)) {
          this.setOpen(false)
        }
        break
      case 'mousedown':
        if (!this.sznSelect.isOpen) {
          this.setOpen(true)
        } else if (this.ui.contains(event.target)) {
          this.setOpen(false)
        }
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
    if (document.activeElement !== select) {
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
        break
      case 32: // space
        shouldToggleDropdown = !this.sznSelect.isOpen
        break
      case 13: // enter
        shouldToggleDropdown = true
        break
      default:
        break // nothing to do
    }

    if (shouldToggleDropdown) {
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
RichNativeSelect.compatibilityTest = select => !select.disabled && !select.multiple
