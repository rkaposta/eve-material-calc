import Blueprint from "./Blueprint";


export default class CompositeMaterial {
  constructor(public typeId: number, public quantity: number, public blueprint?: Blueprint) {}
}