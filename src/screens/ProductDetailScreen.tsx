import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import type { RootStackParamList } from '../navigation/types';
import { findContact, type Product } from '../services/data';
import {
  getAllProducts,
  isFavorite,
  toggleFavorite,
  incrementViews,
} from '../services/marketplaceService';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const insets = useSafeAreaInsets();
  const [product, setProduct] = useState<Product | null>(null);
  const [isFav, setIsFav] = useState(false);

  const load = useCallback(async () => {
    const [all, fav] = await Promise.all([getAllProducts(), isFavorite(productId)]);
    const found = all.find((p) => p.id === productId) ?? null;
    setProduct(found);
    setIsFav(fav);
    if (found) {
      await incrementViews(found.id);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggleFav = async () => {
    const result = await toggleFavorite(productId);
    setIsFav(result);
  };

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-navy-950">
        <Text className="text-white/40">Carregando...</Text>
      </View>
    );
  }

  const seller = findContact(product.contactId);
  const conditionLabel =
    product.condition === 'novo'
      ? 'Novo'
      : product.condition === 'usado'
        ? 'Usado'
        : 'Recondicionado';

  const timeAgo = (() => {
    const diff = Date.now() - product.createdAt;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  })();

  return (
    <View className="flex-1 bg-navy-950">
      <View style={{ paddingTop: insets.top }} className="bg-navy-950">
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
            <Ionicons name="arrow-back" size={24} color="#D4AF37" />
          </TouchableOpacity>
          <Text className="text-base font-bold text-white" numberOfLines={1}>
            Detalhes
          </Text>
          <TouchableOpacity onPress={() => void handleToggleFav()} className="p-1">
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={24}
              color={isFav ? '#E57373' : '#D4AF37'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View
          style={{ height: 280, backgroundColor: product.color }}
          className="items-center justify-center"
        >
          <Ionicons name="bag-handle" size={80} color="#0B132B" style={{ opacity: 0.85 }} />
          <View className="absolute bottom-4 left-4 flex-row gap-2">
            <View className="rounded-full bg-black/50 px-3 py-1">
              <Text className="text-xs text-white">{conditionLabel}</Text>
            </View>
            <View className="rounded-full bg-black/50 px-3 py-1">
              <Text className="text-xs text-white">{timeAgo} atras</Text>
            </View>
          </View>
          <View className="absolute bottom-4 right-4 flex-row gap-2">
            <View className="flex-row items-center gap-1 rounded-full bg-black/50 px-2 py-1">
              <Ionicons name="eye-outline" size={12} color="#fff" />
              <Text className="text-[10px] text-white">{product.views}</Text>
            </View>
            <View className="flex-row items-center gap-1 rounded-full bg-black/50 px-2 py-1">
              <Ionicons name="heart-outline" size={12} color="#fff" />
              <Text className="text-[10px] text-white">{product.favorites}</Text>
            </View>
          </View>
        </View>

        <View className="px-4 pt-4">
          <Text className="text-2xl font-bold text-white">{product.title}</Text>
          <Text className="mt-2 text-2xl font-bold text-gold">{product.priceFormatted}</Text>

          <View className="mt-3 flex-row items-center gap-2">
            <Ionicons name="location-outline" size={16} color="#8CA3C9" />
            <Text className="text-sm text-white/60">{product.location}</Text>
          </View>

          <View className="mt-2 flex-row items-center gap-2">
            <View className="rounded-full bg-navy-800 px-3 py-1">
              <Text className="text-xs text-gold-text">{product.category}</Text>
            </View>
            <View className="rounded-full bg-navy-800 px-3 py-1">
              <Text className="text-xs text-white/50">{conditionLabel}</Text>
            </View>
          </View>

          <View className="mt-5 border-t border-navy-700 pt-4">
            <Text className="mb-2 text-xs font-bold uppercase text-white/40">
              Descricao
            </Text>
            <Text className="text-sm leading-5 text-white/70">
              {product.description}
            </Text>
          </View>

          <View className="mt-5 border-t border-navy-700 pt-4">
            <Text className="mb-3 text-xs font-bold uppercase text-white/40">
              Vendedor
            </Text>
            <View className="flex-row items-center gap-3">
              <Avatar name={seller?.name ?? product.contactName} size={48} />
              <View className="flex-1">
                <Text className="text-base font-semibold text-white">
                  {seller?.name ?? product.contactName}
                </Text>
                <Text className="text-xs text-white/40">{seller?.status ?? 'Loja verificada'}</Text>
              </View>
            </View>
          </View>

          <View className="mb-8 mt-6 flex-row gap-3">
            <TouchableOpacity
              onPress={() => {
                if (seller) {
                  navigation.navigate('ChatDetail', { contactId: product.contactId });
                }
              }}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-gold py-4"
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#0B132B" />
              <Text className="text-sm font-bold text-navy-950">Conversar</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center justify-center rounded-2xl bg-navy-700 px-5 py-4">
              <Ionicons name="call" size={20} color="#D4AF37" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
