const { isEqual, findAllDir } = require("./util");
const path = require("path");
const fs = require("fs");

function writeAppFile(filepath, routePathList, lazy) {
  const { importStr, routeStr } = routePathList.reduce(
    (res, cur) => {
      let { importStr, routeStr } = res;
      const importPath = `"${cur.replace(/\\/g, "/")}"`;
      let component = cur.split("\\").pop();
      let routePath = component.toLowerCase();
      if (/#/g.test(component)) {
        routePath = routePath.replace(/#/g, "/:");
        component = component.replace(/#.*/g, "");
      }

      if (lazy) {
        importStr += `const ${component} = lazy(() => import(/* webpackChunkName: "${component}-lazy" */ ${importPath}));`;
      } else {
        importStr += `import ${component} from ${importPath};`;
      }
      routeStr += `<Route path="/${routePath}" component={${component}} />`;
      return {
        importStr,
        routeStr
      };
    },
    {
      importStr: "",
      routeStr: ""
    }
  );
  const content = `
    import * as React from "react";
    ${lazy && `import { Suspense, lazy } from 'react';`}
    import { Router, Route, Switch } from "react-router-dom";
    ${importStr}
    import { createHashHistory } from "history";
    const history = createHashHistory();
    export default function App() {
      return (
        ${lazy && `<Suspense fallback={<Loading />}>`}
        <Router history={history}>
          <Switch>
            ${routeStr}
          </Switch>
        </Router>
        ${lazy && `</Suspense>`}
      );
    }
  `;
  fs.writeFile(filepath, content, err => {
    if (err) throw err;
    console.log("文件已被保存");
  });
}

class RouteFromContainerPlugin {
  constructor(options) {
    this.options = options;
    this.lastRoutePathList = [];
  }
  apply(compiler) {
    const containerFolder = path.resolve("./src/container");
    const appPath = path.resolve(containerFolder, "./App.jsx");
    compiler.hooks.watchRun.tapAsync(
      "RouteFromContainerPlugin",
      (compiler, callback) => {
        // const mtimes = compiler.watchFileSystem.watcher.mtimes;
        // const watchFileList = Object.keys(mtimes);
        const routePathList = findAllDir(containerFolder);
        if (!isEqual(this.lastRoutePathList, routePathList)) {
          writeAppFile(appPath, routePathList, this.options.lazy);
          this.lastRoutePathList = routePathList;
        }
        callback();
      }
    );
  }
}

module.exports = RouteFromContainerPlugin;
