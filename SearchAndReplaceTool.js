import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, Clipboard, TouchableHighlight } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {
  Screen,
  Area,
  HSlider,
  VSlider,
  HGroup,
  TextInput,
  TextButton,
  TEXT_ACTIVE_COLOR,
  withHostedModal,
  bigModalDefaultStyle,
  TransparencyBackground,
  withInputLabel,
  TabView,
  ColorSheet,
  Text,
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

const DEFAULT_PARAMS = { searchStr = '', replaceStr = '', caseInsensitive = false, useRegExp = false };
let currentParams = undefined;

const SearchAndReplaceScreen = ({
  initParams = DEFAULT_PARAMS,
  close,
  onSearch,
  onReplace,
}) => {
  const [searchStr, setSearchStr] = useState(initParams.searchStr);
  const [replaceStr, setReplaceStr] = useState(initParams.replaceStr);
  const [caseInsensitive, setCaseSensitivity] = useState(initParams.caseInsensitive);
  const [useRegExp, setUseRegExp] = useState(initParams.useRegExp);

  return (
    <Screen>
      <TabView>
        <TabView.Child label="Search">
          <TextInput label="Find what" value={searchStr} onChangeText={setSearchStr} />
          <CheckBox
            label="Case Insensitive"
            selected={caseInsensitive}
            onChange={setCaseSensitivity}
          />
          <CheckBox label="Regular Expression" selected={useRegExp} onChange={setUseRegExp} />
          <View style={styles.fullFlex} />
          <HGroup style={{ justofyItems: 'space-between' }}>
            <TextButton label="Cancel" onPress={close} />
            <TextButton
              label="Search"
              onPress={() => onSearch({ searchStr, caseInsensitive, useRegExp })}
            />
          </HGroup>
        </TabView.Child>
        <TabView.Child label="Replace">
          <TextInput label="Find what" value={searchStr} onChangeText={setSearchStr} />
          <TextInput label="Replace with" value={replaceStr} onChangeText={setReplaceStr} />
          <CheckBox
            label="Case Insensitive"
            selected={caseInsensitive}
            onChange={setCaseSensitivity}
          />
          <CheckBox label="Regular Expression" selected={useRegExp} onChange={setUseRegExp} />
          <View style={styles.fullFlex} />
          <HGroup style={{ justofyItems: 'space-between' }}>
            <TextButton label="Cancel" onPress={close} />
            <TextButton
              label="Replace"
              onPress={() => onReplace({ searchStr, replaceStr, caseInsensitive, useRegExp })}
            />
          </HGroup>
        </TabView.Child>
      </TabView>
    </Screen>
  );
};

const SearchAndReplaceModal = withHostedModal(
  SearchAndReplaceScreen,
  ['onSearch', 'onReplace'],
  bigModalDefaultStyle,
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
  pressHandler:async ({ closeToolsPanel, showModal, editorApi }) => {
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
