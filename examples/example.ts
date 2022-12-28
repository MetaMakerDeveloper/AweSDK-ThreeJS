import GUI from "lil-gui";
import * as THREE from "three";
import MMFT from "@/lib";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module.js";
import * as fflate from "fflate";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import CryptoJS from "crypto-js";
import { ClothPhysicManagerInstance } from "../src/lib/core/utils/ClothPhysics";

import qs from "qs";
let renderer;
let scene;
let camera: THREE.PerspectiveCamera;
let controls;
let idol: THREE.Group;
let gui: GUI;
let stats;
let lookTarget;
let mixer: THREE.AnimationMixer;
let ttsAuth: string;

const canvasRect: {
  width: number;
  height: number;
} = {
  width: 0,
  height: 0,
};

const params = {
  name: "虚拟人物女性",
  url: "./f9d25cc22be065191dca0f2ac7b248fd.zip",
  自定义模型地址: "",
  pose: "",
  poseEmo: "",
  fadeIn: 0,
  fadeOut: 0,
  ttsText: "",
  audioURL: "",
  teethAnimURL: "",
  emoAnimURL: "",
  appKey: "",
  appSecret: "",
  loop: THREE.LoopRepeat,
  发送TTS请求: async function () {
    // todo
    const [audio, teeth, emo] = await fetchTTSToAnim(params.ttsText);
    handleTTS(audio, teeth, emo);
  },
  /**
   * 加载本地的数字人Zip包
   */
  加载GLBZip包: async function () {
    // todo
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.addEventListener("change", async (e) => {
      console.log(e);
      if (input.files.length) {
        const glbBuffer = await uncompressZipFile(input.files[0]);
        replaceIdol(glbBuffer);
      }
      input.remove();
    });
    input.click();
  },
  播放口型动画: async () => {
    clearTTSResource();
    const tclip = await MMFT.core.loadTTSTeethAnimation(params.teethAnimURL);
    const eclip = await MMFT.core.loadTTSEmoAnimation(params.emoAnimURL);
    activeTTSResource.teeth = mixer.clipAction(tclip);
    activeTTSResource.emo = mixer.clipAction(eclip);
    activeTTSResource.teeth.play();
    activeTTSResource.emo.play();
  },
  播放GLB动画: async () => {
    const clip = await MMFT.core.loadGLTFAnimation(params.teethAnimURL); ///////////////////////////liujun,临时测试
    const action = mixer.clipAction(clip);
    action.play();
  },
};
const activeActions = [];
const activeTTSResource = {
  audio: null,
  teeth: null,
  emo: null,
};

const animations = {
  "anim/220515_daiji": "anim/220515_daiji",
  "anim/Stand_Idel": "anim/Stand_Idel",
  "anim/Talking_BGY_F0": "anim/Talking_BGY_F0",
  "anim/anim_220415_F34": "anim/anim_220415_F34",
  "anim/Anim_220422_F5311": "anim/Anim_220422_F5311",
  "anim/ABS_Fxiang_shuangren_16_M0": "anim/ABS_Fxiang_shuangren_16_M0",
  "anim/BaseAnim/Anim_walk_M01": "anim/BaseAnim/Anim_walk_M01",
  "anim/BaseAnim/Anim_run_F01": "anim/BaseAnim/Anim_run_F01",
  "anim/Anim_220705_F26": "anim/Anim_220705_F26",
  "anim/BD_xl0011_01_F0": "anim/BD_xl0011_01_F0",
  "anim/Anim_220808_F37": "anim/Anim_220808_F37",
  "anim/Anim_220808_F38": "anim/Anim_220808_F38",
};

