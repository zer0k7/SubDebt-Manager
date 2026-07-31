import { useTheme } from '../hooks/useTheme';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getSubscriptionIcon, IconKey } from '../utils/subscriptionIcons';
import {
  NetflixIcon, YouTubeIcon, SpotifyIcon, ChatGPTIcon, ClaudeIcon,
  GitHubIcon, NotionIcon, FigmaIcon, AdobeIcon, DisneyIcon,
  AmazonIcon, AppleMusicIcon, GoogleOneIcon, MicrosoftIcon,
  PrimeVideoIcon, HotstarIcon, HboIcon, HuluIcon, SonyLivIcon,
  Zee5Icon, JioCinemaIcon, CrunchyrollIcon,
  JioSaavnIcon, GaanaIcon, WynkIcon, AudibleIcon,
  PlayStationIcon, XboxIcon, SteamIcon, NintendoIcon, EpicGamesIcon,
  DiscordIcon, SlackIcon, ZoomIcon, TwitchIcon, LinkedInIcon,
  DropboxIcon, CanvaIcon, GrammarlyIcon,
  OnePasswordIcon, LastPassIcon, BitwardenIcon,
  NordVpnIcon, ExpressVpnIcon, SurfsharkIcon, ProtonVpnIcon,
  DuolingoIcon, CourseraIcon, UdemyIcon,
  JioIcon, AirtelIcon, ViIcon,
  SwiggyIcon, ZomatoIcon, TimesPrimeIcon,
  AwsIcon, VercelIcon, CloudflareIcon, DigitalOceanIcon,
  GeminiIcon, GoogleIcon, CopilotIcon, BsnlIcon,
} from './icons';

interface SubscriptionIconProps {
  name: string;
  size?: number;
}

const iconMap: Record<IconKey, React.FC<{ size?: number }>> = {
  netflix: NetflixIcon, youtube: YouTubeIcon, spotify: SpotifyIcon,
  chatgpt: ChatGPTIcon, claude: ClaudeIcon, github: GitHubIcon,
  notion: NotionIcon, figma: FigmaIcon, adobe: AdobeIcon,
  disney: DisneyIcon, amazon: AmazonIcon, applemusic: AppleMusicIcon,
  googleone: GoogleOneIcon, microsoft: MicrosoftIcon,
  primevideo: PrimeVideoIcon, hotstar: HotstarIcon, hbo: HboIcon,
  hulu: HuluIcon, sonyliv: SonyLivIcon, zee5: Zee5Icon,
  jiocinema: JioCinemaIcon, crunchyroll: CrunchyrollIcon,
  jiosaavn: JioSaavnIcon, gaana: GaanaIcon, wynk: WynkIcon,
  audible: AudibleIcon, playstation: PlayStationIcon, xbox: XboxIcon,
  steam: SteamIcon, nintendo: NintendoIcon, epicgames: EpicGamesIcon,
  discord: DiscordIcon, slack: SlackIcon, zoom: ZoomIcon,
  twitch: TwitchIcon, linkedin: LinkedInIcon, dropbox: DropboxIcon,
  canva: CanvaIcon, grammarly: GrammarlyIcon,
  onepassword: OnePasswordIcon, lastpass: LastPassIcon,
  bitwarden: BitwardenIcon, nordvpn: NordVpnIcon,
  expressvpn: ExpressVpnIcon, surfshark: SurfsharkIcon,
  protonvpn: ProtonVpnIcon, duolingo: DuolingoIcon,
  coursera: CourseraIcon, udemy: UdemyIcon,
  jio: JioIcon, airtel: AirtelIcon, vi: ViIcon, bsnl: BsnlIcon,
  swiggy: SwiggyIcon, zomato: ZomatoIcon, timesprime: TimesPrimeIcon,
  aws: AwsIcon, vercel: VercelIcon, cloudflare: CloudflareIcon,
  digitalocean: DigitalOceanIcon,
  gemini: GeminiIcon, google: GoogleIcon, copilot: CopilotIcon,
};

export const SubscriptionIcon: React.FC<SubscriptionIconProps> = ({ 
  name, 
  size = 44 
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const result = getSubscriptionIcon(name);

  if (result.type === 'brand' && result.iconKey && iconMap[result.iconKey]) {
    const IconComponent = iconMap[result.iconKey];
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
        <IconComponent size={size * 0.6} />
      </View>
    );
  }

  // Fallback avatar
  return (
    <View 
      style={[
        styles.container, 
        styles.fallback,
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: result.color || colors.glass.input,
        }
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.4 }]}>
        {result.letter}
      </Text>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.glass.input,
    borderWidth: 1,
    borderColor: colors.glass.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fallback: {
    borderWidth: 2,
  },
  letter: {
    color: colors.text.primary,
    fontWeight: '700',
  },
});
