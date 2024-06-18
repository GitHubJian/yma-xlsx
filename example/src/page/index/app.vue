<template>
    <yma-reader
        :style="{ width: '100%' }"
        :accept="['xlsx']"
        type="buffer"
        @content="fileReaderHandler"
    />
</template>

<script>
import xlsx from "../../../../src/index";

export default {
    data() {
        return {};
    },
    methods: {
        fileReaderHandler(content) {
            const fieldMap = {
                "用户名（必填）": "username",
                "企业名称（必填）": "businessname",
                "手机（选填）": "mobile",
                "备注（选填）": "company",
                "开始日期（必填）": "authstarttime",
                "截止日期（必填）": "authendtime",
                "订单编号（选填）": "orderid",
                "订单明细ID（选填）": "orderdetailid",
                "是否限制字/次（必填）": "limitwordscount",
                "授权字/次数（必填）": "count",
            };
            const fieldRules = [
                {
                    key: "username",
                    label: "用户名",
                    rules: ["required", "unique"],
                },
                {
                    key: "businessname",
                    label: "企业名称",
                    rules: ["required"],
                },
                {
                    key: "authstarttime",
                    label: "开始日期",
                    rules: ["required", "date"],
                },
                {
                    key: "authendtime",
                    label: "截止日期",
                    rules: [
                        "required",
                        "date",
                        {
                            name: "dateAfter",
                            correlative: "authstarttime",
                        },
                    ],
                },
                {
                    key: "limitwordscount",
                    label: "是否限制字/次",
                    rules: [
                        "required",
                        {
                            name: "list",
                            params: [["限制", "不限制"]],
                        },
                    ],
                },
            ];
            const buffer = new Uint8Array(content);

            xlsx.parse(buffer, "Sheet1", {
                startLine: 2,
                fieldsNameLine: 1,
                fieldMap,
                fieldRules,
            }).then((res) => {
                debugger;
            });
        },
    },
};
</script>

<style lang="scss">
</style>
