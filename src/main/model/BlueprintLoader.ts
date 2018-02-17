import Blueprint from "./Blueprint";
import * as db from 'eve-online-sde';
import Material from "./Material";
import { ipcMain } from 'electron';
import _ from 'lodash';
import CompositeMaterial from "./CompositeMaterial";


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
    ipcMain.on('getBp', async (event, bpName) => {
      console.log('querying', bpName);
      let bp = await this.createBlueprint(bpName);
      console.log('bp constructed', bp);
      bp.totalMat = bp.getTotalMaterials();
      event.sender.send('getBp', new CompositeMaterial(0, 1, bp));
    });
  }
  
  async createBlueprint(name): Promise<Blueprint> {
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
      console.log('bp not found for', name);
      return;
    }
    let bp = this.blueprints[bpDef.id];
    let materials = await this.collectMaterials(bp, reaction);
    let output = reaction ? bp.activities.reaction.products[0].quantity : bp.activities.manufacturing.products[0].quantity;
    console.log('output', bp, output);
    return new Blueprint(bpDef.id, bpDef.name.en, output, materials.materials, materials.composites);
  }

  isMaterialComposite(material) {
    return Object.keys(this.blueprints).filter((bp) => {
      return _.get(this.blueprints[bp], 'activities.manufacturing.products[0].typeID') == material.typeID}).length > 0 || 
      Object.keys(this.blueprints).filter((bp) => {
        return _.get(this.blueprints[bp], 'activities.reaction.products[0].typeID') == material.typeID}).length > 0;
  }

  async collectMaterials(blueprint: any, reaction: boolean): Promise<any> {
    let asd = {
      materials: [],
      composites: [],
    };
    if (reaction) {
      for (let element of blueprint.activities.reaction.materials) {
        if (this.isMaterialComposite(element)) {
          asd.composites.push(await this.createCompositeMaterial(element));
        } else {
          asd.materials.push(await this.createMaterial(element));
        }
      }
    } else {
      for (let element of blueprint.activities.manufacturing.materials) {
        if (this.isMaterialComposite(element)) {
          asd.composites.push(await this.createCompositeMaterial(element));
        } else {
          asd.materials.push(await this.createMaterial(element));
        }
      }
    }
    return asd;
  }

  async createMaterial(element): Promise<Material> {
    console.log('creating material', element);
    let elementName = await db.lookupByID(element.typeID);
    return new Material(element.typeID, element.quantity, elementName.name.en)
  }

  async createCompositeMaterial(element): Promise<CompositeMaterial> {
    let elementName = await db.lookupByID(element.typeID);
    console.log('creating composite material', elementName.name.en);
    return new CompositeMaterial(element.typeID, element.quantity, await this.createBlueprint(elementName.name.en));
  }
}