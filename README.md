# angular-frontload-data

> Bundle your mostly immutable remote data into angular constant(s) at build-time.

It outputs a minified version of the file by default.

## Install

```sh
$ npm install angular-frontload-data --save-dev
```

## Usage

```js
var frontLoad = require('angular-frontload-data');

frontLoad({
  example: {
    url: 'http://www.test.com/example.json',
    method: 'GET'
  }, {
    filename: 'example.js',
    moduleName: 'example'
  }, function() {
    console.log('Done!');
  });
});
```

### Hack nice with Grunt

```js
module.exports = function (grunt) {
  var frontLoad = require('angular-frontload-data');

  grunt.registerTask('frontload', function() {
    var done = this.async();

    frontLoad({
      example: {
        url: 'http://www.test.com/example.json',
        method: 'GET'
      }, {
        filename: 'example.js',
        moduleName: 'example'
      }, done
    });
  });
}
```

## API

### frontLoad(constants, [options], [callback]);

#### constants

**Required**  
Type: `object`

A map of [Request](https://www.npmjs.com/package/request) objects
[plus some additional options](https://www.npmjs.com/package/request#request-options-callback).  
See [this page](https://www.npmjs.com/package/request#request-options-callback) for a list of all available options.  

#### options

Type: `object`

#### options.filename

Type: `string`  
Default: `./constants.js`

The output filename.

#### options.moduleName

Type: `string`  
Default: `constants`

The [angular.module](https://docs.angularjs.org/api/ng/function/angular.module) to which the data is attached.

#### options.moduleDeclaration

Type: `boolean`  
Default: `false`

Allow module to be initialized as standalone or whether it is defined elsewhere in the app.

#### options.strictMode

Type: `boolean`  
Default: `false`  

If `true`, `'use strict';` is prepended to the beginning of the file.

#### options.moduleSystem

Type: `string`  
Default: `strict`  

Wrap the templateCache in a module system.  
Currently supported systems: `RequireJS`, `Browserify` and `IIFE` (Immediately-Invoked Function Expression).

#### options.beautify

Type: `boolean`, `object`  
Default: `false`  

A [JS Beuatifier](http://jsbeautifier.org/) config object.  
See supported options and defaults [here](https://www.npmjs.com/package/js-beautify#options)

#### options.templateHeader

Type: `string`,  
Default: `'angular.module(\'<%= name %>\'<%= standalone %>)'`  

A [lodash template](https://lodash.com/docs#template) for the fileHeader.

- name: `options.moduleName`
- standalone: `options.moduleDeclaration ? ', []', : ''`

#### options.templateFooter

Type: `string`,  
Default: `';'`  

A [lodash template](https://lodash.com/docs#template) for the file's footer.

#### options.templateBody

Type: `string`,  
Default: `'.constant(\'<%= key %>\', <%= value %>)'`  

A [lodash template](https://lodash.com/docs#template) populated repeatedly with the result of each successful request.

- key: `Object.keys(constants).forEach`
- value: {transformed} response of each request made

#### options.logLevel

Type: `string`,  
Default: `normal`  

The granularity of messages logged to the console.

## License

MIT © Rahul Doshi