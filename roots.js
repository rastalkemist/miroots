/* ==========================================================================
   ROOTS — socle de chrome partagé.
   Source unique du chrome de tous les écrans : planche de symboles, champ
   téléphone international, pastille Mi/NU, super-nav, menu déroulant, toast.
   Aucun écran ne redéfinit ce qui vit ici.
   ========================================================================== */
/* ==========================================================================
   Socle de chrome partagé : champ téléphone international et navigation
   (pastille Mi/NU, super-nav, menu déroulant, toast).
   ========================================================================== */
(function (global) {
  'use strict';

  var PAYS_EPINGLES = ['bj', 'ng', 'tg', 'gh', 'ci', 'ne', 'bf', 'sn', 'fr', 'be', 'us', 'ca', 'gb', 'de'];
  var PREFIXE_BJ = '01';

  function chiffresDe(v) { return (v || '').replace(/\D/g, ''); }

  function paysDe(iti) {
    return (iti && typeof iti.getSelectedCountryData === 'function') ? iti.getSelectedCountryData() : null;
  }

  function surBenin(iti) {
    var p = paysDe(iti);
    return !!(p && p.iso2 === 'bj');
  }

  /* Le numéro béninois commence toujours par 01 : le champ le porte d'avance.
     Le préfixe absorbe la saisie de qui le retape, résiste à un retour arrière
     isolé, et revient de lui-même après un effacement complet. */
  function prefixeBenin(input, iti) {
    var attendUn = false;

    function poser() {
      input.value = PREFIXE_BJ + ' ';
      try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {}
    }

    input.addEventListener('beforeinput', function (e) {
      if (!surBenin(iti) || e.inputType !== 'insertText') { attendUn = false; return; }
      var enFin = input.selectionStart === input.selectionEnd && input.selectionStart === input.value.length;
      if (e.data === '0' && enFin && chiffresDe(input.value).length <= 2) { e.preventDefault(); attendUn = true; return; }
      if (e.data === '1' && attendUn) { e.preventDefault(); attendUn = false; return; }
      attendUn = false;
    });

    input.addEventListener('keydown', function (e) {
      if (!surBenin(iti)) return;
      if (e.key !== 'Backspace' && e.key !== 'Delete') return;
      var debut = input.selectionStart || 0, fin = input.selectionEnd || 0;
      /* Champ entièrement sélectionné : l'effacement est voulu, le préfixe repartira seul. */
      if (debut === 0 && fin === input.value.length && fin > 0) return;
      var avant = chiffresDe(input.value.slice(0, debut)).length;
      if (debut === fin ? (e.key === 'Backspace' ? avant <= 2 : avant < 2) : avant < 2) e.preventDefault();
    });

    input.addEventListener('input', function () {
      if (!surBenin(iti)) return;
      var n = chiffresDe(input.value);
      if (!n) { poser(); return; }
      /* Préfixe redonné par un collage : on n'en garde qu'un. */
      if (n.indexOf(PREFIXE_BJ + PREFIXE_BJ) === 0 && typeof iti.setNumber === 'function') {
        var p = paysDe(iti);
        iti.setNumber('+' + ((p && p.dialCode) || '229') + n.slice(PREFIXE_BJ.length));
      }
    });

    input.addEventListener('blur', function () { attendUn = false; });

    /* Le format dépend du pays : on repart d'un champ vide au changement. */
    input.addEventListener('countrychange', function () {
      attendUn = false;
      input.value = '';
      if (surBenin(iti)) poser();
    });

    if (!input.value.trim() && surBenin(iti)) poser();
  }

  /* Champ téléphone : pays par défaut bj, indicatif séparé, groupes formés à la
     frappe, liste rattachée au <body> pour ne pas être rognée par les conteneurs
     qui défilent, utilitaires de formatage chargés depuis vendor/. */
  function initTelRoots(input) {
    if (!input) return null;
    if (!global.intlTelInput) { input.placeholder = '01 XX XX XX XX'; return null; }
    var iti = global.intlTelInput(input, {
      initialCountry: 'bj',
      separateDialCode: true,
      countrySearch: false,
      formatAsYouType: true,
      dropdownParent: document.body,
      countryOrder: PAYS_EPINGLES,
      customPlaceholder: function (exemple, pays) { return (pays && pays.iso2 === 'bj') ? '01 XX XX XX XX' : exemple; },
      loadUtils: function () { return import('./vendor/utils.js'); }
    });
    prefixeBenin(input, iti);
    return iti;
  }

  /* Navigation partagée. opts :
       getLangue   : () => 'fr' | 'en'
       getSections : (langue) => [ {ico,t,s,href}, ... ]
       toastNu     : (langue) => texte
       toastVerbe  : (langue, libelle) => texte
       verbes      : { plan:'Plan', roots:'Roots', roam:'Roam' }
       onVerbe     : (verbe, bouton) => true si la page a géré le verbe
     Retourne { toast, dessinerSections, fermerMenu }. */
  var MENTIONS = { fr: 'Mentions légales', en: 'Legal notices' };

  /* ------------------------------------------------------------------
     LA NAVIGATION, DECLAREE UNE SEULE FOIS.
     Elle vivait auparavant en quatre copies, une par ecran, a l'interieur
     de leurs scripts respectifs — et deux ecrans (paiement, facture)
     portaient le conteneur du tiroir sans aucune liste, donc un tiroir
     vide. Ajouter un ecran se fait desormais ICI, et nulle part ailleurs.

     LA LISTE NE CHANGE PAS D'UN ECRAN A L'AUTRE. Une navigation repetee
     doit apparaitre dans le meme ordre sur chaque page — WCAG 3.2.3,
     niveau AA. L'entree de la page courante n'est donc pas retiree : elle
     est MARQUEE, par aria-current et par une classe. Retirer l'entree
     ferait changer la forme du menu d'un ecran a l'autre, ce qui desoriente
     et prive le lecteur d'ecran de sa position.
     ------------------------------------------------------------------ */
  var NAV = {
    fr: [
      { ico: 'i-carte',      t: 'La carte',           s: 'Toute la carte, en détail', href: 'carte.html' },
      { ico: 'i-calendrier', t: 'Réserver un espace', s: 'Le jardin, le bureau',      href: 'index.html?ouvrir=reserver' },
      { ico: 'i-ticket',     t: 'Ma réservation',     s: 'Retrouver avec ton code',   href: 'retrouver.html' }
    ],
    en: [
      { ico: 'i-carte',      t: 'Menu',         s: 'Food for your soul',    href: 'carte.html' },
      { ico: 'i-calendrier', t: 'Book a space', s: 'The garden, the office', href: 'index.html?ouvrir=reserver' },
      { ico: 'i-ticket',     t: 'My booking',   s: 'Find it with your code', href: 'retrouver.html' }
    ]
  };

  function ici() { return location.pathname.split('/').pop() || 'index.html'; }

  function nav(langue) {
    var page = ici();
    return (NAV[langue] || NAV.fr).map(function (e) {
      var copie = { ico: e.ico, t: e.t, s: e.s, href: e.href };
      /* Un lien vers soi AVEC parametre est une action et non une navigation :
         « Reserver un espace » ouvre la feuille depuis l'accueil, il ne s'y
         marque donc pas comme page courante. */
      copie.courant = e.href.indexOf('?') === -1 && e.href === page;
      return copie;
    });
  }

  function initChrome(opts) {
    opts = opts || {};
    var getLangue = opts.getLangue || function () { return 'fr'; };
    var getSections = opts.getSections || function () { return []; };
    var toastNu = opts.toastNu || function () { return ''; };
    var toastVerbe = opts.toastVerbe || function (l, v) { return v; };
    var verbes = opts.verbes || { plan: 'Plan', roots: 'Roots', roam: 'Roam' };
    var onVerbe = opts.onVerbe || null;

    var toastTimer = null;
    function toast(msg) {
      var el = document.getElementById('toast');
      if (!el) return;
      el.textContent = msg;
      el.classList.add('visible');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { el.classList.remove('visible'); }, 2600);
    }

    /* Pastille Mi/NU : elle s'étire à l'ouverture et la barre passe en
       « deploie », ce qui efface le reste du chrome le temps du choix. */
    var marque = document.getElementById('marque');
    if (marque) {
      var inner = marque.closest('.chrome-inner');
      var sw = document.getElementById('switchMode');
      var nu = marque.querySelector('.nu');
      var ouvrir = function (v) {
        marque.classList.toggle('ouvert', v);
        if (inner) inner.classList.toggle('deploie', marque.classList.contains('ouvert'));
      };
      marque.addEventListener('click', function (e) {
        e.stopPropagation();
        var surSwitch = sw && sw.contains(e.target);
        var surCible = nu && nu.contains(e.target);
        if (surSwitch || surCible) { toast(toastNu(getLangue())); return; }
        ouvrir(!marque.classList.contains('ouvert'));
      });
      document.addEventListener('click', function (e) { if (!marque.contains(e.target)) ouvrir(false); });
    }

    var superNav = document.getElementById('superNav');
    if (superNav) superNav.addEventListener('click', function (e) {
      var b = e.target.closest('.verbe'); if (!b) return;
      var v = b.dataset.verbe;
      if (onVerbe && onVerbe(v, b)) return;
      if (v === 'roots') { global.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      toast(toastVerbe(getLangue(), verbes[v]));
    });

    var voile = document.getElementById('voileMenu');
    var drawer = document.getElementById('drawer');
    var burger = document.getElementById('btnBurger');
    var menu = drawer ? modale(drawer, {
      cle: 'menu',
      montrer: function () {
        drawer.classList.add('visible');
        if (voile) voile.classList.add('visible');
      },
      cacher: function () {
        drawer.classList.remove('visible');
        if (voile) voile.classList.remove('visible');
      }
    }) : null;
    function fermerMenu() { if (menu) menu.fermer(); }
    if (burger && menu) burger.addEventListener('click', function () { menu.ouvrir(); });
    var btnFermer = document.getElementById('fermerMenu');
    if (btnFermer) btnFermer.addEventListener('click', fermerMenu);
    if (voile) voile.addEventListener('click', fermerMenu);

    function dessinerSections() {
      var cont = document.getElementById('sections');
      if (!cont) return;
      var liste = getSections(getLangue()) || [];
      cont.innerHTML = '';
      liste.forEach(function (s) {
        var a = document.createElement('a');
        a.className = 'lien-section';
        a.href = s.href;
        a.innerHTML = '<span class="ico"><svg class="i"><use href="#' + s.ico + '"/></svg></span>' +
          '<span class="txt"><span class="t"></span><small></small></span>' +
          '<svg class="i fleche"><use href="#i-chevron"/></svg>';
        a.querySelector('.t').textContent = s.t;
        a.querySelector('small').textContent = s.s;
        if (s.courant) { a.classList.add('courant'); a.setAttribute('aria-current', 'page'); }
        cont.appendChild(a);
      });
      /* Les mentions légales ferment le menu, en second niveau : une ligne
         soulignée, pas une entrée de navigation. */
      var pied = document.createElement('div');
      pied.className = 'mentions';
      var lien = document.createElement('a');
      lien.href = 'confidentialite.html';
      lien.textContent = MENTIONS[getLangue()] || MENTIONS.fr;
      if (ici() === 'confidentialite.html') {
        lien.classList.add('courant');
        lien.setAttribute('aria-current', 'page');
      }
      pied.appendChild(lien);
      cont.appendChild(pied);
    }
    dessinerSections();

    return { toast: toast, dessinerSections: dessinerSections, fermerMenu: fermerMenu };
  }


  /* ------------------------------------------------------------------------
     Un panneau qui se declare modal doit l'etre. Trois choses, qu'aucun ecran
     ne refait dans son coin :
       — le focus n'en sort pas tant qu'il est ouvert ;
       — la touche d'echappement le referme ;
       — le geste « retour » du telephone le referme au lieu de quitter la page.
     Le troisieme point est le plus important : sur telephone, « retour » est un
     geste systeme. Sans entree d'historique, il emporte la saisie et sort du
     site.
     ------------------------------------------------------------------------ */

  var FOCUSABLES = 'a[href],button:not([disabled]),input:not([disabled]),' +
    'select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function visibles(hote) {
    return Array.prototype.filter.call(hote.querySelectorAll(FOCUSABLES), function (e) {
      return e.offsetParent !== null || e === document.activeElement;
    });
  }

  function modale(hote, opts) {
    opts = opts || {};
    var cle = opts.cle || (hote.id || 'modale');
    var ouverte = false, precedent = null, pousse = false;

    function premier() {
      var l = visibles(hote);
      if (l.length) l[0].focus();
      else { hote.setAttribute('tabindex', '-1'); hote.focus(); }
    }

    function ouvrir() {
      if (ouverte) return;
      ouverte = true;
      precedent = document.activeElement;
      if (opts.montrer) opts.montrer();
      /* pushState echoue sur un fichier ouvert depuis le disque : on degrade
         sans bruit, le reste du comportement tient. */
      pousse = false;
      try { history.pushState({ rootsModale: cle }, ''); pousse = true; } catch (e) {}
      premier();
    }

    function fermer(parHistorique) {
      if (!ouverte) return;
      ouverte = false;
      if (opts.cacher) opts.cacher();
      if (pousse && !parHistorique) { try { history.back(); } catch (e) {} }
      pousse = false;
      if (precedent && precedent.focus) { try { precedent.focus(); } catch (e) {} }
    }

    document.addEventListener('keydown', function (e) {
      if (!ouverte) return;
      if (e.key === 'Escape') { e.preventDefault(); fermer(); return; }
      if (e.key !== 'Tab') return;
      var l = visibles(hote);
      if (!l.length) return;
      var premierEl = l[0], dernier = l[l.length - 1];
      if (!hote.contains(document.activeElement)) { e.preventDefault(); premierEl.focus(); return; }
      if (e.shiftKey && document.activeElement === premierEl) { e.preventDefault(); dernier.focus(); }
      else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premierEl.focus(); }
    });

    window.addEventListener('popstate', function () { if (ouverte) fermer(true); });

    return { ouvrir: ouvrir, fermer: fermer, estOuverte: function () { return ouverte; } };
  }

  /* ------------------------------------------------------------------------
     La langue est un choix, pas une detection : une fois exprime, il suit
     l'utilisateur d'un ecran a l'autre. Sans cela, un visiteur francophone
     dont le telephone est en anglais rebascule sur chaque page.
     ------------------------------------------------------------------------ */

  var CLE_LANGUE = 'roots.langue';

  function langueRetenue(defaut) {
    try {
      var l = localStorage.getItem(CLE_LANGUE);
      if (l === 'fr' || l === 'en') return l;
    } catch (e) {}
    return defaut;
  }

  function retenirLangue(l) {
    try { localStorage.setItem(CLE_LANGUE, l); } catch (e) {}
  }

  function langueParDefaut() {
    return (navigator.language || 'fr').toLowerCase().indexOf('en') === 0 ? 'en' : 'fr';
  }

  /* Apres un envoi refuse, le focus va au premier champ en cause : le message
     dit quoi faire, encore faut-il etre a l'endroit ou le faire. */
  function focusPremierFautif(ids) {
    for (var i = 0; i < ids.length; i++) {
      var e = document.getElementById(ids[i]);
      if (!e) continue;
      var v = (e.value || '').trim();
      if (!v) { e.focus(); return e; }
    }
    var p = document.getElementById(ids[0]);
    if (p) p.focus();
    return p;
  }

  global.Roots = global.Roots || {};
  /* ------------------------------------------------------------------------
     Garde des ecritures ouvertes au public. Aucun effort n'est demande au
     visiteur, et aucun captcha visuel n'est employe : il exclut une partie du
     public.
     Le champ ajoute ici reste hors du clavier, hors des technologies
     d'assistance et hors de la vue, sans quitter le flux du document.
     Le delai minimal s'applique a toute soumission.
     ------------------------------------------------------------------------ */

  var DELAI_MINIMAL = 2500;

  function garde(hote, nom) {
    var champ = document.createElement('input');
    champ.type = 'text';
    champ.name = nom || 'complement';
    champ.tabIndex = -1;
    champ.autocomplete = 'off';
    champ.setAttribute('aria-hidden', 'true');
    champ.className = 'hors-champ';
    hote.appendChild(champ);
    var pose = Date.now();
    return {
      pris: function () { return !!champ.value; },
      patienter: function () {
        var reste = DELAI_MINIMAL - (Date.now() - pose);
        if (reste <= 0) return Promise.resolve();
        return new Promise(function (r) { setTimeout(r, reste); });
      }
    };
  }

  /* ------------------------------------------------------------------
     LA HAUTEUR REELLE DU BANDEAU, PUBLIEE.
     Elle depend du contenu de l'en-tete et non de l'echelle : elle ne peut
     donc pas vivre dans les jetons. Une regle qui veut coller un element
     sous le bandeau lit --chrome-haut-h ; sans elle, l'element passe
     DERRIERE le bandeau, qui est collant et d'un rang superieur.
     ------------------------------------------------------------------ */
  function publierHauteurChrome() {
    var h = document.querySelector('.chrome-haut');
    if (!h) return;
    function poser() {
      document.documentElement.style.setProperty(
        '--chrome-haut-h', Math.round(h.getBoundingClientRect().height) + 'px');
    }
    poser();
    if (window.ResizeObserver) new ResizeObserver(poser).observe(h);
    else window.addEventListener('resize', poser);
  }

  /* ------------------------------------------------------------------
     LA FEUILLE DU BAS SE FERME EN LA TIRANT.
     Le geste ne demarre QUE si la feuille est deja en haut de son propre
     defilement : sinon il se battrait avec le defilement du contenu, et
     c'est le defilement qui doit gagner. Il ne demarre pas depuis un champ
     ni depuis une commande.
     Au-dela du seuil, la fermeture n'est pas reecrite ici : on declenche le
     bouton de fermeture existant, qui porte deja tout ce qu'elle doit
     faire. Deux chemins de fermeture seraient deux verites.
     Qui a demande moins de mouvement ne recoit pas d'animation de retour.
     ------------------------------------------------------------------ */
  var SEUIL_FERMETURE = 110;

  function feuilleGlissante() {
    var f = document.querySelector('.feuille-bas');
    if (!f) return;
    var fermer = f.querySelector('.fermer');
    if (!fermer) return;
    var y0 = null, dy = 0, transition = f.style.transition;
    var doux = !window.matchMedia || !matchMedia('(prefers-reduced-motion: reduce)').matches;

    function debut(e) {
      if (f.scrollTop > 0) return;
      var c = e.target;
      if (c && c.closest && c.closest('input, textarea, select, button, a')) return;
      y0 = e.touches ? e.touches[0].clientY : e.clientY;
      dy = 0;
      f.style.transition = 'none';
    }
    function bouge(e) {
      if (y0 === null) return;
      var y = e.touches ? e.touches[0].clientY : e.clientY;
      dy = Math.max(0, y - y0);
      if (dy > 4 && e.cancelable) e.preventDefault();
      f.style.transform = 'translate(-50%, ' + dy + 'px)';
    }
    function fin() {
      if (y0 === null) return;
      var franchi = dy > SEUIL_FERMETURE;
      y0 = null;
      f.style.transition = doux ? transition : 'none';
      f.style.transform = '';
      if (franchi) fermer.click();
    }

    /* La prise ne se limite pas a la poignee : elle couvre TOUTE la feuille,
       parce qu'une prise cantonnee au bord haut oblige a remonter le pouce et
       casse l'usage a une main. Ce qui protege le geste n'est pas la zone mais
       les deux gardes de `debut` — feuille en haut de son defilement, et
       depart hors d'une commande ou d'un champ. */
    f.addEventListener('touchstart', debut, { passive: true });
    f.addEventListener('mousedown', debut);
    f.addEventListener('touchmove', bouge, { passive: false });
    f.addEventListener('touchend', fin);
    f.addEventListener('touchcancel', fin);
    window.addEventListener('mousemove', bouge);
    window.addEventListener('mouseup', fin);
  }

  /* Les deux gestes du code s'accrochent d'eux-memes a tout element portant
     data-code-copier ou data-code-cartel. L'ecran n'a donc qu'a poser le
     balisage : aucun script d'ecran a modifier, aucun condensat a recalculer.
     La source du code est l'element designe par data-code-source. */
  function accrocherGestesDuCode() {
    function lire(b) {
      var src = document.getElementById(b.getAttribute('data-code-source'));
      return src ? (src.textContent || '').trim() : '';
    }
    function dire(b, mot) {
      var avant = b.getAttribute('data-libelle') || b.textContent;
      b.setAttribute('data-libelle', avant);
      b.textContent = mot;
      setTimeout(function () { b.textContent = avant; }, 1800);
    }
    Array.prototype.forEach.call(document.querySelectorAll('[data-code-copier]'), function (b) {
      b.addEventListener('click', function () {
        var code = lire(b);
        if (!code) return;
        copier(code, function (ok) { dire(b, ok ? b.getAttribute('data-fait') || 'Copié' : '…'); });
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-code-cartel]'), function (b) {
      b.addEventListener('click', function () {
        var code = lire(b);
        if (!code) return;
        var lignes = (b.getAttribute('data-lignes') || '').split('|').filter(Boolean);
        cartel({ code: code, titre: b.getAttribute('data-titre') || 'Roots',
                 lignes: lignes, nomFichier: 'roots-' + code });
      });
    });
  }

  window.addEventListener('load', function () {
    publierHauteurChrome();
    feuilleGlissante();
    accrocherGestesDuCode();
  });

  /* ------------------------------------------------------------------
     LE CODE : LE COPIER, ET L'EMPORTER EN IMAGE.
     Le client perd son code parce qu'il ne lui est donne qu'aux moments ou
     il pense a autre chose. Deux gestes, et deux seulement.

     LE CARTEL NE PORTE QUE LE CODE ET SON CONTEXTE. Jamais le numero de
     telephone, jamais le montant. Le code seul n'ouvre rien — c'est le
     couple code + numero qui ouvre une vente. Un cartel portant les deux
     transformerait une image partagee par megarde en cle complete.
     ------------------------------------------------------------------ */
  function copier(texte, surFait) {
    function fini(ok) { if (surFait) surFait(ok); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texte).then(function () { fini(true); },
                                               function () { fini(false); });
      return;
    }
    /* Repli pour les navigateurs sans presse-papiers : une zone hors ecran,
       selectionnee puis copiee. Elle est retiree dans tous les cas. */
    var z = document.createElement('textarea');
    z.value = texte;
    z.setAttribute('readonly', '');
    z.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(z);
    z.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(z);
    fini(ok);
  }

  var CARTEL = { l: 640, h: 400 };

  /* opts : { code, titre, lignes: [..], nomFichier }
     Le dessin se fait dans le navigateur : rien ne part, rien n'est demande
     a un serveur. Les couleurs se lisent sur les jetons servis, pour qu'une
     correction de palette suive sans retoucher ce code. */
  function cartel(opts, surFait) {
    var jeton = function (n, repli) {
      var v = getComputedStyle(document.documentElement).getPropertyValue(n);
      return (v && v.trim()) || repli;
    };
    var c = document.createElement('canvas');
    var e = Math.min(3, window.devicePixelRatio || 1);
    c.width = CARTEL.l * e; c.height = CARTEL.h * e;
    var x = c.getContext('2d');
    if (!x) { if (surFait) surFait(false); return; }
    x.scale(e, e);

    x.fillStyle = jeton('--blanc-casse', '#FDFBF6');
    x.fillRect(0, 0, CARTEL.l, CARTEL.h);
    x.fillStyle = jeton('--roots-vert', '#005B22');
    x.fillRect(0, 0, CARTEL.l, 10);

    x.textAlign = 'center';
    x.fillStyle = jeton('--encre-discrete', '#635E53');
    x.font = '600 20px system-ui, sans-serif';
    x.fillText((opts.titre || 'Roots').toUpperCase(), CARTEL.l / 2, 74);

    x.fillStyle = jeton('--encre', '#0C321A');
    x.font = '700 84px ui-monospace, Menlo, Consolas, monospace';
    x.fillText(String(opts.code || ''), CARTEL.l / 2, 186);

    x.font = '400 22px system-ui, sans-serif';
    (opts.lignes || []).slice(0, 3).forEach(function (l, i) {
      x.fillText(String(l), CARTEL.l / 2, 240 + i * 34);
    });

    x.fillStyle = jeton('--encre-discrete', '#635E53');
    x.font = '400 18px system-ui, sans-serif';
    x.fillText('mi.roots.bj', CARTEL.l / 2, CARTEL.h - 30);

    try {
      var a = document.createElement('a');
      a.href = c.toDataURL('image/png');
      a.download = (opts.nomFichier || 'code-roots') + '.png';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      if (surFait) surFait(true);
    } catch (err) { if (surFait) surFait(false); }
  }

  global.Roots.garde = garde;
  global.Roots.initTelRoots = initTelRoots;
  global.Roots.initChrome = initChrome;
  global.Roots.nav = nav;
  global.Roots.copier = copier;
  global.Roots.cartel = cartel;
  global.Roots.modale = modale;
  global.Roots.langueRetenue = langueRetenue;
  global.Roots.retenirLangue = retenirLangue;
  global.Roots.langueParDefaut = langueParDefaut;
  global.Roots.focusPremierFautif = focusPremierFautif;
})(window);