window.onload = async () => {
  const app = document.querySelector("#app");
  function onResize() {
    console.log(`resize`);
    canvasRect.width = window.innerWidth;
    canvasRect.height = window.innerHeight;
    camera.aspect = canvasRect.width / canvasRect.height;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", onResize);
  document.addEventListener("dragover", function (event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  });

  document.addEventListener("drop", function (event) {
    event.preventDefault();

    if (event.dataTransfer.types[0] === "text/plain") return; // Outliner drop

    if (event.dataTransfer.items) {
      // DataTransferItemList supports folders
    } else {
    }
  });
  // 创建renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    logarithmicDepthBuffer: false,
  });

  canvasRect.width = window.innerWidth;
  canvasRect.height = window.innerHeight;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvasRect.width, canvasRect.height);
  renderer.outputEncoding = THREE.sRGBEncoding;

  renderer.physicallyCorrectLights = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  app.appendChild(renderer.domElement);
  // 创建Scene
  scene = new THREE.Scene();
  // 创建Camera
  camera = new THREE.PerspectiveCamera(23, window.innerWidth / window.innerHeight, 0.1, 10000);
  camera.rotation.set(-0.17, 0, 0);
  camera.position.set(0, 1.2, 1.3);
  lookTarget = new THREE.Vector3(0, 1, 0);
  camera.lookAt(lookTarget);

  // 创建Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.target.set(0, 1, 0);
  controls.update();
  // 创建Idol
  controls.addEventListener("end", () => {
    MMFT.core.resetPolygonOffset(idol, camera);
  });

  await replaceIdol(params.url);
  MMFT.core.resetPolygonOffset(idol, camera);

  mixer = new THREE.AnimationMixer(idol);

  scene.add(idol);
  addDefaultLights(scene);
  const clock = new THREE.Clock();

  function animate() {
    const delta = clock.getDelta();
    try {
      mixer && mixer.update(delta);
      gui && gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
      ClothPhysicManagerInstance.update(delta);
    } catch (e) {
      console.error(e);
    } finally {
      requestAnimationFrame(animate);
      render();
    }
  }
  function render() {
    // todo

    stats && stats.update();
    renderer.render(scene, camera);
  }
  stats = Stats();
  app.appendChild(stats.dom);
  animate();

  addGui();
};

/**
 *
 * @param scene
 * 创建场景的灯光，根据实际需求，创建合适灯光
 */
function addDefaultLights(scene: THREE.Scene) {
  const dirLight = new THREE.DirectionalLight();
  dirLight.color = new THREE.Color(0xffffff);
  dirLight.intensity = 0.4;
  dirLight.position.set(-1.45, 1, 3.57);
  scene.add(dirLight);

  const directionalLight = new THREE.DirectionalLight(0xaaaaaa);
  directionalLight.position.set(-10, 35, 15).normalize();
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048; // default
  directionalLight.shadow.mapSize.height = 2048; // default
  directionalLight.shadow.bias = -0.0001;

  directionalLight.shadow.camera.near = 0.1; // default
  directionalLight.shadow.camera.far = 10; // default
  directionalLight.shadow.camera.top = 2;
  directionalLight.shadow.camera.right = 2;
  directionalLight.shadow.camera.bottom = -2;
  directionalLight.shadow.camera.left = -2;
  scene.add(directionalLight);
  //scene.add(new THREE.CameraHelper(directionalLight.shadow.camera))
  const ambient = new THREE.AmbientLight(0xaaaaaa);
  scene.add(ambient);
  // const hemiLight = new THREE.HemisphereLight(0xffffff);
  // hemiLight.visible = true;
  // hemiLight.intensity = 0.15;
  // hemiLight.position.set(0, 0, 20);
  //scene.add(hemiLight);

  let spot = new THREE.SpotLight(0xffffff);
  spot.color = new THREE.Color(0xffffff);
  spot.visible = true;
  spot.distance = 0;
  spot.intensity = 0.28;
  spot.penumbra = 0;
  spot.decay = 2;
  spot.position.set(-1.44, 1.59, 3.57);
  spot.angle = 1;
  scene.add(spot);
  scene.add(spot.target);

  spot = new THREE.SpotLight(0xffffff);
  spot.intensity = 0.35;
  spot.angle = 1;
  spot.penumbra = 0;
  spot.distance = 0;
  spot.position.set(3.68, 0.15, 7.93);
  scene.add(spot);
  scene.add(spot.target);

  spot = new THREE.SpotLight(0xffffff);
  spot.intensity = 0.9;
  spot.distance = 0;
  spot.angle = 1;
  spot.penumbra = 0;
  spot.decay = 2;
  spot.position.set(0.39, 1.19, -0.91);
  scene.add(spot);
  scene.add(spot.target);

  const material = new THREE.ShadowMaterial();
  material.opacity = 0.3; //! bug in threejs. can't set in constructor
  material.depthWrite = false;
  const geometry = new THREE.PlaneGeometry(3, 3);
  const planeMesh = new THREE.Mesh(geometry, material);
  planeMesh.receiveShadow = true;
  //planeMesh.d = false;
  planeMesh.rotation.x = -Math.PI / 2;
  scene.add(planeMesh);
  const loader = new RGBELoader();
  loader.setPath("./textures/");
  loader.load("4kLR.hdr", function (texture) {
    // once it's loaded, create the helper and use it
    const gen = new THREE.PMREMGenerator(renderer);
    const envMap = gen.fromEquirectangular(texture).texture;
    envMap.encoding = THREE.sRGBEncoding;

    //envMap.material = THREE.EquirectangularReflectionMapping;
    scene.environment = envMap;
    //scene.background = envMap;
  });
}

