export type Product = {
  id: string;
  name: string;
  stock_downstairs: number;
  stock_upstairs: number;
  image_url?: string | null;
};