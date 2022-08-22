import * as THREE from "three";
import { GLTFLoader } from "./utils/GLTFLoader";
import { resetMaterial } from "./utils/ResetMaterial";
import { setBodyMorphTargetDictionary, setTeethMorphTargetDictionary } from "./utils/convert";
import { downloadAnimation, loadAnimationData } from "./utils/downloadAnimation";
import Convert from "./utils/convert";
function loadGLTFModal(url: string): Promise<THREE.Group> {
  return new Promise((resolve) => {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      const model = gltf.scene;
      resetMaterial(model);
      const body = model.getObjectByName("pingjunren") as THREE.Mesh;
      setBodyMorphTargetDictionary(body.morphTargetDictionary);
      const teeth = model.getObjectByName("tooth_down") as THREE.Mesh;
      setTeethMorphTargetDictionary(teeth.morphTargetDictionary);
      body.updateMorphTargets();
      resolve(model);
    });
  });
}

function loadTTSTeethAnimation(url: string): Promise<THREE.AnimationClip> {
  return downloadAnimation(url, "tooth_down");
}

function loadTTSEmoAnimation(url: string): Promise<THREE.AnimationClip> {
  return downloadAnimation(url, "pingjunren");
}

export {
  Convert,
  loadAnimationData,
  downloadAnimation,
  loadGLTFModal,
  loadTTSTeethAnimation,
  loadTTSEmoAnimation,
};
