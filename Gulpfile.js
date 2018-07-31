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

gulp.task('concat', function(){
    return gulp.src(['./css/styles.css','./css/beautify_detailed_view.css','./css/orientation_landscape.css'])
        .pipe(concat('style.min.css'))
        .pipe(gulp.dest('./test/'))
});
