module.exports = function (grunt) {

    const imagemin = require('imagemin');
    const imageminJpegtran = require('imagemin-jpegtran');

    // 1. Вся настройка находится здесь
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        imagemin: {
            img: {
                options: {
                    progressive: true,
                    optimizationLevel: 1
                },
                files: [{
                    expand: true,
                    cwd: 'img/',
                    src: ['*.jpg'],
                    dest: 'img_1/'
                }]
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.registerTask('default', ['imagemin']);
};