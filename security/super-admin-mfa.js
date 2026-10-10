import { SUPER_ADMIN_SECURITY_RULES } from "./super-admin-security-rules.js";

export const SUPER_ADMIN_MFA_RULES = Object.freeze({
  version:"2.0", status:"implemented_pending_secret", enabled:false,
  requiredForRole:SUPER_ADMIN_SECURITY_RULES.superAdminRole,
  allowedMethods:["totp"], verificationWindowSeconds:90, maxAttempts:5,
  lockoutMinutes:15, provider:"Cloudflare D1 + WebCrypto AES-GCM/TOTP",
  secretStorage:"encrypted_at_rest"
});
const b64 = a => btoa(String.fromCharCode(...a));
const un64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const nowISO = () => new Date().toISOString();
async function getKey(env) {
  if (!env?.XKISS_MFA_ENCRYPTION_KEY) throw Error("mfa_encryption_key_missing");
  let bytes; try { bytes=un64(env.XKISS_MFA_ENCRYPTION_KEY); } catch { throw Error("mfa_encryption_key_invalid"); }
  if(bytes.length!==32) throw Error("mfa_encryption_key_invalid");
  return crypto.subtle.importKey("raw",bytes,"AES-GCM",false,["encrypt","decrypt"]);
}
async function encrypt(env, secret) {
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ciphertext=await crypto.subtle.encrypt({name:"AES-GCM",iv},await getKey(env),new TextEncoder().encode(secret));
  return {secretCiphertext:b64(new Uint8Array(ciphertext)),secretIv:b64(iv)};
}
async function decrypt(env,row) {
  const p=await crypto.subtle.decrypt({name:"AES-GCM",iv:un64(row.secret_iv)},await getKey(env),un64(row.secret_ciphertext));
  return new TextDecoder().decode(p);
}
function b32enc(bytes) {
  const a="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; let bits=0,v=0,out="";
  for(const x of bytes){v=(v<<8)|x;bits+=8;while(bits>=5){out+=a[(v>>(bits-5))&31];bits-=5;}}
  if(bits)out+=a[(v<<(5-bits))&31]; return out;
}
function b32dec(s) {
  const a="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";let bits=0,v=0,out=[];
  for(const c of s.toUpperCase().replace(/=+$/,"")){const n=a.indexOf(c);if(n<0)throw Error("bad_base32");v=(v<<5)|n;bits+=5;if(bits>=8){out.push((v>>(bits-8))&255);bits-=8;}}
  return new Uint8Array(out);
}
async function codeAt(secret,step) {
  const key=await crypto.subtle.importKey("raw",b32dec(secret),{name:"HMAC",hash:"SHA-1"},false,["sign"]);
  const msg=new Uint8Array(8);let n=BigInt(step);for(let i=7;i>=0;i--){msg[i]=Number(n&255n);n>>=8n;}
  const h=new Uint8Array(await crypto.subtle.sign("HMAC",key,msg)),o=h[h.length-1]&15;
  const v=((h[o]&127)<<24)|((h[o+1]&255)<<16)|((h[o+2]&255)<<8)|(h[o+3]&255);
  return String(v%1e6).padStart(6,"0");
}
async function matchCode(secret,code,lastStep=null) {
  if(typeof code!=="string"||!/^\d{6}$/.test(code))return null;
  const current=Math.floor(Date.now()/30000);
  for(let d=-1;d<=1;d++){const step=current+d;if(step<0||(lastStep!==null&&step<=lastStep))continue;if(await codeAt(secret,step)===code)return step;}
  return null;
}
function recentReauth(session){return session?.reauthenticatedAt && Date.now()-Date.parse(session.reauthenticatedAt)<=300000;}
export async function beginSuperAdminMfaEnrollment(env,user,session) {
  if(!env?.XKISS_AUTH_DB||user?.role!=="super_admin")return {ok:false,status:"forbidden"};
  if(!recentReauth(session))return {ok:false,status:"reauthentication_required"};
  try { await getKey(env); } catch(e) { return {ok:false,status:e.message}; }
  const db=env.XKISS_AUTH_DB;
  const old=await db.prepare("SELECT enabled_at FROM super_admin_mfa WHERE user_id=?1").bind(user.id).first();
  if(old?.enabled_at)return {ok:false,status:"mfa_already_enabled"};
  const secret=b32enc(crypto.getRandomValues(new Uint8Array(20))), enc=await encrypt(env,secret), now=nowISO();
  await db.prepare("INSERT INTO super_admin_mfa (user_id,secret_ciphertext,secret_iv,enabled_at,failed_attempts,locked_until,last_verified_step,created_at,updated_at) VALUES (?1,?2,?3,NULL,0,NULL,NULL,?4,?4) ON CONFLICT(user_id) DO UPDATE SET secret_ciphertext=excluded.secret_ciphertext,secret_iv=excluded.secret_iv,enabled_at=NULL,failed_attempts=0,locked_until=NULL,last_verified_step=NULL,updated_at=excluded.updated_at")
    .bind(user.id,enc.secretCiphertext,enc.secretIv,now).run();
  return {ok:true,status:"enrollment_pending",secret,otpauthUri:"otpauth://totp/"+encodeURIComponent("XKiss:"+user.email)+"?secret="+secret+"&issuer=XKiss&algorithm=SHA1&digits=6&period=30"};
}
export async function verifyAndEnableSuperAdminMfa(env,user,session,code) {
  if(!env?.XKISS_AUTH_DB||user?.role!=="super_admin")return {ok:false,status:"forbidden"};
  if(!recentReauth(session))return {ok:false,status:"reauthentication_required"};
  const db=env.XKISS_AUTH_DB,row=await db.prepare("SELECT * FROM super_admin_mfa WHERE user_id=?1").bind(user.id).first();
  if(!row||row.enabled_at)return {ok:false,status:row?.enabled_at?"mfa_already_enabled":"enrollment_not_started"};
  let step=null;try{step=await matchCode(await decrypt(env,row),code);}catch(e){return {ok:false,status:e.message==="mfa_encryption_key_missing"||e.message==="mfa_encryption_key_invalid"?e.message:"mfa_verification_failed"};}
  if(step===null){const fails=(row.failed_attempts||0)+1,lock=fails>=5?new Date(Date.now()+900000).toISOString():null;await db.prepare("UPDATE super_admin_mfa SET failed_attempts=?1,locked_until=?2,updated_at=?3 WHERE user_id=?4").bind(fails,lock,nowISO(),user.id).run();return {ok:false,status:lock?"mfa_locked":"invalid_mfa_code"};}
  const now=nowISO();await db.prepare("UPDATE super_admin_mfa SET enabled_at=?1,failed_attempts=0,locked_until=NULL,last_verified_step=?2,updated_at=?1 WHERE user_id=?3").bind(now,step,user.id).run();
  await db.prepare("UPDATE sessions SET mfa_verified_at=?1 WHERE id=?2 AND user_id=?3 AND revoked_at IS NULL").bind(now,session.sessionId,user.id).run();
  return {ok:true,status:"mfa_enabled",verifiedAt:now};
}
export async function verifySuperAdminMfaForSession(env,user,session,code) {
  if(!env?.XKISS_AUTH_DB||user?.role!=="super_admin")return {ok:false,status:"forbidden"};
  const db=env.XKISS_AUTH_DB,row=await db.prepare("SELECT * FROM super_admin_mfa WHERE user_id=?1").bind(user.id).first();
  if(!row?.enabled_at)return {ok:false,status:"mfa_not_enabled"};
  if(row.locked_until&&Date.parse(row.locked_until)>Date.now())return {ok:false,status:"mfa_locked"};
  let step=null;try{step=await matchCode(await decrypt(env,row),code,row.last_verified_step);}catch{return {ok:false,status:"mfa_verification_failed"};}
  if(step===null){const fails=(row.failed_attempts||0)+1,lock=fails>=5?new Date(Date.now()+900000).toISOString():null;await db.prepare("UPDATE super_admin_mfa SET failed_attempts=?1,locked_until=?2,updated_at=?3 WHERE user_id=?4").bind(fails,lock,nowISO(),user.id).run();return {ok:false,status:lock?"mfa_locked":"invalid_mfa_code"};}
  const now=nowISO();await db.prepare("UPDATE super_admin_mfa SET failed_attempts=0,locked_until=NULL,last_verified_step=?1,updated_at=?2 WHERE user_id=?3").bind(step,now,user.id).run();
  await db.prepare("UPDATE sessions SET mfa_verified_at=?1 WHERE id=?2 AND user_id=?3 AND revoked_at IS NULL").bind(now,session.sessionId,user.id).run();
  return {ok:true,status:"mfa_verified",verifiedAt:now};
}
export function requiresSuperAdminMfa(role){return role===SUPER_ADMIN_MFA_RULES.requiredForRole;}

export function validateMfaVerificationRequest(input = {}) {
  if (!requiresSuperAdminMfa(input.role)) return { ok: false, status: "mfa_not_applicable", verified: false };
  const method = String(input.method || "").trim();
  if (!SUPER_ADMIN_MFA_RULES.allowedMethods.includes(method)) return { ok: false, status: "invalid_method", verified: false };
  const code = String(input.code || "").trim();
  if (code.length !== 6 || [...code].some((char) => char < "0" || char > "9")) return { ok: false, status: "code_required", verified: false };
  return { ok: true, status: "backend_route_required", verified: false };
}

export function getSuperAdminMfaStatus() {
  return { ok: true, status: SUPER_ADMIN_MFA_RULES.status, enabled: SUPER_ADMIN_MFA_RULES.enabled, providerConnected: true, requiredForRole: SUPER_ADMIN_MFA_RULES.requiredForRole, allowedMethods: [...SUPER_ADMIN_MFA_RULES.allowedMethods], secretStorage: SUPER_ADMIN_MFA_RULES.secretStorage };
}
