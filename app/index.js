'use strict';

var util = require('util'),
    path = require('path'),
    yeoman = require('yeoman-generator'),
    yosay = require('yosay'),
    chalk = require('chalk'),
    _ = require('lodash'),
    RactiveProjectGenerator;

RactiveProjectGenerator = yeoman.generators.Base.extend({
  constructor: function () {
    yeoman.generators.Base.apply(this, arguments);

    this.option('test-framework', {
      desc: 'Test framework to be invoked (mocha/jasmine)',
      type: String,
      defaults: 'mocha'
    });

    this.testFramework = this.options['test-framework'];

    this.option('skip-analytics', {
      desc: 'Do not include Google Analytics tracking code',
      type: Boolean,
      defaults: false
    });

    this.includeModernizr = false;
  },

  init: function () {
    this.pkg = require('../package.json');

    this.on('end', function () {
      if (!this.options['skip-install']) {
        this.installDependencies();
      }
    });
  },

  askFor: function () {
    var done = this.async(), prompts;

    if (!this.options['skip-welcome-message']) {
      this.log(yosay('Welcome to the marvelous Ractive generator!'));
    }

    prompts = [{
      name: 'project',
      message: 'What\'s your project called?'
    }, {
      type: 'confirm',
      name: 'router',
      message: 'Would you like to include a client-side router?',
      default: false
    }, {
      when: function (answers) {
        return answers.router;
      },
      type: 'list',
      name: 'includedRouter',
      message: 'What router would you like to use?',
      choices: [{
        name: 'Router.js',
        value: 'router.js'
      }, {
        name: 'Page.js',
        value: 'page'
      }, {
        name: 'Director.js',
        value: 'director'
      }],
      default: 'router.js'
    }, {
      type: 'list',
      name: 'loadMethod',
      message: 'How would you like to load your scripts?',
      choices: [{
        name: 'Regular script tags',
        value: 'scriptTags'
      }, {
        name: 'AMD (Require.js)',
        value: 'AMD'
      }, {
        name: 'Browserify',
        value: 'browserify'
      }],
      default: 0
    }, {
      type: 'checkbox',
      name: 'features',
      message: 'What more would you like?',
      choices: [{
        name: 'Sass',
        value: 'includeSass',
        checked: false
      }, {
        name: 'Modernizr',
        value: 'includeModernizr',
        checked: false
      }, {
        name: 'jQuery',
        value: 'includejQuery',
        checked: false
      }, {
        name: 'Normalize CSS',
        value: 'includeNormalize',
        checked: false
      }],
    }, {
      when: function (answers) {
        return answers.features.indexOf('includeSass') !== -1;
      },
      type: 'confirm',
      name: 'libsass',
      value: 'includeLibSass',
      message: 'Would you like to use libsass? Read up more at \n' +
        chalk.green('https://github.com/andrew/node-sass#node-sass'),
      default: false
    }];

    this.prompt(prompts, function (props) {
      var props, features, mainPaths;

      this.props = this.props || {};

      function hasFeature(feature) {
        return features && features.indexOf(feature) !== -1;
      }

      props = _.extend(this.props, props);
      features = props.features;

      this.includeNormalize = hasFeature('includeNormalize');
      this.includeModernizr = hasFeature('includeModernizr');
      this.includejQuery = hasFeature('includejQuery');
      this.includeSass = hasFeature('includeSass');
      this.includeLibSass = props.libsass;
      this.includeRubySass = !props.libsass;
      this.loadMethod = props.loadMethod;

      if (props.router) {
        mainPaths = {
          'router.js': 'router.js',
          'page': 'index.js',
          'director': 'build/director.js'
        }

        this.includedRouter = props.includedRouter;
        this.includedRouterMainPath = mainPaths[props.includedRouter];
      }

      done();
    }.bind(this));
  },

  app: function () {
    var loadMethod = this.loadMethod;

    if (!this.options['skip-yo-rc']) {
      this.config.set('loadMethod', loadMethod);

      if (loadMethod === 'scriptTags') {
        this.config.set('nameSpace', this._.classify(this.props.project));
      }
    }

    this.mkdir('app');

    this.template('app/index.html', 'app/index.html');

    if (loadMethod === 'scriptTags') {
      this.template('app/scripts/app.js', 'app/scripts/app.js');
    } else if (loadMethod === 'AMD') {
      this.template('app/scripts/app-amd.js', 'app/scripts/app.js');
      this.template('app/scripts/main.js', 'app/scripts/main.js');
    } else if (loadMethod === 'browserify') {
      this.template('app/scripts/app-browserify.js', 'app/scripts/app.js');
    }

    if (this.includeSass) {
      this.template('app/styles/app.scss', 'app/styles/app.scss');
      this.template('app/styles/_defaults.scss', 'app/styles/_defaults.scss');
      this.template('app/styles/_vendor.scss', 'app/styles/_vendor.scss');
      this.template('app/styles/_layout.scss', 'app/styles/_layout.scss');
    } else {
      this.template('app/styles/app.css');
    }
  },

  projectfiles: function () {
    this.copy('editorconfig', '.editorconfig');
    this.copy('gitignore', '.gitignore');
    this.copy('gitattributes', '.gitattributes');
    this.template('jshintrc', '.jshintrc');
    this.template('_package.json', 'package.json');
    this.template('Gruntfile.js', 'Gruntfile.js');
  },

  bower: function () {
    var bower = {
      name: this._.slugify(this.props.project),
      version: '0.0.0',
      private: true,
      dependencies: {}
    };

    var normalize = this.includeSass ? 'normalize-scss' : 'normalize-css';

    if (this.includejQuery) {
      bower.dependencies['jQuery'] = '~1.11.1';
    }

    if (this.includeModernizr) {
      bower.dependencies.modernizr = '~2.8.2';
    }

    if (this.includeNormalize) {
      bower.dependencies[normalize] = '~3.0.1';
    }

    if (this.props.router) {
      if (this.includedRouter === 'director') {
        bower.dependencies.director = '~1.2.2';
      } else if (this.includedRouter === 'page') {
        bower.dependencies.page === '~1.3.7';
      } else {
        bower.dependencies['router.js'] = '^0.6.2';
      }

      bower.overrides = bower.overrides || {};

      bower.overrides[this.includedRouter] = {
        main: this.includedRouterMainPath
      };
    }

    if (this.loadMethod === 'AMD') {
      bower.dependencies['requirejs-ractive'] = '~0.1.5';
      bower.dependencies.requirejs = '~2.1.14';
    }

    if (this.loadMethod !== 'browserify') {
      bower.dependencies.ractive = '~0.5.5';
    }

    if (this.testFramework === 'mocha') {
      bower.devDependencies = bower.devDependencies || {};

      bower.devDependencies.chai = '^1.9.1';
      bower.devDependencies.mocha = '^1.21.4';
    }

    this.write('bower.json', JSON.stringify(bower, null, 2));
  },

  testfiles: function () {
    var testFramework = this.testFramework,
        loadMethod = this.loadMethod;

    this.testConfig = {
      assertString: testFramework === 'mocha' ? 'should assert something' :
        'asserts something',
      expectation: testFramework === 'mocha' ? 'expect(true).to.be.true;' :
        'expect(true).toBe(true);'
    };

    if (testFramework === 'mocha') {
      this.template('test/spec_runner.html', 'test/spec_runner.html');
    }

    if (loadMethod === 'scriptTags') {
      this.template('test/app_test.js', 'test/app_test.js');
    } else if (loadMethod === 'AMD') {
      this.template('test/spec_main.js', 'test/spec_main.js');
      this.template('test/app_test-amd.js', 'test/app_test.js');
    } else if (loadMethod === 'browserify') {
      this.template('test/app_test-browserify.js', 'test/app_test.js');
    }

    if (!this.options['skip-yo-rc']) {
      this.config.set('testFramework', testFramework);
    }
  }
});

module.exports = RactiveProjectGenerator;
