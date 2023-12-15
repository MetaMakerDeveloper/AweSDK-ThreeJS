import * as core from "./core";
import sign from "./sign/index";
import * as ClothPhysics from "./core/utils/ClothPhysics";
declare const MMFT: {
    core: typeof core;
    ClothPhysics: typeof ClothPhysics;
    sign: typeof sign;
};
export default MMFT;
