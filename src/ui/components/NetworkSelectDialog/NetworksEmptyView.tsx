import React from 'react';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';
import noResultsImg from 'url:src/ui/assets/no-results@2x.png';
import { TextLink } from 'src/ui/ui-kit/TextLink';

export function ShowTestnetsHint() {
  return (
    <UIText
      kind="caption/regular"
      color="var(--neutral-500)"
      style={{
        textAlign: 'center',
        width: '100%',
        padding: 10,
        backgroundColor: 'var(--neutral-100)',
        borderRadius: 12,
      }}
    >
      Looking for testnets?
      <br />
      Enable Testnet Mode in{' '}
      <TextLink
        to="/settings/developer-tools"
        style={{ color: 'var(--primary)' }}
      >
        Settings → Developer Tools
      </TextLink>
    </UIText>
  );
}

export function NetworksEmptyView({ testnetMode }: { testnetMode: boolean }) {
  return (
    <>
      <VStack
        gap={24}
        style={{
          justifyItems: 'center',
          flexGrow: 1,
          alignContent: 'center',
        }}
      >
        <VStack gap={16} style={{ justifyItems: 'center' }}>
          <img
            src={noResultsImg}
            style={{ width: 80, height: 64 }}
            alt="no results"
          />
          <VStack gap={8} style={{ justifyItems: 'center' }}>
            <UIText kind="headline/h3">No results found</UIText>
            <UIText kind="small/regular" color="var(--neutral-500)">
              Please try filtering with different criteria
            </UIText>
          </VStack>
        </VStack>
        <Button
          as={UnstyledLink}
          to="/networks/create"
          style={{ paddingInline: 16 }}
        >
          Add Network
        </Button>
      </VStack>
      {testnetMode ? null : <ShowTestnetsHint />}
    </>
  );
}
