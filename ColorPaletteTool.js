import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, Clipboard, TouchableHighlight } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  sliderLabel: { width: 60, textAlign: 'right', marginRight: 10, marginTop: 4 },
  fullFlex: { flex: 1 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  input: { width: 40, marginVertical: 10 },
  inputLabel: { marginLeft: 10, marginRight: 5, marginVertical: 14 },
  inputsRow: { paddingBottom: 0 },
  colorButton: { margin: 5 },
});

const colorToChannels = (value) => [
  value >>> 24,
  (value >>> 16) & 0xff,
  (value >>> 8) & 0xff,
  value & 0xff,
];

const colorToValues = (value) => [
  (value >>> 24) / 0xff,
  ((value >>> 16) & 0xff) / 0xff,
  ((value >>> 8) & 0xff) / 0xff,
  (value & 0xff) / 0xff,
];

const toChannel = (value) => Math.max(0, Math.min(0xff, (value * 0xff) >> 0));

const parseChannelDecStr = (value) => Math.min(0xff, Math.max(0, parseInt(value, 10) || 0));

const channelsTo24BitColorNumber = (r, g, b) => (r << 16) | (g << 8) | b;

const channelsTo32BitColorNumber = (r, g, b, a) => channelsTo24BitColorNumber(r, g, b) * 256 + a;

const channelsToColorString = (r, g, b, a, type = '0x') => {
  const value =
    type === '0x' || a !== 0xff
      ? channelsTo32BitColorNumber(r, g, b, a)
          .toString(16)
          .padStart(8, '0')
      : channelsTo24BitColorNumber(r, g, b)
          .toString(16)
          .padStart(6, '0');

  return `${type}${value}`;
};

const toColorString = (color, colorType) =>
  channelsToColorString(...colorToChannels(color), colorType);

const STORAGE_KEY = '@tool-color-palette-user-colors';

const getValuesFromStorage = async () => {
  let list;

  try {
    list = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY));
  } catch (error) {
    // ignore
  }

  return list || [];
};

const addValueToStorage = async (color) => {
  const list = await getValuesFromStorage();

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([color, ...list.filter((value) => value !== color)].slice(0, 20)),
  );
};

const LabelledHSlider = withInputLabel(HSlider);
const LabelledTextInput = withInputLabel(TextInput);

const Slider = (props) => (
  <HGroup>
    <LabelledHSlider {...props} style={styles.fullFlex} labelStyle={styles.sliderLabel} />
  </HGroup>
);

const ColorView = ({ color, size }) => (
  <TransparencyBackground style={{ width: size, height: size }}>
    <Area
      style={{ width: size, height: size }}
      contentContainerStyle={{
        backgroundColor: color,
      }}
    />
  </TransparencyBackground>
);

ColorView.propTypes = {
  color: PropTypes.number.isRequired,
  size: PropTypes.number,
};

ColorView.defaultProps = {
  size: 40,
};

const ColorButton = ({ onValue, color, ...props }) => (
  <TouchableHighlight onPress={() => onValue(color)} style={styles.colorButton}>
    <ColorView color={color} {...props} />
  </TouchableHighlight>
);

ColorButton.propTypes = {
  onValue: PropTypes.func.isRequired,
  color: PropTypes.number.isRequired,
};

const StoredColors = ({ onValue, ...props }) => {
  const [colors, setColors] = useState(null);

  useEffect(() => {
    (async () => {
      const list = await getValuesFromStorage();
      setColors(list);
    })();
  });

  if (!colors) {
    return <Text>Reading data. Please, wait...</Text>;
  }

  if (!colors.length) {
    return <Text>No previously saved colors.</Text>;
  }

  return (
    <View {...props} style={styles.rowWrap}>
      {colors.map((color) => (
        <ColorButton key={color} color={color} onValue={onValue} />
      ))}
    </View>
  );
};

StoredColors.propTypes = {
  onValue: PropTypes.func.isRequired,
};

