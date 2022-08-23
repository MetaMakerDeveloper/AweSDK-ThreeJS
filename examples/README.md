# Examples

## examples

例子中引用的是打包之后的 metamaker_for_three 的代码。

```html
<script src="./three/build/three.js"></script>
<script src="./three/examples/js/controls/OrbitControls.js"></script>
<script src="/libs/metamaker-for-three.js"></script>
```

注意引入的顺序。threejs 需要先被引入。可以将`/examples/three`中直接拷到本地应用中，或者自行从`threejs`,`github`中下载

**注意：目前项目中引用的 threejs 版本为 0.142.0**

## 启动 examples

1. 如果您有本地的服务器，那么直接将本地服务器连接到该文件夹即可
2. 如果没有本地服务器，通过以下命令安装

```shell
npm install live-server -g
cd human-three-example
live-server start
```

点击 examples/example.html 可以查看到改项目
