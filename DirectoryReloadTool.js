import React from 'react';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { TEXT_ACTIVE_COLOR } from '@actualwave/react-native-kingnare-style';

const tool = {
  type: ['directory', 'project'],
  iconRenderer: () => <AntDesign name="reload1" color={TEXT_ACTIVE_COLOR} size={16} />,
  pressHandler: async ({ item, closeToolPanel }) => {
    item.updated();

    closeToolPanel();
  },
};

export default tool;
