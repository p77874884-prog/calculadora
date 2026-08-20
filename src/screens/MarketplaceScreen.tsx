import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { TabsNavigationProp } from '../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  CATEGORIES,
  type Category,
  type Product,
  type ProductCondition,
} from '../services/data';
import {
  getAllProducts,
  searchProducts,
  getFavorites,
  toggleFavorite,
} from '../services/marketplaceService';

type SortOption = 'recent' | 'price-asc' | 'price-desc' | 'popular';

const SORT_LABELS: Record<SortOption, string> = {
  recent: 'Mais recentes',
  'price-asc': 'Menor preco',
  'price-desc': 'Maior preco',
  popular: 'Mais vistos',
};

const CONDITION_OPTIONS: { value: ProductCondition; label: string }[] = [
  { value: 'novo', label: 'Novo' },
  { value: 'usado', label: 'Usado' },
  { value: 'recondicionado', label: 'Recondicionado' },
];

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Todos: 'grid',
  Moda: 'shirt',
  Eletronicos: 'phone-portrait',
  'Casa e Decoracao': 'home',
  Esportes: 'football',
  Instrumentos: 'musical-notes',
  Veiculos: 'car-sport',
  Imoveis: 'business',
  Servicos: 'construct',
  Alimentos: 'restaurant',
};

