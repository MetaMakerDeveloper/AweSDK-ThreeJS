import {
  Bone,
  BoxGeometry,
  Color,
  CylinderGeometry,
  Euler,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Quaternion,
  SphereGeometry,
  Vector3,
} from "three";

/**
 * Dependencies
 *  - Ammo.js https://github.com/kripken/ammo.js
 *
 * MMDPhysics calculates physics with Ammo(Bullet based JavaScript Physics engine)
 * for MMD model loaded by MMDLoader.
 *
 * TODO
 *  - Physics in Worker
 */

/* global Ammo */

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

class LCache {
  constructor() {
    // for Three.js
    this.threeVector3s = [];
    this.threeMatrix4s = [];
    this.threeQuaternions = [];
    this.threeEulers = [];
  }

  allocThreeVector3() {
    return this.threeVector3s.length > 0 ? this.threeVector3s.pop() : new Vector3();
  }

  freeThreeVector3(v) {
    this.threeVector3s.push(v);
  }

  allocThreeMatrix4() {
    return this.threeMatrix4s.length > 0 ? this.threeMatrix4s.pop() : new Matrix4();
  }

  freeThreeMatrix4(m) {
    this.threeMatrix4s.push(m);
  }

  allocThreeQuaternion() {
    return this.threeQuaternions.length > 0 ? this.threeQuaternions.pop() : new Quaternion();
  }

  freeThreeQuaternion(q) {
    this.threeQuaternions.push(q);
  }

  allocThreeEuler() {
    return this.threeEulers.length > 0 ? this.threeEulers.pop() : new Euler();
  }

  freeThreeEuler(e) {
    this.threeEulers.push(e);
  }
}
class ClothHelper extends Object3D {
  /**
   * Visualize Rigid bodies
   *
   * @param {THREE.SkinnedMesh} mesh
   * @param {Physics} physics
   */
  constructor(mesh, physics) {
    super();
    this.lCache = new LCache();
    this.root = mesh;
    this.physics = physics;
    this.matrix.copy(mesh.matrixWorld);
    this.matrixAutoUpdate = false;

    this.materials = [];

    this.materials.push(
      new MeshBasicMaterial({
        color: new Color(0xff8888),
        wireframe: true,
        depthTest: false,
        depthWrite: false,
        opacity: 0.25,
        transparent: true,
      })
    );

    this.materials.push(
      new MeshBasicMaterial({
        color: new Color(0x88ff88),
        wireframe: true,
        depthTest: false,
        depthWrite: false,
        opacity: 0.25,
        transparent: true,
      })
    );

    this.materials.push(
      new MeshBasicMaterial({
        color: new Color(0x8888ff),
        wireframe: true,
        depthTest: false,
        depthWrite: false,
        opacity: 0.25,
        transparent: true,
      })
    );

    this._init();
  }

  /**
   * Updates Rigid Bodies visualization.
   */
  updateMatrixWorld(force) {
    var mesh = this.root;

    if (this.visible) {
      var bodies = this.physics.pos;

      for (var i = 0, il = bodies.length; i < il; i++) {
        var child = this.children[i];

        child.position.copy(bodies[i]);
      }

      for (var i = 0, il = this.physics.spheres.length; i < il; i++) {
        var child = this.children[bodies.length + i];
        var p = this.physics.convertCoord(
          this.physics.spheres[i].center,
          this.physics.spheres[i].handle
        );
        child.position.copy(p);
      }

      for (var i = 0, il = this.physics.cylinders.length; i < il; i++) {
        var child = this.children[bodies.length + this.physics.spheres.length + i];
        var p = this.physics.convertCoord(
          this.physics.cylinders[i].upcenter,
          this.physics.cylinders[i].handle1
        );
        var p1 = this.physics.convertCoord(
          this.physics.cylinders[i].downcenter,
          this.physics.cylinders[i].handle1
        );
        child.position.copy(p.clone().add(p1).multiplyScalar(0.5));
        child.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), p.sub(p1).normalize());
      }
    }

    super.updateMatrixWorld(force);
  }

  // private method

  _init() {
    var bodies = this.physics.pos;

    function createGeometry(param) {
      switch (param.shapeType) {
        case 0:
          return new SphereGeometry(param.width, 16, 8);

        case 1:
          return new BoxGeometry(param.width * 2, param.height * 2, param.depth * 2, 8, 8, 8);

        case 2:
          return new createCapsuleGeometry(param.width, param.height, 16, 8);

        default:
          return null;
      }
    }

    function createCapsuleGeometry(radius, cylinderHeight, segmentsRadius, segmentsHeight) {
      var geometry = new CylinderGeometry(
        radius,
        radius,
        cylinderHeight,
        segmentsRadius,
        segmentsHeight,
        true
      );
      var upperSphere = new Mesh(
        new SphereGeometry(radius, segmentsRadius, segmentsHeight, 0, Math.PI * 2, 0, Math.PI / 2)
      );
      var lowerSphere = new Mesh(
        new SphereGeometry(
          radius,
          segmentsRadius,
          segmentsHeight,
          0,
          Math.PI * 2,
          Math.PI / 2,
          Math.PI / 2
        )
      );

      upperSphere.position.set(0, cylinderHeight / 2, 0);
      lowerSphere.position.set(0, -cylinderHeight / 2, 0);

      upperSphere.updateMatrix();
      lowerSphere.updateMatrix();

      geometry.merge(upperSphere.geometry, upperSphere.matrix);
      geometry.merge(lowerSphere.geometry, lowerSphere.matrix);

      return geometry;
    }

    for (var i = 0, il = bodies.length; i < il; i++) {
      var param = bodies[i].params;
      this.add(new Mesh(createGeometry({ shapeType: 0, width: 0.002 }), this.materials[0]));
    }

    for (var i = 0, il = this.physics.spheres.length; i < il; i++) {
      this.add(
        new Mesh(
          createGeometry({ shapeType: 0, width: this.physics.spheres[i].radius }),
          this.materials[0]
        )
      );
    }

    for (var i = 0, il = this.physics.cylinders.length; i < il; i++) {
      var cy = this.physics.cylinders[i];
      this.add(
        new Mesh(
          createGeometry({
            shapeType: 2,
            width: cy.Radius,
            height: cy.upcenter.clone().sub(cy.downcenter).length(),
          }),
          this.materials[0]
        )
      );
    }
  }
}
function parseBoolean(s) {
  return s === "true";
}
class ClothPhysicManager {
  constructor() {
    this.clothPhysics = {};
  }
  setClothPhysics(gltf) {
    var body = gltf.getObjectByName("body");
    if (body == undefined || !(body instanceof Mesh))
      body = gltf.getObjectByName("head_part");
    gltf.traverse((child) => {
      if (child.userData != undefined && child.userData["dynamic"] != undefined) {
        // child.material.envMap = envMap;
        /////////////////
        var ok = false;
        child.traverse((c) => {
          if (c instanceof Mesh) {
            // child.material.envMap = envMap;
            if (!ok) {
              var cp = new ClothPhysics(c, body, child.userData["dynamic"]);
              cp.resetPos=true;
             // var h = cp.createHelper();
             // scene.add(h);
              if (this.clothPhysics[gltf] == undefined) this.clothPhysics[gltf] = [];
              this.clothPhysics[gltf].push(cp);
            }

            ok = true;
          }
        });
      }
    });
  }
  removeClothPhysics(gltf) {
    this.clothPhysics[gltf] = undefined;
  }
  removeAllClothPhysics() {
    this.clothPhysics = {};
  }
  update(dt) {
    for (var key in this.clothPhysics) {
      const clothes = this.clothPhysics[key];
      if (clothes != undefined) {
        for (var i = 0; i < clothes.length; i++) {
          clothes[i].update(dt);
        }
      }
    }
  }
}
const ClothPhysicManagerInstance = new ClothPhysicManager();
class ClothPhysics {
  /**
   * @param {THREE.SkinnedMesh} mesh
   * @param {Array<Object>} rigidBodyParams
   * @param {Array<Object>} (optional) constraintParams
   * @param {Object} params - (optional)
   * @param {Number} params.unitStep - Default is 1 / 65.
   * @param {Integer} params.maxStepNum - Default is 3.
   * @param {Vector3} params.gravity - Default is ( 0, - 9.8 * 10, 0 )
   */

