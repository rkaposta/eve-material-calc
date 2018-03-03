<template>
  <div>
    Name: {{ resolvedBlueprint }}<br>
    BP ME: <input v-model="materialEfficiency" ><br>
    SubComponent ME: <input v-model="subMaterialEfficiency" ><br>
    <button @click="calcMaterials">Calculate Materials</button>
  </div>
</template>

<script>
  import { ipcRenderer } from 'electron';

  export default {
    data() {
      return {
        bpDef: null,
        materialEfficiency: 0,
        subMaterialEfficiency: 0,
        resolvedBlueprint: 'no blueprint found'
      }
    },
    methods: {
      calcMaterials() {
        if (this.bpDef) {
          console.log('sending calcBp', this.bpDef);
          ipcRenderer.send('calcBp', this.bpDef, this.materialEfficiency, this.subMaterialEfficiency);
        } else {
          console.log('no bpDef');
        }
      }
    },
    mounted() {
      ipcRenderer.on('BLUEPRINT_RESOLVED', (event, blueprint, error) => {
        if (blueprint) {
          this.bpDef = blueprint;
          this.resolvedBlueprint = blueprint.name.en;
        } else {
          this.bpDef = null;
          this.resolvedBlueprint = error;
        }
      });
    }
  }
</script>