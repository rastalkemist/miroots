/* Rappel du chrome sur les ecrans d'ouverture.

   Le chrome est pose dans le balisage et masque par la feuille : il n'apparait
   jamais avant d'etre appele, et rien ne clignote a l'arrivee. Ce fichier ne
   fait que l'appeler, le retirer, et deplacer la bascule de langue entre la
   barre depouillee et le chrome — un seul bouton, deux emplacements.

   Ce qu'il capte, et seulement quand le chrome est absent : l'appui sur le nom
   de la surface, le glissement vers le bas, les glissements lateraux, la touche
   d'echappement. Le chrome present, chaque geste reprend son sens ordinaire.

   Ce qu'il ne capte pas : le glissement du bas vers le haut, qui appartient au
   systeme.

   Le geste de retour n'est pas interceptable directement : une entree
   d'historique est empilee, et le retour est rattrape puis annule tant que le
   chrome est absent. Le bouton precedent du navigateur s'en trouve affecte le
   temps d'un geste. */
(function () {
  'use strict';

  var SEUIL = 40;      /* deplacement minimal d'un glissement, en pixels */
  var TENUE = 3000;    /* duree de presence du chrome avant retrait, en ms */

  window.Onboard = {
    chrome: function (opts) {
      var corps = document.body;
      var bascule = opts && opts.bascule ? document.getElementById(opts.bascule) : null;
      var barre = bascule ? bascule.parentNode : null;
      var accueil = document.querySelector('.chrome-droite');
      var minuterie = null;

      function present() { return corps.classList.contains('nav-appele'); }

      function appeler() {
        if (bascule && accueil && bascule.parentNode !== accueil) accueil.insertBefore(bascule, accueil.firstChild);
        corps.classList.add('nav-appele');
        clearTimeout(minuterie);
        minuterie = setTimeout(retirer, TENUE);
      }

      function retirer() {
        clearTimeout(minuterie);
        corps.classList.remove('nav-appele');
        if (bascule && barre && bascule.parentNode !== barre) barre.appendChild(bascule);
      }

      var nom = document.querySelector('.ouv-marque');
      if (nom) {
        nom.setAttribute('role', 'button');
        nom.setAttribute('tabindex', '0');
        nom.addEventListener('click', function () { if (!present()) appeler(); });
        nom.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!present()) appeler(); }
        });
      }

      var y0 = 0, x0 = 0;
      document.addEventListener('touchstart', function (e) {
        y0 = e.touches[0].clientY; x0 = e.touches[0].clientX;
      }, { passive: true });

      document.addEventListener('touchend', function (e) {
        if (present()) return;
        var t = e.changedTouches[0];
        var dy = t.clientY - y0, dx = t.clientX - x0;
        var bas = dy > SEUIL && dy > Math.abs(dx);
        var cote = Math.abs(dx) > SEUIL && Math.abs(dx) > Math.abs(dy);
        if (bas || cote) appeler();
      }, { passive: true });

      /* La touche d'echappement et la barre d'espace rappellent le chrome. La
         barre d'espace n'est pas prise quand une saisie a le foyer : elle y
         ecrit. Ces ecrans ne defilent pas — ils conduisent un parcours — donc
         la reprendre ne prive de rien. */
      document.addEventListener('keydown', function (e) {
        if (present()) return;
        var saisie = /^(input|textarea|select|button)$/i.test((document.activeElement || {}).tagName || '');
        if (e.key === 'Escape') { appeler(); return; }
        if (e.key === ' ' && !saisie) { e.preventDefault(); appeler(); }
      });

      try { history.pushState({ ouv: 1 }, ''); } catch (err) {}
      window.addEventListener('popstate', function () {
        if (present()) return;
        try { history.pushState({ ouv: 1 }, ''); } catch (err) {}
        appeler();
      });

      return { appeler: appeler, retirer: retirer, present: present };
    }
  };
})();
