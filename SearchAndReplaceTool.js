import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet } from 'react-native';
// import AsyncStorage from '@react-native-community/async-storage';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  Screen,
  Area,
  HGroup,
  TextInput,
  Button,
  IconButton,
  CheckBox,
  TEXT_ACTIVE_COLOR,
  withHostedModal,
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
      iconRenderer={() => <ActiveText>aA</ActiveText>}
      selected={caseSensitive}
      onPress={onCaseSensitiveToggle}
      style={styles.marginH}
    />
    <IconButton
      iconRenderer={() => <ActiveText>. *</ActiveText>}
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

const StateWrapper = ({
  initParams = DEFAULT_PARAMS,
  onFindNext,
  onFindPrevious,
  onReplaceNext,
  onReplaceAll,
  getNumberOfOccurences,
  children: renderer,
  ...props
}) => {
  const [searchStr, setSearchStr] = useState(initParams.searchStr);
  const [replaceStr, setReplaceStr] = useState(initParams.replaceStr);
  const [caseSensitive, setCaseSensitivity] = useState(initParams.caseSensitive);
  const [useRegExp, setUseRegExp] = useState(initParams.useRegExp);
  const [occurrences, setOccurrencesNumber] = useState(0);

  useEffect(() => {
    (async () => {
      const number = await getNumberOfOccurences({ searchStr, caseSensitive, useRegExp });

      setOccurrencesNumber(number);
    })();
  }, [searchStr, caseSensitive, useRegExp]);

  return renderer({
    ...props,
    searchStr,
    replaceStr,
    caseSensitive,
    useRegExp,
    occurrences,
    onSearchStrChange: setSearchStr,
    onReplaceStrStrChange: setReplaceStr,
    onCaseSensitiveToggle: () => setCaseSensitivity(!caseSensitive),
    onUseRegExpToggle: () => setUseRegExp(!useRegExp),
    onFindNext: () => onFindNext({ searchStr, caseSensitive, useRegExp }),
    onFindPrevious: () => onFindPrevious({ searchStr, caseSensitive, useRegExp }),
    onReplaceNext: () => onReplaceNext({ searchStr, caseSensitive, useRegExp, replaceStr }),
    onReplaceAll: () => onReplaceAll({ searchStr, caseSensitive, useRegExp, replaceStr }),
  });
};

StateWrapper.propTypes = {
  children: PropTypes.func.isRequired,
};

export const SearchScreen = (props) => (
  <StateWrapper {...props}>
    {({
      searchStr,
      occurrences,
      caseSensitive,
      useRegExp,
      onSearchStrChange,
      onCaseSensitiveToggle,
      onUseRegExpToggle,
      onFindNext,
      onFindPrevious,
      disabled,
    }) => (
      <Area contentContainerStyle={styles.searchScreen}>
        <HGroup noHorizontalPadding>
          <CloseButton onPress={props.close} onCaseSensitivityToggle />
          <SearchControls
            searchStr={searchStr}
            occurrences={occurrences}
            caseSensitive={caseSensitive}
            useRegExp={useRegExp}
            onSearchStrChange={onSearchStrChange}
            onCaseSensitiveToggle={onCaseSensitiveToggle}
            onUseRegExpToggle={onUseRegExpToggle}
            onFindNext={onFindNext}
            onFindPrevious={onFindPrevious}
            disabled={disabled}
          />
        </HGroup>
      </Area>
    )}
  </StateWrapper>
);

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

const SearchAndReplaceScreen = (props) => (
  <StateWrapper {...props}>
    {({
      searchStr,
      replaceStr,
      occurrences,
      caseSensitive,
      useRegExp,
      onSearchStrChange,
      onReplaceStrStrChange,
      onCaseSensitiveToggle,
      onUseRegExpToggle,
      onFindNext,
      onFindPrevious,
      onReplaceNext,
      onReplaceAll,
      disabled,
    }) => (
      <Area contentContainerStyle={styles.replaceScreen}>
        <HGroup noHorizontalPadding>
          <SearchControls
            searchStr={searchStr}
            occurrences={occurrences}
            caseSensitive={caseSensitive}
            useRegExp={useRegExp}
            onSearchStrChange={onSearchStrChange}
            onCaseSensitiveToggle={onCaseSensitiveToggle}
            onUseRegExpToggle={onUseRegExpToggle}
            onFindNext={onFindNext}
            onFindPrevious={onFindPrevious}
            disabled={disabled}
          />
        </HGroup>
        <HGroup noPadding>
          <CloseButton onPress={props.close} />
          <ReplaceControls
            replaceStr={replaceStr}
            onReplaceStrStrChange={onReplaceStrStrChange}
            onReplaceNext={onReplaceNext}
            onReplaceAll={onReplaceAll}
            disabled={disabled}
          />
        </HGroup>
      </Area>
    )}
  </StateWrapper>
);

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

const findAllUsingString = (originalText, originalSearch, caseSensitive) => {
  let text = originalText;
  let search = originalSearch;
  const list = [];

  if (caseSensitive) {
    text = originalText.toLowerCase();
    search = originalSearch.toLowerCase();
  }

  let index = 0;
  const { length: searchLength } = search;

  while ((index = text.indexOf(search, index)) > -1) {
    list.push(Object.assign([originalSearch], { index }));
    index += searchLength;
  }

  return list;
};

const findAllUsingRegExp = (text, searchStr, caseSensitive) => {
  const list = [];
  let item;
  let rgx;

  try {
    rgx = new RegExp(searchStr, caseSensitive ? 'g' : 'gi');
  } catch (error) {
    return { list, error };
  }

  while ((item = rgx.exec(text))) {
    list.push(item);
  }

  return { list };
};

