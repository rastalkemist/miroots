/* Mi Roots — la coque hors ligne.
 *
 * CE FICHIER SURVIT A LA PAGE QUI L'A POSE. Une fois installe chez un
 * testeur, il continue de repondre apres la fermeture de l'onglet et se
 * reinstalle au retour. Une coque fautive ne se corrige pas en redeployant :
 * il faut que l'ancienne cede la place. Toute la composition en decoule.
 *
 * Le code applicatif change a chaque deploiement. Le servir depuis le cache
 * ferait remonter des defauts portant sur du code qui n'existe plus. La
 * recette courante est donc INVERSEE :
 *
 *   HTML, CSS, JS ........ le RESEAU d'abord, le cache seulement s'il echoue
 *   polices, vignettes ... le CACHE d'abord : ces fichiers ne changent pas
 *
 * Ce qui n'entre JAMAIS en cache, et ce sont des barrieres, pas des
 * intentions : le hors-origine (le socle, le prestataire de paiement), les
 * requetes autres que GET, et payer.html.
 *
 * A CHAQUE DEPLOIEMENT QUI TOUCHE LA COQUE, changer VERSION. C'est ce
 * changement, et lui seul, qui purge les anciens caches.
 */
'use strict';

var VERSION   = '707920eba840f105';
var COQUE     = 'roots-coque-'    + VERSION;
var IMMUABLE  = 'roots-immuable-' + VERSION;
var A_GARDER  = [COQUE, IMMUABLE];

var REPLI = 'hors-ligne.html';

/* La coque : ce qui ne dit rien de personne. Aucune reponse du socle n'y
   figure, et aucune ne peut y entrer — voir le filtre du gestionnaire fetch. */
var COQUE_FICHIERS = [
  'index.html', 'carte.html', 'retrouver.html', 'roam.html', 'plan.html',
  'facture.html', 'paiement.html', 'confidentialite.html', REPLI,
  'roots-fonts.css', 'roots-tokens.css', 'roots.css', 'plan.css',
  'roots-db.js', 'roots.js', 'garde.js',
  'manifest.webmanifest', 'media/hero.jpg', 'media/hero-portrait.jpg'
];

/* payer.html ne charge aucun script de l'application, ne detient ni jeton ni
   cle de base, et ne reference pas le manifeste. La portee d'un service worker
   pose a la racine l'avalerait : l'exclusion est donc ecrite ici, en toutes
   lettres, et c'est une barriere mecanique. */
var ECARTE = /\/payer\.html$/;

/* La video se sert par plages : la reponse est un 206, le fichier pese
   plusieurs megaoctets, et le relayer depuis un worker casse la lecture
   progressive sur certains navigateurs. Elle passe donc en direct, sans
   interception et sans jamais entrer en cache. Retirer cette ligne remet
   un fichier lourd dans la coque et rend la lecture dependante du worker. */
var MEDIA_CONTINU = /\/media\/[^\/]+\.(mp4|webm|ogv|m4v)$/;

/* Ce qui ne change pas : on peut le servir depuis le cache sans risque de
   servir du code perime. Les polices coutent cher sur un reseau lent. */
var EST_IMMUABLE = /\/(fonts|icones|vendor|media)\//;

function estBonneReponse(r) {
  return r && r.status === 200 && r.type === 'basic';
}

/* --------------------------------------------------------------- install */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(COQUE).then(function (cache) {
      /* Un addAll echoue en entier des qu'un seul fichier manque. On pose
         donc piece par piece : une police absente ne doit pas empecher
         l'application de s'ouvrir hors ligne. */
      return Promise.all(COQUE_FICHIERS.map(function (f) {
        return cache.add(new Request(f, { cache: 'reload' }))['catch'](function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

/* -------------------------------------------------------------- activate */
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (cles) {
      return Promise.all(cles.map(function (c) {
        return A_GARDER.indexOf(c) === -1 ? caches['delete'](c) : null;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* ----------------------------------------------------------------- fetch */
self.addEventListener('fetch', function (e) {
  var req = e.request;

  if (req.method !== 'GET') return;                       /* jamais touche */

  var url;
  try { url = new URL(req.url); } catch (err) { return; }

  if (url.origin !== self.location.origin) return;        /* hors-origine  */
  if (ECARTE.test(url.pathname)) return;                  /* payer.html    */
  if (MEDIA_CONTINU.test(url.pathname)) return;            /* lecture par plages */

  if (EST_IMMUABLE.test(url.pathname)) { e.respondWith(cacheDabord(req)); return; }

  e.respondWith(reseauDabord(req, url));
});

function cacheDabord(req) {
  return caches.match(req).then(function (garde) {
    if (garde) return garde;
    return fetch(req).then(function (r) {
      if (estBonneReponse(r)) {
        var copie = r.clone();
        caches.open(IMMUABLE).then(function (c) { c.put(req, copie); });
      }
      return r;
    });
  });
}

function reseauDabord(req, url) {
  return fetch(req).then(function (r) {
    if (estBonneReponse(r)) {
      var copie = r.clone();
      caches.open(COQUE).then(function (c) { c.put(req, copie); });
    }
    return r;
  })['catch'](function () {
    return caches.match(req).then(function (garde) {
      if (garde) return garde;
      /* Rien en cache et pas de reseau. Si l'on demandait un ECRAN, on rend
         la page de repli ; sinon on laisse l'echec etre un echec, parce
         qu'un faux succes est pire qu'une panne visible. */
      if (req.mode === 'navigate') return caches.match(REPLI);
      return Response.error();
    });
  });
}

/* ------------------------------------------------------ ordre de retrait
   Une coque deja installee chez un client ne disparait PAS quand ce fichier
   disparait du serveur : elle continue de repondre jusqu'a ce qu'on lui
   ordonne de partir. Cet ordre est donc la seule sortie, et il doit exister
   des la pose. Il se donne depuis une page :
     navigator.serviceWorker.controller.postMessage('roots:retirer')        */
self.addEventListener('message', function (e) {
  if (!e.data || e.data !== 'roots:retirer') return;
  e.waitUntil(
    self.registration.unregister()
      .then(function () { return caches.keys(); })
      .then(function (cles) {
        return Promise.all(cles.map(function (c) { return caches['delete'](c); }));
      })
      .then(function () { return self.clients.matchAll({ type: 'window' }); })
      .then(function (fenetres) {
        fenetres.forEach(function (f) { f.navigate(f.url); });
      })
  );
});
