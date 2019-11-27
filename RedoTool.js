import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { TEXT_ACTIVE_COLOR, TEXT_DISABLED_COLOR } from '@actualwave/react-native-kingnare-style';

import { getEditorHistoryRedoCount } from 'source/store/codeeditor/selectors';

import { createButton } from 'source/components/ToolButtonList';

const HistoryRedoButton = connect((state) => ({
  disabled: getEditorHistoryRedoCount(state) <= 0,
}))(
  createButton(({ disabled }) => (
    <Ionicons
      name="ios-redo"
      color={disabled ? TEXT_DISABLED_COLOR : TEXT_ACTIVE_COLOR}
      size={28}
    />
  )),
);

const tool = {
  type: 'editor',
  group: 'rn-playground-editor-history',
  groupOrder: 3,
  order: 2,
  controlRenderer: (pressHandler, longPressHandler) => (
    <HistoryRedoButton
      key="historyButton-redo"
      onPress={pressHandler}
      onLongPress={longPressHandler}
    />
  ),
  pressHandler: ({ editorApi }) => {
    editorApi.historyRedo();
  },
};

export default tool;