(function (global) {
  'use strict';

  /* La planche de symboles est posée en tête du corps de page, avant que le
     premier <use> soit analysé : les icônes ne clignotent pas au chargement. */
  var PLANCHE = [
    '<symbol id="i-ankh" viewBox="0 0 110 111">',
    '<path fill-rule="nonzero" fill="rgb(10.196078%, 10.196078%, 10.196078%)" d="M 55.144531 3.101562 C 83.609375 3.101562 106.679688 26.175781 106.679688 54.636719 C 106.679688 83.101562 83.609375 106.171875 55.144531 106.171875 C 26.683594 106.171875 3.609375 83.101562 3.609375 54.636719 C 3.609375 26.175781 26.683594 3.101562 55.144531 3.101562 "/>',
    '<path fill-rule="nonzero" fill="rgb(100%, 69.019608%, 0%)" d="M 47.660156 45.566406 L 12.074219 42.925781 C 14.8125 33.019531 20.882812 24.355469 29.257812 18.398438 C 30.832031 21.53125 32.574219 24.574219 34.480469 27.515625 Z M 47.660156 45.566406 "/>',
    '<path fill-rule="nonzero" fill="rgb(0%, 35.686275%, 13.333333%)" d="M 10.546875 57.304688 L 50.652344 54.070312 L 49.699219 99.140625 C 28.414062 96.554688 11.738281 78.992188 10.546875 57.304688 "/>',
    '<path fill-rule="nonzero" fill="rgb(89.019608%, 10.588235%, 13.72549%)" d="M 67.039062 25.71875 C 65.503906 27.898438 57.183594 38.679688 54.992188 38.496094 C 47.457031 32.53125 40.75 23.539062 36.359375 14.269531 C 48.25 8.769531 61.953125 8.753906 73.855469 14.226562 C 71.894531 18.230469 69.613281 22.078125 67.039062 25.71875 "/>',
    '<path fill-rule="nonzero" fill="rgb(100%, 69.019608%, 0%)" d="M 62.132812 45.5625 C 68.492188 37.964844 75.789062 28.535156 80.960938 18.355469 C 89.371094 24.316406 95.464844 32.996094 98.207031 42.933594 Z M 62.132812 45.5625 "/>',
    '<path fill-rule="nonzero" fill="rgb(0%, 35.686275%, 13.333333%)" d="M 99.742188 57.304688 C 98.554688 78.992188 81.878906 96.550781 60.59375 99.140625 L 59.640625 54.070312 Z M 99.742188 57.304688 "/>',
    '  </symbol>',
    '<symbol id="i-esp-coworking" viewBox="21.27 7.75 179.31 178.87"><path fill="rgb(10.196078%,10.196078%,10.196078%)" d="M 31.738281 41.210938 C 38.699219 52.425781 45.9375 63.476562 53.015625 74.621094 C 55.007812 77.734375 57.722656 80.527344 60.972656 77.746094 C 62.40625 76.523438 62.316406 71.777344 61.164062 69.570312 C 55.644531 58.988281 49.71875 48.597656 43.523438 38.394531 C 41.214844 34.921875 38.402344 31.8125 35.179688 29.167969 C 34.113281 28.222656 31.609375 28.351562 30.007812 28.820312 C 29.074219 29.097656 28.617188 31.015625 27.910156 32.261719 C 29.222656 35.53125 30.078125 38.632812 31.699219 41.25 Z M 193.601562 149.601562 C 193.9375 148.386719 191.757812 145.464844 190.128906 144.839844 C 175.332031 139.101562 160.464844 133.53125 145.4375 128.421875 C 143.230469 127.664062 138.617188 128.777344 137.691406 130.410156 C 135.40625 134.546875 138.957031 136.734375 142.527344 138.097656 C 153.464844 142.261719 164.402344 146.4375 175.339844 150.484375 C 179.4375 152.007812 183.664062 153.191406 189.085938 154.921875 C 190.585938 153.269531 192.960938 151.6875 193.558594 149.601562 Z M 122.847656 82.339844 C 130.117188 72.625 137.316406 62.839844 144.316406 52.933594 C 146.566406 49.914062 148.324219 46.558594 149.527344 42.988281 C 150.171875 40.882812 148.890625 38.1875 148.460938 35.761719 C 146.554688 36.4375 143.886719 36.546875 142.855469 37.898438 C 133.902344 49.671875 125.152344 61.644531 116.492188 73.699219 C 115.058594 75.6875 113.65625 78.191406 113.507812 80.527344 C 113.410156 82.578125 115.140625 84.714844 116.492188 87.859375 C 119.484375 85.261719 121.503906 84.070312 122.847656 82.339844 M 100.691406 14.660156 C 99.308594 14.390625 96.246094 16.875 95.808594 18.636719 C 91.898438 34.210938 88.339844 49.871094 84.871094 65.542969 C 83.875 69.878906 83.957031 74.621094 89.414062 75.597656 C 95.28125 76.640625 95.949219 71.378906 96.753906 67.402344 C 98.324219 59.617188 99.476562 51.761719 100.730469 43.925781 C 101.984375 36.089844 103.277344 28.234375 104.828125 18.6875 C 103.953125 17.710938 102.558594 15.015625 100.710938 14.660156 Z M 143.835938 105.082031 C 152.070312 102.714844 160.367188 100.496094 168.46875 97.742188 C 175.164062 95.449219 181.71875 92.757812 188.089844 89.679688 C 189.480469 89 189.78125 86.058594 190.585938 84.160156 C 188.867188 83.484375 186.945312 81.921875 185.445312 82.25 C 170.160156 85.652344 154.9375 89.300781 139.703125 93.050781 C 137.433594 93.503906 135.335938 94.574219 133.636719 96.140625 C 132.003906 97.882812 130.117188 100.863281 130.652344 102.683594 C 131.1875 104.503906 134.433594 105.667969 136.003906 106.761719 C 139.382812 106.054688 141.660156 105.707031 143.859375 105.082031 Z M 105.84375 133.203125 C 106.15625 119.558594 95.351562 108.246094 81.707031 107.929688 C 81.621094 107.929688 81.535156 107.925781 81.449219 107.925781 C 66.953125 107.304688 54.695312 118.550781 54.078125 133.050781 C 54.0625 133.359375 54.054688 133.667969 54.054688 133.980469 C 54.21875 147.640625 65.25 158.671875 78.914062 158.839844 C 94.375 158.839844 105.742188 147.988281 105.863281 133.222656 Z M 128.8125 130.886719 C 128.554688 157.964844 106.539062 179.980469 79.925781 179.78125 C 52.082031 179.582031 30.117188 157.964844 30.335938 131.054688 C 30.554688 104.148438 53.585938 81.960938 80.941406 82.179688 C 107.339844 82.136719 128.777344 103.503906 128.820312 129.902344 C 128.820312 130.230469 128.820312 130.558594 128.8125 130.886719 "/></symbol>',
    '<symbol id="i-esp-partage" viewBox="12.87 -3.23 107.61 122.26"><path fill="rgb(10.196078%,10.196078%,10.196078%)" d="M 100.917969 36.683594 C 100.660156 28.882812 95.359375 24.0625 89.917969 24.25 C 85.601562 24.402344 82.261719 29.25 82.550781 34.890625 C 82.769531 39.050781 89.550781 44.78125 93.851562 43.203125 C 97.078125 41.972656 99.378906 38.183594 100.917969 36.683594 M 75.71875 62.050781 C 74.25 52.621094 71.859375 49.652344 65.28125 49.691406 C 60.089844 49.691406 57.28125 53.691406 57.398438 60.882812 C 57.5 66.882812 61.871094 70.582031 69.398438 69.320312 C 71.828125 68.972656 73.628906 64.59375 75.71875 62.050781 Z M 52.121094 25.792969 C 52.269531 19.351562 48.121094 14.691406 42.019531 14.492188 C 36.898438 14.320312 32.109375 19.632812 32.019531 25.550781 C 31.960938 30.410156 37.929688 35.300781 44.121094 35.472656 C 49.511719 35.621094 52 32.632812 52.121094 25.792969 M 102.621094 89.792969 C 102.511719 83.921875 97 76.851562 92.621094 76.933594 C 87.148438 77.03125 82.621094 83.390625 82.980469 90.550781 C 83.191406 94.972656 88.308594 98.953125 93.871094 98.992188 C 99.429688 99.03125 102.730469 95.472656 102.621094 89.792969 M 54.53125 84.84375 L 53.441406 84.0625 C 53.375 82.804688 53.234375 81.550781 53.019531 80.3125 C 51.738281 74.570312 46.882812 70.324219 41.019531 69.820312 C 35.859375 69.453125 31.859375 71.203125 30.019531 76.28125 C 27.71875 82.550781 31.199219 86.691406 35.648438 90.332031 C 36.542969 91.226562 37.617188 91.925781 38.800781 92.382812 C 41.800781 93.152344 45.800781 95.042969 47.800781 93.84375 C 50.789062 92.03125 52.359375 87.972656 54.53125 84.84375 M 86.941406 54.132812 C 86.558594 58.070312 86.191406 62.011719 85.761719 66.511719 C 87.167969 66.390625 88.511719 66.300781 89.851562 66.160156 C 101.417969 64.972656 110.261719 71.851562 113.339844 84.441406 C 115.949219 95.070312 110.25 106.710938 100.601562 110.441406 C 90.210938 114.5 74.808594 105.792969 71.199219 93.621094 C 70.199219 90.222656 69.871094 86.621094 69.121094 82.472656 L 65.039062 82 C 63.539062 87.402344 62.871094 92.542969 60.738281 97 C 56.199219 106.5 45.539062 109.820312 36 105.390625 C 23.78125 99.710938 17.398438 88.5 18.78125 75.132812 C 19.78125 65.683594 28.28125 58.53125 38.210938 58.890625 C 40.28125 58.972656 42.351562 59.222656 44.667969 59.421875 L 48.179688 46.621094 C 36.878906 47.621094 27.898438 43.671875 22.101562 33.953125 C 18.28125 27.550781 21.261719 21.152344 22.859375 14.953125 C 25.121094 6.210938 38.167969 1.300781 48.859375 4.800781 C 62.378906 9.230469 66.058594 20.300781 59.5 37.640625 L 71.570312 39.09375 C 71.449219 30.832031 71.699219 22.210938 78.710938 16.800781 C 82.03125 14.242188 87.351562 12.980469 91.648438 13.222656 C 104.828125 13.953125 113.359375 23.703125 112.210938 35.460938 C 110.929688 48.160156 101.308594 55.351562 86.941406 54.132812 "/></symbol>',
    '<symbol id="i-esp-reunion_privee" viewBox="2.06 -1.69 174.55 244.73"><path fill="rgb(10.196078%,10.196078%,10.196078%)" d="M 94.402344 7.371094 C 92.171875 9.371094 88.199219 11.113281 87.96875 13.292969 C 86.460938 27.460938 85.570312 41.710938 85.050781 55.953125 C 84.992188 57.652344 88.378906 59.480469 90.160156 61.25 C 91.710938 59.382812 94.339844 57.660156 94.601562 55.632812 C 95.878906 45.851562 96.679688 35.992188 97.308594 26.140625 C 97.671875 20.390625 97.371094 14.601562 97.371094 8.820312 Z M 128.539062 27.890625 C 121.082031 37.511719 113.539062 47.113281 106.671875 57.121094 C 105.007812 59.542969 104.050781 65.070312 105.460938 66.480469 C 108.992188 70.011719 112.1875 65.921875 114.929688 63.5625 C 116.566406 61.925781 118.035156 60.132812 119.320312 58.210938 C 124.980469 50.921875 130.679688 43.660156 136.242188 36.300781 C 138.71875 33.03125 140.910156 29.550781 143.390625 25.933594 C 136.660156 21.441406 132.140625 23.273438 128.539062 27.910156 Z M 39.921875 24.972656 C 42.660156 30.621094 45.960938 35.980469 49.769531 40.972656 C 54.769531 47.480469 60.492188 53.433594 65.769531 59.691406 C 68.179688 62.53125 70.589844 65.691406 74.652344 62.839844 C 78.960938 59.792969 77.152344 56.113281 74.550781 53 C 65.628906 42.335938 56.628906 31.722656 47.550781 21.160156 C 46.371094 19.792969 44.6875 18.863281 41.609375 16.453125 C 40.78125 20.273438 39.070312 23.261719 39.921875 24.972656 M 29.300781 210.441406 C 29.410156 222.601562 30.460938 223.441406 41.480469 221.910156 C 45.652344 221.339844 49.902344 221.433594 54.089844 221 C 85.089844 217.773438 116.089844 214.402344 147.089844 211.3125 C 151.019531 210.910156 152.949219 209.589844 152.96875 205.671875 C 152.96875 203.140625 153.429688 200.523438 152.871094 198.121094 C 152.582031 196.863281 150.53125 195.050781 149.332031 195.121094 C 131 195.75 112.640625 196.230469 94.332031 197.589844 C 75.21875 199 56.1875 201.640625 37.082031 203.042969 C 30.921875 203.460938 27.757812 204.730469 29.300781 210.441406 M 24.589844 84.78125 C 24.589844 89.402344 24.492188 92.050781 24.589844 94.691406 C 25.402344 113.242188 26.402344 131.792969 27.039062 150.351562 C 27.429688 161.742188 27.429688 173.140625 27.320312 184.542969 C 27.257812 190.132812 29.320312 191.660156 34.96875 191.171875 C 71.339844 187.992188 107.730469 184.902344 144.152344 182.402344 C 151.152344 181.921875 152.550781 179.402344 152.359375 173.261719 C 151.558594 147.710938 151.109375 122.152344 150.492188 96.601562 C 150.4375 94.832031 150.03125 93.082031 149.558594 89.691406 L 143.390625 96.980469 C 138.21875 103.089844 133.199219 109.320312 127.839844 115.242188 C 124.839844 118.5625 121.507812 117.972656 118.609375 114.640625 C 114.308594 109.703125 110.039062 104.730469 105.609375 99.882812 C 101.4375 95.300781 97.121094 90.882812 92.390625 85.882812 C 89.980469 89.441406 88.199219 92.023438 86.449219 94.621094 C 81.289062 102.332031 76.179688 110.082031 70.96875 117.761719 C 68.789062 120.980469 65.96875 121.371094 62.800781 119.132812 C 60.902344 117.800781 59.078125 116.367188 57.339844 114.832031 C 47 105.300781 36.582031 95.761719 24.589844 84.78125 M 65.371094 106.332031 C 71.300781 97.441406 76.769531 89.210938 82.28125 81.011719 C 83.808594 78.730469 85.28125 76.421875 87.03125 74.292969 C 91.03125 69.292969 94.75 69.140625 99.089844 73.902344 C 105.910156 81.390625 112.691406 88.902344 119.210938 96.660156 C 123.03125 101.191406 125.421875 100.660156 128.789062 95.960938 C 135.171875 87.070312 141.859375 78.351562 149.070312 70.132812 C 153.660156 64.890625 158.480469 66.492188 160.378906 73.402344 C 161.429688 77.277344 162.097656 81.246094 162.378906 85.25 C 165.007812 121.890625 167.550781 158.53125 164.671875 195.25 C 164.050781 203.25 163.75 211.25 163.492188 219.25 C 163.351562 223.441406 161.160156 224.25 157.371094 224.53125 C 124.949219 226.871094 92.558594 229.453125 60.152344 231.902344 C 51.152344 232.582031 42.039062 233.300781 32.980469 233.613281 C 22.042969 233.972656 20.160156 232.441406 18.851562 221.261719 C 17.371094 208.472656 16.011719 195.632812 15.410156 182.78125 C 13.792969 148.203125 12.601562 113.601562 11.269531 79.011719 C 11.128906 76.902344 11.195312 74.785156 11.46875 72.691406 C 12.46875 66.800781 17.582031 64.261719 22.71875 67.152344 C 24.722656 68.316406 26.574219 69.730469 28.230469 71.351562 C 39.378906 81.980469 50.460938 92.683594 61.582031 103.351562 C 62.492188 104.230469 63.539062 104.902344 65.371094 106.332031 "/></symbol>',
    '<symbol id="i-soleil" viewBox="0 0 191 178"><path fill="rgb(0%,35.686275%,13.333333%)" d="M 31.738281 41.210938 C 38.699219 52.425781 45.9375 63.476562 53.015625 74.621094 C 55.007812 77.734375 57.722656 80.527344 60.972656 77.746094 C 62.40625 76.523438 62.316406 71.777344 61.164062 69.570312 C 55.644531 58.988281 49.71875 48.597656 43.523438 38.394531 C 41.214844 34.921875 38.402344 31.8125 35.179688 29.167969 C 34.113281 28.222656 31.609375 28.351562 30.007812 28.820312 C 29.074219 29.097656 28.617188 31.015625 27.910156 32.261719 C 29.222656 35.53125 30.078125 38.632812 31.699219 41.25 Z M 193.601562 149.601562 C 193.9375 148.386719 191.757812 145.464844 190.128906 144.839844 C 175.332031 139.101562 160.464844 133.53125 145.4375 128.421875 C 143.230469 127.664062 138.617188 128.777344 137.691406 130.410156 C 135.40625 134.546875 138.957031 136.734375 142.527344 138.097656 C 153.464844 142.261719 164.402344 146.4375 175.339844 150.484375 C 179.4375 152.007812 183.664062 153.191406 189.085938 154.921875 C 190.585938 153.269531 192.960938 151.6875 193.558594 149.601562 Z M 122.847656 82.339844 C 130.117188 72.625 137.316406 62.839844 144.316406 52.933594 C 146.566406 49.914062 148.324219 46.558594 149.527344 42.988281 C 150.171875 40.882812 148.890625 38.1875 148.460938 35.761719 C 146.554688 36.4375 143.886719 36.546875 142.855469 37.898438 C 133.902344 49.671875 125.152344 61.644531 116.492188 73.699219 C 115.058594 75.6875 113.65625 78.191406 113.507812 80.527344 C 113.410156 82.578125 115.140625 84.714844 116.492188 87.859375 C 119.484375 85.261719 121.503906 84.070312 122.847656 82.339844 M 100.691406 14.660156 C 99.308594 14.390625 96.246094 16.875 95.808594 18.636719 C 91.898438 34.210938 88.339844 49.871094 84.871094 65.542969 C 83.875 69.878906 83.957031 74.621094 89.414062 75.597656 C 95.28125 76.640625 95.949219 71.378906 96.753906 67.402344 C 98.324219 59.617188 99.476562 51.761719 100.730469 43.925781 C 101.984375 36.089844 103.277344 28.234375 104.828125 18.6875 C 103.953125 17.710938 102.558594 15.015625 100.710938 14.660156 Z M 143.835938 105.082031 C 152.070312 102.714844 160.367188 100.496094 168.46875 97.742188 C 175.164062 95.449219 181.71875 92.757812 188.089844 89.679688 C 189.480469 89 189.78125 86.058594 190.585938 84.160156 C 188.867188 83.484375 186.945312 81.921875 185.445312 82.25 C 170.160156 85.652344 154.9375 89.300781 139.703125 93.050781 C 137.433594 93.503906 135.335938 94.574219 133.636719 96.140625 C 132.003906 97.882812 130.117188 100.863281 130.652344 102.683594 C 131.1875 104.503906 134.433594 105.667969 136.003906 106.761719 C 139.382812 106.054688 141.660156 105.707031 143.859375 105.082031 Z M 105.84375 133.203125 C 106.15625 119.558594 95.351562 108.246094 81.707031 107.929688 C 81.621094 107.929688 81.535156 107.925781 81.449219 107.925781 C 66.953125 107.304688 54.695312 118.550781 54.078125 133.050781 C 54.0625 133.359375 54.054688 133.667969 54.054688 133.980469 C 54.21875 147.640625 65.25 158.671875 78.914062 158.839844 C 94.375 158.839844 105.742188 147.988281 105.863281 133.222656 Z M 128.8125 130.886719 C 128.554688 157.964844 106.539062 179.980469 79.925781 179.78125 C 52.082031 179.582031 30.117188 157.964844 30.335938 131.054688 C 30.554688 104.148438 53.585938 81.960938 80.941406 82.179688 C 107.339844 82.136719 128.777344 103.503906 128.820312 129.902344 C 128.820312 130.230469 128.820312 130.558594 128.8125 130.886719 "/></symbol>',
    '<symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></symbol>',
    '<symbol id="i-play" viewBox="0 0 24 24"><path d="M6 3.5 20 12 6 20.5z"/></symbol>',
    '<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>',
    '<symbol id="i-minus" viewBox="0 0 24 24"><path d="M5 12h14"/></symbol>',
    '<symbol id="i-x" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></symbol>',
    '<symbol id="i-plan" viewBox="0 0 24 24"><path d="M15 5.5 9 3 3 5.5v15L9 18l6 2.5 6-2.5v-15L15 5.5z"/><path d="M9 3v15M15 5.5v15"/></symbol>',
    '<symbol id="i-roots" viewBox="0 0 24 24"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></symbol>',
    '<symbol id="i-roam" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5"/><path d="M16.2 7.8 14.1 14.1 7.8 16.2 9.9 9.9z"/></symbol>',
    '<symbol id="i-carte" viewBox="0 0 24 24"><path d="M3 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3z"/></symbol>',
    '<symbol id="i-ticket" viewBox="0 0 24 24"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2M13 11v2M13 17v2"/></symbol>',
    '<symbol id="i-calendrier" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></symbol>',
    '<symbol id="i-chevron" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></symbol>',
    '<symbol id="i-table" viewBox="0 0 24 24"><path d="M20 10c0 6.2-8 12-8 12s-8-5.8-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></symbol>',
    '<symbol id="i-sac" viewBox="0 0 24 24"><path d="M6 2 3 6.5V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.5L18 2z"/><path d="M3 6.5h18"/><path d="M16 10.5a4 4 0 0 1-8 0"/></symbol>'
  ].join('');

  function sprite() {
    if (document.getElementById('roots-planche')) return;
    var hote = document.createElement('div');
    hote.id = 'roots-planche';
    hote.setAttribute('aria-hidden', 'true');
    hote.style.display = 'none';
    hote.innerHTML = '<svg>' + PLANCHE + '</svg>';
    document.body.insertAdjacentElement('afterbegin', hote);
  }


  /* Une bande qui defile a l'horizontale doit pouvoir s'attraper. Au doigt, le
     navigateur s'en charge ; a la souris, rien ne l'attrape et la molette
     verticale ne la concerne pas. On rend les deux gestes disponibles, et un
     glissement ne se termine jamais en clic sur l'element survole. */
  function glisser(bande) {
    if (!bande || bande.dataset.glisse) return;
    bande.dataset.glisse = '1';
    var actif = false, departX = 0, departScroll = 0, bouge = false;

    function suivre(e) {
      if (!actif) return;
      var d = e.clientX - departX;
      if (Math.abs(d) > 3) bouge = true;
      bande.scrollLeft = departScroll - d;
      e.preventDefault();
    }
    function relacher() {
      if (!actif) return;
      actif = false;
      bande.classList.remove('glisse');
      window.removeEventListener('pointermove', suivre);
      window.removeEventListener('pointerup', relacher);
      window.removeEventListener('pointercancel', relacher);
    }
    bande.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;
      if (bande.scrollWidth <= bande.clientWidth) return;
      actif = true;
      bouge = false;
      departX = e.clientX;
      departScroll = bande.scrollLeft;
      bande.classList.add('glisse');
      window.addEventListener('pointermove', suivre);
      window.addEventListener('pointerup', relacher);
      window.addEventListener('pointercancel', relacher);
    });
    bande.addEventListener('click', function (e) {
      if (!bouge) return;
      bouge = false;
      e.stopPropagation();
      e.preventDefault();
    }, true);
    bande.addEventListener('wheel', function (e) {
      if (bande.scrollWidth <= bande.clientWidth) return;
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY) || !e.deltaY) return;
      bande.scrollLeft += e.deltaY;
      e.preventDefault();
    }, { passive: false });
  }

  /* ------------------------------------------------------------------
     LA POSE DE LA COQUE HORS LIGNE.
     Elle est ICI, et non dans un script en ligne de chaque ecran, pour une
     raison mecanique : roots.js est un fichier EXTERNE, couvert par
     script-src 'self'. Aucun condensat de politique de securite ne bouge.
     Et roots.js est charge par les six ecrans publics et par aucun autre :
     payer.html ne le charge pas, hors-ligne.html non plus. La liste des
     ecrans qui posent la coque est donc tenue par le chargement lui-meme,
     et il n'y a aucune liste a maintenir a cote.
     La pose attend le chargement complet : elle ne dispute jamais le reseau
     au premier affichage.
     ------------------------------------------------------------------ */
  function poserCoque() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js', { scope: './' })['catch'](function (e) {
        /* Une coque qui ne se pose pas n'empeche rien de fonctionner : on
           ne rend pas l'application dependante d'elle. On le dit, et on
           continue. */
        if (window.console) console.warn('[Roots] coque non posee :', e && e.message);
      });
    });
  }

  /* L'ordre de retrait, a la main depuis la console d'un testeur bloque :
       Roots.retirerCoque()
     Il desinstalle la coque, vide tous ses caches, et recharge. Il doit
     exister des la pose : une coque deja installee chez un client ne
     disparait PAS quand sw.js disparait du serveur — elle continue de
     repondre jusqu'a ce qu'on lui ordonne de partir. */
  function retirerCoque() {
    if (!('serviceWorker' in navigator)) return false;
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage('roots:retirer');
      return true;
    }
    navigator.serviceWorker.getRegistrations().then(function (rs) {
      rs.forEach(function (r) { r.unregister(); });
      if (window.caches) caches.keys().then(function (ks) {
        ks.forEach(function (k) { caches['delete'](k); });
      });
      location.reload();
    });
    return true;
  }

  global.Roots = global.Roots || {};
  global.Roots.sprite = sprite;
  global.Roots.glisser = glisser;
  global.Roots.retirerCoque = retirerCoque;

  poserCoque();
})(window);
