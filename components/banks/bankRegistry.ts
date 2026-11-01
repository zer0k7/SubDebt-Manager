export interface BankDefinition {
  id: string;
  name: string;
  shortName: string;
  aliases: string[];
  brandColor: string;
  brandBgColor: string;
}

export const INDIAN_BANKS: BankDefinition[] = [
  {
    id: 'jk_bank',
    name: 'J&K Bank',
    shortName: 'J&K',
    aliases: ['j&k', 'jk bank', 'jk', 'jammu & kashmir', 'jammu and kashmir', 'j and k'],
    brandColor: '#007BC3',
    brandBgColor: '#ED3823',
  },
  {
    id: 'sbi',
    name: 'State Bank of India',
    shortName: 'SBI',
    aliases: ['sbi', 'state bank', 'state bank of india'],
    brandColor: '#00A3E0',
    brandBgColor: '#0C2340',
  },
  {
    id: 'slice',
    name: 'Slice Bank',
    shortName: 'Slice',
    aliases: ['slice', 'slice bank', 'slice upi'],
    brandColor: '#8B19E6',
    brandBgColor: '#8B19E6',
  },
  {
    id: 'ippb',
    name: 'India Post Payments Bank',
    shortName: 'IPPB',
    aliases: ['ippb', 'india post', 'post office', 'post bank', 'india post payments'],
    brandColor: '#4A1521',
    brandBgColor: '#D92429',
  },
  {
    id: 'kotak',
    name: 'Kotak Mahindra Bank',
    shortName: 'Kotak',
    aliases: ['kotak', 'kotak mahindra', 'kotak 811', '811'],
    brandColor: '#ED1C24',
    brandBgColor: '#0C346B',
  },
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    shortName: 'HDFC',
    aliases: ['hdfc', 'hdfc bank'],
    brandColor: '#004C8F',
    brandBgColor: '#ED232A',
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    shortName: 'ICICI',
    aliases: ['icici', 'icici bank', 'imobile'],
    brandColor: '#F58220',
    brandBgColor: '#8B1C24',
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    shortName: 'Axis',
    aliases: ['axis', 'axis bank'],
    brandColor: '#861F41',
    brandBgColor: '#861F41',
  },
  {
    id: 'pnb',
    name: 'Punjab National Bank',
    shortName: 'PNB',
    aliases: ['pnb', 'punjab national', 'punjab national bank'],
    brandColor: '#F8B11B',
    brandBgColor: '#781123',
  },
  {
    id: 'bob',
    name: 'Bank of Baroda',
    shortName: 'BOB',
    aliases: ['bob', 'baroda', 'bank of baroda'],
    brandColor: '#F26522',
    brandBgColor: '#F26522',
  },
  {
    id: 'paytm',
    name: 'Paytm Payments Bank',
    shortName: 'Paytm',
    aliases: ['paytm', 'paytm bank', 'paytm payments'],
    brandColor: '#00BAF2',
    brandBgColor: '#002970',
  },
  {
    id: 'airtel',
    name: 'Airtel Payments Bank',
    shortName: 'Airtel',
    aliases: ['airtel', 'airtel bank', 'airtel payments', 'airtel money'],
    brandColor: '#E40000',
    brandBgColor: '#E40000',
  },
  {
    id: 'canara',
    name: 'Canara Bank',
    shortName: 'Canara',
    aliases: ['canara', 'canara bank'],
    brandColor: '#0072BB',
    brandBgColor: '#FFCC00',
  },
  {
    id: 'union',
    name: 'Union Bank of India',
    shortName: 'Union',
    aliases: ['union', 'union bank', 'union bank of india', 'ubi'],
    brandColor: '#E31E24',
    brandBgColor: '#0054A6',
  },
  {
    id: 'indusind',
    name: 'IndusInd Bank',
    shortName: 'IndusInd',
    aliases: ['indusind', 'indus ind', 'indusind bank'],
    brandColor: '#841829',
    brandBgColor: '#841829',
  },
  {
    id: 'yes',
    name: 'Yes Bank',
    shortName: 'Yes',
    aliases: ['yes', 'yes bank'],
    brandColor: '#0B4EA2',
    brandBgColor: '#ED1C24',
  },
  {
    id: 'federal',
    name: 'Federal Bank',
    shortName: 'Federal',
    aliases: ['federal', 'federal bank'],
    brandColor: '#003580',
    brandBgColor: '#FFB81C',
  },
  {
    id: 'idfc',
    name: 'IDFC FIRST Bank',
    shortName: 'IDFC',
    aliases: ['idfc', 'idfc first', 'idfc first bank', 'idfc bank'],
    brandColor: '#9E1B32',
    brandBgColor: '#F37021',
  },
];

export const matchBank = (name: string): BankDefinition | null => {
  if (!name || !name.trim()) return null;
  const normalized = name.toLowerCase().replace(/[^a-z0-9&]/g, ' ').replace(/\s+/g, ' ').trim();

  for (const bank of INDIAN_BANKS) {
    for (const alias of bank.aliases) {
      const aliasNorm = alias.toLowerCase().replace(/[^a-z0-9&]/g, ' ').replace(/\s+/g, ' ').trim();
      if (normalized === aliasNorm) {
        return bank;
      }
      if (normalized.startsWith(aliasNorm + ' ') || normalized.endsWith(' ' + aliasNorm) || normalized.includes(' ' + aliasNorm + ' ')) {
        return bank;
      }
    }
  }

  for (const bank of INDIAN_BANKS) {
    for (const alias of bank.aliases) {
      if (alias.length >= 3 && normalized.includes(alias)) {
        return bank;
      }
    }
  }

  return null;
};
