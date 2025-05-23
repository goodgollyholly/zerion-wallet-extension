import { isTruthy } from 'is-truthy-ts';
import React, { useMemo, useRef } from 'react';
import { createChain } from 'src/modules/networks/Chain';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { useNetworks } from 'src/modules/networks/useNetworks';
import type {
  AssetFullInfo,
  AssetResource,
} from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { CenteredDialog } from 'src/ui/ui-kit/ModalDialogs/CenteredDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import DownIcon from 'jsx:src/ui/assets/chevron-down.svg';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import CheckIcon from 'jsx:src/ui/assets/check_double.svg';
import LinkIcon from 'jsx:src/ui/assets/new-window.svg';
import ArrowLeftIcon from 'jsx:src/ui/assets/arrow-left.svg';
import XIcon from 'jsx:src/ui/assets/x-logo.svg';
import WarpcastIcon from 'jsx:src/ui/assets/warpcast-logo.svg';
import ZerionIcon from 'jsx:src/ui/assets/zerion-logo-monochrome.svg';
import DexscreenerIcon from 'jsx:src/ui/assets/dexscreener-logo.svg';
import WebsiteIcon from 'jsx:src/ui/assets/globe.svg';
import { truncateAddress } from 'src/ui/shared/truncateAddress';

function MainImplementationButton({
  implementation,
}: {
  implementation: { address: string | null; network: NetworkConfig };
}) {
  const { address, network } = implementation;
  const { handleCopy, isSuccess } = useCopyToClipboard({
    text: address || 'null',
  });

  if (!address) {
    return (
      <Button
        as={UnstyledAnchor}
        rel="noopener noreferrer"
        target="_blank"
        href={network.explorer_home_url || ''}
        aria-label="Copy token address"
        size={36}
        kind="neutral"
        className="parent-hover"
        style={{
          ['--parent-content-color' as string]: 'var(--neutral-400)',
          ['--parent-hovered-content-color' as string]: 'var(--neutral-700)',
          ['--button-background' as string]: 'var(--neutral-200)',
          ['--button-background-hover' as string]: 'var(--neutral-300)',
          paddingInline: 8,
        }}
      >
        <HStack gap={4} alignItems="center">
          <HStack gap={6} alignItems="center">
            <img
              src={network.icon_url}
              alt={network.name}
              width={24}
              height={24}
            />
            <UIText kind="small/accent">Explorer</UIText>
          </HStack>
          <LinkIcon
            className="content-hover"
            style={{ width: 20, height: 20 }}
          />
        </HStack>
      </Button>
    );
  }
  return (
    <Button
      onClick={handleCopy}
      aria-label="Copy token address"
      size={36}
      kind="neutral"
      className="parent-hover"
      style={{
        paddingInline: 8,
        ['--parent-content-color' as string]: 'var(--neutral-400)',
        ['--parent-hovered-content-color' as string]: 'var(--neutral-700)',
        ['--button-background' as string]: 'var(--neutral-200)',
        ['--button-background-hover' as string]: 'var(--neutral-300)',
      }}
    >
      <HStack gap={4} alignItems="center">
        <HStack gap={6} alignItems="center">
          <img
            src={network.icon_url}
            alt={network.name}
            width={24}
            height={24}
          />
          <UIText kind="small/accent">{truncateAddress(address, 4)}</UIText>
        </HStack>
        {isSuccess ? (
          <CheckIcon
            style={{ color: 'var(--positive-500)', width: 20, height: 20 }}
          />
        ) : (
          <CopyIcon
            className="content-hover"
            style={{ width: 20, height: 20 }}
          />
        )}
      </HStack>
    </Button>
  );
}

function CopyAddressButton({ address }: { address: string }) {
  const { handleCopy, isSuccess } = useCopyToClipboard({ text: address });

  return (
    <UnstyledButton
      onClick={handleCopy}
      aria-label="Copy token address"
      className="parent-hover"
      style={{
        ['--parent-content-color' as string]: 'var(--neutral-400)',
        ['--parent-hovered-content-color' as string]: 'var(--neutral-700)',
        display: 'flex',
      }}
    >
      {isSuccess ? (
        <CheckIcon style={{ color: 'var(--positive-500)' }} />
      ) : (
        <CopyIcon className="content-hover" />
      )}
    </UnstyledButton>
  );
}

function AssetImplementationsDialogContent({
  implementations,
}: {
  implementations: { address: string | null; network: NetworkConfig }[];
}) {
  const { networks } = useNetworks();
  return (
    <VStack
      gap={14}
      style={{
        ['--surface-background-color' as string]: 'var(--white)',
        padding: '8px 16px 24px',
      }}
    >
      <VStack gap={0}>
        {implementations.map(({ address, network }) => {
          const explorerHref =
            address && networks
              ? networks.getExplorerTokenUrlByName(
                  createChain(network.id),
                  address
                )
              : network.explorer_home_url;
          return (
            <HStack
              key={network.id}
              gap={24}
              justifyContent="space-between"
              alignItems="center"
              style={{ paddingBlock: 12 }}
            >
              <HStack gap={12} alignItems="center">
                <img
                  src={network.icon_url}
                  alt={network.name}
                  width={36}
                  height={36}
                />
                <VStack gap={0}>
                  <UIText kind="body/accent">{network.name}</UIText>
                  {address ? (
                    <UIText kind="small/regular" color="var(--neutral-500)">
                      {truncateAddress(address, 4)}
                    </UIText>
                  ) : null}
                </VStack>
              </HStack>
              <HStack gap={0}>
                {address ? <CopyAddressButton address={address} /> : null}
                {explorerHref ? (
                  <UnstyledAnchor
                    rel="noopener noreferrer"
                    target="_blank"
                    title="Open token in explorer"
                    href={explorerHref}
                    className="parent-hover"
                    style={{
                      ['--parent-content-color' as string]:
                        'var(--neutral-400)',
                      ['--parent-hovered-content-color' as string]:
                        'var(--neutral-700)',
                      display: 'flex',
                    }}
                  >
                    <LinkIcon className="content-hover" />
                  </UnstyledAnchor>
                ) : null}
              </HStack>
            </HStack>
          );
        })}
      </VStack>
    </VStack>
  );
}

