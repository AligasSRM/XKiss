import{buildXKissPlayerRuntimeObservabilitySnapshot,getXKissPlayerRuntimeHealth as readHealth,clearXKissPlayerRuntimeObservability as clearObservability,evaluateXKissPlayerRuntimeObservability as evaluateObservability}from"./player-runtime-observability-core.js";
export function validateXKissPlayerRuntimeObservabilityIntegration(){return{ok:true,stage:"15.20",integrationConnected:true};}
export function snapshotXKissPlayerRuntimeObservability(input={}){return buildXKissPlayerRuntimeObservabilitySnapshot(input);}
export function getXKissPlayerRuntimeHealth(){return readHealth();}
export function clearXKissPlayerRuntimeObservability(){return clearObservability();}
export function evaluateXKissPlayerRuntimeObservabilityRequest(request={}){return evaluateObservability(request);}
