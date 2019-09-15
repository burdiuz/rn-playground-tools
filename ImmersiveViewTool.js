import React from 'react';
import { Immersive } from 'react-native-immersive';

import { VGroup, SBGroup, TextButton, Text } from '@actualwave/react-native-kingnare-style';

let persistentActive = false;

const restoreImmersive = () => {
  if (persistentActive) {
    Immersive.on();
  } else {
    Immersive.removeImmersiveListener(restoreImmersive);
  }
};

const ImmersiveViewButton = () => {
  const [active, setActive] = useState(persistentActive);
  persistentActive = active;

  return (
    <SBGroup noPadding>
      <Text>Immersive view is {active ? 'active' : 'not active'}.</Text>
      <TextButton
        label={active ? 'Deactivate' : 'Activate'}
        onPress={() => {
          if (active) {
            Immersive.off();
            Immersive.removeImmersiveListener(restoreImmersive);
            setActive(false);
          } else {
            Immersive.on();
            Immersive.addImmersiveListener(restoreImmersive);
            setActive(true);
          }
        }}
      />
    </SBGroup>
  );
};

const tool = {
  title: 'Immersive view',
  viewRenderer: () => (
    <VGroup>
      <Text>
        This tool enables/disables immersive view which renders application in fullscreen, may not
        work or have no efffect on some devices.
      </Text>
      <ImmersiveViewButton />
    </VGroup>
  ),
  onDestroy: () => {
    Immersive.removeImmersiveListener(restoreImmersive);
  },
  type: 'general',
};

export default tool;
