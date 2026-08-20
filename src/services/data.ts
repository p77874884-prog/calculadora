export interface Contact {
  id: string;
  name: string;
  status: string;
  unread?: number;
  muted?: boolean;
}

export interface CallRecord {
  id: string;
  contactId: string;
  kind: 'voice' | 'video';
  direction: 'outgoing' | 'incoming' | 'missed';
  at: string;
}

export interface StatusItem {
  id: string;
  contactId: string;
  caption: string;
  seen: boolean;
}

export type ProductCondition = 'novo' | 'usado' | 'recondicionado';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  priceFormatted: string;
  location: string;
  category: string;
  condition: ProductCondition;
  contactId: string;
  contactName: string;
  color: string;
  images: string[];
  views: number;
  favorites: number;
  createdAt: number;
  active: boolean;
}

export const CATEGORIES = [
  'Todos',
  'Moda',
  'Eletronicos',
  'Casa e Decoracao',
  'Esportes',
  'Instrumentos',
  'Veiculos',
  'Imoveis',
  'Servicos',
  'Alimentos',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CONTACTS: Contact[] = [
  { id: 'ana', name: 'Ana Souza', status: 'online', unread: 3 },
  { id: 'bruno', name: 'Bruno Lima', status: 'visto por ultimo hoje as 10:24', muted: true },
  { id: 'carla', name: 'Carla Mendes', status: 'online' },
  { id: 'diego', name: 'Diego Rocha', status: 'digitando...' },
  { id: 'elen', name: 'Elen Martins', status: 'visto por ultimo ontem as 22:10', unread: 7 },
  { id: 'felipe', name: 'Felipe Nunes', status: 'online' },
  { id: 'atelie', name: 'Atelie Dourado', status: 'Loja · responde em minutos' },
  { id: 'moda', name: 'Moda & Estilo', status: 'Loja · verificada' },
];

export const CALLS: CallRecord[] = [
  { id: 'c1', contactId: 'ana', kind: 'video', direction: 'outgoing', at: 'Hoje, 14:32' },
  { id: 'c2', contactId: 'bruno', kind: 'voice', direction: 'missed', at: 'Hoje, 12:05' },
  { id: 'c3', contactId: 'carla', kind: 'video', direction: 'incoming', at: 'Ontem, 21:47' },
  { id: 'c4', contactId: 'diego', kind: 'voice', direction: 'outgoing', at: 'Ontem, 18:20' },
  { id: 'c5', contactId: 'elen', kind: 'video', direction: 'missed', at: 'Seg, 09:11' },
  { id: 'c6', contactId: 'felipe', kind: 'voice', direction: 'incoming', at: 'Dom, 20:44' },
];

export const STATUSES: StatusItem[] = [
  { id: 's1', contactId: 'ana', caption: 'Vista da cobertura', seen: true },
  { id: 's2', contactId: 'diego', caption: 'Treino de hoje', seen: false },
  { id: 's3', contactId: 'elen', caption: 'Cafe com amigos', seen: true },
  { id: 's4', contactId: 'felipe', caption: 'Roadtrip pelo litoral', seen: false },
];

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    title: 'Bolsa de couro artesanal',
    description:
      'Bolsa feita artesanalmente em couro legitimo. Acabamento premium, costuras reforcadas. Tamanho medio, ideal para o dia a dia. Entrega personalizada.',
    price: 189.9,
    priceFormatted: 'R$ 189,90',
    location: 'Jardins, Sao Paulo',
    category: 'Moda',
    condition: 'novo',
    contactId: 'atelie',
    contactName: 'Atelie Dourado',
    color: '#3B5795',
    images: [],
    views: 342,
    favorites: 28,
    createdAt: Date.now() - 86400000 * 2,
    active: true,
  },
  {
    id: 'p2',
    title: 'Smartphone desbloqueado',
    description:
      'Smartphone 128GB, tela AMOLED 6.5", camera 108MP, bateria 5000mAh. Desbloqueado para todas as operadoras. Inclui carregador e caixa original.',
    price: 1299,
    priceFormatted: 'R$ 1.299,00',
    location: 'Centro, Curitiba',
    category: 'Eletronicos',
    condition: 'usado',
    contactId: 'moda',
    contactName: 'Moda & Estilo',
    color: '#2E4370',
    images: [],
    views: 1205,
    favorites: 89,
    createdAt: Date.now() - 86400000 * 5,
    active: true,
  },
  {
    id: 'p3',
    title: 'Kit 4 poltronas de design',
    description:
      'Poltronas de design contemporaneo, estofado em veludo premium. Estrutura de madeira macica. Medidas: 75x80x90cm cada. Frete incluso para capitais.',
    price: 2450,
    priceFormatted: 'R$ 2.450,00',
    location: 'Savassi, Belo Horizonte',
    category: 'Casa e Decoracao',
    condition: 'novo',
    contactId: 'atelie',
    contactName: 'Atelie Dourado',
    color: '#B8942E',
    images: [],
    views: 876,
    favorites: 45,
    createdAt: Date.now() - 86400000,
    active: true,
  },
  {
    id: 'p4',
    title: 'Bicicleta aro 29',
    description:
      'Bicicleta MTB aro 29, 21 marchas Shimano, quadro de aluminio, freios a disco. Pneus novos, revisao completa. Perfeita para trilhas e uso urbano.',
    price: 780,
    priceFormatted: 'R$ 780,00',
    location: 'Boa Viagem, Recife',
    category: 'Esportes',
    condition: 'usado',
    contactId: 'moda',
    contactName: 'Moda & Estilo',
    color: '#3B5795',
    images: [],
    views: 534,
    favorites: 31,
    createdAt: Date.now() - 86400000 * 3,
    active: true,
  },
  {
    id: 'p5',
    title: 'Violao acustico profissional',
    description:
      'Violao de cordas aco profissional, corpo de cedro,braho de ebano. Brilho e sustain excepcionais. Inclui capa e palhetas. Afinacao perfeita.',
    price: 540,
    priceFormatted: 'R$ 540,00',
    location: 'Centro, Florianopolis',
    category: 'Instrumentos',
    condition: 'usado',
    contactId: 'felipe',
    contactName: 'Felipe Nunes',
    color: '#273A63',
    images: [],
    views: 298,
    favorites: 19,
    createdAt: Date.now() - 86400000 * 7,
    active: true,
  },
  {
    id: 'p6',
    title: 'Fone Bluetooth premium',
    description:
      'Fone de ouvido bluetooth com cancelamento de ruido ativo. Bateria de 40h, resistente a agua IPX5. Estojo de carga magnetico incluido.',
    price: 299,
    priceFormatted: 'R$ 299,00',
    location: 'Pinheiros, Sao Paulo',
    category: 'Eletronicos',
    condition: 'novo',
    contactId: 'moda',
    contactName: 'Moda & Estilo',
    color: '#2E4370',
    images: [],
    views: 678,
    favorites: 52,
    createdAt: Date.now() - 86400000 * 4,
    active: true,
  },
  {
    id: 'p7',
    title: 'Jaqueta de couro sintetico',
    description:
      'Jaqueta estilosa em couro sintetico, forro interno de pelucia. Disponivel em P, M, G. Cor: preta. Perfeita para o inverno.',
    price: 220,
    priceFormatted: 'R$ 220,00',
    location: 'Copacabana, Rio de Janeiro',
    category: 'Moda',
    condition: 'novo',
    contactId: 'atelie',
    contactName: 'Atelie Dourado',
    color: '#C9A227',
    images: [],
    views: 445,
    favorites: 37,
    createdAt: Date.now() - 86400000 * 6,
    active: true,
  },
  {
    id: 'p8',
    title: 'Mesa de escritorio',
    description:
      'Mesa para escritorio em MDF com pés de metal preto. Medidas 120x60cm. Gaveta embutida com trilho suave. Montagem simples.',
    price: 450,
    priceFormatted: 'R$ 450,00',
    location: 'Moema, Sao Paulo',
    category: 'Casa e Decoracao',
    condition: 'novo',
    contactId: 'atelie',
    contactName: 'Atelie Dourado',
    color: '#B8942E',
    images: [],
    views: 312,
    favorites: 24,
    createdAt: Date.now() - 86400000 * 1,
    active: true,
  },
  {
    id: 'p9',
    title: 'Guitarra eletrica Stratocaster',
    description:
      'Guitarra eletrica estilo Stratocaster, corpo de alder, braco de maple. 3 captadores single coil. Estado de conservacao excelente.',
    price: 1800,
    priceFormatted: 'R$ 1.800,00',
    location: 'Lapa, Sao Paulo',
    category: 'Instrumentos',
    condition: 'usado',
    contactId: 'felipe',
    contactName: 'Felipe Nunes',
    color: '#273A63',
    images: [],
    views: 921,
    favorites: 67,
    createdAt: Date.now() - 86400000 * 8,
    active: true,
  },
  {
    id: 'p10',
    title: 'Corrida deTrail Running',
    description:
      'Tenis de trail running com caneleira alta, amortecimento responsivo. Solado Vibram. Indicado para trilhas e terrenos acidentados.',
    price: 380,
    priceFormatted: 'R$ 380,00',
    location: 'Barra da Tijuca, Rio de Janeiro',
    category: 'Esportes',
    condition: 'novo',
    contactId: 'moda',
    contactName: 'Moda & Estilo',
    color: '#3B5795',
    images: [],
    views: 189,
    favorites: 15,
    createdAt: Date.now() - 86400000 * 9,
    active: true,
  },
];

export function findContact(id: string): Contact | undefined {
  return CONTACTS.find((contact) => contact.id === id);
}
