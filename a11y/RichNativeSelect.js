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

  generateMetaAttributes(baseAttributes) {
    if (/(?:\(iP(?:ad|hone|od(?: touch)?);| Android )/.test(navigator.userAgent)) {
      // We want to use the native dropdown on mobile devices that use assistive technologies in order to achieve the
      // best possible accessibility. Interacting with the UI without the use of assistive technologies will not be
      // affected and will result in opening our own custom drop-down when tapping the single-select's button.
      return Object.assign({}, baseAttributes, {
        // not necessarily true, but HW keyboards are extremely rare with these devices
        'data-szn-select-touch-only': /\(iP(?:ad|hone|od(?: touch)?);/.test(navigator.userAgent) ? 'ios' : '',
      })
    }

    // Note about the iOS devices: it might be possible to detect usage of voiceover: when the user activates the
    // native select element, the touchstart (use capture phase to react before the select gains focus) event will
    // happen at the middle (minus 0 to 1px) of the touched element (unless the select element cannot fit comfortably
    // into its container), which could be a <szn-> element (the select is opened on iOS still).

    return baseAttributes
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
