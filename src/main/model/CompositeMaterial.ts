import Blueprint from "./Blueprint";
import Material from "./Material";


export default class CompositeMaterial extends Material {
  constructor(typeId: number, quantity: number, displayName: string, public blueprint?: Blueprint) {
    super(typeId, quantity, displayName);
  }
}