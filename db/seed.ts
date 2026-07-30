/**
 * Development seed — `pnpm db:seed`.
 *
 * Every row id is prefixed `seed-`, and the script deletes that prefix before
 * inserting, so it is safe to run repeatedly and never touches real data.
 *
 * Standalone script, so it builds its own postgres client rather than importing
 * `@/db` (that module is marked `server-only` and only resolves inside Next).
 */

import { hashPassword } from 'better-auth/crypto';
import { like } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  account,
  conversationParticipants,
  conversations,
  favorites,
  listingImages,
  listings,
  messages,
  reviews,
  savedSearches,
  user,
  userProfiles,
  viewingRequests,
} from './schema';

const SEED_PASSWORD = 'password123';
const CURRENCY = 'BGN';

/** Anchors relative dates so re-seeding always produces "available soon" listings. */
const now = new Date();
const daysFromNow = (days: number) =>
  new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
const monthsAgo = (months: number) => {
  const date = new Date(now);
  date.setMonth(date.getMonth() - months);
  return date;
};

const imageUrl = (seed: string, index: number) =>
  `https://picsum.photos/seed/${seed}-${index}/1200/800`;

type SeedUser = {
  id: string;
  name: string;
  email: string;
  bio: string;
  phoneNumber: string;
  citySlug: string;
  neighborhoodSlug: string | null;
  isVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  publicContactAllowed: boolean;
  responseTimeMinutes: number;
  responseRate: number;
  successfulRentals: number;
  traits: string[];
  languages: string[];
  roommatePreferences: Record<string, unknown>;
  joinedMonthsAgo: number;
};

