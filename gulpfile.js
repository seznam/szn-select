'use strict'

const del = require('del')
const fs = require('fs')
const glob = require('glob')
const gulp = require('gulp')
const babel = require('gulp-babel')
const concat = require('gulp-concat')
const rename = require('gulp-rename')
const replace = require('gulp-replace')
const postCss = require('gulp-postcss')
const postCustomProperties = require('postcss-custom-properties')
const util = require('util')
const packageInfo = require('./package.json')

const compatibleVersionRange = `${packageInfo.version.split('.').shift()}.x`

async function injectCss(done) {
  await Promise.all([
    'szn-select',
    'szn-select--button',
    'szn-select--options',
    'szn-select--ui',
  ].map(elementName => processElement(elementName)))

  done()

  async function processElement(elementName) {
    const readFile = util.promisify(fs.readFile)
    const writeFile = util.promisify(fs.writeFile)

    const [css, es2016] = await Promise.all([
      readFile(`./dist/${elementName}.css`, 'utf-8'),
      readFile(`./${elementName}.js`, 'utf-8'),
    ])

    return writeFile(`./dist/${elementName}.js`, es2016.replace('%{CSS_STYLES}%', css), 'utf-8')
  }
}

function concatElements() {
  return gulp
    .src('./dist/*.js')
    .pipe(concat('szn-select.es2016.js'))
    .pipe(gulp.dest('./dist'))
}

async function injectA11yImplementations(done) {
  const readFile = util.promisify(fs.readFile)
  const writeFile = util.promisify(fs.writeFile)

  const baseClass = await readFile('./a11y/AccessibilityBroker.js', 'utf-8')
  const implementationSources = await util.promisify(glob)('./a11y/!(AccessibilityBroker).js')
  const implementations = await Promise.all(implementationSources.map(sourceFile => readFile(sourceFile, 'utf-8')))

  const selectSource = await readFile('./dist/szn-select.es2016.js', 'utf-8')
  const newSource = selectSource.replace('// %{A11Y_IMPLEMENTATIONS}%', [baseClass, ...implementations].join('\n'))

  await writeFile('./dist/szn-select.es2016.js', newSource, 'utf-8')

  done()
}

async function injectInitCode(done) {
  const readFile = util.promisify(fs.readFile)
  const writeFile = util.promisify(fs.writeFile)

  const source = await readFile('./dist/szn-select.es2016.js', 'utf-8')
  const patchedSource = `${source}\nif (SznElements.init) {\n  SznElements.init()\n}\n`
  await writeFile('./dist/szn-select.es2016.js', patchedSource, 'utf-8')

  done()
}

const compileJS = gulp.parallel(
  gulp.series(
    compileJSSelectES2016,
    compileJSSelectEs3,
  ),
  gulp.series(
    composeStandaloneLoader,
    gulp.parallel(
      compileJSLoader,
      compileJSEmbeddableLoader,
    ),
  ),
)

function compileJSSelectES2016() {
  return gulp
    .src('./dist/szn-select.es2016.js')
    .pipe(babel()) // strips trailing commas in function calls (ES2017) so the source becomes ES2016-compatible
    .pipe(gulp.dest('./dist'))
}

function compileJSSelectEs3() {
  return gulp
    .src('./dist/szn-select.es2016.js')
    .pipe(babel({
      presets: [['env', {
        targets: {
          browsers: ['ie 8'],
        },
      }]],
    }))
    .pipe(rename('szn-select.es3.js'))
    .pipe(gulp.dest('./dist'))
}

function compileJSEmbeddableLoader() {
  return gulp
    .src('./embeddableLoader.js')
    .pipe(babel({
      presets: [['env', {
        targets: {
          browsers: ['ie 8'],
        },
      }]],
    }))
    .pipe(replace('<VERSION>', compatibleVersionRange))
    .pipe(gulp.dest('./dist'))
}

async function composeStandaloneLoader(done) {
  const readFile = util.promisify(fs.readFile)
  const writeFile = util.promisify(fs.writeFile)

  const embeddableLoader = await readFile('./embeddableLoader.js', 'utf-8')
  const standaloneLoader = await readFile('./loader.js', 'utf-8')

  await writeFile('./dist/loader.js', standaloneLoader.replace('// %{EMBEDDABLE_LOADER}%', embeddableLoader), 'utf-8')

  done()
}

