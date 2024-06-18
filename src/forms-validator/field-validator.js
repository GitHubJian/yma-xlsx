const {
    isValidDate,
    isStrongPassword,
    isIncontinuityString,
    isEmpty,
} = require('./util');
const UniqueContext = require('./unique-context');

function normalizeRule(rules) {
    let r = [];
    let rKey = [];
    rules.forEach(function (rule) {
        if (typeof rule === 'string') {
            rule = {
                name: rule,
            };
        }

        if (rKey.indexOf(rule.name) === -1) {
            if (rule.name === 'required') {
                r.unshift(rule);
                rKey.push(rule.name);
            } else {
                r.push(rule);
                rKey.push(rule.name);
            }
        }
    });

    return r;
}

function FieldValidator(options) {
    this.label = options.label;
    this.key = options.key;
    this.rules = normalizeRule(options.rules);

    this.dynamicParams = {};
}

FieldValidator.prototype.setDynamicParam = function setDynamicParam(
    key,
    value
) {
    if (!Array.isArray(value)) {
        value = [value];
    }
    this.dynamicParams[key] = value;
};

FieldValidator.prototype.methods = {
    required: function (value) {
        if (!isEmpty(value)) {
            return true;
        }

        return this.label + '字段不能为空';
    },
    unique: function (value, uniqueContext, key) {
        if (isEmpty(value)) {
            return true;
        }

        if (!uniqueContext instanceof UniqueContext) {
            throw new Error(
                "unique'arguments[1] must be an instance of UniqueContext"
            );
        }

        uniqueContext = uniqueContext || {};
        if (uniqueContext.excludeAndupdate(key, value)) {
            return true;
        }

        return this.label + '(' + value + ')字段已经存在';
    },
    number: function (value, precision) {
        if (isEmpty(value)) {
            return true;
        }

        precision = Number(precision) < 1 ? 1 : precision;
        const re = new RegExp(
            '^[-+]?(\\d*(\\.\\d{0,' +
                precision +
                '})?|\\.\\d{1,' +
                precision +
                '})$'
        );

        if (re.test(value)) {
            return true;
        }

        return this.label + '字段精度为' + precision + '位的小数';
    },
    integer: function (value) {
        if (isEmpty(value)) {
            return true;
        }

        const re = /^[-+]?\d+$/;

        if (re.test(value)) {
            return true;
        }

        return this.label + '字段必须为整数';
    },
    positiveNumber: function (value) {
        if (isEmpty(value)) {
            return true;
        }

        if (/^\+?\d+$/.test(value)) {
            return true;
        }

        return this.label + '字段必须为正整数';
    },
    negativeNumber: function (value) {
        if (isEmpty(value)) {
            return true;
        }

        const re = /^-\d+$/;

        if (re.test(value)) {
            return true;
        }

        return this.label + '字段必须为负整数';
    },
    min: function (value, param, include) {
        if (isEmpty(value)) {
            return true;
        }

        value = Number(value);
        param = Number(param);

        if (include ? value >= param : value > param) {
            return true;
        }

        let compareStr = include ? '大于等于' : '大于';
        return this.label + '字段应' + compareStr + ' ' + param;
    },
    max: function (value, param, include) {
        if (isEmpty(value)) {
            return true;
        }

        value = Number(value);
        param = Number(param);

        if (include ? value <= param : value < param) {
            return true;
        }

        let compareStr = include ? '小于等于' : '小于';
        return this.label + '字段应' + compareStr + ' ' + param;
    },
    range: function (value, min, minIncluded, max, maxIncluded) {
        if (isEmpty(value)) {
            return true;
        }

        min = Number(min);
        max = Number(max);

        if (
            minIncluded
                ? value >= min
                : value > min && maxIncluded
                ? value <= max
                : value.length < max
        ) {
            return true;
        }

        let minCompareStr = minIncluded ? '大于等于' : '大于';
        let maxCompareStr = maxIncluded ? '小于等于' : '小于';
        return (
            this.label +
            '字段应' +
            minCompareStr +
            ' ' +
            min +
            ' 并且' +
            maxCompareStr +
            ' ' +
            max
        );
    },
    minlength: function (value, param, include) {
        if (isEmpty(value)) {
            return true;
        }

        param = Number(param);

        if (include ? value.length >= param : value.length > param) {
            return true;
        }

        let compareStr = include ? '大于等于' : '大于';
        return this.label + '字段长度应' + compareStr + ' ' + param;
    },
    maxlength: function (value, param, include) {
        if (isEmpty(value)) {
            return true;
        }

        param = Number(param);

        if (include ? value.length <= param : value.length < param) {
            return true;
        }

        let compareStr = include ? '小于等于' : '小于';
        return this.label + '字段长度应' + compareStr + ' ' + param;
    },
    rangelength: function (value, min, minIncluded, max, maxIncluded) {
        if (isEmpty(value)) {
            return true;
        }

        min = Number(min);
        max = Number(max);

        const len = String(value).length;

        if (
            (minIncluded ? len >= min : len > min) &&
            (maxIncluded ? len <= max : len < max)
        ) {
            return true;
        }

        let minCompareStr = minIncluded ? '大于等于' : '大于';
        let maxCompareStr = maxIncluded ? '小于等于' : '小于';
        return (
            this.label +
            '字段长度应' +
            minCompareStr +
            ' ' +
            min +
            ' 并且' +
            maxCompareStr +
            ' ' +
            max
        );
    },
    equalTo: function (value, correlativeValue, correlativeLabel) {
        if (isEmpty(value)) {
            return true;
        }

        if (value === correlativeValue) {
            return true;
        }

        return (
            this.label + '字段应与' + (correlativeLabel || '确认') + '字段相同'
        );
    },
    date: function (value) {
        if (isEmpty(value)) {
            return true;
        }

        if (isValidDate(value)) {
            return true;
        }

        return this.label + '数据格式不正确';
    },
    dateBefore: function (value, correlativeValue, correlativeLabel) {
        if (isEmpty(value)) {
            return true;
        }

        if (!isValidDate(value)) {
            return this.label + '数据格式不正确';
        }

        const timestamp = new Date(value).getTime();
        const correlativeTimestamp = new Date(correlativeValue).getTime();

        if (timestamp < correlativeTimestamp) {
            return true;
        }

        return this.label + '应早于' + correlativeLabel;
    },
    dateAfter: function (value, correlativeValue, correlativeLabel) {
        if (isEmpty(value)) {
            return true;
        }

        if (!isValidDate(value)) {
            return this.label + '数据格式不正确';
        }

        const timestamp = new Date(value).getTime();
        const correlativeTimestamp = new Date(correlativeValue).getTime();

        if (timestamp < correlativeTimestamp) {
            return this.label + '不能早于' + correlativeLabel;
        }

        return true;
    },
    password: function (value, level, isIncontinuity) {
        if (isEmpty(value)) {
            return true;
        }

        let msg = isStrongPassword(value, level);
        if (msg !== true) {
            return (
                this.label +
                '至少包含大小写字符、数字和特殊字符中的' +
                level +
                '种或以上'
            );
        }

        if (isIncontinuity) {
            msg = isIncontinuityString(value);
            if (msg !== true) {
                return this.label + '不能包含3个或以上的连续相邻字母或数字';
            }
        }

        return true;
    },
    list: function (value, options) {
        if (isEmpty(value)) {
            return true;
        }

        if (options.indexOf(value) > -1) {
            return true;
        }

        return this.label + '字段不能选择' + value;
    },
};