/**
 * @desc 添加右侧的编辑窗体
 */
function addGui() {
  gui = new GUI();
  const humanGui = gui.addFolder("Meta Human");
  humanGui.add(idol.position, "x", -10, 10, 0.01);
  humanGui.add(idol.position, "y", -10, 10, 0.01);
  humanGui.add(idol.position, "z", -10, 10, 0.01);
  humanGui.onChange((e) => {
    const value = e.object as any;
    if (e.property == "x") {
      idol.position.x = value.x;
    } else if (e.property == "y") {
      idol.position.y = value.y;
    } else if (e.property == "z") {
      idol.position.z = value.z;
    }
  });
  const canvasGui = gui.addFolder("Canvas");
  canvasGui.add(canvasRect, "width", 0, 20000, 1).onChange((value) => {
    canvasRect.width = value;
    renderer.setSize(canvasRect.width, canvasRect.height);
    camera.aspect = canvasRect.width / canvasRect.height;
    camera.updateProjectionMatrix();
  });
  canvasGui.add(canvasRect, "height", 0, 20000, 1).onChange((value) => {
    canvasRect.height = value;
    renderer.setSize(canvasRect.width, canvasRect.height);
    camera.aspect = canvasRect.width / canvasRect.height;
    camera.updateProjectionMatrix();
  });
  const cameraGui = gui.addFolder("Camera ");
  cameraGui.add(camera.position, "x", -100, 100, 0.01);
  cameraGui.add(camera.position, "y", -100, 100, 0.01);
  cameraGui.add(camera.position, "z", -100, 100, 0.01);
  cameraGui.add(camera, "near", 0, 10000, 0.1);
  cameraGui.add(camera, "far", 0, 100000, 0.1);
  cameraGui.add(camera, "fov", 0, 180, 0.1);
  cameraGui.add(camera, "aspect", 0, 2, 0.1).onChange(() => {
    camera.updateMatrix();
    camera.updateProjectionMatrix();
  });
  cameraGui.onChange(() => {
    camera.updateMatrix();
    camera.updateProjectionMatrix();
  });

  const cameraRotationGui = gui.addFolder("Camera Rotation Euler");
  cameraRotationGui.add(camera.rotation, "x", -Math.PI, Math.PI, 0.01);
  cameraRotationGui.add(camera.rotation, "y", -Math.PI, Math.PI, 0.01);
  cameraRotationGui.add(camera.rotation, "z", -Math.PI, Math.PI, 0.01);
  cameraRotationGui.onChange(() => {
    camera.updateMatrix();
    camera.updateMatrixWorld();
  });
  const lookAtGui = gui.addFolder("Camera lookAt");
  lookAtGui.add(lookTarget, "x", -10, 10, 0.01);
  lookAtGui.add(lookTarget, "y", -10, 10, 0.01);
  lookAtGui.add(lookTarget, "z", -10, 10, 0.01);
  lookAtGui.onChange(() => {
    camera.lookAt(lookTarget.x, lookTarget.y, lookTarget.z);
  });

  const idolGui = gui.addFolder("替换人物");

  idolGui.add(params, "自定义模型地址").onChange(replaceIdol);

  const animateGui = gui.addFolder("Pose Animate");
  animateGui.add(params, "fadeIn", 0, 10, 0.01);
  animateGui.add(params, "fadeOut", 0, 10, 0.01);
  animateGui.add(params, "pose", animations).onChange(handleChangePose);
  animateGui.add(params, "pose").onChange(handleChangePose);
  animateGui.add(params, "loop", { LoopOnce: THREE.LoopOnce, LoopRepeat: THREE.LoopRepeat });

  const emoGui = gui.addFolder("Emo Animate");
  emoGui.add(params, "poseEmo").onChange(handleChangeEmo);

  const ttsGui = gui.addFolder("tts");
  ttsGui.add(params, "appKey").onChange(() => {
    makeSignCode();
  });
  ttsGui.add(params, "appSecret").onChange(() => {
    makeSignCode();
  });
  ttsGui.add(params, "ttsText");
  ttsGui.add(params, "发送TTS请求");
  ttsGui.add(params, "audioURL").onChange(async (value) => {
    // todo
    const audioBuffer = await loadAudio(value);
    const listener = new THREE.AudioListener();
    const audio = new THREE.Audio(listener);
    audio.onEnded = () => {
      console.log(`播放结束`);
      clearTTSResource();
    };
    audio.setBuffer(audioBuffer);
    audio.setLoop(false);
    audio.setVolume(0.5);
    activeTTSResource.audio = audio;
    audio.play();
  });
  ttsGui.add(params, "teethAnimURL");
  ttsGui.add(params, "emoAnimURL");
  ttsGui.add(params, "播放口型动画");
  ttsGui.add(params, "播放GLB动画");
  const zipLoaderGui = gui.addFolder("ZipGlbLoader");
  zipLoaderGui.add(params, "加载GLBZip包");
}

