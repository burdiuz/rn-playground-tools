import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { TEXT_ACTIVE_COLOR } from '@actualwave/react-native-kingnare-style';

const tool = {
  type: 'editor',
  iconRenderer: () => (
    <MaterialCommunityIcons name="backspace-outline" color={TEXT_ACTIVE_COLOR} size={28} />
  ),
  pressHandler: async ({ editorApi }) => {
    editorApi.execCommand('deleteLine');
  },
};

export default tool;