const ColorTemperature = ({ startingTemperature, onValue, ...props }) => {
  const [redShift, setRedShift] = useState(startingTemperature);

  return (
    <HGroup {...props}>
      <VSlider value={redShift} onChange={(value) => setRedShift(value)} />
      <ColorSheet red={(0xff * redShift) >> 0} multiplier={12} cellSize={20} onValue={onValue} />
    </HGroup>
  );
};

ColorTemperature.propTypes = {
  onValue: PropTypes.func.isRequired,
  startingTemperature: PropTypes.number,
};

ColorTemperature.defaultProps = {
  startingTemperature: 0,
};

const ColorPaletteView = ({ color, onChange }) => {
  const [redChannel, greenChannel, blueChannel, alphaChannel] = colorToChannels(color);
  const [red, green, blue, alpha] = colorToValues(color);

  return (
    <>
      <HGroup style={styles.inputsRow}>
        <ColorView color={color} size={50} />
        <LabelledTextInput
          label="R:"
          value={String(redChannel)}
          onChangeText={(value) =>
            onChange(
              channelsTo32BitColorNumber(
                parseChannelDecStr(value),
                greenChannel,
                blueChannel,
                alphaChannel,
              ),
            )
          }
          style={styles.input}
          labelStyle={styles.inputLabel}
        />
        <LabelledTextInput
          label="G:"
          value={String(greenChannel)}
          onChangeText={(value) =>
            onChange(
              channelsTo32BitColorNumber(
                redChannel,
                parseChannelDecStr(value),
                blueChannel,
                alphaChannel,
              ),
            )
          }
          style={styles.input}
          labelStyle={styles.inputLabel}
        />
        <LabelledTextInput
          label="B:"
          value={String(blueChannel)}
          onChangeText={(value) =>
            onChange(
              channelsTo32BitColorNumber(
                redChannel,
                greenChannel,
                parseChannelDecStr(value),
                alphaChannel,
              ),
            )
          }
          style={styles.input}
          labelStyle={styles.inputLabel}
        />
        <LabelledTextInput
          label="A:"
          value={String(alphaChannel)}
          onChangeText={(value) =>
            onChange(
              channelsTo32BitColorNumber(
                redChannel,
                greenChannel,
                blueChannel,
                parseChannelDecStr(value),
              ),
            )
          }
          style={styles.input}
          labelStyle={styles.inputLabel}
        />
      </HGroup>
      <TabView>
        <TabView.Child label="By Channel">
          <Slider
            label="Red:"
            value={red}
            onChange={(value) =>
              onChange(
                channelsTo32BitColorNumber(
                  toChannel(value),
                  greenChannel,
                  blueChannel,
                  alphaChannel,
                ),
              )
            }
          />
          <Slider
            label="Green:"
            value={green}
            onChange={(value) =>
              onChange(
                channelsTo32BitColorNumber(redChannel, toChannel(value), blueChannel, alphaChannel),
              )
            }
          />
          <Slider
            label="Blue:"
            value={blue}
            onChange={(value) =>
              onChange(
                channelsTo32BitColorNumber(
                  redChannel,
                  greenChannel,
                  toChannel(value),
                  alphaChannel,
                ),
              )
            }
          />
          <Slider
            label="Alpha:"
            value={alpha}
            onChange={(value) =>
              onChange(
                channelsTo32BitColorNumber(redChannel, greenChannel, blueChannel, toChannel(value)),
              )
            }
          />
        </TabView.Child>
        <TabView.Child label="By Temperature">
          <ColorTemperature
            startingTemperature={red}
            onValue={(value) =>
              onChange(
                channelsTo32BitColorNumber(
                  value >>> 16,
                  (value >>> 8) & 0xff,
                  (value >>> 8) & 0xff,
                  value & 0xff,
                  alphaChannel,
                ),
              )
            }
          />
        </TabView.Child>
        <TabView.Child label="Saved">
          <StoredColors
            onValue={(value) =>
              onChange(
                channelsTo32BitColorNumber(
                  value >>> 24,
                  (value >>> 16) & 0xff,
                  (value >>> 8) & 0xff,
                  value & 0xff,
                ),
              )
            }
          />
        </TabView.Child>
      </TabView>
    </>
  );
};

