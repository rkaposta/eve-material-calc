import Material from "./Material";
import CompositeMaterial from "./CompositeMaterial";
import _ from 'lodash';

export default class Blueprint {
  public totalMat: any;
  constructor(public typeId: number, public displayName: string, public prodQuantity: number, public materials?: Material[], public compositeMaterials?: CompositeMaterial[]) {
  }

  getTotalMaterials() {
    let totalMat = {};
    this.materials.forEach(m => {
      totalMat[m.typeID] = _.clone(m);
    });

    this.compositeMaterials.forEach((cm:CompositeMaterial) => {
      console.log('aaaaaaaaaa', cm.blueprint.displayName);
      let subMats = cm.blueprint.getTotalMaterials();
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
}