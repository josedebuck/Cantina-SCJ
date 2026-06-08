export type Product = {
  id: string;
  name: string;
  image_url: string | null;
  stock_downstairs: number;
  stock_upstairs: number;
  price: number;
  box_size: number;
};