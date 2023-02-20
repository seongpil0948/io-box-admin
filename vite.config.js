import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";
import Components from "unplugin-vue-components/vite";
import eslintPlugin from "vite-plugin-eslint";
import vueJsx from "@vitejs/plugin-vue-jsx";

export default defineConfig({
  resolve: {
    alias: [{ find: "@", replacement: "/src" }],
  },
  optimizeDeps: {
    exclude: [
      // 여기에 넣으면 모듈을 아예 불러오질 못함..
      // "firebase,"
      "firebase-admin",
    ],
    include: ["@io-boxies/js-lib", "@io-boxies/vue-lib"],
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
  plugins: [
    vue(),
    vueJsx(),
    Components({
      extensions: ["vue", "md", "svg", "tsx"],
      // directoryAsNamespace: true,
      dts: true,
      // globalNamespaces: ["global"],
      dirs: ["src/component", "src/view"],
      deep: true,
      exclude: [
        /[\\/]node_modules[\\/]/,
        /[\\/]\.git[\\/]/,
        /[\\/]\.nuxt[\\/]/,
        /[\\/]\.public[\\/]/,
        /[\\/]\.vscode[\\/]/,
        /[\\/]\.plugins[\\/]/,
        /[\\/]\.assets[\\/]/,
        /[\\/]\.store[\\/]/,
      ],
      include: [/\.vue$/, /\.md$/, /\.vue\?vue/, /\.tsx/],
      resolvers: [
        NaiveUiResolver(),
        // (name) => {
        //   console.log("name:", name);
        //   if (name === "MyCustom")
        //     return path
        //       .resolve(__dirname, "src/CustomResolved.vue")
        //       .replaceAll("\\", "/");
        // },
        // IconsResolver({
        //   componentPrefix: "i",
        // }),
      ],
    }),
    eslintPlugin(),
  ],
});
// pwa: {
//   appleMobileWebAppCapable: "yes",
//   name: "inout-box-admin",
//   workboxPluginMode: "GenerateSW",
// },
