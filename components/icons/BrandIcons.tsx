import React from 'react';
import Svg, { Circle, Path, Rect, Text as SvgText, Defs, LinearGradient, Stop, G, Ellipse, Polygon } from 'react-native-svg';

interface IconProps {
  size?: number;
}

const LetterIcon = ({ size = 24, bg, text, color = '#fff', fontSize = 12 }: 
  IconProps & { bg: string; text: string; color?: string; fontSize?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill={bg} />
    <SvgText x="12" y="16" fontSize={fontSize} fontWeight="bold" fill={color} textAnchor="middle">
      {text}
    </SvgText>
  </Svg>
);

// ==== AI ====
export const GeminiIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="gem" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#4A90E2" />
        <Stop offset="50%" stopColor="#9013FE" />
        <Stop offset="100%" stopColor="#E55D87" />
      </LinearGradient>
    </Defs>
    <Rect width="24" height="24" rx="6" fill="#fff" />
    <Path d="M12 4 C12 8.4 8.4 12 4 12 C8.4 12 12 15.6 12 20 C12 15.6 15.6 12 20 12 C15.6 12 12 8.4 12 4 Z" fill="url(#gem)" />
  </Svg>
);

export const GoogleIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#fff" />
    <Path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="#4285F4" transform="scale(0.8) translate(3, 3)" />
  </Svg>
);

export const CopilotIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#171717" />
    <Path d="M8 9.5 A4 4 0 0 1 16 9.5 L16 11 A4 4 0 0 1 8 11 Z" fill="#fff" />
    <Circle cx="12" cy="12" r="2" fill="#fff" />
    <Path d="M6 14 Q12 18 18 14" stroke="#fff" strokeWidth="2" fill="none" />
  </Svg>
);

// ==== Streaming ====
export const PrimeVideoIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#00A8E1" />
    <Path d="M7 14.5 C9 16 15 16 17 14" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
    <Path d="M16 13 L17.5 14.5 L15 15.5 Z" fill="#fff" />
    <SvgText x="12" y="11" fontSize="6" fontWeight="bold" fill="#fff" textAnchor="middle">prime</SvgText>
  </Svg>
);

export const HotstarIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="hot" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#0F1B41" />
        <Stop offset="100%" stopColor="#1F4292" />
      </LinearGradient>
    </Defs>
    <Rect width="24" height="24" rx="6" fill="url(#hot)" />
    <Path d="M12 4l1.8 4 4.2.5-3 3 .8 4.5L12 13.8 8.2 16l.8-4.5-3-3 4.2-.5z" fill="#fff" />
  </Svg>
);

export const HboIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#000" />
    <SvgText x="12" y="15" fontSize="10" fontWeight="900" fontFamily="serif" fill="#fff" textAnchor="middle">HBO</SvgText>
  </Svg>
);

export const HuluIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#1CE783" />
    <SvgText x="12" y="15" fontSize="8" fontWeight="900" fill="#000" textAnchor="middle">hulu</SvgText>
  </Svg>
);

export const SonyLivIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="sonyliv" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FFA000" />
        <Stop offset="100%" stopColor="#E50914" />
      </LinearGradient>
    </Defs>
    <Rect width="24" height="24" rx="6" fill="url(#sonyliv)" />
    <SvgText x="12" y="15" fontSize="8" fontWeight="bold" fill="#fff" textAnchor="middle">LIV</SvgText>
  </Svg>
);

export const Zee5Icon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#8224E3" />
    <Circle cx="12" cy="12" r="7" stroke="#fff" strokeWidth="1.5" fill="none" strokeDasharray="4 2" />
    <SvgText x="12" y="15" fontSize="7" fontWeight="900" fill="#fff" textAnchor="middle">ZEE5</SvgText>
  </Svg>
);

export const JioCinemaIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="jiocinema" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#C2185B" />
        <Stop offset="100%" stopColor="#4A148C" />
      </LinearGradient>
    </Defs>
    <Rect width="24" height="24" rx="6" fill="url(#jiocinema)" />
    <Path d="M8 8 L16 12 L8 16 Z" fill="#fff" />
  </Svg>
);

