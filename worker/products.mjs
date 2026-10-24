import {CATEGORY_IDS,summarizeProduct,localProductImage,mediaImageKey} from '../product-data.mjs';
class ProductError extends Error{constructor(code,message,status=400){super(message);Object.assign(this,{code,status});}}
const reject=(code,message,status)=>{throw new ProductError(code,message,status);};
function text(value,label,min=2,max=400){if(typeof value!=='string'||value.trim().length<min||value.trim().length>max||/[\u0000-\u0008]/.test(value))reject('INVALID_FIELD','Champ invalide : '+label);return value.trim();}
const priceValid=value=>value===null||(Number.isInteger(value)&&value>=0&&value<=1000000);
export function normalizeProductInput(body,origin,existing=null){
  if(!body||typeof body!=='object'||Array.isArray(body))reject('INVALID_FIELD','Données du produit invalides.');
  const product=existing?structuredClone(existing):{available:true,variants:[],categories:[],isHoney:false};
  if(body.name)product.name={fr:text(body.name.fr,'nom français',2,180),ar:text(body.name.ar,'nom arabe',2,180)};
  if(!product.name)reject('INVALID_FIELD','Les deux noms du produit sont requis.');
  if(body.categories){if(!Array.isArray(body.categories)||body.categories.length<1||body.categories.length>5||new Set(body.categories).size!==body.categories.length||body.categories.some(id=>!CATEGORY_IDS.includes(id)))reject('INVALID_CATEGORY','Choisissez une catégorie valide.');product.categories=body.categories;}
  if(!product.categories.length)reject('INVALID_CATEGORY','Choisissez au moins une catégorie.');
  if(!existing){if(body.isHoney!==undefined&&typeof body.isHoney!=='boolean')reject('INVALID_FIELD','Type de produit invalide.');product.isHoney=body.isHoney??product.categories.includes('honey');product.variants=product.isHoney?[{id:'125g',label:'125 g',price:null},{id:'250g',label:'250 g',price:null},{id:'500g',label:'500 g',price:null},{id:'1kg',label:'1 kg',price:null}]:[{id:'standard',label:'',price:null}];}
  if(body.description){product.description={};for(const locale of ['fr','ar']){const list=body.description[locale];if(!Array.isArray(list)||list.length<1||list.length>8)reject('INVALID_DESCRIPTION','Ajoutez une description dans les deux langues.');product.description[locale]=list.map(p=>text(p,'description',1,4000));}}
  if(!product.description)reject('INVALID_DESCRIPTION','Les descriptions française et arabe sont requises.');
  if(body.shortDescription)product.shortDescription={fr:text(body.shortDescription.fr,'description courte française',2,400),ar:text(body.shortDescription.ar,'description courte arabe',2,400)};
  else if(!product.shortDescription)product.shortDescription={fr:summarizeProduct(product,'fr'),ar:summarizeProduct(product,'ar')};
  if(body.variantPrices){if(typeof body.variantPrices!=='object'||Array.isArray(body.variantPrices))reject('INVALID_PRICE','Prix invalides.');for(const variant of product.variants){if(Object.hasOwn(body.variantPrices,variant.id)){const price=body.variantPrices[variant.id];if(!priceValid(price))reject('INVALID_PRICE','Le prix doit être un montant en DA ou rester vide.');variant.price=price;}}}
  const main=product.variants.find(v=>v.id===(product.isHoney?'500g':'standard'));product.price=main.price;
  if(!existing&&main.price===null)reject('MISSING_PRICE','Renseignez le prix de vente'+(product.isHoney?' pour 500 g.':'.'));
  if(body.available!==undefined){if(typeof body.available!=='boolean')reject('INVALID_FIELD','Disponibilité invalide.');product.available=body.available;}
  if(body.image!==undefined){if(!localProductImage(body.image)&&!mediaImageKey(body.image,origin))reject('INVALID_IMAGE','Choisissez une photo avec le bouton de téléversement.');product.image=body.image;}
  if(!product.image)reject('MISSING_IMAGE','Ajoutez une photo du produit.');
  return product;
}
export const MAX_IMAGE_BYTES=1572864;
export function validateImageBytes(bytes,type){
  if(!(bytes instanceof Uint8Array)||bytes.byteLength<24)reject('INVALID_IMAGE','Le fichier image est invalide.');
  if(bytes.byteLength>MAX_IMAGE_BYTES)reject('IMAGE_TOO_LARGE','L’image optimisée dépasse 1,5 Mo.',413);
  const starts=(offset,list)=>list.every((value,index)=>bytes[offset+index]===value);
  if(type==='image/png'&&starts(0,[137,80,78,71,13,10,26,10])&&starts(12,[73,72,68,82]))return 'png';
  if(type==='image/jpeg'&&starts(0,[255,216,255])&&starts(bytes.length-2,[255,217]))return 'jpg';
  if(type==='image/webp'&&starts(0,[82,73,70,70])&&starts(8,[87,69,66,80])&&starts(12,[86,80,56])&&new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(4,true)+8===bytes.byteLength)return 'webp';
  reject('INVALID_IMAGE','Utilisez une véritable photo JPG, PNG ou WebP.');
}
