/* global makeSznSelectBundleScript */

'use strict'
;(() => {
  const LOADER_ATTRIBUTE_PREFIX = 'data-szn-select--loader-urls--'
  const SUPPORTED_LOADER_ATTRIBUTES = [
    'package',
    'es2016',
    'es3',
    'bundle-elements-es2016',
    'bundle-elements-es3',
    'bundle-full-ce',
    'bundle-full-es2016',
    'bundle-full-es3',
  ]

  // %{EMBEDDABLE_LOADER}%

  const loaderScript = getLoaderScript()
  const urlsConfiguration = loadUrlsConfig(loaderScript)
  const script = makeSznSelectBundleScript(urlsConfiguration, loaderScript.async)
  if (!script) {
    return
  }

  // TODO: do not use document.write if the hosts do not match: https://www.chromestatus.com/feature/5718547946799104
  if (['interactive', 'complete'].indexOf(document.readyState) === -1) {
    document.write(script.outerHTML)
  } else {
    (document.head || document.querySelector('head')).appendChild(script) // document.head is supported since IE9
  }

  function loadUrlsConfig(loaderScriptElement) {
    const urls = {}

    const attributes = loaderScriptElement.attributes
    for (let i = attributes.length - 1; i >= 0; i--) {
      const attribute = attributes[i]
      if (!/^data-szn-select--loader-urls--/.test(attribute.name)) {
        continue
      }

      const optionNameParts = attribute.name.substring(30).split('-')
      const optionName = optionNameParts.length > 1 ?
        `${optionNameParts.slice(0, -1).join('-')}.${optionNameParts[optionNameParts.length - 1]}`
        :
        optionNameParts[0]

      urls[optionName] = attribute.value
    }

    return urls
  }

  function getLoaderScript() {
    return (
      document.currentScript ||
      document.querySelector(
        `[${LOADER_ATTRIBUTE_PREFIX}${SUPPORTED_LOADER_ATTRIBUTES.join(`],[${LOADER_ATTRIBUTE_PREFIX}`)}]`,
      ) ||
      {getAttribute: () => null} // there is no overriding configuration
    )
  }
})()
