import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, Modal, KeyboardAvoidingView } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  Screen,
  Area,
  HSlider,
  VSlider,
  HGroup,
  TextInput,
  Button,
  IconButton,
  TextButton,
  CheckBox,
  CheckBoxButton,
  TEXT_ACTIVE_COLOR,
  withHostedModal,
  TransparencyBackground,
  withInputLabel,
  TabView,
  ColorSheet,
  Text,
  ActiveText,
} from '@actualwave/react-native-kingnare-style';

const styles = StyleSheet.create({
  sliderLabel: { width: 60, textAlign: 'right', marginRight: 10, marginTop: 4 },
  fullFlex: { flex: 1 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  input: { width: 40, marginVertical: 10 },
  inputLabel: { marginLeft: 10, marginRight: 5, marginVertical: 14 },
  inputsRow: { paddingBottom: 0 },
  colorButton: { margin: 5 },
});

const DEFAULT_PARAMS = { searchStr: '', replaceStr: '', caseSensitive: false, useRegExp: false };
let currentParams;

const SearchControls = ({
  searchStr,
  caseSensitive,
  useRegExp,
  onSearchStrChange,
  onCaseSensitiveToggle,
  onUseRegExpToggle,
  onFindNext,
  onFindPrevious,
  disabled,
}) => (
  <>
    <TextInput
      placeholder="Find what"
      value={searchStr}
      onChangeText={onSearchStrChange}
      style={styles.fullFlex}
    />
    <IconButton
      iconRenderer={() => <ActiveText>. *</ActiveText>}
      selected={caseSensitive}
      onPress={onCaseSensitiveToggle}
      style={{ marginHorizontal: 5 }}
    />
    <IconButton
      iconRenderer={() => <ActiveText>aA</ActiveText>}
      selected={useRegExp}
      onPress={onUseRegExpToggle}
    />
    <IconButton
      iconRenderer={() => <AntDesign name="arrowdown" color={TEXT_ACTIVE_COLOR} size={20} />}
      style={{ marginHorizontal: 5 }}
      onPress={onFindNext}
      disabled={disabled}
    />
    <IconButton
      iconRenderer={() => <AntDesign name="arrowup" color={TEXT_ACTIVE_COLOR} size={20} />}
      onPress={onFindPrevious}
      disabled={disabled}
    />
  </>
);

const ReplaceControls = ({
  replaceStr,
  onReplaceStrStrChange,
  onReplaceNext,
  onReplaceAll,
  disabled,
}) => (
  <>
    <TextInput
      placeholder="Replace with"
      value={replaceStr}
      onChangeText={onReplaceStrStrChange}
      style={styles.fullFlex}
    />
    <IconButton
      iconRenderer={() => (
        <MaterialCommunityIcons name="play" color={TEXT_ACTIVE_COLOR} size={20} />
      )}
      style={{ marginHorizontal: 5 }}
      onPress={onReplaceNext}
      disabled={disabled}
    />
    <IconButton
      iconRenderer={() => (
        <MaterialCommunityIcons name="fast-forward" color={TEXT_ACTIVE_COLOR} size={20} />
      )}
      onPress={onReplaceAll}
      disabled={disabled}
    />
  </>
);

const CloseButton = ({ onPress }) => (
  <IconButton
    iconRenderer={() => <AntDesign name="close" color={TEXT_ACTIVE_COLOR} size={20} />}
    style={{ marginRight: 5 }}
    onPress={onPress}
  />
);

export const SearchScreen = ({
  initParams = DEFAULT_PARAMS,
  close,
  onFindNext,
  onFindPrevious,
  onReplace,
}) => {
  const [searchStr, setSearchStr] = useState(initParams.searchStr);
  const [caseSensitive, setCaseSensitivity] = useState(initParams.caseSensitive);
  const [useRegExp, setUseRegExp] = useState(initParams.useRegExp);

  const disabled = !searchStr;

  return (
    <Area contentContainerStyle={{ height: 48, padding: 5 }}>
      <HGroup noHorizontalPadding>
        <CloseButton onPress={close} onCaseSensitivityToggle />
        <SearchControls
          searchStr={searchStr}
          caseSensitive={caseSensitive}
          useRegExp={useRegExp}
          onSearchStrChange={setSearchStr}
          onCaseSensitiveToggle={() => setCaseSensitivity(!caseSensitive)}
          onUseRegExpToggle={() => setUseRegExp(!useRegExp)}
          onFindNext={onFindNext}
          onFindPrevious={onFindPrevious}
          disabled={disabled}
        />
      </HGroup>
    </Area>
  );
};

const ModalWrap = ({ children, ...props }) => (
  <Modal transparent {...props}>
    {children}
  </Modal>
);

const SearchModal = withHostedModal(
  SearchScreen,
  ['onSearch', 'onReplace'],
  undefined,
  undefined,
  ModalWrap,
);

export const { renderer: searchScreenRenderer } = SearchModal;

const SearchAndReplaceScreen = ({
  initParams = DEFAULT_PARAMS,
  close,
  onFindNext,
  onFindPrevious,
  onReplaceNext,
  onReplaceAll,
}) => {
  const [searchStr, setSearchStr] = useState(initParams.searchStr);
  const [replaceStr, setReplaceStr] = useState(initParams.replaceStr);
  const [caseSensitive, setCaseSensitivity] = useState(initParams.caseSensitive);
  const [useRegExp, setUseRegExp] = useState(initParams.useRegExp);

  const disabled = !searchStr;

  return (
    <Area contentContainerStyle={{ height: 90, padding: 5 }}>
      <HGroup noHorizontalPadding>
        <SearchControls
          searchStr={searchStr}
          caseSensitive={caseSensitive}
          useRegExp={useRegExp}
          onSearchStrChange={setSearchStr}
          onCaseSensitiveToggle={() => setCaseSensitivity(!caseSensitive)}
          onUseRegExpToggle={() => setUseRegExp(!useRegExp)}
          onFindNext={onFindNext}
          onFindPrevious={onFindPrevious}
          disabled={disabled}
        />
      </HGroup>
      <HGroup noPadding>
        <CloseButton onPress={close} />
        <ReplaceControls
          replaceStr={replaceStr}
          onReplaceStrStrChange={setReplaceStr}
          onReplaceNext={onReplaceNext}
          onReplaceAll={onReplaceAll}
          disabled={disabled}
        />
      </HGroup>
    </Area>
  );
};

const SearchAndReplaceModal = withHostedModal(
  SearchAndReplaceScreen,
  ['onSearch', 'onReplace'],
  undefined,
  undefined,
  ModalWrap,
);

export const { renderer: searchAndReplaceScreenRenderer } = SearchAndReplaceModal;

/*
  It should display two modals.
  First with form interface setting search and replace.
  Second is transparent blocking modal with panel on top right to navigate between found entries
  and for replace it should have buttons replace, replace all.
  When navigating between found entries, it selects entry and scrolls to it.
*/
/*
chevron-right
chevron-triple-right
play
fast-forward
done
done-all
*/

const tool = {
  iconRenderer: () => (
    <MaterialCommunityIcons name="find-replace" color={TEXT_ACTIVE_COLOR} size={28} />
  ),
  pressHandler: async ({ closeToolsPanel, showModal, editorApi }) => {
    closeToolsPanel();
    showModal({
      renderer: searchScreenRenderer,
      props: {
        onFindNext: (params) => {
          console.log(params);
        },
        onFindPrevious: (params) => {
          console.log(params);
        },
      },
    });
  },
  longPressHandler: async ({ closeToolsPanel, showModal, editorApi }) => {
    closeToolsPanel();
    showModal({
      renderer: searchAndReplaceScreenRenderer,
      props: {
        onFindNext: (params) => {
          console.log(params);
        },
        onFindPrevious: (params) => {
          console.log(params);
        },
        onReplaceNext: (params) => {
          console.log(params);
        },
        onReplaceAll: (params) => {
          console.log(params);
        },
      },
    });
  },
};

export default tool;
