# BADEELDZ — البديل

Boutique algérienne français/arabe, publiée sur [GitHub Pages](https://renolix.github.io/badil.github.io/), avec un [espace de gestion](https://renolix.github.io/badil.github.io/admin/) connecté au projet Firebase **badeldz**.

## Boutique

- 80 produits issus du catalogue fourni, avec leurs prix source en DA, des photos locales et des descriptions longues dans les deux langues.
- Les cinq miels proposent obligatoirement un choix entre 125 g, 250 g, 500 g et 1 kg. Les prix connus correspondent à 500 g ; les autres formats restent à chiffrer dans l’administration.
- Cinq diapositives toutes les quatre secondes, dont une campagne de livraison en français ou en arabe. Le carrousel peut être suspendu et respecte la réduction des animations.
- Recherche, filtres, tri, favoris et panier. Seuls les identifiants d’articles, formats et quantités sont mémorisés localement ; les coordonnées de commande ne le sont pas.
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
