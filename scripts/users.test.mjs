import test from 'node:test';
import assert from 'node:assert/strict';
import {adminProfileHasAccess,deleteAdminUser} from '../worker/users.mjs';
import worker from '../worker/index.mjs';

const owner={uid:'owner-uid',role:'owner'};
const profile={uid:'operator-uid',email:'operator@example.test',displayName:'Compte de test',role:'operator',disabled:false,tokenValidAfter:0};
function fixture(overrides={}){
  const state={profile:{...profile,...overrides},authExists:true,steps:[],failAuth:false,failCleanup:false,conflict:false};
  const repository={
    getProfile:async()=>state.profile&&structuredClone(state.profile),
    markDeleting:async(id,patch)=>{if(state.conflict)throw Object.assign(new Error('Concurrent change'),{code:'WRITE_CONFLICT'});state.steps.push('block');Object.assign(state.profile,patch);},
    deleteAuth:async()=>{state.steps.push('auth');assert.equal(adminProfileHasAccess(state.profile,100),false);if(state.failAuth)throw new Error('Auth unavailable');state.authExists=false;},
    deleteProfile:async()=>{state.steps.push('profile');if(state.failCleanup)throw new Error('Cleanup unavailable');state.profile=null;},
    now:()=>200000
  };
  return {state,repository,remove:(actor=owner,email=profile.email,id=profile.uid)=>deleteAdminUser(actor,id,email,repository)};
}

test('owner deletes a non-owner profile and Auth account after blocking its sessions',async()=>{
  const f=fixture();assert.equal(adminProfileHasAccess(f.state.profile,100),true);
  assert.deepEqual(await f.remove(),{ok:true,uid:profile.uid});
  assert.deepEqual(f.state.steps,['block','auth','profile']);assert.equal(f.state.authExists,false);assert.equal(f.state.profile,null);
  assert.equal(adminProfileHasAccess(f.state.profile,100),false);
});
test('administrators can delete non-owner team accounts with case-insensitive email confirmation',async()=>{
  const f=fixture({role:'admin'});await f.remove({uid:'other-admin',role:'admin'},' OPERATOR@EXAMPLE.TEST ');assert.equal(f.state.authExists,false);
});
test('manager, operator and unknown roles cannot initiate deletion',async()=>{
  for(const role of ['manager','operator','unknown',undefined]){const f=fixture();await assert.rejects(f.remove({uid:'other',role}),{code:'ACCESS_DENIED'});assert.deepEqual(f.state.steps,[]);}
});
test('owner accounts and the acting account cannot be deleted, including via forged requests',async()=>{
  const f=fixture({role:'owner'});await assert.rejects(f.remove(),{code:'OWNER_PROTECTED'});assert.deepEqual(f.state.steps,[]);
  const self=fixture();await assert.rejects(self.remove({uid:profile.uid,role:'admin'}),{code:'SELF_PROTECTED'});assert.deepEqual(self.state.steps,[]);
});
test('missing or incorrect confirmation never changes the account',async()=>{
  for(const email of [undefined,'','other@example.test']){const f=fixture();await assert.rejects(deleteAdminUser(owner,profile.uid,email,f.repository),{code:'CONFIRMATION_REQUIRED'});assert.deepEqual(f.state.steps,[]);assert.equal(adminProfileHasAccess(f.state.profile,100),true);}
});
test('invalid identifiers cannot be used to target other Firestore paths',async()=>{
  for(const id of ['','../owner','users/owner','x'.repeat(129)]){const f=fixture();await assert.rejects(f.remove(owner,profile.email,id),{code:'INVALID_USER'});assert.deepEqual(f.state.steps,[]);}
});
test('Auth failure leaves access blocked and a retry completes deletion',async()=>{
  const f=fixture();f.state.failAuth=true;await assert.rejects(f.remove(),/Auth unavailable/);
  assert.equal(f.state.profile.disabled,true);assert.equal(f.state.profile.deletionPending,true);assert.equal(adminProfileHasAccess(f.state.profile,300),false);assert.equal(f.state.authExists,true);
  f.state.failAuth=false;await f.remove();assert.equal(f.state.authExists,false);assert.equal(f.state.profile,null);
});
test('Firestore cleanup failure can be retried after Auth was already deleted',async()=>{
  const f=fixture();f.state.failCleanup=true;await assert.rejects(f.remove(),/Cleanup unavailable/);
  assert.equal(f.state.authExists,false);assert.equal(adminProfileHasAccess(f.state.profile,300),false);
  f.state.failCleanup=false;await f.remove();assert.equal(f.state.profile,null);
});
test('concurrent profile changes abort deletion before Auth is touched',async()=>{
  const f=fixture();f.state.conflict=true;await assert.rejects(f.remove(),{code:'WRITE_CONFLICT'});assert.equal(f.state.authExists,true);assert.deepEqual(f.state.steps,[]);
});
test('repeated deletion of an absent profile is harmless and touches no Auth account',async()=>{
  const f=fixture();f.state.profile=null;assert.deepEqual(await f.remove(),{ok:true,uid:profile.uid,alreadyDeleted:true});assert.deepEqual(f.state.steps,[]);
});
test('pending deletion, suspension and revoked or missing auth times always deny API access',()=>{
  assert.equal(adminProfileHasAccess({...profile,deletionPending:true},100),false);
  assert.equal(adminProfileHasAccess({...profile,disabled:true},100),false);
  assert.equal(adminProfileHasAccess({...profile,tokenValidAfter:200},100),false);
  assert.equal(adminProfileHasAccess(profile,undefined),false);
  assert.equal(adminProfileHasAccess({...profile,tokenValidAfter:200},200),true);
});
test('deletion API rejects anonymous requests before contacting Firebase',async()=>{
  const response=await worker.fetch(new Request('https://badil-api.example/api/admin/users/operator-uid',{method:'DELETE',headers:{Origin:'https://badeeldz.com'},body:JSON.stringify({confirmationEmail:profile.email})}),{STORE_ORIGIN:'https://badeeldz.com'},{});
  assert.equal(response.status,401);assert.equal((await response.json()).error.code,'AUTH_REQUIRED');
});
