# Coach 10K + Force v2.1 — correctif écran figé

Correctif principal :
- JavaScript et CSS intégrés directement dans `index.html` pour éviter les incohérences de cache GitHub Pages / PWA.
- migration défensive des anciennes données locales ;
- écran de réparation visible si une donnée locale provoque encore une erreur ;
- service worker v2.1 en mode réseau d'abord pour faciliter les mises à jour.

## Mise à jour
Remplace tous les fichiers du dépôt par ceux de ce ZIP puis commit/push.

Le fichier important est `index.html` : même si un ancien `app.js` reste en cache sur le téléphone,
la v2.1 peut démarrer car son code est intégré dans la page.

## Données
Le correctif tente de conserver l'historique et les réglages de la v2.
