import _ from 'lodash';

import Blueprint from "./model/Blueprint";
import Material from "./model/Material";
import CompositeMaterial from "./model/CompositeMaterial";

export function getTotalMaterials(blueprint: Blueprint) {
  let totalMat = {};
  blueprint.materials.forEach(m => {
    totalMat[m.typeID] = _.clone(m);
  });

  blueprint.compositeMaterials.forEach((cm:CompositeMaterial) => {
    let subMats = getTotalMaterials(cm.blueprint);
    for (let a in subMats) {
      let typeID = subMats[a].typeID;
      if (totalMat[typeID] == undefined) {
        totalMat[typeID] = new Material(typeID, cm.quantity * subMats[a].quantity / cm.blueprint.prodQuantity, subMats[a].displayName);
      } else {
        totalMat[typeID] = new Material(typeID, totalMat[typeID].quantity + ( cm.quantity * subMats[a].quantity / cm.blueprint.prodQuantity), subMats[a].displayName);
      }
    }
  });
  return totalMat;
}