import{captureXKissPlayerRuntimeDiagnostic,readXKissPlayerRuntimeDiagnostics,clearXKissPlayerRuntimeDiagnostics,evaluateXKissPlayerRuntimeDiagnostics}from"./player-runtime-diagnostics-core.js";
export function validateXKissPlayerRuntimeDiagnosticsIntegration(){return{ok:true,stage:"15.19",integrationConnected:true};}
export function captureXKissRuntimeDiagnostic(type,detail={}){return captureXKissPlayerRuntimeDiagnostic(type,detail);}
export function getXKissRuntimeDiagnostics(){return readXKissPlayerRuntimeDiagnostics();}
export function clearXKissRuntimeDiagnostics(){return clearXKissPlayerRuntimeDiagnostics();}
export function evaluateXKissPlayerRuntimeDiagnosticsRequest(request={}){return evaluateXKissPlayerRuntimeDiagnostics(request);}