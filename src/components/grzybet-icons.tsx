import type { ReactNode } from 'react';
import { Platform } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

type IconProps = { size?: number; color?: string };
const decorativeProps = Platform.OS === 'web'
  ? { 'aria-hidden': true, focusable: false }
  : { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const, focusable: false };

// Labels belong to the surrounding button or card, not to decorative drawings.
function IconCanvas({ size, children }: { size: number; children: ReactNode }) {
  return <Svg width={size} height={size} viewBox="0 0 100 100" fill="none"
    strokeLinecap="round" strokeLinejoin="round" {...decorativeProps} pointerEvents="none">
    {children}
  </Svg>;
}

// Lucide outline geometry; copyright and ISC/Feather MIT notices:
// assets/branding/LUCIDE-LICENSE.txt.
function OutlineCanvas({ size, color, children }: IconProps & { size: number; children: ReactNode }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" {...decorativeProps} pointerEvents="none">
    {children}
  </Svg>;
}

export function SproutIcon({ size = 20, color = '#999999' }: IconProps) {
  return <OutlineCanvas size={size} color={color}>
    <Path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3" />
    <Path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4M5 21h14" />
  </OutlineCanvas>;
}

export function InfoIcon({ size = 18, color = '#999999' }: IconProps) {
  return <OutlineCanvas size={size} color={color}>
    <Circle cx={12} cy={12} r={10} /><Path d="M12 16v-4M12 8h.01" />
  </OutlineCanvas>;
}

export function SearchIcon({ size = 22, color = '#999999' }: IconProps) {
  return <OutlineCanvas size={size} color={color}>
    <Circle cx={10.5} cy={10.5} r={7.5} /><Path d="m16 16 5 5" />
  </OutlineCanvas>;
}

export function PeopleIcon({ size = 16, color = '#999999' }: IconProps) {
  return <OutlineCanvas size={size} color={color}>
    <Path d="M18 21a8 8 0 0 0-16 0" /><Circle cx={10} cy={8} r={5} />
    <Path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
  </OutlineCanvas>;
}

export function HashIcon({ size = 20, color = '#999999' }: IconProps) {
  return <OutlineCanvas size={size} color={color}><Path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" /></OutlineCanvas>;
}

export function MushroomIcon({ size = 28, color = '#238C45', stemColor = '#FFFFFF', spotColor = stemColor, stemOutline }: IconProps & {
  stemColor?: string; spotColor?: string; stemOutline?: string;
}) {
  return <IconCanvas size={size}>
    <Path d="M46 41H54A8 8 0 0 1 62 49V82A10 10 0 0 1 52 92H48A10 10 0 0 1 38 82V49A8 8 0 0 1 46 41Z"
      fill={stemColor} stroke={stemOutline ?? 'none'} strokeWidth={0.8} />
    <Path d="M44.2 10H55.8A39.2 39.2 0 0 1 95 49.2A9.8 9.8 0 0 1 85.2 59H14.8A9.8 9.8 0 0 1 5 49.2A39.2 39.2 0 0 1 44.2 10Z" fill={color} />
    <Rect x={26.6} y={25.19} width={13.5} height={12.25} rx={6.125} fill={spotColor} />
    <Rect x={65.3} y={33.52} width={9.9} height={9.31} rx={4.655} fill={spotColor} />
  </IconCanvas>;
}

export function LockIcon({ size = 48, color = '#777777' }: IconProps) {
  return <IconCanvas size={size}>
    <Path d="M28.25 49V33A21.75 21.75 0 0 1 71.75 33V49" stroke={color} strokeWidth={6.5} />
    <Path fill={color} fillRule="evenodd"
      d="M23 39H77A10 10 0 0 1 87 49V82A10 10 0 0 1 77 92H23A10 10 0 0 1 13 82V49A10 10 0 0 1 23 39Z M50 57A5.2 5.2 0 0 1 52.6 66.7V74H47.4V66.7A5.2 5.2 0 0 1 50 57Z" />
  </IconCanvas>;
}

export function GrzybdexIcon({ size = 28, color = '#888888' }: IconProps) {
  return <OutlineCanvas size={size} color={color}>
    <Path d="M12 5v16M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" />
  </OutlineCanvas>;
}

