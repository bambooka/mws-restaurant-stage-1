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

gulp.task('concat', function(){
    return gulp.src(['./js/idb.js', './js/dbhelper.js','./js/main.js','./js/index.js'])
        .pipe(concat('script.min.js'))
        .pipe(gulp.dest('./test/'))
});

gulp.task('minCSS', () => {
    return gulp.src('./test/style.min.css')
        .pipe(minCSS({debug: true}, (details) => {
            console.log(`${details.name}: ${details.stats.originalSize}`);
            console.log(`${details.name}: ${details.stats.minifiedSize}`);
        }))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('gulp-uglify', function(){
    gulp.src('./test/script.min.js')
        .pipe(uglify())
        .pipe(gulp.dest('./dist/'))
});