export const CrunchyrollIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#F47521" />
    <Circle cx="12" cy="12" r="7" stroke="#fff" strokeWidth="2.5" fill="none" />
    <Path d="M12 16 Q8 16 8 12 Q8 8 12 8" stroke="#fff" strokeWidth="2.5" fill="none" />
    <Circle cx="11" cy="12" r="2.5" fill="#fff" />
  </Svg>
);

// ==== Music ====
export const JioSaavnIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#2BC5B4" />
    <Circle cx="12" cy="12" r="6" fill="#fff" />
    <Circle cx="12" cy="12" r="2" fill="#2BC5B4" />
    <Path d="M12 12 Q16 8 18 12" stroke="#fff" strokeWidth="2" fill="none" />
  </Svg>
);

export const GaanaIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#E72C30" />
    <Path d="M8 16 V8 C12 8 16 12 16 16 Z" fill="#fff" />
    <Circle cx="12" cy="16" r="4" fill="#E72C30" />
  </Svg>
);

export const WynkIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#FE3D8C" />
    <Path d="M7 16 L9 10 L12 14 L15 10 L17 16 Z" stroke="#fff" strokeWidth="2" fill="none" strokeLinejoin="round" />
  </Svg>
);

export const AudibleIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#F8991C" />
    <Path d="M8 14 A4 4 0 0 1 16 14" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
    <Path d="M10 12 A2 2 0 0 1 14 12" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
  </Svg>
);

// ==== Gaming ====
export const PlayStationIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#003791" />
    <Path d="M9 16 V6 L15 8 V12 L9 10" fill="#fff" opacity="0.8" />
    <Path d="M7 14 C7 16 17 16 17 14 C17 12 7 12 7 14" stroke="#fff" strokeWidth="1.5" fill="none" />
  </Svg>
);

export const XboxIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#107C10" />
    <Circle cx="12" cy="12" r="7" fill="none" stroke="#fff" strokeWidth="1.5" />
    <Path d="M8 8 L16 16 M16 8 L8 16" stroke="#fff" strokeWidth="1.5" />
  </Svg>
);

export const SteamIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#171A21" />
    <Circle cx="9" cy="15" r="3" fill="#fff" />
    <Circle cx="15" cy="9" r="2.5" fill="#fff" />
    <Path d="M12 12 L15 9" stroke="#fff" strokeWidth="1.5" />
    <Path d="M10 16 L12 21" stroke="#fff" strokeWidth="1.5" />
  </Svg>
);

export const NintendoIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#E60012" />
    <Rect x="5" y="6" width="6" height="12" rx="3" stroke="#fff" strokeWidth="1.5" fill="none" />
    <Rect x="13" y="6" width="6" height="12" rx="3" fill="#fff" />
    <Circle cx="8" cy="9" r="1" fill="#fff" />
    <Circle cx="16" cy="15" r="1" fill="#E60012" />
  </Svg>
);

export const EpicGamesIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#2A2A2A" />
    <Path d="M12 4 L18 8 L18 16 L12 20 L6 16 L6 8 Z" fill="#fff" />
    <Path d="M12 6 L16 9 L16 15 L12 18 L8 15 L8 9 Z" fill="#2A2A2A" />
  </Svg>
);

// ==== Communication ====
export const DiscordIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#5865F2" />
    <Path d="M16 8 Q12 7 8 8 Q7 13 8 18 Q12 19 16 18 Q17 13 16 8" fill="#fff" />
    <Circle cx="10" cy="12" r="1.5" fill="#5865F2" />
    <Circle cx="14" cy="12" r="1.5" fill="#5865F2" />
  </Svg>
);

