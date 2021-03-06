'use strict';

var component,
    componentName = 'foo',
    path = require('path'),
    helpers = require('yeoman-generator').test;

describe('yo ractive:component', function () {
  describe('when using the default setup', function () {
    beforeEach(function (done) {
      helpers.testDirectory(path.join(__dirname, 'temp'), function (err) {
        if (err) {
          return done(err);
        }

        component = helpers.createGenerator('ractive:component', [
          '../../app',
          '../../component',
        ], [componentName], {});

        helpers.stub(component.config, 'get', function (key) {
          if (key === 'loadMethod') {
            return 'scriptTags';
          }
        });

        done();
      });
    });

    it('should generate a new component', function (done) {
      var expected = [
        'app/scripts/components/' + componentName + '.js',
        'test/components/' + componentName + '_test.js'
      ];

      component.run([], function () {
        helpers.assertFile(expected);

        done();
      });
    });

    it('should give the component the passed in name', function (done) {
      component.run([], function () {
        helpers.assertFileContent('app/scripts/components/' + componentName + '.js',
          new RegExp(
            'var ' + component._.classify(componentName) + ' = Ractive.extend', 'i'
          )
        );

        done();
      });
    });

    it('should give the component template the passed in name', function (done) {
      component.run([], function () {
        helpers.assertFileContent('app/scripts/components/' + componentName + '.js',
          new RegExp('template: \'#component/' + componentName + '-template\'', 'i')
        );

        done();
      });
    });

    describe('when the isolated flag is used', function () {
      it('should give it an isolated setting', function (done) {
        var _options = component.options;
        component.options.isolated = true;

        component.run([], function () {
          helpers.assertFileContent('app/scripts/components/' + componentName + '.js',
            /isolated: true/i
          );

          component.options = _options;
          done();
        })
      });
    });

    describe('when the global flag is used', function () {
      it('should attach to the components object', function (done) {
        var _options = component.options;
        component.options.global = true;

        component.run([], function () {
          helpers.assertFileContent('app/scripts/components/' + componentName + '.js',
            new RegExp(
              'Ractive.components.' + component._.camelize(componentName) + ' = ' + componentName + ';', 'i'
            )
          );

          component.options = _options;
          done();
        })
      });
    });
  });

  describe('when using AMD', function () {
    beforeEach(function (done) {
      helpers.testDirectory(path.join(__dirname, 'temp'), function (err) {
        if (err) {
          return done(err);
        }

        component = helpers.createGenerator('ractive:component', [
          '../../app',
          '../../component',
        ], [componentName], {});

        helpers.stub(component.config, 'get', function (key) {
          if (key === 'loadMethod') {
            return 'AMD';
          }
        });

        done();
      });
    });

    it('defines modules', function (done) {
      component.run({}, function () {
        helpers.assertFileContent('app/scripts/components/' + componentName + '.js',
          /define/i
        );
        helpers.assertFileContent('test/components/' + componentName + '_test.js',
          /define/i
        );

        done();
      })
    });

    it('creates the template file', function (done) {
      component.run({}, function () {
        helpers.assertFile('app/scripts/components/' + componentName + '.html');
      });

      done();
    });
  });

  describe('when using Browserify', function () {
    beforeEach(function (done) {
      helpers.testDirectory(path.join(__dirname, 'temp'), function (err) {
        if (err) {
          return done(err);
        }

        component = helpers.createGenerator('ractive:component', [
          '../../app',
          '../../component',
        ], [componentName], {});

        helpers.stub(component.config, 'get', function (key) {
          if (key === 'loadMethod') {
            return 'browserify';
          }
        });

        done();
      });
    });

    it('requires the ractive runtime module', function (done) {
      component.run({}, function () {
        helpers.assertFileContent('app/scripts/components/' + componentName + '.js',
          /var ractive = require\('ractive\/ractive.runtime'\);/i
        );
      });

      done();
    });

    it('requires the ractive template', function (done) {
      component.run({}, function () {
        helpers.assertFileContent('app/scripts/components/' + componentName + '.js',
          new RegExp("('./" + componentName + ".ract')")
        );

        done();
      });
    });

    it('creates the template file', function (done) {
      component.run({}, function () {
        helpers.assertFile('app/scripts/components/' + componentName + '.ract');
      });

      done();
    });

    describe('when passing the on the fly flag', function () {
      beforeEach(function (done) {
        component = helpers.createGenerator('ractive:component', [
          '../../app',
          '../../component',
        ], [componentName], {
          'on-the-fly': true
        });

        done();
      });

      describe('when using Browserify', function () {
        it('only creates the template file', function (done) {
          helpers.stub(component.config, 'get', function (key) {
            if (key === 'loadMethod') {
              return 'browserify';
            }
          });

          component.run({}, function () {
            helpers.assertFile('app/scripts/components/' + componentName + '.ract');
            helpers.assertNoFile('app/scripts/components/' + componentName + '.js');
          });

          done();
        });
      });
    });
  });
});