export function MarketplaceScreen() {
  const navigation = useNavigation<
    TabsNavigationProp<'Marketplace'> & NativeStackNavigationProp<RootStackParamList>
  >();
  const [products, setProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Todos');
  const [selectedCondition, setSelectedCondition] = useState<ProductCondition | undefined>();
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const load = useCallback(async () => {
    const [all, favs] = await Promise.all([getAllProducts(), getFavorites()]);
    setProducts(all);
    setFavorites(favs);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    let result = searchProducts(products, query, selectedCategory, selectedCondition, sortBy);
    if (favoritesOnly) {
      result = result.filter((p) => favorites.includes(p.id));
    }
    return result;
  }, [products, query, selectedCategory, selectedCondition, sortBy, favoritesOnly, favorites]);

  const handleToggleFav = async (productId: string) => {
    await toggleFavorite(productId);
    const favs = await getFavorites();
    setFavorites(favs);
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const isFav = favorites.includes(item.id);
    const conditionLabel =
      item.condition === 'novo' ? 'Novo' : item.condition === 'usado' ? 'Usado' : 'Recondicionado';
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        className="mb-3 w-[48%] overflow-hidden rounded-xl bg-[#111B21]"
        activeOpacity={0.8}
      >
        <View style={{ height: 130, backgroundColor: item.color }} className="items-center justify-center">
          <Ionicons name="bag-handle" size={36} color="#0B1628" style={{ opacity: 0.85 }} />
          <TouchableOpacity
            onPress={() => void handleToggleFav(item.id)}
            className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-black/30"
          >
            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={18} color={isFav ? '#EA4335' : '#fff'} />
          </TouchableOpacity>
          <View className="absolute bottom-2 left-2 rounded-full bg-black/40 px-2 py-0.5">
            <Text className="text-[10px] text-white">{conditionLabel}</Text>
          </View>
        </View>
        <View className="p-3">
          <Text className="text-[13px] font-semibold text-[#E9EDEF]" numberOfLines={2}>{item.title}</Text>
          <Text className="mt-1 text-[15px] font-bold text-[#06CF9C]">{item.priceFormatted}</Text>
          <View className="mt-1 flex-row items-center gap-1">
            <Ionicons name="location-outline" size={11} color="#8696A0" />
            <Text className="text-[10px] text-[#8696A0]" numberOfLines={1}>{item.location}</Text>
          </View>
          <View className="mt-1.5 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="flex-row items-center gap-0.5">
                <Ionicons name="eye-outline" size={11} color="#8696A0" />
                <Text className="text-[10px] text-[#8696A0]">{item.views}</Text>
              </View>
              <View className="flex-row items-center gap-0.5">
                <Ionicons name="heart-outline" size={11} color="#8696A0" />
                <Text className="text-[10px] text-[#8696A0]">{item.favorites}</Text>
              </View>
            </View>
            <Text className="text-[10px] text-[#54656F]">{item.contactName}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-[#0B1628]">
      <View className="px-3 pt-2">
        <View className="flex-row items-center gap-2 rounded-xl bg-[#202C33] px-3 py-2">
          <Ionicons name="search" size={18} color="#8696A0" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar no mercado..."
            placeholderTextColor="#8696A0"
            className="flex-1 text-[14px] text-[#E9EDEF]"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#8696A0" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)} className="ml-1">
            <Ionicons name="options" size={20} color={showFilters || selectedCondition ? '#06CF9C' : '#8696A0'} />
          </TouchableOpacity>
        </View>
      </View>

      {showFilters && (
        <View className="mt-2 px-3">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[11px] font-bold text-[#8696A0]">CONDICAO</Text>
            <TouchableOpacity onPress={() => setSelectedCondition(undefined)}>
              <Text className="text-[10px] text-[#06CF9C]">Limpar</Text>
            </TouchableOpacity>
          </View>
          <View className="mb-3 flex-row gap-2">
            {CONDITION_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setSelectedCondition(selectedCondition === opt.value ? undefined : opt.value)}
                className={`rounded-full px-3 py-1.5 ${selectedCondition === opt.value ? 'bg-[#06CF9C]' : 'bg-[#202C33]'}`}
              >
                <Text className={`text-[12px] ${selectedCondition === opt.value ? 'font-bold text-[#111B21]' : 'text-[#8696A0]'}`}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className="mb-2 text-[11px] font-bold text-[#8696A0]">ORDENAR POR</Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => setSortBy(opt)}
                className={`rounded-full px-3 py-1.5 ${sortBy === opt ? 'bg-[#06CF9C]' : 'bg-[#202C33]'}`}
              >
                <Text className={`text-[12px] ${sortBy === opt ? 'font-bold text-[#111B21]' : 'text-[#8696A0]'}`}>
                  {SORT_LABELS[opt]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => setFavoritesOnly(!favoritesOnly)} className="flex-row items-center gap-1.5">
              <Ionicons name={favoritesOnly ? 'heart' : 'heart-outline'} size={16} color={favoritesOnly ? '#EA4335' : '#8696A0'} />
              <Text className="text-[12px] text-[#8696A0]">Apenas favoritos</Text>
            </TouchableOpacity>
            <Text className="text-[10px] text-[#54656F]">{filtered.length} resultados</Text>
          </View>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2 px-3" contentContainerStyle={{ gap: 8 }}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${selectedCategory === cat ? 'bg-[#06CF9C]' : 'bg-[#202C33]'}`}
          >
            <Ionicons name={CATEGORY_ICONS[cat] ?? 'grid'} size={14} color={selectedCategory === cat ? '#111B21' : '#8696A0'} />
            <Text className={`text-[12px] ${selectedCategory === cat ? 'font-bold text-[#111B21]' : 'text-[#8696A0]'}`}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 12, gap: 10 }}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 80 }}
        className="flex-1"
        renderItem={renderProduct}
        ListEmptyComponent={
          <View className="mt-16 items-center">
            <Ionicons name="search-outline" size={48} color="#222D34" />
            <Text className="mt-3 text-[14px] text-[#8696A0]">Nenhum produto encontrado</Text>
            <TouchableOpacity
              onPress={() => { setQuery(''); setSelectedCategory('Todos'); setSelectedCondition(undefined); setFavoritesOnly(false); }}
              className="mt-2"
            >
              <Text className="text-[14px] text-[#06CF9C]">Limpar filtros</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-[#06CF9C] shadow-lg">
        <Ionicons name="add" size={28} color="#111B21" />
      </TouchableOpacity>
    </View>
  );
}
