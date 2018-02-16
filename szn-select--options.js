'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  const CSS_STYLES = `
%{CSS_STYLES}%
  `
  SznElements['szn-select--options'] = class SznOptions {
    /**
     * Initializes the szn-options element's implementation.
     *
     * @param {Element} rootElement The root HTML element of this custom element's implementation.
     */
    constructor(rootElement) {
      rootElement.setOptions = options => this.setOptions(options)
      rootElement.updateUi = () => updateUi(this)

      /**
       * The root HTML element of this custom element's implementation.
       *
       * @type {Element}
       */
      this._root = rootElement

      /**
       * The container of the options this element provides the UI for.
       *
       * @type {?HTMLElement}
       */
      this._options = null

      /**
       * The option represented the element over which the user started to drag the mouse cursor to perform a
       * multiple-items selection.
       *
       * This field is used only for multi-selects.
       *
       * @type {?HTMLOptionElement}
       */
      this._dragSelectionStartOption = null

      /**
       * Flag signalling whether the element is currently mounted.
       *
       * @type {boolean}
       */
      this._mounted = false

      /**
       * The DOM mutation observer used to observe modifications to the associated options.
       *
       * @type {MutationObserver}
       */
      this._observer = new MutationObserver(rootElement.updateUi)

      /**
       * The previously used indexes when the <code>scrollToSelection</code> function has been called for this
       * instance.
       *
       * @type {{start: number, end: number}}
       * @see scrollToSelection
       */
      this._lastSelectionIndexes = {
        start: -1,
        end: -1,
      }

      /**
       * The indexes of options that are to be selected as well while performing an additive multi-select (dragging the
       * mouse over a multi-select while holding the Ctrl key).
       *
       * @type {Array<number>}
       */
      this._additionalSelectedIndexes = []

      /**
       * Set to <code>true</code> if the user started to drag the mouse pointer over an already selected item while
       * holding the Ctrl key. The items selected by the user using the current action will be deselected.
       *
       * @type {boolean}
       */
      this._invertSelection = false

      /**
       * The index of the option at which the multi-items selection started the last time.
       *
       * @type {number}
       */
      this._previousSelectionStartIndex = -1

      this._onItemHovered = event => onItemHovered(this, event.target)
      this._onItemClicked = event => onItemClicked(this, event.target)
      this._onItemSelectionStart = event => onItemSelectionStart(this, event.target, event)

      this._onSelectionEnd = () => {
        this._dragSelectionStartOption = null
        this._additionalSelectedIndexes = []
      }

      this._onSelectionChange = () => {
        this._root.removeAttribute('data-szn-select--options--highlighting')
        updateUi(this)
      }

      SznElements.injectStyles(CSS_STYLES, 'szn-options')
    }

    onMount() {
      this._mounted = true
      addEventListeners(this)
      updateUi(this)
      registerOptionsObserver(this)
      if (this._options) {
        scrollToSelection(this, this._options.selectedIndex, this._options.selectedIndex)
      }
    }

    onUnmount() {
      removeEventListeners(this)
      this._root.removeAttribute('data-szn-select--options--highlighting')
      this._mounted = false
      this._observer.disconnect()
    }

    /**
     * Sets the element containing the options to display in this szn-options element.
     *
     * @param {HTMLElement} options The element containing the options to display.
     */
    setOptions(options) {
      if (options === this._options) {
        return
      }

      if (this._options) {
        removeEventListeners(this)
        this._observer.disconnect()
      }

      this._options = options
      addEventListeners(this)
      updateUi(this)
      registerOptionsObserver(this)
      const selectedIndex = typeof options.selectedIndex === 'number' ? options.selectedIndex : -1
      this._previousSelectionStartIndex = selectedIndex
      if (this._mounted) {
        scrollToSelection(this, selectedIndex, selectedIndex)
      }
    }
  }

  /**
   * Registers the provided szn-options element's DOM mutation observer to observe the related options for changes.
   *
   * @param {SznElements.SznOptions} instance The szn-options element instance.
   */
  function registerOptionsObserver(instance) {
    if (!instance._mounted || !instance._options) {
      return
    }

    instance._observer.observe(instance._options, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true,
      attributeFilter: ['disabled', 'label', 'selected', 'title', 'multiple'],
    })
  }

  /**
   * Registers event listeners that the provided szn-options instance requires to function correctly.
   *
   * The function has no effect if the provided szn-options element is not mounted into the document or has not been
   * provided with its options yet.
   *
   * @param {SznElements.SznOptions} instance The szn-options element instance.
   */
  function addEventListeners(instance) {
    if (!instance._mounted || !instance._options) {
      return
    }

    instance._options.addEventListener('change', instance._onSelectionChange)
    instance._root.addEventListener('mouseover', instance._onItemHovered)
    instance._root.addEventListener('mousedown', instance._onItemSelectionStart)
    instance._root.addEventListener('mouseup', instance._onItemClicked)
    addEventListener('mouseup', instance._onSelectionEnd)
  }

  /**
   * Deregisters all event listeners used by the provided szn-options element.
   *
   * @param {SznElements.SznOptions} instance The szn-options element instance.
   */
  function removeEventListeners(instance) {
    if (instance._options) {
      instance._options.removeEventListener('change', instance._onSelectionChange)
    }
    instance._root.removeEventListener('mouseover', instance._onItemHovered)
    instance._root.removeEventListener('mousedown', instance._onItemSelectionStart)
    instance._root.removeEventListener('mouseup', instance._onItemClicked)
    removeEventListener('mouseup', instance._onSelectionEnd)
  }

  /**
   * Handles the user moving the mouse pointer over an option in the szn-options element's UI. The function updates the
   * current multiple-items selection if the element represents a multi-select, or updates the currently highlighted
   * item in the UI of a single-select.
   *
   * @param {SznElements.SznOptions} instance The szn-options element instance.
   * @param {Element} itemUi The element which's area the mouse pointer entered.
   */
  function onItemHovered(instance, itemUi) {
    if (instance._options.disabled || !isEnabledOptionUi(itemUi)) {
      return
    }

    if (instance._options.multiple) {
      if (instance._dragSelectionStartOption) {
        updateMultiSelection(instance, itemUi)
      }
      return
    }

    instance._root.setAttribute('data-szn-select--options--highlighting', '')
    const previouslyHighlighted = instance._root.querySelector('[data-szn-select--options--highlighted]')
    if (previouslyHighlighted) {
      previouslyHighlighted.removeAttribute('data-szn-select--options--highlighted')
    }
    itemUi.setAttribute('data-szn-select--options--highlighted', '')
  }

  /**
   * Handles the user releasing the primary mouse button over an element representing an item.
   *
   * The function ends multiple-items selection for multi-selects, ends options highlighting and marks the the selected
   * option for single-selects.
   *
   * @param {SznElements.SznOptions} instance The szn-options element instance.
   * @param {Element} itemUi The element at which the user released the primary mouse button.
   */
  function onItemClicked(instance, itemUi) {
    if (instance._dragSelectionStartOption) { // multi-select
      instance._dragSelectionStartOption = null
      return
    }

    if (instance._options.disabled || !isEnabledOptionUi(itemUi)) {
      return
    }

    instance._root.removeAttribute('data-szn-select--options--highlighting')
    instance._options.selectedIndex = itemUi._option.index
    instance._options.dispatchEvent(new CustomEvent('change', {bubbles: true, cancelable: true}))
  }

  /**
   * Handles start of the user dragging the mouse pointer over the UI of a multi-selection szn-options element. The
   * function marks the starting item.
   *
   * The function marks the starting item used previously as the current starting item if the Shift key is pressed. The
   * function marks the indexes of the currently selected items if the Ctrl key is pressed and the Shift key is not.
   * Also, if the Ctrl key pressed, the Shift key is not, and the user starts at an already selected item, the function
   * will mark this as inverted selection.
   *
   * The function has no effect for single-selects.
   *
   * @param {SznElements.SznOptions} instance The szn-options element instance.
   * @param {Element} itemUi The element at which the user pressed the primary mouse button down.
   * @param {MouseEvent} event The mouse event representing the user's action.
   */
  function onItemSelectionStart(instance, itemUi, event) {
    if (instance._options.disabled || !instance._options.multiple || !isEnabledOptionUi(itemUi)) {
      return
    }

    const options = instance._options.options
    if (event.shiftKey && instance._previousSelectionStartIndex > -1) {
      instance._dragSelectionStartOption = options.item(instance._previousSelectionStartIndex)
    } else {
      if (event.ctrlKey) {
        instance._additionalSelectedIndexes = []
        for (let i = 0, length = options.length; i < length; i++) {
          if (options.item(i).selected) {
            instance._additionalSelectedIndexes.push(i)
          }
        }
        instance._invertSelection = itemUi._option.selected
      } else {
        instance._invertSelection = false
      }
      instance._dragSelectionStartOption = itemUi._option
    }
    instance._previousSelectionStartIndex = instance._dragSelectionStartOption.index
    updateMultiSelection(instance, itemUi)
  }

  /**
   * Scrolls, only if necessary, the UI of the provided szn-options element to make the last selected option visible.
   * Which option is the last selected one is determined by comparing the provided index with the indexes passed to the
   * previous call of this function.
   *
   * @param {SznElements.SznOptions} instance The szn-options element instance.
   * @param {number} selectionStartIndex The index of the first selected option. The index must be a non-negative
   *        integer and cannot be greater that the total number of options; or set to <code>-1</code> if there is no
   *        option currently selected.
   * @param {number} selectionEndIndex The index of the last selected option. The index must be a non-negative integer,
   *        cannot be greater than the total number of options and must not be lower than the
   *        <code>selectionStartIndex</code>; or set to <code>-1</code> if there is no option currently selected.
   */
  function scrollToSelection(instance, selectionStartIndex, selectionEndIndex) {
    const lastSelectionIndexes = instance._lastSelectionIndexes
    if (
      selectionStartIndex !== -1 &&
      (selectionStartIndex !== lastSelectionIndexes.start || selectionEndIndex !== lastSelectionIndexes.end)
    ) {
      const changedIndex = selectionStartIndex !== lastSelectionIndexes.start ? selectionStartIndex : selectionEndIndex
      scrollToOption(instance, changedIndex)
    }

    lastSelectionIndexes.start = selectionStartIndex
    lastSelectionIndexes.end = selectionEndIndex
  }

  /**
   * Scrolls, only if necessary, the UI of the provided szn-options element to make the option at the specified index
   * fully visible.
   *
   * @param {SznElements.SznOptions} instance The szn-options element instance.
   * @param {number} optionIndex The index of the option to select. The index must be a non-negative integer and cannot
   *        be greater than the total number of options.
   */
  function scrollToOption(instance, optionIndex) {
    const ui = instance._root
    if (ui.clientHeight >= ui.scrollHeight) {
      return
    }

    const uiBounds = ui.getBoundingClientRect()
    const options = instance._root.querySelectorAll('[data-szn-select--options--option]')
    const optionBounds = options[optionIndex].getBoundingClientRect()
    if (optionBounds.top >= uiBounds.top && optionBounds.bottom <= uiBounds.bottom) {
      return
    }

    const delta = optionBounds.top < uiBounds.top ?
      optionBounds.top - uiBounds.top
      :
      optionBounds.bottom - uiBounds.bottom
    ui.scrollTop += delta
  }

  /**
   * Updates the multiple-items selection. This function is meant to be used with multi-selects when the user is
   * selecting multiple items by dragging the mouse pointer over them.
   *
   * Any item which's index is in the provided instance's list of additionally selected items will be marked as
   * selected as well.
   *
   * @param {SznElements.SznOptions} instance The szn-options element instance.
   * @param {Element} lastHoveredItem The element representing the UI of the last option the user has hovered using
   *        their mouse pointer.
   */
  function updateMultiSelection(instance, lastHoveredItem) {
    const startIndex = instance._dragSelectionStartOption.index
    const lastIndex = lastHoveredItem._option.index
    const minIndex = Math.min(startIndex, lastIndex)
    const maxIndex = Math.max(startIndex, lastIndex)
    const options = instance._options.options
    const additionalIndexes = instance._additionalSelectedIndexes

    for (let i = 0, length = options.length; i < length; i++) {
      const option = options.item(i)
      if (isOptionEnabled(option)) {
        let isOptionSelected = additionalIndexes.indexOf(i) > -1
        if (i >= minIndex && i <= maxIndex) {
          isOptionSelected = !instance._invertSelection
        }
        option.selected = isOptionSelected
      }
    }

    instance._options.dispatchEvent(new CustomEvent('change', {bubbles: true, cancelable: true}))
  }

  /**
   * Tests whether the provided elements represents the UI of an enabled option.
   *
   * @param {Element} optionUi The UI element to test.
   * @return {boolean} <code>true</code> iff the option is enabled and can be interacted with.
   * @see isOptionEnabled
   */
  function isEnabledOptionUi(optionUi) {
    return (
      optionUi.hasAttribute('data-szn-select--options--option') &&
      isOptionEnabled(optionUi._option)
    )
  }

  /**
   * Tests whether the provided option is enabled - it is not disabled nor it is a child of a disabled options group.
   * The provided option cannot be an orphan.
   *
   * @param {HTMLOptionElement} option The option element to test.
   * @return {boolean} <code>true</code> iff the option is enabled and can be interacted with.
   */
  function isOptionEnabled(option) {
    return (
      !option.disabled &&
      !option.parentNode.disabled
    )
  }

  /**
   * Updates the UI, if the provided szn-options element has already been provided with the options to display. The
   * functions synchronizes the displayed UI to reflect the available options, their status, and scrolls to the last
   * selected option if it is not visible.
   *
   * @param {SznElements.SznOptions} instance The szn-options element's instance.
   */
  function updateUi(instance) {
    if (!instance._options) {
      return
    }

    if (instance._options.disabled) {
      instance._root.setAttribute('disabled', '')
    } else {
      instance._root.removeAttribute('disabled')
    }
    if (instance._options.multiple) {
      instance._root.setAttribute('data-szn-select--options--multiple', '')
    } else {
      instance._root.removeAttribute('data-szn-select--options--multiple')
    }

    updateGroupUi(instance._root, instance._options)
    if (instance._mounted) {
      const options = instance._options.options
      let lastSelectedIndex = -1
      for (let i = options.length - 1; i >= 0; i--) {
        if (options.item(i).selected) {
          lastSelectedIndex = i
          break
        }
      }
      scrollToSelection(instance, instance._options.selectedIndex, lastSelectedIndex)
    }
  }

  /**
   * Updates the contents of the provided UI to reflect the options in the provided options container. The function
   * removes removed options from the UI, updates the existing and adds the missing ones.
   *
   * @param {Element} uiContainer The element containing the constructed UI reflecting the provided options.
   * @param {HTMLElement} optionsGroup The element containing the options to be reflected in the UI.
   */
  function updateGroupUi(uiContainer, optionsGroup) {
    removeRemovedItems(uiContainer, optionsGroup)
    updateExistingItems(uiContainer)
    addMissingItems(uiContainer, optionsGroup)
  }

  /**
   * Removes UI items from the UI that have been representing the options and option groups that have been removed from
   * the provided container of options.
   *
   * @param {Element} uiContainer The element containing the elements reflecting the provided options and providing the
   *        UI for the options.
   * @param {HTMLElement} optionsGroup The element containing the options for which this szn-options element is
   *        providing the UI.
   */
  function removeRemovedItems(uiContainer, optionsGroup) {
    const options = Array.prototype.slice.call(optionsGroup.children)
    let currentItemUi = uiContainer.firstElementChild
    while (currentItemUi) {
      if (options.indexOf(currentItemUi._option) > -1) {
        currentItemUi = currentItemUi.nextElementSibling
        continue
      }

      const itemToRemove = currentItemUi
      currentItemUi = currentItemUi.nextElementSibling
      uiContainer.removeChild(itemToRemove)
    }
  }

  /**
   * Updates all items in the provided UI container to reflect the current state of their associated options.
   *
   * @param {Element} groupUi The element containing the elements representing the UIs of the options.
   */
  function updateExistingItems(groupUi) {
    let itemUi = groupUi.firstElementChild
    while (itemUi) {
      updateItem(itemUi)
      itemUi = itemUi.nextElementSibling
    }
  }

  /**
   * Updates the UI item to reflect the current state of its associated <code>option</code>/<code>optgroup</code>
   * element.
   *
   * If the element represents an option group (<code>optgroup</code>), the children options will be updated as well.
   *
   * @param {HTMLElement} itemUi The element representing the UI of an <code>option</code>/<code>optgroup</code>
   *        element.
   */
  function updateItem(itemUi) {
    const option = itemUi._option
    if (option.disabled) {
      itemUi.setAttribute('disabled', '')
    } else {
      itemUi.removeAttribute('disabled')
    }

    if (option.tagName === 'OPTGROUP') {
      updateGroupUi(itemUi, option)
      itemUi.setAttribute('data-szn-select--options--optgroup-label', option.label)
      return
    }

    itemUi.innerText = option.text
    if (option.title) {
      itemUi.setAttribute('title', option.title)
    } else {
      itemUi.removeAttribute('title')
    }

    if (option.selected) {
      itemUi.setAttribute('data-szn-select--options--selected', '')
    } else {
      itemUi.removeAttribute('data-szn-select--options--selected')
    }
  }

  /**
   * Adds the options present in the options container missing the UI into the UI, while preserving the order of the
   * options. Option groups are added recursively.
   *
   * @param {Element} groupUi The element containing the UIs of the options. The new options will be inserted into this
   *        element's children.
   * @param {HTMLElement} options An element containing the <code>option</code> and <code>optgroup</code> elements that
   *        the UI reflects.
   */
  function addMissingItems(groupUi, options) {
    let nextItemUi = groupUi.firstElementChild
    let nextOption = options.firstElementChild
    while (nextOption) {
      if (!nextItemUi || nextItemUi._option !== nextOption) {
        const newItemUi = document.createElement('szn-')
        newItemUi._option = nextOption
        newItemUi.setAttribute(
          'data-szn-select--options--' + (nextOption.tagName === 'OPTGROUP' ? 'optgroup' : 'option'),
          '',
        )
        updateItem(newItemUi)
        groupUi.insertBefore(newItemUi, nextItemUi)
      } else {
        nextItemUi = nextItemUi && nextItemUi.nextElementSibling
      }

      nextOption = nextOption.nextElementSibling
    }
  }
})(self)
