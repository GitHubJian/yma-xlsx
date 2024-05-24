const ExcelJS = require('exceljs');
const dayjs = require('dayjs');

function formatValidationList(list) {
    let str = list.join(',');
    str = `"${str}"`;

    return [str];
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

exports.toBuffer = function toBuffer(data, errorMap, excelMap) {
    const errorKey = errorMap.key;
    const errorStyle = errorMap.style;
    const errorData = errorMap.data;

    const columnsMap = excelMap.column.config;

    const startRow = 1;
    const startCol = 0;

    const wb = new ExcelJS.Workbook();
    wb.properties.date1904 = true;
    const ws = wb.addWorksheet('Sheet1');

    let headingKey = [];
    let heading = [];
    Object.keys(columnsMap).forEach(function (colIndex) {
        const config = columnsMap[colIndex];

        headingKey.push(config.colKey);
        heading.push(config.colName);
    });

    ws.addRow(heading);

    for (let i = 0, iLen = data.length; i < iLen; i++) {
        const d = data[i];
        const row = [];
        const eData = errorData[d[errorKey]];
        const eCell = [];

        for (let j = 0, jLen = headingKey.length; j < jLen; j++) {
            const key = headingKey[j];
            const value = d[key];
            if (value instanceof Date) {
                row.push(
                    new Date(dayjs(value).format('YYYY-MM-DD HH:mm:ss z'))
                );
            } else {
                const colConf = columnsMap[j];
                const colConfValue = colConf.value;
                if (isPlainObject(colConfValue)) {
                    row.push(colConfValue[value]);
                } else if (isFunction(colConfValue)) {
                    row.push(colConfValue.call(null, value));
                } else {
                    row.push(value);
                }
            }

            if (eData && eData[key]) {
                eCell.push({
                    r: startRow + i + 1,
                    c: startCol + j + 1,
                });
            }
        }

        ws.addRow(row);

        eCell.forEach(({r, c}) => {
            if (errorStyle.font) {
                ws.getCell(r, c).font = errorStyle.font;
            }
        });
    }

    Object.keys(columnsMap).forEach((key, index) => {
        const filedMap = columnsMap[key];

        if (filedMap.width) {
            ws.getColumn(index + 1).width = filedMap.width;
        }

        ws.getColumn(index + 1).eachCell(function (cell, rowNumber) {
            if (rowNumber > 1) {
                if (filedMap.dataValidation) {
                    if (filedMap.dataValidation.type === 'list') {
                        cell.dataValidation = {
                            ...filedMap.dataValidation,
                            formulae: formatValidationList(
                                filedMap.dataValidation.formulae
                            ),
                        };
                    } else {
                        cell.dataValidation = filedMap.dataValidation;
                    }
                }

                if (filedMap.alignment) {
                    cell.alignment = filedMap.alignment;
                }

                if (filedMap.font) {
                    cell.font = filedMap.font;
                }
            }
        });
    });

    return wb.xlsx.writeBuffer();
};

exports.filetype =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

exports.blob = function blob(buf) {
    const blob = new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    return blob;
};
