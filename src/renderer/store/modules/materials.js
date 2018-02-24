const state = {
  blueprint: undefined,
  resolvedBlueprint: undefined,
  allMaterials: undefined
}

const mutations = {
  setResolvedBlueprint (state, blueprint) {
      state.resolvedBlueprint = blueprint;
  }
}

export default {
  state,
  mutations,
}
  