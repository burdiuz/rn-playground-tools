import React from 'react';

import { Text } from '@actualwave/react-native-kingnare-style';

const tool = {
  title: 'General Tools Information',
  viewRenderer: () => (
    <Text>
      This panel or screen is designed for custom general-purpose tools. You can create your own
      tools and put them into Tools directory, look for examples there. Tools which are being
      rendered here have type set to "general" and they require you to specify "title" and
      "viewRenderer" properties. Using optional prop "labelViewRenderer" you may render a button or
      something else on right side of tool section label.
    </Text>
  ),
  type: 'general',
};

export default tool;
