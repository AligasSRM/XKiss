const ROLE_PERMISSIONS = Object.freeze({
  admin:["view_users","manage_users","view_content","manage_content","view_reports","manage_reports","view_analytics","view_storage","view_settings"],
  moderator:["view_users","view_content","manage_content","view_reports","manage_reports"],
  support:["view_users","view_content","view_reports"],
  finance:["view_users","view_analytics"],
  super_admin:["view_users","manage_users","view_content","manage_content","view_reports","manage_reports","view_analytics","view_storage","view_settings"]
});

export function adminBackendStatus(env={}) {
  return {
    ok:Boolean(env.XKISS_AUTH_DB),
    service:"XKiss Admin Backend",
    databaseConfigured:Boolean(env.XKISS_AUTH_DB),
    authorizationMode:"role_based",
    mfaRequiredForSuperAdmin:true,
    auditRequired:true,
    failClosed:true
  };
}

export function authorizeAdminAction(user, permission) {
  if(!user || user.status!=="active") return {ok:false,allowed:false,status:"unauthorized"};
  const permissions=ROLE_PERMISSIONS[user.role]||[];
  const allowed=permissions.includes(permission);
  return {ok:true,allowed,status:allowed?"authorized":"forbidden",role:user.role,permission};
}

export const ADMIN_BACKEND_SECURITY=Object.freeze({
  frontendCannotGrantPermissions:true,
  frontendCannotStoreCredentials:true,
  failClosed:true
});
