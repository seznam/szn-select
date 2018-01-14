class AccessibilityBroker {
  constructor(select, ui, sznSelect) {
    this.select = select
    this.sznSelect = sznSelect
    this.ui = ui
  }

  setOpen(isOpen) {
    this.sznSelect.isOpen = isOpen
    this.ui.setOpen(isOpen)
  }

  onMount() {}

  onUnmount() {}

  onUiClicked(event) {}

  onChange() {}
}
