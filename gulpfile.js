'use strict'

const del = require('del')
const fs = require('fs')
const gulp = require('gulp')
const babel = require('gulp-babel')
const rename = require('gulp-rename')
const postCss = require('gulp-postcss')
const postCustomProperties = require('postcss-custom-properties')
const util = require('util')

async function injectCss(done) {
  const readFile = util.promisify(fs.readFile)
  const writeFile = util.promisify(fs.writeFile)

  const [css, es6] = await Promise.all([
    readFile('./dist/szn-select.css', 'utf-8'),
    readFile('./dist/szn-select.es6.js', 'utf-8'),
  ])

  await writeFile('./dist/szn-select.es6.js', es6.replace('%{CSS_STYLES}%', css), 'utf-8')

  done()
}

function compileJS() {
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

const copy = gulp.parallel(
  copyES6Implementation,
  copyPackageMetaFiles,
)

function copyPackageMetaFiles() {
  return gulp
    .src(['./LICENSE', './package.json', './README.md'])
    .pipe(gulp.dest('./dist'))
}

function copyES6Implementation() {
  return gulp
    .src('./szn-select.js')
    .pipe(rename('szn-select.es6.js'))
    .pipe(gulp.dest('./dist'))
}

function compileCss() {
  return gulp
    .src('./szn-select.css')
    .pipe(postCss([
      postCustomProperties({
        preserve: true,
      }),
    ]))
    .pipe(gulp.dest('./dist'))
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
  return del('./dist/szn-select.css')
}

exports.default = gulp.series(
  clean,
  gulp.parallel(
    compileCss,
    copy,
  ),
  injectCss,
  compileJS,
  minify,
  cleanup,
)
