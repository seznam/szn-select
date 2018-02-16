'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  const CSS_STYLES = `
%{CSS_STYLES}%
  `
  const OPENING_POSITION = {
    UP: 'OPENING_POSITION.UP',
    DOWN: 'OPENING_POSITION.DOWN',
  }
  if (Object.freeze) {
    Object.freeze(OPENING_POSITION)
  }

  SznElements['szn-select--button'] = class SznSelectButton {
    constructor(rootElement) {
      this.OPENING_POSITION = OPENING_POSITION

      this._root = rootElement
      this._select = null
      this._label = null
      this._observer = new MutationObserver(() => {
        updateLabel(this)
        updateDisabledStatus(this)
      })

      rootElement.OPENING_POSITION = OPENING_POSITION
      rootElement.setSelectElement = this.setSelectElement.bind(this)
      rootElement.setOpen = this.setOpen.bind(this)
      rootElement.setOpeningPosition = this.setOpeningPosition.bind(this)

      this._onChange = onChange.bind(null, this)

      SznElements.injectStyles(CSS_STYLES, 'szn-select--button')
    }

    onMount() {
      observeSelect(this)
      addEventListeners(this)
      updateLabel(this)
      updateDisabledStatus(this)
    }

    onUnmount() {
      this._observer.disconnect()
      removeEventListeners(this)
    }

    setSelectElement(selectElement) {
      if (selectElement === this._select) {
        return
      }

      if (!this._label) {
        this._root.appendChild(buildUI(this))
      }

      if (this._select) {
        removeEventListeners(this)
        this._observer.disconnect()
      }

      this._select = selectElement
      observeSelect(this)
      addEventListeners(this)
      updateLabel(this)
      updateDisabledStatus(this)
    }

    setOpen(isOpen) {
      if (isOpen) {
        this._root.setAttribute('data-szn-select--button--open', '')
      } else {
        this._root.removeAttribute('data-szn-select--button--open')
        this._root.removeAttribute('data-szn-select--button--open-at-top')
      }
    }

    setOpeningPosition(openingPosition) {
      if (openingPosition === OPENING_POSITION.UP) {
        this._root.setAttribute('data-szn-select--button--open-at-top', '')
      } else {
        this._root.removeAttribute('data-szn-select--button--open-at-top')
      }
    }
  }

  function addEventListeners(instance) {
    if (!instance._select) {
      return
    }

    instance._select.addEventListener('change', instance._onChange)
  }

  function removeEventListeners(instance) {
    if (!instance._select) {
      return
    }

    instance._select.removeEventListener('change', instance._onChange)
  }

  function onChange(instance) {
    updateLabel(instance)
  }

  function observeSelect(instance) {
    if (!instance._select) {
      return
    }

    instance._observer.observe(instance._select, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true,
      attributeFilter: ['disabled', 'selected'],
    })
  }

  function buildUI(instance) {
    return SznElements.buildDom(
      `
        <szn- data-szn-select--button--label data-szn-ref></szn->
        <szn- data-szn-select--button--mark></szn->
      `,
      label => {
        instance._label = label
      },
      false,
    )
  }

  function updateLabel(instance) {
    if (!instance._select) {
      return
    }

    const selectedOption = instance._select.options.item(instance._select.selectedIndex)
    const selectedOptionText = selectedOption.text
    if (instance._label.innerText !== selectedOptionText) {
      instance._label.innerText = selectedOptionText
    }
  }

  function updateDisabledStatus(instance) {
    if (!instance._select) {
      return
    }

    if (instance._select.disabled) {
      instance._root.setAttribute('disabled', '')
    } else {
      instance._root.removeAttribute('disabled')
    }
  }
})(self)
