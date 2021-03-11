let path = require("path");
let fs = require("fs-extra");
let fastGlob = require("fast-glob");
let clearModule = require("clear-module");
class YipackPluginUniapp {
    apply(compiler) {
        compiler.hooks.watchRun.tap("yipack-plugin-uniapp", (stats) => {
            let files = fastGlob.sync(["**/route.js"], {
                cwd: path.join(process.cwd(), "src", "pages"),
                absolute: true,
                onlyFiles: true,
            });
            let routeArray = [];
            files.forEach((file) => {
                let d = path.relative(path.join(process.cwd(), "src"), file).replace("route.js", "index").split(path.sep).join("/");
                clearModule(file);
                if (d === "pages/index/index") {
                    routeArray.unshift(require(file));
                } else {
                    routeArray.push(require(file));
                }
            });
            let createPageData = require(path.join(process.cwd(), "src", "createPages.js"));
            createPageData.pages = routeArray;
            fs.writeFileSync(path.join(process.cwd(), "src", "pages.json"), JSON.stringify(createPageData));
            console.log("===============");
            console.log("pages.json已生成");
        });
    }
}
module.exports = YipackPluginUniapp;