  constructor(mesh, mainBody, xml) {
    const nBone = mesh.skeleton.bones.length;
    this.initPosition = new Array(nBone);
    this.originPosition = new Array(nBone);
    this.gravity = new Vector3(0, -9.8, 0);
    this.pos = new Array(nBone);
    this.old_pos = new Array(nBone);
    this.direction = new Array(nBone);
    this.invmass = new Array(nBone);
    this.accel = new Array(nBone);
    this.upcloth = new Array(nBone);
    this.velo = new Array(nBone);
    this.shapeForce = new Array(nBone);
    this.boneHandle = this.create2dArray(11, 30, -1);
    this.boneCol = new Array(11);
    this.mapBone = {};
    this.rownum = 0;
    this.rownum2 = 0;
    this.mapRow = {};
    this.mapCol = {};
    this.mapCons = {};
    this.yMap = {};
    this.constraints = [];
    this.mainBody = mainBody;
    this.mesh = mesh;
    this.rowprop = 0.5;
    this.spheres = [];
    this.cylinders = [];
    this.sphereHelpers = [];
    this.iter = 1;
    this.targetPosition = new Array(this.pos.length).fill(new Vector3());
    this.originFrameRotation = {};
    this.originRotation = {};
    this.resultFrameRotation = {};
    this.sDynamicEnable = true;
    const worldPositon = new Vector3();

    for (var i = 0; i < nBone; i++) {
      const bone = mesh.skeleton.bones[i];
      bone.index = i;
      bone.getWorldPosition(worldPositon);
      this.initPosition[i] = worldPositon.clone();
      this.originPosition[i] = worldPositon.clone();
      this.originRotation[i] = new Quaternion();
      bone.getWorldQuaternion(this.originRotation[i]);
      this.pos[i] = worldPositon.clone();
      this.old_pos[i] = worldPositon.clone();

      this.invmass[i] = 1.0;
      this.accel[i] = new Vector3(0, 0, 0);
      this.shapeForce[i] = 0.5;
      this.upcloth[i] = false;
      this.velo[i] = new Vector3(0, 0, 0);
    }

    this.boneCol.fill(0);
    this.joints = {};
    for (var i = 0; i < mainBody.skeleton.bones.length; i++) {
      this.joints[mainBody.skeleton.bones[i].name] = new Vector3();
      mainBody.skeleton.bones[i].getWorldPosition(this.joints[mainBody.skeleton.bones[i].name]);
    }
    var oParser = new DOMParser();
    var oDOM = oParser.parseFromString(xml, "application/xml");

    const doc = oDOM.getElementsByTagName("dynamic")[0];
    //parse xml
    this.constrainBoneName = "head";
    if (doc.hasAttribute("constrain")) {
      this.constrainBoneName = doc.getAttribute("constrain");
      this.constrainBoneIndex = this.getBoneIndexByName(
        this.mainBody.skeleton,
        this.constrainBoneName
      );
    }

    this.rowcol = true;
    if (doc.hasAttribute("rowcol")) this.rowcol = this.parseBoolean(doc.getAttribute("rowcol"));

    for (var k = 0; k < mesh.skeleton.bones.length; k++) {
      const bone = mesh.skeleton.bones[k];
      var boneName = this.strimBoneName(bone.name);

      const handle = k;
      this.mapBone[boneName] = handle;
      if (!this.rowcol) continue;
      const pair = boneName.split("_");
      if (pair.length == 2) {
        const bi = this.strToInt(pair[0], true);
        const bj = this.strToInt(pair[1], false);
        if (bi == -1) continue;
        this.boneHandle[bi][bj] = handle;
        //   boneCol[bi]++;
        this.mapRow[handle] = bi;
        this.mapCol[handle] = bj;
        if (this.mapRow[handle] > this.rownum) this.rownum = this.mapRow[handle];
        if (this.mapCol[handle] >= this.boneCol[bi]) this.boneCol[bi] = this.mapCol[handle] + 1;
      } else {
      }
    }

    const particles = oDOM.getElementsByTagName("particles")[0];
    for (var j = 0; j < particles.childNodes.length; j++) {
      var particle = particles.childNodes[j];
      if (particle.nodeType == Node.TEXT_NODE) continue;
      const name = particle.getAttribute("name");
      const index = this.mapBone[name];

      var mass = 0;
      if (particle.hasAttribute("mass")) {
        mass = parseFloat(particle.getAttribute("mass"));
        if (mass > 0) mass = 1.0 / mass;
      }
      this.invmass[index] = mass;

      if (particle.hasAttribute("shapeForce"))
        this.shapeForce[index] = parseFloat(particle.getAttribute("shapeForce"));

      const constrain = particle.getAttribute("constrain");
      if (constrain != "") this.mapCons[index] = constrain;
      else this.mapCons[index] = constrainBoneName;

      const rightParticle = particle.getAttribute("rightParticle");
      if (rightParticle != "") {
        if (this.mapBone[rightParticle] == undefined) this.yMap[index] = undefined;
        else this.yMap[index] = parseInt(this.mapBone[rightParticle]);
      }
    }

    var upcloths = oDOM.getElementsByTagName("upcloth");
    if (upcloths.length > 0) {
      upcloths = upcloths[0];
      for (var j = 0; j < upcloths.childNodes.length; j++) {
        var upbone = upcloths.childNodes[j];
        if (upbone.nodeType == Node.TEXT_NODE) continue;
        const name = upbone.getAttribute("name");
        const index = this.mapBone[name];
        if (index == undefined) continue;
        const constrain = upbone.getAttribute("constrain");
        if (constrain != "") this.mapCons[index] = constrain;
        if (constrain == "hips2") this.mapCons[index] = "hips1";

        this.shapeForce[index] = 1.0;
        this.upcloth[index] = true;
      }
    }

    this.mapConsIndex = {};
    for (var key in this.mapCons) {
      this.mapConsIndex[key] = this.getBoneIndexByName(this.mainBody.skeleton, this.mapCons[key]);
    }
    const links = oDOM.getElementsByTagName("links")[0];

    if (links.getAttribute("parentchild")) this._buildParentChildLink(mesh.skeleton.bones[0]);

    if (links.hasAttribute("gravity"))
      this.g = new Vector3(0, parseFloat(links.getAttribute("gravity")), 0);

    if (links.hasAttribute("constrain_iters"))
      this.max_constrain_iters = parseInt(links.getAttribute("constrain_iters"));

    if (links.hasAttribute("kdrag")) this.kdrag = parseFloat(links.getAttribute("kdrag"));

    if (links.hasAttribute("vdrag")) this.vdrag = parseFloat(links.getAttribute("vdrag"));

    if (links.hasAttribute("vdrag_up")) this.vdrag_up = parseFloat(links.getAttribute("vdrag_up"));

    if (links.hasAttribute("target"))
      this.TARGETCONSTRAINT = parseBoolean(links.getAttribute("target"));

    if (links.hasAttribute("horizon")) this.HORIZON = parseBoolean(links.getAttribute("horizon"));

    if (links.hasAttribute("targetprop"))
      this.targetprop = parseFloat(links.getAttribute("targetprop"));

    if (links.hasAttribute("rowprop")) this.rowprop = parseFloat(links.getAttribute("rowprop"));

    if (links.hasAttribute("earth"))
      this.EARTHCOLLISION = parseBoolean(links.getAttribute("earth"));
    if (links.hasAttribute("jack")) this.JACKCLOTH = parseBoolean(links.getAttribute("jack"));
    if (links.hasAttribute("middle"))
      this.MIDDLEPROCESS = parseBoolean(links.getAttribute("middle"));
    if (links.hasAttribute("mulpieces"))
      this.MULPIECES = parseBoolean(links.getAttribute("mulpieces"));
    if (links.hasAttribute("multarget"))
      this.MULTARGET = parseBoolean(links.getAttribute("multarget"));
    if (links.hasAttribute("bodyadjust"))
      this.BODYADJUST = parseBoolean(links.getAttribute("bodyadjust"));
    if (links.hasAttribute("collisionnew"))
      this.SQUARECOLLISION = parseBoolean(links.getAttribute("collisionnew"));
    if (links.hasAttribute("split")) this.SPLITCLOTH = parseBoolean(links.getAttribute("split"));

    if (parseBoolean(links.getAttribute("brother"))) {
      for (var key in this.yMap) {
        if (this.mapRow[key] != undefined) {
          this.AddLink(parseInt(key), this.yMap[key], -1.0);
        } else {
          this.AddLink(parseInt(key), this.yMap[key], -2.0);
        }
      }

      for (var key in this.yMap) {
        const n = this.yMap[this.yMap[key]];
        if (key == n) continue;

        this.AddLink(parseInt(key), n, 0);
      }
    }

    if (links.hasAttribute("rownum")) this.rownum = parseInt(links.getAttribute("rownum"));

    if (links.hasAttribute("rownum2")) this.rownum2 = parseInt(links.getAttribute("rownum2"));

    for (var j = 0; j < links.childNodes.length; j++) {
      const link = links.childNodes[j];
      if (link.nodeType == Node.TEXT_NODE) continue;
      var soft = 1.0;
      const start = link.getAttribute("start");
      const end = link.getAttribute("end");
      if (link.hasAttribute("soft")) {
        soft = parseFloat(link.getAttribute("soft"));
        soft = -1.0;
      }
      this.AddLink(this.mapBone[start], this.mapBone[end], soft);
    }

    this.addSolids(doc);
    this.squareListInit();
    this.calcBoneTransform();
    for (var key in this.resultFrameRotation) {
      this.originFrameRotation[key] = this.resultFrameRotation[key].clone();
    }

    this.pp = 0;
  }
  calcBoneTransform() {
    const nBone = this.mesh.skeleton.bones.length;
    const bones = this.mesh.skeleton.bones;
    for (var i = 0; i < nBone; i++) {
      var bone = bones[i];
      var parent = bone.parent;
      var child = bone.children[0];
      if (this.upcloth[i] == false) {
        if (bone == bones[0]) {
          this.resultFrameRotation[i] = bone.getWorldQuaternion(new Quaternion());
          continue;
        }

        var x1 = this.pos[i].clone().sub(this.pos[bone.parent.index]); //bone.position.clone();
        //not hair
        if (child != undefined) {
          if (this.mapRow[i] > 2) {
            x1.add(this.pos[child.index].clone().sub(this.pos[i]));
          } else if (this.mapRow[i] == 2) {
            x1 = this.pos[child.index].clone().sub(this.pos[i]); //child.position.clone();
          }
        }

        const second = this.yMap[this.mapBone[this.strimBoneName(bone.name)]];
        var y1 = new Vector3(0, 0, -1);
        if (second != undefined) {
          y1.copy(this.pos[second].clone().sub(this.pos[i]));
        }

        var z1 = x1.clone();
        z1.cross(y1);

        y1.copy(z1).cross(x1);
        x1.normalize();
        y1.normalize();
        z1.normalize();
        var mat = new Matrix4();
        mat.makeBasis(x1, y1, z1);
        var e = new Quaternion();
        e.setFromRotationMatrix(mat);
        this.resultFrameRotation[i] = e;
      }
    }
  }
  updateBone() {
    const nBone = this.mesh.skeleton.bones.length;
    const bones = this.mesh.skeleton.bones;
    this.calcBoneTransform();
    for (var i = 0; i < nBone; i++) {
      if (this.upcloth[i] || i == 0) continue;
      const bone = bones[i];

      var pos = this.pos[i].clone();
      var frameQ = this.resultFrameRotation[i];
      var originFrameQ = this.originFrameRotation[i];
      var originQ = this.originRotation[i];

      var rotatoin = frameQ.clone().multiply(originFrameQ.clone().invert());
      var finalQ = frameQ.clone().multiply(originFrameQ.clone().invert()).multiply(originQ);
      if (bone.parent) {
        bone.parent.updateWorldMatrix(true, false);
        bone.parent.worldToLocal(pos);
        bone.position.set(pos.x, pos.y, pos.z);
        const parentQuatInvert = bone.parent.getWorldQuaternion(new Quaternion()).invert();
        parentQuatInvert.multiply(finalQ);
        bone.quaternion.set(
          parentQuatInvert.x,
          parentQuatInvert.y,
          parentQuatInvert.z,
          parentQuatInvert.w
        );
        bone.updateWorldMatrix(true, false);
      }
    }
  }
  //todo
  strimBoneName(boneName) {
    const pair2 = boneName.split("_");
    if (pair2.length == 3) {
      if (
        boneName.includes("one") ||
        boneName.includes("two") ||
        boneName.includes("three") ||
        boneName.includes("four") ||
        boneName.includes("five") ||
        boneName.includes("six") ||
        boneName.includes("seven") ||
        boneName.includes("eight") ||
        boneName.includes("zero")
      )
        boneName = pair2[0] + "_" + pair2[1];
    }
    return boneName;
  }
  squareListInit() {
    if (this.constrainBoneName == "head") return;

    this.squareList = new Array(2).fill();
    for (var i = 0; i < this.squareList.length; i++) this.squareList[i] = [];
    if (this.rownum2 == 0) {
      for (var i = 0; i < this.squareList.length; i++) this.squareList[i].push(i);
    } else {
      for (var i = 0; i < this.squareList.length; i++) {
        this.squareList[i].push(i);
        this.squareList[i].push(i + 2);
      }
    }
  }
  loadSolid(s, start_bias, end_bias, radius, s_e_bone) {
    if (s.hasAttribute("start_bias_x"))
      start_bias.x = parseFloat(s.getAttribute("start_bias_x")) / 100;

    if (s.hasAttribute("start_bias_y"))
      start_bias.y = parseFloat(s.getAttribute("start_bias_y")) / 100;

    if (s.hasAttribute("start_bias_z"))
      start_bias.z = parseFloat(s.getAttribute("start_bias_z")) / 100;

    if (s.hasAttribute("end_bias_x")) end_bias.x = parseFloat(s.getAttribute("end_bias_x")) / 100;

    if (s.hasAttribute("end_bias_y")) end_bias.y = parseFloat(s.getAttribute("end_bias_y")) / 100;

    if (s.hasAttribute("end_bias_z")) end_bias.z = parseFloat(s.getAttribute("end_bias_z")) / 100;

    if (s.hasAttribute("radius")) s_e_bone.radius = parseFloat(s.getAttribute("radius")) / 200;

    if (s.hasAttribute("start_bone")) s_e_bone.s = s.getAttribute("start_bone");

    if (s.hasAttribute("end_bone")) s_e_bone.e = s.getAttribute("end_bone");
  }
  addSolids(dom) {
    var solids = dom.getElementsByTagName("solids");
    if (solids == undefined) return;
    solids = solids[0];
    if (this.mainBody == undefined) return;
    var mainSkeleton = this.mainBody.skeleton;

    ///添加默认的球形胸部碰撞
    var offsetBias = new Vector3(0, -2 / 100, -3 / 100);
    var chestRadius = 4.0 / 100;
    var isExistLeft = false;
    var isExistRight = false;
    var leftchestName = "Leftchest1";
    var rightchestName = "rightchest1";
    ///
    var init = this.BODYADJUST ? true : false;
    var spheres = dom.getElementsByTagName("spheres")[0];
    this.spheres = [];
    if (spheres != undefined) {
      for (var j = 0; j < spheres.childNodes.length; j++) {
        const sp = spheres.childNodes[j];
        if (sp.nodeType == Node.TEXT_NODE) continue;

        var start_bias = new Vector3();
        var end_bias = new Vector3();
        var radius = 8.0 / 100;
        var start_bone;
        var end_bone;
        var s_e_bone = {};
        this.loadSolid(sp, start_bias, end_bias, radius, s_e_bone);

        var handle = this.getBoneIndexByName(mainSkeleton, s_e_bone.s); //mainSkeleton.GetBone(start_bone)->index_;
        var bone_pos = this.calcJointPos(s_e_bone.s, init);
        bone_pos.add(start_bias);
        var sc = {
          center: bone_pos,
          radius: s_e_bone.radius,
          handle: handle,
          name: s_e_bone.s,
          isAuto: false,
        };
        this.spheres.push(sc);
      }
    }

    var cylinders = dom.getElementsByTagName("cylinders");
    if (cylinders != undefined) {
      cylinders = cylinders[0];
      this.cylinders = [];
      for (var j = 0; j < cylinders.childNodes.length; j++) {
        const cy = cylinders.childNodes[j];
        if (cy.nodeType == Node.TEXT_NODE) continue;

        var start_bias = new Vector3();
        var end_bias = new Vector3();
        var radius = 8.0 / 100;
        var s_e_bone = {};
        var end_bone;
        this.loadSolid(cy, start_bias, end_bias, radius, s_e_bone);

        ///sumingnan
        if (s_e_bone.s == leftchestName) isExistLeft = true;
        else if (s_e_bone.s == rightchestName) isExistRight = true;

        var start_bone_pos = this.calcJointPos(s_e_bone.s, init);
        var end_bone_pos = this.calcJointPos(s_e_bone.e, init);

        var handle = this.getBoneIndexByName(mainSkeleton, s_e_bone.s); //((Bone*)mainSkeleton.GetBone(start_bone))->index_;
        start_bone_pos.add(start_bias);

        var handle2 = this.getBoneIndexByName(mainSkeleton, s_e_bone.e);
        end_bone_pos.add(end_bias);

        var v = end_bone_pos.clone().sub(start_bone_pos);
        var len = v.length();
        v.normalize();

        this.cylinders.push({
          upcenter: start_bone_pos,
          downcenter: end_bone_pos,
          Radius: s_e_bone.radius,
          Length: len,
          handle1: handle,
          handle2: handle2,
          name: s_e_bone.s,
          downname: s_e_bone.e,
          isAuto: isExistLeft || isExistRight,
        });
      }
      ///sumingnan
      if (this.constrainBoneName == "head") {
        if (!isExistLeft) {
          var handle = this.getBoneIndexByName(this.mainBody.skeleton, leftchestName);
          var bone_pos = this.calcJointPos(leftchestName, init);
          bone_pos.add(offsetBias);

          var handle2 = this.getBoneIndexByName(this.mainBody.skeleton, "Leftchest");
          var end_bone_pos = this.calcJointPos("Leftchest", init);
          end_bone_pos.add(offsetBias);

          var v = end_bone_pos.clone().sub(bone_pos);
          var len = v.length();
          v.normalize();

          this.cylinders.push({
            upcenter: bone_pos,
            downcenter: end_bone_pos,
            Radius: chestRadius,
            Length: len,
            handle1: handle,
            handle2: handle2,
            name: leftchestName,
            downname: "Leftchest",
            isAuto: true,
          });
        }
        if (!isExistRight) {
          var handle = this.getBoneIndexByName(this.mainBody.skeleton, rightchestName);
          var bone_pos = this.calcJointPos(rightchestName, init);
          bone_pos.add(offsetBias);

          var handle2 = this.getBoneIndexByName(this.mainBody.skeleton, "rightchest");
          var end_bone_pos = this.calcJointPos("rightchest", init);
          end_bone_pos.add(offsetBias);

          var v = end_bone_pos.clone().sub(bone_pos);
          var len = v.length();
          v.normalize();

          this.cylinders.push({
            upcenter: bone_pos,
            downcenter: end_bone_pos,
            Radius: chestRadius,
            Length: len,
            handle1: handle,
            handle2: handle2,
            name: rightchestName,
            downname: "rightchest",
            isAuto: true,
          });
        }
      }
      for (var i = 0; i < this.cylinders.length; i++) {
        this.cylinders[i].up_old = this.cylinders[i].upcenter.clone();
        this.cylinders[i].down_old = this.cylinders[i].downcenter.clone();
      }
    }
  }
  createHelper() {
    return new ClothHelper(this.mesh, this);
  }
  initParticlePosition() {}
  _buildParentChildLink(bone) {
    for (var i = 0; i < bone.children.length; i++) {
      const child = bone.children[i];
      if (child != null) {
        console.log(bone.name + " " + child.name);
        this.AddLink(
          this.mapBone[this.strimBoneName(bone.name)],
          this.mapBone[this.strimBoneName(child.name)],
          1.0
        );
        this._buildParentChildLink(child);
      }
    }
  }
  getBoneIndexByName(skeleton, name) {
    var bones = skeleton.bones;
    var index = -1;
    for (var i = 0; i < bones.length; i++) {
      if (bones[i].name == name) {
        index = i;
        break;
      }
    }
    return index;
  }
  AddLink(i, j, s) {
    if (i == -1 || j == -1) return;
    if (i == undefined || j == undefined) return;

    if (this.upcloth[i] == true && this.upcloth[j] == true) return;

    const c = {};
    c.particleA = i;
    c.particleB = j;
    c.soft = s;
    c.restLength = new Vector3().copy(this.pos[i]).sub(this.pos[j]).length();
    this.constraints.push(c);
  }

