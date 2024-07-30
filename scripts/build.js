import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import sassPlugin from "esbuild-plugin-sass";
import postCssPlugin from "esbuild-style-plugin";
import { copy } from "esbuild-plugin-copy";
import sveltePreprocess from "svelte-preprocess"
import { preprocessMeltUI, sequence } from "@melt-ui/pp";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const args = process.argv.slice(2);
const watch = args.includes("--watch");
const deploy = args.includes("--build");

const plugins = [
  sassPlugin(),
  postCssPlugin({
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  }),
  sveltePlugin({
    preprocess: sequence([sveltePreprocess(), preprocessMeltUI()]),
  }),
  copy({
    // this is equal to process.cwd(), which means we use cwd path as base path to resolve `to` path
    // if not specified, this plugin uses ESBuild.build outdir/outfile options as base path.
    resolveFrom: "cwd",
    assets: [
      {
        from: ["./static/*"],
        to: ["./build/static"],
        keepStructure: true,
      },
      {
        from: ["manifest.json"],
        to: ["./build/manifest.json"],
      },
    ],
  }),
];

let opts = {
  entryPoints: [
    "src/nice-select2.js",
    // "src/nice-select2.css",
    "src/content.js",
    "src/searchTable.js",
    // "src/content.css",
  ],
  mainFields: ["svelte", "browser", "module", "main"],
  conditions: ["svelte", "browser"],

  bundle: true,
  minify: false,
  outdir: "build",
  plugins: plugins,
  loader: {
    ".js": "jsx",
    ".svg": "dataurl",
    ".html": "text",
  },
  logLevel: "info",
};

if (watch) {
  opts = {
    ...opts,
    sourcemap: "inline",
  };

  esbuild.context(opts).then((context) => {
    context.watch();
    console.log("Watching ....");
  });
}

if (deploy) {
  opts = {
    ...opts,
    minify: true,
  };

  console.log("Building release ...");
  esbuild.build(opts);
}
