import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';

export interface Params {
  assetId: string;
  addresses: string[];
  currency: string;
  groupBy: ('by-wallet' | 'by-app')[];
}

interface NetworkShortInfo {
  id: string;
  name: string;
  iconUrl: string;
  testnet: boolean;
}

export interface WalletAssetDetails {
  chainsDistribution: Array<{
    chain: NetworkShortInfo;
    value: number;
    percentageAllocation: number;
  }> | null;
  wallets: Array<{
    wallet: {
      name: string;
      iconUrl: string;
      premium: boolean;
      address: string;
    };
    chains: NetworkShortInfo[];
    value: number;
    convertedQuantity: number;
    percentageAllocation: number;
  }>;
  apps: Array<{
    app: {
      id: string;
      name: string;
      iconUrl: string | null;
      url: string | null;
    };
    chains: NetworkShortInfo[];
    value: number;
    convertedQuantity: number;
    percentageAllocation: number;
  }> | null;
  totalValue: number;
  totalConvertedQuantity: number;
}

type Response = ResponseBody<WalletAssetDetails>;

export async function walletGetAssetDetails(
  this: ZerionApiContext,
  params: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const firstAddress = params.addresses[0];
  const provider = await this.getAddressProviderHeader(firstAddress);
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.post<Response>(
    {
      endpoint: 'wallet/get-asset-details/v1',
      body: JSON.stringify(params),
      headers: { 'Zerion-Wallet-Provider': provider },
      ...options,
    },
    kyOptions
  );
}
