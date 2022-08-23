import * as THREE from "three";
export default class MetaMakerForThree {
  /**
   *
   * @param animateName
   * 通过动画名称，异步请求动画文件，并转化为threejs的AnimationClip
   */
  static async loadAnimate(animateName: string): Promise<AnimationClip>;
  /**
   * 通过文字与语音信息
   * 获得一段音频与口型和表情的动画
   */
  static async loadTTSAndAnimate(
    text: string,
    tts: { voice_name: string; speed: number; volume: number }
  ): Promise<[THREE.Audio, THREE.AnimationClip, THREE.AnimationClip]>;

  /**
   *
   * @param url
   * 异步请求口型动画
   */
  static async loadTeethAnimate(url: string);
  /**
   *
   * @param url
   * 异步请求表情动画
   */
  static async loadEmoAnimate(url: string);
}
