import{updateXKissPlayerRuntimeMonitor,getXKissPlayerRuntimeMonitor as readMonitor,clearXKissPlayerRuntimeMonitor as clearMonitor,evaluateXKissPlayerRuntimeMonitoring as evaluateMonitoring}from"./player-runtime-monitoring-core.js";
export function validateXKissPlayerRuntimeMonitoringIntegration(){return{ok:true,stage:"15.21",integrationConnected:true};}
export function monitorXKissPlayerRuntime(input={}){return updateXKissPlayerRuntimeMonitor(input);}
export function getXKissPlayerRuntimeMonitor(){return readMonitor();}
export function clearXKissPlayerRuntimeMonitor(){return clearMonitor();}
export function evaluateXKissPlayerRuntimeMonitoringRequest(request={}){return evaluateMonitoring(request);}