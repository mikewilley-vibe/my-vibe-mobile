export type LocalVenue = {
  name: string;
  url: string;
  image?: string;
};

export type VenueRegion = {
  region: "Hampton Roads" | "Richmond" | "Washington DC";
  venues: LocalVenue[];
};

export const localVenuesByRegion: VenueRegion[] = [
  {
    region: "Hampton Roads",
    venues: [
      {
    name: "The NorVa",
    url: "https://www.thenorva.com/calendar/",
    image: "/images/the-norva.jpg",
  },
    {
    name: "The Dome",
    url: "https://www.ticketmaster.com/the-dome-tickets-virginia-beach/venue/9458",
    image: "/images/the-dome.jpg",
  },
  {
    name: "The National",
    url: "https://www.thenationalva.com/schedule/",
    image: "/images/the-national.jpg",
  },
 
  {
    name: "Elevation 27",
    url: "https://www.elevation27.com/calendar-2/",
    image: "/images/levation-27.jpg.png",
  },
  {
  name: "The Annex",
  url: "https://theannexnfk.com/events/",
  image: "/images/the-annex.jpg.png",
},
{
  name: "Veterans United Home Loans Amphitheater (Virginia Beach)",
  url: "https://www.veteransunitedhomeloansamphitheater.com/shows",
  image: "/images/vb-amphitheater.jpg",
},
 ],
  },
  {
    region: "Richmond",
    venues: [
         {
    name: "The Broadberry",
    url: "https://thebroadberry.com/events/",
    image: "/images/the-broadberry.jpg.png",
  },
    {
    name: "Allianz Amphitheater at Riverfront",
    url: "https://www.allianzamphitheater.com/shows",
    image: "/images/allianz-amphitheater.jpg",
  },

  {
    name: "The Camel",
    url: "https://www.thecamel.org/shows",
    image: "/images/the-camel.jpg.png",
  },

  {
    name: "Ember Music Hall",
    url: "https://embermusichall.com/events/",
    image: "/images/embermusichall.png",
  },

  ],
  },
  {
    region: "Washington DC",
    venues: [
         {
    name: "9:30 Club",
    url: "https://www.930.com/e/listing/",
    image: "/images/930club.png",
  },
  {
    name: "The Anthem",
    url: "https://theanthemdc.com/calendar/",
    image: "/images/theanthem.png",
  },


  
],

  },
];
export const __debug_localVenuesByRegion_exists = true;