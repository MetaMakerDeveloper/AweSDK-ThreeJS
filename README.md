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

数字人目前支持 gltf,zip 包含的 glb 模型 人物，开发者从黑镜开放平台，获得数字人模型文件后，通过调用。

进行模型的加载，随后添加到场景中


## 注意

MetaMakerDeveloper 发布的代码或数字资产（数字人、服装、动作、表情等）以及试用数字人小镜、大黑都属于黑镜科技公司，如需商用，请添加以下二维码联系，谢谢！

![image](./code.jpg)

## 更新日志

2022-09-02: 处理部分动作补间，导致模型的踢腿动作，core中增加resetPolyonOffset处理人物模型穿模问题 ; 
            FIX:鉴权生成code错误BUGFIX

2022-8-31: 替换非鉴权的 TTS 接口，请调用者运行例子时，自行替换 appKey,appSecret。替换例子中的人物模型
