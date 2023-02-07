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

```
npm install metamaker-for-three
```

2. 通过github
metamaker-for-three 暂时没有上 npm，通过在 packagejson 中添加 github 的地址，并进行 yarn install

```
  "dependencies": {
    "metamaker-for-three": "https://github.com/MetaMakerDeveloper/AweSDK-ThreeJS.git#最新版本号"
  }
```

在无法连接 github 的情况下使用 gitee 连接

```
  "dependencies": {
    "metamaker-for-three": "https://gitee.com/metamaker/AweSDK-ThreeJS.git#最新版本号"
  }
```

2.  直接在[链接中](https://github.com/MetaMakerDeveloper/AweSDK-ThreeJS)的 libs 下载文件通过

```
<script src="<您的js存放地址>/metamaker-for-three.js"></script>
```

### 接口引入

```
import MMFT from 'metamaker-for-three'
```

1. 数字人加载

   数字人目前支持 gltf,zip 包含的 glb 模型 人物，开发者从黑镜开放平台，获得数字人模型文件后，通过调用。

   进行模型的加载，随后添加到场景中.

   加载服务器的 glb 文件

   ```js
   import MMFT from "metamaker-for-three";
   const path = "./your.glb";
   const idol = await MMFT.core.loadGLTFModel(path);
   ```

   _加载 zip_： 在实际应用中，往往会使用 zip 压缩 glb 文件，**metamaker-for-three**并不直接提供加载 zip 的 glb 文件。但是你可以参考 [例子](./examples/example.ts)中的 **replaceIdol**方法中**uncompress**的解压 zip 的代码。

2. 数字人动作

   数字人加载完毕后，处于 A POSE 的状态，需要让数字人做某些动作

   ```js
   import * as THREE from "three";
   import MMFT from "metamaker-for-three";

   const animateName = `anim/Stand_idel`;
   const json = await MMFT.core.loadAnimationData(animateName);
   const clip = MMFT.core.Convert(json);
   let mixer = new THREE.AnimationMixer(idol);
   let action = mixer.clipAction(clip);
   action.play();
   ```

3. 数字人口型动画

   通过调用 tts 接口可以获得口型动画与音频文件，使得数字人开口说话。 而我们的关键是从接口的返回结果中获取音频文件与解析口型动画文件

   ```js
   const tts = {
     voice_name: "zh-CN-XiaoxiaoNeural",
     speed: 42,
     volume: 100,
   };
   let response: any = await fetch("//open.metamaker.cn/api/openmm/v1/text_to_anim", {
     method: "post",
     headers: {
       "Content-Type": "application/x-www-form-urlencoded",
       Authorization: ttsAuth,
     },
     body: qs.stringify({
       text: text,
       tts_args: JSON.stringify(tts),
       audio_type: "wav",
       storage_type: "cloud",
     }),
     mode: "cors",
   });

   response = await response.json();
   if (response.err_code !== 0) {
     throw new Error("fetch tts failed");
   }

   let teethAnimClip = await MMFT.core.loadTTSTeethAnimation(response.ret.teeth_anim);
   let emoAnimClip = await MMFT.core.loadTTSEmoAnimation(response.ret.expression_anim);
   ```

   [转化口型动画参考](./examples/example.ts) 中 **fetchTTSToAnim**

   获得 AnimationClip ，Clip 不能直接播放，还需要变成 Animation 后才可以播放哦 。具体参考该段代码

   ```js
   import * as THREE from "three";
   let clip = 您的加载后得到AnimateClip对象;
   let mixer = new THREE.AimationMixer(idol);
   let action = mixer.clipAction(clip);
   action.play();
   ```

4. TTS 接口鉴权

   TTS 接口并不是免费的，所以需要鉴权。js 代码参考

   ```js
   function makeSignCode() {
     const convertTextToUint8Array = (text: string) => {
       return Array.from(text).map((letter) => letter.charCodeAt(0));
     };
     const convertWordArrayToUint8Array = (wordArray) => {
       const len = wordArray.words.length;
       const uint8Array = new Uint8Array(len << 2);
       let offset = 0;
       let word;
       for (let i = 0; i < len; i++) {
         word = wordArray.words[i];
         uint8Array[offset++] = word >> 24;
         uint8Array[offset++] = (word >> 16) & 0xff;
         uint8Array[offset++] = (word >> 8) & 0xff;
         uint8Array[offset++] = word & 0xff;
       }
       return uint8Array;
     };

     const appKey = params.appKey;
     const appSecret = params.appSecret;
     const timestamp = Math.floor(new Date().getTime() / 1000);
     console.log(`timestamp:`, timestamp);
     const message = `${timestamp}:${appKey}`;
     const wordsArray = CryptoJS.HmacSHA256(message, appSecret);
     const hashSuffix = convertWordArrayToUint8Array(wordsArray);
     const hashPrefix = convertTextToUint8Array(`${timestamp}:`);
     const totalArray = new Uint8Array(hashPrefix.length + hashSuffix.length);
     totalArray.set(hashPrefix);
     totalArray.set(hashSuffix, hashPrefix.length);
     const tempstr = String.fromCharCode.apply(null, totalArray);
     console.log(`temp str`, tempstr);
     const base64 = btoa(tempstr);
     return `AW ${appKey}:${base64}`;
   }
   ```
    [更多语言鉴权参考](https://help.metamaker.cn/open/28ca/c4e6)
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
