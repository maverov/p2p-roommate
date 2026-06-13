// packages/shared/src/areas/plovdiv.ts

import type { NeighborhoodGroup, Neighborhood } from "./types";

export const plovdivNeighborhoodGroups: NeighborhoodGroup[] = [
  {
    id: "center",
    label: {
      en: "Center",
      bg: "Център",
    },
  },
  {
    id: "south",
    label: {
      en: "Southern areas",
      bg: "Южни райони",
    },
  },
  {
    id: "east",
    label: {
      en: "Eastern areas",
      bg: "Източни райони",
    },
  },
  {
    id: "west",
    label: {
      en: "Western areas",
      bg: "Западни райони",
    },
  },
  {
    id: "north",
    label: {
      en: "Northern areas",
      bg: "Северни райони",
    },
  },
];

export const plovdivNeighborhoods: Neighborhood[] = [
  // 1. Center
  {
    id: "ideal-center",
    groupId: "center",
    label: {
      en: "Ideal Center",
      bg: "Идеален център",
    },
  },
  {
    id: "wide-center",
    groupId: "center",
    label: {
      en: "Wide Center",
      bg: "Широк център",
    },
  },
  {
    id: "old-town",
    groupId: "center",
    label: {
      en: "Old Town",
      bg: "Стария град",
    },
  },
  {
    id: "marasha",
    groupId: "center",
    label: {
      en: "Marasha",
      bg: "Мараша",
    },
  },
  {
    id: "vmi",
    groupId: "center",
    label: {
      en: "Medical University (VMI)",
      bg: "ВМИ / Медицински университет",
    },
  },
  {
    id: "mladezhki-halm",
    groupId: "center",
    label: {
      en: "Mladezhki Halm",
      bg: "Младежки хълм",
    },
  },
  {
    id: "sahat-tepe",
    groupId: "center",
    label: {
      en: "Sahat Tepe",
      bg: "Сахат тепе",
    },
  },

  // 2. North
  {
    id: "karshiyaka",
    groupId: "north",
    label: {
      en: "Karshiyaka",
      bg: "Кършияка",
    },
  },
  {
    id: "gagarin",
    groupId: "north",
    label: {
      en: "Gagarin",
      bg: "Гагарин",
    },
  },
  {
    id: "filipovo",
    groupId: "north",
    label: {
      en: "Filipovo",
      bg: "Филипово",
    },
  },
  {
    id: "zaharna-fabrika",
    groupId: "north",
    label: {
      en: "Zaharna Fabrika",
      bg: "Захарна фабрика",
    },
  },

  // 3. South
  {
    id: "kyuchuk-parizh",
    groupId: "south",
    label: {
      en: "Kyuchuk Parizh",
      bg: "Кючук Париж",
    },
  },
  {
    id: "ostromila",
    groupId: "south",
    label: {
      en: "Ostromila",
      bg: "Остромила",
    },
  },
  {
    id: "belomorski",
    groupId: "south",
    label: {
      en: "Belomorski",
      bg: "Беломорски",
    },
  },

  // 4. East
  {
    id: "trakiya",
    groupId: "east",
    label: {
      en: "Trakiya",
      bg: "Тракия",
    },
  },
  {
    id: "kamenitsa-1",
    groupId: "east",
    label: {
      en: "Kamenitsa 1",
      bg: "Каменица 1",
    },
  },
  {
    id: "kamenitsa-2",
    groupId: "east",
    label: {
      en: "Kamenitsa 2",
      bg: "Каменица 2",
    },
  },
  {
    id: "gladno-pole",
    groupId: "east",
    label: {
      en: "Gladno Pole",
      bg: "Гладно поле",
    },
  },
  {
    id: "izgrev",
    groupId: "east",
    label: {
      en: "Izgrev",
      bg: "Изгрев",
    },
  },

  // 5. West
  {
    id: "hristo-smirnenski",
    groupId: "west",
    label: {
      en: "Hristo Smirnenski",
      bg: "Христо Смирненски",
    },
  },
  {
    id: "otdih-i-kultura",
    groupId: "west",
    label: {
      en: "Otdih i Kultura",
      bg: "Отдих и култура",
    },
  },
  {
    id: "proslav",
    groupId: "west",
    label: {
      en: "Proslav",
      bg: "Прослав",
    },
  },
];