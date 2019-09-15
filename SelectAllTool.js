import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { TEXT_ACTIVE_COLOR } from '@actualwave/react-native-kingnare-style';

const tool = {
  type: 'editor',
  iconRenderer: () => (
    <MaterialCommunityIcons name="select-all" color={TEXT_ACTIVE_COLOR} size={28} />
  ),
  pressHandler: async ({ editorApi }) => {
    editorApi.focus();
    editorApi.execCommand('selectAll');
  },
};

export default tool;
