import {CATEGORY_IDS,summarizeProduct,localProductImage,mediaImageKey,buildCustomVariants,productImages,saleType} from '../product-data.mjs';
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
  if(body.isHoney!==undefined){if(typeof body.isHoney!=='boolean')reject('INVALID_FIELD','Type de produit invalide.');product.isHoney=body.isHoney;}else if(!existing)product.isHoney=product.categories.includes('honey');
  const format=body.formatType??saleType(product);if(!['unit','honey','custom'].includes(format))reject('INVALID_FORMAT','Format de vente invalide.');
  if(body.formatType!==undefined||!existing||body.optionGroups!==undefined){
    if(format==='custom'){
      const groups=body.optionGroups??product.optionGroups;if(!Array.isArray(groups)||!groups.length||groups.length>3)reject('INVALID_FORMAT','Ajoutez entre 1 et 3 formats personnalisés.');
      const used=new Set();product.optionGroups=groups.map(group=>{if(!/^g-[a-z0-9-]{4,40}$/.test(group.id)||used.has(group.id))reject('INVALID_FORMAT','Identifiant du format invalide.');used.add(group.id);if(!Array.isArray(group.choices)||group.choices.length<1||group.choices.length>12)reject('INVALID_FORMAT','Ajoutez entre 1 et 12 choix par format.');return {id:group.id,title:{fr:text(group.title?.fr,'titre du format',1,80),ar:text(group.title?.ar||group.title?.fr,'titre arabe',1,80)},choices:group.choices.map(choice=>{if(!/^c-[a-z0-9-]{4,40}$/.test(choice.id)||used.has(choice.id))reject('INVALID_FORMAT','Identifiant du choix invalide.');used.add(choice.id);return {id:choice.id,label:{fr:text(choice.label?.fr,'texte du choix',1,100),ar:text(choice.label?.ar||choice.label?.fr,'texte arabe',1,100)}};})};});
      if(product.optionGroups.reduce((n,g)=>n*g.choices.length,1)>48)reject('INVALID_FORMAT','Limitez les formats à 48 combinaisons.');product.variants=buildCustomVariants(product.optionGroups,existing?.variants);
    }else{product.optionGroups=[];product.variants=(format==='honey'?[{id:'125g',label:'125 g'},{id:'250g',label:'250 g'},{id:'500g',label:'500 g'},{id:'1kg',label:'1 kg'}]:[{id:'standard',label:''}]).map(v=>({...v,price:existing?.variants.find(old=>old.id===v.id)?.price??null}));}
    product.formatType=format;
  }
  if(body.description){product.description={};for(const locale of ['fr','ar']){const list=body.description[locale];if(!Array.isArray(list)||list.length<1||list.length>8)reject('INVALID_DESCRIPTION','Ajoutez une description dans les deux langues.');product.description[locale]=list.map(p=>text(p,'description',1,4000));}}
  if(!product.description)reject('INVALID_DESCRIPTION','Les descriptions française et arabe sont requises.');
  if(body.shortDescription)product.shortDescription={fr:text(body.shortDescription.fr,'description courte française',2,400),ar:text(body.shortDescription.ar,'description courte arabe',2,400)};
  else if(!product.shortDescription)product.shortDescription={fr:summarizeProduct(product,'fr'),ar:summarizeProduct(product,'ar')};
  if(body.variantPrices){if(typeof body.variantPrices!=='object'||Array.isArray(body.variantPrices))reject('INVALID_PRICE','Prix invalides.');for(const variant of product.variants){if(Object.hasOwn(body.variantPrices,variant.id)){const price=body.variantPrices[variant.id];if(!priceValid(price))reject('INVALID_PRICE','Le prix doit être un montant en DA ou rester vide.');variant.price=price;}}}
  const reference=body.referenceVariantId??product.referenceVariantId??(format==='honey'?'500g':product.variants[0].id);const main=product.variants.find(v=>v.id===reference);if(!main)reject('INVALID_FORMAT','Choisissez le prix de référence du produit.');product.referenceVariantId=reference;product.price=main.price;
  if((!existing||body.formatType!==undefined)&&main.price===null)reject('MISSING_PRICE','Renseignez le prix de référence'+(format==='honey'?' pour 500 g.':'.'));
  if(body.stock!==undefined){if(body.stock!==null&&(!Number.isInteger(body.stock)||body.stock<0||body.stock>1000000))reject('INVALID_STOCK','Le stock doit être un nombre entier positif ou nul.');product.stock=body.stock;}
  if(body.available!==undefined){if(typeof body.available!=='boolean')reject('INVALID_FIELD','Disponibilité invalide.');product.available=body.available;}
  if(body.images!==undefined){if(!Array.isArray(body.images)||body.images.length>8||new Set(body.images).size!==body.images.length)reject('INVALID_IMAGE','Ajoutez au maximum 8 photos différentes.');product.images=body.images;}
  else if(body.image!==undefined)product.images=[body.image];else product.images=productImages(product);
  for(const image of product.images)if(!localProductImage(image)&&!mediaImageKey(image,origin))reject('INVALID_IMAGE','Choisissez une photo avec le bouton de téléversement.');
  if(!existing&&!product.images.length)reject('MISSING_IMAGE','Ajoutez une photo du produit.');product.image=product.images[0]||'assets/logo.png';
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
