import React from 'react';
import PropTypes from 'prop-types';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { TEXT_ACTIVE_COLOR } from '@actualwave/react-native-kingnare-style';
import { fileRunContainer } from '@actualwave/rn-playground-projects';

import { fileRunContainerSelectModalRenderer } from 'source/modals/FileRunContainerSelectModal';

const tool = {
  type: 'editor',
  group: 'rn-playground-js-run',
  groupOrder: 2,
  order: 1,
  mimeType: ['application/javascript'],
  iconRenderer: () => (
    <FontAwesome name="play-circle" color={TEXT_ACTIVE_COLOR} size={28} />
  ),
  pressHandler: async ({
    editorFile,
    closeToolsPanel,
    navigationApi,
    editorApi,
  }) => {
    const content = await editorApi.getValue();

    closeToolsPanel();

    navigationApi.navigateToLive({
      file: editorFile,
      content,
    });
  },
  longPressHandler: async ({
    showModal,
    editorFile,
    closeToolsPanel,
    navigationApi,
    editorApi,
  }) => {
    let containerFileName = fileRunContainer.getValue(editorFile.getSettings());
    let cancelled = false;

    closeToolsPanel();

    const container = await showModal({
      renderer: fileRunContainerSelectModalRenderer,
      props: {
        target: editorFile,
        onSubmit: () => null,
        onCancel: () => {
          cancelled = true;
        },
        forceTargetSettings: false,
      },
    });

    if (cancelled) {
      return;
    }

    if (container) {
      containerFileName = container.name;
    }

    const content = await editorApi.getValue();

    navigationApi.navigateToLive({
      file: editorFile,
      content,
      containerFileName,
    });
  },
};

export default tool;
