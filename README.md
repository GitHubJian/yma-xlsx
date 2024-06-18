# YMA XLSX

解析 excel 类型的文件为 JS Array<Object>

## Install

```sh
npm install yma-xlsx
```

## Usage

```js
const {readFile, parseSheet} = require('yma-xlsx');
const wb = xlsx.readFile(filepath);
const obj = xlsx.parseSheet(workbook.sheets['Sheet1'], {
    startLine: 2,
    fieldsNameLine: 1,
    fieldsMap: {
        字段1: 'field1',
        字段2: {
            key: 'field2',
            value: {
                是: 1,
                否: 0,
            },
        },
        字段3: {
            key: 'field3',
            value: function (val) {
                return val;
            },
        },
    },
});
```
