import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { TEXT_ACTIVE_COLOR, TEXT_DISABLED_COLOR } from '@actualwave/react-native-kingnare-style';

import { getEditorHistoryUndoCount } from 'source/store/codeeditor/selectors';

import { createButton } from 'source/components/ToolButtonList';

const HistoryUndoButton = connect((state) => ({
  disabled: getEditorHistoryUndoCount(state) <= 0,
}))(
  createButton(({ disabled }) => (
    <Ionicons
      name="ios-undo"
      color={disabled ? TEXT_DISABLED_COLOR : TEXT_ACTIVE_COLOR}
      size={28}
    />
  )),
);

const tool = {
  type: 'editor',
  group: 'rn-playground-editor-history',
  groupOrder: 3,
  order: 1,
  controlRenderer: (pressHandler, longPressHandler) => (
    <HistoryUndoButton
      key="historyButton-undo"
      onPress={pressHandler}
      onLongPress={longPressHandler}
    />
  ),
  pressHandler: ({ editorApi }) => {
    editorApi.historyUndo();
  },
};

export default tool;
