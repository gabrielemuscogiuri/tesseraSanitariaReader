export type CardData = {
  issuer?: string;
  issuer_region?: string;
  issue_date?: string;
  expiration_date?: string;
  surname?: string;
  given_name?: string;
  date_of_birth?: string;
  sex?: string;
  height?: string;
  tax_payer_number?: string;
  citizenship?: string;
  city_of_birth_code?: string;
  city_of_birth?: string;
  foreign_birth_country?: string;
  birth_certificate_ref?: string;
  city_of_residence_code?: string;
  city_of_residence?: string;
  street?: string;
  notes?: string;
  cardId?: string;
};

export type ConnectOptions = {
  share_mode?: number;
};

export type CardStatus = {
  atr?: Buffer;
  state: number;
};

export type TransmitCallback = (err: Error | null | undefined, response: Buffer) => void;

export type ConnectCallback = (err: Error | null | undefined, protocol: number) => void;

export type DisconnectCallback = (err: Error | null | undefined) => void;

export type SmartCardReader = {
  name: string;
  SCARD_SHARE_SHARED: number;
  SCARD_STATE_MUTE: number;
  SCARD_STATE_PRESENT: number;
  connect: (options: ConnectOptions, callback: ConnectCallback) => void;
  transmit: (data: Buffer, resLen: number, protocol: number, callback: TransmitCallback) => void;
  disconnect: (callback: DisconnectCallback) => void;
  on(event: 'status', listener: (status: CardStatus) => void): void;
  on(event: 'error', listener: (error: Error) => void): void;
  on(event: 'end', listener: () => void): void;
};

export type WatchOptions = {
  onCard: (data: CardData, meta: { readerName: string }) => void | Promise<void>;
  onRemove?: (meta: { readerName: string }) => void;
  onError?: (error: Error) => void;
  onReader?: (readerName: string) => void;
};

export type WatchHandle = {
  close: () => void;
};

export type Comune = {
  nome: string;
  provincia: string;
  regione: string;
};

export type CatastaleMatch = {
  code: string;
  nome: string;
  provincia: string;
  regione: string;
  label: string;
};

export type PersonalDataField =
  | 'issuer'
  | 'issue_date'
  | 'expiration_date'
  | 'surname'
  | 'given_name'
  | 'date_of_birth'
  | 'sex'
  | 'height'
  | 'tax_payer_number'
  | 'citizenship'
  | 'city_of_birth_code'
  | 'foreign_birth_country'
  | 'birth_certificate_ref'
  | 'city_of_residence_code'
  | 'street'
  | 'notes';

export type ParsedPersonalData = Record<PersonalDataField, string>;
