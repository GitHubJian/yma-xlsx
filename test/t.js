const {toBuffer} = require('../src/to-blob');
const fse = require('fs-extra');
const path = require('path');

toBuffer(
    [
        {
            name: 1,
            date: new Date('2024/05/24'),
            list: '限制',
        },
        {
            name: '张三',
            date: new Date('2024/05/24'),
            list: '不限制',
            errmsg: '错误信息',
        },
    ],
    {
        key: 'name',
        style: {
            font: {
                color: {
                    argb: 'BB2726',
                },
            },
        },
        data: {
            张三: {
                name: '该用户名已存在',
            },
        },
    },
    {
        column: {
            config: [
                {
                    colKey: 'name',
                    colName: '用户名',
                    alignment: {
                        horizontal: 'left',
                        vertical: 'middle',
                    },
                    width: 20,
                },
                {
                    colKey: 'date',
                    colName: '时间',
                    alignment: {
                        horizontal: 'left',
                        vertical: 'middle',
                    },
                    width: 40,
                },
                {
                    colKey: 'list',
                    colName: '限制',

                    type: 'list',
                    alignment: {
                        horizontal: 'left',
                        vertical: 'middle',
                    },
                    dataValidation: {
                        type: 'list',
                        allowBlank: false,
                        formulae: ['限制', '不限制'],
                    },
                    width: 40,
                },
                {
                    colKey: 'errmsg',
                    colName: '错误信息',

                    font: {
                        color: {
                            argb: 'BB2726',
                        },
                    },
                },
            ],
        },
    },
).then(buf => {
    fse.writeFileSync(path.resolve(__dirname, 'output.xlsx'), buf);
});