const SEED_USERS: SeedUser[] = [
  {
    id: 'seed-user-maria',
    name: 'Мария Петрова',
    email: 'maria@stay.bg',
    bio: 'Здравейте! Казвам се Мария и отдавам апартаментите си под наем в Лозенец. Стремя се да поддържам чиста и спокойна среда, в която наемателите да се чувстват като у дома си. Обичам реда, комуникацията и коректните хора.',
    phoneNumber: '+359 88 123 4567',
    citySlug: 'sofia',
    neighborhoodSlug: 'lozenets',
    isVerified: true,
    phoneVerified: true,
    identityVerified: true,
    publicContactAllowed: true,
    responseTimeMinutes: 120,
    responseRate: 96,
    successfulRentals: 28,
    traits: [
      'Собственик',
      'Непушач',
      'Пет-френдли',
      'Работи от офис',
      'Чистота: висок стандарт',
      'Предпочита спокойна среда',
      'Общителна',
      'Редовен график',
      'Уважава личното пространство',
    ],
    languages: ['Български', 'Английски'],
    roommatePreferences: {
      gender: 'ANY',
      smoking: false,
      pets: true,
      quietHoursFrom: '23:00',
      budgetMinCents: 30_000,
      budgetMaxCents: 70_000,
      ageMin: 22,
      ageMax: 35,
      occupation: 'Работещи / студенти',
      environment: 'Спокойна и чиста среда',
    },
    joinedMonthsAgo: 40,
  },
  {
    id: 'seed-user-ivan',
    name: 'Иван Иванов',
    email: 'ivan@stay.bg',
    bio: 'Отдавам два имота в центъра на София. Отговарям бързо и държа на ясни условия от самото начало.',
    phoneNumber: '+359 88 234 5678',
    citySlug: 'sofia',
    neighborhoodSlug: 'ideal-center',
    isVerified: true,
    phoneVerified: true,
    identityVerified: false,
    publicContactAllowed: true,
    responseTimeMinutes: 45,
    responseRate: 92,
    successfulRentals: 14,
    traits: ['Собственик', 'Непушач', 'Бърз отговор', 'Ясни условия'],
    languages: ['Български', 'Английски', 'Немски'],
    roommatePreferences: {
      gender: 'ANY',
      smoking: false,
      pets: false,
      quietHoursFrom: '22:00',
      occupation: 'Работещи',
    },
    joinedMonthsAgo: 26,
  },
  {
    id: 'seed-user-georgi',
    name: 'Георги Колев',
    email: 'georgi@stay.bg',
    bio: 'Инвестирам в имоти в южните квартали на София. Всички обяви са с реални снимки и без скрити такси.',
    phoneNumber: '+359 88 345 6789',
    citySlug: 'sofia',
    neighborhoodSlug: 'krastova-vada',
    isVerified: true,
    phoneVerified: true,
    identityVerified: true,
    publicContactAllowed: false,
    responseTimeMinutes: 240,
    responseRate: 88,
    successfulRentals: 9,
    traits: ['Собственик', 'Реални снимки', 'Без комисиона'],
    languages: ['Български'],
    roommatePreferences: { gender: 'ANY', smoking: false, pets: false },
    joinedMonthsAgo: 18,
  },
  {
    id: 'seed-user-elena',
    name: 'Елена Димитрова',
    email: 'elena@stay.bg',
    bio: 'Управлявам няколко апартамента, подходящи за съквартиранти и студенти. Гъвкава съм за срока на наема.',
    phoneNumber: '+359 88 456 7890',
    citySlug: 'sofia',
    neighborhoodSlug: 'lozenets',
    isVerified: true,
    phoneVerified: false,
    identityVerified: false,
    publicContactAllowed: false,
    responseTimeMinutes: 180,
    responseRate: 79,
    successfulRentals: 6,
    traits: ['Собственик', 'Подходящо за студенти', 'Гъвкав срок'],
    languages: ['Български', 'Английски'],
    roommatePreferences: { gender: 'ANY', smoking: false, pets: true },
    joinedMonthsAgo: 11,
  },
  {
    id: 'seed-user-petar',
    name: 'Петър Николов',
    email: 'petar@stay.bg',
    bio: 'Отдавам семейния си апартамент в Овча купел. Предпочитам дългосрочни наематели.',
    phoneNumber: '+359 88 567 8901',
    citySlug: 'sofia',
    neighborhoodSlug: 'ovcha-kupel',
    isVerified: true,
    phoneVerified: true,
    identityVerified: false,
    publicContactAllowed: true,
    responseTimeMinutes: 300,
    responseRate: 71,
    successfulRentals: 3,
    traits: ['Собственик', 'Дългосрочен наем'],
    languages: ['Български'],
    roommatePreferences: { gender: 'ANY', smoking: false, pets: false },
    joinedMonthsAgo: 7,
  },
  {
    id: 'seed-user-desislava',
    name: 'Десислава Стоянова',
    email: 'desislava@stay.bg',
    bio: 'Търся стая в Студентски град или Лозенец. Работя от офис, тиха съм и обичам реда.',
    phoneNumber: '+359 88 678 9012',
    citySlug: 'sofia',
    neighborhoodSlug: 'studentski-grad',
    isVerified: true,
    phoneVerified: true,
    identityVerified: false,
    publicContactAllowed: false,
    responseTimeMinutes: 60,
    responseRate: 94,
    successfulRentals: 2,
    traits: ['Наемател', 'Непушач', 'Ранобудна', 'Без домашни любимци'],
    languages: ['Български', 'Английски'],
    roommatePreferences: {
      gender: 'ANY',
      smoking: false,
      pets: false,
      budgetMinCents: 30_000,
      budgetMaxCents: 60_000,
    },
    joinedMonthsAgo: 9,
  },
  {
    id: 'seed-user-simona',
    name: 'Симона Тодорова',
    email: 'simona@stay.bg',
    bio: 'Живях под наем в София 3 години. Оставям честни ревюта за наемодателите, с които съм работила.',
    phoneNumber: '+359 88 789 0123',
    citySlug: 'sofia',
    neighborhoodSlug: 'ivan-vazov',
    isVerified: true,
    phoneVerified: false,
    identityVerified: false,
    publicContactAllowed: false,
    responseTimeMinutes: 90,
    responseRate: 85,
    successfulRentals: 1,
    traits: ['Наемател', 'Непушач'],
    languages: ['Български', 'Английски'],
    roommatePreferences: { gender: 'WOMEN_ONLY', smoking: false, pets: true },
    joinedMonthsAgo: 30,
  },
  {
    id: 'seed-user-andrey',
    name: 'Андрей Кръстев',
    email: 'andrey@stay.bg',
    bio: 'Студент по архитектура. Търся тихо място за живеене близо до университета.',
    phoneNumber: '+359 88 890 1234',
    citySlug: 'sofia',
    neighborhoodSlug: 'studentski-grad',
    isVerified: false,
    phoneVerified: false,
    identityVerified: false,
    publicContactAllowed: false,
    responseTimeMinutes: 150,
    responseRate: 62,
    successfulRentals: 1,
    traits: ['Наемател', 'Студент'],
    languages: ['Български'],
    roommatePreferences: { gender: 'ANY', smoking: false, pets: false },
    joinedMonthsAgo: 14,
  },
];

type SeedListing = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  propertyType: 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'ROOM';
  roommatePreference: 'ANY' | 'STUDENTS' | 'PROFESSIONALS' | 'WOMEN_ONLY' | 'MEN_ONLY';
  citySlug: string;
  neighborhoodSlug: string;
  addressLine: string;
  monthlyRentCents: number;
  depositCents: number;
  bedroomCount: number;
  bathroomCount: number;
  maxOccupants: number;
  sizeSqm: number;
  floor: number;
  totalFloors: number;
  latitude: number;
  longitude: number;
  isVerified: boolean;
  isFurnished: boolean;
  internetIncluded: boolean;
  utilitiesIncluded: boolean;
  petsAllowed: boolean;
  nearMetro: boolean;
  roommateFriendly: boolean;
  availableInDays: number;
  amenities: string[];
  rules: string[];
  imageCount: number;
  publishedDaysAgo: number;
};

