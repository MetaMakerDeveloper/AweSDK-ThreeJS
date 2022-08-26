<<<<<<< HEAD
# metamaker-for-three

## 启动 Example

```
yarn run serve
```

## 打包 lib

```
yarn run build:lib
```

## lib

core 模块中包含了加载人物模型，动画，口型等相关代码

## 注意

案例中的模型仅作为展示使用，不可私自商用，需要请联系黑镜商务人员
=======
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

## 说明

这是黑镜数字人结合 threejs 使用的一个例子。本例子提供了结合 threejs 中 2 个关键点，其余情况，直接使用 threejs 相关功能即可完成

1. 数字人的加载
2. 数字人物的语音与口型动画的播放

### 数字人加载

数字人目前仅支持 gltf 人物，开发者从黑镜开放平台，获得数字人模型文件后，通过调用。

```
let model = await MetaMakerForThree.loadModal(url)
scene.add(model)
```

详细代码可查看 [加载数字人](./src/lib/metamaker-for-three.js)loadModel 方法

进行模型的加载，随后添加到场景中

### TTS 语音的请求与口型动画的播放

在本例子中，提供的语音请求接口是测试接口(**注意：不保证后续功能的提供，请勿使用在正式环境**)，购买相关服务后，请自行通过后端鉴权和接口转发的方式完成接口的调用。

详细代码可查看 [加载数字人](./src/lib/metamaker-for-three.js)loadTTSAndAnimate 方法

## 注意

MetaMakerDeveloper 发布的代码或数字资产（数字人、服装、动作、表情等）以及试用数字人小镜、大黑都属于黑镜科技公司，如需商用，请添加以下二维码联系，谢谢！

![image](./code.jpg)
>>>>>>> temp
