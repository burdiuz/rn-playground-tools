import React, { useEffect, useState } from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { IconButton, TEXT_ACTIVE_COLOR } from '@actualwave/react-native-kingnare-style';

const FilePinButton = ({ item, ...props }) => {
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
        <MaterialCommunityIcons name={item.pinned ? 'pin' : 'pin-off'} color={TEXT_ACTIVE_COLOR} size={16} />
      }
      style={{ marginHorizontal: 4 }}
    />
  );
};

const controlRenderer = (pressHandler, longPressHandler, button, { item }) => (
  <FilePinButton item={item} onPress={pressHandler} onLongPress={longPressHandler} />
);

const tool = {
  type: ['file', 'directory', 'project'],
  // mimeType: ['application/json', 'application/javascript'],
  controlRenderer,
  pressHandler: async ({ item, closeToolPanel }) => {
    item.pinned = !item.pinned;

    await item.flushSettings();
    item.updated();

    closeToolPanel();
  },
};

export default tool;
