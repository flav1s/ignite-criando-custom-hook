import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stock = await (await api.get(`stock/${productId}`)).data.amount;
      const newCart = [...cart];
      const duplicatedProduct = newCart.find(
        (product) => product.id === productId
      );
      const currentAmount = duplicatedProduct ? duplicatedProduct.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stock) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (duplicatedProduct) {
        duplicatedProduct.amount = amount;
      } else {
        const product = await (await api.get(`products/${productId}`)).data;
        const newProduct = { ...product, amount: 1 };
        newCart.push(newProduct);
      }
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      setCart(newCart);
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];

      const idExist = newCart.find((product) => product.id === productId);
      if (!idExist) throw new Error();

      const products = newCart.filter(
        (product) => product.id !== productId && product
      );

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(products));
      setCart(products);
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;

      const response = await api.get(`stock/${productId}`);
      const stock = response.data.amount;

      if (amount > stock) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const newCart = [...cart];
      const updatedProducts = newCart.map((product) =>
        product.id === productId ? { ...product, amount: amount } : product
      );
      localStorage.setItem(
        "@RocketShoes:cart",
        JSON.stringify(updatedProducts)
      );
      setCart(updatedProducts);
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
