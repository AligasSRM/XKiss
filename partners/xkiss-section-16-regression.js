import {validatePartnerAccount} from "./xkiss-partner-accounts-core.js";
import {validateOrganizationVerification} from "./xkiss-organization-verification-core.js";
import {validateRightsRecord} from "./xkiss-rights-consent-core.js";
import {validateIngestionRequest} from "./xkiss-enterprise-ingestion-core.js";
import {validateMediaProcessingStatus} from "./xkiss-media-processing-delivery-core.js";
import {validateContentDecision} from "./xkiss-moderation-copyright-takedown-core.js";
import {evaluateGeoPolicy} from "./xkiss-distribution-geo-policy-core.js";
import {createEnterpriseAuditEvent} from "./xkiss-enterprise-analytics-audit-core.js";
import {validateSettlementInstruction} from "./xkiss-contract-revenue-settlement-core.js";
import {validateApiCredential} from "./xkiss-partner-api-security-core.js";
export function runSection16Regression(){
  const checks=[
    validatePartnerAccount({organizationId:"org",legalName:"Company",accountType:"company",country:"SY",contactEmail:"x@example.invalid"}).ok,
    validateOrganizationVerification({status:"PENDING"}).ok,
    validateRightsRecord({rightsBasis:"LICENSED",consentRecorded:true}).ok,
    validateIngestionRequest({source:"api",metadata:{}}).ok,
    validateMediaProcessingStatus({status:"QUEUED",delivery:"UNAVAILABLE"}).ok,
    validateContentDecision({state:"REVIEW_REQUIRED"}).ok,
    evaluateGeoPolicy({country:"SY"}).allowed===true,
    createEnterpriseAuditEvent({action:"partner.created",actorId:"system"}).ok,
    validateSettlementInstruction({contractId:"contract",amount:0}).ok,
    validateApiCredential({scopes:["partner.read"],issuedByBackend:true}).ok
  ];
  return {ok:checks.every(Boolean),checksPassed:checks.filter(Boolean).length,checksTotal:checks.length,failClosed:true,productionActivationAllowed:false};
}