  strToInt(s, english) {
    if (english) {
      const strTable = new Array(
        "zero",
        "one",
        "two",
        "three",
        "four",
        "five",
        "six",
        "seven",
        "eight",
        "nine",
        "ten"
      );
      for (var i = 0; i < strTable.length; i++) {
        if (strTable[i] == s) return i;
      }
      return -1;
    } else return parseInt(s);
  }
  create2dArray(r, c, initValue) {
    var arr = new Array(r); //表格有10行
    for (var i = 0; i < arr.length; i++) {
      arr[i] = new Array(c).fill(initValue); //每行有10列
    }
    return arr;
  }

  convertCoord(origin, boneIndex) {
    const bone = this.mainBody.skeleton.bones[boneIndex];
    const invMat = this.mainBody.skeleton.boneInverses[boneIndex];

    const worldMat = new Matrix4();
    if (bone == undefined) return origin;
    bone.updateWorldMatrix(true, false);
    worldMat.multiplyMatrices(bone.matrixWorld, invMat);
    var refPos = origin.clone(); //wordMat.mu * origin;
    refPos.applyMatrix4(worldMat);
    return refPos;
  }
  /**
   * Advances Physics calculation and updates bones.
   *
   * @param {Number} delta - time in second
   * @return {MMDPhysics}
   */
  update(dt) {
    //this.mainBody.skeleton.getBoneByName("rightUpLeg").quaternion.copy(new Quaternion().setFromAxisAngle(new Vector3(0,0,1),1.2));
    // this.mainBody.skeleton.getBoneByName("rightUpLeg").updateWorldMatrix(true, false);

    const upcenters = new Array(this.cylinders.length);
    const downcenters = new Array(this.cylinders.length);
    const centers = new Array(this.spheres.length);

    const nCylinders = this.cylinders.length;
    for (var i = 0; i < nCylinders; i++) {
      upcenters[i] = this.convertCoord(this.cylinders[i].upcenter, this.cylinders[i].handle1);
      downcenters[i] = this.convertCoord(this.cylinders[i].downcenter, this.cylinders[i].handle1);
    }
    const nSpheres = this.spheres.length;

    for (var i = 0; i < nSpheres; i++) {
      centers[i] = this.convertCoord(this.spheres[i].center, this.spheres[i].handle);
    }

    if (this.resetPos) {
      var avgChange = 0.0;
      var num = 0;
      for (var k = 0; k < this.pos.length; k++) {
        if (this.JACKCLOTH && !this.upcloth[k])
          this.targetPosition[k] = this.convertCoord(this.initPosition[k], this.constrainBoneIndex);
        else this.targetPosition[k] = this.convertCoord(this.initPosition[k], this.mapConsIndex[k]);

        if (this.invmass[k] == 0 || this.upcloth[k]) {
          avgChange = avgChange + this.targetPosition[k].clone().sub(this.old_pos[k]).length();
          num++;
        }
      }
      avgChange /= num;
      if (true) {
        for (var k = 0; k < this.pos.length; k++) {
          this.old_pos[k].copy(this.targetPosition[k]);
          this.pos[k].copy(this.targetPosition[k]);
          this.velo[k].set(0, 0, 0);
        }
      } else {
        for (var k = 0; k < this.pos.length; k++) {
          if (this.invmass[k] == 0 || this.upcloth[k]) {
            this.old_pos[k].copy(this.pos[k]);
            this.pos[k].copy(this.targetPosition[k]);
          }
        }
      }
      this.resetPos = false;

      return;
    } else {
      for (var k = 0; k < this.pos.length; k++) {
        if (this.JACKCLOTH && !this.upcloth[k])
          this.targetPosition[k] = this.convertCoord(this.initPosition[k], this.constrainBoneIndex);
        else this.targetPosition[k] = this.convertCoord(this.initPosition[k], this.mapConsIndex[k]);
        if (this.invmass[k] == 0 || this.upcloth[k]) {
          this.old_pos[k].copy(this.pos[k]);
          this.pos[k].copy(this.targetPosition[k]);
        }
      }
    }

    /* Update positions. */
    if (this.cylinders.length != 0) this.clothFixMove(this.cylinders[0].Radius);

    /* Reset forces to force of gravity. */
    const airdrag = 2 / (1 + Math.exp(-this.kdrag)) - 1;
    for (var i = 0; i < this.pos.length; i++) {
      /* calculate gravity and wind resistance */
      if (this.invmass[i] == 0 || this.upcloth[i]) continue;
      this.old_pos[i].copy(this.pos[i]);
      this.pos[i].add(
        new Vector3()
          .copy(this.velo[i])
          .multiplyScalar(1 - airdrag)
          .add(new Vector3().copy(this.gravity).multiplyScalar(dt * dt))
          .add(new Vector3().copy(this.accel[i]).multiplyScalar(dt * dt))
      );
      this.accel[i].multiplyScalar(0.8);
    }

    if (this.JACKCLOTH && this.BODYADJUST) {
      var jackPosition = new Array(this.pos.length);
      this.copyVector3Array(jackPosition, this.pos);
      this.copyVector3Array(this.pos, this.targetPosition);
      this.springRestlengthReset(this.targetPosition);
      this.solveCollisionSquare(upcenters, downcenters);
      this.springConstrain(this.targetPosition);
      this.copyVector3Array(this.targetPosition, this.pos);
      this.copyVector3Array(this.pos, jackPosition);
      this.springRestlengthReset(this.targetPosition);
    }
    if (this.SQUARECOLLISION) this.secondRowAdjust(this.targetPosition);

    if (this.cylinders.length != 0)
      for (var i = 0; i < 2; i++) this.springConstrain(this.targetPosition);
    else this.constrain();

    for (var count = 0; count < this.iter; count++) {
      /*if(TARGETCONSTRAINT)
                targetConstraint(upcenters, downcenters, targetPosition);*/

      for (var k = 0; k < this.pos.length; k++) {
        if (this.invmass[k] == 0 || this.upcloth[k]) {
          this.pos[k].copy(this.targetPosition[k]);
          continue;
        }
        var sf = this.shapeForce[k];
        if (this.sDynamicEnable == false) {
          sf = 1.0;
          //      pos[k] = pos[k]*(1-sf) + targetPosition[k]*sf;
        } else if (this.confirm) {
          sf = 1.0 + ((this.shapeForce[k] - 1.0) * (this.frameCount - 1)) / 10.0;
        }
        this.pos[k] = this.pos[k]
          .multiplyScalar(1 - sf)
          .add(this.targetPosition[k].clone().multiplyScalar(sf));
        //this.pos[k].copy(this.targetPosition[k]);
      }
    }

    if (this.SQUARECOLLISION && !this.SPLITCLOTH) {
      this.maxParticleDistance(this.targetPosition);
    }

    for (var i = 0; i < this.pos.length; i++) this.velo[i].copy(this.pos[i]).sub(this.old_pos[i]);

    if (this.cylinders.length != 0 && this.sDynamicEnable) {
      if (this.SQUARECOLLISION) {
        this.stabilityConstrain(this.targetPosition);
        //if(this.pp>300)
        this.solveCollisionSquare(upcenters, downcenters);
        //this.pp=this.pp+1;
      }
      this.solveCollision(upcenters, downcenters, centers, this.HORIZON); // solving position and velocity problems in collsion;
    }
    this.updateBone();
    return this;
  }
  copyVector3Array(t, s) {
    for (var i = 0; i < s.length; i++) {
      if (t[i] == undefined) t[i] = s[i].clone();
      else t[i].copy(s[i]);
    }
  }
  clothFixMove(Radius) {
    for (var j = 0; j < this.boneCol[2]; j++) {
      // move other particles with the moving of fixed particles;

      if (this.boneHandle[2][j] == -1) continue;
      var move = this.pos[this.boneHandle[2][j]].clone().sub(this.old_pos[this.boneHandle[2][j]]);

      var cr = 0.5 * Radius;
      var moveunit = move.clone();
      var movelen = moveunit.length();
      moveunit.normalize();
      var rowall = this.rownum2 == 0 ? this.rownum : this.rownum2;
      for (var i = 0; i <= rowall; i++) {
        if (this.boneHandle[i][j] == -1) continue;
        if (this.invmass[this.boneHandle[i][j]] == 0) continue;
        if (movelen > cr)
          this.pos[this.boneHandle[i][j]].add(
            move.clone().sub(moveunit.clone().multiplyScalar(cr))
          );
        //                    else
        //                        pos[boneHandle[i][j]] += move*(rowall-mapRow[i])/(rowall-2);
      }
    }
  }
  springRestlengthReset(targets) {
    for (var i = 0; i < this.constraints.length; i++) {
      var a = this.constraints[i].particleA;
      var b = this.constraints[i].particleB;
      if (this.upcloth[a] || this.upcloth[b]) continue;
      if (!this.invmass[a] && !this.invmass[b]) continue;
      this.constraints[i].restLength = targets[a].clone().sub(targets[b]).length();
    }
  }
  secondRowAdjust(targets) {
    if (this.rownum < 2) return;
    if (this.constrainBoneName != "hips1") return;
    const second = 2;

    for (var j = 0; j < this.boneCol[second]; j++) {
      var n = this.rownum2 == 0 ? this.rownum : this.rownum - 1;
      var tn = this.boneHandle[second][j];
      while (n > second) {
        if (this.boneHandle[n][j] != -1) break;
        n--;
      }
      if (n == second) continue;
      var rn = this.boneHandle[n][j];
      var sn = this.boneHandle[second + 1][j];
      var toBottom = this.initPosition[tn].clone().sub(this.initPosition[rn]);
      var lengthAll = toBottom.length();
      toBottom.normalize();

      var referLine = targets[tn].clone().sub(targets[rn]);
      var targetLine = targets[sn].clone().sub(targets[rn]);
      targetLine.normalize();
      var lengthRefer = referLine.dot(targetLine);

      for (var i = second + 1; i < n; i++) {
        var p = this.boneHandle[i][j];
        if (p == -1) continue;
        var toRow = this.initPosition[p].clone().sub(this.initPosition[rn]);
        var length = toRow.dot(toBottom);
        length = length / lengthAll;

        targets[p].copy(
          targetLine
            .clone()
            .multiplyScalar(length * lengthRefer)
            .add(targets[rn])
        );
      }
    }

    var cPos = this.GetBonePos(this.constrainBoneName);
    var hd = this.calcJointPos(this.constrainBoneName).sub(new Vector3(0, 1, 0));
    var hdir = this.convertCoord(hd, this.constrainBoneIndex).sub(cPos);
    hdir.normalize();
    for (var i = 0; i < this.boneCol[second]; i++) {
      var q = this.boneHandle[second + 1][i];
      if (q == -1) continue;
      var p = this.boneHandle[second][i];
      var secondDir = targets[p].clone().sub(cPos);
      secondDir.normalize();
      var vert = hdir.clone().cross(secondDir);
      vert.normalize();
      var thirdDir = targets[q].clone().sub(cPos);
      thirdDir = thirdDir.clone().sub(vert.clone().multiplyScalar(thirdDir.dot(vert)));
      thirdDir.normalize();
      var cosSecond = hdir.dot(secondDir);
      var cosThird = hdir.dot(thirdDir);
      if (cosThird < cosSecond) {
        targets[p] = thirdDir
          .clone()
          .multiplyScalar(targets[p].clone().sub(cPos).dot(thirdDir))
          .add(cPos);
      }
    }
  }
  solveCollision(upcenters, downcenters, centers, horizon) {
    var sp1, sp2, p0, sp1_p, center, moveunit, linedirect, lineunit, ver, nearpoint;
    var axisdirection = [];
    var movedirect = new Array(this.pos.length);
    for (var i = 0; i < movedirect.length; i++) movedirect[i] = new Vector3();
    var secondMove = this.constrainBoneName == "head" ? false : true;
    //	if (SPLITCLOTH)
    //		secondMove = false;

    for (var i = 0; i < this.cylinders.length; i++) {
      var axis = upcenters[i].clone().sub(downcenters[i]);
      axis.normalize();
      axisdirection.push(axis);
    }

    for (var j = 0; j < this.constraints.length; j++) {
      var p1 = this.constraints[j].particleA;
      var p2 = this.constraints[j].particleB;
      if (this.constraints[j].soft != -1.0 && this.constraints[j].soft != 1.0) continue;
      if (horizon)
        if (/*constraints[j].soft!=1.0 &&*/ this.constraints[j].soft != -1.0)
          //not the row or column spring
          continue;
      if (this.upcloth[p1] || this.upcloth[p2]) continue;
      if ((!secondMove && this.invmass[p1] == 0) || this.invmass[p2] == 0) continue;
      //if(mapRow[p1] < 2 || mapRow[p2] < 2)
      //	continue;
      sp1 = this.pos[p1].clone();
      sp2 = this.pos[p2].clone();
      linedirect = sp2.clone().sub(sp1);
      lineunit = linedirect.clone();
      var linelength = lineunit.length();
      lineunit.normalize();
      var m1 = secondMove ? 1 : this.invmass[p1];
      var m2 = secondMove ? 1 : this.invmass[p2];
      for (var i = 0; i < this.cylinders.length; i++) {
        // solve cylinder collision;
        //			move_point_outside_cylinder(pos[p1], upcenters[i], downcenters[i], cylinders[i].Radius);
        //			move_point_outside_cylinder(pos[p2], upcenters[i], downcenters[i], cylinders[i].Radius);
        this.move_segment_outside_cylinder(
          this.pos[p1],
          this.pos[p2],
          axisdirection[i],
          upcenters[i],
          downcenters[i],
          this.cylinders[i].Radius,
          m1,
          m2
        );
      }
      for (var i = 0; i < this.spheres.length; i++) {
        /*	move_point_outside_sphere(pos[p1], centers[i], spheres[i].radius);
			 	move_point_outside_sphere(pos[p2], centers[i], spheres[i].radius);*/
        this.move_segment_outside_sphere(
          this.pos[p1],
          this.pos[p2],
          m1,
          m2,
          centers[i],
          this.spheres[i].radius
        );
      }

      movedirect[p1].add(this.pos[p1]).sub(sp1);
      movedirect[p2].add(this.pos[p2]).sub(sp2);
    }

    if (this.EARTHCOLLISION && this._isUseEarth) {
      var ground = -2.6;
      for (var i = 0; i < this.pos.length; i++) {
        if (this.upcloth[i] || this.invmass[i] == 0) W;
        continue;
        if (this.pos[i].y < ground) {
          movedirect[i].add(new Vector3(0, ground - this.pos[i].y, 0));
          this.pos[i].y = ground;
        }
      }
    }

    for (var m = 0; m < movedirect.length; m++) {
      if (movedirect[m].length() == 0) continue;
      var mn = movedirect[m].clone();
      mn.normalize();
      var vn = mn.clone().multiplyScalar(this.velo[m].dot(mn));
      var vt = this.velo[m].clone().sub(vn);
      this.velo[m] = mn
        .clone()
        .multiplyScalar(vn.length() * 0.4)
        .add(vt.multiplyScalar(0.8));
    }
  }
  stabilityConstrain(targets) {
    if (this.cylinders.length == 0) return;
    var _upDir = this.calcJointPos(this.constrainBoneName).clone().add(new Vector3(0, 1, 0));
    _upDir = this.convertCoord(_upDir, this.constrainBoneIndex).sub(
      this.GetBonePos(this.constrainBoneName)
    );
    if (_upDir.y < 0) return;
    const rowall = this.rownum2 == 0 ? this.rownum : this.rownum - 1;
    var radius = 2 * this.cylinders[0].Radius;
    for (var i = 0; i < this.cylinders.length; i++) {
      if (this.cylinders[i].name == "rightUpLeg" || this.cylinders[i].name == "leftUpLeg") {
        radius = 2 * this.cylinders[i].Radius;
        break;
      }
    }
    const legPos = new Array(2),
      legDir = new Array(2);
    legPos[0] = this.GetBonePos("rightUpLeg");
    legPos[1] = this.GetBonePos("leftUpLeg");
    legDir[0] = legPos[0].clone().sub(this.GetBonePos("rightLeg"));
    legDir[1] = legPos[1].clone().sub(this.GetBonePos("leftLeg"));
    for (var l = 0; l < 2; l++) {
      if (legDir[l].y > 0) continue;
      legDir[l].normalize();
      for (var i = 2; i < rowall; i++) {
        for (var j = 0; j < this.boneCol[i]; j++) {
          var idx = this.boneHandle[i][j];
          if (
            idx == -1 ||
            ths.invmass[idx] == 0 ||
            targets[idx].clone().sub(legPos[l]).dot(legDir[l]) > 0
          )
            continue;
          const u2p = this.pos[idx].clone().sub(legPos[l]);
          const ver = u2p.clone().sub(legDir[l].clone().multiplyScalar(u2p.dot(legDir[l])));
          if (ver.y > 0 && u2p.dot(legDir[l]) > 0)
            this.pos[idx].sub(legDir[l].clone().multiplyScalar(u2p.dot(legDir[l])));
        }
      }
    }
  }
  CONSTRAIN_FIX_MOVE(pfixed, pmoving, dest_length) {
    pmoving.copy(
      new Vector3()
        .copy(pfixed)
        .add(new Vector3().copy(pmoving).sub(pfixed).normalize().multiplyScalar(dest_length))
    );
  }
  GetBonePos(boneName) {
    var pos = new Vector3();
    this.mainBody.skeleton.getBoneByName(boneName).getWorldPosition(pos);
    return pos;
  }
  calcJointPos(jointName) {
    return this.joints[jointName].clone();
  }

