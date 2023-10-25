import React, {FunctionComponent, useMemo, useRef, useState} from 'react';
import {observer} from 'mobx-react-lite';
import {KeyInfo} from '@keplr-wallet/background';
import {useStore} from '../../../stores';
import {Box} from '../../../components/box';
import {XAxis, YAxis} from '../../../components/axis';
import {useStyle} from '../../../styles';
import {Gutter} from '../../../components/gutter';
import {Stack} from '../../../components/stack';
import {Column, Columns} from '../../../components/column';
import {CheckIcon} from '../../../components/icon';
import {Button} from '../../../components/button';
import {App, AppCoinType} from '@keplr-wallet/ledger-cosmos';
import {PageWithScrollView} from '../../../components/page';
import {Pressable, StyleSheet, Text} from 'react-native';
import {StackActions, useNavigation} from '@react-navigation/native';
import {useIntl} from 'react-intl';
import {Modal} from '../../../components/modal';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';
import {EllipsisIcon} from '../../../components/icon/ellipsis';
import {StackNavProp} from '../../../navigation';
import FastImage from 'react-native-fast-image';

interface ModalMenuItem {
  key: string;
  label: string;
  onSelect: () => any;
}

export const WalletSelectScreen: FunctionComponent = observer(() => {
  const {keyRingStore} = useStore();
  const navigation = useNavigation();
  const intl = useIntl();
  const style = useStyle();
  const menuModalRef = useRef<BottomSheetModal>(null);
  const menuModalRef2 = useRef<BottomSheetModal>(null);

  const [modalMenuItems, setModalMenuItems] = useState<ModalMenuItem[]>([]);

  const mnemonicKeys = useMemo(() => {
    return keyRingStore.keyInfos.filter(keyInfo => {
      return keyInfo.type === 'mnemonic';
    });
  }, [keyRingStore.keyInfos]);

  const socialPrivateKeyInfos = useMemo(() => {
    return keyRingStore.keyInfos.filter(keyInfo => {
      if (
        keyInfo.type === 'private-key' &&
        typeof keyInfo.insensitive === 'object' &&
        keyInfo.insensitive['keyRingMeta'] &&
        typeof keyInfo.insensitive['keyRingMeta'] === 'object' &&
        keyInfo.insensitive['keyRingMeta']['web3Auth'] &&
        typeof keyInfo.insensitive['keyRingMeta']['web3Auth'] === 'object'
      ) {
        const web3Auth = keyInfo.insensitive['keyRingMeta']['web3Auth'];
        if (web3Auth['type'] && web3Auth['email']) {
          return true;
        }
      }

      return false;
    });
  }, [keyRingStore.keyInfos]);

  const privateKeyInfos = useMemo(() => {
    return keyRingStore.keyInfos.filter(keyInfo => {
      return (
        keyInfo.type === 'private-key' &&
        !socialPrivateKeyInfos.some(k => k.id === keyInfo.id)
      );
    });
  }, [keyRingStore.keyInfos, socialPrivateKeyInfos]);

  const ledgerKeys = useMemo(() => {
    return keyRingStore.keyInfos.filter(keyInfo => {
      return keyInfo.type === 'ledger';
    });
  }, [keyRingStore.keyInfos]);

  const keystoneKeys = useMemo(() => {
    return keyRingStore.keyInfos.filter(keyInfo => {
      return keyInfo.type === 'keystone';
    });
  }, [keyRingStore.keyInfos]);

  const unknownKeys = useMemo(() => {
    const knownKeys = mnemonicKeys
      .concat(ledgerKeys)
      .concat(privateKeyInfos)
      .concat(socialPrivateKeyInfos)
      .concat(keystoneKeys);
    return keyRingStore.keyInfos.filter(keyInfo => {
      return !knownKeys.find(k => k.id === keyInfo.id);
    });
  }, [
    keyRingStore.keyInfos,
    ledgerKeys,
    mnemonicKeys,
    privateKeyInfos,
    socialPrivateKeyInfos,
    keystoneKeys,
  ]);

  const socialPrivateKeyInfoByType: {
    type: string;
    keyInfos: KeyInfo[];
  }[] = useMemo(() => {
    const typeMap = new Map<string, KeyInfo[]>();

    socialPrivateKeyInfos.forEach(keyInfo => {
      if (
        keyInfo.type === 'private-key' &&
        typeof keyInfo.insensitive === 'object' &&
        keyInfo.insensitive['keyRingMeta'] &&
        typeof keyInfo.insensitive['keyRingMeta'] === 'object' &&
        keyInfo.insensitive['keyRingMeta']['web3Auth'] &&
        typeof keyInfo.insensitive['keyRingMeta']['web3Auth'] === 'object'
      ) {
        const web3Auth = keyInfo.insensitive['keyRingMeta']['web3Auth'];
        if (
          web3Auth['type'] &&
          web3Auth['email'] &&
          typeof web3Auth['type'] === 'string' &&
          typeof web3Auth['email'] === 'string'
        ) {
          const type = web3Auth['type'];

          const arr = typeMap.get(type) || [];
          arr.push(keyInfo);

          typeMap.set(type, arr);
        }
      }
    });

    const res: {
      type: string;
      keyInfos: KeyInfo[];
    }[] = [];

    for (const [type, keyInfos] of typeMap.entries()) {
      res.push({
        type,
        keyInfos,
      });
    }

    return res;
  }, [socialPrivateKeyInfos]);

  return (
    <PageWithScrollView backgroundMode={'default'}>
      <Box padding={12} position="relative">
        <Box position="absolute" style={{top: 14, right: 12, zIndex: 1000}}>
          <Button
            text={intl.formatMessage({id: 'page.wallet.add-wallet-button'})}
            size="extra-small"
            color="secondary"
            onPress={async () => {
              navigation.dispatch(StackActions.push('Register'));
            }}
          />
        </Box>
        <Gutter size={16} />
        <Stack gutter={20}>
          {mnemonicKeys.length > 0 ? (
            <KeyInfoList
              title={intl.formatMessage({
                id: 'page.wallet.recovery-phrase-title',
              })}
              keyInfos={mnemonicKeys}
              setModalMenuItems={setModalMenuItems}
              openModal={() => menuModalRef.current?.present()}
            />
          ) : null}

          {socialPrivateKeyInfoByType.map(info => {
            return (
              <KeyInfoList
                key={info.type}
                title={intl.formatMessage(
                  {id: 'page.wallet.connect-with-social-account-title'},
                  {
                    social:
                      info.type.length > 0
                        ? info.type[0].toUpperCase() + info.type.slice(1)
                        : info.type,
                  },
                )}
                keyInfos={info.keyInfos}
                setModalMenuItems={setModalMenuItems}
                openModal={() => menuModalRef.current?.present()}
              />
            );
          })}

          {privateKeyInfos.length > 0 ? (
            <KeyInfoList
              title={intl.formatMessage({
                id: 'page.wallet.private-key-title',
              })}
              keyInfos={privateKeyInfos}
              setModalMenuItems={setModalMenuItems}
              openModal={() => menuModalRef.current?.present()}
            />
          ) : null}

          {ledgerKeys.length > 0 ? (
            <KeyInfoList
              title={intl.formatMessage({id: 'page.wallet.ledger-title'})}
              keyInfos={ledgerKeys}
              setModalMenuItems={setModalMenuItems}
              openModal={() => menuModalRef.current?.present()}
            />
          ) : null}

          {keystoneKeys.length > 0 ? (
            <KeyInfoList
              title="Keystone"
              keyInfos={keystoneKeys}
              setModalMenuItems={setModalMenuItems}
              openModal={() => menuModalRef.current?.present()}
            />
          ) : null}

          {unknownKeys.length > 0 ? (
            <KeyInfoList
              title={intl.formatMessage({id: 'page.wallet.unknown-title'})}
              keyInfos={unknownKeys}
              setModalMenuItems={setModalMenuItems}
              openModal={() => menuModalRef.current?.present()}
            />
          ) : null}
        </Stack>
      </Box>
      <Modal ref={menuModalRef} isDetachedModal={true} snapPoints={[202]}>
        <BottomSheetView>
          {modalMenuItems.map((item, i) => (
            <Box
              key={item.key}
              height={68}
              alignX="center"
              alignY="center"
              style={style.flatten(
                ['border-width-bottom-1', 'border-color-gray-500'],
                [i === 2 && 'border-width-bottom-0'], //마지막 요소는 아래 보더 스타일 제가하기 위해서
              )}
              onClick={() => {
                item.onSelect();
                menuModalRef.current?.dismiss();
              }}>
              <Text style={style.flatten(['body1', 'color-text-high'])}>
                {item.label}
              </Text>
            </Box>
          ))}
        </BottomSheetView>
      </Modal>
      <Modal ref={menuModalRef2} isDetachedModal={true} snapPoints={[202]}>
        <BottomSheetView>
          {modalMenuItems.map(item => (
            <Pressable key={item.key}>
              <Text>test2</Text>
            </Pressable>
          ))}
        </BottomSheetView>
      </Modal>
    </PageWithScrollView>
  );
});

