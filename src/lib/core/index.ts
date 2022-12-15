/* eslint-disable */
import * as THREE from "three";
import { GLTFLoader } from "./utils/GLTFLoader";
import { resetMaterial ,resetPolygonOffset} from "./utils/ResetMaterial";
import {
  setBodyMorphTargetDictionary,
  setTeethMorphTargetDictionary,
  bodyMeshName,
  Tooth_downMeshName,
} from "./utils/convert";
import { downloadAnimation, loadAnimationData } from "./utils/downloadAnimation";

import Convert from "./utils/convert";
function loadGLTFModel(url: string): Promise<THREE.Group> {
  return new Promise((resolve) => {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      const model = gltf.scene;
      gltf.scene.traverse((child) => {
        if ( child.type == 'SkinnedMesh' ) {
          child.frustumCulled = false;
        }
        // var n:any =child ;
        // if (n.material != null ){
        //    if (n.material.name.indexOf("DiffNormalPacked") >= 0||n.material.name.indexOf("Custom/Diff") >= 0) {
        //     console.log("0000000000000000000000000"+n.material.depthWrite)
        //     console.log(n.name)
        //    }
        // }
      });
      
      setModelInfo(model);
      resolve(model);
    });
  });
}

function parseGLTFModel(buffer: ArrayBuffer): Promise<THREE.Group> {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.parse(
      buffer,
      "",
      (gltf) => {
        const model = gltf.scene;
        gltf.scene.traverse((child) => {
          if ( child.type == 'SkinnedMesh' ) {
            child.frustumCulled = false;
          }
          // var n:any =child ;
          // if (n.material != null ){
          //    if (n.material.name.indexOf("DiffNormalPacked") >= 0||n.material.name.indexOf("Custom/Diff") >= 0) {
          //     console.log("0000000000000000000000000"+n.material.depthWrite)
          //     console.log(n.name)
          //     console.log(n.material.name)
          //    }
          // }
        });
        setModelInfo(model);
        resolve(model);
      },
      (e) => {
        reject(e);
      }
    );
  });
}

//兼容2.0融合变形名称
function remapMorphtarget(obj){
    for(var key in obj.morphTargetDictionary){
      var ss = key.split("_");
      var newKey = key.replace("_"+ss[ss.length-1], "");
      obj.morphTargetDictionary[newKey] = obj.morphTargetDictionary[key];
    }
}
// 设置Model信息
function setModelInfo(model) {
  resetMaterial(model);

  let body =model.getObjectByName("head_part");

  if(body==undefined){
    let body = model.getObjectByName("body").children[0] as THREE.Mesh;
    if (!body.morphTargetDictionary) {
      body = body.parent.children[1] as THREE.Mesh;
    }
  }

  let teeth = model.getObjectByName("tooth_down") as THREE.Mesh;
  if (!teeth.morphTargetDictionary) {
    teeth = teeth.children[0] as THREE.Mesh;
  }

  if(model.getObjectByName("character").userData.developVersion=="2.0"){
      remapMorphtarget(body);
      remapMorphtarget(teeth);
  }
  setBodyMorphTargetDictionary(body.name, body.morphTargetDictionary);
 
  setTeethMorphTargetDictionary(teeth.name, teeth.morphTargetDictionary);
  teeth.updateMorphTargets();
  body.updateMorphTargets();
  return model;
}

function loadTTSTeethAnimation(url: string): Promise<THREE.AnimationClip> {
  return downloadAnimation(url, Tooth_downMeshName);
}

function loadTTSEmoAnimation(url: string): Promise<THREE.AnimationClip> {
  return downloadAnimation(url, bodyMeshName);
}

export {
  Convert,
  loadAnimationData,
  downloadAnimation,
  loadGLTFModel,
  parseGLTFModel,
  loadTTSTeethAnimation,
  loadTTSEmoAnimation,
  resetPolygonOffset
};