function ResourceButton({
  resource,
  icon,
}: {
  resource: AssetResource;
  icon: React.ReactNode;
}) {
  return (
    <Button
      key={resource.name}
      as={UnstyledAnchor}
      rel="noopenner noreferrer"
      target="_blank"
      kind="regular"
      size={36}
      href={resource.url}
      style={{
        padding: 6,
        border: '2px solid var(--neutral-200)',
        ['--button-background' as string]: 'var(--white)',
        ['--button-background-hover' as string]: 'var(--neutral-200)',
      }}
      title={`Open token on ${resource.displayableName}`}
    >
      {icon}
    </Button>
  );
}

const TWITTER_ID = 'twitter';
const WARPCAST_ID = 'warpcast';
const DEXSCREENER_ID = 'dexscreener';
const WEBSITE = 'website';

export function AssetResources({
  assetFullInfo,
}: {
  assetFullInfo: AssetFullInfo;
}) {
  const { networks } = useNetworks();
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const implementations = useMemo(
    () =>
      Object.entries(assetFullInfo.fungible.implementations)
        .map(([networkId, config]) => {
          const network = networks?.getNetworkByName(createChain(networkId));
          return network ? { address: config.address, network } : null;
        })
        .filter(isTruthy),
    [assetFullInfo.fungible.implementations, networks]
  );

  const mainImplementation = useMemo(() => {
    return (
      implementations.find(
        (implementation) =>
          implementation.network.id === assetFullInfo.extra.mainChain
      ) || implementations.at(0)
    );
  }, [implementations, assetFullInfo.extra.mainChain]);

  const resourcesById = useMemo(() => {
    return assetFullInfo.extra.relevantResources.reduce((acc, resource) => {
      acc[resource.name] = resource;
      return acc;
    }, {} as Record<string, AssetResource>);
  }, [assetFullInfo.extra.relevantResources]);

  return (
    <>
      <HStack
        gap={6}
        justifyContent="space-between"
        style={{ gridTemplateColumns: '1fr auto' }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <ResourceButton
            resource={{
              name: 'zerion',
              displayableName: 'Zerion',
              iconUrl: '',
              url: `https://app.zerion.io/tokens/${assetFullInfo.fungible.symbol}-${assetFullInfo.fungible.id}`,
            }}
            icon={<ZerionIcon style={{ width: 20, height: 20 }} />}
          />
          {resourcesById[TWITTER_ID] ? (
            <ResourceButton
              resource={resourcesById[TWITTER_ID]}
              icon={<XIcon style={{ width: 20, height: 20 }} />}
            />
          ) : null}
          {resourcesById[WARPCAST_ID] ? (
            <ResourceButton
              resource={resourcesById[WARPCAST_ID]}
              icon={<WarpcastIcon style={{ width: 20, height: 20 }} />}
            />
          ) : null}
          {resourcesById[WEBSITE] ? (
            <ResourceButton
              resource={resourcesById[WEBSITE]}
              icon={<WebsiteIcon style={{ width: 20, height: 20 }} />}
            />
          ) : null}
          <ResourceButton
            resource={
              resourcesById[DEXSCREENER_ID] || {
                name: DEXSCREENER_ID,
                displayableName: 'Dexscreener',
                iconUrl: '',
                url: `https://dexscreener.com/search?q=${assetFullInfo.fungible.symbol}`,
              }
            }
            icon={<DexscreenerIcon style={{ width: 20, height: 20 }} />}
          />
        </div>
        <HStack gap={4}>
          {mainImplementation ? (
            <MainImplementationButton implementation={mainImplementation} />
          ) : null}
          {implementations.length ? (
            <Button
              kind="regular"
              size={36}
              onClick={() => dialogRef.current?.showModal()}
              style={{
                padding: 8,
                ['--button-background' as string]: 'var(--neutral-200)',
                ['--button-background-hover' as string]: 'var(--neutral-300)',
              }}
            >
              <DownIcon style={{ width: 20, height: 20 }} />
            </Button>
          ) : null}
        </HStack>
      </HStack>
      <CenteredDialog
        ref={dialogRef}
        containerStyle={{ backgroundColor: 'var(--white)', padding: 0 }}
        renderWhenOpen={() => (
          <>
            <HStack
              gap={0}
              alignItems="center"
              style={{
                position: 'sticky',
                top: 0,
                padding: '16px 8px 0',
                gridTemplateColumns: '36px 1fr 36px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <form
                method="dialog"
                onSubmit={(event) => event.stopPropagation()}
              >
                <Button
                  kind="ghost"
                  value="cancel"
                  size={36}
                  style={{ width: 36, padding: 8 }}
                >
                  <ArrowLeftIcon style={{ width: 20, height: 20 }} />
                </Button>
              </form>
              <UIText kind="body/accent" style={{ justifySelf: 'center' }}>
                Explorers
              </UIText>
            </HStack>
            <AssetImplementationsDialogContent
              implementations={implementations}
            />
          </>
        )}
      />
    </>
  );
}
