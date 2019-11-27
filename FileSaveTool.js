import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  TEXT_ACTIVE_COLOR,
  TEXT_DISABLED_COLOR,
} from '@actualwave/react-native-kingnare-style';

import {
  codeEditorSaveContentToFile,
  codeEditorOpenFile,
} from 'source/store/codeeditor/actions';
import {
  isEditorContentChanged,
  getEditorFile,
} from 'source/store/codeeditor/selectors';
import { createButton } from 'source/components/ToolButtonList';
import { editorFileSaveAsModalRenderer } from 'source/modals/EditorFileSaveAsModal';

const FileSaveButton = connect(
  (state) => ({
    file: getEditorFile(state),
    disabled: !isEditorContentChanged(state),
  }),
  {
    saveContentToFile: codeEditorSaveContentToFile,
    forceOpenFile: codeEditorOpenFile,
  },
)(
  createButton(
    ({ disabled }) => (
      <MaterialCommunityIcons
        name="content-save"
        color={disabled ? TEXT_DISABLED_COLOR : TEXT_ACTIVE_COLOR}
        size={28}
      />
    ),
    (props) => {
      const {
        onPress,
        onLongPress,
        file,
        saveContentToFile,
        forceOpenFile,
      } = props;

      return {
        ...props,
        onPress: (event) => onPress({ event, saveContentToFile }),
        onLongPress: (event) => onLongPress({ event, file, forceOpenFile }),
      };
    },
  ),
);

const tool = {
  type: 'editor',
  group: 'rn-playground-editor-file',
  groupOrder: 1,
  order: 1,
  controlRenderer: (pressHandler, longPressHandler) => (
    <FileSaveButton
      key="manageButtons-saveFile"
      onPress={pressHandler}
      onLongPress={longPressHandler}
    />
  ),
  pressHandler: async ({
    closeToolsPanel,
    editorApi,
    data: { saveContentToFile },
  }) => {
    const content = await editorApi.getValue();

    await saveContentToFile({ content });
    closeToolsPanel();
  },
  longPressHandler: async ({
    closeToolsPanel,
    showModal,
    editorApi,
    projectsApi,
    navigationApi,
    data: { file, forceOpenFile },
  }) => {
    closeToolsPanel();
    const { getParent, createFile } = projectsApi;
    const content = await editorApi.getValue();
    const parent = await getParent(file);

    await showModal({
      renderer: editorFileSaveAsModalRenderer,
      props: {
        file,
        parent,
        projectsApi,
        onSubmit: async (fileName, target) => {
          const result = await createFile(fileName, content, null, target);

          target.updated();

          navigationApi.navigateToCodeEditor({
            file: result,
            supressContentChangedCheck: true,
          });
        },
        onCancel: () => null,
      },
    });
  },
};

export default tool;
