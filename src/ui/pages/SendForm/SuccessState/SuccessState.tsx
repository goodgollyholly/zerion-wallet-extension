import React from 'react';
import type { SendFormState, SendFormView } from '@zeriontech/transactions';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { createChain } from 'src/modules/networks/Chain';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { invariant } from 'src/shared/invariant';
import { FEATURE_LOYALTY_FLOW } from 'src/env/config';
import { useRemoteConfigValue } from 'src/modules/remote-config/useRemoteConfigValue';
import { SuccessStateToken } from 'src/ui/shared/forms/SuccessState/SuccessStateToken';
import { SuccessStateLoader } from 'src/ui/shared/forms/SuccessState/SuccessStateLoader';
import { SuccessStateAddress } from 'src/ui/shared/forms/SuccessState/SuccessStateAddress';
import { useActionStatusByHash } from 'src/ui/shared/forms/SuccessState/useActionStatusByHash';
import { SuccessStateNft } from 'src/ui/shared/forms/SuccessState/SuccessStateNft';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { GasbackDecorated } from 'src/ui/components/GasbackDecorated';

export interface SendFormSnapshot {
  state: SendFormState;
  tokenItem: SendFormView['tokenItem'];
  nftItem: SendFormView['nftItem'];
}

export function SuccessState({
  sendFormSnapshot,
  gasbackValue,
  hash,
  onDone,
}: {
  sendFormSnapshot: SendFormSnapshot;
  gasbackValue: number | null;
  hash: string;
  onDone: () => void;
}) {
  const { networks } = useNetworks();
  const { tokenItem, nftItem, state } = sendFormSnapshot;
  const { type, tokenChain, nftChain, to } = state;
  const currentChain = type === 'token' ? tokenChain : nftChain;
  invariant(to && currentChain, 'Required Form values are missing');

  const actionStatus = useActionStatusByHash(hash);

  const { data: loyaltyEnabled } = useRemoteConfigValue(
    'extension_loyalty_enabled'
  );
  const FEATURE_GASBACK = loyaltyEnabled && FEATURE_LOYALTY_FLOW === 'on';
  if (!networks) {
    return <ViewLoading />;
  }

  const chain = createChain(currentChain);
  const chainName = networks.getChainName(chain);
  const chainIconUrl = networks.getNetworkByName(chain)?.icon_url;

  return (
    <>
      <NavigationTitle urlBar="none" title="Send Success" />
      <SuccessStateLoader
        startItem={
          type === 'token' && tokenItem ? (
            <SuccessStateToken
              iconUrl={tokenItem?.asset.icon_url}
              symbol={tokenItem?.asset.symbol}
              chainName={chainName}
              chainIconUrl={chainIconUrl}
            />
          ) : type === 'nft' && nftItem ? (
            <SuccessStateNft nftItem={nftItem} />
          ) : null
        }
        endItem={<SuccessStateAddress address={to} />}
        status={actionStatus}
        pendingTitle="Transferring"
        failedTitle="Transfer failed"
        dropppedTitle="Transfer cancelled"
        explorerUrl={
          hash ? networks.getExplorerTxUrlByName(chain, hash) : undefined
        }
        confirmedContent={
          gasbackValue && FEATURE_GASBACK ? (
            <GasbackDecorated value={gasbackValue} />
          ) : null
        }
        onDone={onDone}
      />
    </>
  );
}
