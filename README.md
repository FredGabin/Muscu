# Muscu V3

## Changements V3
- L'installation ouvre directement `?v=3`.
- Le service worker utilise le réseau en priorité pour éviter de rester bloqué sur une ancienne version.
- La séance A du 21/08/2026 est préchargée une seule fois si l'historique est vide.
- Chaque exercice affiche **DERNIÈRE FOIS** avec poids et répétitions.
- Les champs de la nouvelle séance sont préremplis à partir de la dernière séance.
- Planning compatible avec une future **Séance C**.
- Séance C provisoire : jambes / mollets / avant-bras.
- Les stats utilisent l'historique local existant.

## Mise à jour GitHub
Remplacer :
- `index.html`
- `manifest.json`
- `service-worker.js`

Les icônes peuvent aussi être remplacées mais ce n'est pas obligatoire.

## Après la mise à jour
Pour une installation propre, ouvrir :
`https://fredgabin.github.io/Muscu/?v=3`
puis installer l'application depuis cette page.
