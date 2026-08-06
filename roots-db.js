/* Roots — accès aux données. Porte d'entrée unique du front.
   Aucun écran n'appelle le réseau directement : tout passe par ici. */

window.Roots = window.Roots || {};

(function () {
  'use strict';

  var BASE = 'https://xrqorebcgnixcbqqeoll.supabase.co';
  var CLE  = 'sb_publishable_q7JPy-S8pcXJhxeRAFZb3g_fW221MwC';

  /* Prestataire d'encaissement : la cle PUBLIABLE et le mode. Les deux vont
     ensemble et se changent ensemble — c'est la seule paire du front qui
     bascule entre essai et production, et elle n'existe qu'ici. La cle privee
     et le secret de notification ne sont jamais detenus par un navigateur. */
  var PAIEMENT = {
    cle: '512f9ec0f44911efb5aadb3c9a192eba',
    essai: true
  };

  var entetes = {
    'apikey': CLE,
    'Content-Type': 'application/json'
  };

  /* ---------- Messages ----------
     Clé = message rendu par la base. Valeur = ce que lit un humain.
     Un message absent de cette table est journalisé puis remplacé par le repli :
     sans ce relevé, on ne saurait jamais que la table est incomplète. */

  var MESSAGES = {
    'consentement requis':
      { fr: "Coche l'accord pour continuer.", en: 'Please accept to continue.' },
    'commande introuvable ou jeton invalide':
      { fr: 'On ne retrouve pas cette commande sur cet appareil.', en: "We can't find this order on this device." },
    'la commande est deja en preparation':
      { fr: 'La cuisine a commencé — passe au comptoir pour modifier.', en: 'The kitchen has started — see the counter to change it.' },
    'quantite hors bornes':
      { fr: 'Choisis entre 1 et 50.', en: 'Pick between 1 and 50.' },
    'article indisponible':
      { fr: "Ce plat n'est plus disponible aujourd'hui.", en: 'This dish is unavailable today.' },
    'article inconnu':
      { fr: 'Ce plat ne figure plus à la carte.', en: 'This dish is no longer on the menu.' },
    'espace inconnu':
      { fr: 'Cet espace n’est pas disponible.', en: 'This space is not available.' },
    'logement inconnu':
      { fr: 'Ce logement n’est pas disponible.', en: 'This room is not available.' },
    'logement indisponible':
      { fr: 'Ce logement n’est pas disponible.', en: 'This room is not available.' },
    'date passee':
      { fr: 'Choisis une date à venir.', en: 'Pick a future date.' },
    'horizon de reservation depasse (30 jours)':
      { fr: 'Les réservations s’ouvrent jusqu’à 30 jours à l’avance.', en: 'Bookings open up to 30 days ahead.' },
    'horizon de reservation depasse (365 jours)':
      { fr: 'Les séjours s’ouvrent jusqu’à un an à l’avance.', en: 'Stays open up to a year ahead.' },
    'duree maximale de sejour depassee (30 nuits)':
      { fr: 'Un séjour va jusqu’à 30 nuits.', en: 'A stay can last up to 30 nights.' },
    'tarif indisponible pour ce creneau':
      { fr: 'Ce créneau n’est pas encore ouvert à la réservation.', en: 'This slot is not open for booking yet.' },
    'espace retenu en usage exclusif sur ce creneau':
      { fr: 'Ce créneau est privatisé. Choisis-en un autre.', en: 'This slot is booked privately. Please pick another.' },
    'cet usage se reserve aupres de l\'equipe':
      { fr: 'Cet usage se réserve auprès de l’équipe. Écris-nous et on te répond.',
        en: 'This usage is booked with our team. Get in touch and we will reply.' },
    'mode d\'usage non offert pour cet espace':
      { fr: 'Cet usage n’est pas proposé pour cet espace.', en: 'This usage is not offered for this space.' },
    'version de consentement inconnue ou perimee':
      { fr: 'Recharge la page : la notice a changé depuis l’ouverture de cet onglet.',
        en: 'Please reload: the notice changed since this tab was opened.' },
    'la cle d\'idempotence doit etre un uuid tire au hasard':
      { fr: 'Recharge la page et recommence.', en: 'Please reload the page and try again.' },
    'cle d\'idempotence deja utilisee':
      { fr: 'Recharge la page et recommence.', en: 'Please reload the page and try again.' },
    'indiquez un numero de table, ou un prenom et un telephone':
      { fr: 'Indique ton prénom et ton numéro.', en: 'Please give your first name and phone number.' }
  };

  var REPLI = {
    fr: "Ça n'a pas marché. Réessaie dans un instant.",
    en: "That didn't work. Please try again in a moment."
  };

  var inconnus = [];

  function traduire(message, langue) {
    var brut = (message || '').trim();
    var connu = MESSAGES[brut];

    if (!connu) {
      /* Capacité : le texte porte un nombre variable. */
      if (brut.indexOf('capacite atteinte') === 0) {
        var reste = brut.match(/\((\d+) places? restantes?\)/);
        var n = reste ? parseInt(reste[1], 10) : 0;
        return langue === 'en'
          ? (n > 0 ? 'Only ' + n + ' spot(s) left for this slot.' : 'This slot is full.')
          : (n > 0 ? 'Il ne reste que ' + n + ' place(s) sur ce créneau.' : 'Ce créneau est complet.');
      }
      if (brut.indexOf('ce logement accueille au plus') === 0) {
        var m = brut.match(/(\d+)/);
        return langue === 'en'
          ? 'This room sleeps up to ' + (m ? m[1] : '') + ' guest(s).'
          : 'Ce logement accueille jusqu’à ' + (m ? m[1] : '') + ' personne(s).';
      }
      if (brut.indexOf('telephone invalide') === 0) {
        return langue === 'en' ? 'Please check the phone number.' : 'Vérifie le numéro de téléphone.';
      }
      if (brut) {
        inconnus.push(brut);
        if (window.console) console.warn('[roots] message non répertorié :', brut);
      }
      return REPLI[langue === 'en' ? 'en' : 'fr'];
    }
    return connu[langue === 'en' ? 'en' : 'fr'];
  }

  /* ---------- Appels ---------- */

  function ErreurRoots(message, langue, brut, code) {
    this.name = 'ErreurRoots';
    this.message = message;
    this.brut = brut;
    this.code = code;
    this.langue = langue;
  }
  ErreurRoots.prototype = Object.create(Error.prototype);

  function langueCourante() {
    return (document.documentElement.lang === 'en') ? 'en' : 'fr';
  }

  async function envoyer(chemin, options) {
    var langue = langueCourante();
    var reponse;
    try {
      reponse = await fetch(BASE + chemin, options);
    } catch (e) {
      throw new ErreurRoots(
        langue === 'en' ? 'No connection. Check your network.' : 'Pas de connexion. Vérifie ton réseau.',
        langue, 'reseau', 0
      );
    }
    var texte = await reponse.text();
    var corps = null;
    try { corps = texte ? JSON.parse(texte) : null; } catch (e) { corps = null; }

    if (!reponse.ok) {
      var brut = (corps && (corps.message || corps.error_description || corps.error)) || texte;
      throw new ErreurRoots(traduire(brut, langue), langue, brut, reponse.status);
    }
    return corps;
  }

  function lire(table, requete) {
    return envoyer('/rest/v1/' + table + (requete ? '?' + requete : ''), { headers: entetes });
  }

  function appeler(fonction, parametres) {
    return envoyer('/rest/v1/rpc/' + fonction, {
      method: 'POST',
      headers: entetes,
      body: JSON.stringify(parametres || {})
    });
  }

  /* ---------- Outils partagés ---------- */

  function cleIdempotence() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    var o = new Uint8Array(16);
    window.crypto.getRandomValues(o);
    o[6] = (o[6] & 0x0f) | 0x40;
    o[8] = (o[8] & 0x3f) | 0x80;
    var h = Array.prototype.map.call(o, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  /* Le numéro part en forme internationale. Le champ international le fournit
     déjà ainsi ; sinon on complète, faute de quoi un numéro local serait
     enregistré sous une forme qu'aucune recherche ne retrouverait. */
  var INDICATIF_DEFAUT = '229';

  function telephone(valeur) {
    var brut = (valeur || '').trim();
    if (brut.charAt(0) === '+') return '+' + brut.slice(1).replace(/\D/g, '');
    var n = brut.replace(/\D/g, '');
    if (n.indexOf('00') === 0) return '+' + n.slice(2);
    if (n.indexOf(INDICATIF_DEFAUT) === 0 && n.length > 10) return '+' + n;
    return '+' + INDICATIF_DEFAUT + n.replace(/^0+/, '');
  }

  /* Le jeton d'une commande vit sur l'appareil : il en est la seule clé. Il n'y
     vit pas au-delà du service — sur un appareil partagé, la commande de la
     veille ne doit pas s'ouvrir. Le tri se fait à la LECTURE : c'est le seul
     moment où la fraîcheur est vérifiable. Une entrée sans horodatage lisible
     est écartée, faute de pouvoir être datée. */
  var CLE_JETONS = 'roots.commandes';
  var DUREE_JETON = 12 * 60 * 60 * 1000;

  function toutGarde() {
    try { return JSON.parse(localStorage.getItem(CLE_JETONS) || '{}'); } catch (e) { return {}; }
  }

  function fraisSeulement(tout) {
    var seuil = Date.now() - DUREE_JETON;
    var gardes = {};
    Object.keys(tout || {}).forEach(function (id) {
      var e = tout[id];
      if (e && typeof e.le === 'number' && e.le > seuil) gardes[id] = e;
    });
    return gardes;
  }

  function garderCommande(id, jeton, code) {
    var tout = fraisSeulement(toutGarde());
    tout[id] = { jeton: jeton, code: code, le: Date.now() };
    try { localStorage.setItem(CLE_JETONS, JSON.stringify(tout)); } catch (e) {}
  }

  function commandesGardees() {
    var tout = toutGarde();
    var frais = fraisSeulement(tout);
    if (Object.keys(frais).length !== Object.keys(tout).length) {
      try { localStorage.setItem(CLE_JETONS, JSON.stringify(frais)); } catch (e) {}
    }
    return frais;
  }

  /* ---------- Porte de paiement ----------
     Une porte, un adaptateur monté à la fois. Les écrans ne nomment jamais le
     prestataire : ils demandent un encaissement, ils reçoivent une issue.

     Deux contraintes vivent ici, et nulle part ailleurs :
     — le navigateur n'énonce aucun montant. Il présente une référence produite
       par la base, qui seule connaît la somme ;
     — le retour du navigateur ne vaut pas encaissement. L'issue rendue ici est
       un signal d'interface ; ce qui fait foi est la lecture serveur. Aucun
       écran ne doit afficher « payé » sur la seule foi de ce retour. */

  var ISSUES = ['accepte', 'refuse', 'abandonne', 'inconnu'];
  var adaptateurPaiement = null;

  function monterPaiement(adaptateur) {
    if (!adaptateur || typeof adaptateur.encaisser !== 'function') {
      throw new Error('adaptateur de paiement incomplet');
    }
    adaptateurPaiement = adaptateur;
  }

  function paiementMonte() { return !!adaptateurPaiement; }

  /* Suivi de l'encaissement. Le retour du widget ne vaut rien : on interroge le
     serveur jusqu'a ce que l'etat quitte l'attente. Les intervalles s'allongent
     pour ne pas marteler la base ; passe le delai, on ne conclut PAS — on rend
     « indetermine », qui se dit a l'ecran « on verifie » et jamais « paye ». */
  var CADENCE = [1500, 2000, 3000, 4000, 5000, 8000];

  function suivrePaiement(lire, opts) {
    var o = opts || {};
    var limite = Date.now() + (o.limite || 180000);
    var i = 0;
    return new Promise(function (resoudre, rejeter) {
      (function tour() {
        Promise.resolve().then(lire).then(function (r) {
          var etat = r && r.statut_paiement;
          if (etat && etat !== 'en_attente') return resoudre({ statut: etat, ligne: r });
          if (Date.now() >= limite) return resoudre({ statut: 'indetermine', ligne: r || null });
          setTimeout(tour, CADENCE[Math.min(i++, CADENCE.length - 1)]);
        }, function (e) {
          if (Date.now() >= limite) return rejeter(e);
          setTimeout(tour, CADENCE[Math.min(i++, CADENCE.length - 1)]);
        });
      })();
    });
  }

  function encaisser(reference) {
    if (!adaptateurPaiement) return Promise.reject(new Error('aucun adaptateur de paiement'));
    if (!reference) return Promise.reject(new Error('reference absente'));
    /* L'appel part DANS la chaîne : un adaptateur qui lève en synchrone doit
       tomber dans la même main que celui qui rejette. Appelé au dehors, il
       traverserait la porte. */
    return Promise.resolve().then(function () {
      return adaptateurPaiement.encaisser(reference);
    }).then(function (issue) {
      var rendu = issue && issue.rendu;
      return { reference: reference, rendu: ISSUES.indexOf(rendu) >= 0 ? rendu : 'inconnu' };
    }, function () {
      return { reference: reference, rendu: 'inconnu' };
    });
  }

  /* ---------- Consentement ----------
     Chaque porte qui recueille un contact affiche sa notice et transmet la
     version affichée. Sans version, l'écriture est refusée par la base. */

  var notices = null;

  async function chargerNotices() {
    if (notices) return notices;
    var lignes = await lire('textes_consentement', 'select=porte,version,contenu_fr,contenu_en&actif=eq.true');
    notices = {};
    (lignes || []).forEach(function (l) { notices[l.porte] = l; });
    return notices;
  }

  async function notice(porte) {
    var toutes = await chargerNotices();
    return toutes[porte] || null;
  }

  /* Le texte affiché est CELUI de la version scellée avec le consentement.
     L'écran n'y ajoute rien : ce qui est lu doit être ce qui est enregistré
     La notice porte ses deux langues ; on rend celle de la langue courante. */
  function texteNotice(n, langue) {
    if (!n) return '';
    return (langue === 'en' ? n.contenu_en : n.contenu_fr) || n.contenu_fr || '';
  }

  /* ---------- Surface publique ---------- */

  var api = {
    lire: lire,
    appeler: appeler,
    traduire: traduire,
    messagesInconnus: function () { return inconnus.slice(); },
    cleIdempotence: cleIdempotence,
    telephone: telephone,
    garderCommande: garderCommande,
    commandesGardees: commandesGardees,
    monterPaiement: monterPaiement,
    paiementMonte: paiementMonte,
    encaisser: encaisser,
    suivrePaiement: suivrePaiement,

    /* Le montant vient de la base, jamais du navigateur : ces deux portes
       rendent la reference a presenter et la somme que le serveur a figee. */
    initierPaiementCommande: function (commande, jeton) {
      return appeler('initier_paiement_commande', { p_commande: commande, p_jeton: jeton });
    },

    /* La remise vers l'ecran d'encaissement. Elle passe par la memoire de
       session : une reference portee dans une adresse part aussi dans
       l'historique, dans l'en-tete de provenance vers le prestataire et dans
       les journaux de l'hebergeur. Le montant vient de la porte, jamais de
       l'ecran. */
    remisePaiement: function (o) {
      var remise = {
        paiement: o.paiement, montant: o.montant,
        cle: PAIEMENT.cle, essai: PAIEMENT.essai,
        type: o.type, code: o.code, tel: telephone(o.tel)
      };
      try { sessionStorage.setItem('roots_remise_paiement', JSON.stringify(remise)); }
      catch (e) { return false; }
      return !!PAIEMENT.cle;
    },

    reglagePaiement: function () { return { pose: !!PAIEMENT.cle, essai: PAIEMENT.essai }; },

    initierPaiementReservation: function (type, code, tel) {
      return appeler('initier_paiement_reservation', {
        p_type: type, p_code: code, p_tel: telephone(tel)
      });
    },
    notice: notice,
    texteNotice: texteNotice,
    chargerNotices: chargerNotices,

    carte: function () {
      return Promise.all([
        lire('categories_menu', 'select=id,slug,nom_fr,nom_en,ordre,station&order=ordre'),
        lire('articles_menu', 'select=id,categorie_id,slug,nom_fr,nom_en,desc_fr,desc_en,prix,dispo,ordre&order=ordre')
      ]).then(function (r) { return { categories: r[0], articles: r[1] }; });
    },

    espaces: function () {
      return Promise.all([
        lire('espaces', 'select=id,slug,nom&actif=eq.true'),
        lire('capacites_espace', 'select=espace_id,mode,capacite,exclusif,rang_priorite'),
        lire('tarifs_espace', 'select=espace_id,mode,creneau,prix,par_personne')
      ]).then(function (r) { return { espaces: r[0], capacites: r[1], tarifs: r[2] }; });
    },

    logements: function () {
      return lire('logements', 'select=id,slug,nom,prix_nuit,capacite&actif=eq.true');
    },

    disponibiliteEspace: function (slug, mode, date, creneau) {
      return appeler('disponibilite_espace', {
        p_espace_slug: slug, p_mode: mode, p_date: date, p_creneau: creneau
      }).then(function (r) { return Array.isArray(r) ? r[0] : r; });
    },

    reserverEspace: function (o) {
      return appeler('reserver_espace', {
        p_espace_slug: o.espace, p_mode: o.mode, p_date: o.date, p_creneau: o.creneau,
        p_nb: o.personnes, p_nom: o.nom, p_tel: telephone(o.tel),
        p_cle: o.cle || cleIdempotence(), p_consentement: o.consentement
      });
    },

    ouvrirCommande: function (o) {
      return appeler('ouvrir_commande', {
        p_jeton_table: o.table || null, p_nom: o.nom || null,
        p_tel: o.tel ? telephone(o.tel) : null,
        p_service: o.service || 'sur_place',
        p_cle: o.cle || cleIdempotence(), p_consentement: o.consentement
      }).then(function (r) {
        if (r && r.id) garderCommande(r.id, r.jeton, r.code);
        return r;
      });
    },

    ajouterArticle: function (commande, jeton, article, quantite) {
      return appeler('ajouter_article', {
        p_commande: commande, p_jeton: jeton, p_article: article, p_quantite: quantite || 1
      });
    },

    retirerLigne: function (commande, jeton, ligne) {
      return appeler('retirer_ligne', { p_commande: commande, p_jeton: jeton, p_ligne: ligne });
    },

    consulterCommande: function (id, jeton) {
      return appeler('consulter_commande', { p_id: id, p_jeton: jeton });
    },

    consulterReservationEspace: function (code, tel) {
      return appeler('consulter_reservation_espace', { p_code: code, p_tel: telephone(tel) })
        .then(function (r) { return Array.isArray(r) ? r[0] : r; });
    },

    annulerReservationEspace: function (code, tel) {
      return appeler('annuler_reservation_espace', { p_code: code, p_tel: telephone(tel) });
    },

    consulterReservationLogement: function (code, tel) {
      return appeler('consulter_reservation_logement', { p_code: code, p_tel: telephone(tel) })
        .then(function (r) { return Array.isArray(r) ? r[0] : r; });
    },

    annulerReservationLogement: function (code, tel) {
      return appeler('annuler_reservation_logement', { p_code: code, p_tel: telephone(tel) });
    },

    /* Le client ne sait pas quel type de réservation il a faite : on cherche
       l'espace, puis le logement. Une seule saisie, deux portes. */
    retrouver: function (code, tel) {
      var self = this;
      return self.consulterReservationEspace(code, tel).then(function (r) {
        if (r) return { type: 'espace', r: r };
        return self.consulterReservationLogement(code, tel).then(function (l) {
          return l ? { type: 'logement', r: l } : null;
        });
      });
    },

    /* ---------- Caisse ----------
       Le montant ne se saisit jamais et ne se calcule jamais ici : le serveur
       relit le du et rend la monnaie. Ces portes n'ont donc aucun argument de
       montant a encaisser, deliberement. */
    monServiceCaisse: function () { return appeler('mon_service_caisse', {}); },

    totalCoupures: function (coupures) {
      return appeler('total_coupures', { p_coupures: coupures });
    },

    ouvrirServiceCaisse: function (coupures) {
      return appeler('ouvrir_service_caisse', { p_coupures: coupures });
    },

    montantDuPaiement: function (type, id, objet) {
      return appeler('montant_du_paiement', {
        p_cible_type: type, p_cible_id: id, p_objet: objet || 'total'
      });
    },

    monnaieARendre: function (du, recu) {
      return appeler('monnaie_a_rendre', { p_du: du, p_recu: recu });
    },

    encaisserAuComptoir: function (type, id, moyen, reference) {
      return appeler('encaisser_au_comptoir', {
        p_cible_type: type, p_cible_id: id, p_moyen: moyen,
        p_objet: 'total', p_reference: reference || null
      });
    },

    /* Le numero est toujours exige ; ensuite le code OU le jour. La porte ne
       rend qu'une vente, jamais une liste : trois lignes chiffrees seraient un
       total, et un total reconstitue l'attendu du soir. */
    trouverVenteComptoir: function (o) {
      return appeler('trouver_vente_comptoir', {
        p_code: o.code || null,
        p_tel: o.tel ? telephone(o.tel) : null,
        p_jour: o.jour || null
      });
    },

    choisirRemiseComptoir: function (o) {
      return appeler('choisir_remise_comptoir', {
        p_vente_type: o.type, p_vente_id: o.id, p_canal: o.canal,
        p_tel: o.tel ? telephone(o.tel) : null,
        p_consentement: o.consentement || null,
        p_courriel: o.courriel || null
      });
    },

    demanderEvenement: function (o) {
      return appeler('demander_evenement', {
        p_nature: o.nature, p_nom: o.nom, p_tel: telephone(o.tel), p_email: o.email || null,
        p_date: o.date || null, p_nb: o.personnes || null, p_message: o.message || null,
        p_cle: o.cle || cleIdempotence(), p_consentement: o.consentement
      });
    }
  };

  window.Roots.db = api;
})();