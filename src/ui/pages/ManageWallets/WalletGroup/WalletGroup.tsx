import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { NotFoundPage } from 'src/ui/components/NotFoundPage';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { walletPort } from 'src/ui/shared/channels';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import type { Item } from 'src/ui/ui-kit/SurfaceList';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import { PortfolioValue } from 'src/ui/shared/requests/PortfolioValue';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { NBSP } from 'src/ui/shared/typography';
import { PageBottom } from 'src/ui/components/PageBottom';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { Button } from 'src/ui/ui-kit/Button';
import { WarningIcon } from 'src/ui/components/WarningIcon';
import {
  useWalletGroup,
  useWalletGroups,
} from 'src/ui/shared/requests/useWalletGroups';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import { getGroupDisplayName } from 'src/ui/shared/getGroupDisplayName';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { InputDecorator } from 'src/ui/ui-kit/Input/InputDecorator';
import { BackupInfoNote } from 'src/ui/components/BackupInfoNote';
import {
  ContainerType,
  getContainerType,
  isHardwareContainer,
  isMnemonicContainer,
  isSignerContainer,
} from 'src/shared/types/validators';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { openHrefInTabView } from 'src/ui/shared/openUrl';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { BLOCKCHAIN_TYPES } from 'src/shared/wallet/classifiers';
import { BlockchainTitleHelper } from 'src/ui/components/BlockchainTitleHelper';
import { FEATURE_SOLANA } from 'src/env/config';
import { groupByEcosystem } from '../shared/groupByEcosystem';

const strings = {
  recoveryPhraseTitle: 'Recovery Phrase',
  privateKeyTitle: 'Private Key',
  getRemoveWalletSubtitle: (containerType: ContainerType) =>
    containerType === ContainerType.mnemonic
      ? 'You can always import it again using your recovery phrase'
      : containerType === ContainerType.privateKey
      ? 'You can always import it again using your private key'
      : containerType === ContainerType.hardware
      ? 'You can import it again by connecting your hardware wallet'
      : containerType === ContainerType.readonly
      ? 'You can always add it back to your watch list'
      : 'You can add it again on the Manage Wallets page',
};

function EditableWalletGroupName({
  id,
  walletGroup,
  onRename,
}: {
  id?: string;
  walletGroup: WalletGroup;
  onRename?: () => void;
}) {
  const [value, setValue] = useState(walletGroup.name);
  const { mutate, ...renameMutation } = useMutation({
    mutationFn: (value: string) =>
      walletPort.request('renameWalletGroup', {
        groupId: walletGroup.id,
        name: value,
      }),
    onSuccess() {
      onRename?.();
    },
  });
  const debouncedRenameRequest = useDebouncedCallback(
    useCallback((value: string) => mutate(value), [mutate]),
    500
  );
  return (
    <VStack gap={4}>
      <div
        style={{
          display: 'grid',
          gap: 4,
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
        }}
      >
        <UnstyledInput
          id={id}
          placeholder="Group Name"
          type="text"
          value={value}
          onChange={(event) => {
            const name = event.target.value;
            debouncedRenameRequest(name);
            setValue(name);
          }}
        />
        {renameMutation.isLoading ? (
          <CircleSpinner style={{ display: 'inline-block' }} />
        ) : null}
      </div>
      {renameMutation.isError ? (
        <UIText kind="caption/regular" color="var(--negative-500)">
          {(renameMutation.error as Error | null)?.message || 'Unknown Error'}
        </UIText>
      ) : null}
    </VStack>
  );
}

function RemoveGroupConfirmationDialog({
  walletGroup,
}: {
  walletGroup: WalletGroup;
}) {
  const containerType = getContainerType(walletGroup.walletContainer);
  return (
    <form
      method="dialog"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        height: '100%',
      }}
    >
      <VStack gap={8}>
        <WarningIcon
          size={44}
          outlineStrokeWidth={7}
          borderWidth="3px"
          kind="negative"
          glow={true}
        />
        <UIText kind="headline/h3">Did you backup your recovery phrase?</UIText>
        <UIText kind="body/regular">
          {strings.getRemoveWalletSubtitle(containerType)}
        </UIText>
        <UIText kind="small/accent" color="var(--neutral-500)">
          Wallets to remove
        </UIText>
        <VStack gap={8} style={{ maxHeight: 180, overflowY: 'auto' }}>
          {walletGroup.walletContainer.wallets.map((wallet) => (
            <Media
              key={wallet.address}
              image={
                <WalletAvatar
                  address={wallet.address}
                  size={24}
                  borderRadius={4}
                />
              }
              text={
                <UIText kind="caption/regular">
                  <WalletDisplayName wallet={wallet} />
                </UIText>
              }
              detailText={null}
            />
          ))}
        </VStack>
      </VStack>
      <HStack
        gap={12}
        justifyContent="center"
        style={{ marginTop: 'auto', gridTemplateColumns: '1fr 1fr' }}
      >
        <Button value="cancel" kind="regular">
          Cancel
        </Button>
        <Button kind="danger" value="confirm">
          Remove Wallets
        </Button>
      </HStack>
    </form>
  );
}

function SurfaceListTitle({
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <UIText
      kind="caption/accent"
      color="var(--neutral-700)"
      style={{ paddingTop: 8, paddingBottom: 4, ...style }}
      {...props}
    />
  );
}