const KeyInfoList: FunctionComponent<{
  title: string;
  keyInfos: KeyInfo[];
  setModalMenuItems: React.Dispatch<React.SetStateAction<ModalMenuItem[]>>;
  openModal: () => void;
}> = observer(({title, keyInfos, setModalMenuItems, openModal}) => {
  const style = useStyle();
  const {uiConfigStore, chainStore, accountStore, queriesStore} = useStore();

  const icnsPrimaryName = (() => {
    if (
      uiConfigStore.icnsInfo &&
      chainStore.hasChain(uiConfigStore.icnsInfo.chainId)
    ) {
      const queries = queriesStore.get(uiConfigStore.icnsInfo.chainId);
      const icnsQuery = queries.icns.queryICNSNames.getQueryContract(
        uiConfigStore.icnsInfo.resolverContractAddress,
        accountStore.getAccount(uiConfigStore.icnsInfo.chainId).bech32Address,
      );

      return icnsQuery.primaryName.split('.')[0];
    }
  })();
  return (
    <Box>
      <YAxis>
        <Text
          style={style.flatten([
            'subtitle4',
            'color-gray-300',
            'padding-left-8',
          ])}>
          {title}
        </Text>
        <Gutter size={8} />
        <Stack gutter={8}>
          {keyInfos.map(keyInfo => {
            return (
              <KeyringItem
                setModalMenuItems={setModalMenuItems}
                key={keyInfo.id}
                keyInfo={keyInfo}
                openModal={openModal}
                icnsPrimaryName={icnsPrimaryName}
              />
            );
          })}
        </Stack>
      </YAxis>
    </Box>
  );
});

