import { observer } from "mobx-react-lite";
import React, { FunctionComponent, useState } from "react";
import { BackButton } from "../../../../layouts/header/components";
import { HeaderLayout } from "../../../../layouts/header";
import styled from "styled-components";
import { Stack } from "../../../../components/stack";
import { useStore } from "../../../../stores";
import { Column, Columns } from "../../../../components/column";
import { DropDown } from "../../../../components/dropdown";
import { Box } from "../../../../components/box";
import { Button } from "../../../../components/button";
import { ColorPalette } from "../../../../styles";
import { Body2, H5 } from "../../../../components/typography";
import { EllipsisIcon } from "../../../../components/icon";
import { Menu, MenuItem } from "../../../../components/menu";
import { useNavigate } from "react-router";
import { Dialog } from "../../../../components/dialog";

const Styles = {
  Container: styled(Stack)`
    padding: 0.75rem;
  `,
  ItemList: styled(Stack)`
    margin-top: 1rem;
  `,
};

export const SettingContactsList: FunctionComponent = observer(() => {
  const { chainStore } = useStore();
  const navigate = useNavigate();

  const [chainId, setChainId] = useState<string>(
    chainStore.chainInfos[0].chainId
  );

  const items = chainStore.chainInfosInUI.map((chainInfo) => {
    return {
      key: chainInfo.chainId,
      label: chainInfo.chainName,
    };
  });

  return (
    <HeaderLayout title="General" left={<BackButton />}>
      <Styles.Container>
        <Columns sum={1} alignY="bottom">
          <Box width="13rem">
            <DropDown
              items={items}
              selectedItemKey={chainId}
              onSelect={setChainId}
            />
          </Box>

          <Column weight={1} />

          <Button
            color="secondary"
            size="extraSmall"
            text="Add New"
            onClick={() => navigate("/setting/contacts/add")}
          />
        </Columns>

        <Styles.ItemList gutter="0.5rem">
          <AddressItemView />
          <AddressItemView />
          <AddressItemView />
        </Styles.ItemList>
      </Styles.Container>
    </HeaderLayout>
  );
});

const ItemStyles = {
  Container: styled.div`
    padding: 0.75rem 1rem;
    background-color: ${ColorPalette["gray-600"]};
    border-radius: 0.375rem;
  `,
  IconButton: styled.div`
    cursor: pointer;
  `,
  Menu: styled.ul<{ width: number }>`
    margin: ${(props) => `0 0 0 -${props.width * 0.8}px`};
    padding: 0;
    position: absolute;
    list-style: none;
    background-color: ${ColorPalette["gray-400"]};
    border-radius: 0.5rem;
  `,
  MenuItem: styled.li`
    padding: 0.75rem;
  `,
};

const AddressItemView: FunctionComponent = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  return (
    <ItemStyles.Container>
      <Columns sum={1} alignY="center">
        <Stack gutter="0.25rem">
          <H5 style={{ color: ColorPalette["gray-10"] }}>WangWang</H5>
          <Body2 style={{ color: ColorPalette["gray-200"] }}>
            cosmos1hjyde2kfgtl78t...rt649nn8j5
          </Body2>

          <Body2 style={{ color: ColorPalette["gray-200"] }}>
            cosmos1hjyde2
          </Body2>
        </Stack>

        <Column weight={1} />

        <ItemStyles.IconButton>
          <Box onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <EllipsisIcon width="1.25rem" height="1.25rem" />
          </Box>

          <Menu isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} ratio={1.7}>
            <MenuItem
              label="Change Contact Label"
              onClick={() =>
                navigate(
                  `/setting/contacts/add?name=WangWang&address=cosmos1hjyde2kfgtl78t...rt649nn8j5`
                )
              }
            />
            <MenuItem
              label="Delete Contact"
              onClick={() => setIsDeleteModalOpen(true)}
            />
          </Menu>

          <Dialog
            isOpen={isDeleteModalOpen}
            setIsOpen={setIsDeleteModalOpen}
            title="Delete Address"
            paragraph="Are you sure you want to delete this account?"
            onClickYes={() => {}}
            onClickCancel={() => {}}
          />
        </ItemStyles.IconButton>
      </Columns>
    </ItemStyles.Container>
  );
};
