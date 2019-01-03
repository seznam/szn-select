/* global AccessibilityBroker, DisabledSelect, MultiSelect, RichNativeSelect, VanillaAriaLabelledBySelect */

'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  const CSS_STYLES = `
%{CSS_STYLES}%
  `
  const MIN_BOTTOM_SPACE = 160 // px

  SznElements['szn-select'] = class SznSelect {
    constructor(rootElement) {
      if (!rootElement.hasOwnProperty('minBottomSpace')) {
        Object.defineProperty(rootElement, 'minBottomSpace', {
          get: () => rootElement._broker._minBottomSpace,
          set: value => {
            if (rootElement._broker && rootElement._broker._ui._broker) {
              rootElement._broker._ui.minBottomSpace = value
            }
            rootElement._broker._minBottomSpace = value
          },
        })
      }
      if (!rootElement.hasOwnProperty('dropdownClassName')) {
        Object.defineProperty(rootElement, 'dropdownClassName', {
          get: () => rootElement._broker._ui.dropdownClassName || '',
          set: value => {
            if (rootElement._broker && rootElement._broker._ui._broker) {
              rootElement._broker._ui.dropdownClassName = value
            }
          },
        })
      }
      if (!rootElement.hasOwnProperty('dropdownContainer')) {
        Object.defineProperty(rootElement, 'dropdownContainer', {
          get: () => rootElement._broker._ui.dropdownContainer || '',
          set: value => {
            if (rootElement._broker && rootElement._broker._ui._broker) {
              rootElement._broker._ui.dropdownContainer = value
            }
          },
        })
      }

      this.isOpen = false

      this._root = rootElement
      this._select = rootElement.querySelector('select')
      this._uiContainer = null
      this._ui = document.createElement('szn-select--ui')
      this._minBottomSpace = MIN_BOTTOM_SPACE
      this._accessiblityBroker = null
      this._mounted = false
      this._selectAttributesObserver = new MutationObserver(updateA11yBroker.bind(null, this))
      this._lastMetaAttributes = {}

      this._onUiClicked = onUiClicked.bind(null, this)
      this._onChange = onChange.bind(null, this)

      SznElements.injectStyles(CSS_STYLES, 'szn-select')

      this._ui.onUiInteracted = event => {
        if (this._accessiblityBroker) {
          this._accessiblityBroker.onUiClicked(event)
        }
      }
    }

    onMount() {
      this._mounted = true
      if (!this._uiContainer) {
        this._uiContainer = this._root.querySelector('[data-szn-select--ui]')
      }

      if (!this._select) {
        this._select = this._root.querySelector('select')
      }

      if (!this._uiContainer || !this._select) {
        // Can this really happen in browsers that do not support custom elements?
        if (isDocumentReady()) {
          console.error( // eslint-disable-line no-console
            'The szn-select element requires a select element and another element with the data-szn-select--ui ' +
            'attribute to be in its children, but at least one of these is missing',
            this._root,
          )
          return
        }

        const onReadyStateChange = () => {
          if (!isDocumentReady()) {
            return
          }

          document.removeEventListener('readystatechange', onReadyStateChange)
          if (this._mounted) {
            this.onMount()
          }
        }

        document.addEventListener('readystatechange', onReadyStateChange)

        return
      }

      handleElementProperlyMounted(this)
    }

    onUnmount() {
      this._mounted = false
      this._selectAttributesObserver.disconnect()

      if (this._accessiblityBroker) {
        this._accessiblityBroker.onUnmount()
        this._accessiblityBroker = null
      }

      removeEventListeners(this)
    }
  }

  function isDocumentReady() {
    // https://mdn.io/Document/readyState
    return / MSIE \d/.test(navigator.userAgent) ?
      document.readyState === 'complete'
      :
      document.readyState !== 'loading'
  }

  function handleElementProperlyMounted(instance) {
    if (!instance._mounted) {
      return
    }

    if (!instance._ui.parentNode) {
      instance._uiContainer.appendChild(instance._ui)
    }

    instance._selectAttributesObserver.observe(instance._select, {
      attributes: true,
      attributeFilter: ['disabled', 'multiple'],
    })

    SznElements.awaitElementReady(instance._ui, () => {
      if (!instance._mounted) {
        return
      }

      instance._ui.minBottomSpace = instance._minBottomSpace
      instance._ui.setSelectElement(instance._select)

      updateA11yBroker(instance)

      addEventListeners(instance)
      finishInitialization(instance)
    })
  }

  function addEventListeners(instance) {
    instance._uiContainer.addEventListener('click', instance._onUiClicked)
    instance._select.addEventListener('change', instance._onChange)
  }

  function removeEventListeners(instance) {
    instance._uiContainer.removeEventListener('click', instance._onUiClicked)
    instance._select.removeEventListener('change', instance._onChange)
  }

  function onUiClicked(instance, event) {
    instance._accessiblityBroker.onUiClicked(event)
  }

  function onChange(instance) {
    instance._accessiblityBroker.onChange()
  }

  function updateA11yBroker(instance) {
    if (instance._accessiblityBroker) {
      instance._accessiblityBroker.onUnmount()
    }

    if (!instance._mounted) {
      return
    }

    const implementation = selectA11yBrokerImplementation(instance._select)
    if (instance._accessiblityBroker && instance._accessiblityBroker.constructor === implementation) {
      return
    }

    instance._accessiblityBroker = new implementation(instance._select, instance._ui, instance)
    finishInitialization(instance) // update meta-attributes
    instance._accessiblityBroker.onMount()
  }

  function selectA11yBrokerImplementation(select) {
    for (const possibleImplementation of AccessibilityBroker.implementations) {
      if (possibleImplementation.compatibilityTest(select)) {
        return possibleImplementation
      }
    }

    throw new Error('There is no compatible accessibility broker implementation for the provided select element')
  }

  function finishInitialization(instance) {
    const baseAttributes = {}
    for (const property of Object.keys(instance._lastMetaAttributes)) {
      baseAttributes[property] = null
    }
    baseAttributes['data-szn-select--ready'] = ''
    baseAttributes['data-szn-select--single'] = instance._select.multiple ? null : ''
    const metaAttributes = instance._accessiblityBroker.generateMetaAttributes(baseAttributes)

    if (instance._root.hasAttribute('data-szn-select--standalone')) {
      setAttributes(instance._root, metaAttributes)
    } else {
      instance._root.dispatchEvent(new CustomEvent('szn-select:ready', {
        bubbles: true,
        cancelable: true,
        detail: {
          attributes: metaAttributes,
        },
      }))
      // Make the requested attributes accessible even if the client code was too late to intercept the event
      instance._root.requestedAttributes = metaAttributes
      instance._root.isReady = true
    }
    instance._lastMetaAttributes = metaAttributes
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

  // %{A11Y_IMPLEMENTATIONS}%

  AccessibilityBroker.implementations = [
    DisabledSelect,
    MultiSelect,
    RichNativeSelect,
    VanillaAriaLabelledBySelect,
  ]
})(self)
