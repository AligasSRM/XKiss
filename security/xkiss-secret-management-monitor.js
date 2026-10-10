const REQUIRED_SECRET_NAMES=Object.freeze(["ELASTICLAKE_ACCESS_KEY","ELASTICLAKE_SECRET_KEY","ELASTICLAKE_ENDPOINT","ELASTICLAKE_BUCKET","ELASTICLAKE_REGION"]);
export function runSecretManagementMonitor(env=process.env){
  const supplied=Object.keys(env).some(k=>REQUIRED_SECRET_NAMES.includes(k));
  const presence=Object.fromEntries(REQUIRED_SECRET_NAMES.map(k=>[k,Boolean(env[k])]));
  const ok=supplied?Object.values(presence).every(Boolean):true;
  return {ok,section:"18",component:"SECRET_MANAGEMENT",presence:supplied?presence:"NOT_EXPOSED_TO_CONTROL_RUNTIME",valuesExposed:false,valuesLogged:false,externalVerificationRequired:true,failClosed:true};
}
