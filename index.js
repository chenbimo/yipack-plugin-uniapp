let path = require('path');
let fs = require('fs-extra');
let fastGlob = require('fast-glob');
let clearModule = require('clear-module');
// 项目目录
let rootDirectory = process.cwd();
// 源码目录
let srcDirectory = path.join(rootDirectory, 'src');
class YipackPluginUniapp {
    constructor(pluginOptions) {
        this.options = pluginOptions;
    }
    apply(compiler) {
        compiler.hooks.watchRun.tap('yipack-plugin-uniapp', (stats) => {
            // 获取 yipack-cli 配置文件
            let yipackConfigPath = path.join(rootDirectory, 'yipack.config.js');
            // 清除 yipack-cli 配置文件
            clearModule(yipackConfigPath);
            // 清除后获取最新的 yipack-cli 配置文件
            let yipackConfig = require(yipackConfigPath);
            // 获取所有的路由文件
            let files = fastGlob.sync(['**/route.js'], {
                cwd: path.join(srcDirectory, 'pages'),
                absolute: true,
                onlyFiles: true
            });
            let routeArray = [];

            // 初始化赋值路由配置文件
            let createPageData = require(path.join(srcDirectory, 'createPages.js'));

            // 分包名称数组
            let subPackagesNames = [];
            let subPackagesObject = {};
            createPageData.subPackages.forEach((item) => {
                subPackagesNames.push(item.root);
                subPackagesObject[item.root] = item;
            });
            // 循环所有文件
            files.forEach((file) => {
                // 从绝对路径中截取出来的路由部分路径
                let partPath = path.relative(srcDirectory, file).replace('route.js', 'index').split(path.sep).join('/');
                let subPackageName = '';
                // 是否属于子包
                let isSubPackage = subPackagesNames.some((name) => {
                    let reg = new RegExp(name, 'g');
                    let isExists = reg.test('^' + partPath);
                    if (isExists === true) {
                        subPackageName = name;
                        return true;
                    } else {
                        return false;
                    }
                });
                // 清理路由缓存文件
                clearModule(file);

                // 获得页面的路由配置
                let pageJson = require(file);

                if (isSubPackage === true) {
                    let currentPath = partPath.replace(subPackageName + '/', '');
                    let subPages = subPackagesObject[subPackageName].pages;
                    // 是否存在路径
                    let isExistsPath = subPages.some((item) => item.path === currentPath);
                    if (isExistsPath === false) {
                        pageJson.path = currentPath;
                        subPages.push(pageJson);
                    }
                } else {
                    // 如果当前文件没有指定路径，则用自动生成的路径
                    // if (!pageJson.path) {
                    //     pageJson.path = partPath;
                    // }
                    pageJson.path = partPath;

                    // 如果需要默认显示哪个页面
                    if (yipackConfig.currentPage && yipackConfig.currentPage === partPath) {
                        routeArray.unshift(pageJson);
                    } else {
                        routeArray.push(pageJson);
                    }
                }
            });

            createPageData.pages = routeArray;
            fs.writeFileSync(path.join(srcDirectory, 'pages.json'), JSON.stringify(createPageData));
            console.log('===============');
            console.log('pages.json已生成');
        });
    }
}
module.exports = YipackPluginUniapp;
