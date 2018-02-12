/* global AccessibilityBroker */

class MultiSelect extends AccessibilityBroker {
  constructor(select, ui, sznSelect) {
    super(select, ui, sznSelect)

    this._onFocus = this.onFocus.bind(this)
    this._onBlur = this.onBlur.bind(this)
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

    return Object.assign({}, baseAttributes, {
      role: 'application', // NVDA compatibility
    })
  }

  onMount() {
    super.onMount()

    this.select.addEventListener('focus', this._onFocus)
    this.select.addEventListener('blur', this._onBlur)
  }

  onUnmount() {
    super.onUnmount()

    this.select.removeEventListener('focus', this._onFocus)
    this.select.removeEventListener('blur', this._onBlur)
  }

  onUiClicked(event) {
    if (document.activeElement !== this.select) {
      this.select.focus()
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
    }, 1000 / 30)
  }
}
MultiSelect.compatibilityTest = select => !select.disabled && select.multiple