const SEED_LISTINGS: SeedListing[] = [
  {
    id: 'seed-listing-01',
    ownerId: 'seed-user-maria',
    title: 'Светла стая в Лозенец с балкон',
    description:
      'Светла и просторна стая с балкон в спокоен район на Лозенец. Апартаментът се споделя с едно момиче, работещо на пълен работен ден. Кухня и баня са общи. Включени са ток, вода и интернет.\n\nСтаята е обзаведена с двойно легло, гардероб, бюро и стол. Балконът гледа към вътрешен двор, така че е много тихо дори през летните месеци. До метростанция Европейски съюз се стига за 2 минути пеша.',
    propertyType: 'ROOM',
    roommatePreference: 'ANY',
    citySlug: 'sofia',
    neighborhoodSlug: 'lozenets',
    addressLine: 'кв. Лозенец',
    monthlyRentCents: 42_000,
    depositCents: 84_000,
    bedroomCount: 1,
    bathroomCount: 1,
    maxOccupants: 1,
    sizeSqm: 18,
    floor: 3,
    totalFloors: 6,
    latitude: 42.6704,
    longitude: 23.3223,
    isVerified: true,
    isFurnished: true,
    internetIncluded: true,
    utilitiesIncluded: true,
    petsAllowed: true,
    nearMetro: true,
    roommateFriendly: true,
    availableInDays: 14,
    amenities: [
      'Балкон',
      'Обзаведена',
      'Бюро за работа',
      'Пералня',
      'Климатик',
      'Асансьор',
      'Интернет включен',
    ],
    rules: [
      'Забранено пушенето',
      'Тихи часове след 23:00',
      'Гости с предупреждение',
      'Двойки — ОК',
      'Допускат се домашни любимци',
      'Работещи / студенти',
    ],
    imageCount: 9,
    publishedDaysAgo: 3,
  },
  {
    id: 'seed-listing-02',
    ownerId: 'seed-user-maria',
    title: 'Голям самостоятелен апартамент в Лозенец',
    description:
      'Просторен тристаен апартамент с две спални и голяма гостна. Подходящ за двама съквартиранти или семейство. Напълно обзаведен, с ново оборудвана кухня и две тераси.',
    propertyType: 'APARTMENT',
    roommatePreference: 'PROFESSIONALS',
    citySlug: 'sofia',
    neighborhoodSlug: 'lozenets',
    addressLine: 'кв. Лозенец',
    monthlyRentCents: 110_000,
    depositCents: 220_000,
    bedroomCount: 3,
    bathroomCount: 2,
    maxOccupants: 4,
    sizeSqm: 78,
    floor: 5,
    totalFloors: 8,
    latitude: 42.6721,
    longitude: 23.3269,
    isVerified: true,
    isFurnished: true,
    internetIncluded: true,
    utilitiesIncluded: false,
    petsAllowed: false,
    nearMetro: true,
    roommateFriendly: true,
    availableInDays: 40,
    amenities: ['Две тераси', 'Обзаведен', 'Пералня', 'Съдомиялна', 'Климатик', 'Асансьор'],
    rules: ['Забранено пушенето', 'Без домашни любимци', 'Тихи часове след 22:00'],
    imageCount: 7,
    publishedDaysAgo: 9,
  },
  {
    id: 'seed-listing-03',
    ownerId: 'seed-user-maria',
    title: 'Студио до Южен парк',
    description:
      'Компактно студио на 5 минути от Южен парк. Идеално за един човек, който работи от дома — има обособено работно място до прозореца.',
    propertyType: 'STUDIO',
    roommatePreference: 'ANY',
    citySlug: 'sofia',
    neighborhoodSlug: 'hladilnika',
    addressLine: 'кв. Хладилника',
    monthlyRentCents: 65_000,
    depositCents: 65_000,
    bedroomCount: 1,
    bathroomCount: 1,
    maxOccupants: 2,
    sizeSqm: 32,
    floor: 2,
    totalFloors: 5,
    latitude: 42.6641,
    longitude: 23.3196,
    isVerified: true,
    isFurnished: true,
    internetIncluded: true,
    utilitiesIncluded: true,
    petsAllowed: true,
    nearMetro: false,
    roommateFriendly: false,
    availableInDays: 0,
    amenities: ['Обзаведено', 'Работно място', 'Пералня', 'Интернет включен'],
    rules: ['Забранено пушенето', 'Тихи часове след 23:00'],
    imageCount: 5,
    publishedDaysAgo: 21,
  },
  {
    id: 'seed-listing-04',
    ownerId: 'seed-user-ivan',
    title: 'Двустаен апартамент в Лозенец',
    description:
      'Двустаен апартамент след основен ремонт, с нова дограма и подово отопление в банята. Тих вътрешен двор, свободно паркиране на улицата.',
    propertyType: 'APARTMENT',
    roommatePreference: 'ANY',
    citySlug: 'sofia',
    neighborhoodSlug: 'lozenets',
    addressLine: 'кв. Лозенец',
    monthlyRentCents: 82_000,
    depositCents: 164_000,
    bedroomCount: 2,
    bathroomCount: 1,
    maxOccupants: 3,
    sizeSqm: 58,
    floor: 3,
    totalFloors: 6,
    latitude: 42.6689,
    longitude: 23.3241,
    isVerified: true,
    isFurnished: true,
    internetIncluded: false,
    utilitiesIncluded: false,
    petsAllowed: false,
    nearMetro: true,
    roommateFriendly: true,
    availableInDays: 14,
    amenities: ['Обзаведен', 'Нова дограма', 'Пералня', 'Климатик'],
    rules: ['Забранено пушенето', 'Без домашни любимци'],
    imageCount: 6,
    publishedDaysAgo: 2,
  },
  {
    id: 'seed-listing-05',
    ownerId: 'seed-user-ivan',
    title: 'Студио до НДК',
    description:
      'Студио в самия център, на две крачки от НДК и бул. Витоша. Подходящо за човек, който иска всичко на пешеходно разстояние.',
    propertyType: 'STUDIO',
    roommatePreference: 'ANY',
    citySlug: 'sofia',
    neighborhoodSlug: 'ideal-center',
    addressLine: 'Център',
    monthlyRentCents: 55_000,
    depositCents: 110_000,
    bedroomCount: 1,
    bathroomCount: 1,
    maxOccupants: 2,
    sizeSqm: 32,
    floor: 2,
    totalFloors: 5,
    latitude: 42.6866,
    longitude: 23.3186,
    isVerified: true,
    isFurnished: true,
    internetIncluded: true,
    utilitiesIncluded: false,
    petsAllowed: false,
    nearMetro: true,
    roommateFriendly: false,
    availableInDays: 18,
    amenities: ['Обзаведено', 'Близо до метро', 'Интернет включен'],
    rules: ['Забранено пушенето', 'Тихи часове след 22:00'],
    imageCount: 5,
    publishedDaysAgo: 6,
  },
  {
    id: 'seed-listing-06',
    ownerId: 'seed-user-georgi',
    title: 'Тристаен апартамент до метро Витоша',
    description:
      'Голям тристаен апартамент в нова сграда с портиер и подземен паркинг. Две спални с гардероби, обособена трапезария и голяма тераса на юг.',
    propertyType: 'APARTMENT',
    roommatePreference: 'PROFESSIONALS',
    citySlug: 'sofia',
    neighborhoodSlug: 'krastova-vada',
    addressLine: 'кв. Кръстова вада',
    monthlyRentCents: 115_000,
    depositCents: 230_000,
    bedroomCount: 3,
    bathroomCount: 2,
    maxOccupants: 4,
    sizeSqm: 92,
    floor: 4,
    totalFloors: 8,
    latitude: 42.6512,
    longitude: 23.3159,
    isVerified: true,
    isFurnished: true,
    internetIncluded: true,
    utilitiesIncluded: false,
    petsAllowed: true,
    nearMetro: true,
    roommateFriendly: true,
    availableInDays: 16,
    amenities: [
      'Обзаведен',
      'Подземен паркинг',
      'Портиер',
      'Тераса',
      'Съдомиялна',
      'Климатик',
      'Асансьор',
    ],
    rules: ['Забранено пушенето', 'Допускат се домашни любимци', 'Тихи часове след 22:00'],
    imageCount: 8,
    publishedDaysAgo: 1,
  },
  {
    id: 'seed-listing-07',
    ownerId: 'seed-user-desislava',
    title: 'Стая в апартамент за съквартирант',
    description:
      'Търся съквартирант за светъл двустаен апартамент в Студентски град. Стаята е обзаведена, общите части са поддържани. Наемът се дели наполовина.',
    propertyType: 'ROOM',
    roommatePreference: 'STUDENTS',
    citySlug: 'sofia',
    neighborhoodSlug: 'studentski-grad',
    addressLine: 'Студентски град',
    monthlyRentCents: 38_000,
    depositCents: 38_000,
    bedroomCount: 1,
    bathroomCount: 1,
    maxOccupants: 1,
    sizeSqm: 16,
    floor: 2,
    totalFloors: 4,
    latitude: 42.6503,
    longitude: 23.3491,
    isVerified: true,
    isFurnished: true,
    internetIncluded: true,
    utilitiesIncluded: true,
    petsAllowed: false,
    nearMetro: false,
    roommateFriendly: true,
    availableInDays: 14,
    amenities: ['Обзаведена', 'Интернет включен', 'Пералня', 'Бюро за работа'],
    rules: ['Забранено пушенето', 'Без домашни любимци', 'Подходящо за студенти'],
    imageCount: 4,
    publishedDaysAgo: 4,
  },
  {
    id: 'seed-listing-08',
    ownerId: 'seed-user-petar',
    title: 'Двустаен с тераса в Овча купел',
    description:
      'Просторен двустаен апартамент с голяма тераса и гледка към Витоша. Спокоен квартал, зелени площи и удобен транспорт до центъра.',
    propertyType: 'APARTMENT',
    roommatePreference: 'ANY',
    citySlug: 'sofia',
    neighborhoodSlug: 'ovcha-kupel',
    addressLine: 'кв. Овча купел',
    monthlyRentCents: 69_000,
    depositCents: 138_000,
    bedroomCount: 2,
    bathroomCount: 1,
    maxOccupants: 3,
    sizeSqm: 60,
    floor: 1,
    totalFloors: 5,
    latitude: 42.6817,
    longitude: 23.2494,
    isVerified: true,
    isFurnished: true,
    internetIncluded: false,
    utilitiesIncluded: false,
    petsAllowed: true,
    nearMetro: false,
    roommateFriendly: false,
    availableInDays: 25,
    amenities: ['Обзаведен', 'Голяма тераса', 'Гледка към Витоша', 'Пералня'],
    rules: ['Забранено пушенето', 'Допускат се домашни любимци'],
    imageCount: 6,
    publishedDaysAgo: 12,
  },
  {
    id: 'seed-listing-09',
    ownerId: 'seed-user-georgi',
    title: 'Модерен едностаен до метростанция',
    description:
      'Компактен едностаен апартамент в Банишора, на 4 минути от метростанция. Изцяло реновиран през 2024 г., с нови ел. и водни инсталации.',
    propertyType: 'APARTMENT',
    roommatePreference: 'ANY',
    citySlug: 'sofia',
    neighborhoodSlug: 'banishora',
    addressLine: 'кв. Банишора',
    monthlyRentCents: 45_000,
    depositCents: 45_000,
    bedroomCount: 1,
    bathroomCount: 1,
    maxOccupants: 2,
    sizeSqm: 28,
    floor: 6,
    totalFloors: 7,
    latitude: 42.7133,
    longitude: 23.3126,
    isVerified: true,
    isFurnished: true,
    internetIncluded: true,
    utilitiesIncluded: false,
    petsAllowed: false,
    nearMetro: true,
    roommateFriendly: false,
    availableInDays: 22,
    amenities: ['Обзаведен', 'Близо до метро', 'Асансьор', 'Реновиран 2024'],
    rules: ['Забранено пушенето', 'Без домашни любимци'],
    imageCount: 5,
    publishedDaysAgo: 8,
  },
  {
    id: 'seed-listing-10',
    ownerId: 'seed-user-elena',
    title: 'Четиристаен апартамент в Лозенец',
    description:
      'Голям четиристаен апартамент, подходящ за трима или четирима съквартиранти. Всяка спалня има отделен гардероб, а общата зона е просторна.',
    propertyType: 'APARTMENT',
    roommatePreference: 'STUDENTS',
    citySlug: 'sofia',
    neighborhoodSlug: 'lozenets',
    addressLine: 'кв. Лозенец',
    monthlyRentCents: 120_000,
    depositCents: 120_000,
    bedroomCount: 4,
    bathroomCount: 2,
    maxOccupants: 5,
    sizeSqm: 120,
    floor: 5,
    totalFloors: 7,
    latitude: 42.6698,
    longitude: 23.3305,
    isVerified: true,
    isFurnished: true,
    internetIncluded: true,
    utilitiesIncluded: false,
    petsAllowed: true,
    nearMetro: true,
    roommateFriendly: true,
    availableInDays: 30,
    amenities: ['Обзаведен', 'Паркомясто', 'Пералня', 'Съдомиялна', 'Климатик'],
    rules: ['Забранено пушенето', 'Допускат се домашни любимци', 'Подходящо за студенти'],
    imageCount: 7,
    publishedDaysAgo: 15,
  },
  {
    id: 'seed-listing-11',
    ownerId: 'seed-user-elena',
    title: 'Стая в общ апартамент в центъра',
    description:
      'Малка, но уютна стая в общ апартамент с още двама съквартиранти. Всички разходи са включени в наема. Отлична локация в центъра.',
    propertyType: 'ROOM',
    roommatePreference: 'ANY',
    citySlug: 'sofia',
    neighborhoodSlug: 'ideal-center',
    addressLine: 'Център',
    monthlyRentCents: 35_000,
    depositCents: 35_000,
    bedroomCount: 1,
    bathroomCount: 1,
    maxOccupants: 1,
    sizeSqm: 14,
    floor: 3,
    totalFloors: 6,
    latitude: 42.6934,
    longitude: 23.3245,
    isVerified: false,
    isFurnished: true,
    internetIncluded: true,
    utilitiesIncluded: true,
    petsAllowed: false,
    nearMetro: true,
    roommateFriendly: true,
    availableInDays: 14,
    amenities: ['Обзаведена', 'Всички разходи включени', 'Интернет включен'],
    rules: ['Забранено пушенето', 'Без домашни любимци', 'Тихи часове след 23:00'],
    imageCount: 4,
    publishedDaysAgo: 5,
  },
  {
    id: 'seed-listing-12',
    ownerId: 'seed-user-ivan',
    title: 'Слънчев апартамент в Кършияка',
    description:
      'Двустаен апартамент в Кършияка, Пловдив — на 10 минути пеша от центъра. Тих вход, ново обзавеждане и голяма кухня.',
    propertyType: 'APARTMENT',
    roommatePreference: 'ANY',
    citySlug: 'plovdiv',
    neighborhoodSlug: 'karshiyaka',
    addressLine: 'кв. Кършияка',
    monthlyRentCents: 62_000,
    depositCents: 62_000,
    bedroomCount: 2,
    bathroomCount: 1,
    maxOccupants: 3,
    sizeSqm: 65,
    floor: 4,
    totalFloors: 5,
    latitude: 42.1571,
    longitude: 24.7453,
    isVerified: true,
    isFurnished: true,
    internetIncluded: true,
    utilitiesIncluded: false,
    petsAllowed: true,
    nearMetro: false,
    roommateFriendly: true,
    availableInDays: 20,
    amenities: ['Обзаведен', 'Голяма кухня', 'Пералня', 'Тераса'],
    rules: ['Забранено пушенето', 'Допускат се домашни любимци'],
    imageCount: 6,
    publishedDaysAgo: 11,
  },
];

