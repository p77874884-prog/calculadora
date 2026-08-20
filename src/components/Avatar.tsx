import { Image, Text, View } from 'react-native';

const PALETTE = ['#D4AF37', '#E5C158', '#B8942E', '#3B5795', '#2E4370', '#C9A227'];

interface AvatarProps {
  name: string;
  size?: number;
  uri?: string | null;
}

export function Avatar({ name, size = 52, uri }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const backgroundColor = PALETTE[name.length % PALETTE.length];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#0B132B', fontWeight: '700', fontSize: size * 0.36 }}>
        {initials}
      </Text>
    </View>
  );
}
