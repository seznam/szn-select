# szn-select

[![npm](http://img.shields.io/npm/v/@jurca/szn-select.svg)](https://www.npmjs.com/package/@jurca/szn-select)
[![License](https://img.shields.io/npm/l/@jurca/szn-select.svg)](https://github.com/jurca/szn-select/blob/master/LICENSE)

Accessible HTML `<select>` element replacement with customizable UI. Based on
the patterns used by web components and easy to integrate with various
frameworks, e.g. React or Angular.

## Usage

As the [first rule of ARIA states](https://www.w3.org/TR/using-aria/#rule1):
use the native `<select>` element if possible. If you can get by with the
basic styling support the native `<select>` element has, please do not try to
replace it, your users will have much better experience (this is the way the
[Bootstrap](https://getbootstrap.com/docs/4.0/components/forms/#select-menu)
framework does it).

TODO: link to integration-ready bundles

### Usage on static or server-rendered websites

TODO

### Styling using CSS

The `<szn-select>` element's appearance can be configured using the following
CSS variables (AKA CSS custom properties, supported by all browsers except for
Internet Explorer):

```css
:root {
  /* variable: default value */
  --szn-select--border-width: 1px;
  --szn-select--border-color: #cccccc;
  --szn-select--active-border-color: #7dbfff;
  --szn-select--border-radius: 4px;
  --szn-select--min-width: 109px;
  --szn-select--height: 2em;
  --szn-select--height-px: 32px;

  --szn-select--option-indent: 12px;
  --szn-select--option-padding: 5px 5px 5px var(--szn-select--option-indent);
  --szn-select--selected-option-background: #eeeeee;

  --szn-select--button-padding: 0 5px 0 var(--szn-select--option-indent);
  --szn-select--state-arrow-width: var(--szn-select--height);

  --szn-select--state-arrow-closed: "▼";
  --szn-select--state-arrow-opened: "▲";
  --szn-select--text-color: #000000;
  --szn-select--disabled-text-color: #cccccc;
  --szn-select--background: #ffffff;

  --szn-select--active-box-shadow: 0 0 3px rgba(0, 132, 255, .4);
}
``` 

To style the dimensions of the dropdown for single-selects, use the following
CSS selector:

```css
[data-szn-select--ui--dropdown] {
    /* overriding the dropdown's width to 240px for the default font size of 16px */
    width: 15rem;
}
```

Note that the styles used by the `<szn-select>` are applied using `<styles>`
elements appended the document's `<head>`. You will have to use selectors with
higher specificity or use `!important` to override the default styles.

## Supported browsers

* Chrome/Chromium
* Firefox
* Opera
* Safari
* Edge
* Internet Explorer 11 (optional polyfills for IE8-10 are in development)

## Current state of compatibility with assistive technologies

The current level of compatibility with assistive technologies is represented by the table below:

&nbsp;                                                                                       | Chrome | Firefox | Opera | Safari | Edge    | IE
---------------------------------------------------------------------------------------------|--------|---------|-------|--------|---------|---
keyboard                                                                                     | great  | great   | great | great  | great   | great
[NVDA](https://www.nvaccess.org/)                                                            | great  | great   | great | n/a    | great   | good
[Jaws](http://www.freedomscientific.com/Products/Blindness/JAWS)                             | good   | n/a     | good  | n/a    | n/a     | good
[VoiceOver](https://www.apple.com/accessibility/mac/vision/)                                 | good   | n/a     | good  | good   | n/a     | n/a
[Talkback](https://play.google.com/store/apps/details?id=com.google.android.marvin.talkback) | good   | good    | good  | n/a    | unknown | n/a
[VoiceOver iOS](https://www.apple.com/accessibility/iphone/vision/)                          | good   | good    | n/a   | good   | unknown | n/a

### Compatibility levels explained

compatibility | explanation
--------------|------------
great         | Usability on par with the native `<select>` element
good          | Minor issues (e.g. using the native dropdown on mobile platform) that have minimal impact on UX
passable      | The assistive technology might not recognize the `szn-select` as a combobox, does not announce the value automatically, or is sometimes silent, but still usable
n/a           | The combination is not compatible due to platform restrictions (e.g. NVDA is Windows-only) or the assistive technology was not compatible with the browser at the moment of testing (e.g. Jaws+Edge, this may change in the future)
unknown       | We were unable to access, download, install or use the web browser

### Other tested screen readers

This list will contain some of the assistive technologies that are still being
updated and used, but have only marginal market shares. The list is not
exhaustive since some of these solutions are pricey and testing with assistive
technologies takes a lot of time since it has to be done by hand.

&nbsp; | Chrome | Firefox | Opera | Safari | Edge | IE
-------|--------|---------|-------|--------|------|---
[Microsoft Narrator](https://support.microsoft.com/ha-latn-ng/help/22798/windows-10-narrator-get-started) | n/a | good | n/a | n/a | great | great