type SeedListingReview = {
  id: string;
  listingId: string;
  reviewerId: string;
  rating: number;
  body: string;
  monthsAgo: number;
};

const SEED_LISTING_REVIEWS: SeedListingReview[] = [
  {
    id: 'seed-review-l-01',
    listingId: 'seed-listing-01',
    reviewerId: 'seed-user-andrey',
    rating: 5,
    body: 'Страхотен наемодател, много отзивчива. Стаята е точно както на снимките.',
    monthsAgo: 4,
  },
  {
    id: 'seed-review-l-02',
    listingId: 'seed-listing-01',
    reviewerId: 'seed-user-simona',
    rating: 5,
    body: 'Живях тук 8 месеца. Тихо, чисто, добро местоположение. Препоръчвам!',
    monthsAgo: 6,
  },
  {
    id: 'seed-review-l-03',
    listingId: 'seed-listing-01',
    reviewerId: 'seed-user-desislava',
    rating: 4,
    body: 'Всичко беше наред. Бързи отговори и ясни условия.',
    monthsAgo: 9,
  },
  {
    id: 'seed-review-l-04',
    listingId: 'seed-listing-04',
    reviewerId: 'seed-user-simona',
    rating: 5,
    body: 'Апартаментът е в отлично състояние, ремонтът е качествен.',
    monthsAgo: 3,
  },
  {
    id: 'seed-review-l-05',
    listingId: 'seed-listing-06',
    reviewerId: 'seed-user-desislava',
    rating: 5,
    body: 'Нова сграда, много тихо. Паркингът е голям плюс.',
    monthsAgo: 2,
  },
  {
    id: 'seed-review-l-06',
    listingId: 'seed-listing-07',
    reviewerId: 'seed-user-andrey',
    rating: 4,
    body: 'Добра стая за студент. Близо до университета.',
    monthsAgo: 5,
  },
];

