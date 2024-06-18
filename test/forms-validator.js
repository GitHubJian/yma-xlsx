const FormsValidator = require('../src/forms-validator');

const forms = [
    {
        username: '',
        age: '',
    },
    {
        username: 'x',
        age: 'ac',
    },
    {
        username: 'x',
        age: 'ac',
    },
];

const rules = [
    {
        label: '用户名',
        key: 'username',
        rules: ['unique','required'],
    },
    {
        label: '年龄',
        key: 'age',
        rules: ['positiveNumber'],
    },
];

const formsValidator = new FormsValidator(rules);

formsValidator.assert(forms, function (data) {
    console.log(JSON.stringify(data));
});
