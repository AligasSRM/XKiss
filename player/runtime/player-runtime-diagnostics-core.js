import{validateXKissPlayerRuntimeDiagnosticsRequest}from"./player-runtime-diagnostics-rules.js";
export const XKISS_PLAYER_RUNTIME_DIAGNOSTICS_CORE={section:"15.19",name:"XKiss Player Runtime Diagnostics Core",version:"1.0.0",status:"connected",failClosed:true};
const diagnostics=[];
export function captureXKissPlayerRuntimeDiagnostic(type,detail={}){if(!type)return{ok:false,reason:"diagnostic_type_missing"};const item={type,timestamp:Date.now(),detail:{...detail}};diagnostics.push(item);if(diagnostics.length>100)diagnostics.shift();return{ok:true,item};}
export function readXKissPlayerRuntimeDiagnostics(){return diagnostics.map(x=>({...x,detail:{...x.detail}}));}
export function clearXKissPlayerRuntimeDiagnostics(){diagnostics.length=0;return{ok:true,cleared:true};}
export function evaluateXKissPlayerRuntimeDiagnostics(request={}){const v=validateXKissPlayerRuntimeDiagnosticsRequest(request);return{allowed:v.allowed===true,gates:v.gates};}