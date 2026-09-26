import{buildXKissPlayerRuntimeObservabilitySnapshot,getXKissPlayerRuntimeHealth,clearXKissPlayerRuntimeObservability,evaluateXKissPlayerRuntimeObservability}from"./player-runtime-observability-core.js";
export function validateXKissPlayerRuntimeObservabilityIntegration(){return{ok:true,stage:"15.20",integrationConnected:true};}
export function snapshotXKissPlayerRuntimeObservability(input={}){return buildXKissPlayerRuntimeObservabilitySnapshot(input);}
export function getXKissPlayerRuntimeHealth(){return getXKissPlayerRuntimeHealth();}
export function clearXKissPlayerRuntimeObservability(){return clearXKissPlayerRuntimeObservability();}
export function evaluateXKissPlayerRuntimeObservabilityRequest(request={}){return evaluateXKissPlayerRuntimeObservability(request);}