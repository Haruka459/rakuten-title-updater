export type CardSize = "large" | "small";

export type ProductCard = {
  id: string;
  size: CardSize;
  imageUrl: string;
  linkUrl: string;
  title: string;
  description: string;
};