FieldValidator.prototype.assert = function (value, callback) {
    let isRequiredRuleChecked = false;
    const messages = [];
    const firstRule = this.rules && this.rules[0];
    if (firstRule && firstRule.name === 'required') {
        let argv;
        argv = [].concat(value);

        const validator = this.methods.required;
        let flag = validator.apply(this, argv);
        isRequiredRuleChecked = true;

        if (flag !== true) {
            callback &&
                callback({
                    key: this.key,
                    label: this.label,
                    messages: [flag],
                });
            return;
        }
    }

    let i = isRequiredRuleChecked ? 1 : 0;
    for (; i < this.rules.length; i++) {
        let rule = this.rules[i];

        if (rule.validator) {
            let argv = [].concat(value, this.dynamicParams[rule.name] || []);

            if (typeof rule.validator !== 'function') {
                throw new Error(`[${this.key}] validator must be function`);
            }

            let flag = rule.validator.apply(this, argv);

            if (flag !== true) {
                messages.push(flag);
            }
        } else {
            let argv;
            if (
                ['equalTo', 'dateBefore', 'dateAfter'].indexOf(rule.name) > -1
            ) {
                argv = [].concat(value, this.dynamicParams[rule.name] || []);
            } else {
                argv = [].concat(value, rule.params);
            }

            const validator = this.methods[rule.name];

            let flag = validator.apply(this, argv);

            if (flag !== true) {
                messages.push(flag);
            }
        }
    }

    callback &&
        callback(
            messages.length === 0
                ? true
                : {
                      key: this.key,
                      label: this.label,
                      messages,
                  }
        );
};

module.exports = FieldValidator;
