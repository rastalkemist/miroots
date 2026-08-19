/* Reglage de taille de la lecture longue — SC 1.4.8 (mecanisme disponible).
   Quatre crans, un point typographique par cran. Le facteur ne porte que sur le
   corps et sur les niveaux qui partagent sa taille ; les titres au-dessus ne
   bougent pas. La serie s'arrete a 15 pt parce que le barreau editorial suivant
   vaut cette taille : au dernier cran le corps touche le niveau au-dessus sans
   le depasser. Ajouter un cran inverserait la hierarchie.
   Exige un conteneur `.lecture-longue` et une commande `.regle-taille`. */
(function () {
  'use strict';
  var CRANS = [1, 1.0833, 1.1667, 1.25];   // (12 + n) / 12, en points
  var CORPS = ['12', '13', '14', '15'];  // en points
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
    /* La commande n'est pas servie sur tous les jeux d'ecran. La ou elle ne
       l'est pas, un cran retenu d'une autre visite s'appliquerait sans que
       personne puisse le defaire : le facteur revient a 1 et rien ne s'accroche.
       `offsetParent` ne sert pas ici : il est nul pour tout element fixe. */
    if (getComputedStyle(barre).display === 'none') {
      zone.style.setProperty('--zoom-lecture', 1);
      return;
    }

    /* La commande est fixe : elle partage le bord haut du h1 a l'ouverture,
       s'efface quand on descend, reparait des qu'on remonte. Le h1 se cherche
       parmi les VISIBLES : la page porte un bloc de texte par langue, et le
       h1 d'un bloc masque mesure zero. */
    function titreVisible() {
      var ts = zone.querySelectorAll('h1');
      for (var i = 0; i < ts.length; i++) {
        if (ts[i].getClientRects().length) return ts[i];
      }
      return null;
    }
    function caler() {
      var titre = titreVisible();
      if (!titre) return;
      var haut = titre.getBoundingClientRect().top + window.scrollY;
      barre.style.top = haut + 'px';
    }
    caler();
    window.addEventListener('resize', caler);
    window.addEventListener('load', caler);

    var dernierY = window.scrollY, enAttente = false;
    window.addEventListener('scroll', function () {
      if (enAttente) return;
      enAttente = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y > dernierY + 4) barre.classList.add('efface');
        else if (y < dernierY - 4) barre.classList.remove('efface');
        dernierY = y;
        enAttente = false;
      });
    }, { passive: true });

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
        /* L'annonce passe par aria-live : le changement doit s'entendre.
           Son intitule se LIT sur le groupe, qui porte deja le sien dans la
           langue de l'ecran. Ecrit ici, il resterait dans une seule langue
           pendant que le reste de la barre bascule. */
        var groupe = barre.getAttribute('aria-label');
        etat.setAttribute('aria-label', (groupe ? groupe + ' : ' : '') + CORPS[n] + ' pt');
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
