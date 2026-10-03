export const XKISS_FINAL_MASTER_LOCK=Object.freeze({
  section:"20",
  name:"Final Master Release Lock",
  state:"GREEN_CLOSED",
  locked:true,
  failClosed:true,
  productionActivationAllowed:false,
  externalVerificationRequired:true,
  protectedSections:["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19"],
  mutationPolicy:"EXPLICIT_VERIFIED_CHANGE_ONLY"
});

export function validateFinalMasterLock(){
  const s=XKISS_FINAL_MASTER_LOCK;
  return {
    ok:s.state==="GREEN_CLOSED"&&s.locked&&s.failClosed&&!s.productionActivationAllowed&&
      s.externalVerificationRequired&&s.protectedSections.length===19,
    section:"20",
    state:s.state,
    locked:s.locked,
    failClosed:s.failClosed,
    productionActivationAllowed:s.productionActivationAllowed
  };
}