function compileJSLoader() {
  return gulp
    .src('./dist/loader.js')
    .pipe(babel({
      presets: [['env', {
        targets: {
          browsers: ['ie 8'],
        },
      }]],
    }))
    .pipe(replace('<VERSION>', compatibleVersionRange))
    .pipe(gulp.dest('./dist'))
}

const copy = gulp.parallel(
  copyPackageMetaFiles,
  copyNoJsCss,
  copyPolyfills,
)

function copyPackageMetaFiles() {
  return gulp
    .src(['./LICENSE', './package.json', './README.md'])
    .pipe(replace('<VERSION>', compatibleVersionRange))
    .pipe(gulp.dest('./dist'))
}

function copyNoJsCss() {
  return gulp
    .src('./szn-select-nojs.css')
    .pipe(gulp.dest('./dist'))
}

function copyPolyfills() {
  return gulp
    .src('./polyfill/*.js')
    .pipe(gulp.dest('./dist/polyfill'))
}

function compileCss() {
  return gulp
    .src('./*.css')
    .pipe(postCss([
      postCustomProperties({
        preserve: true,
      }),
    ]))
    .pipe(gulp.dest('./dist'))
}

async function bundle(done) {
  const readFile = util.promisify(fs.readFile)
  const writeFile = util.promisify(fs.writeFile)
  const writeUtfFile = (filePath, contents) => writeFile(filePath, contents, 'utf-8')

  const [
    sznSelectEs3,
    sznSelectEs2016,
    sznTetheredEs3,
    sznTetheredEs2015,
    sznElementsEs3,
    sznElementsEs2015,
    sznElementsCustomElements,
    sznElementsMutationObserverEs3,
    sznElementsMutationObserverEs2015,
    sznElementsNoopRuntimeES3,
    sznElementsNoopRuntimeES2015,
  ] = await Promise.all([
    './dist/szn-select.es3.js',
    './dist/szn-select.es2016.js',
    '@jurca/szn-tethered/szn-tethered.es3.js',
    '@jurca/szn-tethered/szn-tethered.es6.js',
    '@jurca/szn-elements/szn-elements.es3.js',
    '@jurca/szn-elements/szn-elements.es6.js',
    '@jurca/szn-elements/szn-elements-custom-elements.js',
    '@jurca/szn-elements/szn-elements-mutation-observer.es3.js',
    '@jurca/szn-elements/szn-elements-mutation-observer.es6.js',
    '@jurca/szn-elements/szn-elements-noop.es3.js',
    '@jurca/szn-elements/szn-elements-noop.es6.js',
  ].map(require.resolve).map(filePath => readFile(filePath, 'utf-8')))

  const baseBundleEs3 = [sznTetheredEs3, sznSelectEs3, sznElementsEs3]
  const baseBundleEs2016 = [sznTetheredEs2015, sznSelectEs2016, sznElementsEs2015]
  const bundleEs3 = [...baseBundleEs3, sznElementsMutationObserverEs3]
  const bundleEs2016 = [...baseBundleEs2016, sznElementsMutationObserverEs2015]
  const bundleCe = [...baseBundleEs2016, sznElementsCustomElements]
  const bundleNoopEs3 = [...baseBundleEs3, sznElementsNoopRuntimeES3]
  const bundleNoopEs2016 = [...baseBundleEs2016, sznElementsNoopRuntimeES2015]

  await Promise.all([
    ['elements.es3', [sznTetheredEs3, sznSelectEs3]],
    ['elements.es2016', [sznTetheredEs2015, sznSelectEs2016]],
    ['full.es3', bundleEs3],
    ['full.es2016', bundleEs2016],
    ['full.ce', bundleCe],
    ['full.noop-rt.es3', bundleNoopEs3],
    ['full.noop-rt.es2016', bundleNoopEs2016],
  ].map(
    ([bundleName, sources]) => writeUtfFile(`./dist/szn-select.bundle-${bundleName}.js`, sources.join('\n;\n')),
  ))

  done()
}

function minify() {
  return gulp
    .src('./dist/**/*.js')
    .pipe(babel({
      presets: ['minify'],
    }))
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(gulp.dest('./dist'))
}

function clean() {
  return del('./dist')
}

function cleanup() {
  return del('./dist/szn-select{,--button,--options,--ui}.{css,js}')
}

exports.default = gulp.series(
  clean,
  gulp.parallel(
    compileCss,
    copy,
  ),
  injectCss,
  concatElements,
  injectA11yImplementations,
  injectInitCode,
  cleanup,
  compileJS,
  bundle,
  minify,
)
