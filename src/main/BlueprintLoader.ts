import _ from 'lodash';
import { ipcMain } from 'electron';

import Blueprint from "./model/Blueprint";
import Material from "./model/Material";
import CompositeMaterial from "./model/CompositeMaterial";
import { getTotalMaterials } from "./MaterialCalculator";
import { BLUEPRINT_RESOLVED, BLUEPRINT_MATERIALS_RESOLVED } from './Events';
import SdeRepo from './SdeRepo';


export default class BlueprintLoader {
  cache: any = {
    bp: {},
    r: {},
  };
  subMaterialEfficiency = 0;
  blueprints: any;
  sdeRepo: SdeRepo = new SdeRepo();
  constructor() {
    this.blueprints = this.sdeRepo.blueprints;
    ipcMain.on('getBp', (event, bpName) => {
      let bpDef = this.findBlueprint(bpName);
      if (bpDef) {
        event.sender.send(BLUEPRINT_RESOLVED, bpDef);
      } else {
        event.sender.send(BLUEPRINT_RESOLVED, undefined, 'blueprint not found for ' + bpName);
      }
    });
    ipcMain.on('calcBp', (event, bpDef, materialEfficiency, subMaterialEfficiency) => {
        this.subMaterialEfficiency = subMaterialEfficiency;
        // TODO why is this hack needed for the UI to be responsive???
          let bp = this.buildBlueprintFromBpDef(bpDef);
          bp.materialEfficiency = materialEfficiency;
          bp.totalMat = getTotalMaterials(bp);
          event.sender.send(BLUEPRINT_MATERIALS_RESOLVED, new CompositeMaterial(0, 1, '', bp));
    });
  }
  
  findBlueprint(name): Blueprint {
    let bpDef = this.cache.bp[name];
    let reaction = false;
    if (!bpDef) {
      bpDef = this.cache.r[name];
      reaction = true;
    }
    if (!bpDef) {
      bpDef = this.sdeRepo.lookup(name + ' Blueprint');
      this.cache.bp[name] = bpDef;
      reaction = false;
    }
    if (!bpDef) {
      bpDef = this.sdeRepo.lookup(name + ' Reaction Formula');
      this.cache.r[name] = bpDef;
      reaction = true;

      if (!bpDef) {
        bpDef = this.sdeRepo.lookup(name.substr(0, name.length-1) + ' Reaction Formula');
        this.cache.r[name] = bpDef;
        reaction = true;
      }
    }
    if (!bpDef) {
      return;
    } else {
      bpDef.reaction = reaction;
    }
    return bpDef;
  }

  buildBlueprintFromBpDef(bpDef) {
    let bp = this.blueprints[bpDef.id];
    let materials = this.collectMaterials(bp, bpDef.reaction);
    let output = bpDef.reaction ? bp.activities.reaction.products[0].quantity : bp.activities.manufacturing.products[0].quantity;
    return new Blueprint(bpDef.id, bpDef.name.en, output, materials.materials, materials.composites, bpDef.reaction ? 0 : this.subMaterialEfficiency);
  }

  isMaterialComposite(material) {
    return Object.keys(this.blueprints).filter((bp) => {
      return _.get(this.blueprints[bp], 'activities.manufacturing.products[0].typeID') == material.typeID}).length > 0 || 
      Object.keys(this.blueprints).filter((bp) => {
        return _.get(this.blueprints[bp], 'activities.reaction.products[0].typeID') == material.typeID}).length > 0;
  }

  collectMaterials(blueprint: any, reaction: boolean): any {
    let activity = reaction ? 'reaction' : 'manufacturing';
    return this.sortMaterials(blueprint.activities[activity].materials);
  }

  sortMaterials(materials: any[]): any {
    let sortedMaterials = {
      materials: [],
      composites: [],
    };
    for (let element of materials) {
      if (this.isMaterialComposite(element)) {
        sortedMaterials.composites.push(this.createCompositeMaterial(element));
      } else {
        sortedMaterials.materials.push(this.createMaterial(element));
      }
    }
    return sortedMaterials;
  }

  createMaterial(element): Material {
    let elementName = this.sdeRepo.lookupByID(element.typeID);
    return new Material(element.typeID, element.quantity, elementName.name.en)
  }

  createCompositeMaterial(element): CompositeMaterial {
    let elementName = this.sdeRepo.lookupByID(element.typeID);
    let bpDef = this.findBlueprint(elementName.name.en);
    return new CompositeMaterial(element.typeID, element.quantity, elementName.name.en, this.buildBlueprintFromBpDef(bpDef));
  }
}