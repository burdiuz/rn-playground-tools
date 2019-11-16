import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { TEXT_ACTIVE_COLOR } from '@actualwave/react-native-kingnare-style';

const tool = {
  type: 'editor',
  iconRenderer: () => <MaterialCommunityIcons name="broom" color={TEXT_ACTIVE_COLOR} size={28} />,
  pressHandler: async ({ editorApi }) => {
    editorApi.setValue('');
  },
};

export default tool;
