/* global AccessibilityBroker, SznElements */

class VanillaAriaLabelledBySelect extends AccessibilityBroker {

  constructor(select, ui, sznSelect) {
    super(select, ui, sznSelect)

    this._instanceId = this._generateInstanceId()
    const [button, menu] = this._createA11yUI()
    this._uiContainer = ui.parentNode
    this._a11yButton = button
    this._a11yMenu = menu
    this._selectObserver = new MutationObserver(() => {
      this._updateA11yMenu()
      this._updateA11yButton()
    })
    this._blurTimeout = null
    this._lastOptionId = 0
    this._typedText = ''
    this._typingTimeout = null

    this._onFocus = this.onFocus.bind(this)
    this._onBlur = this.onBlur.bind(this)
    this._onKeyDown = this.onKeyDown.bind(this)
    this._onMouseUp = this.onMouseUp.bind(this)
    this._onClick = this.onClick.bind(this)
  }

  setOpen(isOpen) {
    super.setOpen(isOpen)

    this._a11yButton.setAttribute('aria-expanded', `${isOpen}`)
    this._a11yButton.setAttribute('aria-disabled', `${!isOpen}`)
    this._a11yMenu.firstElementChild.setAttribute('aria-hidden', `${!isOpen}`)
  }

  generateMetaAttributes(baseAttributes) {
    return Object.assign({}, baseAttributes, {
      'data-szn-select--vanilla-aria': '',
    })
  }

