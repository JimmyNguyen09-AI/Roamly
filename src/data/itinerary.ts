/**
 * Mock itinerary data for the Roamly planner and share pages.
 * Seven-day Japan trip with scheduled activities, saved places, and budgets.
 */

export interface Activity {
  id: string;
  name: string;
  time: string;
  location: string;
  category: "activity" | "food" | "transport" | "accommodation";
  cost: number;
  note?: string;
  bookingRef?: string;
}

export interface SavedPlace {
  id: string;
  name: string;
  location: string;
  category: "activity" | "food" | "transport" | "accommodation";
  estimatedCost: number;
}

export interface DayPlan {
  day: number;
  date: string;
  title: string;
  location: string;
  activities: Activity[];
  savedPlaces: SavedPlace[];
  budget: {
    accommodation: number;
    transport: number;
    food: number;
    activities: number;
  };
}

export const itineraryData: DayPlan[] = [
  {
    day: 1,
    date: "March 15",
    title: "Arrival in Tokyo",
    location: "Tokyo",
    activities: [
      {
        id: "d1a1",
        name: "Arrive at Narita Airport",
        time: "14:00",
        location: "Narita International Airport",
        category: "transport",
        cost: 0,
        bookingRef: "NH203-DEMO",
      },
      {
        id: "d1a2",
        name: "Check in at Shinjuku Hotel",
        time: "17:00",
        location: "Shinjuku, Tokyo",
        category: "accommodation",
        cost: 18000,
        bookingRef: "HTL-TKY-001-DEMO",
      },
      {
        id: "d1a3",
        name: "Dinner at Omoide Yokocho",
        time: "19:30",
        location: "Shinjuku, Tokyo",
        category: "food",
        cost: 3500,
      },
    ],
    savedPlaces: [
      {
        id: "d1s1",
        name: "Golden Gai Bar Hop",
        location: "Shinjuku, Tokyo",
        category: "activity",
        estimatedCost: 5000,
      },
    ],
    budget: { accommodation: 18000, transport: 3200, food: 5000, activities: 0 },
  },
  {
    day: 2,
    date: "March 16",
    title: "Tokyo Exploration",
    location: "Tokyo",
    activities: [
      {
        id: "d2a1",
        name: "Tsukiji Outer Market Breakfast",
        time: "07:30",
        location: "Tsukiji, Tokyo",
        category: "food",
        cost: 2500,
      },
      {
        id: "d2a2",
        name: "teamLab Borderless",
        time: "10:00",
        location: "Azabudai Hills, Tokyo",
        category: "activity",
        cost: 3800,
        bookingRef: "TLB-2024-DEMO",
      },
      {
        id: "d2a3",
        name: "Shibuya & Harajuku Walk",
        time: "14:00",
        location: "Shibuya, Tokyo",
        category: "activity",
        cost: 0,
      },
      {
        id: "d2a4",
        name: "Ramen at Fuunji",
        time: "18:30",
        location: "Shinjuku, Tokyo",
        category: "food",
        cost: 1200,
      },
    ],
    savedPlaces: [
      {
        id: "d2s1",
        name: "Akihabara Electronics District",
        location: "Akihabara, Tokyo",
        category: "activity",
        estimatedCost: 0,
      },
      {
        id: "d2s2",
        name: "Meiji Shrine",
        location: "Harajuku, Tokyo",
        category: "activity",
        estimatedCost: 0,
      },
    ],
    budget: { accommodation: 18000, transport: 1500, food: 5000, activities: 3800 },
  },
  {
    day: 3,
    date: "March 17",
    title: "Tokyo to Hakone",
    location: "Hakone",
    activities: [
      {
        id: "d3a1",
        name: "Shinkansen to Odawara",
        time: "09:00",
        location: "Tokyo Station",
        category: "transport",
        cost: 3500,
        bookingRef: "JR-PASS-DEMO",
      },
      {
        id: "d3a2",
        name: "Hakone Open Air Museum",
        time: "11:30",
        location: "Hakone",
        category: "activity",
        cost: 1600,
      },
      {
        id: "d3a3",
        name: "Lake Ashi Cruise",
        time: "14:00",
        location: "Lake Ashi, Hakone",
        category: "activity",
        cost: 1200,
      },
      {
        id: "d3a4",
        name: "Ryokan Check-in & Onsen",
        time: "16:30",
        location: "Hakone",
        category: "accommodation",
        cost: 35000,
        note: "Kaiseki dinner included",
        bookingRef: "RYK-HKN-001-DEMO",
      },
    ],
    savedPlaces: [],
    budget: { accommodation: 35000, transport: 4000, food: 3000, activities: 2800 },
  },
  {
    day: 4,
    date: "March 18",
    title: "Hakone to Kyoto",
    location: "Kyoto",
    activities: [
      {
        id: "d4a1",
        name: "Shinkansen to Kyoto",
        time: "10:00",
        location: "Odawara Station",
        category: "transport",
        cost: 11000,
        bookingRef: "JR-PASS-DEMO",
      },
      {
        id: "d4a2",
        name: "Fushimi Inari Shrine",
        time: "14:00",
        location: "Fushimi, Kyoto",
        category: "activity",
        cost: 0,
      },
      {
        id: "d4a3",
        name: "Gion District Walk",
        time: "17:00",
        location: "Gion, Kyoto",
        category: "activity",
        cost: 0,
      },
      {
        id: "d4a4",
        name: "Kaiseki Dinner",
        time: "19:00",
        location: "Gion, Kyoto",
        category: "food",
        cost: 8000,
      },
    ],
    savedPlaces: [
      {
        id: "d4s1",
        name: "Nishiki Market",
        location: "Nakagyo, Kyoto",
        category: "food",
        estimatedCost: 3000,
      },
    ],
    budget: { accommodation: 15000, transport: 11500, food: 10000, activities: 0 },
  },
  {
    day: 5,
    date: "March 19",
    title: "Kyoto Temples",
    location: "Kyoto",
    activities: [
      {
        id: "d5a1",
        name: "Kinkaku-ji (Golden Pavilion)",
        time: "08:30",
        location: "Kita, Kyoto",
        category: "activity",
        cost: 500,
      },
      {
        id: "d5a2",
        name: "Arashiyama Bamboo Grove",
        time: "11:00",
        location: "Arashiyama, Kyoto",
        category: "activity",
        cost: 0,
      },
      {
        id: "d5a3",
        name: "Matcha at Arabica",
        time: "13:00",
        location: "Arashiyama, Kyoto",
        category: "food",
        cost: 800,
      },
      {
        id: "d5a4",
        name: "Kiyomizu-dera Temple",
        time: "15:30",
        location: "Higashiyama, Kyoto",
        category: "activity",
        cost: 400,
      },
    ],
    savedPlaces: [
      {
        id: "d5s1",
        name: "Philosopher's Path",
        location: "Sakyo, Kyoto",
        category: "activity",
        estimatedCost: 0,
      },
    ],
    budget: { accommodation: 15000, transport: 2000, food: 4000, activities: 900 },
  },
  {
    day: 6,
    date: "March 20",
    title: "Nara Day Trip",
    location: "Nara / Kyoto",
    activities: [
      {
        id: "d6a1",
        name: "Train to Nara",
        time: "08:00",
        location: "Kyoto Station",
        category: "transport",
        cost: 720,
      },
      {
        id: "d6a2",
        name: "Todai-ji Temple",
        time: "09:30",
        location: "Nara Park",
        category: "activity",
        cost: 600,
      },
      {
        id: "d6a3",
        name: "Deer Park & Kasuga Shrine",
        time: "11:30",
        location: "Nara Park",
        category: "activity",
        cost: 0,
        note: "Deer crackers ¥200",
      },
      {
        id: "d6a4",
        name: "Street Food Lunch",
        time: "13:00",
        location: "Nara",
        category: "food",
        cost: 1500,
      },
    ],
    savedPlaces: [],
    budget: { accommodation: 15000, transport: 1500, food: 3500, activities: 600 },
  },
  {
    day: 7,
    date: "March 21",
    title: "Departure from Osaka",
    location: "Osaka",
    activities: [
      {
        id: "d7a1",
        name: "Shinkansen to Osaka",
        time: "08:30",
        location: "Kyoto Station",
        category: "transport",
        cost: 580,
      },
      {
        id: "d7a2",
        name: "Osaka Castle",
        time: "10:00",
        location: "Chuo, Osaka",
        category: "activity",
        cost: 600,
      },
      {
        id: "d7a3",
        name: "Dotonbori Street Food",
        time: "12:00",
        location: "Dotonbori, Osaka",
        category: "food",
        cost: 3000,
        note: "Must try: takoyaki and okonomiyaki",
      },
      {
        id: "d7a4",
        name: "Depart from Kansai Airport",
        time: "17:00",
        location: "Kansai International Airport",
        category: "transport",
        cost: 1200,
        bookingRef: "NH204-DEMO",
      },
    ],
    savedPlaces: [
      {
        id: "d7s1",
        name: "Shinsekai District",
        location: "Shinsekai, Osaka",
        category: "activity",
        estimatedCost: 0,
      },
    ],
    budget: { accommodation: 0, transport: 2000, food: 5000, activities: 600 },
  },
];

export const tripSummary = {
  name: "Japan: Tokyo → Kyoto → Osaka",
  dates: "March 15–21",
  travellers: 2,
  currency: "¥",
};
