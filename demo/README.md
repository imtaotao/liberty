## 如何运行
这个是一个 demo，下面几个步骤能够快速的运行起来这个 demo，但是需要两个全局包（如果你没有装过的话）
+ `http-server` 静态服务器
+ `get-repo-dir` 下载文件

## 步骤
**下载文件存放路**径如果没有，默认为当前路径，但是 http-server 启动需要手动指定当前路径为 `./`

+ step 1: run `npm i http-server get-repo-dir -g`
+ step 2: run `repo download https://github.com/imtaotao/liberty -d demo -l 下载文件存放路径`
+ step 3: run `http-server 下载文件存放路径`
+ step 4: 浏览器中打开 `localhost:8080/index.html`