ColorPaletteView.propTypes = {
  color: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

const ColorPaletteScreen = ({
  colorType,
  initialColor,
  close,
  onCancel,
  onCopy,
  onSubmit,
  submitTitle,
}) => {
  const [color, setColor] = useState(initialColor);
  const colorString = toColorString(color, colorType);

  return (
    <Screen>
      <ColorPaletteView color={color} onChange={setColor} />
      <View style={styles.fullFlex} />
      <HGroup>
        <TextButton label="Cancel" onPress={onCancel || close} />
        <View style={styles.fullFlex} />
        {onCopy ? (
          <TextButton
            label="Copy"
            onPress={() => {
              onCopy(colorString);
              addValueToStorage(color);
            }}
          />
        ) : null}
        {onSubmit ? (
          <TextButton
            label={submitTitle}
            onPress={() => {
              onSubmit(colorString);
              addValueToStorage(color);
            }}
            style={{ marginLeft: 10 }}
          />
        ) : null}
      </HGroup>
    </Screen>
  );
};

ColorPaletteScreen.propTypes = {
  close: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  onCopy: PropTypes.func,
  onSubmit: PropTypes.func,
  colorType: PropTypes.string,
  initialColor: PropTypes.number,
  submitTitle: PropTypes.string,
};

ColorPaletteScreen.defaultProps = {
  onCancel: undefined,
  onCopy: undefined,
  onSubmit: undefined,
  colorType: '0x',
  initialColor: 0xffffffff,
  submitTitle: 'Submit',
};

const ColorPaletteToolModal = withHostedModal(
  ColorPaletteScreen,
  ['onCancel', 'onCopy', 'onSubmit'],
  bigModalDefaultStyle,
);

const { renderer: colorPaletteScreenRenderer } = ColorPaletteToolModal;

const FIND_COLOR_CODE_RGX = /(0x|#|^)([a-f\d]{3}|[a-f\d]{6}|[a-f\d]{8})(?=$|[^\w\d])/i;

const getChannelFromColorString = (color, position) =>
  Number.parseInt(color.substr(position * 2, 2) || 'ff', 16);

const parseColor = (color) => {
  if (color.length === 3) {
    color = color
      .split('')
      .map((a) => `${a}${a}`)
      .join('');
  }

  return channelsTo32BitColorNumber(
    getChannelFromColorString(color, 0),
    getChannelFromColorString(color, 1),
    getChannelFromColorString(color, 2),
    getChannelFromColorString(color, 3),
  );
};

const tool = {
  type: 'editor',
  iconRenderer: () => <Ionicons name="md-color-palette" color={TEXT_ACTIVE_COLOR} size={28} />,
  pressHandler: async ({ closeToolsPanel, showModal, editorApi }) => {
    const selection = (await editorApi.getSelection()) || '';

    const [selectedValue, colorType = '0x', colorString = 'ffffffff'] =
      selection.match(FIND_COLOR_CODE_RGX) || [];

    const color = parseColor(colorString);

    closeToolsPanel();

    const type = showModal({
      renderer: colorPaletteScreenRenderer,
      props: {
        colorType,
        initialColor: color,
        submitTitle: 'Paste To Code',
        onCancel: () => null,
        onSubmit: async (value) => {
          if (selectedValue) {
            editorApi.replaceSelection(selection.replace(selectedValue, value));
          } else {
            editorApi.replaceSelection(value);
          }
        },
        onCopy: (value) => {
          Clipboard.setString(value);
        },
      },
    });
  },
  getValuesFromStorage,
  addValueToStorage,
  ColorPaletteView,
  ColorPaletteScreen,
  ColorPaletteToolModal,
  renderColorPaletteView: (color, onChange) => (
    <ColorPaletteView color={color} onChange={onChange} />
  ),
};

export default tool;