type SeedUserReview = {
  id: string;
  targetUserId: string;
  reviewerId: string;
  reviewerRole: 'TENANT' | 'OWNER';
  rating: number;
  body: string;
  monthsAgo: number;
};

const SEED_USER_REVIEWS: SeedUserReview[] = [
  {
    id: 'seed-review-u-01',
    targetUserId: 'seed-user-maria',
    reviewerId: 'seed-user-ivan',
    reviewerRole: 'TENANT',
    rating: 5,
    body: 'Страхотен собственик! Комуникацията беше лесна и бърза, апартаментът е в отлично състояние. Препоръчвам!',
    monthsAgo: 14,
  },
  {
    id: 'seed-review-u-02',
    targetUserId: 'seed-user-maria',
    reviewerId: 'seed-user-simona',
    reviewerRole: 'TENANT',
    rating: 5,
    body: 'Много любезна и отзивчива. Мястото е точно както на снимките – чисто, подредено и удобно.',
    monthsAgo: 15,
  },
  {
    id: 'seed-review-u-03',
    targetUserId: 'seed-user-maria',
    reviewerId: 'seed-user-andrey',
    reviewerRole: 'TENANT',
    rating: 4,
    body: 'Добър престой и добра комуникация. Благодаря!',
    monthsAgo: 16,
  },
  {
    id: 'seed-review-u-04',
    targetUserId: 'seed-user-maria',
    reviewerId: 'seed-user-desislava',
    reviewerRole: 'TENANT',
    rating: 5,
    body: 'Коректна и с ясни условия от самото начало. Бих наела отново.',
    monthsAgo: 8,
  },
  {
    id: 'seed-review-u-05',
    targetUserId: 'seed-user-desislava',
    reviewerId: 'seed-user-maria',
    reviewerRole: 'OWNER',
    rating: 5,
    body: 'Изключително коректен наемател. Остави апартамента в перфектно състояние.',
    monthsAgo: 7,
  },
  {
    id: 'seed-review-u-06',
    targetUserId: 'seed-user-ivan',
    reviewerId: 'seed-user-simona',
    reviewerRole: 'TENANT',
    rating: 4,
    body: 'Отговаря бързо и е гъвкав за огледите.',
    monthsAgo: 5,
  },
  {
    id: 'seed-review-u-07',
    targetUserId: 'seed-user-georgi',
    reviewerId: 'seed-user-desislava',
    reviewerRole: 'TENANT',
    rating: 5,
    body: 'Всичко описано в обявата отговаряше на реалността.',
    monthsAgo: 2,
  },
];