const KeyringItem: FunctionComponent<{
  keyInfo: KeyInfo;
  setModalMenuItems: React.Dispatch<React.SetStateAction<ModalMenuItem[]>>;
  openModal: () => void;
  icnsPrimaryName?: string;
}> = observer(({keyInfo, setModalMenuItems, openModal, icnsPrimaryName}) => {
  const {chainStore, keyRingStore} = useStore();
  const intl = useIntl();
  const navigate = useNavigation<StackNavProp>();

  const style = useStyle();

  const paragraph = useMemo(() => {
    if (keyInfo.insensitive['bip44Path']) {
      const bip44Path = keyInfo.insensitive['bip44Path'] as any;

      // -1 means it can be multiple coin type.
      let coinType = -1;
      if (keyInfo.type === 'ledger') {
        const ledgerAppCandidate: (App | 'Ethereum')[] = [
          'Cosmos',
          'Terra',
          'Secret',
          'Ethereum',
        ];

        const app: (App | 'Ethereum')[] = [];
        for (const ledgerApp of ledgerAppCandidate) {
          if (keyInfo.insensitive[ledgerApp] != null) {
            app.push(ledgerApp);
          }
        }

        if (app.length === 0 || app.length >= 2) {
          coinType = -1;
        } else if (app[0] === 'Ethereum') {
          coinType = 60;
        } else {
          const c = AppCoinType[app[0]];
          if (c != null) {
            coinType = c;
          } else {
            coinType = -1;
          }
        }

        if (
          app.length === 1 &&
          app.includes('Cosmos') &&
          bip44Path.account === 0 &&
          bip44Path.change === 0 &&
          bip44Path.addressIndex === 0
        ) {
          return;
        }

        return `m/44'/${coinType >= 0 ? coinType : '-'}'/${
          bip44Path.account
        }'/${bip44Path.change}/${bip44Path.addressIndex}${(() => {
          if (app.length === 1) {
            if (app[0] !== 'Cosmos' && app[0] !== 'Ethereum') {
              return ` ${intl.formatMessage({
                id: `page.wallet.keyring-item.bip44-path-${app[0]}-text`,
              })}`;
            }
          }

          return '';
        })()}`;
      }

      if (
        bip44Path.account === 0 &&
        bip44Path.change === 0 &&
        bip44Path.addressIndex === 0
      ) {
        return;
      }

      return `m/44'/${coinType >= 0 ? coinType : '-'}'/${bip44Path.account}'/${
        bip44Path.change
      }/${bip44Path.addressIndex}`;
    }

    if (
      keyInfo.type === 'private-key' &&
      typeof keyInfo.insensitive === 'object' &&
      keyInfo.insensitive['keyRingMeta'] &&
      typeof keyInfo.insensitive['keyRingMeta'] === 'object' &&
      keyInfo.insensitive['keyRingMeta']['web3Auth'] &&
      typeof keyInfo.insensitive['keyRingMeta']['web3Auth'] === 'object'
    ) {
      const web3Auth = keyInfo.insensitive['keyRingMeta']['web3Auth'];
      if (
        web3Auth['type'] &&
        web3Auth['email'] &&
        typeof web3Auth['type'] === 'string' &&
        typeof web3Auth['email'] === 'string'
      ) {
        return web3Auth['email'];
      }
    }
  }, [intl, keyInfo.insensitive, keyInfo.type]);

  const dropdownItems = (() => {
    const defaults = [
      {
        key: 'change-wallet-name',
        label: intl.formatMessage({
          id: 'page.wallet.keyring-item.dropdown.change-wallet-name-title',
        }),
        onSelect: () =>
          navigate.navigate('SelectWallet.ChangeName', {id: keyInfo.id}),
      },
      {
        key: 'delete-wallet',
        label: intl.formatMessage({
          id: 'page.wallet.keyring-item.dropdown.delete-wallet-title',
        }),
        onSelect: () =>
          navigate.navigate('SelectWallet.Delete', {id: keyInfo.id}),
      },
    ];

    switch (keyInfo.type) {
      case 'mnemonic': {
        defaults.unshift({
          key: 'view-recovery-phrase',
          label: intl.formatMessage({
            id: 'page.wallet.keyring-item.dropdown.view-recovery-path-title',
          }),
          onSelect: () =>
            navigate.navigate('SelectWallet.ViewRecoveryPhrase', {
              id: keyInfo.id,
            }),
        });
        break;
      }
      case 'private-key': {
        defaults.unshift({
          key: 'view-recovery-phrase',
          label: intl.formatMessage({
            id: 'page.wallet.keyring-item.dropdown.view-private-key-title',
          }),
          onSelect: () =>
            navigate.navigate('SelectWallet.ViewRecoveryPhrase', {
              id: keyInfo.id,
            }),
        });
        break;
      }
    }

    return defaults;
  })();

  const isSelected = keyRingStore.selectedKeyInfo?.id === keyInfo.id;
  return (
    <Box
      padding={16}
      minHeight={74}
      borderRadius={6}
      alignY="center"
      style={StyleSheet.flatten([
        style.flatten(['background-color-gray-600']),
        isSelected &&
          style.flatten([
            'border-width-1',
            'border-color-gray-200',
            'border-solid',
          ]),
      ])}
      onClick={async () => {
        if (isSelected) {
          return;
        }
        await keyRingStore.selectKeyRing(keyInfo.id);
        await chainStore.waitSyncedEnabledChains();
        navigate.goBack();
      }}>
      <Columns sum={1} alignY="center">
        <Box width={'85%'}>
          <XAxis alignY="center">
            {isSelected ? (
              <React.Fragment>
                <CheckIcon
                  size={20}
                  color={style.get('color-gray-200').color}
                />
                <Gutter size={4} />
              </React.Fragment>
            ) : null}
            <Text
              numberOfLines={1}
              style={StyleSheet.flatten([
                style.flatten([
                  'subtitle2',
                  'dark:color-gray-700',
                  'color-gray-10',
                ]),
                {maxWidth: '60%'},
              ])}>
              {keyInfo.name}
            </Text>
            {icnsPrimaryName ? (
              <React.Fragment>
                <Gutter size={4} />
                <Box
                  paddingY={6}
                  paddingLeft={6}
                  paddingRight={30}
                  borderRadius={87}
                  borderWidth={1}
                  borderColor={style.get('color-gray-450').color}
                  backgroundColor={style.get('color-gray-500').color}
                  style={{
                    maxWidth: '40%',
                  }}>
                  <Columns sum={1} gutter={4}>
                    <FastImage
                      source={require('../../../public/assets/img/icns-icon.png')}
                      style={style.flatten(['width-16', 'height-16'])}
                    />
                    <Text
                      numberOfLines={1}
                      style={StyleSheet.flatten([
                        style.flatten(['text-caption2', 'color-text-middle']),
                      ])}>
                      {icnsPrimaryName}
                    </Text>
                  </Columns>
                </Box>
              </React.Fragment>
            ) : null}
          </XAxis>
          {paragraph ? (
            <React.Fragment>
              <CheckIcon size={20} color={style.get('color-gray-200').color} />
              <Gutter size={4} />
            </React.Fragment>
          ) : null}
        </Box>
        <Column weight={1} />
        <Pressable
          onPress={e => {
            e.stopPropagation();
            e.preventDefault();
            setModalMenuItems(dropdownItems);
            openModal();
          }}>
          <EllipsisIcon size={24} color={style.get('color-gray-10').color} />
        </Pressable>
      </Columns>
    </Box>
  );
});
