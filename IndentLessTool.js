import React from 'react';
import AntDesignIcons from 'react-native-vector-icons/AntDesign';

import { TEXT_ACTIVE_COLOR } from '@actualwave/react-native-kingnare-style';

const tool = {
  type: 'editor',
  iconRenderer: () => (
    <AntDesignIcons name="indent-left" color={TEXT_ACTIVE_COLOR} size={28} />
  ),
  pressHandler: async ({ editorApi }) => {
    editorApi.execCommand('indentLess');
  },
};

export default tool;
