import Material from "./Material";
import CompositeMaterial from "./CompositeMaterial";
import _ from 'lodash';

export default class Blueprint {
  public totalMat: any;
  public materialEfficiency: number = 0;
  constructor(public typeId: number, public displayName: string, public prodQuantity: number, public materials?: Material[], public compositeMaterials?: CompositeMaterial[]) {
  }
}