/**
 *
 * @param opts
 * @desc
 * 接受模型的地址：
 * 用户通过数字人平台下载的数字人通常为一个zip包。将下载的zip包放到自己的开发服务器或者，OSS云服务器上，
 * 可以直接使用地址进行加载。
 */
async function replaceIdol(opts: string | Uint8Array) {
  if (idol) {
    scene.remove(idol);
    idol.clear();
    idol = null;
  }

  if (typeof opts == "string" && (opts.endsWith(".gltf") || opts.endsWith(".glb"))) {
    idol = await MMFT.core.loadGLTFModel(opts);
  } else if (typeof opts == "string") {
    const response = await fetch(opts, { method: "get" });
    const buffer = await response.arrayBuffer();
    const idolBuffer = await uncompress(new Uint8Array(buffer));
    idol = await MMFT.core.parseGLTFModel(idolBuffer.buffer);
  } else {
    idol = await MMFT.core.parseGLTFModel(opts.buffer);
  }
  ClothPhysicManagerInstance.setClothPhysics(idol);

  idol.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // child.material.envMap = envMap;
      child.material.envMapIntensity = 0.3;
      child.material.needsUpdate = true;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  MMFT.core.resetPolygonOffset(idol, camera);
  mixer = new THREE.AnimationMixer(idol);
  scene.add(idol);
}

/**
 * @param value
 * 用于gui直接修改当前播放的动画
 * 通过动画名称加载的的动画资源，并进行播放
 */
async function handleChangePose(value: string) {
  const animateJSON = await MMFT.core.loadAnimationData(value);
  const clip = MMFT.core.Convert(animateJSON);
  console.warn(`pose clip `, clip);
  const action = mixer.clipAction(clip);
  while (activeActions.length) {
    const action = activeActions.pop();
    if (params.fadeOut) {
      action.fadeOut(params.fadeOut);
    }
    setTimeout(() => {
      action.paused = true;
      action.stop();
    }, params.fadeOut*1000);
 
  }

  activeActions.push(action);
  if (params.fadeIn) {
    action.fadeIn(params.fadeIn);
  }
  action.loop = params.loop;
  action.play();
}

async function handleChangeEmo(value: string) {
  const animateJSON = await MMFT.core.loadAnimationData(value);
  const clip = MMFT.core.Convert(animateJSON, true);
  const action = mixer.clipAction(clip);
  action.play();
}

/**
 *
 * @param audio
 * @param teeth
 * @param emo
 * 播放threejs的相关动画与语音
 */
