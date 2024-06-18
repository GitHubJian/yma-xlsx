import '@/lib/util/reset.css';

import YmaComponent from 'yma-component';

import Vue from 'vue';
import App from './app.vue';

Vue.use(YmaComponent);

new Vue({
    render: h => h(App),
}).$mount('#app');