export function ProfileIcon({ size = 28, color = '#FFFFFF' }: IconProps) {
  return <OutlineCanvas size={size} color={color}>
    <Circle cx={12} cy={8} r={5} /><Path d="M20 21a8 8 0 0 0-16 0" />
  </OutlineCanvas>;
}

export function SettingsIcon({ size = 26, color = '#FFFFFF' }: IconProps) {
  return <IconCanvas size={size}>
    <G stroke={color} strokeWidth={6.4}>
      <Path d="M83.47 39.77L92.47 43.27V56.73L83.47 60.23L80.9 66.43L84.79 75.27L75.27 84.79L66.43 80.9L60.23 83.47L56.73 92.47H43.27L39.77 83.47L33.57 80.9L24.73 84.79L15.21 75.27L19.1 66.43L16.53 60.23L7.53 56.73V43.27L16.53 39.77L19.1 33.57L15.21 24.73L24.73 15.21L33.57 19.1L39.77 16.53L43.27 7.53H56.73L60.23 16.53L66.43 19.1L75.27 15.21L84.79 24.73L80.9 33.57Z" />
      <Circle cx={50} cy={50} r={15} />
    </G>
  </IconCanvas>;
}

export function HelpCircleIcon({ size = 20, color = '#999999' }: IconProps) {
  return <IconCanvas size={size}>
    <G stroke={color} strokeWidth={7.5}>
      <Circle cx={50} cy={50} r={45} />
      <Path d="M37 36A13 13 0 0 1 63 36C63 45 50 47 50 57" />
    </G>
    <Circle cx={50} cy={73} r={3.8} fill={color} />
  </IconCanvas>;
}

export function ChevronIcon({ size = 20, color = '#999999', direction = 'down' }: IconProps & { direction?: 'up' | 'down' }) {
  return <IconCanvas size={size}><Path d={direction === 'up' ? 'M28 61L50 39L72 61' : 'M28 39L50 61L72 39'} stroke={color} strokeWidth={8} /></IconCanvas>;
}

export function CloseIcon({ size = 22, color = '#999999' }: IconProps) {
  return <IconCanvas size={size}><Path d="M28 28L72 72M72 28L28 72" stroke={color} strokeWidth={8} /></IconCanvas>;
}

export function CheckIcon({ size = 20, color = '#81D199' }: IconProps) {
  return <IconCanvas size={size}><Path d="M20 50L42 72L81 29" stroke={color} strokeWidth={8} /></IconCanvas>;
}

export function PlusIcon({ size = 24, color = '#FFFFFF', expanded = false }: IconProps & { expanded?: boolean }) {
  return <IconCanvas size={size}><Path d={expanded ? 'M24 50H76' : 'M24 50H76M50 24V76'} stroke={color} strokeWidth={7.5} /></IconCanvas>;
}

export function ArrowIcon({ size = 24, color = '#FFFFFF', direction = 'right' }: IconProps & { direction?: 'right' | 'up-right' }) {
  return <IconCanvas size={size}>
    <Path d={direction === 'up-right' ? 'M28 72L72 28M28 28H72V72' : 'M20 50H80M58 28L80 50L58 72'} stroke={color} strokeWidth={7.5} />
  </IconCanvas>;
}

export function HistoryIcon({ size = 26, color = '#81D199' }: IconProps) {
  return <IconCanvas size={size}><Path d="M15 36A36 36 0 1 1 14 65M15 14V36H37M50 29V52L65 62" stroke={color} strokeWidth={7} /></IconCanvas>;
}

export function DiamondIcon({ size = 27, color = '#7DDEE8' }: IconProps) {
  return <IconCanvas size={size}><Path d="M50 7L93 50L50 93L7 50Z" fill={color} /></IconCanvas>;
}

export function SparkleIcon({ size = 27, color = '#DAC184' }: IconProps) {
  return <IconCanvas size={size}><Path d="M50 5L62 38L95 50L62 62L50 95L38 62L5 50L38 38Z" fill={color} /></IconCanvas>;
}

export function ExclamationIcon({ size = 22, color = '#292419' }: IconProps) {
  return <IconCanvas size={size}>
    <Path d="M50 18V56" stroke={color} strokeWidth={10} />
    <Circle cx={50} cy={77} r={5.5} fill={color} />
  </IconCanvas>;
}
