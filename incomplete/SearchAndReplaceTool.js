import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, Modal, KeyboardAvoidingView } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import AntDesign from 'react-native-vector-icons/AntDesign';

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

const DEFAULT_PARAMS = { searchStr: '', replaceStr: '', caseInsensitive: false, useRegExp: false };
let currentParams;

const SearchAndReplaceScreen = ({ initParams = DEFAULT_PARAMS, close, onSearch, onReplace }) => {
  const [searchStr, setSearchStr] = useState(initParams.searchStr);
  const [replaceStr, setReplaceStr] = useState(initParams.replaceStr);
  const [caseInsensitive, setCaseSensitivity] = useState(initParams.caseInsensitive);
  const [useRegExp, setUseRegExp] = useState(initParams.useRegExp);

  const disabled = !searchStr;

  return (
    <Area contentContainerStyle={{ height: 90, padding: 5 }}>
      <HGroup noHorizontalPadding>
        <TextInput
          placeholder="Find what"
          value={searchStr}
          onChangeText={setSearchStr}
          style={styles.fullFlex}
        />
        <IconButton
          iconRenderer={() => <ActiveText>. *</ActiveText>}
          style={{ marginHorizontal: 5 }}
        />
        <IconButton iconRenderer={() => <ActiveText>aA</ActiveText>} selected />
        <IconButton
          iconRenderer={() => <AntDesign name="arrowdown" color={TEXT_ACTIVE_COLOR} size={20} />}
          style={{ marginHorizontal: 5 }}
          disabled={disabled}
        />
        <IconButton
          iconRenderer={() => <AntDesign name="arrowup" color={TEXT_ACTIVE_COLOR} size={20} />}
          disabled={disabled}
        />
      </HGroup>
      <HGroup noPadding>
        <TextInput
          placeholder="Replace with"
          value={replaceStr}
          onChangeText={setReplaceStr}
          style={styles.fullFlex}
        />
        <TextButton
          label="Replace"
          onPress={() => onSearch({ searchStr, caseInsensitive, useRegExp })}
          style={{ marginHorizontal: 5 }}
          disabled={disabled}
        />
        <IconButton
          iconRenderer={() => <AntDesign name="close" color={TEXT_ACTIVE_COLOR} size={20} />}
          onPress={close}
        />
      </HGroup>
    </Area>
  );
};

const SearchModal = ({ children, ...props }) => (
  <Modal transparent {...props}>
    <KeyboardAvoidingView
      {...props}
      style={{
        flex: 1,
        alignItems: 'stretch',
        justifyContent: 'flex-end',
        borderWidth: 4,
        borderColor: 0xffff00ff,
      }}
      enabled
    >
      {children}
    </KeyboardAvoidingView>
  </Modal>
);

const SearchAndReplaceModal = withHostedModal(
  SearchAndReplaceScreen,
  ['onSearch', 'onReplace'],
  undefined,
  undefined,
  SearchModal,
);

export const { renderer: searchAndReplaceScreenRenderer } = SearchAndReplaceModal;

/*
  It should display two modals.
  First with form interface setting search and replace.
  Second is transparent blocking modal with panel on top right to navigate between found entries
  and for replace it should have buttons replace, replace all.
  When navigating between found entries, it selects entry and scrolls to it.
*/

const tool = {
  iconRenderer: () => (
    <MaterialCommunityIcons name="find-replace" color={TEXT_ACTIVE_COLOR} size={28} />
  ),
  pressHandler: async ({ closeToolsPanel, showModal, editorApi }) => {
    closeToolsPanel();
    showModal({
      renderer: searchAndReplaceScreenRenderer,
      props: {
        onSearch: (params) => {
          currentParams = params;
        },
        onReplace: (params) => {
          currentParams = undefined;
          // replace stuff
        },
      },
    });
  },
};

export default tool;
