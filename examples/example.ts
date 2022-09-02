import GUI from "lil-gui";
import * as THREE from "three";
import MMFT from "@/lib";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module.js";
import * as fflate from "fflate";
import CryptoJS from "crypto-js";
import { encode } from "js-base64";
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
  发送TTS请求: async function () {
    // todo
    const [audio, teeth, emo] = await fetchTTSToAnim(params.ttsText);
    handleTTS(audio, teeth, emo);
  },
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

  // 创建renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  canvasRect.width = window.innerWidth;
  canvasRect.height = window.innerHeight;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvasRect.width, canvasRect.height);
  renderer.outputEncoding = THREE.sRGBEncoding;
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

  await replaceIdol(params.url);
  mixer = new THREE.AnimationMixer(idol);
  scene.add(idol);
  addDefaultLights(scene);
  const clock = new THREE.Clock();

  function animate() {
    const delta = clock.getDelta();
    try {
      mixer && mixer.update(delta);
      gui && gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
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

// 创建一系列的灯光
function addDefaultLights(scene: THREE.Scene) {
  const dirLight = new THREE.DirectionalLight();
  dirLight.color = new THREE.Color(0xffffff);
  dirLight.intensity = 0.4;
  dirLight.position.set(-1.45, 1, 3.57);
  scene.add(dirLight);

  const hemiLight = new THREE.HemisphereLight(0xffffff);
  hemiLight.visible = true;
  hemiLight.intensity = 0.15;
  hemiLight.position.set(0, 0, 20);
  scene.add(hemiLight);

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
}

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

  // const idolGui = gui.addFolder("替换人物");

  // idolGui
  //   .add(params, "name", {
  //     黑镜官网小静: "http://timg.metaworks.cn/threejs_res/26720-92175-1660744961/character.gltf",
  //     测试大黑: "http://timg.metaworks.cn/threejs_res/26720-92185-1661151875/character.gltf",
  //     "小静(职业装)": "http://timg.metaworks.cn/threejs_res/26720-92184-1661151830/character.gltf",
  //   })
  //   .onChange(replaceIdol);

  // idolGui.add(params, "自定义模型地址").onChange(replaceIdol);

  const animateGui = gui.addFolder("Pose Animate");
  animateGui.add(params, "fadeIn", 0, 10, 0.01);
  animateGui.add(params, "fadeOut", 0, 10, 0.01);
  animateGui.add(params, "pose", animations).onChange(handleChangePose);
  animateGui.add(params, "pose").onChange(handleChangePose);

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
  ttsGui.add(params, "teethAnimURL").onChange(async (value) => {
    clearTTSResource();
    const clip = await MMFT.core.loadTTSTeethAnimation(value);
    activeTTSResource.teeth = mixer.clipAction(clip);
    activeTTSResource.teeth.play();
  });
  ttsGui.add(params, "emoAnimURL").onChange(async (value) => {
    clearTTSResource();
    const clip = await MMFT.core.loadTTSEmoAnimation(value);
    activeTTSResource.teeth = mixer.clipAction(clip);
    activeTTSResource.teeth.play();
  });

  const zipLoaderGui = gui.addFolder("ZipGlbLoader");
  zipLoaderGui.add(params, "加载GLBZip包");
}

async function replaceIdol(opts: string | Uint8Array) {
  if (idol) {
    scene.remove(idol);
    idol.clear();
    idol = null;
  }
  if (typeof opts == "string" && opts.endsWith(".gltf")) {
    idol = await MMFT.core.loadGLTFModel(opts);
  } else if (typeof opts == "string") {
    const response = await fetch(opts, { method: "get" });
    const buffer = await response.arrayBuffer();
    const idolBuffer = await uncompress(new Uint8Array(buffer));
    idol = await MMFT.core.parseGLTFModel(idolBuffer.buffer);
  } else {
    idol = await MMFT.core.parseGLTFModel(opts.buffer);
  }
  mixer = new THREE.AnimationMixer(idol);
  scene.add(idol);
}

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
    }, params.fadeOut);
  }

  activeActions.push(action);
  if (params.fadeIn) {
    action.fadeIn(params.fadeIn);
  }
  action.play();
}

async function handleChangeEmo(value: string) {
  const animateJSON = await MMFT.core.loadAnimationData(value);
  const clip = MMFT.core.Convert(animateJSON, true);
  const action = mixer.clipAction(clip);
  action.play();
}

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

async function fetchTTSToAnim(text: string) {
  const tts = {
    voice_name: "zh-CN-XiaoxiaoNeural",
    speed: 42,
    volume: 100,
  };
  let response: any = await fetch("//open.metamaker.cn/api/openmm/v1/text_to_anim", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: ttsAuth,
    },
    body: JSON.stringify({
      text: text,
      tts_args: JSON.stringify(tts),
      audio_type: "wav",
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

async function loadAudio(url): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(url, (buffer) => {
      resolve(buffer);
    });
  });
}

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

// 解压zip包，提取glb文件
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
  const message = `${timestamp}:${appKey}`;
  const wordsArray = CryptoJS.HmacSHA256(message, appSecret);
  const hashSuffix = convertWordArrayToUint8Array(wordsArray);
  const hashPrefix = convertTextToUint8Array(`${timestamp}:`);
  const totalArray = new Uint8Array(hashPrefix.length + hashSuffix.length);
  totalArray.set(hashPrefix);
  totalArray.set(hashSuffix, hashPrefix.length);

  const base64 = encode(String.fromCharCode.apply(null, totalArray));
  ttsAuth = `AW ${appKey}:${base64}`;
}

makeSignCode();

setInterval(() => {
  makeSignCode();
}, 60 * 1000 * 10);
