'use strict';

var path = require("path");
var Mustache = require("mustache");
var _ = require('lodash');

module.exports = function (grunt) {
    // load grunt plugins
    require('jit-grunt')(grunt, {
        sprite: 'grunt-spritesmith'
    });

    require('time-grunt')(grunt);

    // Project configuration.
    grunt.initConfig({
        // STATIC_DIR
        SOURCE_DIR_PC : "src",
        DEPLOY_DIR : "dist",
        DEPLOY_DIR_PC : "dist",
        BOWER_DIR : "bower_components",

        // Metadata.
        pkg: grunt.file.readJSON("package.json"),
        banner : '/*!  <%= pkg.title || pkg.name %> - v<%= pkg.version %> ' + grunt.util.linefeed + '<%= pkg.author.name %>' + grunt.util.linefeed + ' */' + grunt.util.linefeed,

        // Task configuration.
        clean: {
            options: {
                force: true
            },

            dev: ['{<%= SOURCE_DIR_PC %>/css/**/*'],
            deploy: ['<%= DEPLOY_DIR %>/**/*']
        },

        sprite:{
            spr_img: {
                src: ['<%= SOURCE_DIR_PC %>/images/spr_img/*.png'],
                dest: '<%= SOURCE_DIR_PC %>/images/spr_img.png',
                imgPath: '../images/spr_img.png',
                destCss: '<%= SOURCE_DIR_PC %>/scss/sprite/_spr_img.scss',
                padding: 6,
                cssSpritesheetName: 'spr_img'
            },

            spr_img_2x: {
                src: ['<%= SOURCE_DIR_PC %>/images/spr_img_2x/*.png'],
                dest: '<%= SOURCE_DIR_PC %>/images/spr_img_2x.png',
                imgPath: '../images/spr_img_2x.png',
                destCss: '<%= SOURCE_DIR_PC %>/scss/sprite/_spr_img_2x.scss',
                padding: 6,
                cssSpritesheetName: 'spr_img_2x'
            }
        },

        sass: {
            options: {
                outputStyle: 'expanded',
                sourceMap: '',
                sourceMapEmbed:true
            },

            pc: {
                files: [{
                    expand : true,
                    cwd : '<%= SOURCE_DIR_PC %>/scss/',
                    src: ['**/*.scss'],
                    dest: '<%= SOURCE_DIR_PC %>/css/',
                    // ext: '.css',
                }]
            }
        },

        postcss: {
            options: {
                map: {
                    inline:true
                },
                processors: [
                    require('autoprefixer')({
                        browsers: ['last 3 versions', 'android >= 4.2', 'iOS 8']
                    }),
                    require('postcss-will-change-transition'),
                    require('postcss-will-change'),
                    require('css-mqpacker')
                    // require('postcss-flexboxfixer'),
                    // require('postcss-unprefix')
                ]
            },

            pc: {
                expand : true,
                cwd : '<%= SOURCE_DIR_PC %>/css/',
                src: ['*.scss'],
                dest: '<%= SOURCE_DIR_PC %>/css/',
                ext: '.css'
            }

        },

        // cssmin: {
        //     options: {
        //         advanced: true,
        //         aggressiveMerging: false,
        //         compatibility: 'ie9',
        //         mediaMerging: false,
        //         restructuring: false,
        //         shorthandCompacting: false,
        //         sourceMap: false
        //     },
        //
        //     pc: {
        //         files: [{
        //             expand: true,
        //             cwd: '<%= DEPLOY_DIR_PC %>/css/',
        //             src: ['**/*.css'],
        //             dest: '<%= DEPLOY_DIR_PC %>/css/'
        //         }]
        //     }
        // },

        copy : {
            pc_css: {
                files: [{
                    expand: true,
                    cwd: '<%= SOURCE_DIR_PC %>/css/',
                    src: ['**/*', '!**/*.{map,scss}'],
                    dest: '<%= DEPLOY_DIR_PC %>/css/'
                }]
            },

            pc_js: {
                files: [{
                    expand : true,
                    cwd : '<%= SOURCE_DIR_PC %>/script/',
                    src : ['**/*'],
                    dest : '<%= DEPLOY_DIR_PC %>/script/'
                }]
            },

            pc_images: {
                files: [{
                    expand : true,
                    cwd : '<%= SOURCE_DIR_PC %>/images/',
                    src : ['**/*', '!dummy/**', '!**/spr_*/**', '!**/*.psd'],
                    dest : '<%= DEPLOY_DIR_PC %>/images/'
                }]
            },

            pc_html: {
                files: [{
                    expand : true,
                    cwd : '<%= SOURCE_DIR_PC %>/html/',
                    src : ['**/*'],
                    dest : '<%= DEPLOY_DIR_PC %>/html/'
                }]
            }
        },

        newer: {
            options: {
                tolerance: '100'
            }
        },

        watch: {
            options: {
                interrupt: true
                // reload: true
            },

            gruntfileReload: {
                options: {
                    reload: true
                },
                files: ['Gruntfile.js']
            },

            livereload: {
                options: {
                    livereload: true,
                    interrupt: true
                },
                files: ['<%= SOURCE_DIR_PC %>/{css,html}/**/*.{css,html}']
            },

            pc_sass: {
                files: ['<%= SOURCE_DIR_PC %>/scss/**/*.scss', '!<%= SOURCE_DIR_PC %>/scss/sprite/*.scss'],
                tasks: ['sass:pc', 'postcss:pc']
            },

            pc_sprite: {
                files: ['<%= SOURCE_DIR_PC %>/images/spr_*/**/*.png'],
                tasks: ['sprite_common_func', 'sprite', 'sass:pc', 'postcss:pc']
            }
        },

        concurrent: {
            options: {
                logConcurrentOutput: false
            },
            build: ['pc_css'],
            deploy_build: ['deploy_pc_css', 'copy:pc_html']
        }
    });

    // default
    grunt.registerTask('build', ['clean:dev', 'sprite_common_func', 'sprite', 'concurrent:build']);
    grunt.registerTask('default', ['build', 'watch']);
    grunt.registerTask('pc', ['clean:dev', 'concurrent:pc_build', 'watch']);

    grunt.registerTask('deploy', ['clean','sprite_common_func', 'sprite', 'concurrent:deploy_build']);

    // Dev PC, Mobile Task
    grunt.registerTask('pc_css', ['sass:pc', 'postcss:pc']);

    // DEPLOY PC, Mobile Task
    grunt.registerTask('deploy_pc_css', ['cssNoMap', 'pc_css', 'copy:pc_css', 'copy:pc_js', 'copy:pc_images']);

    // sass task > cssTemplate, cssOpts 공통 function 추가
    grunt.registerTask('sprite_common_func', function () {
        _(grunt.config.data.sprite).forEach(function (conf) {
            if (!!conf.cssTemplate === false) {
                conf.cssTemplate = function (params) {
                    var template = grunt.file.read('sprites.mustache');
                    return Mustache.render(template, params);
                }
            }

            if (!!conf.cssOpts === false) {
                conf.cssOpts = {
                    removepx: function () {
                        return function (text, render) {
                            var value = render(text);
                            return '0px' === value ? '0' : value;
                        };
                    },
                    retina: function () {
                        return function (text, render) {
                            var pixelRatio = 2;
                            return parseInt(render(text), 10) / pixelRatio + 'px';
                        };
                    }
                }
            }
        });
    });

    // css map 생성 여부
    grunt.registerTask('cssNoMap', function () {
        var configList = ['sass', 'postcss'];
        // var configList = ['sass'];

        _(configList).forEach(function (conf) {
            var conf =grunt.config.data[conf];

            if (!conf.options) conf.options = {};

            conf.options.sourceMap = false;
            conf.options.sourceMapEmbed = false;
            conf.options.map = false;
        });
    });
};
