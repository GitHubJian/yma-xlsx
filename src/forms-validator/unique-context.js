function UniqueContext() {
    this.context = {};
}

UniqueContext.prototype.init = function init(key) {
    this.context[key] = [];
};

UniqueContext.prototype.excludeAndupdate = function exclude(key, value) {
    const unique = this.context[key] || [];

    const flag = unique.indexOf(value) === -1;

    if (flag) {
        this.update(key, value);
    }

    return flag;
};

UniqueContext.prototype.update = function update(key, value) {
    this.context[key] = this.context[key] || [];
    this.context[key].push(value);
};

module.exports = UniqueContext;