export const SlackIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#fff" />
    <Rect x="7" y="10" width="3" height="8" rx="1.5" fill="#36C5F0" transform="rotate(15 8.5 14)" />
    <Rect x="14" y="6" width="3" height="8" rx="1.5" fill="#2EB67D" transform="rotate(15 15.5 10)" />
    <Rect x="10" y="7" width="8" height="3" rx="1.5" fill="#E01E5A" transform="rotate(15 14 8.5)" />
    <Rect x="6" y="14" width="8" height="3" rx="1.5" fill="#ECB22E" transform="rotate(15 10 15.5)" />
  </Svg>
);

export const ZoomIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#2D8CFF" />
    <Rect x="6" y="9" width="8" height="6" rx="2" fill="#fff" />
    <Path d="M14 11 L18 9 L18 15 L14 13 Z" fill="#fff" />
  </Svg>
);

export const TwitchIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#9146FF" />
    <Path d="M7 6 L7 18 L10 18 L10 21 L13 18 L17 18 L17 6 Z" fill="#fff" />
    <Rect x="10" y="9" width="2" height="4" fill="#9146FF" />
    <Rect x="14" y="9" width="2" height="4" fill="#9146FF" />
  </Svg>
);

export const LinkedInIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#0A66C2" />
    <SvgText x="12" y="16" fontSize="11" fontWeight="bold" fill="#fff" textAnchor="middle" fontFamily="sans-serif">in</SvgText>
  </Svg>
);

// ==== Productivity ====
export const DropboxIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#0061FF" />
    <Path d="M12 6 L6 10 L12 14 L18 10 Z" fill="#fff" />
    <Path d="M12 14 L6 18 L12 21 L18 18 Z" fill="#fff" />
  </Svg>
);

export const CanvaIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="canva" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#00C4CC" />
        <Stop offset="100%" stopColor="#7D2AE8" />
      </LinearGradient>
    </Defs>
    <Rect width="24" height="24" rx="6" fill="url(#canva)" />
    <Circle cx="12" cy="12" r="6" stroke="#fff" strokeWidth="2.5" fill="none" strokeDasharray="25 40" strokeLinecap="round" />
  </Svg>
);

export const GrammarlyIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#fff" />
    <Circle cx="12" cy="12" r="7" fill="#15C39A" />
    <Path d="M11 15 L15 10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const OnePasswordIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#0572EC" />
    <Circle cx="12" cy="12" r="6" stroke="#fff" strokeWidth="2" fill="none" />
    <Circle cx="12" cy="12" r="2" fill="#fff" />
    <Path d="M12 12 L16 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const LastPassIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#D32D27" />
    <Circle cx="12" cy="12" r="6" fill="#fff" />
    <Path d="M9 12 h6 M12 9 v6" stroke="#D32D27" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const BitwardenIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#175DDC" />
    <Path d="M12 4 L20 12 L12 20 L4 12 Z" fill="#fff" />
    <Path d="M12 8 L16 12 L12 16 L8 12 Z" fill="#175DDC" />
  </Svg>
);

// ==== VPN & Security ====
export const NordVpnIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#4687FF" />
    <Path d="M6 14 L10 8 L14 16 L18 10" stroke="#fff" strokeWidth="2" fill="none" strokeLinejoin="round" />
  </Svg>
);

export const ExpressVpnIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#DA3940" />
    <Path d="M7 8 L17 8 M7 12 L15 12 M7 16 L17 16" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const SurfsharkIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#1EBFBF" />
    <Path d="M8 14 Q12 8 16 14 T20 12" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
  </Svg>
);

export const ProtonVpnIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#6D4AFF" />
    <Path d="M12 4 L18 8 V16 L12 20 L6 16 V8 Z" fill="#fff" opacity="0.3" />
    <Path d="M12 7 L15 9 V15 L12 17 L9 15 V9 Z" fill="#fff" />
  </Svg>
);

// ==== Education ====
export const DuolingoIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#58CC02" />
    <Path d="M7 11 Q12 18 17 11" stroke="#fff" strokeWidth="2" fill="none" />
    <Circle cx="9" cy="9" r="1.5" fill="#fff" />
    <Circle cx="15" cy="9" r="1.5" fill="#fff" />
  </Svg>
);

