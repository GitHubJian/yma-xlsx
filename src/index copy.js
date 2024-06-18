const ExcelJS = require('exceljs');
const {toBuffer, blob} = require('./to-blob');

class SheetParser {
    constructor(sheet) {
        this.sheet = sheet;
        this.mergedMap = this.parseMergedMap();

        const [refText, startCol, startLine, endCol, endLine] =
            /^([A-Za-z]+)([0-9]+):([A-Za-z]+)([0-9]+)/.exec(
                this.sheet['!ref']
            ) || [0, 0, 0, 0, 0];

        // if(String(startCol).length > 1 || String(endCol).length > 1){
        //     throw `excel列过多，只能解析A-Z列，已接受${startCol}:${endCol}`;
        // }

        this.startCol = startCol;
        this.startLine = startLine;
        this.endCol = endCol;
        this.endLine = endLine;
    }

    travel(pos, callback) {
        let {startCol, endCol, startLine, endLine} = Object.assign(
            {},
            this,
            pos
        );

        const startColCode = this.getNumberByName(startCol);
        const endColCode = this.getNumberByName(endCol);

        let curLine = +startLine;
        while (curLine <= +endLine) {
            let col = startColCode;

            while (col <= endColCode) {
                let colName = this.getNameByNumber(col);
                let cellName = colName + curLine;
                let mergedCellName = this.findMergedCell(
                    cellName,
                    this.mergedMap
                );
                if (mergedCellName === cellName) {
                    mergedCellName = undefined;
                }

                let isMerged = !!mergedCellName;

                callback.call(this, {
                    parser: this,
                    colName,
                    curLine,
                    cellName,
                    isMerged,
                    mergedCellName,
                    cellValue: this.getCellValue(cellName),
                    mergedCellValue: this.getCellValue(mergedCellName),
                });

                col++;
            }

            curLine++;
        }
    }

    // 获取单元格value
    getCellValue(cellName) {
        return cellName && this.sheet[cellName]
            ? this.sheet[cellName].v
            : undefined;
    }

    // 解析单元格名字
    parseCellCL(cellName) {
        return /^([A-Za-z]+)([0-9]+)$/.exec(cellName);
    }

    // 获取merge的单元格的cellname
    findMergedCell(cellName) {
        const [cell, cellCol, cellLine] = this.parseCellCL(cellName);
        let result;

        this.mergedMap.some(mergedInfo => {
            if (
                cellCol >= mergedInfo.startCol &&
                cellCol <= mergedInfo.endCol &&
                cellLine >= mergedInfo.startLine &&
                cellLine <= mergedInfo.endLine
            ) {
                result = mergedInfo.startCol + mergedInfo.startLine;
                return true;
            }
        });

        return result;
    }

    // 获取单元格 A-Z 的 1到26的 map
    getCellMap() {
        let map = {};

        for (let index = 0; index < 26; index++) {
            map[String.fromCharCode(index + 65)] = index + 1;
        }

        return map;
    }

    // 根据数字获取单元格名称
    getNameByNumber(num) {
        let nameMap = this.getCellMap();

        let resultArr = [];

        let getSum = pos => {
            let sum = 0;
            for (let index = 0; index <= pos; index++) {
                sum += 26 * Math.pow(26, index);
            }

            return sum;
        };

        // 计算最高是几位
        let highPos = 0;
        while (num > getSum(highPos)) {
            highPos++;
        }

        let remain = num;

        for (; highPos >= 0; highPos--) {
            let cur = Math.floor(remain / Math.pow(26, highPos));

            if (highPos >= 1 && remain % Math.pow(26, highPos) === 0) {
                cur--;
            }

            remain -= cur * Math.pow(26, highPos);

            let char = Object.keys(nameMap).find(item => nameMap[item] === cur);

            resultArr.push(char);
        }

        return resultArr.join('');
    }

    // 根据单元格名字获取数字
    getNumberByName(name) {
        let nameMap = this.getCellMap();

        let sum = 0;

        let arr = name.split('').reverse();

        arr.forEach((item, index) => {
            sum += nameMap[item] * Math.pow(26, index);
        });

        return sum;
    }

    parseMergedMap() {
        return (this.sheet['!merges'] || []).map(d => {
            return {
                startCol: String.fromCharCode(d.s.c + 'A'.charCodeAt()),
                endCol: String.fromCharCode(d.e.c + 'A'.charCodeAt()),
                startLine: d.s.r + 1,
                endLine: d.e.r + 1,
            };
        });
    }
}

function isString(val) {
    return typeof val === 'string';
}

function isFunction(val) {
    return typeof val === 'function';
}

function isPlainObject(val) {
    return Object.prototype.toString.call(val) === '[object Object]';
}

function normalize(fieldsMap) {
    const newFieldsMap = Object.keys(fieldsMap).reduce(function (prev, cur) {
        const config = fieldsMap[cur];
        if (isString(config)) {
            prev[cur] = {
                key: config,
                value: function (value) {
                    return value;
                },
            };
        } else if (isPlainObject(config)) {
            const value = config.value;
            if (isPlainObject(value)) {
                config.value = (function (enums) {
                    return function (value) {
                        return enums[value];
                    };
                })(value);
            } else if (isFunction(value)) {
                config.value = value;
            } else {
                console.log(
                    `[fieldsMap.${cur}.value] must be a function or a object`
                );
            }

            prev[cur] = config;
        }

        return prev;
    }, {});

    return newFieldsMap;
}

function parse(
    buffer,
    sheetname,
    {
        startLine = 2,
        endLine = 0,
        fieldsNameLine = 1,
        fieldsMap = {},
        fieldsRule = [],
    }
) {
    const workbook = new ExcelJS.Workbook();

    return workbook.xlsx.load(buffer).then(workbook => {
        const ws = workbook.getWorksheet(sheetname);
        const sheet = new SheetParser(ws);

        let limit = {};
        if (startLine) {
            limit.startLine = startLine;
        }
        if (endLine) {
            limit.endLine = endLine;
        }

        fieldsMap = normalize(fieldsMap);

        let lines = [];
        sheet.travel(
            limit,
            function ({
                colName,
                curLine,
                isMerged,
                cellValue,
                mergedCellValue,
            }) {
                if (!lines[+curLine]) {
                    lines[+curLine] = {};
                }

                let line = lines[+curLine];

                let fieldConfig = fieldsMap[
                    fieldsNameLine
                        ? this.getCellValue(colName + fieldsNameLine)
                        : colName
                ] || {
                    key: colName,
                    value: function (_) {
                        return _;
                    },
                };

                const fieldName = fieldConfig.key;
                const convert = fieldConfig.value;

                let value = !isMerged ? cellValue : mergedCellValue;
                value = value !== undefined ? String(value).trim() : value;

                line[fieldName] = convert(value);
            }
        );

        return lines.filter(v => !!v);
    });
}

exports.parse = parse;

exports.toBuffer = toBuffer;
exports.blob = blob;
