// Stable identifiers keep existing product/category links intact.
export const DEFAULT_CATEGORIES=[
  ['herbs-spices','Herbes & épices','أعشاب وتوابل'],
  ['bakhoor-musk','Encens & musc','بخور ومسك'],
  ['vinegar','Vinaigres','خل'],
  ['dohn','Onguents','دهن'],
  ['black-seed-oil','Huile de nigelle','زيت الحبة السوداء'],
  ['hair-oils','Huiles capillaires','زيوت الشعر'],
  ['natural-oils','Huiles naturelles','زيوت طبيعية'],
  ['natural-shampoo','Shampoings naturels','شامبو طبيعي'],
  ['tea-tisanes','Thés & tisanes','شاي وتيزانات'],
  ['natural-soap','Savons naturels','صابون طبيعي'],
  ['honey','Miels','عسل'],
  ['cupping-cups','Ventouses de hijama','كؤوس حجامة'],
  ['kohl-henna','Khôl & henné','كحل وحناء'],
  ['creams','Crèmes','كريمات'],
  ['slimming-supplements','Compléments alimentaires','منحفات ومكملات غذائية']
].map(([id,fr,ar],index)=>({id,fr,ar,image:`assets/categories/category-${index+1}.jpg`,order:index}));

export function mergeCategories(saved=[]){
  const categories=new Map(DEFAULT_CATEGORIES.map(c=>[c.id,{...c}]));
  for(const category of saved)if(category?.id)categories.set(category.id,{...categories.get(category.id),...category});
  return [...categories.values()].sort((a,b)=>(a.order??1000)-(b.order??1000)||a.id.localeCompare(b.id));
}
