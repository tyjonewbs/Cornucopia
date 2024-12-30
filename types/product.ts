export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  inventory: number;
  inventoryUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  marketStandId: string;
}

export interface ExtendedProduct extends Product {
  distance?: number;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImage: string;
  };
  marketStand?: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    locationName: string;
  };
}
