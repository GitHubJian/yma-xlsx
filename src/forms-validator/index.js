const FormValidator = require('./form-validator');
const UniqueContext = require('./unique-context');
const compose = require('./compose');

function normalizeRule(rule) {
    return rule.map(function (r) {
        if (typeof r === 'string') {
            return {
                name: r,
            };
        }
        return r;
    });
}

function FormsValidator(rules) {
    this.rules = rules;
    this.uniqueContext = new UniqueContext();

    this.init();
}

FormsValidator.prototype.init = function init() {
    const that = this;

    const formRules = this.rules.map(function (fieldRule) {
        const rules = normalizeRule(fieldRule.rules);

        return {
            key: fieldRule.key,
            label: fieldRule.label,
            rules,
        };
    });

    formRules.forEach(function (fieldRule) {
        const key = fieldRule.key;
        const rules = fieldRule.rules;

        rules.forEach(function (r) {
            if (r.name === 'unique') {
                that.uniqueContext.init(key);

                r.params = [that.uniqueContext, key];
            }
        });
    });

    this.rules = formRules;
};

FormsValidator.prototype.assert = function assert(forms, callback) {
    const that = this;

    const middleware = [];
    forms.forEach(function (form, i) {
        const validator = new FormValidator(that.rules);
        middleware.push(function (ctx, next) {
            validator.assert(form, function (message) {
                ctx[i] = message;
                next();
            });
        });
    });

    const fn = compose(middleware);

    const context = {};
    fn(context, function () {
        callback(context);
    });
};

module.exports = FormsValidator;
