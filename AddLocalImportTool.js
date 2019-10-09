import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, Clipboard, TouchableHighlight } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  Screen,
  Area,
  HSlider,
  VSlider,
  HGroup,
  TextInput,
  TextButton,
  TEXT_ACTIVE_COLOR,
  withHostedModal,
  bigModalDefaultStyle,
  TransparencyBackground,
  withInputLabel,
  TabView,
  ColorSheet,
  Text,
} from '@actualwave/react-native-kingnare-style';

const styles = StyleSheet.create({
  fullFlex: { flex: 1 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
});


const ColorPaletteScreen = ({ close, pasteIntoCode, copyToClipboard }) => (
  <Screen />
);

const CreateProjectModal = withHostedModal(
  ColorPaletteScreen,
  ['onSubmit', 'onCancel'],
  bigModalDefaultStyle,
);

export const { renderer: colorPaletteScreenRenderer } = CreateProjectModal;

const tool = {
  iconRenderer: () => <MaterialCommunityIcons name="import" color={TEXT_ACTIVE_COLOR} size={28} />,
  pressHandler: async ({ showModal, editorApi }) => {
    showModal({
      renderer: colorPaletteScreenRenderer,
      props: {
        pasteIntoCode: (value) => {
          editorApi.replaceSelection(value);
        },
        copyToClipboard: (value) => {
          Clipboard.setString(value);
        },
      },
    });
  },
};

// Add import to a local file
export default tool;
