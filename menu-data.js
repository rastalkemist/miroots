/* ==========================================================================
   menu-data.js — SOURCE UNIQUE de la carte du Roots (Menu V12).
   Lu par index.html (onglet Commander, compact) ET carte.html (détaillé).
   Préfigure la table `menu` de Supabase : à terme, remplacer ce fichier par
   un fetch de l'API — le reste du code ne bouge pas.
   Édition : { id, nom:{fr,en}, desc:{fr,en} (optionnel), prix }.
   Termes du terroir (ayimolou, wangashi, soto…) gardés tels quels.
   ========================================================================== */
var MENU=[
 {id:'chaud',t:{fr:'Boissons chaudes & petit déj',en:'Hot drinks & breakfast'},articles:[
  {id:'infusion',nom:{fr:'Infusion maison | Thé',en:'House infusion | Tea'},prix:1000},
  {id:'cafe',nom:{fr:'Café moulu',en:'Ground coffee'},prix:1000},
  {id:'expresso',nom:{fr:'Expresso',en:'Espresso'},prix:1500},
  {id:'chocolat',nom:{fr:'Chocolat chaud',en:'Hot chocolate'},prix:1500},
  {id:'bouillie',nom:{fr:'Bouillie locale',en:'Local porridge'},prix:500},
  {id:'tapioca',nom:{fr:'Tapioca | Riz | Quaker au lait',en:'Tapioca | Rice | Quaker with milk'},prix:1000},
  {id:'omelette',nom:{fr:'Omelette | au plat | brouillés',en:'Omelette | fried | scrambled eggs'},prix:1000},
  {id:'continental',nom:{fr:'Petit déj continental',en:'Continental breakfast'},
   desc:{fr:'Boisson chaude, pain, œufs, beurre/confiture, fruits coupés/jus',en:'Hot drink, bread, eggs, butter/jam, cut fruits/juice'},prix:3000}]},
 {id:'cheznous',t:{fr:'De chez nous',en:'From home'},articles:[
  {id:'ayimolou',nom:{fr:'Ayimolou | Atassi',en:'Ayimolou | Atassi'},
   desc:{fr:'Riz aux haricots, friture de tomate, maca, gari, plantain frit, poisson frit, œuf, wangashi',
         en:'Rice and beans, tomato sauce, spaghetti, gari, fried plantain, fried fish, egg, wangashi'},prix:2500},
  {id:'rizyawa',nom:{fr:'Le riz de Yawa',en:"Yawa's rice"},
   desc:{fr:'Riz, piment vert, sardine',en:'Rice, green chili, sardine'},prix:1500},
  {id:'agou',nom:{fr:"Les délices d'Agou",en:'Agou delights'},
   desc:{fr:'Igname bouillie, œufs brouillés…',en:'Boiled yam, scrambled eggs…'},prix:1500},
  {id:'gari',nom:{fr:'Gari gnignan',en:'Gari gnignan'},
   desc:{fr:'Semoule de manioc, omelette, piment vert, oignons et tomates',
         en:'Cassava semolina, omelette, green chili, onions and tomatoes'},prix:1500}]},
 {id:'sandwichs',t:{fr:'Sandwichs',en:'Sandwiches'},articles:[
  {id:'cotonois',nom:{fr:'Cotonois',en:'Cotonois'},
   desc:{fr:'Crudités, viande hachée',en:'Raw veggies, minced meat'},prix:2000},
  {id:'peuhl',nom:{fr:'Peuhl',en:'Fulani'},
   desc:{fr:'Crudités, fromage wangashi',en:'Raw veggies, wangashi cheese'},prix:2000},
  {id:'parisien',nom:{fr:'Parisien',en:'Parisian'},
   desc:{fr:'Beurre, jambon, emmental',en:'Butter, ham, Emmental'},prix:2000}]},
 {id:'salades',t:{fr:'Salades',en:'Salads'},articles:[
  {id:'ecoliere',nom:{fr:"L'écolière",en:'Classic Avocado'},
   desc:{fr:'Avocat, tomates, oignons, sardine/œuf dur',en:'Avocado, tomatoes, onions, sardine/boiled egg'},prix:1500},
  {id:'sahelienne',nom:{fr:'La Sahélienne',en:'Sahelian'},
   desc:{fr:'Laitue, carottes, tomates, maïs doux, cornichons, wangashi',
         en:'Lettuce, carrots, tomatoes, sweet corn, pickles, wangashi'},prix:2500},
  {id:'fresh',nom:{fr:'La Fresh',en:'La Fresh'},
   desc:{fr:'Riz/pasta, concombre, carottes, mangue/melon, tomates, poulet',
         en:'Rice/pasta, cucumber, carrots, mango/melon, tomatoes, chicken'},prix:2500}]},
 {id:'brochettes',t:{fr:'Brochettes',en:'Skewers'},articles:[
  {id:'br-wangashi',nom:{fr:'Brochette de wangashi',en:'Wangashi skewer'},desc:{fr:'La tige',en:'Per stick'},prix:1000},
  {id:'br-boeuf',nom:{fr:'Brochette de filet de bœuf',en:'Beef fillet skewer'},desc:{fr:'La tige',en:'Per stick'},prix:1000},
  {id:'br-soja',nom:{fr:'Brochette de soja',en:'Soy skewer'},desc:{fr:'La tige',en:'Per stick'},prix:500}]},
 {id:'accompagnements',t:{fr:'Accompagnements',en:'Sides'},articles:[
  {id:'ac-riz',nom:{fr:'Riz',en:'Rice'},prix:1000},
  {id:'ac-legumes',nom:{fr:'Légumes sautés',en:'Sautéed vegetables'},prix:1000},
  {id:'ac-pommes',nom:{fr:'Pommes sautées',en:'Sautéed potatoes'},prix:1000},
  {id:'ac-frites',nom:{fr:'Frites',en:'Fries'},desc:{fr:'Igname, pomme de terre ou patate douce',en:'Yam, potato or sweet potato'},prix:1000},
  {id:'ac-amadan',nom:{fr:'Amadan',en:'Amadan'},desc:{fr:'Plantain frit',en:'Fried plantain'},prix:1000}]},
 {id:'desserts',t:{fr:'Desserts',en:'Desserts'},articles:[
  {id:'fruits',nom:{fr:'Salade de fruits',en:'Fruit salad'},desc:{fr:'Selon saison',en:'Seasonal'},prix:1000},
  {id:'laitcaille',nom:{fr:'Lait caillé façon Yawa',en:"Yawa's curdled milk"},
   desc:{fr:'Fruits frais, topping au choix : coco râpé, kluiklui, cocanda…',
         en:'Fresh fruits, topping of your choice: grated coconut, kluiklui, cocanda…'},prix:1500}]},
 {id:'boissons',t:{fr:'Boissons',en:'Drinks'},articles:[
  {id:'eau03',nom:{fr:'Eau 0,3 L',en:'Water 0.3 L'},prix:300},
  {id:'eau15',nom:{fr:'Eau 1,5 L',en:'Water 1.5 L'},prix:1000},
  {id:'limonade',nom:{fr:'Limonade',en:'Lemonade'},prix:500},
  {id:'bissap',nom:{fr:'Bissap de Yawa',en:"Yawa's bissap"},prix:500},
  {id:'ananas',nom:{fr:"Jus d'ananas",en:'Pineapple juice'},prix:1200},
  {id:'orange',nom:{fr:"Jus d'orange",en:'Orange juice'},prix:1200},
  {id:'pasteque',nom:{fr:'Jus de pastèque',en:'Watermelon juice'},prix:1200},
  {id:'gingembre',nom:{fr:'Jus de gingembre',en:'Ginger juice'},prix:2000},
  {id:'coca',nom:{fr:'Coca',en:'Coke'},prix:1000},
  {id:'sobebra',nom:{fr:'Sucrerie Sobebra',en:'Sobebra soft drink'},prix:1000},
  {id:'chill',nom:{fr:'Chill Citron',en:'Chill Citron'},prix:1000},
  {id:'beninoise',nom:{fr:'Béninoise',en:'Béninoise'},prix:1000},
  {id:'beaufort',nom:{fr:'Beaufort',en:'Beaufort'},prix:1000},
  {id:'tequila',nom:{fr:'Tequila',en:'Tequila'},prix:1000}]},
 {id:'shots',t:{fr:'Shots — les Soto',en:'Shots — the Soto'},articles:[
  {id:'sweetsoto',nom:{fr:'Sweet Soto',en:'Sweet Soto'},
   desc:{fr:'Liqueur de vin de palme macéré de dattes & de souchet',en:'Palm-wine liqueur infused with dates & tiger nut'},prix:1000},
  {id:'softsoto',nom:{fr:'Soft Soto',en:'Soft Soto'},
   desc:{fr:'Liqueur de vin de palme, dattes, café de dattes & poivre africain',en:'Palm-wine liqueur, dates, date-coffee & African pepper'},prix:1000},
  {id:'spicysoto',nom:{fr:'Spicy Soto',en:'Spicy Soto'},
   desc:{fr:'Liqueur de vin de palme macéré de dattes et de piment',en:'Palm-wine liqueur infused with dates & chili'},prix:1000}]}
];
