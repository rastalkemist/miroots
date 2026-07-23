/* ==========================================================================
   roots.js — Socle partagé de l'app Mi Roots (mi.roots.bj).
   UN SEUL fichier pour tout le comportement réutilisé entre les pages :
     • Roots.initTelRoots(input)  → champ téléphone international (intl-tel-input)
     • Roots.initChrome(opts)     → chrome de navigation (toggle Mi/NU, super-nav,
                                     menu déroulant haut-droite, toast)

   À inclure sur chaque page, dans le <head>, AVANT le <script> de page :
     <link  rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@25/build/css/intlTelInput.css">
     <script src="https://cdn.jsdelivr.net/npm/intl-tel-input@25/build/js/intlTelInput.min.js" defer></script>
     <script src="roots.js"></script>
   (les styles .iti et .chrome-* restent dans chaque page — ils ont une variante
    fond clair / fond jardin selon l'écran.)

   Toutes les fonctions sont rangées sous window.Roots — une seule porte d'entrée,
   pas de variables globales éparpillées.
   ========================================================================== */
(function (global) {
  'use strict';

  /* ----------------------------------------------------------------------
     TÉLÉPHONE — champ international, version de référence (issue de retrouver).
     Pays auto par géoloc (Bénin en repli), indicatif à part, pas de barre de
     recherche (pays fréquents épinglés), formatage local par pays. Placeholder
     Bénin explicite « 01 XX XX XX XX » (on ne pré-remplit plus « 01 » pour
     laisser voir les 8 chiffres attendus).
     ---------------------------------------------------------------------- */
  function initTelRoots(input) {
    if (!input) return null;
    if (!global.intlTelInput) { input.placeholder = '01 XX XX XX XX'; return null; }
    var iti = global.intlTelInput(input, {
      initialCountry: 'auto',
      geoIpLookup: function (success) {
        fetch('https://ipapi.co/json/').then(function (r) { return r.json(); })
          .then(function (d) { success((d && d.country_code) ? d.country_code.toLowerCase() : 'bj'); })
          .catch(function () { success('bj'); });
      },
      separateDialCode: true,
      countrySearch: false,
      countryOrder: ['bj', 'ng', 'tg', 'gh', 'ci', 'ne', 'bf', 'sn', 'fr', 'be', 'us', 'ca', 'gb', 'de'],
      customPlaceholder: function (exemple, pays) { return (pays && pays.iso2 === 'bj') ? '01 XX XX XX XX' : exemple; },
      loadUtils: function () { return import('https://cdn.jsdelivr.net/npm/intl-tel-input@25/build/js/utils.js'); }
    });
    /* au changement de pays, on repart d'un champ vide (le format change) */
    input.addEventListener('countrychange', function () { input.value = ''; });
    return iti;
  }

  /* ----------------------------------------------------------------------
     CHROME — navigation partagée. Câble le toggle Mi/NU, le super-nav
     Roam·Roots·Road, le menu déroulant haut-droite et le toast, à partir des
     mêmes IDs présents sur chaque page.

     opts = {
       getLangue   : () => 'fr' | 'en'                       (requis)
       getSections : (langue) => [ {ico,t,s,href}, ... ]     (pour le menu)
       toastNu     : (langue) => 'texte'                     (mode NU dormant)
       toastVerbe  : (langue, labelVerbe) => 'texte'         (Road/Roam dormants)
       verbes      : { roots:'Roots', road:'Road', roam:'Roam' }   (libellés)
       onVerbe     : (verbe, bouton) => true|false   (optionnel : gère un verbe
                     spécifique à la page ; retourner true = déjà géré)
     }
     Retourne { toast, dessinerSections, fermerMenu } pour usage par la page
     (ex. appeler dessinerSections() au changement de langue).
     ---------------------------------------------------------------------- */
  function initChrome(opts) {
    opts = opts || {};
    var getLangue = opts.getLangue || function () { return 'fr'; };
    var getSections = opts.getSections || function () { return []; };
    var toastNu = opts.toastNu || function () { return ''; };
    var toastVerbe = opts.toastVerbe || function (l, v) { return v; };
    var verbes = opts.verbes || { roots: 'Roots', road: 'Road', roam: 'Roam' };
    var onVerbe = opts.onVerbe || null;

    function icones() { if (global.lucide) global.lucide.createIcons(); }

    /* --- toast --- */
    var toastTimer = null;
    function toast(msg) {
      var el = document.getElementById('toast');
      if (!el) return;
      el.textContent = msg;
      el.classList.add('visible');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { el.classList.remove('visible'); }, 2600);
    }

    /* --- toggle Mi/NU (la pastille s'étire ; NU dormant) ---
       À l'ouverture, on synchronise la classe « deploie » sur la barre : le CSS
       de chaque page fait alors fondre le reste (titre, langue, menu — et l'ankh
       sur petit écran) pour laisser la place à la pastille dépliée. */
    var marque = document.getElementById('marque');
    if (marque) {
      var inner = marque.closest('.chrome-inner');
      var syncDeploie = function () {
        if (inner) inner.classList.toggle('deploie', marque.classList.contains('ouvert'));
      };
      var mot = document.getElementById('motMode');
      if (mot) mot.addEventListener('click', function (e) { e.stopPropagation(); marque.classList.toggle('ouvert'); syncDeploie(); });
      var sw = document.getElementById('switchMode');
      if (sw) sw.addEventListener('click', function (e) { e.stopPropagation(); toast(toastNu(getLangue())); });
      var nu = marque.querySelector('.nu');
      if (nu) nu.addEventListener('click', function (e) { e.stopPropagation(); toast(toastNu(getLangue())); });
      document.addEventListener('click', function (e) { if (!marque.contains(e.target)) { marque.classList.remove('ouvert'); syncDeploie(); } });
    }

    /* --- super-nav Roam·Roots·Road --- */
    var superNav = document.getElementById('superNav');
    if (superNav) superNav.addEventListener('click', function (e) {
      var b = e.target.closest('.verbe'); if (!b) return;
      var v = b.dataset.verbe;
      if (onVerbe && onVerbe(v, b)) return;
      if (v === 'roots') { global.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      toast(toastVerbe(getLangue(), verbes[v]));
    });

    /* --- menu déroulant haut-droite --- */
    var voile = document.getElementById('voileMenu');
    var drawer = document.getElementById('drawer');
    var burger = document.getElementById('btnBurger');
    function fermerMenu() {
      if (drawer) drawer.classList.remove('visible');
      if (voile) voile.classList.remove('visible');
    }
    if (burger && drawer) burger.addEventListener('click', function () {
      drawer.classList.add('visible');
      if (voile) voile.classList.add('visible');
      icones();
    });
    var btnFermer = document.getElementById('fermerMenu');
    if (btnFermer) btnFermer.addEventListener('click', fermerMenu);
    if (voile) voile.addEventListener('click', fermerMenu);

    function dessinerSections() {
      var cont = document.getElementById('sections');
      if (!cont) return;
      var liste = getSections(getLangue()) || [];
      cont.innerHTML = liste.map(function (s) {
        return '<a class="lien-section" href="' + s.href + '"><span class="ico"><i data-lucide="' + s.ico + '">•</i></span><span class="txt">' + s.t + '<small>' + s.s + '</small></span><i data-lucide="chevron-right">›</i></a>';
      }).join('');
      icones();
    }
    dessinerSections();

    return { toast: toast, dessinerSections: dessinerSections, fermerMenu: fermerMenu };
  }

  global.Roots = { initTelRoots: initTelRoots, initChrome: initChrome };
})(window);
