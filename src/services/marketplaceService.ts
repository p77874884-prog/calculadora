import AsyncStorage from '@react-native-async-storage/async-storage';
import { decryptText, deriveKey, encryptText, randomHex } from '../utils/crypto';
import { PRODUCTS, type Product, type Category } from './data';

const MARKET_SALT_KEY = 'calculadora.market.salt';
const MARKET_DB_KEY = 'calculadora.market.db';
const FAVORITES_KEY = 'calculadora.market.favorites';

let sessionKey: string | null = null;

export async function openMarketplace(pin: string): Promise<void> {
  let salt = await AsyncStorage.getItem(MARKET_SALT_KEY);
  if (!salt) {
    salt = await randomHex(16);
    await AsyncStorage.setItem(MARKET_SALT_KEY, salt);
  }
  sessionKey = deriveKey(pin, salt);
}

export async function closeMarketplace(): Promise<void> {
  sessionKey = null;
}

interface MarketDB {
  products: Product[];
  userProducts: Product[];
}

async function loadDB(): Promise<MarketDB> {
  if (!sessionKey) return { products: [...PRODUCTS], userProducts: [] };
  const raw = await AsyncStorage.getItem(MARKET_DB_KEY);
  if (!raw) return { products: [...PRODUCTS], userProducts: [] };
  try {
    const decrypted = await decryptText(raw, sessionKey);
    return JSON.parse(decrypted) as MarketDB;
  } catch {
    return { products: [...PRODUCTS], userProducts: [] };
  }
}

async function persistDB(db: MarketDB): Promise<void> {
  if (!sessionKey) throw new Error('Marketplace is locked');
  const ciphertext = await encryptText(JSON.stringify(db), sessionKey);
  await AsyncStorage.setItem(MARKET_DB_KEY, ciphertext);
}

export async function getAllProducts(): Promise<Product[]> {
  const db = await loadDB();
  return [...PRODUCTS, ...db.userProducts].filter((p) => p.active);
}

export async function getUserProducts(): Promise<Product[]> {
  const db = await loadDB();
  return db.userProducts.filter((p) => p.active);
}

export async function addProduct(
  product: Omit<Product, 'id' | 'views' | 'favorites' | 'createdAt' | 'active'>,
): Promise<Product> {
  const db = await loadDB();
  const newProduct: Product = {
    ...product,
    id: `up_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    views: 0,
    favorites: 0,
    createdAt: Date.now(),
    active: true,
  };
  db.userProducts.push(newProduct);
  await persistDB(db);
  return newProduct;
}

export async function updateProduct(
  productId: string,
  updates: Partial<Product>,
): Promise<Product | null> {
  const db = await loadDB();
  const idx = db.userProducts.findIndex((p) => p.id === productId);
  if (idx < 0) return null;
  db.userProducts[idx] = { ...db.userProducts[idx], ...updates };
  await persistDB(db);
  return db.userProducts[idx];
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const db = await loadDB();
  const idx = db.userProducts.findIndex((p) => p.id === productId);
  if (idx < 0) return false;
  db.userProducts[idx].active = false;
  await persistDB(db);
  return true;
}

export async function incrementViews(productId: string): Promise<void> {
  const db = await loadDB();
  const userProd = db.userProducts.find((p) => p.id === productId);
  if (userProd) {
    userProd.views += 1;
    await persistDB(db);
  }
}

export async function getFavorites(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(FAVORITES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function toggleFavorite(productId: string): Promise<boolean> {
  const favs = await getFavorites();
  const idx = favs.indexOf(productId);
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.push(productId);
  }
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  return idx < 0;
}

export async function isFavorite(productId: string): Promise<boolean> {
  const favs = await getFavorites();
  return favs.includes(productId);
}

export function searchProducts(
  products: Product[],
  query: string,
  category: Category,
  condition?: 'novo' | 'usado' | 'recondicionado',
  sortBy: 'recent' | 'price-asc' | 'price-desc' | 'popular' = 'recent',
): Product[] {
  let result = products.filter((p) => p.active);

  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }

  if (category !== 'Todos') {
    result = result.filter((p) => p.category === category);
  }

  if (condition) {
    result = result.filter((p) => p.condition === condition);
  }

  switch (sortBy) {
    case 'price-asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'popular':
      result.sort((a, b) => b.views - a.views);
      break;
    case 'recent':
    default:
      result.sort((a, b) => b.createdAt - a.createdAt);
      break;
  }

  return result;
}
