import React, { useCallback, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { walletPort, windowPort } from 'src/ui/shared/channels';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Button } from 'src/ui/ui-kit/Button';
import { Background } from 'src/ui/components/Background';
import { Surface } from 'src/ui/ui-kit/Surface';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import { FillView } from 'src/ui/components/FillView';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { SiteFaviconImg } from 'src/ui/components/SiteFaviconImg';
import { invariant } from 'src/shared/invariant';
import { focusNode } from 'src/ui/shared/focusNode';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import CheckmarkAllowedIcon from 'jsx:src/ui/assets/checkmark-allowed.svg';
import CheckmarkDeniedIcon from 'jsx:src/ui/assets/checkmark-denied.svg';
import ConnectIcon from 'jsx:src/ui/assets/connect.svg';
import { Badge } from 'src/ui/components/Badge';
import { PageTop } from 'src/ui/components/PageTop';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { Address } from 'src/ui/components/Address';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { PhishingDefenceStatus } from 'src/ui/components/PhishingDefence/PhishingDefenceStatus';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import type { BareWallet } from 'src/shared/types/BareWallet';
import type { DeviceAccount } from 'src/shared/types/Device';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import {
  assertKnownEcosystems,
  isMatchForEcosystem,
} from 'src/shared/wallet/shared';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { EmptyView2 } from 'src/ui/components/EmptyView';
import { WalletList } from '../WalletSelect/WalletList';

function WalletSelectDialog({
  value,
  ecosystem,
  walletGroups,
  onSelect,
}: {
  value: string;
  ecosystem: BlockchainType;
  walletGroups?: WalletGroup[] | null;
  onSelect(wallet: ExternallyOwnedAccount | BareWallet | DeviceAccount): void;
}) {
  return walletGroups?.length ? (
    <WalletList
      selectedAddress={value}
      walletGroups={walletGroups}
      onSelect={onSelect}
      showAddressValues={true}
      predicate={(item) => isMatchForEcosystem(item.address, ecosystem)}
    />
  ) : (
    <FillView>
      <UIText kind="headline/h2" color="var(--neutral-500)">
        No Wallets
      </UIText>
    </FillView>
  );
}

function ChangeWalletButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <UnstyledButton
      style={{
        padding: '6px 12px',
        borderRadius: 40,
        backgroundColor: 'var(--primary-200)',
        color: 'var(--primary-500)',
      }}
      {...props}
    >
      <UIText kind="caption/accent">Change</UIText>
    </UnstyledButton>
  );
}

function useRedirectIfOriginAlreadyAllowed({
  origin,
  address,
  onIsAllowed,
}: {
  origin: string;
  address: string | undefined;
  onIsAllowed: () => void;
}) {
  useQuery({
    queryKey: ['getOriginPermissions'],
    queryFn: () => walletPort.request('getOriginPermissions'),
    enabled: Boolean(address),
    useErrorBoundary: true,
    suspense: true,
    refetchOnWindowFocus: false,
    retry: false,
    onSuccess(result) {
      if (!address) {
        return;
      }
      const normalizedAddress = normalizeAddress(address);
      const isAllowed = result[origin]?.addresses.includes(normalizedAddress);
      if (isAllowed) {
        onIsAllowed();
      }
    },
  });
}

function RequestAccountsPermissions({ originName }: { originName: string }) {
  return (
    <Surface padding={16} style={{ border: '1px solid var(--neutral-300)' }}>
      <HStack gap={12}>
        <VStack gap={8}>
          <UIText kind="small/accent">Allow {originName} to:</UIText>
          <HStack gap={8} alignItems="center">
            <CheckmarkAllowedIcon />
            <UIText kind="small/regular">See your balance and activity</UIText>
          </HStack>
          <HStack gap={8} alignItems="center">
            <CheckmarkAllowedIcon />
            <UIText kind="small/regular">Send request for approvals</UIText>
          </HStack>
          <HStack gap={8} alignItems="center">
            <CheckmarkDeniedIcon />
            <UIText kind="small/regular">
              Sign transactions without your approval
            </UIText>
          </HStack>
        </VStack>
      </HStack>
    </Surface>
  );
}

