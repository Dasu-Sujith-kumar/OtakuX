class ModuleStateManager {
  constructor() {
    this.moduleStates = new Map();
    this.activeModuleName = null;
  }

  saveState(moduleName, state) {
    if (!moduleName) return;
    const currentState = this.moduleStates.get(moduleName) || {};
    this.moduleStates.set(moduleName, { ...currentState, ...state });
    console.log(`[ModuleStateManager] Saved state for ${moduleName}:`, this.moduleStates.get(moduleName));
  }

  loadState(moduleName) {
    if (!moduleName) return null;
    const state = this.moduleStates.get(moduleName);
    console.log(`[ModuleStateManager] Loaded state for ${moduleName}:`, state);
    return state;
  }

  setActive(moduleName) {
    this.activeModuleName = moduleName;
    console.log(`[ModuleStateManager] Active module set to: ${moduleName}`);
  }

  getActive() {
    return this.activeModuleName;
  }

  setDownloading(moduleName, isDownloading) {
    const state = this.moduleStates.get(moduleName) || {};
    state.isDownloading = isDownloading;
    this.moduleStates.set(moduleName, state);
    console.log(`[ModuleStateManager] Set downloading=${isDownloading} for ${moduleName}`);
  }

  isDownloading(moduleName) {
    const state = this.moduleStates.get(moduleName);
    return state ? state.isDownloading : false;
  }
}

module.exports = ModuleStateManager;
