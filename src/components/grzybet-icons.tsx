import { View } from 'react-native';

type IconProps = { size?: number; color?: string };

export function LockIcon({ size = 48, color = '#777777' }: IconProps) {
  return <View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none" style={{ width: size, height: size }}>
    <View style={{ position: 'absolute', top: '8%', left: '25%', width: '50%', height: '48%', borderWidth: size * 0.065,
      borderColor: color, borderTopLeftRadius: size * 0.25, borderTopRightRadius: size * 0.25 }} />
    <View style={{ position: 'absolute', bottom: '8%', left: '13%', width: '74%', height: '53%', borderRadius: size * 0.1,
      backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: '14%', height: '20%', borderRadius: size, backgroundColor: '#222222' }} />
      <View style={{ width: '7%', height: '16%', marginTop: -size * 0.02, borderRadius: size * 0.02, backgroundColor: '#222222' }} />
    </View>
  </View>;
}

export function MushroomIcon({ size = 28, color = '#238C45', stemColor = '#FFFFFF', spotColor = stemColor, stemOutline }: IconProps & { stemColor?: string; spotColor?: string; stemOutline?: string }) {
  return <View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none" style={{ width: size, height: size }}>
    <View style={{ position: 'absolute', left: '38%', bottom: '8%', width: '24%', height: '51%', backgroundColor: stemColor,
      borderWidth: stemOutline ? size * 0.008 : 0, borderColor: stemOutline,
      borderTopLeftRadius: size * 0.08, borderTopRightRadius: size * 0.08, borderBottomLeftRadius: size * 0.1, borderBottomRightRadius: size * 0.1 }} />
    <View style={{ position: 'absolute', top: '10%', left: '5%', width: '90%', height: '49%', backgroundColor: color,
      borderTopLeftRadius: size * 0.48, borderTopRightRadius: size * 0.48, borderBottomLeftRadius: size * 0.12, borderBottomRightRadius: size * 0.12 }}>
      <View style={{ position: 'absolute', top: '31%', left: '24%', width: '15%', height: '25%', borderRadius: size, backgroundColor: spotColor }} />
      <View style={{ position: 'absolute', top: '48%', right: '22%', width: '11%', height: '19%', borderRadius: size, backgroundColor: spotColor }} />
    </View>
  </View>;
}

export function GrzybdexIcon({ size = 28, color = '#888888' }: IconProps) {
  return <View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none" style={{ width: size, height: size }}>
    <View style={{ position: 'absolute', top: '12%', left: '4%', width: '47%', height: '76%', borderWidth: 1.8, borderColor: color,
      borderTopLeftRadius: 4, borderBottomLeftRadius: 4, transform: [{ skewY: '8deg' }] }} />
    <View style={{ position: 'absolute', top: '12%', right: '4%', width: '47%', height: '76%', borderWidth: 1.8, borderColor: color,
      borderTopRightRadius: 4, borderBottomRightRadius: 4, transform: [{ skewY: '-8deg' }] }} />
    <View style={{ position: 'absolute', top: '34%', left: '18%', width: '19%', height: 1.5, backgroundColor: color }} />
    <View style={{ position: 'absolute', top: '49%', left: '18%', width: '19%', height: 1.5, backgroundColor: color }} />
    <View style={{ position: 'absolute', top: '34%', right: '18%', width: '19%', height: 1.5, backgroundColor: color }} />
    <View style={{ position: 'absolute', top: '49%', right: '18%', width: '19%', height: 1.5, backgroundColor: color }} />
  </View>;
}

export function ProfileIcon({ size = 28, color = '#FFFFFF' }: IconProps) {
  return <View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none" style={{ width: size, height: size }}>
    <View style={{ position: 'absolute', top: '5%', left: '33%', width: '34%', height: '34%', borderWidth: 1.8, borderColor: color, borderRadius: size }} />
    <View style={{ position: 'absolute', bottom: '6%', left: '13%', width: '74%', height: '42%', borderWidth: 1.8, borderColor: color,
      borderTopLeftRadius: size * 0.4, borderTopRightRadius: size * 0.4, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }} />
  </View>;
}
