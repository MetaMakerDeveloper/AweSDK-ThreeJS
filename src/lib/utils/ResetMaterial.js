/* eslint-disable */
import * as THREE from "three";
import { MeshStandardMaterial, Vector2 } from "three";
export function resetMaterial(model) {
  const materialBackSide = new THREE.MeshStandardMaterial({
    blending: THREE.NormalBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    depthWrite: false,
    depthTest: true,
    transparent: true,
    side: THREE.BackSide,
  });
  let materialFrontSide = new THREE.MeshStandardMaterial({
    blending: THREE.NormalBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    depthWrite: false,
    depthTest: true,
    transparent: true,
    side: THREE.FrontSide,
  });
  let materialDoubleSide = new THREE.MeshStandardMaterial({
    blending: THREE.NormalBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    depthWrite: false,
    depthTest: true,
    transparent: true,
    side: THREE.DoubleSide,
  });

  let materialFirstPass = new THREE.MeshStandardMaterial({
    alphaTest: 0.9,
    transparent: false,
    side: THREE.DoubleSide,
  });
  var hairs = [];
  model.traverse((n) => {
    if (n.material != null && n.material.name.indexOf("Hair") >= 0) {
      hairs.push(n);
    } else if (n.material != null && n.material.name.indexOf("DiffNormalPacked") >= 0) {
      n.material.depthWrite = true;
    }

    if (n.material != null) {
      if (n.name.indexOf("EyeLeft") >= 0 && n.material.name.indexOf("BrownEye") >= 0) {
      } else if (n.name.indexOf("EyeRight") >= 0 && n.material.name.indexOf("BrownEye") >= 0) {
      } else {
        n.material.roughness = 0.8;
      }
    }
  });
  hairs.forEach((n) => {
    materialFirstPass.map = n.material.map;
    materialBackSide.map = n.material.map;
    materialFrontSide.map = n.material.map;
    materialDoubleSide.map = n.material.map;
    n.material = materialFirstPass;

    var mesh2 = n.clone();
    n.parent.add(mesh2);
    mesh2.material = materialBackSide;
    mesh2.renderOrder = n.renderOrder + 1;

    mesh2 = n.clone();
    n.parent.add(mesh2);
    mesh2.material = materialFrontSide;
    mesh2.renderOrder = n.renderOrder + 2;
  });
}
