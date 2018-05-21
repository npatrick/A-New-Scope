module.exports = function(grunt) {

  /* eslint import/no-extraneous-dependencies: "off", node/no-unpublished-require: "off",
   angular/timeout-service: "off", angular/log: "off", no-console: "off" */
  require('load-grunt-tasks')(grunt); // in lieu of grunt.loadNpmTasks('grunt-*'), which need to be deleted below


  // Consider using "grunt-load-config" to clean up this file
  // See https://www.html5rocks.com/en/tutorials/tooling/supercharging-your-gruntfile/
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    babel: {
      options: {
        sourceMap: true,
        presets: ['es2015']
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'src/client/assets',
          src: [
            'lib/*.js',
            '!lib/scene.js',
            'scripts/*.js',
            'scripts/factories/*.js',
            'scripts/controllers/*.js',
            '!scripts/babelified',
            '!scripts/minified',
            'views/**/*.js',
            '!*.min.js'
          ],
          dest: 'src/client/assets/scripts/babelified'
        }]
      }
    },

    concat: {
      options: {
        separator: ';\n'
      },
      js: {
        src: ['src/client/assets/scripts/minified/**/*.min.js'],
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.min.js'
      },
      css: {
        src: ['src/client/assets/styles/minified/*.min.css'],
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.min.css'
      }
    },

    concurrent: {
      dev: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    },

    csslint: {
      strict: {
        options: {
          import: 2,
        },
        src: [
          'src/client/assets/styles/*.css',
          '!src/client/assets/styles/normalize.css',
        ]
      }
    },

    cssmin: {
      options: {
        keepSpecialComments: 0
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'src/client/assets/styles',
          src: ['*.css', '!*.min.css'],
          dest: 'src/client/assets/styles/minified',
          ext: '.min.css',
        }]
      }
    },

    eslint: {
      js: [
        'src/**/*.js',
        'Gruntfile.js',
      ]
    },

    env: {
      //TO DO
      dev: {
        NODE_ENV: 'dev',
        PORT: 3300

      },
      production: {
        NODE_ENV: 'production'
      }
    },

    injector: {
      // in a dev environment, inject the right CSS and JS; also inject a live-reload server
      // in production, inject the right CSS and JS
      dev: {
        options: {
          relative: true
        },
        files: {
          'src/client/index.html': [
            'src/client/assets/lib/*.js',
            '!src/client/assets/lib/scene.js',
            'src/client/assets/scripts/factories/*.js',
            'src/client/assets/scripts/controllers/*.js',
            'src/client/assets/scripts/app.js',
            'src/client/assets/styles/*.css'
          ]
        }
      },
      // not working; pushed to production with injector:dev
      // when working, "grunt build" should replace injector:dev
      // with injector:dist
      dist: {
        options: {
          destFile: 'src/client/index.html',
          ignorePath: 'dist/'
        },
        files: [{
          expand: true,
          cwd: 'src/client/assets/',
          // src: ['*.min.js', '*.min.css'],
          src: [
          'scripts/annotated/src/client/assets/lib/*.js',
          '!scripts/annotated/src/client/assets/lib/scene.js',
          'scripts/annotated/src/client/assets/scripts/factories/*.js',
          'scripts/annotated/src/client/assets/scripts/controllers/*.js',
          '!scripts/annotated/src/client/assets/scripts/babelified',
          '!scripts/annotated/src/client/assets/scripts/minified',
          'scripts/annotated/src/client/assets/scripts/*.js',
          'styles/*.css'
          ],
          dest: '../src/client'
        }]
      }
    },

    htmlmin: {
        // TODO: add minify rules, see here
        // https://github.com/kangax/html-minifier#options-quick-reference
      dist: {
        options: {
          collapseWhitespace: true
        },
        files: [{
          expand: true,
          cwd: 'src/client',
          src: ['index.html', 'assets/views/*.html'],
          dest: 'dist'
        }]
      },
      dev: {
        files: [{
          expand: true,
          cwd: 'src/client',
          src: ['index.html', 'assets/views/*.html'],
          dest: 'dist'
        }]
      }
    },

    ngAnnotate: {
      //TODO
      // needed in order to serve minifed JS with angular in it
      options: {
        singleQuotes: true
      },
      dist: {
        files: [
          {
            expand: true,
            src: [
              'src/client/assets/scripts/babelified/**/*.js', 
              '!**/*.annotated.js'
            ],
            dest: 'src/client/assets/scripts/annotated',
            ext: '.annotated.js',
            extDot: 'last'
          }
        ],
      }
    },

    nodemon: {
      dev: {
        script: 'src/server/server.js',
        options: {
          nodeArgs: ['--inspect'],
          callback: function (nodemon) {
            nodemon.on('log', function (event) {
              console.log(event.colour);
            });

            // opens browser on initial server start
            nodemon.on('config:update', function () {
              // Delay before server listens on port
              setTimeout(function() {
                require('opn')('http://localhost:3300/#/user');
              }, 1000);
            });

            // refreshes browser when server reboots
            nodemon.on('restart', function () {
              // Delay before server listens on port
              setTimeout(function() {
                require('fs').writeFileSync('.rebooted', 'rebooted');
              }, 1000);
            });
          },
          ignore: [
            'src/client/assets/scripts/babelified/**/.js',
            'src/client/assets/scripts/minified/**/*.min.js'
          ],
          watch: ['src', 'Gruntfile.js'],
        }
      }
    },

    uglify: {
      target: {
        files: [{
          expand: true,
          cwd: 'src/client/assets/scripts/annotated',
          src: ['**/*.js', '!*.min.js'],
          dest: 'src/client/assets/scripts/minified',
          ext: '.min.js'
        }]
      }
    },

    watch: {
      options: {
        livereload: true // runs on 35729 by default; to change, replace true => some other number
      },
      css: {
        files: [
          'src/client/assets/styles/*.css',
          '!src/client/assets/styles/minified/*.min.css'
        ],
        tasks: ['cssmin', 'concat:css'],
      },
      gruntfile: {
        files: ['Gruntfile.js'],
        tasks: ['eslint']
      },
      scripts: {
        files: [
          'src/client/assets/scripts/*.js',
          'src/client/assets/views/**/*.html',
          '!src/client/assets/scripts/minified/*.min.js',
          '!src/client/assets/scripts/babelified/*.js'
        ],
        tasks: ['babel', 'uglify', 'concat:js'],
      },
      html: {
        files: ['src/client/**/*.html'],
        tasks: ['htmlmin'],
      }
    }
  });

  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-ng-annotate');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-eslint');
  // TODO: delete these after configuring them and registering them as tasks
  grunt.loadNpmTasks('grunt-injector');

  // TODO: register tasks
  grunt.registerTask('default', ['dev']);
  grunt.registerTask('dev', ['env:dev', 'injector:dev', 'concurrent:dev']);
  grunt.registerTask('test', ['eslint', 'csslint']);
  // removcal of 'injector:dist', 'uglify' & 'concat'
  grunt.registerTask('build', ['env:production', 'cssmin', 'babel', 'ngAnnotate', 'htmlmin']);
  grunt.registerTask('upload', []);
  grunt.registerTask('deploy', ['test', 'build', 'upload']);


};