function RequestAccountsView({
  origin,
  ecosystem,
  wallet,
  walletGroups,
  onConfirm,
  onReject,
}: {
  origin: string;
  ecosystem: BlockchainType;
  wallet: ExternallyOwnedAccount;
  walletGroups?: WalletGroup[] | null;
  onConfirm: (value: { address: string; origin: string }) => void;
  onReject: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const [selectedWallet, setSelectedWallet] = useState(wallet);
  const originName = new URL(origin).hostname;
  const iconSize = 32;
  const iconBorderRadius = 6;
  return (
    <Background backgroundKind="white">
      <NavigationTitle title={null} documentTitle="Connect Wallet" />
      <CenteredDialog
        ref={dialogRef}
        containerStyle={{
          ['--surface-background-color' as string]: 'transparent',
        }}
      >
        <DialogTitle
          title={<UIText kind="body/accent">Select Wallet</UIText>}
          closeKind="icon"
        />
        <WalletSelectDialog
          value={normalizeAddress(selectedWallet.address)}
          walletGroups={walletGroups}
          ecosystem={ecosystem}
          onSelect={(wallet) => {
            dialogRef.current?.close();
            setSelectedWallet(wallet);
          }}
        />
      </CenteredDialog>
      <PageTop />
      <PageColumn
        style={{ ['--surface-background-color' as string]: 'var(--z-index-0)' }}
      >
        <Badge
          icon={<ConnectIcon style={{ color: 'var(--neutral-500)' }} />}
          text="Connect Wallet"
        />
        <Spacer height={16} />
        <VStack gap={8}>
          <UIText kind="small/accent" color="var(--neutral-500)">
            To application
          </UIText>
          <HStack gap={8} alignItems="center">
            <SiteFaviconImg
              size={iconSize}
              style={{ borderRadius: iconBorderRadius }}
              url={origin}
              alt={`Logo for ${origin}`}
            />
            <UIText kind="headline/h2">{new URL(origin).hostname}</UIText>
          </HStack>
        </VStack>
        <Spacer height={16} />
        <VStack gap={8}>
          <UIText kind="small/accent" color="var(--neutral-500)">
            With wallet
          </UIText>
          <HStack gap={8} alignItems="center" justifyContent="space-between">
            <HStack gap={8} alignItems="center">
              <WalletAvatar
                address={selectedWallet.address}
                size={iconSize}
                borderRadius={iconBorderRadius}
              />
              <UIText kind="headline/h2">
                <WalletDisplayName wallet={selectedWallet} />
              </UIText>
            </HStack>
            <ChangeWalletButton
              onClick={() => {
                dialogRef.current?.showModal();
              }}
            />
          </HStack>
          <Address
            address={normalizeAddress(selectedWallet.address)}
            infixColor="var(--neutral-500)"
          />
        </VStack>
        <Spacer height={16} />
        <ZStack hideLowerElements={true}>
          <PhishingDefenceStatus origin={origin} type="dapp" />
          <RequestAccountsPermissions originName={originName} />
        </ZStack>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginTop: 'auto',
            paddingBottom: 32,
          }}
        >
          <Button
            type="button"
            kind="regular"
            onClick={onReject}
            ref={focusNode}
          >
            Cancel
          </Button>
          <Button
            onClick={() =>
              onConfirm({ address: selectedWallet.address, origin })
            }
          >
            Connect
          </Button>
        </div>
      </PageColumn>
    </Background>
  );
}

class NoWalletForEcosystemError extends Error {}

export function RequestAccounts() {
  const [params] = useSearchParams();
  const origin = params.get('origin');
  const windowId = params.get('windowId');
  const ecosystem = (params.get('ecosystem') || 'evm') as BlockchainType;
  assertKnownEcosystems([ecosystem]);

  invariant(origin, 'origin get-parameter is required');
  invariant(windowId, 'windowId get-parameter is required');

  const { data, isLoading, isError, error } = useQuery({
    retry: 1,
    queryKey: ['prepareRequestAccountsViewData', ecosystem],
    useErrorBoundary: false,
    queryFn: async () => {
      const currentWallet = await walletPort.request('uiGetCurrentWallet');
      const allWalletGroups = await walletPort.request('uiGetWalletGroups');
      const walletGroups = allWalletGroups?.filter((group) => {
        return group.walletContainer.wallets.some((wallet) =>
          isMatchForEcosystem(wallet.address, ecosystem)
        );
      });

      const currentAddress = currentWallet?.address;

      let wallet: typeof currentWallet = null;
      if (currentAddress && isMatchForEcosystem(currentAddress, ecosystem)) {
        wallet = currentWallet;
      } else {
        wallet =
          walletGroups
            ?.at(0)
            ?.walletContainer.wallets.find((wallet) =>
              isMatchForEcosystem(wallet.address, ecosystem)
            ) ?? null;
      }
      if (!wallet) {
        throw new NoWalletForEcosystemError(ecosystem);
      }
      return { wallet, walletGroups };
    },
  });
  const wallet = data?.wallet;
  const walletGroups = data?.walletGroups;
  const handleConfirm = useCallback(
    (result: { address: string; origin: string }) => {
      windowPort.confirm(windowId, result);
    },
    [windowId]
  );
  const handleReject = () => windowPort.reject(windowId);

  useRedirectIfOriginAlreadyAllowed({
    origin,
    address: wallet?.address,
    onIsAllowed: () => {
      if (!wallet) {
        throw new Error('Wallet must be defined');
      }
      handleConfirm({ address: wallet.address, origin });
    },
  });

  if (isError) {
    if (error instanceof NoWalletForEcosystemError) {
      const messages: Record<BlockchainType, string> = {
        solana:
          'You do not have Solana wallets to connect. Please close this window and visit Settings –> Manage Wallets to create a Solana wallet',
        evm: 'You do not have Ethereum wallets to connect. Please close this window and visit Settings –> Manage Wallets to create an Ethereum wallet',
      };
      return (
        <EmptyView2
          title="No wallets to connect"
          message={messages[ecosystem]}
        />
      );
    } else {
      throw error;
    }
  }
  if (isLoading || !wallet) {
    return null;
  }
  return (
    <>
      <RequestAccountsView
        wallet={wallet}
        walletGroups={walletGroups}
        origin={origin}
        ecosystem={ecosystem}
        onConfirm={handleConfirm}
        onReject={handleReject}
      />
    </>
  );
}
