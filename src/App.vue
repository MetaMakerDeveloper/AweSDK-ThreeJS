<template>
  <div style="width: 100vw; height: 100vh; background: #121924">
    <div style="position: absolute; z-index: 2">
      <div>
        <textarea
          style="width: 300px; height: 150px"
          placeholder="输入对话，按下回车键发送"
          :value="text"
          @input="(e) => (text = e.target.value)"
          @keyup.enter="handleTTS"
        ></textarea>
      </div>
      <div style="text-align: left">
        <select :value="animateName" @change="(e) => handleAnimateChange(e.target.value)">
          <option :key="option" v-for="option in animateList" :value="option">{{ option }}</option>
        </select>
      </div>
      <div style="text-align: left; margin-top: 10px">
        <select :value="activeIdol" @change="(e) => handleChangeIdol(e.target.value)">
          <option v-for="option in idolList" :key="option.name" :value="option.name">{{
            option.name
          }}</option>
        </select>
      </div>
      <div>
        <select :value="activeEmo" @change="(e) => handleChangeEMO(e.target.value)">
          <option :key="option" v-for="option in emoList" :value="option">{{ option }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import * as THREE from "three";
import MetaMakerForThree from "@/lib/metamaker-for-three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import MetaMakeForThree from "@/lib/metamaker-for-three";
const FADE_OUT = 0.5;
const FADE_IN = 0.5;
export default defineComponent({
  name: "App",
  components: {},
  data() {
    return {
      text: "",
      animateName: "anim/BD_xl0011_01_F0",
      activeIdol: "小静",
      animateList: [
        "anim/220515_daiji",
        "anim/Stand_Idel",
        "anim/Talking_BGY_F0",
        "anim/anim_220415_F34",
        "anim/Anim_220422_F5311",
        "anim/ABS_Fxiang_shuangren_16_M0",
        "anim/BaseAnim/Anim_walk_M01",
        "anim/BaseAnim/Anim_run_F01",
        "anim/Anim_220705_F26",
        "anim/BD_xl0011_01_F0",
        "anim/Anim_220808_F37",
        "anim/Anim_220808_F38",
        "https://timg.metaworks.cn/ai_human/unity/d62b0759883eea92d6832f5ab082da9a",
      ],
      idolList: [
        {
          name: "小静",
          url: "http://timg.metaworks.cn/threejs_res/26720-92175-1660744961/character.gltf",
        },
        // { name: "大黑", url: "/models/gltf/dh/character.gltf" },
      ],
      activeEmo: "",
      emoList: ["anim/smile_little_Blink"],
      activePoseAnimateAction: null,
      ttsResource: {
        teeth: null,
        emo: null,
        audio: null,
      },
    };
  },

  created() {
    this.initTHREE();
    this.cacheActionMap = new Map();
  },

  async mounted() {
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
    this.$el.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1, 0);
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.update();
    await this.initIdol(
      "http://timg.metaworks.cn/threejs_res/26720-92175-1660744961/character.gltf"
    );
    this.animate();
  },
  methods: {
    /**
     * 搭建renderer
     * 搭建场景,初始化灯光，摄像机
     */
    initTHREE() {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      this.renderer.domElement.style.transform = "rotateY(180deg)";
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.shadowMap.enabled = true;
      let camera = new THREE.PerspectiveCamera(
        3.8,
        window.innerWidth / window.innerHeight,
        3,
        1000
      );
      camera.position.set(0, 2.1, 10);
      camera.lookAt(0, 1, 0);
      this.camera = camera;
      this.scene = new THREE.Scene();
      let directionalLight = new THREE.DirectionalLight(0xffffff);
      directionalLight.intensity = 0.2;
      directionalLight.position.set(-1.45, 1, 3.57);
      directionalLight.visible = true;
      this.scene.add(directionalLight);

      let spotLight = new THREE.SpotLight();
      spotLight.color = new THREE.Color("#ffffff");
      spotLight.visible = true;
      spotLight.intensity = 0.28;
      spotLight.distance = 0;
      spotLight.penumbra = 0;
      spotLight.decay = 2;
      spotLight.position.set(-3.18, 1, 2.25);
      spotLight.angle = 0.14;
      spotLight.castShadow = false;
      spotLight.target.position.set(0, 0.6, 0);
      this.scene.add(spotLight);
      this.scene.add(spotLight.target);
      spotLight = new THREE.SpotLight();
      spotLight.visible = true;
      spotLight.color = new THREE.Color("#ffffff");
      spotLight.intensity = 0.2;
      spotLight.angle = 1.4;
      spotLight.penumbra = 0;
      spotLight.castShadow = false;
      spotLight.position.set(0.77, 1.13, -1.48);
      spotLight.target.position.set(0, 0.6, 0);
      this.scene.add(spotLight);
      this.scene.add(spotLight.target);
      spotLight = new THREE.SpotLight();
      spotLight.visible = true;
      spotLight.color = new THREE.Color("#ffffff");
      spotLight.intensity = 0.34;
      spotLight.distance = 0;
      spotLight.angle = 1.4;
      spotLight.penumbra = 0;
      spotLight.decay = 2;
      spotLight.castShadow = false;
      spotLight.position.set(2.25, 1.4, 2.96);
      spotLight.target.position.set(0, 0.6, 0);
      this.scene.add(spotLight);
      this.scene.add(spotLight.target);

      let ambientLight = new THREE.AmbientLight("#fffdf0");
      ambientLight.intensity = 0.1;
      ambientLight.visible = true;
      this.scene.add(ambientLight);

      let hemiLight = new THREE.HemisphereLight("#ffffff", "#cccccc");
      hemiLight.intensity = 0.48;
      hemiLight.position.set(0, 0, 10);
      this.scene.add(hemiLight);
      this.clock = new THREE.Clock();
    },
    handleResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    },
    /**
     * 远程请求tts，获得口型，表情动画，并播放
     */
    async handleTTS() {
      let text = this.text;
      this.text = "";
      let tts;
      if (this.activeIdol == "小静") {
        tts = {
          voice_name: "智能客服_静静",
          speed: 50,
          volume: 30,
        };
      } else {
        tts = {
          voice_name: "zh-CN-YunyangNeural",
          speed: 50,
          volume: 30,
        };
      }

      let data = await MetaMakerForThree.loadTTSAndAnimate(text, tts);

      /**
       * 新的tts进入，停止正在播放的tts的口型，表情动画。
       */
      {
        if (this.ttsResource.teeth) {
          this.ttsResource.teeth.paused = true;
          this.ttsResource.teeth.stop();
          this.mixer.uncacheAction(this.ttsResource.teeth.getClip());
        }
        if (this.ttsResource.emo) {
          this.ttsResource.emo.paused = true;
          this.ttsResource.emo.stop();
          this.mixer.uncacheAction(this.ttsResource.emo.getClip());
        }
        if (this.ttsResource.audio) {
          let audio = this.ttsResource.audio;
          audio.source && audio.stop();
        }
      }

      let audio = data[0];
      let teethClip = data[1];
      let emoClip = data[2];
      let teethAction = this.mixer.clipAction(teethClip);
      let emoAction = this.mixer.clipAction(emoClip);
      emoAction.loop = THREE.LoopOnce;
      teethAction.loop = THREE.LoopOnce;

      this.ttsResource.teeth = teethAction;
      this.ttsResource.emo = emoAction;
      this.ttsResource.audio = audio;

      audio.onEnded = () => {
        console.warn(`播放结束`);

        this.mixer.uncacheAction(teethAction.getClip());
        this.mixer.uncacheAction(emoAction.getClip());
        /**
         * 播放结束，清除tts相关资源
         */
        this.ttsResource.teeth = null;
        this.ttsResource.emo = null;
        this.ttsResource.audio = null;
      };
      teethAction.play();
      emoAction.play();
      audio.play();
    },
    /**
     * @param { string } url
     * 加载人物模型，并初始化开始的站姿
     */
    async initIdol(url) {
      let idol = await MetaMakerForThree.loadModel(url);
      this.idol = idol;
      let mixer = new THREE.AnimationMixer(idol);
      this.mixer = mixer;
      await this.handleAnimateChange(this.animateName);
      this.scene.add(idol);
    },
    async handleAnimateChange(animateName) {
      this.animateName = animateName;
      if (this.cacheActionMap.get(this.animateName)) {
        let action = this.cacheActionMap.get(this.animateName);
        if (this.activePoseAnimateAction) {
          let lastAction = this.activePoseAnimateAction;
          lastAction.fadeOut(FADE_OUT);
          setTimeout(() => {
            lastAction.paused = true;
          }, FADE_OUT * 1000);
        }
        this.activePoseAnimateAction = action;
        action.reset();
        action.fadeIn(FADE_IN);
        action.play();
      } else {
        // load
        let animateClip = await MetaMakerForThree.loadAnimate(this.animateName, false);
        let action = this.mixer.clipAction(animateClip);

        if (this.activePoseAnimateAction) {
          let lastAction = this.activePoseAnimateAction;
          lastAction.fadeOut(FADE_OUT);
          setTimeout(() => {
            lastAction.paused = true;
          }, FADE_OUT * 1000);
        }
        this.cacheActionMap.set(this.animateName, action);
        this.activePoseAnimateAction = action;
        action.fadeIn(FADE_IN);
        action.play();
      }
    },
    /**
     *
     * @param { string } idolName
     * 更换Idol
     */
    async handleChangeIdol(idolName) {
      this.activeIdol = idolName;
      let idol = this.idolList.find((item) => item.name == idolName);
      this.mixer.uncacheRoot(this.idol);
      this.scene.remove(this.idol);
      this.cacheActionMap = new Map();
      await this.initIdol(idol.url);
    },

    async handleChangeEMO(emoUrl) {
      let clip = await MetaMakeForThree.loadAnimate(emoUrl, true);
      let action = this.mixer.clipAction(clip);
      action.play();
    },
    animate() {
      let delta = this.clock.getDelta();
      window.requestAnimationFrame(this.animate);
      this.mixer && this.mixer.update(delta);
      this.renderer.render(this.scene, this.camera);
    },
  },
});
</script>

<style>
body {
  margin: 0px;
  padding: 0px;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
