export const XKISS_SECTION_19_LOCK=Object.freeze({
  section:"19",
  state:"FINAL_LOCKED",
  locked:true,
  failClosed:true,
  productionActivationAllowed:false,
  externalActivationRequired:true,
  lockPolicy:{
    sourceCode:"LOCKED",
    productionActivation:"BLOCKED_UNTIL_EXTERNAL_VERIFICATION",
    bypass:false
  },
  protectedSections:["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18"]
});

export function validateSection19Lock(){
  return {
    ok:XKISS_SECTION_19_LOCK.locked===true&&
       XKISS_SECTION_19_LOCK.failClosed===true&&
       XKISS_SECTION_19_LOCK.productionActivationAllowed===false&&
       XKISS_SECTION_19_LOCK.externalActivationRequired===true,
    section:"19",
    state:"FINAL_LOCKED"
  };
}
