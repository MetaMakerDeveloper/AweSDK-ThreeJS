import { GLTFLoader } from "./utils/GLTFLoader";
import { resetMaterial } from "./utils/ResetMaterial";
import { setBodyMorphTargetDictionary, setTeethMorphTargetDictionary } from "./utils/convert";
import { loadAnimateData, downloadAnimation } from "./utils/downloadAnimation";
import Convert from "./utils/convert";
import * as THREE from "three";
export default class MetaMakerForThree {
  /**
   *
   * @param {string} url
   * @returns { Promise<THREE.Group>}
   * 加载GlTF人物模型
   */
  static loadModel(url) {
    return new Promise((resolve) => {
      let loader = new GLTFLoader();
      console.warn("加载人物资源");
      loader.load(url, (gltf) => {
        const model = gltf.scene;
        resetMaterial(model);
        console.warn("加载人物资源成功");
        const body = model.getObjectByName("pingjunren");
        setBodyMorphTargetDictionary(body.morphTargetDictionary);
        const teeth = model.getObjectByName("tooth_down");
        setTeethMorphTargetDictionary(teeth.morphTargetDictionary);
        body.updateMorphTargets();
        resolve(model);
      });
    });
  }

  /**
   * @desc 加载姿态动画
   */
  static async loadAnimate(animateName, isEmotion = false) {
    // todo
    let json = await loadAnimateData(animateName);
    let clip = Convert(json, isEmotion);
    return clip;
  }

  /**
   * @desc 加载TTS和口型，表情动画
   * 这是一个测试接口，仅提供案例，请勿直接使用
   */
  static async loadTTSAndAnimate(
    text,
    tts = { voice_name: "智能客服_静静", speed: 50, volume: 30 }
  ) {
    let response = await fetch("//open.metamaker.cn/api/tts/v1/text_to_anim", {
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
    let data = await Promise.all([
      loadAudio(response.ret.audio),
      MetaMakerForThree.loadTeethAnimate(response.ret.teeth_anim),
      MetaMakerForThree.loadEmoAnimate(response.ret.expression_anim),
    ]);
    let audioBuffer = data[0];
    let listener = new THREE.AudioListener();
    let audio = new THREE.Audio(listener);
    audio.setBuffer(audioBuffer);
    audio.setLoop(false);
    audio.setVolume(0.5);
    return [audio, data[1], data[2]];
  }
  /**
   * @desc 加载口型动画
   */
  static async loadTeethAnimate(url) {
    return downloadAnimation(url, "tooth_down");
  }
  /**
   * @desc 加载表情动画
   */
  static async loadEmoAnimate(url) {
    return downloadAnimation(url, "pingjunren");
  }
}

async function loadAudio(url) {
  return new Promise((resolve, reject) => {
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(url, (buffer) => {
      resolve(buffer);
    });
  });
}
