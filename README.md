# BADEELDZ — البديل

Boutique algérienne français/arabe, publiée sur [GitHub Pages](https://renolix.github.io/badil.github.io/), avec un [espace de gestion](https://renolix.github.io/badil.github.io/admin/) connecté au projet Firebase **badeldz**.

## Boutique

- 80 produits issus du catalogue fourni, avec leurs prix source en DA, des photos locales et des descriptions longues dans les deux langues.
- Les cinq miels proposent obligatoirement un choix entre 125 g, 250 g, 500 g et 1 kg. Les prix connus correspondent à 500 g ; les autres formats restent à chiffrer dans l’administration.
- Cinq diapositives toutes les quatre secondes, dont une campagne de livraison en français ou en arabe. Le carrousel peut être suspendu et respecte la réduction des animations.
- Recherche, filtres, tri, favoris et panier. Seuls les identifiants d’articles, formats et quantités sont mémorisés localement ; les coordonnées de commande ne le sont pas.
- Chaque produit possède son propre document HTML et son URL. Le panier, la commande, les favoris, le contact, la présentation, la confidentialité et le remerciement sont également des pages distinctes.
- La recherche affiche des catégories associées et des résultats illustrés qui mènent aux pages produit. Les chiffres, montants, téléphones et e-mails restent en caractères latins et de gauche à droite dans les deux langues.
- Le site public ne comporte ni icône de profil ni lien vers l’administration ; celle-ci reste accessible directement sous /admin/.
- Commande avec paiement à la livraison, wilaya, commune et choix domicile/bureau. Le serveur recalcule les prix et enregistre la demande dans Firestore avant d’afficher sa référence.
- Livraison gratuite à **Dellys uniquement** dès 4 000 DA d’articles aux prix connus. Les tarifs non renseignés restent « à confirmer » ; aucune livraison payante n’est présentée comme gratuite.

## Administration

Connexion Firebase Authentication par e-mail et mot de passe, sans vérification d’adresse imposée. Les identifiants initiaux sont transmis au propriétaire séparément et ne figurent pas dans le dépôt.

- **Commandes** : les 500 plus récentes, recherche, statuts, coordonnées, articles, ajustement des prix manquants, frais et notes internes. Une commande incomplètement chiffrée ne peut pas être confirmée.
- **Produits** : noms et descriptions français/arabe, prix par format, disponibilité.
- **Livraison** : 69 wilayas, tarifs domicile/bureau, suspension d’une destination et modification groupée. Les tarifs sont initialement vides en attendant les montants du propriétaire.
- **Utilisateurs** : création et gestion des rôles administrateur, gestionnaire et opérateur ; suspension des accès. Le compte propriétaire est protégé. Les nouveaux profils se connectent immédiatement sans e-mail de vérification.

## Architecture et sécurité

Le site public reste statique. `api-config.js` désigne l’API Cloudflare Worker ; `firebase-config.js` contient uniquement la configuration publique du client Firebase. Toutes les données de gestion et de commande sont dans Firestore **badeldz**. Les règles Firestore refusent tout accès direct depuis le navigateur : l’API vérifie le jeton Firebase et les rôles avant d’utiliser son compte de service dédié.

La clé privée du compte de service est un secret chiffré du Worker nommé `FIREBASE_SERVICE_ACCOUNT`. Elle ne doit jamais être ajoutée au dépôt. Les commandes sont validées côté serveur, limitées par fréquence et protégées contre les doublons par un identifiant de demande. Aucun paiement bancaire ni envoi automatique d’e-mail/WhatsApp n’est intégré.

## Développement et vérifications

Node.js 22.18+ ou une version récente, sans dépendance pour l’interface :

```sh
npm run dev
npm run build
npm run check
npm test
node scripts/catalog-audit.mjs
node scripts/audit-locations.cjs
```

L’audit du catalogue accepte en argument le fichier d’export source ; sa valeur par défaut est `../badil-reference/all-products.json`, hors dépôt. Le serveur local écoute sur le port 4173.

GitHub Pages publie la branche `main`, dossier `/`. Déploiement API avec Wrangler depuis `worker/` ; règles Firebase via `firebase deploy --only firestore --project badeldz` avec le compte autorisé. Préserver les secrets existants du Worker.

## Images et sources

- Structure de référence autorisée : https://greentreesupermarket.com/
- Catalogue, prix et catégories : https://yellow-lapwing-642722.hostingersite.com/
- Grand logo fourni par le propriétaire, isolé sur fond transparent.
- Cinq nouvelles photographies de bocaux de miel sans texte ni étiquette et deux campagnes localisées : consignes conservées dans `assets/image-prompts.md`.
- Les quatre autres photos du carrousel restent des visuels provisoires à remplacer par les photos du propriétaire.
- Les données des 69 wilayas et 1 541 communes et leurs attributions sont documentées dans `locations-sources.md`.

Contact boutique : 0550 94 97 95 / 0776 22 22 94. Crédit de réalisation : [SITEMAGIQUE](https://sitemagique.com).

Après une modification de la structure commune, npm run build régénère les 80 pages produit et les huit autres pages. Les produits ajoutés depuis l’administration disposent immédiatement de leur page `produit.html?id=…`, sans nouveau déploiement GitHub. Le remerciement conserve uniquement la référence, le montant et l’état du dernier reçu dans sessionStorage ; aucune coordonnée client n’y est conservée.

L’administration permet d’ajouter un produit et de modifier sa photo ainsi que ses descriptions courtes et détaillées en français et en arabe. Les descriptions courtes apparaissent entre le titre et le prix. Une première phrase de la description détaillée sert de résumé pour les anciennes fiches sans résumé enregistré.

Les photos sont sélectionnées depuis le PC ou la galerie du téléphone, prévisualisées et optimisées en WebP (1 600 px maximum, 1,5 Mo maximum après optimisation). Les données des produits et les métadonnées restent dans Firestore `badeldz` ; les fichiers publics sont conservés dans la liaison Cloudflare KV `PRODUCT_MEDIA`. Aucun changement du forfait Firebase n’est requis. Les routes de téléversement exigent un compte propriétaire, administrateur ou gestionnaire ; le serveur contrôle le format et la taille des fichiers. Une photo référencée par un produit ne peut pas être supprimée par la route de nettoyage.

La galerie accepte huit photos, avec suppression individuelle et choix de la photo principale. L’administration permet aussi de définir jusqu’à trois formats personnalisés (titre et texte des choix, traduction arabe facultative), avec un prix par combinaison et un prix de référence. Les anciennes variantes de miel restent compatibles. La page produit présente la galerie et exige tous les choix avant l’ajout au panier.

Le stock est une quantité totale partagée entre les formats ; le suivi reste désactivé pour les anciennes fiches tant qu’aucune quantité n’est définie. Les nouvelles fiches affichent le champ de stock dès l’ouverture. Les commandes réservent les quantités dans une écriture Firestore atomique, protégée contre les commandes concurrentes et les doublons. Une annulation restitue la réservation une seule fois ; une réouverture la réserve à nouveau. Le bouton « Déconnexion » est placé au bas de la barre latérale gauche.
