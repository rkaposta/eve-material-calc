<template>
  <div>
    <div>
      --------------------<br>
      Materials:
        <ul>
           <li v-for="item in material.blueprint.totalMat">
            {{ item.displayName }}: {{ item.quantity }}
          </li>
        </ul>
    </div>
  </div>
</template>

<script>
  import SystemInformation from './LandingPage/SystemInformation'
  import { ipcRenderer } from 'electron';

  export default {
    props: ['material'],
    data() {
      return {
        content: ''
      }
    },
  }
</script>