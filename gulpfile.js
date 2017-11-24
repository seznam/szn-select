'use strict'

const del = require('del')
const gulp = require('gulp')
const babel = require('gulp-babel')
const rename = require('gulp-rename')
const postCss = require('gulp-postcss')
const postCssCalc = require('postcss-calc')
const postCustomProperties = require('postcss-custom-properties')
const postCssImport = require('postcss-import')

function compile() {
  return gulp
    .src('./szn-select.js')
    .pipe(babel({
      presets: [['env', {
        targets: {
          browsers: ['ie 8'],
        },
      }]],
    }))
    .pipe(rename({
      suffix: '.es3',
    }))
    .pipe(gulp.dest('./dist'))
}

const copy = gulp.parallel(
  copyES6Implementation,
  copyPackageMetaFiles,
  copyCSS,
)

function copyPackageMetaFiles() {
  return gulp
    .src(['./LICENSE', './package.json', './README.md'])
    .pipe(gulp.dest('./dist'))
}

function copyCSS() {
  return gulp
    .src('./szn-select.css')
    .pipe(gulp.dest('./dist'))
}

function copyES6Implementation() {
  return gulp
    .src('./szn-select.js')
    .pipe(rename('szn-select.es6.js'))
    .pipe(gulp.dest('./dist'))
}

function compileDefaultCss() {
  return gulp
    .src('./szn-select.default.css')
    .pipe(postCss([
      postCssImport(),
      postCustomProperties(),
      postCssCalc(),
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

exports.default = gulp.series(
  clean,
  gulp.parallel(
    compile,
    compileDefaultCss,
    copy,
  ),
  minify,
)
