/* global AccessibilityBroker */

class DisabledSelect extends AccessibilityBroker {
  // that's it, there is nothing to do, but wait for the select to be enabled and this a11y broker to be replaced
}
DisabledSelect.compatibilityTest = select => select.disabled
