/* Rappel du chrome sur les ecrans d'ouverture.

   Le chrome commun est pose dans le balisage et masque par la feuille : il
   n'apparait pas avant d'etre appele, et rien ne se peint puis se retire a
   l'arrivee. Ce fichier l'appelle et le retire. Il ne cree ni ne supprime aucun
   element du chrome ; il deplace une seule piece qui ne lui appartient pas :
   la bascule de langue de l'ecran, qui vit sur la page tant que le chrome est
   absent et entre dans le groupe droit de la barre quand il est present —
   sinon elle recouvrirait le menu qui revient. Un seul bouton, deux
   emplacements ; le groupe droit de la barre le rend en partant.

   Ce qu'il capte, et seulement tant que le chrome est absent : l'activation du
   nom de la surface, le glissement vers le bas, les glissements lateraux, les
   touches d'echappement et d'espace. Le nom de la surface est un lien : son
   parcours est suspendu tant que le chrome est absent, et lui revient des
   qu'il est present. Chaque autre geste reprend alors son sens ordinaire.

   Ce qu'il ne capte pas : le glissement du bas vers le haut, qui appartient au
   systeme.

   Le geste de retour n'est pas interceptable directement : une entree
   d'historique est empilee, et le retour est rattrape puis annule tant que le
   chrome est absent. Le bouton precedent du navigateur s'en trouve affecte le
   temps d'un geste.

   Exige que la page porte la classe qui masque le chrome et que le chrome
   commun soit present dans le document. */
(function () {
  'use strict';

  var SEUIL = 40;      /* deplacement minimal d'un glissement, en pixels */
  var TENUE = 3000;    /* duree de presence du chrome avant retrait, en ms */

  window.Onboard = {
    chrome: function (opts) {
      var corps = document.body;
      var bascule = opts && opts.bascule ? document.getElementById(opts.bascule) : null;
      var pose = bascule ? bascule.parentNode : null;
      var groupe = document.querySelector('.chrome-droite');
      var minuterie = null;

      function present() { return corps.classList.contains('nav-appele'); }

      function appeler() {
        if (bascule && groupe && bascule.parentNode !== groupe) groupe.insertBefore(bascule, groupe.firstChild);
        corps.classList.add('nav-appele');
        clearTimeout(minuterie);
        minuterie = setTimeout(retirer, TENUE);
      }

      function retirer() {
        clearTimeout(minuterie);
        corps.classList.remove('nav-appele');
        if (bascule && pose && bascule.parentNode !== pose) pose.appendChild(bascule);
      }

      /* Le nom de la surface. L'activation au clavier d'un lien emet le meme
         evenement que l'activation au pointeur : un seul ecouteur couvre les
         deux, et le lien garde sa nature — ni role ni ordre de tabulation ne
         sont poses par-dessus. */
      var nom = document.querySelector('.chrome-titre');
      if (nom) {
        nom.addEventListener('click', function (e) {
          if (present()) return;
          e.preventDefault();
          appeler();
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
         barre d'espace n'est pas prise quand une commande ou une saisie a le
         foyer : elle y ecrit ou y declenche. Ces ecrans ne defilent pas — ils
         conduisent un parcours — donc la reprendre ne prive de rien. */
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