  onMount() {
    this._updateA11yMenu()
    this._updateA11yButton()
    this._uiContainer.appendChild(this._a11yButton)
    this._uiContainer.appendChild(this._a11yMenu)

    this._selectObserver.observe(this.select, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true,
      attributeFilter: ['disabled', 'selected', 'title'],
    })
    this._addEventListeners()
  }

  onUnmount() {
    this._uiContainer.removeChild(this._a11yButton)
    this._uiContainer.removeChild(this._a11yMenu)

    this._removeEventListeners()
    this._selectObserver.disconnect()

    if (this._typingTimeout) {
      clearTimeout(this._typingTimeout)
      this._typingTimeout = null
    }
  }

  onUiClicked(event) {
    super.onUiClicked(event)

    if (document.activeElement !== this._a11yButton) {
      this._a11yButton.focus()
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

  onMouseUp(event) {
    // Firefox does not always fire the click event on our dropdown, so have to "fix" it like this
    if (!this.ui.contains(event.target)) {
      this.setOpen(false)
    }
  }

  onChange() {
    this._updateA11yButton()

    if (document.activeElement !== this._a11yButton) {
      this._a11yButton.focus()
    }
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
      this.setOpen(false)
    }, 1000 / 30)
  }

  onKeyDown(event) {
    const enabledOptions = Array.from(this.select.options).filter(
      option => !option.disabled && !option.parentNode.disabled,
    )
    const selectedIndex = enabledOptions.findIndex(option => option.selected)
    const {isOpen} = this.sznSelect
    let newlySelectedOption = null

    switch (event.keyCode) {
      case 38: // up
      case 40: // down
        {
          event.preventDefault()
          if (event.altKey) {
            this.setOpen(!isOpen)
            break
          }

          const newSelectedIndex = selectedIndex + (event.keyCode === 38 ? -1 : 1)
          newlySelectedOption = enabledOptions[newSelectedIndex]
        }
        break
      case 13: // enter
        event.preventDefault()
        this.setOpen(!isOpen)
        break
      case 32: // space
        event.preventDefault()
        if (!isOpen) {
          this.setOpen(true)
        }
        break
      case 27: // escape
        event.preventDefault()
        this.setOpen(false)
        break
      case 33: // page up
      case 34: // page down
        {
          event.preventDefault()
          const newSelectedIndex = event.keyCode === 33 ?
            Math.max(0, selectedIndex - (isOpen ? 10 : 1))
            :
            Math.min(enabledOptions.length - 1, selectedIndex + (isOpen ? 10 : 1))
          newlySelectedOption = enabledOptions[newSelectedIndex]
        }
        break
      case 36: // home
        event.preventDefault()
        newlySelectedOption = enabledOptions[0]
        break
      case 35: // end
        event.preventDefault()
        newlySelectedOption = enabledOptions[enabledOptions.length - 1]
        break
      default:
        break // nothing to do
    }

    if (!event.altKey && !event.ctrlKey && !event.metaKey && event.key.length === 1) {
      if (this._typingTimeout) {
        clearTimeout(this._typingTimeout)
      }

      this._typedText += event.key.toLowerCase()
      for (const option of enabledOptions) {
        if (option.text.toLowerCase().substring(0, this._typedText.length) === this._typedText) {
          newlySelectedOption = option
          break
        }
      }
      if (
        (!newlySelectedOption || newlySelectedOption === enabledOptions[selectedIndex]) &&
        / Firefox\//.test(navigator.userAgent)
      ) {
        // Unfortunately, Firefox does not provide us with accented characters in keyboard events when the character is
        // typed using dead keys.
        const transliteratedTypedText = VanillaAriaLabelledBySelect.transliterate(this._typedText)
        for (const option of enabledOptions) {
          const transliteratedText = VanillaAriaLabelledBySelect.transliterate(option.text).toLowerCase()
          if (transliteratedText.substring(0, transliteratedTypedText.length) === transliteratedTypedText) {
            newlySelectedOption = option
            break
          }
        }
      }

      this._typingTimeout = setTimeout(() => {
        this._typingTimeout = null
        this._typedText = ''
      }, VanillaAriaLabelledBySelect.TYPING_TIMEOUT)
    }

    if (newlySelectedOption && newlySelectedOption !== enabledOptions[selectedIndex]) {
      newlySelectedOption.selected = true
      this.select.dispatchEvent(new CustomEvent('change'))
    }
  }

  onClick(event) {
    const clickedLabel = event.target.closest('label')
    if (!clickedLabel) {
      return
    }

    if (clickedLabel.htmlFor) {
      if (clickedLabel.htmlFor !== this.select.id) {
        return
      }
    } else {
      if (!clickedLabel.contains(this.select)) {
        return
      }
    }

    this._a11yButton.focus()
    event.preventDefault()
  }

  _addEventListeners() {
    this._a11yButton.addEventListener('focus', this._onFocus)
    this._a11yButton.addEventListener('blur', this._onBlur)
    this._uiContainer.addEventListener('keydown', this._onKeyDown)
    addEventListener('mouseup', this._onMouseUp)
    addEventListener('click', this._onClick)
  }

  _removeEventListeners() {
    this._a11yButton.removeEventListener('focus', this._onFocus)
    this._a11yButton.removeEventListener('blur', this._onBlur)
    this._uiContainer.removeEventListener('keydown', this._onKeyDown)
    removeEventListener('mouseup', this._onMouseUp)
    removeEventListener('click', this._onClick)
  }

  _updateA11yButton() {
    const selectedOption = this.select.options.item(this.select.selectedIndex)
    if (selectedOption) {
      const selectedOptionUI = Array.from(this._a11yMenu.querySelectorAll('li')).find(
        optionUI => optionUI.option === selectedOption,
      )
      this._a11yButton.setAttribute('aria-activedescendant', selectedOptionUI.firstElementChild.id)
      this._a11yButton.setAttribute('aria-labelledby', selectedOptionUI.firstElementChild.id)
    } else {
      this._a11yButton.setAttribute('aria-activedescendant', '')
      this._a11yButton.setAttribute('aria-labelledby', '')
    }

    if (this.select.title) {
      this._a11yButton.setAttribute('title', this.select.title)
    } else {
      this._a11yButton.removeAttribute('title')
    }
    if (this.select.hasAttribute('aria-label')) {
      this._a11yButton.setAttribute('aria-label', this.select.getAttribute('aria-label'))
    } else {
      this._a11yButton.removeAttribute('aria-label')
    }
  }

  _updateA11yMenu() {
    // We do not have to reflect the option groups, just keep the options and their order in sync

    const menuContainer = this._a11yMenu.firstElementChild
    const options = Array.from(this.select.options)

    for (const optionUIContainer of Array.from(menuContainer.querySelectorAll('li'))) {
      if (!options.includes(optionUIContainer.option)) {
        menuContainer.removeChild(optionUIContainer)
      }

      const optionUI = optionUIContainer.firstElementChild
      const {option} = optionUIContainer
      if (optionUIContainer.option.disabled || optionUIContainer.option.parentNode.disabled) {
        optionUI.setAttribute('aria-disabled', 'true')
        optionUI.setAttribute('disabled', '')
      } else {
        optionUI.setAttribute('aria-disabled', 'false')
        optionUI.removeAttribute('disabled')
      }
      optionUI.innerText = option.text
      if (option.title) {
        optionUI.setAttribute('title', option.title)
      } else {
        optionUI.removeAttribute('title')
      }
    }

    let currentOptionUIContainer = menuContainer.firstElementChild
    for (const option of options) {
      if (currentOptionUIContainer && currentOptionUIContainer.option === option) {
        currentOptionUIContainer = currentOptionUIContainer.nextElementSibling
        continue
      }

      const isDisabled = option.disabled || option.parentNode.disabled
      const newOptionUI = SznElements.buildDom(`
        <li>
          <szn-
            id="${this._generateOptionId()}"
            tabindex="-1"
            role="option"
            aria-disabled="${isDisabled}"
            ${isDisabled ? 'disabled' : ''}
            ${option.title ? `title="${option.title.replace('"', '&quot;')}"` : ''}
          >
            ${option.text.replace('<', '&lt;')}
          </szn->
        </li>
      `)
      newOptionUI.option = option
      menuContainer.insertBefore(newOptionUI, currentOptionUIContainer)
    }
  }

  _createA11yUI() {
    const menuId = this._instanceId

    return [
      SznElements.buildDom(`
        <szn-
          tabindex="0"
          role="combobox"
          aria-expanded="false"
          aria-autocomplete="list"
          aria-owns="${menuId}"
          aria-haspopup="true"
          aria-activedescendant=""
          aria-disabled="true"
          data-szn-select--vanilla-aria-button
        >
        </szn->
      `),
      SznElements.buildDom(`
        <szn- id="${menuId}" data-szn-select--vanilla-aria-dropdown>
          <ul tabindex="-1" role="listbox" aria-hidden="true" aria-disabled="false"></ul>
        </szn->
      `),
    ]
  }

  _generateInstanceId() {
    return `szn-select:VanillaAriaLabelledBySelect:${++VanillaAriaLabelledBySelect._lastId}`
  }

  _generateOptionId() {
    return `${this._instanceId}:${++this._lastOptionId}`
  }
}
VanillaAriaLabelledBySelect.compatibilityTest = select => (
  !select.disabled &&
  !select.multiple &&
  !/(?:\(iP(?:ad|hone|od(?: touch)?);| Android )/.test(navigator.userAgent) &&
  /(?: Firefox\/| Mac OS X )/.test(navigator.userAgent)
)

VanillaAriaLabelledBySelect._lastId = 0

VanillaAriaLabelledBySelect.TYPING_TIMEOUT = 500 // milliseconds

// The following code is derived from the node-transliterator npm package:
// https://github.com/psyduk/node-transliterator
VanillaAriaLabelledBySelect.transliterate = string => {
  return string.split('').map(character => {
    if (
      character.charCodeAt(0) > 127 &&
      typeof VanillaAriaLabelledBySelect.TRANSLITERATION_TABLE[character] !== 'undefined'
    ) {
      return VanillaAriaLabelledBySelect.TRANSLITERATION_TABLE[character]
    } else {
      return character
    }
  }).join('')
}
VanillaAriaLabelledBySelect.TRANSLITERATION_TABLE = {
  ä: 'ae',
  æ: 'ae',
  ǽ: 'ae',
  ö: 'oe',
  œ: 'oe',
  ü: 'ue',
  Ä: 'Ae',
  Ü: 'Ue',
  Ö: 'Oe',
  À: 'A',
  Á: 'A',
  Â: 'A',
  Ã: 'A',
  Å: 'A',
  Ǻ: 'A',
  Ā: 'A',
  Ă: 'A',
  Ą: 'A',
  Ǎ: 'A',
  à: 'a',
  á: 'a',
  â: 'a',
  ã: 'a',
  å: 'a',
  ǻ: 'a',
  ā: 'a',
  ă: 'a',
  ą: 'a',
  ǎ: 'a',
  ª: 'a',
  Ç: 'C',
  Ć: 'C',
  Ĉ: 'C',
  Ċ: 'C',
  Č: 'C',
  ç: 'c',
  ć: 'c',
  ĉ: 'c',
  ċ: 'c',
  č: 'c',
  Ð: 'D',
  Ď: 'D',
  Đ: 'D',
  ð: 'd',
  ď: 'd',
  đ: 'd',
  È: 'E',
  É: 'E',
  Ê: 'E',
  Ë: 'E',
  Ē: 'E',
  Ĕ: 'E',
  Ė: 'E',
  Ę: 'E',
  Ě: 'E',
  è: 'e',
  é: 'e',
  ê: 'e',
  ë: 'e',
  ē: 'e',
  ĕ: 'e',
  ė: 'e',
  ę: 'e',
  ě: 'e',
  Ĝ: 'G',
  Ğ: 'G',
  Ġ: 'G',
  Ģ: 'G',
  ĝ: 'g',
  ğ: 'g',
  ġ: 'g',
  ģ: 'g',
  Ĥ: 'H',
  Ħ: 'H',
  ĥ: 'h',
  ħ: 'h',
  Ì: 'I',
  Í: 'I',
  Î: 'I',
  Ï: 'I',
  Ĩ: 'I',
  Ī: 'I',
  Ĭ: 'I',
  Ǐ: 'I',
  Į: 'I',
  İ: 'I',
  ì: 'i',
  í: 'i',
  î: 'i',
  ï: 'i',
  ĩ: 'i',
  ī: 'i',
  ĭ: 'i',
  ǐ: 'i',
  į: 'i',
  ı: 'i',
  Ĵ: 'J',
  ĵ: 'j',
  Ķ: 'K',
  ķ: 'k',
  Ĺ: 'L',
  Ļ: 'L',
  Ľ: 'L',
  Ŀ: 'L',
  Ł: 'L',
  ĺ: 'l',
  ļ: 'l',
  ľ: 'l',
  ŀ: 'l',
  ł: 'l',
  Ñ: 'N',
  Ń: 'N',
  Ņ: 'N',
  Ň: 'N',
  ñ: 'n',
  ń: 'n',
  ņ: 'n',
  ň: 'n',
  ŉ: 'n',
  Ò: 'O',
  Ó: 'O',
  Ô: 'O',
  Õ: 'O',
  Ō: 'O',
  Ŏ: 'O',
  Ǒ: 'O',
  Ő: 'O',
  Ơ: 'O',
  Ø: 'O',
  Ǿ: 'O',
  ò: 'o',
  ó: 'o',
  ô: 'o',
  õ: 'o',
  ō: 'o',
  ŏ: 'o',
  ǒ: 'o',
  ő: 'o',
  ơ: 'o',
  ø: 'o',
  ǿ: 'o',
  º: 'o',
  Ŕ: 'R',
  Ŗ: 'R',
  Ř: 'R',
  ŕ: 'r',
  ŗ: 'r',
  ř: 'r',
  Ś: 'S',
  Ŝ: 'S',
  Ş: 'S',
  Š: 'S',
  ś: 's',
  ŝ: 's',
  ş: 's',
  š: 's',
  ſ: 's',
  Ţ: 'T',
  Ť: 'T',
  Ŧ: 'T',
  ţ: 't',
  ť: 't',
  ŧ: 't',
  Ù: 'U',
  Ú: 'U',
  Û: 'U',
  Ũ: 'U',
  Ū: 'U',
  Ŭ: 'U',
  Ů: 'U',
  Ű: 'U',
  Ų: 'U',
  Ư: 'U',
  Ǔ: 'U',
  Ǖ: 'U',
  Ǘ: 'U',
  Ǚ: 'U',
  Ǜ: 'U',
  ù: 'u',
  ú: 'u',
  û: 'u',
  ũ: 'u',
  ū: 'u',
  ŭ: 'u',
  ů: 'u',
  ű: 'u',
  ų: 'u',
  ư: 'u',
  ǔ: 'u',
  ǖ: 'u',
  ǘ: 'u',
  ǚ: 'u',
  ǜ: 'u',
  Ý: 'Y',
  Ÿ: 'Y',
  Ŷ: 'Y',
  ý: 'y',
  ÿ: 'y',
  ŷ: 'y',
  Ŵ: 'W',
  ŵ: 'w',
  Ź: 'Z',
  Ż: 'Z',
  Ž: 'Z',
  ź: 'z',
  ż: 'z',
  ž: 'z',
  Æ: 'AE',
  Ǽ: 'AE',
  ß: 'ss',
  Ĳ: 'IJ',
  ĳ: 'ij',
  Œ: 'OE',
  ƒ: 'f',
}
