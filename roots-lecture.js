/* Reglage de taille de la lecture longue — SC 1.4.8 (mecanisme disponible).
   Cinq crans, un point typographique par cran. Le facteur multiplie TOUT le
   registre editorial : les rapports entre niveaux sont la raison d'etre de
   l'echelle, et un reglage qui ne toucherait que le corps les detruirait.
   Exige un conteneur `.lecture-longue` et une commande `.regle-taille`. */
(function () {
  'use strict';
  var CRANS = [1, 1.1026, 1.2051, 1.3077, 1.4103];   // (13 + n x 1.3333) / 13
  var CORPS = ['9,75', '10,75', '11,75', '12,75', '13,75'];  // en points
  var CLE = 'roots.lecture.cran';

  function poser(zone, n) {
    n = Math.max(0, Math.min(CRANS.length - 1, n));
    zone.style.setProperty('--zoom-lecture', CRANS[n]);
    zone.dataset.cran = n;
    try { localStorage.setItem(CLE, n); } catch (e) {}
    return n;
  }

  function commande(zone) {
    var barre = zone.querySelector('.regle-taille');
    if (!barre) return;
    var moins = barre.querySelector('[data-taille="moins"]');
    var plus = barre.querySelector('[data-taille="plus"]');
    var etat = barre.querySelector('.etat');
    var n = 0;
    try { n = parseInt(localStorage.getItem(CLE), 10) || 0; } catch (e) {}
    n = poser(zone, n);

    function rendre() {
      if (moins) moins.disabled = n === 0;
      if (plus) plus.disabled = n === CRANS.length - 1;
      if (etat) etat.textContent = CORPS[n] + ' pt';
    }
    function pas(d) {
      var avant = n;
      n = poser(zone, n + d);
      rendre();
      if (n !== avant && etat) {
        // L'annonce passe par aria-live : le changement doit s'entendre.
        etat.setAttribute('aria-label', 'Taille du texte : ' + CORPS[n] + ' points');
      }
    }
    if (moins) moins.addEventListener('click', function () { pas(-1); });
    if (plus) plus.addEventListener('click', function () { pas(1); });
    rendre();
  }

  function demarrer() {
    var zones = document.querySelectorAll('.lecture-longue');
    for (var i = 0; i < zones.length; i++) commande(zones[i]);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrer);
  } else { demarrer(); }
})();
