/* Les notes de Mi Space vivent dans la base locale du navigateur, et
   nulle part ailleurs : aucune fonction de ce fichier ne compose de
   requête réseau, et aucune porte du service n'accepte une note. Ce que
   l'écran promet — ce qui est posé ici reste sur l'appareil — tient par
   cette absence, et par rien d'autre. */
(function () {
  'use strict';

  var BASE = 'roots-space';
  var MAGASIN = 'notes';
  var VERSION = 1;

  /* Le stockage peut refuser — navigation privée, quota, moteur ancien.
     Chaque geste rend alors une promesse rejetée avec un message que
     l'écran affiche ; rien ne casse en silence. */
  function ouvrir() {
    return new Promise(function (rendre, refuser) {
      if (!window.indexedDB) { refuser(new Error('stockage indisponible')); return; }
      var d = indexedDB.open(BASE, VERSION);
      d.onupgradeneeded = function () {
        var db = d.result;
        if (!db.objectStoreNames.contains(MAGASIN)) {
          db.createObjectStore(MAGASIN, { keyPath: 'id' });
        }
      };
      d.onsuccess = function () { rendre(d.result); };
      d.onerror = function () { refuser(d.error || new Error('stockage refusé')); };
    });
  }

  function transaction(mode, geste) {
    return ouvrir().then(function (db) {
      return new Promise(function (rendre, refuser) {
        var tx = db.transaction(MAGASIN, mode);
        var sortie = geste(tx.objectStore(MAGASIN));
        tx.oncomplete = function () { db.close(); rendre(sortie && 'result' in sortie ? sortie.result : undefined); };
        tx.onerror = function () { db.close(); refuser(tx.error || new Error('stockage refusé')); };
        tx.onabort = function () { db.close(); refuser(tx.error || new Error('stockage refusé')); };
      });
    });
  }

  function identifiant() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'n-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  /* La forme d'une note se lit dans le texte posé, sans réglage : des
     lignes en tirets font une liste à cocher, une adresse seule fait un
     lien, le reste est une note. */
  function analyser(brut) {
    var texte = String(brut || '').replace(/\r/g, '').trim();
    var items = [];
    var reste = [];
    texte.split('\n').forEach(function (l) {
      var m = l.match(/^\s*[-*]\s+(.+)$/);
      if (m) items.push({ t: m[1].trim(), fait: false });
      else if (l.trim()) reste.push(l.trim());
    });
    if (items.length) return { type: 'liste', texte: reste.join(' '), items: items, url: '' };
    if (/^https?:\/\/\S+$/i.test(texte)) return { type: 'lien', texte: '', items: [], url: texte };
    return { type: 'texte', texte: texte, items: [], url: '' };
  }

  /* L'ancrage demande au navigateur de tenir la base hors des purges
     automatiques. Le refus est accepté sans bruit : la base reste
     utilisable, seulement moins garantie. */
  function ancrer() {
    try {
      if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().catch(function () {});
      }
    } catch (e) {}
  }

  window.SpaceNotes = {
    toutes: function () {
      return transaction('readonly', function (m) { return m.getAll(); })
        .then(function (liste) {
          liste = liste || [];
          liste.sort(function (a, b) { return b.cree - a.cree; });
          return liste;
        });
    },

    poser: function (brut) {
      var forme = analyser(brut);
      if (!forme.texte && !forme.items.length && !forme.url) {
        return Promise.reject(new Error('note vide'));
      }
      var note = {
        id: identifiant(),
        type: forme.type,
        texte: forme.texte,
        items: forme.items,
        url: forme.url,
        cree: Date.now(),
        epingle: false,
        promue: null
      };
      ancrer();
      return transaction('readwrite', function (m) { m.put(note); })
        .then(function () { return note; });
    },

    cocher: function (id, indice, fait) {
      return transaction('readwrite', function (m) {
        m.get(id).onsuccess = function (e) {
          var n = e.target.result;
          if (n && n.items && n.items[indice]) {
            n.items[indice].fait = !!fait;
            m.put(n);
          }
        };
      });
    },

    epingler: function (id, tenue) {
      return transaction('readwrite', function (m) {
        m.get(id).onsuccess = function (e) {
          var n = e.target.result;
          if (n) { n.epingle = !!tenue; m.put(n); }
        };
      });
    },

    marquerPromue: function (id) {
      return transaction('readwrite', function (m) {
        m.get(id).onsuccess = function (e) {
          var n = e.target.result;
          if (n) { n.promue = { quand: Date.now() }; m.put(n); }
        };
      });
    },

    retirer: function (id) {
      return transaction('readwrite', function (m) { m.delete(id); });
    }
  };
})();
