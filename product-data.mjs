export const CATEGORY_IDS=['herbs-spices','bakhoor-musk','vinegar','dohn','black-seed-oil','hair-oils','natural-oils','natural-shampoo','tea-tisanes','natural-soap','honey','cupping-cups','kohl-henna','creams','slimming-supplements'];
export function summarizeProduct(product,locale='fr'){
  const explicit=product.shortDescription?.[locale]?.trim();if(explicit)return explicit;
  const paragraph=product.description?.[locale]?.[0]?.trim()||'';
  const sentence=paragraph.match(/^.*?[.!?؟](?:\s|$)/u)?.[0]?.trim()||paragraph;
  if(sentence.length<=260)return sentence;
  return sentence.slice(0,250).replace(/\s+\S*$/u,'')+'…';
}
export const localProductImage=value=>typeof value==='string'&&/^assets\/[a-zA-Z0-9/_\-.]+\.(jpg|png|webp)$/.test(value)&&!value.split('/').some(part=>part==='..'||part==='.');
export function mediaImageKey(value,origin){
  try{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.href!==value||url.origin!==new URL(origin).origin||url.search||url.hash)return null;return url.pathname.match(/^\/media\/([a-f0-9-]{36}\.(?:webp|png|jpg))$/i)?.[1]||null;}catch{return null;}
}
export function productImageUrl(value,origin){return localProductImage(value)||mediaImageKey(value,origin)?value:'assets/logo.png';}
export const productImages=product=>Array.isArray(product.images)?product.images:product.image?[product.image]:[];
export const saleType=product=>product.formatType||(product.isHoney?'honey':'unit');
export const needsChoice=product=>saleType(product)!=='unit'||product.variants.length>1;
export const purchasable=product=>product.available!==false&&product.stock!==0;
export const variantLabel=(variant,locale='fr')=>variant.labelLocalized?.[locale]||variant.label||'';
export function optionGroupsFor(product){
  if(saleType(product)==='custom')return product.optionGroups||[];
  if(saleType(product)==='honey')return [{id:'weight',title:{fr:'Poids',ar:'الوزن'},choices:product.variants.map(v=>({id:v.id,label:{fr:v.label,ar:v.label}}))}];
  return [];
}
export function buildCustomVariants(groups,existing=[]){
  let combinations=[[]];for(const group of groups)combinations=combinations.flatMap(values=>group.choices.map(choice=>[...values,{group,choice}]));
  if(combinations.length>48)throw new Error('Limitez les formats à 48 combinaisons.');
  return combinations.map(values=>{const id='v-'+values.map(v=>v.choice.id).join('_'),old=existing.find(v=>v.id===id),localized=Object.fromEntries(['fr','ar'].map(locale=>[locale,values.map(v=>v.choice.label[locale]||v.choice.label.fr).join(' / ')]));return {id,label:localized.fr,labelLocalized:localized,optionValues:Object.fromEntries(values.map(v=>[v.group.id,v.choice.id])),price:old?.price??null};});
}
