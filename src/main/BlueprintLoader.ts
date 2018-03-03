import _ from 'lodash';
import * as db from 'eve-online-sde';
import { ipcMain } from 'electron';

import Blueprint from "./model/Blueprint";
import Material from "./model/Material";
import CompositeMaterial from "./model/CompositeMaterial";
import { getTotalMaterials } from "./MaterialCalculator";
import { BLUEPRINT_RESOLVED, BLUEPRINT_MATERIALS_RESOLVED } from './Events';


export default class BlueprintLoader {
  cache: any = {
    bp: {},
    r: {},
  };
  blueprints: any;
  constructor() {
    db.blueprints().then((blueprints) => {
      this.blueprints = blueprints;
    });
    ipcMain.on('getBp', (event, bpName) => {
      this.findBlueprint(bpName).then((bpDef) => {
        if (bpDef) {
          event.sender.send(BLUEPRINT_RESOLVED, bpDef);
        } else {
          event.sender.send(BLUEPRINT_RESOLVED, undefined, 'blueprint not found for ' + bpName);
        }
      });
    });
    ipcMain.on('calcBp', (event, bpDef, materialEfficiency) => {
        // TODO why is this hack needed for the UI to be responsive???
        setTimeout(() => {
          this.buildBlueprintFromBpDef(bpDef).then((bp) => {
            bp.materialEfficiency = materialEfficiency;
            bp.totalMat = getTotalMaterials(bp);
            event.sender.send(BLUEPRINT_MATERIALS_RESOLVED, new CompositeMaterial(0, 1, bp));
          });
        }, 500);
    });
  }
  
  async findBlueprint(name): Promise<Blueprint> {
    let bpDef = this.cache.bp[name];
    let reaction = false;
    if (!bpDef) {
      bpDef = this.cache.r[name];
      reaction = true;
    }
    if (!bpDef) {
      bpDef = await db.lookup(name + ' Blueprint');
      this.cache.bp[name] = bpDef;
      reaction = false;
    }
    if (!bpDef) {
      bpDef = await db.lookup(name + ' Reaction Formula');
      this.cache.r[name] = bpDef;
      reaction = true;

      if (!bpDef) {
        bpDef = await db.lookup(name.substr(0, name.length-1) + ' Reaction Formula');
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

  async buildBlueprintFromBpDef(bpDef) {
    let bp = this.blueprints[bpDef.id];
    let materials = await this.collectMaterials(bp, bpDef.reaction);
    let output = bpDef.reaction ? bp.activities.reaction.products[0].quantity : bp.activities.manufacturing.products[0].quantity;
    return new Blueprint(bpDef.id, bpDef.name.en, output, materials.materials, materials.composites);
  }

  isMaterialComposite(material) {
    return Object.keys(this.blueprints).filter((bp) => {
      return _.get(this.blueprints[bp], 'activities.manufacturing.products[0].typeID') == material.typeID}).length > 0 || 
      Object.keys(this.blueprints).filter((bp) => {
        return _.get(this.blueprints[bp], 'activities.reaction.products[0].typeID') == material.typeID}).length > 0;
  }

  async collectMaterials(blueprint: any, reaction: boolean): Promise<any> {
    let activity = reaction ? 'reaction' : 'manufacturing';
    return this.sortMaterials(blueprint.activities[activity].materials);
  }

  async sortMaterials(materials: any[]): Promise<any> {
    let sortedMaterials = {
      materials: [],
      composites: [],
    };
    for (let element of materials) {
      if (this.isMaterialComposite(element)) {
        sortedMaterials.composites.push(await this.createCompositeMaterial(element));
      } else {
        sortedMaterials.materials.push(await this.createMaterial(element));
      }
    }
    return sortedMaterials;
  }

  async createMaterial(element): Promise<Material> {
    let elementName = await db.lookupByID(element.typeID);
    return new Material(element.typeID, element.quantity, elementName.name.en)
  }

  async createCompositeMaterial(element): Promise<CompositeMaterial> {
    let elementName = await db.lookupByID(element.typeID);
    let bpDef = await this.findBlueprint(elementName.name.en);
    return new CompositeMaterial(element.typeID, element.quantity, await this.buildBlueprintFromBpDef(bpDef));
  }
}