async function handleTTS(audio, teeth, emo) {
  const teethAction = mixer.clipAction(teeth);
  const emoAction = mixer.clipAction(emo);
  emoAction.loop = THREE.LoopOnce;
  teethAction.loop = THREE.LoopOnce;
  clearTTSResource();
  audio.onEnded = () => {
    console.log(`播放结束`);
    clearTTSResource();
  };

  activeTTSResource.audio = audio;
  activeTTSResource.teeth = teethAction;
  activeTTSResource.emo = emoAction;

  audio.play();
  teethAction.play();
  emoAction.play();
}

/**
 *
 * @param text
 * @returns { [ THREE.Audio,THREE.AnimationAction,THREE.AnimationAction ] }
 * 通过文字，以及tts的配置信息，获得用于threejs的口型动画与音频信息
 */
async function fetchTTSToAnim(text: string) {
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
  params.audioURL = response.ret.audio;
  params.teethAnimURL = response.ret.teeth_anim;
  params.emoAnimURL = response.ret.expression_anim;
  const data = await Promise.all([
    loadAudio(response.ret.audio),
    MMFT.core.loadTTSTeethAnimation(response.ret.teeth_anim),
    MMFT.core.loadTTSEmoAnimation(response.ret.expression_anim),
  ]);
  const audioBuffer = data[0];
  const listener = new THREE.AudioListener();
  const audio = new THREE.Audio(listener);
  audio.setBuffer(audioBuffer);
  audio.setLoop(false);
  audio.setVolume(0.5);
  return [audio, data[1], data[2]];
}

/**
 *
 * @param url
 * @returns {Promise<AudioBuffer>}
 * @desc 通过url获得音频buffer
 */
async function loadAudio(url): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(url, (buffer) => {
      resolve(buffer);
    });
  });
}

/**
 * @desc 清除语音动画资源以及停止播放音频
 */
function clearTTSResource() {
  if (activeTTSResource.teeth) {
    activeTTSResource.teeth.paused = true;
    activeTTSResource.teeth.stop();
    mixer && mixer.uncacheAction(activeTTSResource.teeth.getClip());
  }
  if (activeTTSResource.emo) {
    activeTTSResource.emo.paused = true;
    activeTTSResource.emo.stop();
    mixer && mixer.uncacheAction(activeTTSResource.emo.getClip());
  }
  if (activeTTSResource.audio) {
    const audio = activeTTSResource.audio;
    audio.source && audio.stop();
  }
}

/**
 *
 * @param file
 * @returns
 * @desc 解压zip包，提取glb文件
 */
function uncompressZipFile(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
      const result = e.target.result as ArrayBuffer;
      console.log(`读取完毕`);
      const glbBuffer: Uint8Array = await new Promise((resolve) => {
        const unzipper = new fflate.Unzip();
        unzipper.register(fflate.UnzipInflate);
        unzipper.onfile = (file) => {
          // file.name is a string, file is a stream
          if (!(file.name as string).endsWith(".glb")) {
            return;
          }
          file.ondata = (err, dat, final) => {
            // Stream output here
            resolve(dat);
          };
          console.log("Reading:", file.name);

          file.start();
        };
        unzipper.push(new Uint8Array(result), true);
      });
      resolve(glbBuffer);
    };
    fileReader.readAsArrayBuffer(file);
  });
}

/**
 *
 * @param buffer
 * @returns
 * @desc 解压zip文件获得数据
 */
function uncompress(buffer: ArrayBuffer): Promise<Uint8Array> {
  return new Promise((resolve) => {
    const unzipper = new fflate.Unzip();
    unzipper.register(fflate.UnzipInflate);
    unzipper.onfile = (file) => {
      // file.name is a string, file is a stream
      if (!(file.name as string).endsWith(".glb")) {
        return;
      }
      file.ondata = (err, dat, final) => {
        // Stream output here
        resolve(dat);
      };
      console.log("Reading:", file.name);

      file.start();
    };
    unzipper.push(new Uint8Array(buffer), true);
  });
}

/**
 * @desc
 * 用于tts(语音播报)请求的鉴权代码，
 * 在不使用tts的情况，可以不用理会该段代码。

 */
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
  ttsAuth = `AW ${appKey}:${base64}`;
}

makeSignCode();

/**
 *  每10分钟更新一次鉴权
 */
setInterval(() => {
  makeSignCode();
}, 60 * 1000 * 10);
