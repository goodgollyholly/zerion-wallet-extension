import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import { invariant } from 'src/shared/invariant';
import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';

export interface Params {
  addresses: string[];
  currency: string;
  nftPriceType?: 'not_included';
}

export interface WalletPortfolio {
  positionsTypesDistribution: {
    assets: number;
    deposited: number;
    borrowed: number;
    locked: number;
    staked: number;
  };
  positionsChainsDistribution: Record<string, number>;
  nfts: {
    lastPrice: number;
    floorPrice: number;
  };
  change24h: {
    absolute: number;
    relative: number;
  };
  totalValue: number;
  chains: Record<
    string,
    {
      id: string;
      explorerTxUrl: string | null;
      iconUrl: string | null;
      testnet: boolean;
      name: string;
    }
  >;
}

type Response = ResponseBody<WalletPortfolio>;

export async function walletGetPortfolio(
  this: ZerionApiContext,
  params: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  // TODO: remove this filter when backend supports solana
  const addresses = params.addresses.filter((addr) => isEthereumAddress(addr));
  invariant(addresses.length > 0, 'Addresses param is empty');
  const firstAddress = addresses[0];
  const provider = await this.getAddressProviderHeader(firstAddress);
  const kyOptions = this.getKyOptions();
  const endpoint = 'wallet/get-portfolio/v1';
  return ZerionHttpClient.post<Response>(
    {
      endpoint,
      body: JSON.stringify({ ...params, addresses }),
      headers: { 'Zerion-Wallet-Provider': provider },
      ...options,
    },
    kyOptions
  );
}
