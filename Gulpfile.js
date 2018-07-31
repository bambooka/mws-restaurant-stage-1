const gulp = require('gulp');

var uglify = require('gulp-uglify');
const browserSync = require('browser-sync').create();

const concat = require('gulp-concat');
let minCSS = require('gulp-clean-css');

gulp.task('browserSync', function(){
    browserSync({
        server: {
            baseDir: 'mws-restaurant-stage-1'
        }
    })
});