export const CourseraIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#0056D2" />
    <Path d="M16 8 A 6 6 0 1 0 16 16" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  </Svg>
);

export const UdemyIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#A435F0" />
    <Path d="M8 8 V12 A 4 4 0 0 0 16 12 V8" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  </Svg>
);

// ==== Indian Telecom ====
export const JioIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#0F2080" />
    <Circle cx="12" cy="12" r="8" fill="#E31837" />
    <SvgText x="12" y="15" fontSize="8" fontWeight="bold" fill="#fff" textAnchor="middle">Jio</SvgText>
  </Svg>
);

export const AirtelIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#FF0000" />
    <Path 
      d="M15 15.5 C15 15.5 14 16.5 12 16.5 C9.5 16.5 8 14.5 8 12 C8 9.5 10 7.5 12.5 7.5 C15 7.5 15.5 9.5 15.5 10.5 C15.5 12 14 13.5 12 13.5 C10.5 13.5 9.5 12 9.5 10.5 C9.5 9 10 8 11.5 8" 
      stroke="#fff" 
      strokeWidth="2.5" 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </Svg>
);

export const ViIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#ED1B24" />
    <Path d="M6 8 L10 16 L14 8" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
    <Circle cx="16" cy="8" r="1.5" fill="#F1C40F" />
  </Svg>
);

export const BsnlIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#fff" />
    <Circle cx="12" cy="12" r="5" fill="#184D98" />
    <Path d="M12 3 A9 9 0 0 1 21 12 L19.5 10.5 M21 12 L22.5 10.5" stroke="#F18025" strokeWidth="2" fill="none" strokeLinecap="round" />
    <Path d="M12 21 A9 9 0 0 1 3 12 L4.5 13.5 M3 12 L1.5 13.5" stroke="#F18025" strokeWidth="2" fill="none" strokeLinecap="round" />
    <SvgText x="12" y="22" fontSize="5" fontWeight="bold" fill="#184D98" textAnchor="middle">BSNL</SvgText>
  </Svg>
);

// ==== Indian Services ====
export const SwiggyIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#FC8019" />
    <Path d="M7 12 C7 8 17 8 17 12 C17 16 7 16 7 12 Z" stroke="#fff" strokeWidth="2" fill="none" />
  </Svg>
);

export const ZomatoIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#E23744" />
    <SvgText x="12" y="16" fontSize="14" fontWeight="900" fontStyle="italic" fill="#fff" textAnchor="middle">z</SvgText>
  </Svg>
);

export const TimesPrimeIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <LinearGradient id="times" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#000" />
        <Stop offset="100%" stopColor="#222" />
      </LinearGradient>
    </Defs>
    <Rect width="24" height="24" rx="6" fill="url(#times)" />
    <Path d="M8 8 L16 8 M12 8 L12 16" stroke="#C0A062" strokeWidth="2.5" fill="none" />
  </Svg>
);

// ==== Cloud & Dev ====
export const AwsIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#232F3E" />
    <Path d="M7 16 Q12 20 17 16" stroke="#FF9900" strokeWidth="2" fill="none" strokeLinecap="round" />
    <SvgText x="12" y="12" fontSize="6" fontWeight="bold" fill="#fff" textAnchor="middle">AWS</SvgText>
  </Svg>
);

export const VercelIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#000" />
    <Path d="M12 6 L18 17 L6 17 Z" fill="#fff" />
  </Svg>
);

export const CloudflareIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#F38020" />
    <Path d="M7 14 C7 11 11 10 13 12 C15 10 18 12 18 14 Z" fill="#fff" />
  </Svg>
);

export const DigitalOceanIcon = ({ size = 24 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill="#0080FF" />
    <Rect x="8" y="10" width="4" height="4" fill="#fff" />
    <Rect x="14" y="10" width="4" height="4" fill="#fff" />
    <Rect x="8" y="16" width="10" height="4" fill="#fff" />
  </Svg>
);
