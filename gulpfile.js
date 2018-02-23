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

    const [css, es6] = await Promise.all([
      readFile(`./dist/${elementName}.css`, 'utf-8'),
      readFile(`./${elementName}.js`, 'utf-8'),
    ])

    return writeFile(`./dist/${elementName}.js`, es6.replace('%{CSS_STYLES}%', css), 'utf-8')
  }
}

function concatElements() {
  return gulp
    .src('./dist/*.js')
    .pipe(concat('szn-select.es6.js'))
    .pipe(gulp.dest('./dist'))
}

async function injectA11yImplementations(done) {
  const readFile = util.promisify(fs.readFile)
  const writeFile = util.promisify(fs.writeFile)

  const baseClass = await readFile('./a11y/AccessibilityBroker.js', 'utf-8')
  const implementationSources = await util.promisify(glob)('./a11y/!(AccessibilityBroker).js')
  const implementations = await Promise.all(implementationSources.map(sourceFile => readFile(sourceFile, 'utf-8')))

  const selectSource = await readFile('./dist/szn-select.es6.js', 'utf-8')
  const newSource = selectSource.replace('// %{A11Y_IMPLEMENTATIONS}%', [baseClass, ...implementations].join('\n'))

  await writeFile('./dist/szn-select.es6.js', newSource, 'utf-8')

  done()
}

async function injectInitCode(done) {
  const readFile = util.promisify(fs.readFile)
  const writeFile = util.promisify(fs.writeFile)

  const source = await readFile('./dist/szn-select.es6.js', 'utf-8')
  const patchedSource = `${source}\nif (SznElements.init) {\n  SznElements.init()\n}\n`
  await writeFile('./dist/szn-select.es6.js', patchedSource, 'utf-8')

  done()
}

const compileJS = gulp.parallel(
  gulp.series(
    compileJSSelectES2016,
    compileJSSelectEs3,
  ),
  compileJSLoader,
)

function compileJSSelectES2016() {
  return gulp
    .src('./dist/szn-select.es6.js')
    .pipe(babel()) // strips trailing commas in function calls (ES2017) so the source becomes ES2016-compatible
    .pipe(gulp.dest('./dist'))
}

function compileJSSelectEs3() {
  return gulp
    .src('./dist/szn-select.es6.js')
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

function compileJSLoader() {
  return gulp
    .src('./loader.js')
    .pipe(babel({
      presets: [['env', {
        targets: {
          browsers: ['ie 8'],
        },
      }]],
    }))
    .pipe(replace('<VERSION>', packageInfo.version))
    .pipe(gulp.dest('./dist'))
}

const copy = gulp.parallel(
  copyPackageMetaFiles,
  copyNoJsCss,
)

function copyPackageMetaFiles() {
  return gulp
    .src(['./LICENSE', './package.json', './README.md'])
    .pipe(replace('<VERSION>', packageInfo.version))
    .pipe(gulp.dest('./dist'))
}

function copyNoJsCss() {
  return gulp
    .src('./szn-select-nojs.css')
    .pipe(gulp.dest('./dist'))
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
    sznSelectEs6,
    sznTetheredEs3,
    sznTetheredEs6,
    sznElementsEs3,
    sznElementsEs6,
    sznElementsCustomElements,
    sznElementsMutationObserverEs3,
    sznElementsMutationObserverEs6,
  ] = await Promise.all([
    './dist/szn-select.es3.js',
    './dist/szn-select.es6.js',
    '@jurca/szn-tethered/szn-tethered.es3.js',
    '@jurca/szn-tethered/szn-tethered.es6.js',
    '@jurca/szn-elements/szn-elements.es3.js',
    '@jurca/szn-elements/szn-elements.es6.js',
    '@jurca/szn-elements/szn-elements-custom-elements.js',
    '@jurca/szn-elements/szn-elements-mutation-observer.es3.js',
    '@jurca/szn-elements/szn-elements-mutation-observer.es6.js',
  ].map(require.resolve).map(filePath => readFile(filePath, 'utf-8')))

  const baseBundleEs3 = [sznSelectEs3, sznTetheredEs3, sznElementsEs3]
  const baseBundleEs6 = [sznSelectEs6, sznTetheredEs6, sznElementsEs6]
  const bundleEs3 = [...baseBundleEs3, sznElementsMutationObserverEs3]
  const bundleEs6 = [...baseBundleEs6, sznElementsMutationObserverEs6]
  const bundleCe = [...baseBundleEs6, sznElementsCustomElements]

  await Promise.all([
    ['es3', bundleEs3],
    ['es6', bundleEs6],
    ['ce', bundleCe],
  ].map(
    ([bundleName, sources]) => writeUtfFile(`./dist/szn-select.bundle.${bundleName}.js`, sources.join('\n;\n')),
  ))

  done()
}

function minify() {
  return gulp
    .src('./dist/*.js')
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
