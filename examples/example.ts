import GUI from "lil-gui";
import * as THREE from "three";
import MMFT from "@/lib";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module.js";
let renderer;
let scene;
let camera: THREE.PerspectiveCamera;
let controls;
let idol: THREE.Group;
let gui: GUI;
let stats;
let lookTarget;
let mixer: THREE.AnimationMixer;

const params = {
  name: "黑镜官网小静",
  url: "http://timg.metaworks.cn/threejs_res/26720-92175-1660744961/character.gltf",
  自定义模型地址: "",
  pose: "",
  fadeIn: 0,
  fadeOut: 0,
  ttsText: "",
  audioURL: "",
  teethAnimURL: "",
  emoAnimURL: "",
  发送TTS请求: async function () {
    // todo
    const [audio, teeth, emo] = await fetchTTSToAnim(params.ttsText);
    handleTTS(audio, teeth, emo);
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
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", onResize);

  // 创建renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
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

  idol = await MMFT.core.loadGLTFModal(params.url);
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

  const cameraGui = gui.addFolder("Camera ");
  cameraGui.add(camera.position, "x", -100, 100, 0.01);
  cameraGui.add(camera.position, "y", -100, 100, 0.01);
  cameraGui.add(camera.position, "z", -100, 100, 0.01);
  cameraGui.add(camera, "near", 0, 10000, 0.1);
  cameraGui.add(camera, "far", 0, 100000, 0.1);
  cameraGui.add(camera, "fov", 0, 180, 0.1);
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

  idolGui
    .add(params, "name", {
      黑镜官网小静: "http://timg.metaworks.cn/threejs_res/26720-92175-1660744961/character.gltf",
      测试大黑: "http://timg.metaworks.cn/threejs_res/26720-92185-1661151875/character.gltf",
      "小静(职业装)": "http://timg.metaworks.cn/threejs_res/26720-92184-1661151830/character.gltf",
    })
    .onChange(replaceIdol);

  idolGui.add(params, "自定义模型地址").onChange(replaceIdol);

  const animateGui = gui.addFolder("Pose Animate");
  animateGui.add(params, "fadeIn", 0, 10, 0.01);
  animateGui.add(params, "fadeOut", 0, 10, 0.01);
  animateGui.add(params, "pose", animations).onChange(handleChangePose);
  animateGui.add(params, "pose").onChange(handleChangePose);

  const ttsGui = gui.addFolder("tts");
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
}

async function replaceIdol(url) {
  if (idol) {
    scene.remove(idol);
    idol.clear();
    idol = null;
  }
  idol = await MMFT.core.loadGLTFModal(url);
  mixer = new THREE.AnimationMixer(idol);
  scene.add(idol);
}

async function handleChangePose(value: string) {
  const animateJSON = await MMFT.core.loadAnimationData(value);
  const clip = MMFT.core.Convert(animateJSON);
  const action = mixer.clipAction(clip);
  while (activeActions.length) {
    const action = activeActions.pop();
    if (params.fadeOut) {
      action.fadeOut(params.fadeOut);
    }
    setTimeout(() => {
      action.paused = true;
    }, params.fadeOut);
  }

  activeActions.push(action);
  if (params.fadeIn) {
    action.fadeIn(params.fadeIn);
  }
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
    voice_name: "智能客服_静静",
    speed: 50,
    volume: 30,
  };
  let response: any = await fetch("//open.metamaker.cn/api/tts/v1/text_to_anim", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
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