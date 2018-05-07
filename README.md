# szn-select

[![npm](http://img.shields.io/npm/v/@jurca/szn-select.svg)](https://www.npmjs.com/package/@jurca/szn-select)
[![License](https://img.shields.io/npm/l/@jurca/szn-select.svg)](https://github.com/jurca/szn-select/blob/master/LICENSE)

Accessible HTML `<select>` element replacement with customizable UI. Based on
the patterns used by web components and easy to integrate with various
frameworks, e.g. React or Angular.

You can [check out the demo](https://jurca.github.io/szn-select/) or take a
peek at a [fiddle](https://jsfiddle.net/Lnv95bce/17/).

## Usage

As the [first rule of ARIA states](https://www.w3.org/TR/using-aria/#rule1):
use the native `<select>` element if possible. If you can get by with the
basic styling support the native `<select>` element has, please do not try to
replace it, your users will have much better experience (this is the way the
[Bootstrap](https://getbootstrap.com/docs/4.0/components/forms/#select-menu)
framework does it).

If you absolutely do need a fully styleable `<select>`, you may choose from
the following integration-ready bundles based on the front-end technology you
use:

* [szn-select for react](https://www.npmjs.com/package/@jurca/szn-select-react)
  ([GitHub](https://github.com/jurca/szn-select-react))
* [szn-select for vue](https://www.npmjs.com/package/@jurca/szn-select-vue)
  ([GitHub](https://github.com/jurca/szn-select-vue))
* jQuery / Prototype / MooTools / Dojo Toolkit / script.aculo.us / JAK: use
  the deployment steps for static sites (see bellow)

More ready-to-use bundles are coming soon.

### Usage on static or server-rendered websites

1. Include the CSS for fallback styling of the native `<select>` element in
case JavaScript is disabled or the user is using an obsolete browser:

```html
<link rel="stylesheet" href="https://unpkg.com/@jurca/szn-select@<VERSION>/szn-select-nojs.css">
```

This step is optional, but results in slightly better UX if the JavaScript
fails or is disabled.

2. It is recommended to load the `<szn-select>` element using the loader:

```html
<script src="https://unpkg.com/@jurca/szn-select@<VERSION>/loader.min.js"></script>
```

It is recommended to use a
[semver version range](https://docs.npmjs.com/misc/semver#caret-ranges-123-025-004)
when using unpkg or a similar JS CDN, such as `1.x` to automatically receive
the latest compatible version with the most recent bugfixes and compatibility
updates.

You may use the `async` and `defer` attributes if you want the loader to be
loaded asynchronously. You may also bundle the loader with other JavaScript
files.

The loader automatically chooses the bundle that has the best compatibility
with the current browser (modern browsers use smaller bundles). By default the
loader loads the implementation from `unpkg.com`. This may be overridden by
adding the following attributes to the `<script>` element used include the
loader (as stated above, this may be a bundle):

* `data-szn-select--loader-urls--package` - specifies the base URL where all
  the package's files are available. This can be overridden for specific cases
  using the options listed below.
* `data-szn-select--loader-urls--es3` - overrides the URL for loading the
  ES3-compatible implementation of the `szn-select` element.
* `data-szn-select--loader-urls--es2016` - overrides the URL for loading the
  ES2016-compatible implementation of the `szn-select` element.
* `data-szn-select--loader-urls--bundle-elements-es3` - overrides the URL for
  loading the ES3-compatible implementation of the `szn-select` and
  `szn-tethered` element.
* `data-szn-select--loader-urls--bundle-elements-es2016` - overrides the URL
  for loading the ES2016-compatible implementation of the `szn-select` and
  `szn-tethered` element.
* `data-szn-select--loader-urls--bundle-full-es3` - overrides the URL for loading
  the ES3-compatible bundle of the `szn-select` and `szn-tethered` elements
  and the szn-elements runtime.
* `data-szn-select--loader-urls--bundle-full-es2016` - overrides the URL for
  loading the ES2016-compatible implementation of the `szn-select` and
  `szn-tethered` elements and the szn-elements runtime.
* `data-szn-select--loader-urls--bundle-full-ce` - overrides the URL for loading
  the ES2016-compatible implementation that relies on the
  [custom elements](https://mdn.io/Window/customElements) API. The bundle
  includes the `szn-select` and `szn-tethered` elements and the szn-elements
  runtime (only the parts used if custom elements are supported natively).

If you do not want to use the loader for some reason, just include the
ES3-compatible bundle (or implement the bundle selection logic yourselves):

```html
<script src="https://unpkg.com/@jurca/szn-select@<VERSION>/szn-select.bundle.es3.min.js"></script>
```

Please note that using the loader has great advantages: the compatibility of
various assistive technologies may and does change over time and the loader
will attempt to load the latest backwards-compatible version for you to get
the best compatibility. It is also recommended to use a version range (e.g.
`1.x`) when loading the loader from unpkg.com to get the latest compatible
version of the loader itself.

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
* Internet Explorer 9 - 11 (optional polyfills for IE8 are in development)

### Suppport of Microsoft Edge 16 and older, Internet Explorer 11 and older

You will need to include polyfills to make `<szn-select>`` work in Internet
Explorer. Changes are, if you are already using babel/webpack in your project,
that you are already using the necessary polyfills. If, however, things do not
work in IE, please include the
[babel polyfill](https://babeljs.io/docs/usage/polyfill/) (or the
[core-js](https://github.com/zloirock/core-js) polyfill itself) by adding the
following code in the `<head>` element **before** including the
`<szn-select>` element's JavaScript:

```html
<script>
if (!window.WeakSet || !window.Proxy || !Array.prototype.includes) {
  document.write('<script src="https://unpkg.com/babel-polyfill@6.26.x/browser.js"><\/script>')
}
</script>
```

This will include the polyfill only if the browser needs, therefore the users
of modern browsers won't be slowed down by downloading more JavaScript that
they don't need anyway.

Next you will need to include the polyfill for missing DOM APIs for IE 11 and
Edge 12-16.

```html
<script>
if (!("firstElementChild" in document.createDocumentFragment())) {
  document.write('<script src="https://unpkg.com/@jurca/szn-select@<VERSION>/polyfill/modern-ie.min.js"><\/script>')
}
</script>
```

Note: It appears that MS Edge 17 will not need any of these polyfills.

### Support for IE 9 and 10

Internet Explorer 10 and older does not have support for the custom elements
nor the [MutationObserver](https://mdn.io/MutationObserver), however, versions
9 and 10 support the (deprecated)
[DOM mutation events](https://mdn.io/Mutation_events). This allows us to use
the following [polyfill](https://www.npmjs.com/package/mutation-observer) to
enable support for IE 9 and 10. Add the following code to the `<head>` element
**before** including any other polyfills:

```html
<script>
  if (!window.MutationObserver) {
    window.module = {} // required by the polyfill
    document.write('<script src="https://unpkg.com/mutation-observer@1.x/index.js"><\/script>')
  }
</script>
```

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
