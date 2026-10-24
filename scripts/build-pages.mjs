import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),base='https://renolix.github.io/badil.github.io/';
const template=await readFile(new URL('index.html',root),'utf8'),products=JSON.parse(await readFile(new URL('catalog.json',root),'utf8'));
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const pages=products.map(p=>({file:'produit-'+p.id.replace('p-','')+'.html',kind:'product',product:p,title:p.name.ar+' | '+p.name.fr,description:p.description.ar[0],content:'<article class="product-detail"><div class="detail-photo"><img src="'+escape(p.image)+'" alt="'+escape(p.name.ar)+'" width="700" height="700"></div><div class="detail-information"><h1>'+escape(p.name.ar)+'</h1><p class="detail-price" dir="ltr">'+p.price+' DA</p></div></article><section class="long-description"><h2>وصف المنتج</h2>'+p.description.ar.map(text=>'<p>'+escape(text)+'</p>').join('')+'</section>'}));
for(const [file,kind,title] of [['panier.html','cart','سلة المشتريات'],['commande.html','checkout','إتمام الطلب'],['favoris.html','wishlist','المفضلة'],['merci.html','confirmation','تأكيد الطلب'],['aide.html','help','تواصل معنا'],['a-propos.html','about','عن البديل'],['confidentialite.html','privacy','الخصوصية']])pages.push({file,kind,title,description:'BADEELDZ — البديل',content:'<header class="page-heading"><h1>'+title+'</h1></header><p>جارٍ تحميل الصفحة…</p>'});
for(const page of pages){
  let html=template.replace('<body>','<body data-page="'+page.kind+'"'+(page.product?' data-product-id="'+page.product.id+'"':'')+'>');
  html=html.replace(/<main id="main">[\s\S]*?<\/main>/,'<main id="main" class="commerce-page container"><div id="page-content">'+page.content+'</div></main>');
  html=html.replace(/href="#(main|categories|catalog)"/g,'href="./#$1" data-page-link');
  html=html.replace('class="skip-link" href="./#main" data-page-link','class="skip-link" href="#main"');
  html=html.replace(/<title>.*?<\/title>/,'<title>'+escape(page.title)+' | BADEELDZ</title>');
  html=html.replace(/(<meta name="description" content=")[^"]*/,'$1'+escape(page.description));
  html=html.replace(/(<meta property="og:title" content=")[^"]*/,'$1'+escape(page.title));
  html=html.replace(/(<meta property="og:description" content=")[^"]*/,'$1'+escape(page.description));
  html=html.replace(/(<meta property="og:url" content=")[^"]*/,'$1'+base+page.file);
  html=html.replace(/(<link rel="canonical" href=")[^"]*/,'$1'+base+page.file);
  if(page.product)html=html.replace(base+'assets/logo.png',base+page.product.image);
  else if(['cart','checkout','wishlist','confirmation'].includes(page.kind))html=html.replace('</head>','<meta name="robots" content="noindex,follow"></head>');
  await writeFile(new URL(page.file,root),html);
}
await writeFile(new URL('sitemap.xml',root),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+base+'</loc></url>'+pages.filter(p=>p.kind==='product'||['help','about','privacy'].includes(p.kind)).map(p=>'<url><loc>'+base+p.file+'</loc></url>').join('')+'</urlset>\n');
console.log('Generated '+products.length+' product pages and '+(pages.length-products.length)+' separate shopping/information pages.');
