"use strict";
exports.__esModule = true;
var _lodash = require("lodash");
var api_service_template_1 = require("./api-service.template");
var prettier = require("prettier/standalone");
var prettierParserTS = require("prettier/parser-typescript");
var _ = _lodash;
var prettierOptions = {
    bracketSpacing: true,
    parser: 'typescript',
    plugins: [prettierParserTS],
    singleQuote: true
};
exports.createApiServiceWithTemplate = function (data) {
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    var template = _.template(api_service_template_1.template);
    return prettier.format(template(data), prettierOptions);
};
