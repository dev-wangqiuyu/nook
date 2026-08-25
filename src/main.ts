import { createApp } from "vue";
import { addCollection } from "@iconify/vue";
import { icons as lucide } from "@iconify-json/lucide";

import App from "@/App.vue";
import { pinia } from "@/stores";
import router from "@/router";
import "@/assets/styles/tokens.css";

// 离线注册图标集：@iconify/vue 默认从 API 拉图标=网络请求，违反硬约束 #9。
// 装本地数据包 + addCollection，全程离线渲染。
addCollection(lucide);

const app = createApp(App);
app.use(pinia);
app.use(router);
app.mount("#app");
