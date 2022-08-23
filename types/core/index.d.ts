import * as THREE from "three";
import { downloadAnimation, loadAnimationData } from "./utils/downloadAnimation";
import Convert from "./utils/convert";
declare function loadGLTFModal(url: string): Promise<THREE.Group>;
declare function loadTTSTeethAnimation(url: string): Promise<THREE.AnimationClip>;
declare function loadTTSEmoAnimation(url: string): Promise<THREE.AnimationClip>;
export { Convert, loadAnimationData, downloadAnimation, loadGLTFModal, loadTTSTeethAnimation, loadTTSEmoAnimation, };
