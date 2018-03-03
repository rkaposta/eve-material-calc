import _ from 'lodash';

import Blueprint from "./model/Blueprint";
import Material from "./model/Material";
import CompositeMaterial from "./model/CompositeMaterial";

export function getTotalMaterials(blueprint: Blueprint) {
  let totalMat: Array<Material | CompositeMaterial> = [];
  let ratio = 1 - (blueprint.materialEfficiency / 100);
  blueprint.materials.forEach(m => {
    totalMat[m.typeId] = _.clone(m);
    totalMat[m.typeId].quantity *= ratio;
  });

  blueprint.compositeMaterials.forEach((cm:CompositeMaterial) => {
    let subMats = getTotalMaterials(cm.blueprint);
    for (let a in subMats) {
      let typeId = subMats[a].typeId;
      if (totalMat[typeId] == undefined) {
        totalMat[typeId] = new Material(typeId, cm.quantity * subMats[a].quantity / cm.blueprint.prodQuantity, subMats[a].displayName);
      } else {
        totalMat[typeId] = new Material(typeId, totalMat[typeId].quantity + ( cm.quantity * subMats[a].quantity / cm.blueprint.prodQuantity), subMats[a].displayName);
      }
    }
  });
  return totalMat;
}