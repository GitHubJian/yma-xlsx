const ExcelJS = require('exceljs');
const dayjs = require('dayjs');

function formatValidationList(list) {
    let str = list.join(',');
    str = `"${str}"`;

    return [str];
}

function write(data, filedMap, dataHighlightMap, callback) {
    const startRow = 1;
    const startCol = 1;

    const wb = new ExcelJS.Workbook();
    wb.properties.date1904 = true;
    const ws = wb.addWorksheet('Sheet1');

    let dataKeySort = [];
    let headingRow = [];
    const filedKeys = Object.keys(filedMap);
    // 设置表格头
    filedKeys.forEach(function (key) {
        const filedOptions = filedMap[key];

        dataKeySort.push(filedOptions.dataKey);
        headingRow.push(filedOptions.columnName);
    });
    ws.addRow(headingRow);

    // 添加数据
    for (let i = 0, iLen = data.length; i < iLen; i++) {
        const item = data[i];
        const dataHighlightKeyList = dataHighlightMap[i] || [];
        const highlightCellPos = [];

        const dataRow = [];
        for (let j = 0, jLen = dataKeySort.length; j < jLen; j++) {
            const key = dataKeySort[j];
            const value = item[key];
            const filedOptions = filedMap[j];

            if (filedOptions.dataType === 'date' || value instanceof Date) {
                dataRow.push(dayjs(value).format('YYYY/M/D'));
            } else {
                dataRow.push(value);
            }

            if (dataHighlightKeyList.indexOf(key) > -1) {
                highlightCellPos.push({
                    r: startRow + i + 1,
                    c: startCol + j,
                });
            }
        }

        ws.addRow(dataRow);

        highlightCellPos.forEach(pos => {
            const {r, c} = pos;

            ws.getCell(r, c).font = {
                color: {
                    argb: 'BB2726',
                },
            };
        });
    }

    // 设置列的数据校验
    filedKeys.forEach((key, filedKeyIndex) => {
        const filedOptions = filedMap[key];
        const {columnStyle, headingStyle, dataStyle, dataValidation} = filedOptions;

        // 设置 Column 样式
        if (columnStyle && columnStyle.alignment) {
            ws.getColumn(startCol + filedKeyIndex).alignment = columnStyle.alignment;
        }

        if (columnStyle && columnStyle.width) {
            ws.getColumn(startCol + filedKeyIndex).width = columnStyle.width;
        }

        if (columnStyle && columnStyle.numFmt) {
            ws.getColumn(startCol + filedKeyIndex).numFmt = columnStyle.numFmt;
        }

        ws.getColumn(startCol + filedKeyIndex).eachCell(function (cell, rowIndex) {
            if (startRow < rowIndex) {
                // 设置数据单元格样式
                if (dataStyle && dataStyle.font) {
                    cell.font = dataStyle.font;
                }

                // 设置单元格数据校验

                if (dataValidation) {
                    if (dataValidation.type === 'list') {
                        cell.dataValidation = {
                            ...dataValidation,
                            formulae: formatValidationList(dataValidation.formulae),
                        };
                    } else {
                        cell.dataValidation = dataValidation;
                    }
                }
            }
        });
    });

    if (callback) {
        wb.xlsx.writeBuffer().then(callback);
    } else {
        return wb.xlsx.writeBuffer();
    }
}
module.exports = write;
