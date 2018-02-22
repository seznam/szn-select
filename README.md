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

1. Include the CSS for fallback styling of the native `<select>` element in
case JavaScript is disabled or the user is using an obsolete browser:

```html
<link rel="stylesheet" href="https://unpkg.com/@jurca/szn-select@0.0.9/szn-select-nojs.css" media="all">
```

This step is optional, but results in slightly better UX if the JavaScript
fails or is disabled.

2. It is recommended to load the `<szn-select>` element using the loader:

```html
<script src="loader.js"></script>
```

You may use the `async` and `defer` attributes if you want the loader to be
loaded asynchronously. You may also bundle the loader with other JavaScript
files.

The loader automatically chooses the bundle that has the best compatibility
with the current browser. By default the loader loads the implementation from
`unpkg.com`. This may be overridden by adding the following attributes to the
loader's `<script>` element:

* `data-szn-select--loader-urls--package` - specifies the base URL where all
  the package's files are available. This can be overridden for specific cases
  using the options listed below.
* `data-szn-select--loader-urls--element-es3` - overrides the URL for loading
  the ES3-compatible implementation of the `szn-select` element
* `data-szn-select--loader-urls--element-es2016` - overrides the URL for
  loading the ES2016-compatible implementation of the `szn-select` element
* `data-szn-select--loader-urls--bundle-es3` - overrides the URL for loading
  the ES3-compatible bundle of the `szn-select` and `szn-tethered` elements
  and the szn-elements runtime.
* `data-szn-select--loader-urls--bundle-es2016` - overrides the URL for
  loading the ES2016-compatible implementation of the `szn-select` and
  `szn-tethered` elements and the szn-elements runtime.
* `data-szn-select--loader-urls--bundle-ce` - overrides the URL for loading
  the ES2016-compatible implementation that relies on the
  [custom elements](https://mdn.io/Window/customElements) API. The bundle
  includes the `szn-select` and `szn-tethered` elements and the szn-elements
  runtime (only the parts used if custom elements are supported natively).

If you do not want to use the loader for some reason, just include the
ES3-compatible bundle:

```html
<script src="https://unpkg.com/@jurca/szn-select@0.0.9/szn-select.bundle.es3.min.js"></script>
```

3. You may turn any ordinary `<select>` into a `<szn-select>` by wrapping it
and providing a UI container:

```html
<label for="my-select">Choose one:</label>
<szn-select data-szn-select--standalone>
    <select name="chosenOption" id="my-select">
        <option value="1" title="this is the first option">first</option>
        <optgroup label="other options">
            <option value="2" selected>default option</option>
            <option value="3" disabled>you cannot choose this option</option>
        </optgroup>
        <optgroup label="you cannot choose these options" disabled>
            <option value="4">unavailable option</option>
            <option value="4">yes, multiple options may have the same value</option>
        </optgroup>
    </select>
    <span data-szn-select--ui></span>
</szn-select>
```

The `data-szn-select--standalone` attribute tells the `<szn-select>` that is
is **not** being used on a page that uses a DOM-managing library such as
React, Vue or Angular.

The `<szn-select>` element works with multi-selects too:

```html
<szn-select data-szn-select--standalone>
    <select name="choices" multiple aria-label="choose multiple">
        <option value="1" selected>first</option>
        <optgroup label="other options">
            <!-- option groups are supported as well -->
            <option value="2" disabled>second</option>
            <option value="3" selected>third</option>
        </optgroup>
    </select>
    <span data-szn-select--ui></span>
</szn-select>
```

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
