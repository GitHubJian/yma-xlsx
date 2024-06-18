const FormsValidator = require('../src/forms-validator');

const forms = [
    {
        username: 'x',
        password: 'P',
    },
    {
        username: 'x1',
        age: 'ac',
    },
    {
        username: 'x',
        age: '1',
    },
];

const rules = [
    {
        label: '用户名',
        key: 'username',
        rules: [
            'unique',
            'required',
            {
                validator: function (value, options, callback) {
                    setTimeout(function () {
                        callback && callback(value === 'x' ? true : 'xxxx 不合法');
                    });
                },
            },
        ],
    },
    {
        label: '密码',
        key: 'password',
        rules: [
            {
                name: 'password',
                params: [[0, 1, 2, 3]],
            },
        ],
    },
];

const formsValidator = new FormsValidator(rules);

formsValidator.assert(forms, function (data) {
    debugger;
    console.log(JSON.stringify(data));
});
