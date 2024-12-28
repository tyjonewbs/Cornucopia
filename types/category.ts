export enum CategoryTypes {
    map = "map",
    FAQ = "FAQ",
    mission = "mission"
  }
  
  export interface ProductCategory {
    category: "newest" | "map" | "how-it-works" | "our-mission";
  }