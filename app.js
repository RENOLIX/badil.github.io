(() => {
  'use strict';
  const store = window.BADIL_STORE;
  const homePage=!document.body.dataset.page;
  const homeURL=params=>{const u=new URL('./',document.baseURI);u.searchParams.set('lang',language);for(const [key,value] of Object.entries(params||{}))if(value)u.searchParams.set(key,value);u.hash='catalog';return u.href;};
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const text = {
    fr: {
      country:'Algérie', admin:'Administration', skip:'Aller au contenu', naturalUniverse:'La nature au quotidien', welcome:'Bienvenue chez BADEELDZ — البديل', menu:'Menu',
      search:'Rechercher un produit', searchShort:'Recherche', searchPlaceholder:'Rechercher un produit...', help:'Aide', wishlist:'Favoris', cart:'Panier', account:'Mon compte',
      allCategories:'Toutes les catégories', categories:'Catégories', about:'À propos', home:'Accueil', shop:'Boutique', products:'Produits',
      sideTitle:'La nature,<br>tout simplement.', sideDescription:'L’univers des huiles naturelles', discover:'Découvrir',
      previous:'Photo précédente', next:'Photo suivante', pause:'Mettre le diaporama en pause', play:'Reprendre le diaporama', pauseCategories:'Arrêter le défilement des catégories', playCategories:'Reprendre le défilement des catégories', browseCategories:'Parcourir les catégories',
      emptyTitle:'Nos produits arrivent bientôt', emptyDescription:'Nous préparons notre sélection. Aucun produit n’est disponible pour le moment.', viewAll:'Voir toutes les catégories',
      serviceNatural:'Un univers naturel', serviceNaturalText:'Huiles, plantes et soins du quotidien', serviceSelection:'Une sélection soignée', serviceSelectionText:'Explorez les catégories BADEELDZ', serviceLanguage:'Dans votre langue', serviceLanguageText:'Français et arabe', servicePrivacy:'Votre vie privée', servicePrivacyText:'Parcourez en toute tranquillité',
      aboutText:'BADEELDZ — البديل, un univers d’huiles naturelles, d’herbes, d’épices et de soins. Bienvenue dans notre boutique.', usefulLinks:'Liens utiles', contact:'Nous contacter', privacy:'Confidentialité', rights:'Tous droits réservés.', close:'Fermer', continueBrowsing:'Continuer la visite', all:'Tous',
      cartText:'Votre panier est vide.\nNos produits seront disponibles prochainement.', wishlistText:'Vous n’avez pas encore de favoris.\nVous pourrez ajouter vos produits préférés dès leur arrivée.', accountText:'L’espace client sera disponible à l’ouverture du catalogue.', helpText:'Contactez BADEELDZ en Algérie : 0550 94 97 95 ou 0776 22 22 94. Livraison à domicile ou en bureau. Livraison gratuite à Dellys dès 4 000 DA d’achat.', privacyText:'Les informations saisies lors de la commande sont enregistrées dans Firebase pour son traitement par BADEELDZ. Aucun numéro de carte bancaire n’est demandé. Le panier, les favoris et la langue sont conservés dans votre navigateur. Les comptes administrateurs sont protégés par Firebase Authentication.',
      noResults:'Aucun résultat', noResultsText:'Aucun produit ne correspond à votre recherche. Notre catalogue sera disponible prochainement.', categoryEmpty:'Aucun produit dans cette catégorie pour le moment.', slide:'Photo', of:'sur'
    },
    ar: {
      country:'الجزائر', admin:'الإدارة', skip:'انتقل إلى المحتوى', naturalUniverse:'الطبيعة في حياتك اليومية', welcome:'مرحباً بكم في البديل BADEELDZ', menu:'القائمة',
      search:'البحث عن منتج', searchShort:'بحث', searchPlaceholder:'ابحث عن منتج...', help:'المساعدة', wishlist:'المفضلة', cart:'السلة', account:'حسابي',
      allCategories:'جميع الفئات', categories:'فئات', about:'عن البديل', home:'الرئيسية', shop:'المتجر', products:'منتجات',
      sideTitle:'من الطبيعة،<br>بكل بساطة.', sideDescription:'اكتشف عالم الزيوت الطبيعية', discover:'اكتشف الآن',
      previous:'الصورة السابقة', next:'الصورة التالية', pause:'إيقاف العرض', play:'استئناف العرض', pauseCategories:'إيقاف تمرير الفئات', playCategories:'استئناف تمرير الفئات', browseCategories:'تصفح الفئات',
      emptyTitle:'منتجاتنا قريباً', emptyDescription:'نحضّر لكم تشكيلتنا. لا توجد منتجات متاحة حالياً.', viewAll:'عرض جميع الفئات',
      serviceNatural:'عالم من الطبيعة', serviceNaturalText:'زيوت، نباتات وعناية يومية', serviceSelection:'اختيار بعناية', serviceSelectionText:'اكتشف فئات البديل', serviceLanguage:'باللغة التي تناسبك', serviceLanguageText:'العربية والفرنسية', servicePrivacy:'خصوصيتك أولاً', servicePrivacyText:'تصفح بكل راحة',
      aboutText:'البديل BADEELDZ، عالم من الزيوت الطبيعية والأعشاب والتوابل ومنتجات العناية. نرحب بكم في متجرنا.', usefulLinks:'روابط مفيدة', contact:'تواصل معنا', privacy:'سياسة الخصوصية', rights:'جميع الحقوق محفوظة.', close:'إغلاق', continueBrowsing:'متابعة التصفح', all:'الجميع',
      cartText:'سلتك فارغة حالياً.\nستتوفر منتجاتنا قريباً.', wishlistText:'لا توجد منتجات في المفضلة بعد.\nيمكنك إضافة منتجاتك المفضلة عند وصولها.', accountText:'ستتوفر مساحة العملاء عند افتتاح الكتالوج.', helpText:'تواصل مع البديل في الجزائر على 0550 94 97 95 أو 0776 22 22 94. التوصيل إلى المنزل أو المكتب. توصيل مجاني إلى دلس ابتداءً من 4 000 دج.', privacyText:'تُحفظ بيانات الطلب في Firebase لمعالجتها من طرف البديل. لا نطلب أي معلومات عن البطاقة البنكية. تُحفظ السلة والمفضلة واللغة في متصفحك. حسابات الإدارة محمية بواسطة Firebase Authentication.',
      noResults:'لا توجد نتائج', noResultsText:'لا توجد منتجات تطابق بحثك. سيتوفر الكتالوج قريباً.', categoryEmpty:'لا توجد منتجات في هذه الفئة حالياً.', slide:'الصورة', of:'من'
    }
  };
  let savedLanguage;
  try { savedLanguage = localStorage.getItem('badil-language'); } catch {}
  const urlLanguage = new URL(location.href).searchParams.get('lang');
  let language = ['fr','ar'].includes(urlLanguage) ? urlLanguage : ['fr','ar'].includes(savedLanguage) ? savedLanguage : 'ar';
  let currentSlide = 0, selectedCategory = new URL(location.href).searchParams.get('categorie')||'', searchQuery = new URL(location.href).searchParams.get('q')||'', activeInfo = '';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let heroPaused = reducedMotion.matches, categoryPaused = reducedMotion.matches;
  let heroTimer, heroHover = false, heroFocus = false, stripHover = false, stripFocus = false;
  const icon = (name, cls='icon') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const categoryImage = (category) => `assets/categories/category-${store.categories.indexOf(category)+1}.jpg`;
  const t = (key) => text[language][key] || key;

  const languagePicker=$('#menu-language-picker');
  function translatePage() {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    if(homePage) document.title = language === 'ar' ? 'البديل BADEELDZ | المتجر الطبيعي' : 'BADEELDZ — البديل | Boutique naturelle';
    $$('[data-i18n]').forEach(el => { if (el.dataset.i18n === 'sideTitle') el.innerHTML=t(el.dataset.i18n); else el.textContent=t(el.dataset.i18n); });
    $$('[data-i18n-label]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.i18nLabel)));
    $$('[data-i18n-placeholder]').forEach(el=>el.setAttribute('placeholder',t(el.dataset.i18nPlaceholder)));
    const currentLanguage=$('#menu-current-language'),otherLanguage=$('#menu-other-language'),other=language==='ar'?'fr':'ar';
    currentLanguage.textContent=language==='ar'?'العربية':'Français';currentLanguage.lang=language;currentLanguage.dir=language==='ar'?'rtl':'ltr';
    otherLanguage.textContent=other==='ar'?'العربية':'Français';otherLanguage.dataset.lang=other;otherLanguage.lang=other;otherLanguage.dir=other==='ar'?'rtl':'ltr';
    languagePicker.querySelector('summary').setAttribute('aria-label',(language==='ar'?'اللغة : ':'Langue : ')+currentLanguage.textContent);languagePicker.open=false;
    $$('[data-lang]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.lang===language)));
    $('.desktop-nav').setAttribute('aria-label',language==='ar'?'التنقل الرئيسي':'Navigation principale');
    $('.mobile-bottom-nav').setAttribute('aria-label',language==='ar'?'التنقل على الهاتف':'Navigation mobile');
    $('#hero-slider')?.setAttribute('aria-label',language==='ar'?'صور البديل':'Photos BADEELDZ');
    renderCategories(); renderSlides(); renderCatalog(); updatePauseControls();
    try{localStorage.setItem('badil-language',language);}catch{}
    document.querySelectorAll('[data-page-link]').forEach(link=>{const u=new URL(link.getAttribute('href'),document.baseURI);u.searchParams.set('lang',language);link.href=u.href;});
  }
  function renderCategories() {
    const link = (cat,withIcon=false) => `<a href="${homeURL({categorie:cat.id})}" data-category="${cat.id}">${cat[language]}${withIcon?icon('chevron'):''}</a>`;
    const primaryIds=['herbs-spices','natural-oils','black-seed-oil','honey','tea-tisanes'];
    $('#main-nav-links').innerHTML=primaryIds.map(id=>link(store.categories.find(c=>c.id===id),true)).join('');
    $('#footer-categories').innerHTML=['natural-oils','herbs-spices','honey','natural-soap'].map(id=>link(store.categories.find(c=>c.id===id))).join('');
    $('#category-menu').innerHTML=store.categories.map(c=>`<a href="${homeURL({categorie:c.id})}" data-category="${c.id}"><img src="${categoryImage(c)}" width="36" height="36" alt="" loading="lazy"><span>${c[language]}</span></a>`).join('');
    const cards=store.categories.map(c=>`<a class="category-card" href="${homeURL({categorie:c.id})}" data-category="${c.id}" dir="${language==='ar'?'rtl':'ltr'}"><img src="${categoryImage(c)}" width="150" height="112" alt="" loading="lazy"><span>${c[language]}</span></a>`).join('');
    if(!$('#category-track'))return;
    $('#category-track').innerHTML=`<div class="category-group">${cards}</div><div class="category-group" aria-hidden="true">${cards.replaceAll('<a ', '<a tabindex="-1" ')}</div>`;
    $('#category-strip').scrollLeft=0;
  }
  function renderSlides() {
    if(!$('#hero-slides'))return;
    $('#hero-slides').innerHTML=store.slides.map((slide,i)=>`<article class="hero-slide ${slide.campaign?'campaign':''} ${i===currentSlide?'is-active':''}" aria-hidden="${i!==currentSlide}" ${i!==currentSlide?'inert':''}><img src="${slide.imageLocalized?.[language]||slide.image}" alt="${slide[language][2]}" width="1600" height="1000" ${i===0?'fetchpriority="high"':'loading="lazy"'}>${slide.campaign?'<span class="delivery-motion-dot" aria-hidden="true"></span>':''}<div class="slide-copy ${slide.campaign?'sr-only':''}"><span class="banner-eyebrow">BADEELDZ</span><${i===0?'h1':'h2'}>${slide[language][0]}</${i===0?'h1':'h2'}><p>${slide[language][1]}</p><a class="hero-cta" href="${homeURL({categorie:slide.category})}" data-category="${slide.category}">${t('discover')}${icon('chevron')}</a></div></article>`).join('');
    $('#hero-dots').innerHTML=store.slides.map((_,i)=>`<button class="hero-dot" type="button" data-slide="${i}" aria-label="${t('slide')} ${i+1} ${t('of')} ${store.slides.length}" aria-current="${i===currentSlide}"></button>`).join('');
    updateSlideStatus();
  }
  function updateSlideStatus() { $('#slide-status').textContent=`${t('slide')} ${currentSlide+1} ${t('of')} ${store.slides.length}`; }
  function showSlide(index) {
    currentSlide=(index+store.slides.length)%store.slides.length;
    $$('.hero-slide').forEach((el,i)=>{el.classList.toggle('is-active',i===currentSlide);el.setAttribute('aria-hidden',String(i!==currentSlide));el.inert=i!==currentSlide;});
    $$('.hero-dot').forEach((el,i)=>el.setAttribute('aria-current',String(i===currentSlide)));
    updateSlideStatus();
  }
  function restartHeroTimer() {
    clearInterval(heroTimer);
    if(homePage&&!heroPaused&&!heroHover&&!heroFocus&&!document.hidden) heroTimer=setInterval(()=>showSlide(currentSlide+1),store.slideInterval);
  }
  function updatePauseControls() {
    if(!homePage)return;
    const button=$('.hero-pause');
    button.setAttribute('aria-pressed',String(heroPaused));button.setAttribute('aria-label',t(heroPaused?'play':'pause'));button.innerHTML=icon(heroPaused?'play':'pause');
    const stripButton=$('#category-pause');
    stripButton.setAttribute('aria-pressed',String(categoryPaused));stripButton.setAttribute('aria-label',t(categoryPaused?'playCategories':'pauseCategories'));stripButton.innerHTML=icon(categoryPaused?'play':'pause');
  }
  function renderCatalog() {
    window.BADIL_VIEW={language,category:selectedCategory,query:searchQuery};
    if(!homePage){window.BADIL_COMMERCE?.render(window.BADIL_VIEW);return;}
    const cat=store.categories.find(c=>c.id===selectedCategory);
    $('#catalog-title').textContent=searchQuery?t('searchShort'):cat?cat[language]:t('products');
    $('#empty-title').textContent=searchQuery?t('noResults'):t('emptyTitle');
    $('#empty-description').textContent=searchQuery?t('noResultsText'):cat?t('categoryEmpty'):t('emptyDescription');
    $('#reset-catalog').hidden=!selectedCategory&&!searchQuery;
    const tabs=[{id:'',label:t('all')},...['natural-oils','herbs-spices'].map(id=>({id,label:store.categories.find(c=>c.id===id)[language]}))];
    $('#catalog-tabs').innerHTML=tabs.map(tab=>`<button type="button" data-filter="${tab.id}" aria-pressed="${tab.id===selectedCategory&&!searchQuery}">${tab.label}</button>`).join('');
    window.BADIL_COMMERCE?.render(window.BADIL_VIEW);
  }
  function filterCategory(id) {
    if(!homePage){location.assign(homeURL({categorie:id}));return;}
    window.BADIL_COMMERCE?.resetPage();
    selectedCategory=id;searchQuery='';$('#site-search').value='';renderCatalog();
    if($('#category-dialog').open) $('#category-dialog').close();
    if($('#info-dialog')?.open) $('#info-dialog').close();
  }
  function openInfo(kind){const files={cart:'panier.html',wishlist:'favoris.html',help:'aide.html',about:'a-propos.html',privacy:'confidentialite.html'};if(files[kind]){const url=new URL(files[kind],document.baseURI);url.searchParams.set('lang',language);location.assign(url.href);}}
  function focusSearch(){
    if(matchMedia('(max-width:767px)').matches) $('.site-header').classList.add('search-open');
    window.scrollTo({top:0,behavior:reducedMotion.matches?'instant':'smooth'});$('#site-search').focus({preventScroll:true});
  }
  languagePicker.addEventListener('toggle',()=>languagePicker.querySelector('summary').setAttribute('aria-expanded',String(languagePicker.open)));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&languagePicker.open){event.preventDefault();event.stopPropagation();languagePicker.open=false;languagePicker.querySelector('summary').focus();}});
  document.addEventListener('click',event=>{
    if(!languagePicker.contains(event.target))languagePicker.open=false;
    const langButton=event.target.closest('[data-lang]');
    if(langButton){language=langButton.dataset.lang;try{localStorage.setItem('badil-language',language);}catch{}const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(null,'',url);translatePage();restartHeroTimer();return;}
    const categoryLink=event.target.closest('[data-category]');
    if(categoryLink&&!event.ctrlKey&&!event.metaKey){if(!homePage)event.preventDefault();filterCategory(categoryLink.dataset.category);}
    const filter=event.target.closest('[data-filter]');
    if(filter) filterCategory(filter.dataset.filter);
    const dot=event.target.closest('[data-slide]');
    if(dot){showSlide(Number(dot.dataset.slide));restartHeroTimer();}
    const action=event.target.closest('[data-action]')?.dataset.action;
    if(action==='menu') $('#category-dialog').showModal();
    else if(action==='search') focusSearch();
    else if(action) openInfo(action);
    if(event.target.closest('.close-dialog')) event.target.closest('dialog').close();
  });
  $$('.search-form').forEach(form=>form.addEventListener('submit',event=>{
    event.preventDefault();searchQuery=$('#site-search').value.trim();if(!homePage){location.assign(homeURL({q:searchQuery}));return;}selectedCategory='';renderCatalog();$('#catalog').scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth'});$('#site-search').blur();
  }));
  $('#reset-catalog')?.addEventListener('click',()=>filterCategory(''));
  $('.hero-next')?.addEventListener('click',()=>{showSlide(currentSlide+1);restartHeroTimer();});
  $('.hero-prev')?.addEventListener('click',()=>{showSlide(currentSlide-1);restartHeroTimer();});
  $('.hero-pause')?.addEventListener('click',()=>{heroPaused=!heroPaused;updatePauseControls();restartHeroTimer();});
  $('#category-pause')?.addEventListener('click',()=>{categoryPaused=!categoryPaused;updatePauseControls();});
  $('#hero-slider')?.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){heroHover=true;restartHeroTimer();}});
  $('#hero-slider')?.addEventListener('pointerleave',()=>{heroHover=false;restartHeroTimer();});
  $('#hero-slider')?.addEventListener('focusin',()=>{heroFocus=true;restartHeroTimer();});
  $('#hero-slider')?.addEventListener('focusout',event=>{if(!$('#hero-slider').contains(event.relatedTarget)){heroFocus=false;restartHeroTimer();}});
  $('#hero-slider')?.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();showSlide(currentSlide+(event.key==='ArrowRight'?1:-1));restartHeroTimer();}});
  let touchStart=null;
  $('#hero-slider')?.addEventListener('touchstart',event=>{touchStart=event.changedTouches[0].clientX;},{passive:true});
  $('#hero-slider')?.addEventListener('touchend',event=>{if(touchStart!==null){const delta=event.changedTouches[0].clientX-touchStart;if(Math.abs(delta)>45){showSlide(currentSlide+(delta<0?1:-1));restartHeroTimer();}touchStart=null;}},{passive:true});
  const strip=$('#category-strip');
  strip?.addEventListener('pointerenter',()=>{stripHover=true;});strip?.addEventListener('pointerleave',()=>{stripHover=false;});
  strip?.addEventListener('focusin',()=>{stripFocus=true;});strip?.addEventListener('focusout',event=>{if(!strip.contains(event.relatedTarget))stripFocus=false;});
  let touchUntil=0,lastFrame=0,scrollFraction=0;
  strip?.addEventListener('touchstart',()=>{touchUntil=Infinity;},{passive:true});strip?.addEventListener('touchend',()=>{touchUntil=performance.now()+2500;},{passive:true});
  function animateCategories(now){
    const elapsed=Math.min(now-lastFrame,60);lastFrame=now;
    if(!categoryPaused&&!stripHover&&!stripFocus&&!document.hidden&&!document.querySelector('dialog[open]')&&now>touchUntil){
      scrollFraction+=elapsed*.025;
      if(scrollFraction>=1){strip.scrollLeft+=Math.floor(scrollFraction);scrollFraction%=1;}
      const group=strip.querySelector('.category-group');
      if(group&&strip.scrollLeft>=group.offsetWidth+parseFloat(getComputedStyle($('#category-track')).gap))strip.scrollLeft=0;
    }
    if(strip)requestAnimationFrame(animateCategories);
  }
  document.addEventListener('visibilitychange',()=>{lastFrame=performance.now();restartHeroTimer();});
  reducedMotion.addEventListener('change',event=>{heroPaused=event.matches;categoryPaused=event.matches;updatePauseControls();restartHeroTimer();});
  $$('dialog').forEach(dialog=>{
    dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
    dialog.addEventListener('close',()=>{if(dialog.id==='info-dialog')activeInfo='';if(dialog.id==='category-dialog')languagePicker.open=false;restartHeroTimer();});
  });
  $('#site-search').value=searchQuery;$('#year').textContent=new Date().getFullYear();translatePage();restartHeroTimer();if(strip)requestAnimationFrame(animateCategories);
})();