type SeedViewingRequest = {
  id: string;
  listingId: string;
  requesterId: string;
  ownerId: string;
  inDays: number;
  message: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
};

const SEED_VIEWING_REQUESTS: SeedViewingRequest[] = [
  {
    id: 'seed-viewing-01',
    listingId: 'seed-listing-01',
    requesterId: 'seed-user-desislava',
    ownerId: 'seed-user-maria',
    inDays: 3,
    message: 'Здравейте! Възможно ли е оглед в събота следобед?',
    status: 'REQUESTED',
  },
  {
    id: 'seed-viewing-02',
    listingId: 'seed-listing-01',
    requesterId: 'seed-user-andrey',
    ownerId: 'seed-user-maria',
    inDays: -30,
    message: 'Интересувам се от стаята. Свободен съм следващата седмица.',
    status: 'ACCEPTED',
  },
  {
    id: 'seed-viewing-03',
    listingId: 'seed-listing-06',
    requesterId: 'seed-user-desislava',
    ownerId: 'seed-user-georgi',
    inDays: 5,
    message: 'Може ли оглед в петък около 18:00?',
    status: 'REQUESTED',
  },
  {
    id: 'seed-viewing-04',
    listingId: 'seed-listing-04',
    requesterId: 'seed-user-simona',
    ownerId: 'seed-user-ivan',
    inDays: -14,
    message: 'Здравейте, интересува ме апартаментът.',
    status: 'ACCEPTED',
  },
  {
    id: 'seed-viewing-05',
    listingId: 'seed-listing-10',
    requesterId: 'seed-user-andrey',
    ownerId: 'seed-user-elena',
    inDays: -5,
    message: 'Търсим апартамент за трима студенти.',
    status: 'DECLINED',
  },
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is not set. Run `pnpm db:seed` so .env.local is loaded, and make sure Postgres is running.',
    );
  }

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);

  try {
    const passwordHash = await hashPassword(SEED_PASSWORD);

    await db.transaction(async (tx) => {
      // Conversations are not owned by a user row, so clear them explicitly
      // before the cascading user delete takes care of everything else.
      await tx.delete(conversations).where(like(conversations.id, 'seed-%'));
      await tx.delete(user).where(like(user.id, 'seed-%'));

      await tx.insert(user).values(
        SEED_USERS.map((seedUser) => ({
          id: seedUser.id,
          name: seedUser.name,
          email: seedUser.email,
          emailVerified: true,
          image: null,
          createdAt: monthsAgo(seedUser.joinedMonthsAgo),
          updatedAt: now,
        })),
      );

      await tx.insert(account).values(
        SEED_USERS.map((seedUser) => ({
          id: `${seedUser.id}-credential`,
          accountId: seedUser.id,
          providerId: 'credential',
          userId: seedUser.id,
          password: passwordHash,
          createdAt: monthsAgo(seedUser.joinedMonthsAgo),
          updatedAt: now,
        })),
      );

      await tx.insert(userProfiles).values(
        SEED_USERS.map((seedUser) => ({
          userId: seedUser.id,
          displayName: seedUser.name,
          bio: seedUser.bio,
          phoneNumber: seedUser.phoneNumber,
          citySlug: seedUser.citySlug,
          neighborhoodSlug: seedUser.neighborhoodSlug,
          avatarUrl: null,
          isVerified: seedUser.isVerified,
          emailVerified: true,
          phoneVerified: seedUser.phoneVerified,
          identityVerified: seedUser.identityVerified,
          publicContactAllowed: seedUser.publicContactAllowed,
          responseTimeMinutes: seedUser.responseTimeMinutes,
          responseRate: seedUser.responseRate,
          successfulRentals: seedUser.successfulRentals,
          traits: seedUser.traits,
          languages: seedUser.languages,
          roommatePreferences: seedUser.roommatePreferences,
          joinedAt: monthsAgo(seedUser.joinedMonthsAgo),
        })),
      );

      await tx.insert(listings).values(
        SEED_LISTINGS.map((listing) => ({
          id: listing.id,
          ownerId: listing.ownerId,
          title: listing.title,
          description: listing.description,
          status: 'PUBLISHED' as const,
          propertyType: listing.propertyType,
          roommatePreference: listing.roommatePreference,
          citySlug: listing.citySlug,
          neighborhoodSlug: listing.neighborhoodSlug,
          addressLine: listing.addressLine,
          monthlyRentCents: listing.monthlyRentCents,
          depositCents: listing.depositCents,
          currency: CURRENCY,
          bedroomCount: listing.bedroomCount,
          bathroomCount: listing.bathroomCount,
          maxOccupants: listing.maxOccupants,
          sizeSqm: listing.sizeSqm,
          floor: listing.floor,
          totalFloors: listing.totalFloors,
          latitude: listing.latitude,
          longitude: listing.longitude,
          isVerified: listing.isVerified,
          isFurnished: listing.isFurnished,
          internetIncluded: listing.internetIncluded,
          utilitiesIncluded: listing.utilitiesIncluded,
          petsAllowed: listing.petsAllowed,
          nearMetro: listing.nearMetro,
          roommateFriendly: listing.roommateFriendly,
          availableFrom: daysFromNow(listing.availableInDays),
          amenities: listing.amenities,
          rules: listing.rules,
          publishedAt: daysFromNow(-listing.publishedDaysAgo),
          createdAt: daysFromNow(-listing.publishedDaysAgo),
          updatedAt: daysFromNow(-listing.publishedDaysAgo),
        })),
      );

      await tx.insert(listingImages).values(
        SEED_LISTINGS.flatMap((listing) =>
          Array.from({ length: listing.imageCount }, (_, index) => ({
            id: `${listing.id}-image-${index}`,
            listingId: listing.id,
            url: imageUrl(listing.id, index),
            alt: `${listing.title} — снимка ${index + 1}`,
            sortOrder: index,
          })),
        ),
      );

      await tx.insert(reviews).values([
        ...SEED_LISTING_REVIEWS.map((review) => ({
          id: review.id,
          reviewerId: review.reviewerId,
          targetType: 'LISTING' as const,
          targetUserId: null,
          listingId: review.listingId,
          reviewerRole: 'TENANT' as const,
          rating: review.rating,
          body: review.body,
          isPublished: true,
          createdAt: monthsAgo(review.monthsAgo),
          updatedAt: monthsAgo(review.monthsAgo),
        })),
        ...SEED_USER_REVIEWS.map((review) => ({
          id: review.id,
          reviewerId: review.reviewerId,
          targetType: 'USER' as const,
          targetUserId: review.targetUserId,
          listingId: null,
          reviewerRole: review.reviewerRole,
          rating: review.rating,
          body: review.body,
          isPublished: true,
          createdAt: monthsAgo(review.monthsAgo),
          updatedAt: monthsAgo(review.monthsAgo),
        })),
      ]);

      await tx.insert(viewingRequests).values(
        SEED_VIEWING_REQUESTS.map((request) => ({
          id: request.id,
          listingId: request.listingId,
          requesterId: request.requesterId,
          ownerId: request.ownerId,
          requestedStartAt: daysFromNow(request.inDays),
          message: request.message,
          status: request.status,
        })),
      );

      await tx.insert(favorites).values([
        { userId: 'seed-user-desislava', listingId: 'seed-listing-01' },
        { userId: 'seed-user-desislava', listingId: 'seed-listing-06' },
        { userId: 'seed-user-desislava', listingId: 'seed-listing-11' },
        { userId: 'seed-user-andrey', listingId: 'seed-listing-07' },
        { userId: 'seed-user-simona', listingId: 'seed-listing-01' },
      ]);

      await tx.insert(savedSearches).values([
        {
          id: 'seed-search-01',
          userId: 'seed-user-desislava',
          name: 'София · Апартамент · до 1200 лв',
          filters: {
            citySlug: 'sofia',
            propertyType: 'APARTMENT',
            minRentCents: 35_000,
            maxRentCents: 120_000,
            isVerified: true,
            roommateFriendly: true,
          },
          notificationsEnabled: true,
        },
        {
          id: 'seed-search-02',
          userId: 'seed-user-andrey',
          name: 'Стая в Студентски град',
          filters: {
            citySlug: 'sofia',
            neighborhoodSlug: 'studentski-grad',
            propertyType: 'ROOM',
            maxRentCents: 45_000,
          },
          notificationsEnabled: false,
        },
      ]);

      await tx.insert(conversations).values([
        {
          id: 'seed-conversation-01',
          listingId: 'seed-listing-01',
          createdAt: daysFromNow(-2),
          updatedAt: daysFromNow(-1),
        },
        {
          id: 'seed-conversation-02',
          listingId: 'seed-listing-06',
          createdAt: daysFromNow(-6),
          updatedAt: daysFromNow(-5),
        },
      ]);

      await tx.insert(conversationParticipants).values([
        {
          conversationId: 'seed-conversation-01',
          userId: 'seed-user-desislava',
          lastReadAt: daysFromNow(-1),
        },
        {
          conversationId: 'seed-conversation-01',
          userId: 'seed-user-maria',
          lastReadAt: null,
        },
        {
          conversationId: 'seed-conversation-02',
          userId: 'seed-user-desislava',
          lastReadAt: daysFromNow(-5),
        },
        {
          conversationId: 'seed-conversation-02',
          userId: 'seed-user-georgi',
          lastReadAt: daysFromNow(-5),
        },
      ]);

      await tx.insert(messages).values([
        {
          id: 'seed-message-01',
          conversationId: 'seed-conversation-01',
          senderId: 'seed-user-desislava',
          body: 'Здравейте! Стаята свободна ли е още от началото на месеца?',
          createdAt: daysFromNow(-2),
        },
        {
          id: 'seed-message-02',
          conversationId: 'seed-conversation-01',
          senderId: 'seed-user-maria',
          body: 'Здравейте! Да, свободна е. Може да организираме оглед този уикенд.',
          createdAt: daysFromNow(-2),
        },
        {
          id: 'seed-message-03',
          conversationId: 'seed-conversation-01',
          senderId: 'seed-user-desislava',
          body: 'Супер, събота следобед би било идеално за мен.',
          createdAt: daysFromNow(-1),
        },
        {
          id: 'seed-message-04',
          conversationId: 'seed-conversation-02',
          senderId: 'seed-user-desislava',
          body: 'Здравейте, включен ли е паркингът в наема?',
          createdAt: daysFromNow(-6),
        },
        {
          id: 'seed-message-05',
          conversationId: 'seed-conversation-02',
          senderId: 'seed-user-georgi',
          body: 'Да, едно подземно паркомясто е включено.',
          createdAt: daysFromNow(-5),
        },
      ]);
    });

    const imageTotal = SEED_LISTINGS.reduce((total, listing) => total + listing.imageCount, 0);

    console.log('Seed complete:');
    console.log(`  users              ${SEED_USERS.length}`);
    console.log(`  listings           ${SEED_LISTINGS.length} (published)`);
    console.log(`  listing images     ${imageTotal}`);
    console.log(
      `  reviews            ${SEED_LISTING_REVIEWS.length + SEED_USER_REVIEWS.length}`,
    );
    console.log(`  viewing requests   ${SEED_VIEWING_REQUESTS.length}`);
    console.log(`  conversations      2`);
    console.log('');
    console.log(`Sign in with any seeded email and password "${SEED_PASSWORD}", e.g.`);
    console.log('  maria@stay.bg      (owner, 3 listings, verified)');
    console.log('  desislava@stay.bg  (tenant, favourites + messages)');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