  maxParticleDistance(targets) {
    if (this.cylinders.length == 0 /*|| rownum2==0*/) return;
    const rowall = this.rownum2 == 0 ? this.rownum + 1 : this.rownum;
    const _root = this.GetBonePos(this.constrainBoneName);
    var _up = this.calcJointPos(this.constrainBoneName).clone().add(new Vector3(0, 1, 0));
    _up = this.convertCoord(_up, this.constrainBoneIndex);
    if (_up.y < _root.y - 0.2) return;
    var moveMax = 2 * this.cylinders[0].Radius;
    for (var i = 0; i < this.cylinders.length; i++) {
      if (this.cylinders[i].name == "rightUpLeg" || this.cylinders[i].name == "leftUpLeg") {
        moveMax = 2 * this.cylinders[i].Radius;
        break;
      }
    }
    for (var i = 2; i < this.rowall; i++) {
      const maxDis = (moveMax * (i - 2)) / (this.rowall - 2);
      for (var j = 0; j < this.boneCol[i]; j++) {
        const idx = this.boneHandle[i][j];
        if (idx == -1 || this.invmass[idx] == 0) continue;
        const dis = this.pos[idx].clone().sub(targets[idx]).length();
        if (dis > maxDis) {
          var move = dis - maxDis;
          if (move > moveMax) move = moveMax;
          this.pos[idx].add(
            targets[idx]
              .clone()
              .sub(this.pos[idx])
              .multiplyScalar(move / dis)
          );
        }
      }
    }
  }

