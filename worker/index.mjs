import locations from '../locations.json' with {type:'json'};

const PROJECT='badeldz';
const FS=`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const ROOT=`projects/${PROJECT}/databases/(default)/documents`;
const AUTH=`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT}`;
const encoder=new TextEncoder();
let googleSession,verificationKeys;
class HttpError extends Error{constructor(status,code,message,details){super(message);Object.assign(this,{status,code,details});}}
const fail=(status,code,message,details)=>{throw new HttpError(status,code,message,details);};
const base64url=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const unbase64=string=>Uint8Array.from(atob(string.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
const hash=async string=>base64url(await crypto.subtle.digest('SHA-256',encoder.encode(string)));
const now=()=>new Date().toISOString();
function value(data){
  if(data===null||data===undefined)return {nullValue:null};
  if(typeof data==='boolean')return {booleanValue:data};
  if(typeof data==='number')return Number.isInteger(data)?{integerValue:String(data)}:{doubleValue:data};
  if(typeof data==='string')return {stringValue:data};
  if(Array.isArray(data))return {arrayValue:{values:data.map(value)}};
  return {mapValue:{fields:fields(data)}};
}
const fields=data=>Object.fromEntries(Object.entries(data).filter(([,v])=>v!==undefined).map(([k,v])=>[k,value(v)]));
function decode(v){
  if('nullValue'in v)return null;if('stringValue'in v)return v.stringValue;if('integerValue'in v)return Number(v.integerValue);if('doubleValue'in v)return v.doubleValue;if('booleanValue'in v)return v.booleanValue;
  if(v.arrayValue)return(v.arrayValue.values||[]).map(decode);if(v.mapValue)return Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,x])=>[k,decode(x)]));if(v.timestampValue)return v.timestampValue;return null;
}
const documentData=doc=>doc?.fields?Object.fromEntries(Object.entries(doc.fields).map(([k,v])=>[k,decode(v)])):null;
async function googleToken(env){
  if(googleSession?.expires>Date.now()+90000)return googleSession.token;
  if(!env.FIREBASE_SERVICE_ACCOUNT)fail(503,'SERVICE_NOT_READY','Le service de commande est en cours de configuration.');
  const sa=JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const header=base64url(encoder.encode(JSON.stringify({alg:'RS256',typ:'JWT'})));
  const seconds=Math.floor(Date.now()/1000);
  const payload=base64url(encoder.encode(JSON.stringify({iss:sa.client_email,scope:'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform',aud:'https://oauth2.googleapis.com/token',iat:seconds,exp:seconds+3600})));
  const key=await crypto.subtle.importKey('pkcs8',unbase64(sa.private_key.replace(/-----[^-]+-----|\s/g,'')),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  const signature=base64url(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,encoder.encode(`${header}.${payload}`)));
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${header}.${payload}.${signature}`})});
  const result=await response.json();if(!response.ok||!result.access_token)fail(503,'DATABASE_UNAVAILABLE','La connexion à Firebase est momentanément indisponible.');
  googleSession={token:result.access_token,expires:Date.now()+result.expires_in*1000};return result.access_token;
}
async function google(env,url,method='GET',body){
  const response=await fetch(url,{method,headers:{Authorization:`Bearer ${await googleToken(env)}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  const result=await response.json().catch(()=>({}));
  if(!response.ok){if(response.status===404)return null;if(response.status===409)throw new HttpError(409,'ALREADY_EXISTS','Cet élément existe déjà.');if(response.status===400){const message=result.error?.message||'';if(/EMAIL_EXISTS/.test(message))fail(409,'EMAIL_EXISTS','Cette adresse e-mail est déjà utilisée.');if(/INVALID_PASSWORD|WEAK_PASSWORD/.test(message))fail(400,'WEAK_PASSWORD','Le mot de passe doit contenir au moins 12 caractères.');}fail(502,'FIREBASE_ERROR','Firebase ne peut pas traiter cette opération pour le moment.');}return result;
}
async function getDoc(env,path){return documentData(await google(env,`${FS}/${path}`));}
async function setDoc(env,path,data){await google(env,`${FS}/${path}`,'PATCH',{fields:fields(data)});return data;}
async function createDoc(env,collection,id,data){await google(env,`${FS}/${collection}?documentId=${encodeURIComponent(id)}`,'POST',{fields:fields(data)});return data;}
async function listDocs(env,collection){let pageToken='',out=[];do{const page=await google(env,`${FS}/${collection}?pageSize=1000${pageToken?`&pageToken=${encodeURIComponent(pageToken)}`:''}`);out.push(...(page?.documents||[]).map(documentData));pageToken=page?.nextPageToken||'';}while(pageToken);return out;}
async function commit(env,writes){return google(env,`${FS}:commit`,'POST',{writes});}
async function readBody(request,max=50000){
  if(Number(request.headers.get('Content-Length'))>max)fail(413,'TOO_LARGE','Données trop volumineuses.');
  const raw=await request.text();if(raw.length>max)fail(413,'TOO_LARGE','Données trop volumineuses.');
  try{return JSON.parse(raw);}catch{fail(400,'INVALID_JSON','Données invalides.');}
}
function clean(value,label,min=0,max=200){if(typeof value!=='string')fail(400,'INVALID_FIELD',`Champ invalide : ${label}`);const s=value.trim();if(s.length<min||s.length>max||/[\u0000-\u0008]/.test(s))fail(400,'INVALID_FIELD',`Champ invalide : ${label}`);return s;}
const validPrice=p=>p===null||(Number.isInteger(p)&&p>=0&&p<=1000000);
async function authenticate(request,env){
  const token=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');
  if(!token||token.length>10000)fail(401,'AUTH_REQUIRED','Connectez-vous à votre espace administrateur.');
  let header,payload,parts;try{parts=token.split('.');header=JSON.parse(new TextDecoder().decode(unbase64(parts[0])));payload=JSON.parse(new TextDecoder().decode(unbase64(parts[1])));}catch{fail(401,'INVALID_TOKEN','Session invalide.');}
  if(parts.length!==3||header.alg!=='RS256'||payload.aud!==PROJECT||payload.iss!==`https://securetoken.google.com/${PROJECT}`||!payload.sub||payload.sub.length>128||payload.exp*1000<=Date.now()||payload.iat*1000>Date.now()+300000)fail(401,'INVALID_TOKEN','Session expirée. Reconnectez-vous.');
  if(!verificationKeys||verificationKeys.expires<Date.now()){const r=await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');if(!r.ok)fail(503,'AUTH_UNAVAILABLE','Authentification indisponible.');verificationKeys={keys:(await r.json()).keys,expires:Date.now()+3600000};}
  const jwk=verificationKeys.keys.find(k=>k.kid===header.kid);if(!jwk)fail(401,'INVALID_TOKEN','Session invalide.');
  const publicKey=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',publicKey,unbase64(parts[2]),encoder.encode(`${parts[0]}.${parts[1]}`)))fail(401,'INVALID_TOKEN','Session invalide.');
  const profile=await getDoc(env,`users/${payload.sub}`);
  if(!profile||profile.disabled||!['owner','admin','manager','operator'].includes(profile.role)||(profile.tokenValidAfter&&payload.auth_time<profile.tokenValidAfter))fail(403,'ACCESS_DENIED','Ce compte ne dispose pas des droits nécessaires.');
  return {...profile,uid:payload.sub};
}
function allowRoles(user,roles){if(!roles.includes(user.role))fail(403,'ACCESS_DENIED','Cette action est réservée aux administrateurs.');}
async function quota(request,env,kind,limit){
  const ip=request.headers.get('CF-Connecting-IP')||'local';const bucket=Math.floor(Date.now()/600000);const id=await hash(`${kind}:${ip}:${bucket}`);
  const result=await commit(env,[{transform:{document:`${ROOT}/rateLimits/${id}`,fieldTransforms:[{fieldPath:'count',increment:{integerValue:'1'}},{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}]}}]);
  const count=Number(result.writeResults?.[0]?.transformResults?.[0]?.integerValue||0);if(count>limit)fail(429,'RATE_LIMIT','Trop de tentatives. Réessayez dans quelques minutes.');
}
export function resolveDelivery(customer,knownSubtotal,rates){
  const rate=rates.find(r=>r.code===customer.wilaya);if(rate?.enabled===false)fail(400,'AREA_UNAVAILABLE','La livraison dans cette wilaya est momentanément indisponible.');
  if(customer.wilaya==='35'&&customer.commune==='3528'&&knownSubtotal>=4000)return 0;
  const fee=rate?.[customer.deliveryMode];return typeof fee==='number'?fee:null;
}
export function normalizeCustomer(input){
  if(!input||typeof input!=='object')fail(400,'INVALID_CUSTOMER','Coordonnées manquantes.');
  const name=clean(input.name,'nom',3,100);let phone=clean(input.phone,'téléphone',9,20).replace(/[\s().-]/g,'');phone=phone.replace(/^\+?213/,'0');
  if(!/^0[567]\d{8}$/.test(phone))fail(400,'INVALID_PHONE','Saisissez un numéro mobile algérien valide.');
  const wilaya=locations.find(w=>w.code===input.wilaya);const commune=wilaya?.communes.find(c=>c.id===input.commune);
  if(!wilaya||!commune)fail(400,'INVALID_LOCATION','Choisissez une wilaya et une commune valides.');
  if(!['home','desk'].includes(input.deliveryMode))fail(400,'INVALID_DELIVERY','Choisissez domicile ou bureau.');
  const address=input.deliveryMode==='home'?clean(input.address,'adresse',5,300):'';
  const desk=input.deliveryMode==='desk'?clean(input.desk,'bureau',2,150):'';
  return {name,phone,wilaya:wilaya.code,wilayaName:wilaya.name,commune:commune.id,communeName:commune.name,deliveryMode:input.deliveryMode,address,desk,notes:clean(input.notes||'','notes',0,800)};
}
export function calculateLines(input,products){
  if(!Array.isArray(input)||input.length<1||input.length>30)fail(400,'INVALID_CART','Le panier doit contenir entre 1 et 30 références.');
  const used=new Set();return input.map(item=>{
    const product=products.find(p=>p.id===item.productId);const variant=product?.variants.find(v=>v.id===item.variantId);
    if(!product||!variant||product.available===false)fail(400,'PRODUCT_UNAVAILABLE','Un produit du panier n’est plus disponible.');
    if(!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>50)fail(400,'INVALID_QUANTITY','Quantité invalide.');
    const key=`${product.id}:${variant.id}`;if(used.has(key))fail(400,'DUPLICATE_LINE','Regroupez les quantités d’un même produit.');used.add(key);
    return {productId:product.id,variantId:variant.id,name:product.name,variant:variant.label,quantity:item.quantity,unitPrice:variant.price,lineTotal:variant.price===null?null:variant.price*item.quantity,image:product.image};
  });
}
function publicOrder(order){return {id:order.id,reference:order.reference,status:order.status,subtotal:order.subtotal,knownSubtotal:order.knownSubtotal,deliveryFee:order.deliveryFee,total:order.total,requiresConfirmation:order.status==='needs_quote'};}
async function submitOrder(request,env){
  const body=await readBody(request);if(body.website)fail(400,'INVALID_REQUEST','Requête invalide.');
  const key=clean(body.idempotencyKey,'identifiant',36,36);if(!/^[a-f0-9-]{36}$/i.test(key))fail(400,'INVALID_REQUEST','Identifiant invalide.');
  const customer=normalizeCustomer(body.customer);const requestHash=await hash(JSON.stringify({customer,items:body.items}));
  const existing=await getDoc(env,`orders/${key}`);if(existing){if(existing.requestHash!==requestHash)fail(409,'ORDER_CONFLICT','Cette demande a déjà été traitée.');return publicOrder(existing);}
  await quota(request,env,'order',8);
  if(!Array.isArray(body.items)||body.items.length<1||body.items.length>30)fail(400,'INVALID_CART','Panier invalide.');
  const ids=[...new Set(body.items.map(item=>item.productId))];if(ids.some(id=>typeof id!=='string'||!/^p-\d+$/.test(id)))fail(400,'INVALID_CART','Référence invalide.');
  const [products,rate]=await Promise.all([Promise.all(ids.map(id=>getDoc(env,`products/${id}`))),getDoc(env,`deliveryRates/${customer.wilaya}`)]);const rates=rate?[rate]:[];
  const items=calculateLines(body.items,products.filter(Boolean));const pending=items.some(i=>i.unitPrice===null);const knownSubtotal=items.reduce((sum,item)=>sum+(item.lineTotal||0),0);const subtotal=pending?null:knownSubtotal;const deliveryFee=resolveDelivery(customer,knownSubtotal,rates);const total=subtotal===null||deliveryFee===null?null:subtotal+deliveryFee;
  if(total!==null&&body.quotedTotal!==null&&body.quotedTotal!==total)fail(409,'PRICE_CHANGED','Les tarifs ont été actualisés. Vérifiez votre panier avant de confirmer.',{subtotal,deliveryFee,total});
  const status=pending||deliveryFee===null||body.quotedTotal===null?'needs_quote':'new';
  const order={id:key,reference:`BD-${now().slice(2,10).replaceAll('-','')}-${key.slice(0,7).toUpperCase()}`,createdAt:now(),updatedAt:now(),status,customer,items,subtotal,knownSubtotal,deliveryFee,total,locale:body.locale==='fr'?'fr':'ar',paymentMethod:'cash_on_delivery',adminNotes:'',requestHash};
  try{await createDoc(env,'orders',key,order);}catch(error){if(error.code!=='ALREADY_EXISTS')throw error;const duplicate=await getDoc(env,`orders/${key}`);if(duplicate?.requestHash!==requestHash)fail(409,'ORDER_CONFLICT','Demande déjà traitée.');return publicOrder(duplicate);}
  return publicOrder(order);
}
async function updateOrder(request,env,id,user){
  const old=await getDoc(env,`orders/${id}`);if(!old)fail(404,'NOT_FOUND','Commande introuvable.');const body=await readBody(request);
  const statuses=['new','needs_quote','confirmed','preparing','shipped','delivered','cancelled'];
  if(body.status&&!statuses.includes(body.status))fail(400,'INVALID_STATUS','Statut invalide.');
  const order={...old,updatedAt:now(),updatedBy:user.uid};
  if(body.adminNotes!==undefined)order.adminNotes=clean(body.adminNotes,'note',0,2000);
  if(body.deliveryFee!==undefined){if(!validPrice(body.deliveryFee))fail(400,'INVALID_PRICE','Frais de livraison invalides.');order.deliveryFee=body.deliveryFee;}
  if(body.linePrices!==undefined){if(!Array.isArray(body.linePrices)||body.linePrices.length!==order.items.length||!body.linePrices.every(validPrice))fail(400,'INVALID_PRICE','Prix invalides.');order.items=order.items.map((item,i)=>({...item,unitPrice:body.linePrices[i],lineTotal:body.linePrices[i]===null?null:body.linePrices[i]*item.quantity}));}
  order.knownSubtotal=order.items.reduce((s,i)=>s+(i.lineTotal||0),0);order.subtotal=order.items.some(i=>i.unitPrice===null)?null:order.knownSubtotal;order.total=order.subtotal===null||order.deliveryFee===null?null:order.subtotal+order.deliveryFee;
  if(body.status){if(['confirmed','preparing','shipped','delivered'].includes(body.status)&&order.total===null)fail(400,'MISSING_PRICE','Renseignez tous les prix avant de confirmer la commande.');order.status=body.status;}
  await setDoc(env,`orders/${id}`,order);return order;
}
async function updateProduct(request,env,id,user){
  allowRoles(user,['owner','admin','manager']);const product=await getDoc(env,`products/${id}`);if(!product)fail(404,'NOT_FOUND','Produit introuvable.');const body=await readBody(request);
  if(body.name){product.name={fr:clean(body.name.fr,'nom français',2,180),ar:clean(body.name.ar,'nom arabe',2,180)};}
  if(body.description){for(const lang of['fr','ar']){if(!Array.isArray(body.description[lang])||body.description[lang].length<1||body.description[lang].length>8)fail(400,'INVALID_DESCRIPTION','Description invalide.');}product.description={fr:body.description.fr.map(p=>clean(p,'description',1,4000)),ar:body.description.ar.map(p=>clean(p,'description',1,4000))};}
  if(body.variantPrices){for(const variant of product.variants){if(Object.hasOwn(body.variantPrices,variant.id)){const price=body.variantPrices[variant.id];if(!validPrice(price))fail(400,'INVALID_PRICE','Le prix doit être un montant positif en DA ou rester vide.');variant.price=price;}}product.price=(product.variants.find(v=>v.id==='500g')||product.variants[0]).price;}
  if(body.available!==undefined){if(typeof body.available!=='boolean')fail(400,'INVALID_FIELD','Disponibilité invalide.');product.available=body.available;}
  product.updatedAt=now();await setDoc(env,`products/${id}`,product);return product;
}
async function manageUsers(request,env,user,id){
  allowRoles(user,['owner','admin']);
  if(request.method==='GET')return {users:await listDocs(env,'users')};
  const body=await readBody(request);
  if(request.method==='POST'){
    const email=clean(body.email,'e-mail',5,180).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail(400,'INVALID_EMAIL','Adresse e-mail invalide.');
    const password=clean(body.password,'mot de passe',12,128);const role=body.role;if(!['admin','manager','operator'].includes(role))fail(400,'INVALID_ROLE','Rôle invalide.');const displayName=clean(body.displayName,'nom',2,100);
    const created=await google(env,`${AUTH}/accounts`,'POST',{email,password,displayName,emailVerified:false,disabled:false});
    const profile={uid:created.localId,email,displayName,role,disabled:false,createdAt:now(),createdBy:user.uid,tokenValidAfter:0};await setDoc(env,`users/${profile.uid}`,profile);return profile;
  }
  const target=await getDoc(env,`users/${id}`);if(!target)fail(404,'NOT_FOUND','Compte introuvable.');
  if(target.role==='owner'&&user.uid!==target.uid)fail(403,'OWNER_PROTECTED','Le compte propriétaire est protégé.');
  if(body.role!==undefined){if(target.role==='owner'||id===user.uid)fail(400,'OWNER_PROTECTED','Vous ne pouvez pas modifier ce rôle.');if(!['admin','manager','operator'].includes(body.role))fail(400,'INVALID_ROLE','Rôle invalide.');target.role=body.role;}
  const changes={localId:id};
  if(body.disabled!==undefined){if(target.role==='owner'||id===user.uid)fail(400,'OWNER_PROTECTED','Vous ne pouvez pas suspendre ce compte.');if(typeof body.disabled!=='boolean')fail(400,'INVALID_FIELD','État invalide.');target.disabled=body.disabled;changes.disableUser=body.disabled;}
  if(body.displayName!==undefined){target.displayName=clean(body.displayName,'nom',2,100);changes.displayName=target.displayName;}
  if(body.password){changes.password=clean(body.password,'mot de passe',12,128);target.tokenValidAfter=Math.floor(Date.now()/1000);changes.validSince=String(target.tokenValidAfter);}
  if(Object.keys(changes).length>1)await google(env,`${AUTH}/accounts:update`,'POST',changes);
  target.updatedAt=now();await setDoc(env,`users/${id}`,target);return target;
}
const catalogCacheKey=request=>new Request(new URL('/api/cache/catalog',request.url).href);
async function route(request,env,ctx){
  const url=new URL(request.url),path=url.pathname;
  if(path==='/api/health')return {ok:true,project:PROJECT,database:'Firestore'};
  if(path==='/api/catalog'&&request.method==='GET'){
    const key=catalogCacheKey(request);const fresh=url.searchParams.get('fresh')==='1';const cached=!fresh&&await caches.default.match(key);if(cached)return cached.json();
    const [products,deliveryRates]=await Promise.all([listDocs(env,'products'),listDocs(env,'deliveryRates')]);const result={products,deliveryRates,freeDelivery:{wilaya:'35',commune:'3528',threshold:4000}};
    ctx.waitUntil(caches.default.put(key,new Response(JSON.stringify(result),{headers:{'Content-Type':'application/json','Cache-Control':'public,max-age=120'}})));return result;
  }
  if(path==='/api/orders'&&request.method==='POST')return submitOrder(request,env);
  if(!path.startsWith('/api/admin/'))fail(404,'NOT_FOUND','Page introuvable.');
  const user=await authenticate(request,env);
  if(path==='/api/admin/me')return {user};
  if(path==='/api/admin/orders'&&request.method==='GET'){
    const rows=await google(env,`${FS}:runQuery`,'POST',{structuredQuery:{from:[{collectionId:'orders'}],orderBy:[{field:{fieldPath:'createdAt'},direction:'DESCENDING'}],limit:500}});return {orders:(rows||[]).filter(r=>r.document).map(r=>documentData(r.document))};
  }
  const orderId=path.match(/^\/api\/admin\/orders\/([a-f0-9-]{36})$/i)?.[1];if(orderId&&request.method==='PATCH')return updateOrder(request,env,orderId,user);
  if(path==='/api/admin/products'&&request.method==='GET'){allowRoles(user,['owner','admin','manager']);return {products:await listDocs(env,'products')};}
  const productId=path.match(/^\/api\/admin\/products\/(p-\d+)$/)?.[1];if(productId&&request.method==='PATCH'){const result=await updateProduct(request,env,productId,user);await caches.default.delete(catalogCacheKey(request));return result;}
  if(path==='/api/admin/delivery'){
    allowRoles(user,['owner','admin','manager']);if(request.method==='GET')return {rates:await listDocs(env,'deliveryRates')};
    if(request.method==='PUT'){const {rates}=await readBody(request);if(!Array.isArray(rates)||rates.length!==69||new Set(rates.map(r=>r.code)).size!==69)fail(400,'INVALID_RATES','Les 69 wilayas doivent être renseignées une seule fois.');const writes=rates.map(rate=>{const wilaya=locations.find(w=>w.code===rate.code);if(!wilaya||!validPrice(rate.home)||!validPrice(rate.desk)||typeof rate.enabled!=='boolean')fail(400,'INVALID_RATES','Tarif ou wilaya invalide.');return{update:{name:`${ROOT}/deliveryRates/${rate.code}`,fields:fields({code:rate.code,name:wilaya.name,home:rate.home,desk:rate.desk,enabled:rate.enabled,updatedAt:now()})}};});await commit(env,writes);await caches.default.delete(catalogCacheKey(request));return {ok:true};}
  }
  if(path==='/api/admin/users'&&['GET','POST'].includes(request.method))return manageUsers(request,env,user);
  const userId=path.match(/^\/api\/admin\/users\/([A-Za-z0-9_-]{1,128})$/)?.[1];if(userId&&request.method==='PATCH')return manageUsers(request,env,user,userId);
  fail(404,'NOT_FOUND','Action introuvable.');
}
export default{async fetch(request,env,ctx){
  const origin=request.headers.get('Origin');const allowed=[env.STORE_ORIGIN,'http://127.0.0.1:4173','http://localhost:4173'];
  const cors=origin&&allowed.includes(origin)?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{};
  const headers={...cors,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex','Referrer-Policy':'no-referrer'};
  if(origin&&!allowed.includes(origin))return new Response(JSON.stringify({error:{code:'ORIGIN_DENIED',message:'Origine non autorisée.'}}),{status:403,headers});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET,POST,PATCH,PUT,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization','Access-Control-Max-Age':'600'}});
  try{return new Response(JSON.stringify(await route(request,env,ctx)),{status:200,headers});}
  catch(error){const status=error.status||500;return new Response(JSON.stringify({error:{code:error.code||'INTERNAL_ERROR',message:error.status?error.message:'Une erreur est survenue. Réessayez dans un instant.',...(error.details?{details:error.details}:{})}}),{status,headers});}
}};
