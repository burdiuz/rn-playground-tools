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

const SEARCH_MODAL_HEIGHT = 48;
const REPLACE_MODAL_HEIGHT = 90;

const styles = StyleSheet.create({
  fullFlex: { flex: 1 },
  marginH: { marginHorizontal: 5 },
  marginR: { marginRight: 5 },
  searchScreen: { height: SEARCH_MODAL_HEIGHT, padding: 5 },
  replaceScreen: { height: REPLACE_MODAL_HEIGHT, padding: 5 },
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
      style={styles.marginH}
    />
    <IconButton
      iconRenderer={() => <ActiveText>aA</ActiveText>}
      selected={useRegExp}
      onPress={onUseRegExpToggle}
    />
    <IconButton
      iconRenderer={() => <AntDesign name="arrowdown" color={TEXT_ACTIVE_COLOR} size={20} />}
      style={styles.marginH}
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
      style={styles.marginH}
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
    style={styles.marginR}
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
    <Area contentContainerStyle={styles.searchScreen}>
      <HGroup noHorizontalPadding>
        <CloseButton onPress={close} onCaseSensitivityToggle />
        <SearchControls
          searchStr={searchStr}
          caseSensitive={caseSensitive}
          useRegExp={useRegExp}
          onSearchStrChange={setSearchStr}
          onCaseSensitiveToggle={() => setCaseSensitivity(!caseSensitive)}
          onUseRegExpToggle={() => setUseRegExp(!useRegExp)}
          onFindNext={() => onFindNext({ searchStr, caseSensitive, useRegExp })}
          onFindPrevious={() => onFindPrevious({ searchStr, caseSensitive, useRegExp })}
          disabled={disabled}
        />
      </HGroup>
    </Area>
  );
};

const ModalWrap = ({ children, ...props }) => (
  <View
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
    }}
  >
    {children}
  </View>
);

const SearchModal = withHostedModal(SearchScreen, [], undefined, undefined, ModalWrap);

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
    <Area contentContainerStyle={styles.replaceScreen}>
      <HGroup noHorizontalPadding>
        <SearchControls
          searchStr={searchStr}
          caseSensitive={caseSensitive}
          useRegExp={useRegExp}
          onSearchStrChange={setSearchStr}
          onCaseSensitiveToggle={() => setCaseSensitivity(!caseSensitive)}
          onUseRegExpToggle={() => setUseRegExp(!useRegExp)}
          onFindNext={() => onFindNext({ searchStr, caseSensitive, useRegExp })}
          onFindPrevious={() => onFindPrevious({ searchStr, caseSensitive, useRegExp })}
          disabled={disabled}
        />
      </HGroup>
      <HGroup noPadding>
        <CloseButton onPress={close} />
        <ReplaceControls
          replaceStr={replaceStr}
          onReplaceStrStrChange={setReplaceStr}
          onReplaceNext={() => onReplaceNext({ searchStr, caseSensitive, useRegExp, replaceStr })}
          onReplaceAll={() => onReplaceAll({ searchStr, caseSensitive, useRegExp, replaceStr })}
          disabled={disabled}
        />
      </HGroup>
    </Area>
  );
};

const SearchAndReplaceModal = withHostedModal(
  SearchAndReplaceScreen,
  [],
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

const createSetWebViewTopSpacing = (editorApi) => (spacing) => {
  let padding = spacing;

  if (spacing === undefined) {
    padding = modalHeight;
  } else {
    modalHeight = spacing;
  }

  editorApi.injectJavaScript(`((padding) => {
  const { visualViewport:vw } = window;

  const handler = () => document.body.style.setProperty(
    'padding-top',
    \`\${(padding / ((vw || {}).scale || 1)) >> 0}px\`
  );

  if (vw) {
    if (window.__paddingUpdateListener) {
      vw.removeEventListener('resize', window.__paddingUpdateListener);
    }

    vw.addEventListener('resize', handler);
    window.__paddingUpdateListener = handler;
  }

  handler();
})(${padding})`);
};

const createRemoveWebViewTopSpacing = (editorApi) => () => {
  modalHeight = 0;
  editorApi.injectJavaScript(`(() => {
  const { visualViewport:vw } = window;

  if (vw && window.__paddingUpdateListener) {
    vw.removeEventListener('resize', window.__paddingUpdateListener);
    delete window.__paddingUpdateListener;
  }

  document.body.style.removeProperty('padding-top');
})()`);
};

const findNext = async ({}, editorApi) => {};

const findPrevious = async ({}, editorApi) => {};

const replaceNext = async ({}, editorApi) => {};

const replaceAll = async ({}, editorApi) => {};

// We store modalPromise because this Promise instance has .id field
// which contains reference to modal.
let modalPromise = null;
let modalHeight = 0;

let setWebViewTopSpacing = () => {
  throw new Error('SearchAndReplaceTool:setWebViewTopSpacing() is not set.');
};
let removeWebViewTopSpacing = () => {
  throw new Error('SearchAndReplaceTool:removeWebViewTopSpacing() is not set.');
};

// This will be function if search once modal called.
let hideModalCallback = null;

const initFns = (editorApi, hideModal) => {
  setWebViewTopSpacing = createSetWebViewTopSpacing(editorApi);
  removeWebViewTopSpacing = createRemoveWebViewTopSpacing(editorApi);
  hideModalCallback = hideModal;
};

const tool = {
  iconRenderer: () => (
    <MaterialCommunityIcons name="find-replace" color={TEXT_ACTIVE_COLOR} size={28} />
  ),
  pressHandler: async ({ closeToolsPanel, showModal, hideModal, editorApi }) => {
    initFns(editorApi, hideModal);
    setWebViewTopSpacing(SEARCH_MODAL_HEIGHT);
    closeToolsPanel();

    // add top margin /padding to give space for search modal

    modalPromise = showModal({
      renderer: searchScreenRenderer,
      props: {
        onFindNext: (params) => findNext(params, editorApi),
        onFindPrevious: (params) => findPrevious(params, editorApi),
      },
    });

    await modalPromise;

    removeWebViewTopSpacing();
    modalPromise = null;
  },
  longPressHandler: async ({ closeToolsPanel, showModal, hideModal, editorApi }) => {
    hideModalCallback = hideModal;
    setWebViewTopSpacing(REPLACE_MODAL_HEIGHT);
    closeToolsPanel();

    // add top margin /padding to give space for search modal

    modalPromise = showModal({
      renderer: searchAndReplaceScreenRenderer,
      props: {
        onFindNext: (params) => findNext(params, editorApi),
        onFindPrevious: (params) => findPrevious(params, editorApi),
        onReplaceNext: (params) => replaceNext(params, editorApi),
        onReplaceAll: (params) => replaceAll(params, editorApi),
      },
    });

    await modalPromise;

    removeWebViewTopSpacing();
    modalPromise = null;
  },
  onEditorClose: () => {
    if (hideModalCallback && modalPromise) {
      hideModalCallback(modalPromise);
    }
  },
  onEditorLoad: () => {
    setWebViewTopSpacing();
  },
  onEditorReady: () => {
    setWebViewTopSpacing();
  },
};

export default tool;
