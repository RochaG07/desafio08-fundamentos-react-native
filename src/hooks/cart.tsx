import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { getConstantValue } from 'typescript';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // TODO LOAD ITEMS FROM ASYNC STORAGE

      const data = await AsyncStorage.getItem('@GoMarketplace: products');

      if (data){
        setProducts(JSON.parse(data));
      }
      
    }

    loadProducts();
  }, []);

  const saveInAsyncStorage = useCallback(async () => {
    await AsyncStorage.setItem('@GoMarketplace: products', JSON.stringify(products));
  }, [])

  const addToCart = useCallback(async product => {
    //ADD A NEW ITEM TO THE CART

    const productExistsInCart = products.find( productInCart => productInCart.id === product.id);
 
    // Adiciona um novo item no carrinho somente se não tiver nenhum do mesmo item 
    if(productExistsInCart){
      setProducts(
        products.map(p =>
          p.id === product.id ? { ...product, quantity: p.quantity + 1 } : p),
      );
    } else {
      const newProduct = {
        id: product.id,
        title: product.title,
        image_url: product.image_url,
        price: product.price,
        quantity: 1,
      }

      setProducts([...products, newProduct]); 

      saveInAsyncStorage();
    }

  }, [products]);

  const increment = useCallback(async id => {

    setProducts(products.map( p =>
      p.id === id ? { ...p ,quantity: p.quantity + 1 } : p),
    );

    saveInAsyncStorage();

  }, [products]);

  const decrement = useCallback(async id => {
    // DECREMENTS A PRODUCT QUANTITY IN THE CART
    let quantityIsEqualToZero = false;

    setProducts(products.map( p => {
      if( p.id === id && p.quantity === 1){
        quantityIsEqualToZero = true;
      }

      return p.id === id ? { ...p ,quantity: p.quantity - 1 } : p
    }),
    );

    if(quantityIsEqualToZero) {
      // Remove item from products
      setProducts(products.filter(p => p.id !== id));
    }

    saveInAsyncStorage();

  }, [products]);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
