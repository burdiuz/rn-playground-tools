import React, { useEffect, useState } from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { IconButton, TEXT_ACTIVE_COLOR } from '@actualwave/react-native-kingnare-style';

const FileLockButton = ({ item, ...props }) => {
  const [, setUpdated] = useState(0);

  useEffect(() => {
    const updatedHandler = () => setUpdated(0);

    item.addUpdatedListener(updatedHandler);

    return () => item.removeUpdatedListener(updatedHandler);
  }, []);

  return (
    <IconButton
      {...props}
      icon={
        <FontAwesome name={item.locked ? 'lock' : 'unlock'} color={TEXT_ACTIVE_COLOR} size={16} />
      }
      style={{ marginHorizontal: 4 }}
    />
  );
};

const controlRenderer = (pressHandler, longPressHandler, button, { item }) => (
  <FileLockButton item={item} onPress={pressHandler} onLongPress={longPressHandler} />
);

const tool = {
  type: ['file'],
  // mimeType: ['application/json', 'application/javascript'],
  controlRenderer,
  pressHandler: async ({ item }) => {
    item.locked = !item.locked;

    await item.flushSettings();
    item.updated();
  },
};

export default tool;
