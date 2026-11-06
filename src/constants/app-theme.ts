export const appThemes = {
  dark: {
    background: '#111111', surface: '#191919', surfaceRaised: '#282828', surfaceInset: '#141414',
    text: '#FFFFFF', textSecondary: '#BBBBBB', textMuted: '#999999',
    border: '#333333', borderStrong: '#444444',
    primary: '#217D3D', onPrimary: '#FFFFFF', accent: '#81D199',
    danger: '#F09C96', dangerFill: '#A6322D',
    mushroomStem: '#FFFFFF', mushroomSpots: '#FFFFFF',
    accentSoft: '#17251C', accentSurface: '#23352A', accentBorder: '#33543D',
    avatar: '#254D31', avatarText: '#B1E7BF',
    overlay: 'rgba(0, 0, 0, 0.78)', photoPlaceholder: '#222222', lock: '#777777',
    gold: '#DAC184', warning: '#DCC080', warningText: '#292419',
    badges: { wood: '#BB956E', bronze: '#CE915E', silver: '#C5D2DF', gold: '#EFCA62', diamond: '#7DDEE8', mushroomer: '#A4E6B6' },
  },
  light: {
    background: '#F5F7F2', surface: '#FFFFFF', surfaceRaised: '#EAF0E5', surfaceInset: '#F0F3EC',
    text: '#18251C', textSecondary: '#526052', textMuted: '#616D60',
    border: '#D7DFD2', borderStrong: '#B9C7B5',
    primary: '#217D3D', onPrimary: '#FFFFFF', accent: '#246B3C',
    danger: '#A02F2A', dangerFill: '#A6322D',
    mushroomStem: '#F3E8D4', mushroomSpots: '#FFF9ED',
    accentSoft: '#EAF3E6', accentSurface: '#DDEDD7', accentBorder: '#BED1BF',
    avatar: '#D1E6C8', avatarText: '#245F35',
    overlay: 'rgba(18, 35, 24, 0.38)', photoPlaceholder: '#E5EAE1', lock: '#858D83',
    gold: '#8C631B', warning: '#E7CB8E', warningText: '#513C16',
    badges: { wood: '#79552F', bronze: '#91521E', silver: '#536579', gold: '#856315', diamond: '#116D78', mushroomer: '#28663B' },
  },
};
export type AppColors = typeof appThemes.dark;
