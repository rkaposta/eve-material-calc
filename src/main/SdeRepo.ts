import * as fs from "fs-extra";
import * as jsyaml from "js-yaml";

const BLUEPRINTS_PATH = './resources/sde/blueprints.yaml';
const TYPE_IDS_PATH = './resources/sde/typeIDs.yaml';

export default class SdeRepo {

  public blueprints: any = {};
  public types: any = {};

  constructor() {
    this.blueprints = this.loadData(BLUEPRINTS_PATH);
    this.types = this.loadData(TYPE_IDS_PATH);
  }

  loadData(path) {
    return jsyaml.safeLoad(fs.readFileSync(path, "utf-8"));
  }

  lookup(name) {
    let lang = "en";
    return Object.keys(this.types).map(id => [id, this.types[id]]).filter(([id, type]) => type.name && type.name[lang] && type.name[lang].startsWith(name)).map(([id, type]) => {
      type.id = +id;
      return type;
    })[0];
  }

  lookupByID(id) {
    return this.types[id];
  }
}