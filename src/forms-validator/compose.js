function compose(middleware) {
    return function (context, next) {
        let index = -1;

        function dispatch(i) {
            if (i <= index) {
                throw new Error('next() called multiple times');
            }

            index = i;
            let fn = middleware[i];
            if (i === middleware.length) {
                fn = next;
            }

            fn(context, dispatch.bind(null, i + 1));
        }

        return dispatch(0);
    };
}

module.exports = compose;