function WalletGroupItem({
  wallet,
  currency,
}: {
  wallet: WalletGroup['walletContainer']['wallets'][number];
  currency: string;
}) {
  return (
    <HStack gap={4} justifyContent="space-between" alignItems="center">
      <Media
        image={
          <WalletAvatar address={wallet.address} size={44} borderRadius={8} />
        }
        alignItems="center"
        text={<WalletDisplayName wallet={wallet} />}
        vGap={0}
        detailText={
          <PortfolioValue
            address={wallet.address}
            render={(query) => (
              <UIText kind="headline/h2">
                {query.data ? (
                  <NeutralDecimals
                    parts={formatCurrencyToParts(
                      query.data.data?.totalValue || 0,
                      'en',
                      currency
                    )}
                  />
                ) : (
                  NBSP
                )}
              </UIText>
            )}
          />
        }
      />
      <ChevronRightIcon style={{ color: 'var(--neutral-400)' }} />
    </HStack>
  );
}

function WalletGroupItems({
  group,
  isMnemonicGroup,
}: {
  group: WalletGroup;
  isMnemonicGroup: boolean;
}) {
  const { currency } = useCurrency();
  const { wallets } = group.walletContainer;
  const byEcosystem = useMemo(() => groupByEcosystem(wallets), [wallets]);

  const items: Item[] = [];
  for (const blockchainType of BLOCKCHAIN_TYPES) {
    if (blockchainType in byEcosystem === false) {
      continue;
    }
    if (FEATURE_SOLANA === 'on') {
      items.push({
        key: blockchainType,
        pad: false,
        component: (
          <SurfaceListTitle>
            <BlockchainTitleHelper kind={blockchainType} />
          </SurfaceListTitle>
        ),
      });
    }
    for (const wallet of byEcosystem[blockchainType]) {
      items.push({
        key: wallet.address,
        to: `/wallets/accounts/${wallet.address}?groupId=${group.id}`,
        component: <WalletGroupItem wallet={wallet} currency={currency} />,
      });
    }
  }
  if (isMnemonicGroup) {
    items.push({
      key: 1,
      to: `/get-started/import/mnemonic?groupId=${group.id}`,
      component: (
        <UIText kind="body/accent" color="var(--primary)">
          Create New Wallet
        </UIText>
      ),
    });
  }
  return <SurfaceList items={items} />;
}

export function WalletGroup() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  if (!groupId) {
    throw new Error('Group Id is required for this view');
  }
  const { data: walletGroup, refetch: refetchWalletGroup } = useWalletGroup({
    groupId,
  });
  const groupInputId = useId();
  const { refetch } = useWalletGroups();
  const removeWalletGroupMutation = useMutation({
    mutationFn: () => walletPort.request('removeWalletGroup', { groupId }),
    useErrorBoundary: true,
    onSuccess() {
      refetch();
      navigate(-1);
    },
  });
  if (!walletGroup) {
    return (
      <>
        <NavigationTitle title={null} documentTitle="Page not Found" />
        <NotFoundPage />
      </>
    );
  }
  const { walletContainer } = walletGroup;
  const isSignerGroup = isSignerContainer(walletContainer);
  const isMnemonicGroup = isMnemonicContainer(walletContainer);
  const isHardwareGroup = isHardwareContainer(walletContainer);
  const containerType = getContainerType(walletContainer);

  return (
    <PageColumn>
      <NavigationTitle title={getGroupDisplayName(walletGroup.name)} />
      <BottomSheetDialog ref={dialogRef} height="fit-content">
        <RemoveGroupConfirmationDialog walletGroup={walletGroup} />
      </BottomSheetDialog>
      <PageTop />
      <VStack gap={24}>
        {isMnemonicGroup || isHardwareGroup ? (
          <InputDecorator
            label="Name"
            htmlFor={groupInputId}
            input={
              <EditableWalletGroupName
                id={groupInputId}
                walletGroup={walletGroup}
                onRename={refetchWalletGroup}
              />
            }
          />
        ) : null}
        {isSignerGroup ? (
          <VStack gap={8}>
            <UIText kind="small/accent" color="var(--neutral-500)">
              Backup
            </UIText>
            <SurfaceList
              items={[
                {
                  key: 1,
                  to: `/backup?groupId=${walletGroup.id}`,
                  onClick: openHrefInTabView,
                  component: (
                    <HStack
                      gap={4}
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <UIText kind="body/accent">
                        {isMnemonicGroup
                          ? strings.recoveryPhraseTitle
                          : strings.privateKeyTitle}
                        <BackupInfoNote group={walletGroup} />
                      </UIText>
                      <ChevronRightIcon
                        style={{ color: 'var(--neutral-400)' }}
                      />
                    </HStack>
                  ),
                },
              ]}
            />
          </VStack>
        ) : null}

        <VStack gap={8}>
          <UIText kind="small/accent" color="var(--neutral-500)">
            Wallets
          </UIText>
          <WalletGroupItems
            group={walletGroup}
            isMnemonicGroup={isMnemonicGroup}
          />
        </VStack>
        <VStack gap={8}>
          <SurfaceList
            items={[
              {
                key: 0,
                onClick: () => {
                  if (!dialogRef.current) {
                    return;
                  }
                  showConfirmDialog(dialogRef.current).then(() => {
                    removeWalletGroupMutation.mutate();
                  });
                },
                component: (
                  <HStack gap={8}>
                    <UIText kind="body/accent" color="var(--negative-500)">
                      Remove Group
                    </UIText>
                    {removeWalletGroupMutation.isLoading ? (
                      <CircleSpinner style={{ display: 'inline-block' }} />
                    ) : null}
                  </HStack>
                ),
              },
            ]}
          />
          <UIText kind="caption/regular" color="var(--neutral-500)">
            {strings.getRemoveWalletSubtitle(containerType)}
          </UIText>
        </VStack>
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}
