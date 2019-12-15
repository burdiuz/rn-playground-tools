import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { TEXT_ACTIVE_COLOR } from '@actualwave/react-native-kingnare-style';

import { runTestApp } from 'source/utils';
import { getApplicationRootTag } from 'source/store/application/selectors';
import { createButton } from 'source/components/ToolButtonList';

const RunApplicationButton = connect((state) => ({
  rootTag: getApplicationRootTag(state),
}))(
  createButton(
    () => <FontAwesome name="play" color={TEXT_ACTIVE_COLOR} size={28} />,
    (props) => {
      const { onPress, onLongPress, rootTag } = props;

      return {
        ...props,
        onPress: (event) => onPress({ event, rootTag }),
        onLongPress: (event) => onLongPress({ event, rootTag }),
      };
    },
  ),
);

const tool = {
  type: 'editor',
  group: 'rn-playground-js-run',
  groupOrder: 2,
  order: 2,
  mimeType: ['application/javascript'],
  controlRenderer: (pressHandler, longPressHandler) => (
    <RunApplicationButton
      key="runButtons-runApplication"
      onPress={pressHandler}
      onLongPress={longPressHandler}
    />
  ),
  pressHandler: async ({ editorApi, editorFile: file, codevalApi, data: { rootTag } }) => {
    try {
      const __FILE__ = file.path;
      const __PATH__ = file.fs.parentPath();

      const content = await editorApi.getValue();
      const modules = await codevalApi.evaluate(content, { __FILE__, __PATH__ }, file);
      let { default: AppComponent } = modules;
      if (!AppComponent) {
        AppComponent = modules;
      }

      runTestApp(AppComponent, rootTag);
    } catch (error) {
      console.error(error);
    }
  },
  longPressHandler: ({ showAlert }) => {
    showAlert(
      'This mode runs your code instead of the Playground. Be sure to provide "export default" with your main component and handle "navigateBack()" prop to be able to return back.',
      'Run as Application',
    );
  },
};

export default tool;
