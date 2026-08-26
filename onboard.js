/* L'ouverture de la scene.

   La classe se pose sur la RACINE, depuis l'en-tete du document, donc avant la
   premiere image : l'ecran ne se peint jamais dans un etat pour sauter dans
   l'autre. L'ecran qui veut l'ouverture le declare par un attribut sur sa
   racine ; les autres ne la portent pas et ce fichier les laisse intacts.

   La duree, la tenue et la courbe vivent dans la feuille : ici, aucune valeur
   de temps. Ce qui est decide ici est SI la scene s'ouvre, jamais COMMENT.

   Elle ne se rejoue pas dans une meme execution de l'application. Le temoin est
   un temoin de session : vide au lancement de l'application ou a l'ouverture
   d'un onglet, conserve d'un ecran a l'autre et a travers un rechargement,
   efface a la fermeture. Une reauthentification qui interrompt quelqu'un en
   cours d'usage ne lui repasse donc pas une ouverture.

   Elle attend sa fonte avant de partir : une phrase de marque rendue dans une
   fonte de substitution, puis remplacee en pleine course, montre deux fois
   autre chose que ce qu'on voulait montrer. L'attente ne porte QUE sur les
   graisses que l'ouverture emploie, jamais sur toutes celles du document, et
   elle est BORNEE — passe la borne, la scene s'ouvre avec ce qu'elle a.

   Elle ne retient rien. Le premier geste et le premier foyer y mettent fin
   sur-le-champ, et la scene passe a son etat final. Un reglage systeme de
   mouvement reduit l'annule avant qu'elle commence.

   Exige que la feuille de l'ecran porte l'etat de depart sous cette classe,
   et l'etat d'attente sous la classe d'attente. */
(function () {
  var TEMOIN = 'roots.ouverture';
  var racine = document.documentElement;

  if (!racine.hasAttribute('data-ouverture')) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try { if (sessionStorage.getItem(TEMOIN) === '1') return; } catch (e) {}
  try { sessionStorage.setItem(TEMOIN, '1'); } catch (e) {}

  racine.classList.add('ouv-lever');
  racine.classList.add('ouv-attente');

  /* Borne de l'attente de fonte, en ms. Elle appartient a la politique de
     chargement, pas a la composition : au-dela, ce qui est joue l'est avec la
     fonte disponible. */
  var BORNE_FONTE = 2000;
  /* Les graisses que l'ouverture emploie, dans la fonte d'eclat. */
  var GRAISSES = ['300 1em MuseoModerno', '700 1em MuseoModerno'];

  function partir() { racine.classList.remove('ouv-attente'); }

  if (document.fonts && document.fonts.load) {
    var borne = new Promise(function (r) { setTimeout(r, BORNE_FONTE); });
    var faces = Promise.all(GRAISSES.map(function (g) { return document.fonts.load(g); }));
    Promise.race([faces, borne]).then(partir, partir);
  } else {
    partir();
  }

  function finir() {
    racine.classList.remove('ouv-lever');
    racine.classList.remove('ouv-attente');
    document.removeEventListener('pointerdown', finir, true);
    document.removeEventListener('focusin', finir, true);
    document.removeEventListener('animationend', surFin, true);
  }
  /* Seule la fin du mouvement de l'appel retire la classe : les deux
     animations partagent la meme duree, mais une seule doit conclure. */
  function surFin(e) { if (e.animationName === 'ouv-monte') finir(); }

  document.addEventListener('pointerdown', finir, true);
  document.addEventListener('focusin', finir, true);
  document.addEventListener('animationend', surFin, true);
})();

/* Rappel du chrome sur les ecrans d'ouverture.

   Le chrome commun est pose dans le balisage et masque par la feuille : il
   n'apparait pas avant d'etre appele, et rien ne se peint puis se retire a
   l'arrivee. Ce fichier l'appelle et le retire, et RIEN D'AUTRE : il ne cree,
   ne deplace ni ne supprime aucun element, du chrome ou de l'ecran. Le chrome
   rappele est celui que le tronc produit, tel qu'il le produit.

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
    chrome: function () {
      var corps = document.body;
      var minuterie = null;

      function present() { return corps.classList.contains('nav-appele'); }

      function appeler() {
        corps.classList.add('nav-appele');
        clearTimeout(minuterie);
        minuterie = setTimeout(retirer, TENUE);
      }

      function retirer() {
        clearTimeout(minuterie);
        corps.classList.remove('nav-appele');
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
