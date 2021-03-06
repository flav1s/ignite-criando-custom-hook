export interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
  amount: number;
  priceFormatted?: string;
  subTotal?: string;
}

export interface Stock {
  id: number;
  amount: number;
}
