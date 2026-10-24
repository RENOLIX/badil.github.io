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
  try{const url=new URL(value);if(url.protocol!=='https:'||url.origin!==new URL(origin).origin||url.search||url.hash)return null;return url.pathname.match(/^\/media\/([a-f0-9-]{36}\.(?:webp|png|jpg))$/i)?.[1]||null;}catch{return null;}
}
export function productImageUrl(value,origin){return localProductImage(value)||mediaImageKey(value,origin)?value:'assets/logo.png';}
