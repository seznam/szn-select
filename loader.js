/* global makeSznSelectBundleScript */

'use strict'
;(() => {
  // %{EMBEDDABLE_LOADER}%

  const script = makeSznSelectBundleScript()
  if (!script) {
    return
  }

  // TODO: do not use document.write if the hosts do not match: https://www.chromestatus.com/feature/5718547946799104
  if (['interactive', 'complete'].indexOf(document.readyState) === -1) {
    document.write(script.outerHTML)
  } else {
    (document.head || document.querySelector('head')).appendChild(script) // document.head is supported since IE9
  }
})()
