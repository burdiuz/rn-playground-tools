import React from 'react';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { TEXT_ACTIVE_COLOR } from '@actualwave/react-native-kingnare-style';

/*
    This tool uses Codeval to transform code and copies it into clipboard.
    Long Press may give user a selection to store into file
*/

const tool = {
  type: 'editor',
  mimeType: ['application/json'],
  iconRenderer: () => <AntDesign name="flag" color={TEXT_ACTIVE_COLOR} size={28} />,
  pressHandler: async ({ sidePanel, editorApi, consoleApi }) => {
    try {
      const source = await editorApi.getValue();
      const data = JSON.parse(source);
      editorApi.setValue(JSON.stringify(data, null, 2));
    } catch (error) {
      consoleApi.error(error);
      sidePanel.openConsole();
    }
  },
};

export default tool;
