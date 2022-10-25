# human-three-example

## 项目安装

```
yarn install
```

### 开发模型

```
yarn serve
```

### 打包为 lib

```
yarn build:lib
```

## 前置

1. 如果您不是使用 npm 进行开发，请先前往 [threejs git](https://github.com/mrdoob/three.js) 下载 build/three.min.js 引入到项目中，再加载 meta-maker-for-three。

2. npm : npm install three

## 说明

这是黑镜数字人结合 threejs 使用的一个例子。本例子提供了结合 threejs 中 3 个关键点，

1. 数字人的加载
2. 数字人物的语音与口型动画的播放
3. TTS 语音鉴权代码

其余情况，直接使用 threejs 相关功能完成

### 引入 metamaker-for-three

1. 通过 npm

metamaker-for-three 暂时没有上 npm，通过在 packagejson 中添加 github 的地址，并进行 yarn install

```
  "dependencies": {
    "metamaker-for-three": "https://github.com/MetaMakerDeveloper/AweSDK-ThreeJS.git#<版本号>"
  }
```

在无法连接 github 的情况下使用 gitee 连接

```
  "dependencies": {
    "metamaker-for-three": "https://gitee.com/metamaker/AweSDK-ThreeJS.git#<版本号>"
  }
```

2.  直接在[链接中](https://github.com/MetaMakerDeveloper/AweSDK-ThreeJS)的 libs 下载文件通过

```
<script src="<您的js存放地址>/metamaker-for-three.js"></script>
```

### 数字人加载

数字人目前支持 gltf,zip 包含的 glb 模型 人物，开发者从黑镜开放平台，获得数字人模型文件后，通过调用。

进行模型的加载，随后添加到场景中

## 注意

MetaMakerDeveloper 发布的代码或数字资产（数字人、服装、动作、表情等）以及试用数字人小镜、大黑都属于黑镜科技公司，如需商用，请添加以下二维码联系，谢谢！

![image](./code.jpg)

## 更新日志
2022-10-25:动画资源请求路径重复出现/符

2022-09-07:example 增加动作 Loop 设置，请求动作时增加库的版本号。

2022-09-02: 处理部分动作补间，导致模型的踢腿动作，core 中增加 resetPolyonOffset 处理人物模型穿模问题 ; FIX:鉴权生成 code 错误 BUGFIX

2022-8-31: 替换非鉴权的 TTS 接口，请调用者运行例子时，自行替换 appKey,appSecret。替换例子中的人物模型

```

```
