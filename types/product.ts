export interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    images: string[];
    latitude: number | null;
    longitude: number | null;
  }
  
  export interface ExtendedProduct extends Product {
    distance?: number;
  }