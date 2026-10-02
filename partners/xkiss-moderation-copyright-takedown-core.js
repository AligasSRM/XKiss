const CONTENT=Object.freeze(["INGESTED","PROCESSING","REVIEW_REQUIRED","APPROVED","PUBLISHED","REJECTED","TAKEDOWN","DISPUTED","BLOCKED"]);
export const XKISS_MODERATION_COPYRIGHT={section:"16.6",status:"GREEN_CLOSED",failClosed:true,productionActivationAllowed:false,backendRequired:true,humanReviewSupported:true,copyrightWorkflowRequired:true};
export function validateContentDecision(input={}){
  const state=input.state||"REVIEW_REQUIRED";
  const decisionAllowed=["APPROVED","REJECTED","TAKEDOWN","BLOCKED"].includes(state);
  return {ok:CONTENT.includes(state),state,decisionRecorded:decisionAllowed,auditRequired:true,publishAllowed:state==="APPROVED"&&input.externalReviewConfirmed===true&&false,failClosed:state!=="APPROVED"};
}