const findAllOccurrences = async ({ searchStr, caseSensitive, useRegExp }, editorApi) => {
  const text = await editorApi.getValue();
  let list;
  let error;

  if (searchStr) {
    if (useRegExp) {
      ({ list, error } = findAllUsingRegExp(text, searchStr, caseSensitive));
    } else {
      list = findAllUsingString(text, searchStr, caseSensitive);
    }
  } else {
    list = [];
  }

  return {
    list,
    text,
    error,
  };
};

const getOccurrencesList = async (params, editorApi) => {
  const { list, error } = await findAllOccurrences(params, editorApi);

  if (error) {
    console.error(error);
  }

  return list;
};

const getNumberOfOccurences = async (params, editorApi) => {
  const { list } = await findAllOccurrences(params, editorApi);

  return list.length;
};

const getNextItem = (list, strIndex) =>
  list.find(({ index: currentStrIndex }) => currentStrIndex >= strIndex);

const getPreviousItem = (list, strIndex) => {
  const { length: listLength } = list;
  let lastItem;

  for (let listIndex = 0; listIndex < listLength; listIndex++) {
    const item = list[listIndex];
    if (item.index + item[0].length < strIndex) {
      lastItem = item;
    } else {
      return lastItem;
    }
  }

  return undefined;
};

const setSelectionFrom = async (item, editorApi) => {
  if (!item) {
    return;
  }

  const start = item.index;
  const end = item.index + item[0].length;

  /*
  focus() works on two levels
  1. requests focus for WebView, focused input will be unfocused
  2. focuses CodeMirror instance in WebView
  This is important to do each time because otherwise selections are
  not visible until control is focused.
*/
  await editorApi.focus();
  await editorApi.setSelection(start, end, { scroll: true });
};

const findNext = async (params, editorApi) => {
  const list = await getOccurrencesList(params, editorApi);
  const { index: selectionIndex } = (await editorApi.getCursor()) || { index: 0 };

  setSelectionFrom(getNextItem(list, selectionIndex), editorApi);

  return list.length;
};

const findPrevious = async (params, editorApi) => {
  const list = await getOccurrencesList(params, editorApi);
  const { index: selectionIndex } = (await editorApi.getCursor()) || { index: 0 };

  setSelectionFrom(getPreviousItem(list, selectionIndex), editorApi);

  return list.length;
};

const replaceNext = async (params, editorApi) => {
  const { replaceStr } = params;
  const { text, list, error } = await findAllOccurrences(params, editorApi);

  if (error) {
    console.error(error);
    return;
  }

  /*
    somehow cannot retrieve selection head position, so using anchor index
    minus selection text to get head

    it should work like this:

    const [fromIndex, toIndex] = await Promise.all([
      editorApi.getCursor('head'),
      editorApi.getCursor('anchor'),
    ]).then((list) => list.map(({ index }) => index).sort());
  */

  const selection = await editorApi.getSelection();
  const { index: toIndex } = await editorApi.getCursor();
  const fromIndex = toIndex - selection.length;

  const item = getNextItem(list, fromIndex);

  if (!item) {
    return list.length;
  }

  if (item.index === fromIndex && item[0] === selection) {
    await editorApi.setValue(
      `${text.substring(0, fromIndex)}${replaceStr}${text.substring(toIndex)}`,
    );

    await editorApi.setCursor(fromIndex + replaceStr.length);

    return findNext(params, editorApi);
  }

  setSelectionFrom(item, editorApi);

  return list.length;
};

const replaceAll = async (params, editorApi) => {
  const { replaceStr } = params;
  const { text, list, error } = await findAllOccurrences(params, editorApi);

  if (error) {
    console.error(error);
    return;
  }

  const updatedText = list
    .reverse()
    .reduce(
      (sourceText, { index, 0: match }) =>
        `${sourceText.substring(0, index)}${replaceStr}${sourceText.substring(
          index + match.length,
        )}`,
      text,
    );

  await editorApi.setValue(updatedText);

  return 0;
};

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
let modalInitialized = false;
let hideModalCallback = null;

const initFns = (editorApi, hideModal) => {
  setWebViewTopSpacing = createSetWebViewTopSpacing(editorApi);
  removeWebViewTopSpacing = createRemoveWebViewTopSpacing(editorApi);
  hideModalCallback = hideModal;
  modalInitialized = true;
};

const tool = {
  order: 500,
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
        getNumberOfOccurences: (params) => getNumberOfOccurences(params, editorApi),
        onFindNext: (params) => findNext(params, editorApi),
        onFindPrevious: (params) => findPrevious(params, editorApi),
      },
    });

    await modalPromise;

    removeWebViewTopSpacing();
    modalPromise = null;
  },
  longPressHandler: async ({ closeToolsPanel, showModal, hideModal, editorApi }) => {
    initFns(editorApi, hideModal);
    setWebViewTopSpacing(REPLACE_MODAL_HEIGHT);
    closeToolsPanel();

    // add top margin /padding to give space for search modal

    modalPromise = showModal({
      renderer: searchAndReplaceScreenRenderer,
      props: {
        getNumberOfOccurences: (params) => getNumberOfOccurences(params, editorApi),
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
    if (modalInitialized && modalPromise) {
      hideModalCallback(modalPromise);
    }
  },
  onEditorLoad: () => {
    // possibly at this point there is another API object after reload, need checking
    // it should just re-initialize same API instance
    if (modalInitialized) {
      setWebViewTopSpacing();
    }
  },
  onEditorReady: () => {},
};

export default tool;
