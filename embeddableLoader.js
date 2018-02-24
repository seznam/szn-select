'use strict'

const makeSznSelectBundleScript = (global => { // eslint-disable-line no-unused-vars
  const BUNDLES = {
    ELEMENT_ES2016: 'es2016',
    ELEMENT_ES3: 'es3',
    ELEMENTS_ES2016: 'bundle-elements.es2016',
    ELEMENTS_ES3: 'bundle-elements.es3',
    ALL_CE: 'bundle-full.ce',
    ALL_ES2016: 'bundle-full.es2016',
    ALL_ES3: 'bundle-full.es3',
  }
  const DEFAULT_PACKAGE_URL = 'https://unpkg.com/@jurca/szn-select@<VERSION>/'

  function makeBundleLoadScript(urlsConfiguration, useAsyncLoading) {
    if (typeof self === 'undefined') {
      throw new Error('The loader can only be used at the client-side')
    }

    if (global.SznElements && global.SznElements['szn-tethered'] && global.SznElements['szn-select']) {
      return null // already loaded
    }

    const bundleUrl = getSznSelectBundleUrl(urlsConfiguration)

    const script = document.createElement('script')
    script.async = useAsyncLoading
    script.defer = useAsyncLoading
    script.src = bundleUrl

    return script
  }

  function getSznSelectBundleUrl(urlsConfiguration) {
    // Firefox 52-based browsers (e.g. Palemoon) have faulty support for for-scoped const variable declarations
    const firefoxVersionMatch = navigator.userAgent.match(/ Firefox\/(\d+)/)
    const firefoxVersion = firefoxVersionMatch && parseInt(firefoxVersionMatch[1], 10)
    const supportsForConst = !firefoxVersion || firefoxVersion > 52
    const es2016Supported = supportsForConst && global.Proxy && Array.prototype.includes

    const runtimeLoaded = global.SznElements && global.SznElements.init && global.SznElements.injectStyles
    const dependenciesLoaded = runtimeLoaded && global.SznElements['szn-tethered']
    const bundleToLoad = dependenciesLoaded ?
      (es2016Supported ?
        BUNDLES.ELEMENT_ES2016
        :
        BUNDLES.ELEMENT_ES3
      )
      :
      (runtimeLoaded ?
        (es2016Supported ?
          BUNDLES.ELEMENTS_ES2016
          :
          BUNDLES.ELEMENTS_ES3
        )
        :
        (global.customElements ?
          BUNDLES.ALL_CE
          :
          (es2016Supported ?
            BUNDLES.ALL_ES2016
            :
            BUNDLES.ALL_ES3
          )
        )
      )

    return (
      urlsConfiguration[bundleToLoad] ||
      (() => {
        const baseUrl = urlsConfiguration.package || DEFAULT_PACKAGE_URL
        return /\/$/.test(baseUrl) ? baseUrl : `${baseUrl}/`
      })() + `szn-select.${bundleToLoad}.min.js`
    )
  }

  return makeBundleLoadScript
})(self)
