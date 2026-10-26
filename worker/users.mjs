const reject=(status,code,message)=>{throw Object.assign(new Error(message),{status,code});};

export function adminProfileHasAccess(profile,authTime){
  return Boolean(profile&&!profile.disabled&&!profile.deletionPending&&
    ['owner','admin','manager','operator'].includes(profile.role)&&
    Number.isFinite(authTime)&&authTime>=(profile.tokenValidAfter||0));
}

// Revoke profile access before touching Auth; keep it blocked if either service fails.
// A retry can finish deleting an Auth account whose Firestore cleanup failed.
export async function deleteAdminUser(actor,id,confirmationEmail,repository){
  if(!['owner','admin'].includes(actor?.role))reject(403,'ACCESS_DENIED','Cette action est réservée aux administrateurs.');
  if(typeof id!=='string'||!/^[-A-Za-z0-9_]{1,128}$/.test(id))reject(400,'INVALID_USER','Compte invalide.');
  if(id===actor.uid)reject(403,'SELF_PROTECTED','Vous ne pouvez pas supprimer votre propre compte.');
  const target=await repository.getProfile(id);
  if(!target)return {ok:true,uid:id,alreadyDeleted:true};
  if(target.role==='owner')reject(403,'OWNER_PROTECTED','Le compte propriétaire ne peut pas être supprimé.');
  if(typeof confirmationEmail!=='string'||confirmationEmail.trim().toLowerCase()!==target.email?.toLowerCase())
    reject(400,'CONFIRMATION_REQUIRED','Saisissez l’adresse e-mail exacte du compte pour confirmer sa suppression.');
  const timestamp=repository.now?.()??Date.now();
  await repository.markDeleting(id,{
    disabled:true,deletionPending:true,tokenValidAfter:Math.floor(timestamp/1000),
    updatedAt:new Date(timestamp).toISOString()
  });
  await repository.deleteAuth(id);
  await repository.deleteProfile(id);
  return {ok:true,uid:id};
}
