export type Concert = {
  id: string;
  name: string;
  dateTime: string;      // ISO string
  venue: string;
  city: string;
  state?: string;
  url: string;           // ticket link
  image?: string;        // a decent sized image
  priceMin?: number;
  priceMax?: number;
};