<template>
    <yma-reader
        :style="{ width: '100%' }"
        :accept="['xlsx']"
        type="buffer"
        @content="fileReaderHandler"
    />
</template>

<script>
import xlsx from '../../../../src/index';
import dayjs from 'dayjs';

export default {
    data() {
        return {};
    },
    methods: {
        fileReaderHandler(content) {
            const fieldMap = {
                '用户名（必填）': {
                    key: 'username',
                    label: '用户名',
                    rules: ['required', 'unique'],
                },
                '企业名称（必填）': {
                    key: 'businessname',
                    label: '企业名称',
                    rules: ['required'],
                },
                '手机（选填）': 'mobile',
                '备注（选填）': 'company',
                '开始日期（必填）': {
                    key: 'authstarttime',
                    value: function (val) {
                        const res = dayjs(val).format('YYYY-MM-DD');

                        return res;
                    },
                    label: '开始日期',
                    rules: ['required', 'date'],
                },
                '截止日期（必填）': {
                    key: 'authendtime',
                    value: function (val) {
                        const res = dayjs(val).format('YYYY-MM-DD');

                        return res;
                    },
                    label: '截止日期',
                    rules: ['required', 'date'],
                },
                '订单编号（选填）': 'orderid',
                '订单明细ID（选填）': 'orderdetailid',
                '是否限制字/次（必填）': {
                    key: 'limitwordscount',
                    value: {
                        限制: 1,
                        不限制: 0,
                    },
                    label: '是否限制字/次',
                    rules: [
                        'required',
                        {
                            name: 'list',
                            params: [['限制', '不限制']],
                        },
                    ],
                },
                '授权字/次数（必填）': {
                    key: 'count',
                    label: '授权字/次数',
                    rules: [
                        {
                            validator: function (value, options, callback) {
                                const [correlativeValue, correlativeLabel]
                                    = options.dynamicParams;

                                if (!correlativeValue) {
                                    callback(true);
                                }
                                else {
                                    if (correlativeValue === '限制') {
                                        if (options.methods.isRequired(value)) {
                                            if (
                                                options.methods.isPositiveNumber(
                                                    value
                                                )
                                            ) {
                                                callback(true);
                                            }
                                            else {
                                                callback(
                                                    this.label + '必须为正整数'
                                                );
                                            }
                                        }
                                        else {
                                            callback(this.label + '为必填项');
                                        }
                                    }
                                    else if (correlativeValue === '不限制') {
                                        callback(true);
                                    }
                                }
                            },
                            correlative: 'limitwordscount',
                        },
                    ],
                },
            };

            const buffer = new Uint8Array(content);

            xlsx.parse(buffer, 'Sheet1', {
                startLine: 2,
                fieldsNameLine: 1,
                fieldMap,
            }).then(res => {
                debugger;
            });
        },
    },
};
</script>

<style lang="scss">
</style>
