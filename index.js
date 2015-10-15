var fs = require('fs'),
    util = require('util'),
    path = require('path'),

    Promise = require('bluebird'),
    request = require('request-promise'),
    template = require('lodash.template'),
    beautify = require('js-beautify'),
    colors = require('chalk'),
    symbols = require('log-symbols'),
    beep = require('beepbeep'),
    noop = require('node-noop').noop,
    sourcify = require('tosource'),

    TEMPLATE_HEADER = 'angular.module(\'<%= name %>\'<%= standalone %>)',
    TEMPLATE_BODY = '.constant(\'<%= key %>\', <%= value %>)',
    TEMPLATE_FOOTER = ';',

    DEFAULT_FILE = './constants.js',
    DEFAULT_MODULE = 'constants',

    MODULE_WRAPPERS = {
        requirejs: {
            header: 'define([\'angular\'], function(angular) { \'use strict\'; return ',
            footer: '});'
        },
        browserify: {
            header: '\'use strict\'; module.exports = '
        },
        iife: {
            header: ';(function (angular, window, document, undefined) { \'use strict\';',
            footer: '})(this.angular, this, this.document);'
        },
        strict: {
            header: '\'use strict\'; '
        }
    };

function formatUri(href) {
    var uri = href.url;

    Object.keys(href.qs).forEach(function(qs, i) {
        uri += (i === 0 ? '?' : '&') + qs + '=' + href.qs[qs];
    });

    return uri;
}

module.exports = function(constants, options, callback) {
    var requests = [],
        consts = [],
        errors = 0,
        cb = (util.isFunction(options) && options) || (util.isFunction(callback) && callback) || noop,
        logging = util.isString(options.logLevel) && options.logLevel.trim().toLowerCase() || 'normal',
        pretty = (options.beautify !== false) && (options.beautify || true),
        quotemarks = require(options.quoteMark && options.quoteMark.trim().toLowerCase() === 'double'
            ? 'to-double-quotes' : 'to-single-quotes'),
        config = util.isString(pretty) ? JSON.parse(fs.readFileSync(pretty)) : pretty,
        system = util.isString(options.moduleSystem) && options.moduleSystem.trim().toLowerCase()
            || options.strictMode ? 'strict' : '',
        header = (system ? (MODULE_WRAPPERS[system] && MODULE_WRAPPERS[system].header) || '' : '')
            + ((util.isString(options.templateHeader) && options.templateHeader) || TEMPLATE_HEADER),
        footer = ((util.isString(options.templateFooter) && options.templateFooter) || TEMPLATE_FOOTER)
            + (system ? (MODULE_WRAPPERS[system] && MODULE_WRAPPERS[system].footer) || '' : ''),
        filename = options.filename || DEFAULT_FILE,
        content = template(header)({
            name: options.moduleName || DEFAULT_MODULE,
            standalone: options.moduleDeclaration ? ', []' : ''
        });

    if (!util.isObject(constants)) {
        console.log();
        console.log(colors.yellow(
            symbols.warning,
            !constants ? ' required option constants is missing.' : ' defined contants must be of type object.'
        ));

        beep();

        return;
    }

    Object.keys(constants).forEach(function (constant) {
        consts.push(constant);
        requests.push(request(constants[constant]));
    });

    Promise.settle(requests).then(function(results) {
        var error;

        console.log();

        results.forEach(function(result, i) {
            if (result.isFulfilled()) {
                content += template(options.templateBody || TEMPLATE_BODY)({
                    key: consts[i],
                    value: sourcify(result.value())
                });

                console.log(colors.green(symbols.success, requests[i].response.request.uri.href));
            } else if (result.isRejected()) {
                ++errors;

                error = result.error();

                if (logging === 'verbose') {
                    console.log(colors.red.underline(formatUri(error.options)));
                    console.log(error.message);
                } else {
                    console.log(colors.red(symbols.error, formatUri(error.options)));
                }
            }
        });

        content += footer;

        if (!(errors && options.allOrNothing)) {
            fs.mkdir(path.dirname(filename), function () {
                fs.writeFile(filename, quotemarks(pretty ? beautify(content, config) : content), function(err) {
                    if (err) {
                        throw err;
                    }

                    cb();
                });
            });
        }

        console.log();

        if (errors) {
            beep();
        }
    });
};
