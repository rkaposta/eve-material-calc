<template>
  <div>
    Name: {{ resolvedBlueprint }}<br>
    ME: <input v-model="materialEfficiency" ><br>
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
        resolvedBlueprint: 'no blueprint found'
      }
    },
    methods: {
      calcMaterials() {
        if (this.bpDef) {
          ipcRenderer.send('calcBp', this.bpDef, this.materialEfficiency);
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