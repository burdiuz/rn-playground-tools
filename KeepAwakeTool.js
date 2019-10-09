import React, { useState } from 'react';
import KeepAwake from 'react-native-keep-awake';

import { VGroup, RGroup, TextButton, Text } from '@actualwave/react-native-kingnare-style';

let persistentActive = false;

const KeepAwakeButton = () => {
  const [active, setActive] = useState(persistentActive);
  persistentActive = active;

  return (
    <>
      <Text>
        Keep Awake is
        {active ? ' active' : ' not active'}.
      </Text>
      <RGroup noPadding>
        <TextButton
          label={active ? 'Deactivate' : 'Activate'}
          onPress={() => {
            active ? KeepAwake.deactivate() : KeepAwake.activate();
            setActive(!active);
          }}
        />
      </RGroup>
    </>
  );
};

const tool = {
  title: 'Keep Awake',
  viewRenderer: () => (
    <VGroup>
      <Text>This tool enables/disabled keep-awake mode which prevents screen to lock.</Text>
      <KeepAwakeButton />
    </VGroup>
  ),
  type: 'general',
};

export default tool;
