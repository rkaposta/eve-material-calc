<template>
  <div>
    Name: {{ resolvedBlueprint }}<br>
  </div>
</template>

<script>
  import { ipcRenderer } from 'electron';

  export default {
    data() {
      return {
        resolvedBlueprint: 'no blueprint found'
      }
    },
    mounted() {
      ipcRenderer.on('BLUEPRINT_RESOLVED', (event, blueprint, error) => {
        this.resolvedBlueprint = blueprint ? blueprint.name.en : error;
      });
    }
  }
</script>