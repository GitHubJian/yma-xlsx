const FieldValidator = require('./field-validator');
const compose = require('./compose');

function FormValidator(rules) {
    this.rules = rules;

    this.validators = rules.map(function (rules) {
        return new FieldValidator(rules);
    });
}

FormValidator.prototype.assert = function (form, callback) {
    this.$setDynamicParams(form);

    const middleware = this.validators.map(function (validator) {
        return function (ctx, next) {
            const key = validator.key;
            validator.assert(form[key], function (message) {
                if (message !== true) {
                    ctx.push(message);
                }

                next();
            });
        };
    });

    const fn = compose(middleware);

    const context = [];
    fn(context, function () {
        callback(context);
    });
};

FormValidator.prototype.$setDynamicParams = function (form) {
    this.validators.forEach(validator => {
        const rules = validator.rules;

        rules.forEach(rule => {
            if (rule.correlative) {
                const correlativeValidator = this.validators.find(function (v) {
                    return v.key === rule.correlative;
                });

                validator.setDynamicParam(rule.name, [
                    form[rule.correlative],
                    correlativeValidator && correlativeValidator.label,
                ]);
            }
        });
    });
};

module.exports = FormValidator;
