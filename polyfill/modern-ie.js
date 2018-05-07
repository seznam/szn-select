// DocumentFragment.firstElementChild, DocumentFragment.lastElementChild
(function() { // IE 11 and older, Edge 16 and older
  var fragment = document.createDocumentFragment()
  fragment.appendChild(document.createElement('div'))
  if (!fragment.firstElementChild) { // Edge 16 and older, IE 11 and older
    // IE 8 does not have the global DocumentFragment class, but neither does it support native <template> element, so
    // this is a sufficient patch
    var nativeFragmentFactory = document.createDocumentFragment
    document.createDocumentFragment = function() {
      var fragment = nativeFragmentFactory.apply(document, arguments)
      Object.defineProperty(fragment, 'firstElementChild', {
        get: function() {
          return getFirstElement(fragment)
        }
      })
      Object.defineProperty(fragment, 'lastElementChild', {
        get: function() {
          return getLastElement(fragment)
        }
      })
      return fragment
    }

    if (self.DocumentFragment) { // IE 9+, Edge
      Object.defineProperty(DocumentFragment.prototype, 'firstElementChild', {
        enumerable: true,
        configurable: true,
        get: function() {
          return getFirstElement(this)
        }
      })
      Object.defineProperty(DocumentFragment.prototype, 'lastElementChild', {
        enumerable: true,
        configurable: true,
        get: function() {
          return getLastElement(this)
        }
      })
    }

    function getFirstElement(container) {
      var node = container.firstChild
      while (node && node.nodeType !== Node.ELEMENT_NODE) {
        node = node.nextSibling
      }
      return node
    }

    function getLastElement(container) {
      var node = container.lastChild
      while (node && node.nodeType !== Node.ELEMENT_NODE) {
        node = node.previousSibling
      }
      return node
    }
  }
})()

// <template> element
if (!('content' in document.createElement('template'))) { // Edge 12, IE 11 and older
  (function() {
    var nativeElementFactory = document.createElement
    document.createElement = function () {
      var element = nativeElementFactory.apply(document, arguments)
      if (element.nodeName === 'TEMPLATE') {
        initTemplateElement(element)
      }
      return element
    }

    var templates = Array.prototype.slice.call(document.querySelectorAll('template'))
    for (var i = templates.length - 1; i >= 0; i--) {
      initTemplateElement(templates[i])
    }

    var style = document.createElement('style')
    style.setAttribute('type', 'text/css')
    try {
      style.innerHTML = 'template { display: none; }'
    } catch (_) {
      style.styleSheet.cssText = 'template { display: none; }'
    }
    document.head.insertBefore(style, document.head.firstChild)

    function initTemplateElement(template) {
      var content = document.createDocumentFragment()
      template.content = content
      while (template.firstChild) {
        content.appendChild(template.firstChild)
      }

      Object.defineProperty(template, 'innerHTML', {
        get: function() {
          var html = ''
          var node = content.firstChild
          while (node) {
            // this is not 100% accurate, but it's close enough for the most common use cases
            html += node.nodeType === Node.ELEMENT_NODE ? node.outerHTML : node.nodeValue
          }
          return html
        },
        set: function(html) {
          while (content.firstChild) {
            content.removeChild(content.firstChild)
          }

          var tempContainer = document.createElement('div')
          tempContainer.innerHTML = html
          while (tempContainer.firstChild) {
            content.appendChild(tempContainer.firstChild)
          }
        }
      })
    }
  })()
}

// CustomEvent - provided by https://github.com/krambuhl/custom-event-polyfill/blob/master/custom-event-polyfill.js
(function() {
  // Polyfill for creating CustomEvents on IE9/10/11

  // code pulled from:
  // https://github.com/d4tocchini/customevent-polyfill
  // https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent#Polyfill

  try {
    var ce = new window.CustomEvent('test')
    ce.preventDefault()
    if (ce.defaultPrevented !== true) {
      // IE has problems with .preventDefault() on custom events
      // http://stackoverflow.com/questions/23349191
      throw new Error('Could not prevent default')
    }
  } catch (e) {
    var CustomEvent = function(event, params) {
      var evt, origPrevent
      params = params || {
        bubbles: false,
        cancelable: false,
        detail: undefined
      }

      evt = document.createEvent('CustomEvent')
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      origPrevent = evt.preventDefault
      evt.preventDefault = function() {
        origPrevent.call(this)
        try {
          Object.defineProperty(this, 'defaultPrevented', {
            get: function() {
              return true
            }
          })
        } catch (_) {
          this.defaultPrevented = true
        }
      }
      return evt
    }

    CustomEvent.prototype = window.Event.prototype
    window.CustomEvent = CustomEvent // expose definition to window
  }
})()
