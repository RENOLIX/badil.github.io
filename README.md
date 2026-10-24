# BADEELDZ — البديل

Boutique statique en arabe et en français, conçue pour GitHub Pages.

- Le catalogue est volontairement vide : `products: []` dans `store.js`.
- Cinq photos dans le hero, une transition toutes les **4 secondes**.
- Le défilement peut être arrêté ; il se suspend au survol et au clavier et respecte la préférence de réduction des animations.
- Quinze catégories avec ruban photo défilant, navigation et filtre du catalogue vide.
- Interface RTL/LTR, recherche, panier et favoris avec états vides.
- Aucun paiement, commande, faux stock, faux avis ou compte client actif.

## Modifier les cinq photos

Remplacer `assets/hero-1.jpg` à `assets/hero-5.jpg`. Les textes et liens sont dans `store.js`. Les photos actuelles sont provisoires. Format conseillé : paysage, au moins 1600 × 1000 px. Les visuels sont recadrés avec `object-fit: cover`.

## Développement

Node.js 22+ suffit, sans dépendances :

```sh
npm run dev
npm run check
```

Publication GitHub Pages : branche `main`, dossier `/`.

## Sources visuelles

- Structure de référence autorisée par le propriétaire : https://greentreesupermarket.com/
- Catégories et leurs illustrations : https://yellow-lapwing-642722.hostingersite.com/
- Grand logo fourni par le client, isolé sur fond transparent avec l’outil ImageGen intégré. Consigne : ne conserver que le grand emblème, enlever le fond et les deux petites copies, préserver le dessin et les inscriptions BADEELDZ / البديل.
- Photos provisoires Unsplash : `1474979266404-7eaacbcd87c5`, `1596040033229-a9821ebd058d`, `1544787219-7f47ccb76574`, `1587049352851-8d4e89133924`, `1499002238440-d264edd596ec`.

Les coordonnées, modalités de livraison et produits pourront être ajoutés lorsqu’ils seront fournis.