  solveCollisionSquare(ucenters, dcenters) {
    const cNum = this.squareList.length;
    var needRotate = false;

    var directs = [],
      upps = [],
      downps = [],
      uRadius = [],
      dRadius = [];
    var movedirect = new Array(this.pos.length);
    for (var i = 0; i < movedirect.length; i++) movedirect[i] = new Vector3();

    var upc, downc, rdownc, pm;
    var rotateIdx = [];
    //    std::vector<bool> rotation;
    var lengths = [];
    var legRotate = new Quaternion();
    var legRotateInvert = new Quaternion();
    var uLen, dLen, uRad, dRad;

    var tempPos = new Array(this.pos.length);
    for (var i = 0; i < this.pos.length; i++) {
      tempPos[i] = this.pos[i].clone();
    }

    for (var i = 0; i < cNum; i++) {
      lengths = [];
      directs = [];
      for (var j = 0; j < this.squareList[i].length; j++) {
        const sIdx = this.squareList[i][j];
        var direct = ucenters[sIdx].clone().sub(dcenters[sIdx]);
        lengths.push(direct.length());
        direct.normalize();
        directs.push(direct);
      }
      if (this.squareList[i].length == 2) needRotate = true;
      else if (this.squareList[i].length == 1) needRotate = false;
      else continue;
      var dir1, dir2;
      var upidx = this.squareList[i][0];
      var downidx;
      if (needRotate) {
        downidx = this.squareList[i][1];
        dRad = this.cylinders[upidx].Radius;
        dir1 = directs[0].clone();
        dir2 = directs[1].clone().multiplyScalar(-1);
        pm = dcenters[upidx].clone();
        legRotate.setFromUnitVectors(dir2.clone().multiplyScalar(-1), dir1);
        rdownc = dcenters[downidx]
          .clone()
          .sub(dcenters[upidx])
          .applyQuaternion(legRotate)
          .add(dcenters[upidx]);
      } else {
        dRad = this.cylinders[upidx].Radius;
      }
      upc = ucenters[upidx].clone();
      downc = dcenters[upidx].clone();
      //    uLen = lengths[upidx];
      uRad = this.cylinders[upidx].Radius;

      const referSquare = {};
      for (var j = 0; j < this.boneCol[2]; j++) {
        var idx = this.boneHandle[2][j];
        if (idx != -1)
          referSquare[idx] = this.convertCoord(
            this.initPosition[idx],
            this.cylinders[this.squareList[i][0]].handle1
          );
      }

      const downBelong = new Array(this.pos.length).fill(false);

      for (var ic = 0; ic < this.constraints.length; ic++) {
        if (this.constraints[ic].soft != -1) continue;
        const s = this.constraints[ic];
        var p3 = s.particleA;
        var p4 = s.particleB;
        var r1 = this.mapRow[p3];
        var c1 = this.mapCol[p3];
        var r2 = this.mapRow[p4];
        var c2 = this.mapCol[p4];
        var p1 = this.boneHandle[r2 - 1][c2];
        var p2 = this.boneHandle[r1 - 1][c1];
        if (
          this.boneHandle[r1][c1] == -1 ||
          this.boneHandle[r2][c2] == -1 ||
          this.invmass[this.boneHandle[r1][c1]] == 0 ||
          this.invmass[this.boneHandle[r2][c2]] == 0
        )
          continue;
        const square = new Array(4),
          projsqr = new Array(4),
          directions = new Array(4);
        square[0] = this.pos[this.boneHandle[r1 - 1][c2]].clone();
        square[1] = this.pos[this.boneHandle[r1 - 1][c1]].clone();
        if (!this.SPLITCLOTH) {
          p1 = this.boneHandle[2][c2];
          p2 = this.boneHandle[2][c1];
          square[0].copy(referSquare[p1]);
          square[1].copy(referSquare[p2]);
        }
        if (r1 == 3) {
          square[0].copy(referSquare[p1]);
          square[1].copy(referSquare[p2]);
        }

        square[2] = this.pos[p3].clone();
        square[3] = this.pos[p4].clone();
        upc = ucenters[upidx].clone();
        downc = dcenters[upidx].clone();
        var push = false;
        var tempSqr = new Array(2);
        tempSqr[0] = square[0].clone();
        tempSqr[1] = square[1].clone();
        if (needRotate && this.mapRow[p3] >= this.rownum) {
          const p2m = square[2].clone().sub(pm),
            q2m = square[3].clone().sub(pm),
            s02m = square[0].clone().sub(pm),
            s12m = square[1].clone().sub(pm);
          const upCos0 = s02m.dot(dir1),
            upCos1 = s12m.dot(dir1);
          const downCos0 = s02m.dot(dir2),
            downCos1 = s12m.dot(dir2);
          /*if(upCos0 < downCos0)
                        square[0] = legRotate*(square[0]-pm) + pm;
                    if(upCos1 < downCos1)
                        square[1] = legRotate*(square[1]-pm) + pm;*/
          // if(upCos0 < downCos0 && upCos1 < downCos1){
          //               square[0] = legRotate*(square[0]-pm) + pm;
          //               square[1] = legRotate*(square[1]-pm) + pm;
          // }
          if (downBelong[p1] || downBelong[p2]) {
            square[0].copy(s02m.clone().applyQuaternion(legRotate).add(pm));
            square[1].copy(s12m.clone().applyQuaternion(legRotate).add(pm));
          }

          /*if(p2m.DotProduct(dir1)>p2m.DotProduct(dir2) || q2m.DotProduct(dir1)>q2m.DotProduct(dir2)){

                        push = pushVerticlesOutside(square, upc, downc, false, uRad);
                    }*/
          //square[0] = tempSqr[0];
          //square[1] = tempSqr[1];
          //   p2m = square[2] - pm;
          //    q2m = square[3] - pm;
          if (p2m.dot(dir1) < p2m.dot(dir2) || q2m.dot(dir1) < q2m.dot(dir2)) {
            upc = ucenters[downidx].clone();
            downc = rdownc.clone();
            square[2].copy(p2m.clone().applyQuaternion(legRotate).add(pm));
            square[3].copy(q2m.clone().applyQuaternion(legRotate).add(pm));
            push = push || this.pushVerticlesOutside(square, upc, downc, true, dRad);
            square[2].copy(
              square[2]
                .clone()
                .sub(pm)
                .applyQuaternion(legRotateInvert.copy(legRotate).invert())
                .add(pm)
            );
            square[3].copy(
              square[3]
                .clone()
                .sub(pm)
                .applyQuaternion(legRotateInvert.copy(legRotate).invert())
                .add(pm)
            );
            downBelong[p3] = downBelong[p4] = true;
          } else {
            push = this.pushVerticlesOutside(square, upc, downc, false, uRad);
          }
        } else {
          push = this.pushVerticlesOutside(square, upc, downc, false, uRad, ic);
        }

        p1 = this.boneHandle[r2 - 1][c2];
        p2 = this.boneHandle[r1 - 1][c1];
        tempSqr[0].copy(tempPos[p1]);
        tempSqr[1].copy(tempPos[p2]);

        var rest = tempPos[p3].clone().sub(tempPos[p2]).length();
        var solve = square[2].clone().sub(this.pos[p2]).length();
        if (solve != 0)
          square[2].copy(
            square[2]
              .clone()
              .sub(this.pos[p2])
              .multiplyScalar(rest / solve)
              .add(this.pos[p2])
          );
        rest = tempPos[p4].clone().sub(tempPos[p1]).length();
        solve = square[3].clone().sub(this.pos[p1]).length();
        if (solve != 0)
          square[3].copy(
            square[3]
              .clone()
              .sub(this.pos[p1])
              .multiplyScalar(rest / solve)
              .add(this.pos[p1])
          );

        if (push) {
          movedirect[p3].add(square[2]).clone().sub(this.pos[p3]);
          movedirect[p4].add(square[3]).clone().sub(this.pos[p4]);
        }
        this.pos[p3].copy(square[2]);
        this.pos[p4].copy(square[3]);
      }
    }
    //if(EARTHCOLLISION){
    //     float ground = -2.6;
    //     for(int i=0; i<pos.size(); i++)
    //     {
    //         if(pos[i].y_ < ground) {
    //             movedirect[i] += Vector3(0, (ground-pos[i].y_), 0);
    //             pos[i].y_ = ground;
    //         }

    //     }
    // }
    for (var m = 0; m < movedirect.length; m++) {
      if (movedirect[m].length() < 1e-5) continue;
      const mn = movedirect[m].clone();
      mn.normalize();
      const vn = mn.multiplyScalar(this.velo[m].dot(mn));
      const vt = this.velo[m].clone().sub(vn);
      this.velo[m] = mn.multiplyScalar(0.4 * vn.length()).add(vt.multiplyScalar(0.8));
    }
  }

