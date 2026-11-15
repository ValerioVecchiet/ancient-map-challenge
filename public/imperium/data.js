const REGIONS = {
  hispania: { name: 'Hispania', capital: 'Tarraco', position: { left: 13, top: 53 } },
  gallia: { name: 'Gallia', capital: 'Lugdunum', position: { left: 24.5, top: 32.5 } },
  britannia: { name: 'Britannia', capital: 'Londinium', position: { left: 20.8, top: 11.3 } },
  italia: { name: 'Italia', capital: 'Roma', position: { left: 45.3, top: 52.9 } },
  africa: { name: 'Africa Proconsolare', capital: 'Cartagine', position: { left: 33.3, top: 72.6 } },
  numidia: { name: 'Numidia', capital: 'Cirta', position: { left: 20.8, top: 71 } },
  mauretania: { name: 'Mauretania', capital: 'Volubilis', position: { left: 6.8, top: 72.6 } },
  cirenaica: { name: 'Cirenaica e Tripolitania', capital: 'Cirene', position: { left: 62, top: 85 } },
  egitto: { name: 'Egitto', capital: 'Alessandria', position: { left: 81.2, top: 87 } },
  acaia: { name: 'Acaia', capital: 'Corinto', position: { left: 60.9, top: 64.2 } },
  asia: { name: 'Asia Minore', capital: 'Efeso', position: { left: 75.5, top: 54.4 } },
  siria: { name: 'Siria', capital: 'Antiochia', position: { left: 89.6, top: 62 } },
};

const PERIODS = [
  {
    id: 'repubblica',
    year: '150 a.C.',
    title: 'Repubblica Romana',
    description: 'Roma è la potenza emergente del Mediterraneo: Cartagine è appena caduta e le legioni avanzano in Grecia e in Spagna.',
    regions: ['hispania', 'gallia', 'italia', 'africa', 'numidia', 'acaia', 'asia'],
  },
  {
    id: 'augusto',
    year: '14 d.C.',
    title: 'Impero di Augusto',
    description: 'Alla morte del primo imperatore, le province si consolidano: dal Nord Africa all’Egitto, fino alla Siria.',
    regions: ['hispania', 'gallia', 'italia', 'africa', 'numidia', 'mauretania', 'cirenaica', 'egitto', 'acaia', 'asia', 'siria'],
  },
  {
    id: 'traiano',
    year: '117 d.C.',
    title: 'Impero Romano al massimo splendore',
    description: 'Con Traiano l’Impero raggiunge la massima estensione: dalla Britannia all’Egitto, ogni regione del Mediterraneo è sotto il controllo di Roma.',
    regions: Object.keys(REGIONS),
  },
];
