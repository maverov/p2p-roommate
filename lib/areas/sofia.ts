// Neighborhood area data for Sofia.

import type { Locale } from "./locales";

export type LocalizedString = Record<Locale, string>;

export type NeighborhoodGroupId =
  | "center"
  | "south"
  | "east"
  | "west"
  | "north"
  | "south-belt";

export type NeighborhoodGroup = {
  id: NeighborhoodGroupId;
  label: LocalizedString;
};

export type Neighborhood = {
  id: string;
  groupId: NeighborhoodGroupId;
  label: LocalizedString;
};

export const sofiaNeighborhoodGroups: NeighborhoodGroup[] = [
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
  {
    id: "south-belt",
    label: {
      en: "Southern belt and nearby settlements",
      bg: "Южна яка и близки населени места",
    },
  },
];

export const sofiaNeighborhoods: Neighborhood[] = [
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
    id: "oborishte",
    groupId: "center",
    label: {
      en: "Oborishte",
      bg: "Оборище",
    },
  },
  {
    id: "doctors-garden",
    groupId: "center",
    label: {
      en: "Doctor's Garden",
      bg: "Докторски паметник",
    },
  },
  {
    id: "banishora",
    groupId: "center",
    label: {
      en: "Banishora",
      bg: "Банишора",
    },
  },
  {
    id: "zona-b-5",
    groupId: "center",
    label: {
      en: "Zona B-5",
      bg: "Зона Б-5",
    },
  },
  {
    id: "zona-b-17",
    groupId: "center",
    label: {
      en: "Zona B-17",
      bg: "Зона Б-17",
    },
  },
  {
    id: "zona-b-18",
    groupId: "center",
    label: {
      en: "Zona B-18",
      bg: "Зона Б-18",
    },
  },
  {
    id: "zona-b-19",
    groupId: "center",
    label: {
      en: "Zona B-19",
      bg: "Зона Б-19",
    },
  },
  {
    id: "medical-academy",
    groupId: "center",
    label: {
      en: "Medical Academy",
      bg: "Медицинска академия",
    },
  },

  // 2. Southern and popular areas
  {
    id: "lozenets",
    groupId: "south",
    label: {
      en: "Lozenets",
      bg: "Лозенец",
    },
  },
  {
    id: "studentski-grad",
    groupId: "south",
    label: {
      en: "Studentski Grad",
      bg: "Студентски град",
    },
  },
  {
    id: "iztok",
    groupId: "south",
    label: {
      en: "Iztok",
      bg: "Изток",
    },
  },
  {
    id: "izgrev",
    groupId: "south",
    label: {
      en: "Izgrev",
      bg: "Изгрев",
    },
  },
  {
    id: "dianabad",
    groupId: "south",
    label: {
      en: "Dianabad",
      bg: "Дианабад",
    },
  },
  {
    id: "ivan-vazov",
    groupId: "south",
    label: {
      en: "Ivan Vazov",
      bg: "Иван Вазов",
    },
  },
  {
    id: "hladilnika",
    groupId: "south",
    label: {
      en: "Hladilnika",
      bg: "Хладилника",
    },
  },
  {
    id: "krastova-vada",
    groupId: "south",
    label: {
      en: "Krastova Vada",
      bg: "Кръстова вада",
    },
  },
  {
    id: "manastirski-livadi",
    groupId: "south",
    label: {
      en: "Manastirski Livadi",
      bg: "Манастирски ливади",
    },
  },
  {
    id: "vitosha",
    groupId: "south",
    label: {
      en: "Vitosha",
      bg: "Витоша",
    },
  },
  {
    id: "malinova-dolina",
    groupId: "south",
    label: {
      en: "Malinova Dolina",
      bg: "Малинова долина",
    },
  },
  {
    id: "strelbishte",
    groupId: "south",
    label: {
      en: "Strelbishte",
      bg: "Стрелбище",
    },
  },
  {
    id: "belite-brezi",
    groupId: "south",
    label: {
      en: "Belite Brezi",
      bg: "Белите брези",
    },
  },
  {
    id: "borovo",
    groupId: "south",
    label: {
      en: "Borovo",
      bg: "Борово",
    },
  },
  {
    id: "gotse-delchev",
    groupId: "south",
    label: {
      en: "Gotse Delchev",
      bg: "Гоце Делчев",
    },
  },
  {
    id: "hipodruma",
    groupId: "south",
    label: {
      en: "Hipodruma",
      bg: "Хиподрума",
    },
  },
  {
    id: "krasno-selo",
    groupId: "south",
    label: {
      en: "Krasno Selo",
      bg: "Красно село",
    },
  },
  {
    id: "lagera",
    groupId: "south",
    label: {
      en: "Lagera",
      bg: "Лагера",
    },
  },
  {
    id: "arsenalski",
    groupId: "south",
    label: {
      en: "Arsenalski",
      bg: "Арсеналски",
    },
  },

  // 3. Eastern areas
  {
    id: "mladost-1",
    groupId: "east",
    label: {
      en: "Mladost 1",
      bg: "Младост 1",
    },
  },
  {
    id: "mladost-1a",
    groupId: "east",
    label: {
      en: "Mladost 1A",
      bg: "Младост 1А",
    },
  },
  {
    id: "mladost-2",
    groupId: "east",
    label: {
      en: "Mladost 2",
      bg: "Младост 2",
    },
  },
  {
    id: "mladost-3",
    groupId: "east",
    label: {
      en: "Mladost 3",
      bg: "Младост 3",
    },
  },
  {
    id: "mladost-4",
    groupId: "east",
    label: {
      en: "Mladost 4",
      bg: "Младост 4",
    },
  },
  {
    id: "musagenitsa",
    groupId: "east",
    label: {
      en: "Musagenitsa",
      bg: "Мусагеница",
    },
  },
  {
    id: "darvenitsa",
    groupId: "east",
    label: {
      en: "Darvenitsa",
      bg: "Дървеница",
    },
  },
  {
    id: "poligona",
    groupId: "east",
    label: {
      en: "Poligona",
      bg: "Полигона",
    },
  },
  {
    id: "druzhba-1",
    groupId: "east",
    label: {
      en: "Druzhba 1",
      bg: "Дружба 1",
    },
  },
  {
    id: "druzhba-2",
    groupId: "east",
    label: {
      en: "Druzhba 2",
      bg: "Дружба 2",
    },
  },
  {
    id: "geo-milev",
    groupId: "east",
    label: {
      en: "Geo Milev",
      bg: "Гео Милев",
    },
  },
  {
    id: "reduta",
    groupId: "east",
    label: {
      en: "Reduta",
      bg: "Редута",
    },
  },
  {
    id: "slatina",
    groupId: "east",
    label: {
      en: "Slatina",
      bg: "Слатина",
    },
  },
  {
    id: "yavorov",
    groupId: "east",
    label: {
      en: "Yavorov",
      bg: "Яворов",
    },
  },
  {
    id: "poduyane",
    groupId: "east",
    label: {
      en: "Poduyane",
      bg: "Подуяне",
    },
  },
  {
    id: "suhata-reka",
    groupId: "east",
    label: {
      en: "Suhata Reka",
      bg: "Сухата река",
    },
  },
  {
    id: "hadzhi-dimitar",
    groupId: "east",
    label: {
      en: "Hadzhi Dimitar",
      bg: "Хаджи Димитър",
    },
  },
  {
    id: "levski-v",
    groupId: "east",
    label: {
      en: "Levski V",
      bg: "Левски В",
    },
  },
  {
    id: "levski-g",
    groupId: "east",
    label: {
      en: "Levski G",
      bg: "Левски Г",
    },
  },
  {
    id: "levski-g-1",
    groupId: "east",
    label: {
      en: "Levski G-1",
      bg: "Левски Г-1",
    },
  },

  // 4. Western areas
  {
    id: "lyulin-1",
    groupId: "west",
    label: {
      en: "Lyulin 1",
      bg: "Люлин 1",
    },
  },
  {
    id: "lyulin-2",
    groupId: "west",
    label: {
      en: "Lyulin 2",
      bg: "Люлин 2",
    },
  },
  {
    id: "lyulin-3",
    groupId: "west",
    label: {
      en: "Lyulin 3",
      bg: "Люлин 3",
    },
  },
  {
    id: "lyulin-4",
    groupId: "west",
    label: {
      en: "Lyulin 4",
      bg: "Люлин 4",
    },
  },
  {
    id: "lyulin-5",
    groupId: "west",
    label: {
      en: "Lyulin 5",
      bg: "Люлин 5",
    },
  },
  {
    id: "lyulin-6",
    groupId: "west",
    label: {
      en: "Lyulin 6",
      bg: "Люлин 6",
    },
  },
  {
    id: "lyulin-7",
    groupId: "west",
    label: {
      en: "Lyulin 7",
      bg: "Люлин 7",
    },
  },
  {
    id: "lyulin-8",
    groupId: "west",
    label: {
      en: "Lyulin 8",
      bg: "Люлин 8",
    },
  },
  {
    id: "lyulin-9",
    groupId: "west",
    label: {
      en: "Lyulin 9",
      bg: "Люлин 9",
    },
  },
  {
    id: "lyulin-10",
    groupId: "west",
    label: {
      en: "Lyulin 10",
      bg: "Люлин 10",
    },
  },
  {
    id: "sveta-troitsa",
    groupId: "west",
    label: {
      en: "Sveta Troitsa",
      bg: "Света Троица",
    },
  },
  {
    id: "ilinden",
    groupId: "west",
    label: {
      en: "Ilinden",
      bg: "Илинден",
    },
  },
  {
    id: "gevgelijski",
    groupId: "west",
    label: {
      en: "Gevgelijski",
      bg: "Гевгелийски",
    },
  },
  {
    id: "zapaden-park",
    groupId: "west",
    label: {
      en: "Zapaden Park",
      bg: "Западен парк",
    },
  },
  {
    id: "zaharna-fabrika",
    groupId: "west",
    label: {
      en: "Zaharna Fabrika",
      bg: "Захарна фабрика",
    },
  },
  {
    id: "krasna-polyana-1",
    groupId: "west",
    label: {
      en: "Krasna Polyana 1",
      bg: "Красна поляна 1",
    },
  },
  {
    id: "krasna-polyana-2",
    groupId: "west",
    label: {
      en: "Krasna Polyana 2",
      bg: "Красна поляна 2",
    },
  },
  {
    id: "krasna-polyana-3",
    groupId: "west",
    label: {
      en: "Krasna Polyana 3",
      bg: "Красна поляна 3",
    },
  },
  {
    id: "fondovi-zhilishta",
    groupId: "west",
    label: {
      en: "Fondovi Zhilishta",
      bg: "Фондови жилища",
    },
  },
  {
    id: "moderno-predgradie",
    groupId: "west",
    label: {
      en: "Moderno Predgradie",
      bg: "Модерно предградие",
    },
  },
  {
    id: "ovcha-kupel",
    groupId: "west",
    label: {
      en: "Ovcha Kupel",
      bg: "Овча купел",
    },
  },
  {
    id: "ovcha-kupel-1",
    groupId: "west",
    label: {
      en: "Ovcha Kupel 1",
      bg: "Овча купел 1",
    },
  },
  {
    id: "ovcha-kupel-2",
    groupId: "west",
    label: {
      en: "Ovcha Kupel 2",
      bg: "Овча купел 2",
    },
  },
  {
    id: "gorna-banya",
    groupId: "west",
    label: {
      en: "Gorna Banya",
      bg: "Горна баня",
    },
  },

  // 5. Northern areas
  {
    id: "nadezhda-1",
    groupId: "north",
    label: {
      en: "Nadezhda 1",
      bg: "Надежда 1",
    },
  },
  {
    id: "nadezhda-2",
    groupId: "north",
    label: {
      en: "Nadezhda 2",
      bg: "Надежда 2",
    },
  },
  {
    id: "nadezhda-3",
    groupId: "north",
    label: {
      en: "Nadezhda 3",
      bg: "Надежда 3",
    },
  },
  {
    id: "nadezhda-4",
    groupId: "north",
    label: {
      en: "Nadezhda 4",
      bg: "Надежда 4",
    },
  },
  {
    id: "svoboda",
    groupId: "north",
    label: {
      en: "Svoboda",
      bg: "Свобода",
    },
  },
  {
    id: "lev-tolstoy",
    groupId: "north",
    label: {
      en: "Lev Tolstoy",
      bg: "Лев Толстой",
    },
  },
  {
    id: "vrabnitsa-1",
    groupId: "north",
    label: {
      en: "Vrabnitsa 1",
      bg: "Връбница 1",
    },
  },
  {
    id: "vrabnitsa-2",
    groupId: "north",
    label: {
      en: "Vrabnitsa 2",
      bg: "Връбница 2",
    },
  },
  {
    id: "obelya-1",
    groupId: "north",
    label: {
      en: "Obelya 1",
      bg: "Обеля 1",
    },
  },
  {
    id: "obelya-2",
    groupId: "north",
    label: {
      en: "Obelya 2",
      bg: "Обеля 2",
    },
  },
  {
    id: "triagalnika",
    groupId: "north",
    label: {
      en: "Triagalnika",
      bg: "Триъгълника",
    },
  },
  {
    id: "orlandovtsi",
    groupId: "north",
    label: {
      en: "Orlandovtsi",
      bg: "Орландовци",
    },
  },
  {
    id: "benkovski",
    groupId: "north",
    label: {
      en: "Benkovski",
      bg: "Бенковски",
    },
  },
  {
    id: "malashevtsi",
    groupId: "north",
    label: {
      en: "Malashevtsi",
      bg: "Малашевци",
    },
  },
  {
    id: "iliyantsi",
    groupId: "north",
    label: {
      en: "Iliyantsi",
      bg: "Илиянци",
    },
  },
  {
    id: "voenna-rampa",
    groupId: "north",
    label: {
      en: "Voenna Rampa",
      bg: "Военна рампа",
    },
  },
  {
    id: "trebich",
    groupId: "north",
    label: {
      en: "Trebich",
      bg: "Требич",
    },
  },

  // 6. Southern belt and nearby settlements
  {
    id: "boyana",
    groupId: "south-belt",
    label: {
      en: "Boyana",
      bg: "Бояна",
    },
  },
  {
    id: "dragalevtsi",
    groupId: "south-belt",
    label: {
      en: "Dragalevtsi",
      bg: "Драгалевци",
    },
  },
  {
    id: "simeonovo",
    groupId: "south-belt",
    label: {
      en: "Simeonovo",
      bg: "Симеоново",
    },
  },
  {
    id: "knyazhevo",
    groupId: "south-belt",
    label: {
      en: "Knyazhevo",
      bg: "Княжево",
    },
  },
  {
    id: "pavlovo",
    groupId: "south-belt",
    label: {
      en: "Pavlovo",
      bg: "Павлово",
    },
  },
  {
    id: "bukston",
    groupId: "south-belt",
    label: {
      en: "Bukston",
      bg: "Бъкстон",
    },
  },
  {
    id: "pancharevo",
    groupId: "south-belt",
    label: {
      en: "Pancharevo",
      bg: "Панчарево",
    },
  },
  {
    id: "bistritsa",
    groupId: "south-belt",
    label: {
      en: "Bistritsa",
      bg: "Бистрица",
    },
  },
  {
    id: "lozen",
    groupId: "south-belt",
    label: {
      en: "Lozen",
      bg: "Лозен",
    },
  },
  {
    id: "german",
    groupId: "south-belt",
    label: {
      en: "German",
      bg: "Герман",
    },
  },
  {
    id: "zheleznitsa",
    groupId: "south-belt",
    label: {
      en: "Zheleznitsa",
      bg: "Железница",
    },
  },
  {
    id: "kokalyane",
    groupId: "south-belt",
    label: {
      en: "Kokalyane",
      bg: "Кокаляне",
    },
  },
  {
    id: "kazichene",
    groupId: "south-belt",
    label: {
      en: "Kazichene",
      bg: "Казичене",
    },
  },
  {
    id: "vladaia",
    groupId: "south-belt",
    label: {
      en: "Vladaia",
      bg: "Владая",
    },
  },
  {
    id: "marchaево",
    groupId: "south-belt",
    label: {
      en: "Marchaevo",
      bg: "Мърчаево",
    },
  },
  {
    id: "bankya",
    groupId: "south-belt",
    label: {
      en: "Bankya",
      bg: "Банкя",
    },
  },
];
