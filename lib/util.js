const fs = require("fs");
const path = require("path");

function isEqual(prevList, curList) {
  if (prevList.length !== curList.length) {
    return false;
  }
  return prevList.reduce((res, item) => {
    return res && curList.includes(item);
  }, true);
}
function isReactComponent(filePath) {
  return /(j|t)sx/g.test(path.extname(filePath));
}
function findAllDir(filePath) {
  const stack = [filePath];
  const res = [];
  while (stack.length > 0) {
    const _path = stack.shift();
    const files = fs.readdirSync(_path);
    files.forEach(function(filename) {
      const _filePath = path.join(_path, filename);
      const stats = fs.statSync(_filePath);
      if (stats.isDirectory()) {
        stack.unshift(_filePath);
      } else if (stats.isFile() && isReactComponent(_filePath)) {
        res.push(_path);
      }
    });
  }
  return res.slice(1);
}

module.exports = {
  isEqual,
  findAllDir
};