  pushVerticlesOutside(square, upcenter, downcenter, low, Rad, rc) {
    var idx = 0;
    var direct = upcenter.clone().sub(downcenter);
    const directions = new Array(4),
      projsqr = new Array(4);
    direct.normalize();

    for (idx = 0; idx < square.length; idx++) {
      var sc = low ? square[idx].clone().sub(downcenter) : upcenter.clone().sub(square[idx]);
      if (sc.dot(direct) >= 0) break;
    }
    if (idx == square.length) return false;
    projsqr[3] = square[3].clone();
    var center = direct
      .clone()
      .multiplyScalar(projsqr[3].clone().sub(upcenter).dot(direct))
      .add(upcenter);
    for (var n = 0; n < square.length - 1; n++) {
      projsqr[n] = direct
        .clone()
        .multiplyScalar(projsqr[3].clone().sub(square[n]).dot(direct))
        .add(square[n]);
    }
    directions[0] = projsqr[0]
      .clone()
      .sub(center)
      .cross(projsqr[square.length - 1].clone().sub(center));
    for (var n = 1; n < square.length; n++) {
      directions[n] = projsqr[n]
        .clone()
        .sub(center)
        .cross(projsqr[n - 1].clone().sub(center));
    }
    var notThrough = false;
    for (var n = 1; n < directions.length; n++) {
      if (directions[n].dot(directions[0]) < 0) {
        notThrough = true;
        break;
      }
    }
    //	move_point_outside_sphere(projsqr[2], center, Rad);
    //	move_point_outside_sphere(projsqr[3], center, Rad);
    var moveunit = projsqr[2].clone().sub(projsqr[3]);
    moveunit.normalize();
    var t =
      center.clone().sub(projsqr[3]).dot(moveunit) / projsqr[2].clone().sub(projsqr[3]).length();
    t = clamp(t, 0.0, 1.0);
    var nearpoint = projsqr[3].clone().add(projsqr[2].clone().sub(projsqr[3]).multiplyScalar(t)); //projsqr[2].clone().sub(projsqr[3]).multiplyScalar(t).add(projsqr[3]);
    var ver = nearpoint.clone().sub(center);
    var verLen = ver.length();
    ver.normalize();
    if (notThrough) {
      if (verLen < Rad) ver = ver.clone().multiplyScalar(Rad - verLen);
      else return false;
    } else
      ver = ver
        .clone()
        .multiplyScalar(-1)
        .multiplyScalar(verLen + Rad); //ver.clone().multiplyScalar(verLen + Rad).multiplyScalar(-1);
    var len0 = square[2].clone().sub(square[1]).length();
    var len1 = square[3].clone().sub(square[0]).length();
    square[2].add(ver);
    square[3].add(ver);
    if (!this.SPLITCLOTH) {
      var col0 = square[2].clone().sub(square[1]);
      var col1 = square[3].clone().sub(square[0]);
      //	len0 = len0 - std::fabs(col0.DotProduct(direct));
      //	len1 = len1 - std::fabs(col1.DotProduct(direct));
      len0 = len0 - col0.length();
      len1 = len1 - col1.length();
      square[2].add(direct.clone().multiplyScalar(-len0));
      square[3].add(direct.clone().multiplyScalar(-len1));
    }
    return true;
  }
  constrain() {
    const centers = new Array(this.spheres.length);

    const targetPos = new Array(this.spheres.length);
    for (var i = 0; i < this.spheres.length; i++) {
      centers[i] = this.convertCoord(this.spheres[i].center, this.spheres[i].handle);
    }

    const max_constrain_iters = 5;
    for (var k = 0; k < max_constrain_iters; k++) {
      /* Adjust segment lengths. */
      for (var l = 0; l < this.constraints.length; l++) {
        const c = this.constraints[l];
        if (this.invmass[c.particleA] == 0 && this.invmass[c.particleB] == 0) continue;
        if (c.soft != 1.0) continue;
        // CONSTRAIN_MOVE_MOVE_MASS_SOFT(pos[c.particleA], pos[c.particleB],invmass[c.particleA], invmass[c.particleB],c.soft, c.restLength);
        //CONSTRAIN_MOVE_MOVE_SOFT(pos[c.particleA], pos[c.particleB],c.soft, c.restLength);

        this.CONSTRAIN_FIX_MOVE(this.pos[c.particleA], this.pos[c.particleB], c.restLength);
        if (this.invmass[c.particleA] == 0 || this.invmass[c.particleB] == 0) continue;
        for (var sp = 0; sp < centers.length; sp++)
          this.move_segment_outside_sphere(
            this.pos[c.particleA],
            this.pos[c.particleB],
            this.invmass[c.particleA],
            this.invmass[c.particleB],
            centers[sp],
            this.spheres[sp].radius
          );
      }
    }
  }
  move_segment_outside_sphere(a, b, massa, massb, center, radius) {
    /* Find closest point on line segment to the sphere's center. */
    const a0 = new Vector3().copy(a).sub(center),
      b0 = new Vector3().copy(b).sub(center);
    var v = new Vector3().copy(b0).sub(a0);
    var t = -a0.dot(v) / v.lengthSq();
    //       double t = -(a0.dotProduct(v))/v.length();
    t = clamp(t, 0.0, 1.0);
    const p = new Vector3().copy(a0).add(v.clone().multiplyScalar(t));
    /* Displace that point out from center of sphere, if it is too close.
         Make the segment endpoints undergo the same displacement. */
    if (p.length() < radius) {
      var tp = p.clone();
      tp.normalize();
      const displace = tp.multiplyScalar(radius).sub(p);

      if (massa != 0) a.add(displace);
      if (massb != 0) b.add(displace);
    }
  }
  move_segment_outside_cylinder(a, b, direct, up, down, radius, ma, mb) {
    const line = b.clone().sub(a);
    const ap = direct.clone().multiplyScalar(line.dot(direct)).add(a);
    const center = direct.clone().multiplyScalar(b.clone().sub(up).dot(direct)).add(up);
    const v = b.clone().sub(ap);
    const vl = v.length();
    v.normalize();
    var t = center.clone().sub(ap).dot(v) / vl;
    t = clamp(t, 0.0, 1.0);
    var d = b.clone().sub(ap).multiplyScalar(t).sub(center).add(ap);
    const ver = line.clone().multiplyScalar(t).add(a);
    const value = ver.clone().sub(up).dot(direct) * ver.clone().sub(down).dot(direct);
    if (value > 0) {
      const p = up.clone();
      if (ver.clone().sub(down).dot(direct) < 0) p.copy(down);

      t = p.clone().sub(a).dot(line) / line.lengthSq();
      t = clamp(t, 0.0, 1.0);

      d = line.clone().multiplyScalar(t).sub(p).add(a);
    }
    if (d.length() < radius) {
      var dLength = d.length();
      d.normalize();
      var movep = d.clone().multiplyScalar(radius - dLength);
      if (ma != 0) a.add(movep);
      if (mb != 0) b.add(movep);
    }
  }
  springConstrain(targets) {
    var n = new Vector3();
    var p1, p2, r1, r2;
    var d,
      l,
      templength,
      f = 1.0,
      damp = 0.5;
    const referRestLength = {},
      referRestLength2 = {};
    if (this.rownum2 != 0) {
      for (var i = 0; i < this.constraints.length; i++) {
        if (
          this.constraints[i].soft == -1 &&
          this.mapRow[this.constraints[i].particleA] == this.rownum - 1
        ) {
          const col = this.mapCol[this.constraints[i].particleA];
          referRestLength[col] = this.constraints[i].restLength;
        } else if (
          this.constraints[i].soft == 0 &&
          this.mapRow[this.constraints[i].particleA] == this.rownum - 1
        ) {
          const col = this.mapCol[this.constraints[i].particleA];
          referRestLength2[col] = this.constraints[i].restLength;
        }
      }
    }

    for (var i = 0; i < this.constraints.length; i++) {
      p1 = this.constraints[i].particleA;
      p2 = this.constraints[i].particleB;
      if (this.invmass[p1] == 0 && this.invmass[p2] == 0) continue;
      if (this.upcloth[p1] && this.upcloth[p2]) continue;
      l = this.constraints[i].restLength;

      if (this.constraints[i].soft == 1.0) {
        //column spring;
        const c = this.constraints[i];
        if (this.invmass[c.particleA] == 0 && this.invmass[c.particleB] == 0) continue;

        n.copy(this.pos[c.particleB]);
        n.sub(this.pos[c.particleA]);
        templength = n.length();
        n.normalize();
        if (templength > c.restLength) {
          this.CONSTRAIN_FIX_MOVE(this.pos[c.particleA], this.pos[c.particleB], c.restLength);
          if (this.invmass[c.particleA] != 0)
            this.pos[c.particleA].add(
              new Vector3().copy(n).multiplyScalar(damp * (templength - c.restLength))
            );
        }
      } else if (this.constraints[i].soft == -1.0 || this.constraints[i].soft == -2.0) {
        // row spring;
        f = this.rowprop;
        const row = this.mapRow[p1];
        if (
          this.MIDDLEPROCESS ||
          (!this.JACKCLOTH && !this.SPLITCLOTH && this.mapCons[p1] != this.mapCons[p2])
        ) {
          l = this.constraints[i].restLength = new Vector3()
            .copy(targets[p1])
            .sub(targets[p2])
            .length();
        }

        n.copy(this.pos[p2]).sub(this.pos[p1]);
        d = n.length();
        n.normalize();

        if (this.rownum2 != 0 && row >= this.rownum)
          if (l < referRestLength[this.mapCol[p1]]) l = referRestLength[this.mapCol[p1]];
        d -= l;
        if (this.invmass[p1] != 0)
          this.pos[p1].add(new Vector3().copy(n).multiplyScalar((f * d) / 2.0));
        if (this.invmass[p2] != 0)
          this.pos[p2].sub(new Vector3().copy(n).multiplyScalar((f * d) / 2));
      } else if (this.constraints[i].soft == 0) {
        //
        f = 0.1;
        const row = this.mapRow[p1];
        if (
          this.MIDDLEPROCESS ||
          (!this.JACKCLOTH && !this.SPLITCLOTH && this.mapCons[p1] != this.mapCons[p2])
        ) {
          l = this.constraints[i].restLength = new Vector3()
            .copy(targets[p1])
            .sub(targets[p2])
            .length();
        }
        n.copy(this.pos[p2]).sub(this.pos[p1]);
        d = n.length();
        n.normalize();
        if (this.rownum2 != 0 && row >= this.rownum)
          if (l < referRestLength2[this.mapCol[p1]]) l = referRestLength2[this.mapCol[p1]];
        d -= l;
        if (this.invmass[p1] != 0)
          this.pos[p1].add(new Vector3().copy(n).multiplyScalar((f * d) / 2.0));
        if (this.invmass[p2] != 0)
          this.pos[p2].sub(new Vector3().copy(n).multiplyScalar((f * d) / 2.0));
      }
    }
  }
  /**
   * Resets rigid bodies transorm to current bone's.
   *
   * @return {MMDPhysics}
   */
  reset() {
    return this;
  }

  /**
   * Warm ups Rigid bodies. Calculates cycles steps.
   *
   * @param {Integer} cycles
   * @return {MMDPhysics}
   */
  warmup(cycles) {
    return this;
  }

  /**
   * Sets gravity.
   *
   * @param {Vector3} gravity
   * @return {MMDPhysicsHelper}
   */
  setGravity(gravity) {
    return this;
  }

  /**
   * Creates MMDPhysicsHelper
   *
   * @return {MMDPhysicsHelper}
   */

  // private methods

  _init(mesh, rigidBodyParams, constraintParams) {}

  _stepSimulation(delta) {}

  _updateRigidBodies() {}

  _updateBones() {}
}

export { ClothPhysicManagerInstance };
