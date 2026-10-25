// Replace these five local files with the final banners. Keep filenames stable.
window.BADIL_STORE = {
  slideInterval: 4000,
  slides: [
    { image: 'assets/hero-delivery-fr.png', imageLocalized: {fr:'assets/hero-delivery-fr.png',ar:'assets/hero-delivery-ar.png'}, campaign:true, fr: ['Livraison gratuite à Dellys', 'Dès 4 000 DA d’achat. Offre valable uniquement dans la commune de Dellys.', 'Livraison gratuite à Dellys dès 4 000 DA d’achat'], ar: ['توصيل مجاني إلى دلس', 'ابتداءً من 4 000 دج من المشتريات. العرض خاص ببلدية دلس فقط.', 'توصيل مجاني إلى دلس ابتداءً من 4 000 دج من المشتريات'], category: 'honey' },
    { image: 'assets/hero-2.jpg', fr: ['Des saveurs riches en authenticité.', 'Explorez notre univers de plantes et d’épices.', 'Épices et plantes aromatiques'], ar: ['نكهات أصيلة من الطبيعة.', 'اكتشف عالم الأعشاب والتوابل.', 'توابل وأعشاب عطرية'], category: 'herbs-spices' },
    { image: 'assets/hero-badeeldz.png', imageOnly:true, width:1280, height:697, fr: ['', '', 'BADEELDZ — البديل'], ar: ['', '', 'BADEELDZ — البديل'] },
    { image: 'assets/hero-4.jpg', fr: ['La douceur à l’état naturel.', 'Découvrez l’univers du miel.', 'Miel naturel'], ar: ['حلاوة من قلب الطبيعة.', 'اكتشف عالم العسل.', 'عسل طبيعي'], category: 'honey' },
    { image: 'assets/hero-5.jpg', fr: ['Naturellement, au quotidien.', 'Plantes et senteurs pour votre bien-être.', 'Lavande et nature'], ar: ['الطبيعة في كل يوم.', 'نباتات وروائح لعنايتك اليومية.', 'خزامى وطبيعة'], category: 'natural-oils' }
  ],
  categories: [
    { id:'herbs-spices', fr:'Herbes & épices', ar:'أعشاب وتوابل' },
    { id:'bakhoor-musk', fr:'Encens & musc', ar:'بخور ومسك' },
    { id:'vinegar', fr:'Vinaigres', ar:'خل' },
    { id:'dohn', fr:'Onguents', ar:'دهن' },
    { id:'black-seed-oil', fr:'Huile de nigelle', ar:'زيت الحبة السوداء' },
    { id:'hair-oils', fr:'Huiles capillaires', ar:'زيوت الشعر' },
    { id:'natural-oils', fr:'Huiles naturelles', ar:'زيوت طبيعية' },
    { id:'natural-shampoo', fr:'Shampoings naturels', ar:'شامبو طبيعي' },
    { id:'tea-tisanes', fr:'Thés & tisanes', ar:'شاي وتيزانات' },
    { id:'natural-soap', fr:'Savons naturels', ar:'صابون طبيعي' },
    { id:'honey', fr:'Miels', ar:'عسل' },
    { id:'cupping-cups', fr:'Ventouses de hijama', ar:'كؤوس حجامة' },
    { id:'kohl-henna', fr:'Khôl & henné', ar:'كحل وحناء' },
    { id:'creams', fr:'Crèmes', ar:'كريمات' },
    { id:'slimming-supplements', fr:'Compléments alimentaires', ar:'منحفات ومكملات غذائية' }
  ],
  // Loaded from catalog.json, then refreshed from the authoritative Firebase API.
  products: []
};
