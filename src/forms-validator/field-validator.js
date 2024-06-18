const {isValidDate, isStrongPassword, COMBINATION, isEmpty, isFunction} = require('./util');
const UniqueContext = require('./unique-context');
const compose = require('./compose');
const methods = require('./methods');

function normalizeRule(rules) {
    let r = [];
    let rKey = [];
    rules.forEach(function (rule) {
        if (typeof rule === 'string') {
            rule = {
                name: rule,
            };
        }

        if (rule.name && rKey.indexOf(rule.name) === -1) {
            if (rule.name === 'required') {
                r.unshift(rule);
                rKey.unshift(rule.name);
            } else {
                r.push(rule);
                rKey.push(rule.name);
            }
        } else {
            r.push(rule);
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

FieldValidator.prototype.setDynamicParam = function setDynamicParam(key, value) {
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
    unique: function (value, options = {}) {
        let [uniqueContext, key] = options.params || [];

        if (!uniqueContext instanceof UniqueContext) {
            throw new Error("unique'arguments[1] must be an instance of UniqueContext");
        }

        uniqueContext = uniqueContext || {};
        if (uniqueContext.excludeAndupdate(key, value)) {
            return true;
        }

        return this.label + '(' + value + ')字段已经存在';
    },
    number: function (value, options = {}) {
        let [precision] = options.params || [];

        precision = Number(precision) < 1 ? 1 : precision;
        const re = new RegExp('^[-+]?(\\d*(\\.\\d{0,' + precision + '})?|\\.\\d{1,' + precision + '})$');

        if (re.test(value)) {
            return true;
        }

        return this.label + '字段精度为' + precision + '位的小数';
    },
    integer: function (value) {
        const re = /^[-+]?\d+$/;

        if (re.test(value)) {
            return true;
        }

        return this.label + '字段必须为整数';
    },
    positiveNumber: function (value) {
        if (/^\+?\d+$/.test(value)) {
            return true;
        }

        return this.label + '字段必须为正整数';
    },
    negativeNumber: function (value) {
        const re = /^-\d+$/;

        if (re.test(value)) {
            return true;
        }

        return this.label + '字段必须为负整数';
    },
    min: function (value, options = {}) {
        let [param, include] = options.params || [];

        value = Number(value);
        param = Number(param);

        if (include ? value >= param : value > param) {
            return true;
        }

        let compareStr = include ? '大于等于' : '大于';
        return this.label + '字段应' + compareStr + ' ' + param;
    },
    max: function (value, options = {}) {
        let [param, include] = options.params || [];

        value = Number(value);
        param = Number(param);

        if (include ? value <= param : value < param) {
            return true;
        }

        let compareStr = include ? '小于等于' : '小于';
        return this.label + '字段应' + compareStr + ' ' + param;
    },
    range: function (value, options = {}) {
        let [min, minIncluded, max, maxIncluded] = options.params || [];

        min = Number(min);
        max = Number(max);

        if (minIncluded ? value >= min : value > min && maxIncluded ? value <= max : value.length < max) {
            return true;
        }

        let minCompareStr = minIncluded ? '大于等于' : '大于';
        let maxCompareStr = maxIncluded ? '小于等于' : '小于';
        return this.label + '字段应' + minCompareStr + ' ' + min + ' 并且' + maxCompareStr + ' ' + max;
    },
    minlength: function (value, options = {}) {
        let [param, include] = options.params || [];

        param = Number(param);

        if (include ? value.length >= param : value.length > param) {
            return true;
        }

        let compareStr = include ? '大于等于' : '大于';
        return this.label + '字段长度应' + compareStr + ' ' + param;
    },
    maxlength: function (value, options = {}) {
        let [param, include] = options.params || [];

        param = Number(param);

        if (include ? value.length <= param : value.length < param) {
            return true;
        }

        let compareStr = include ? '小于等于' : '小于';
        return this.label + '字段长度应' + compareStr + ' ' + param;
    },
    rangelength: function (value, options = {}) {
        let [min, minIncluded, max, maxIncluded] = options.params || [];

        min = Number(min);
        max = Number(max);

        const len = String(value).length;

        if ((minIncluded ? len >= min : len > min) && (maxIncluded ? len <= max : len < max)) {
            return true;
        }

        let minCompareStr = minIncluded ? '大于等于' : '大于';
        let maxCompareStr = maxIncluded ? '小于等于' : '小于';
        return this.label + '字段长度应' + minCompareStr + ' ' + min + ' 并且' + maxCompareStr + ' ' + max;
    },
    equalTo: function (value, options = {}) {
        let [correlativeValue, correlativeLabel] = options.dynamicParams || [];

        if (value === correlativeValue) {
            return true;
        }

        return this.label + '字段应与' + (correlativeLabel || '确认') + '字段相同';
    },
    date: function (value) {
        if (isValidDate(value)) {
            return true;
        }

        return this.label + '数据格式不正确';
    },
    dateBefore: function (value, options = {}) {
        let [correlativeValue, correlativeLabel] = options.dynamicParams || [];

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
    dateAfter: function (value, options) {
        let [correlativeValue, correlativeLabel] = options.dynamicParams || [];

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
    password: function (value, options = {}) {
        let [combination] = options.params;

        let msg = isStrongPassword(value, combination);

        let a =
            (combination.indexOf(COMBINATION.Capital) > -1 ? '大' : '') +
            (combination.indexOf(COMBINATION.Small) > -1 ? '小' : '');
        a = a.length > 0 ? a + '写字符' : '';
        let b = combination.indexOf(COMBINATION.Digit) > -1 ? '数字' : '';
        let c = combination.indexOf(COMBINATION.Special) > -1 ? '特殊字符' : '';
        let d = combination.indexOf(COMBINATION.Incontinuity) > -1 ? '且不连续按键' : '';

        let k = [a, b, c].filter(v => v).join('、');

        const message = [
            this.label,
            '至少包含',
            k,
            '中的',
            combination.length - (combination.indexOf(COMBINATION.Incontinuity) > -1 ? 1 : 0),
            '种' + d,
        ];

        if (msg !== true) {
            return message.join('');
        }

        return true;
    },
    list: function (value, options) {
        let [list] = options.params || [];

        if (list.indexOf(value) > -1) {
            return true;
        }

        return this.label + '字段不能选择' + value;
    },
};

function checkRequiredRule(rules) {
    for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];

        if (rule.name === 'required') {
            return true;
        }
    }

    return false;
}

function isRequiredRule(rule) {
    return rule.name === 'required';
}

FieldValidator.prototype.assert = function (value, callback) {
    const that = this;
    const middleware = [];
    const hasRequiredRule = checkRequiredRule(this.rules);
    for (let i = 0; i < this.rules.length; i++) {
        let rule = this.rules[i];
        let validator;
        if (isFunction(this.methods[rule.name])) {
            validator = function (value, options, callback) {
                const v = this.methods[rule.name];

                let flag = v.apply(this, [value, options]);

                callback(flag);
            };
        } else if (isFunction(rule.validator)) {
            validator = rule.validator;
        } else {
            throw new Error(`[${this.key}] validator must be function`);
        }

        middleware.push(
            function (ctx, next) {
                if (isRequiredRule(rule)) {
                    validator.apply(this, [
                        value,
                        {
                            params: rule.params,
                            dynamicParams: that.dynamicParams[rule.name] || [],
                            methods: methods,
                        },
                        function (flag) {
                            if (flag !== true) {
                                ctx.push(flag);
                            }

                            next();
                        },
                    ]);
                } else {
                    if (hasRequiredRule && isEmpty(value)) {
                        next();
                    } else {
                        validator.apply(this, [
                            value,
                            {
                                params: rule.params,
                                dynamicParams: that.dynamicParams[rule.name] || [],
                                methods: methods,
                            },
                            function (flag) {
                                if (flag !== true) {
                                    ctx.push(flag);
                                }

                                next();
                            },
                        ]);
                    }
                }
            }.bind(this),
        );
    }

    const fn = compose(middleware);
    const messages = [];
    fn(messages, function () {
        const ret =
            messages.length === 0
                ? true
                : {
                      key: that.key,
                      label: that.label,
                      messages,
                  };

        callback(ret);
    });
};

module.exports = FieldValidator;
