import React from 'react';
import { Clipboard } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { TEXT_ACTIVE_COLOR } from '@actualwave/react-native-kingnare-style';

/*
    This tool uses Codeval to transform code and copies it into clipboard.
    Long Press may give user a selection to store into file
*/

const tool = {
  type: 'editor',
  mimeType: ['application/javascript'],
  iconRenderer: () => <MaterialIcons name="transform" color={TEXT_ACTIVE_COLOR} size={28} />,
  pressHandler: async ({ editorApi, consoleApi, codevalApi }) => {
    try {
      const source = await editorApi.getValue();
      const code = await codevalApi.transform(source);

      Clipboard.setString(code);
    } catch (error) {
      consoleApi.error(error);
    }
  },
};

export default tool;
