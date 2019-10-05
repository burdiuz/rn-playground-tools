import React, { useState, useEffect, useRef, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { TouchableHighlight, View, FlatList, StyleSheet, Clipboard, Image } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {
  ACTIVE_BACKGROUND_COLOR,
  TEXT_COLOR,
  TEXT_ACTIVE_COLOR,
  BUTTON_COLOR,
  withHostedModal,
  ModalScreen,
  Text,
  Small,
  SmallHeader,
  SlimHeader,
  TextButton,
  InputPlaceholder,
  HGroup,
  HRule,
  DropDown,
  Section,
  SBGroup,
  Spacer,
  CheckBox,
  HSlider,
} from '@actualwave/react-native-kingnare-style';

const FONTS = [
  { label: 'AntDesign', value: () => require('react-native-vector-icons/AntDesign') },
  { label: 'Entypo', value: () => require('react-native-vector-icons/Entypo') },
  { label: 'EvilIcons', value: () => require('react-native-vector-icons/EvilIcons') },
  { label: 'Feather', value: () => require('react-native-vector-icons/Feather') },
  { label: 'FontAwesome', value: () => require('react-native-vector-icons/FontAwesome') },
// { label: 'FontAwesome5', value: () => require('react-native-vector-icons/FontAwesome5') },
// { label: 'FontAwesome5Pro', value: () => require('react-native-vector-icons/FontAwesome5Pro') },
  { label: 'Fontisto', value: () => require('react-native-vector-icons/Fontisto') },
  { label: 'Foundation', value: () => require('react-native-vector-icons/Foundation') },
  { label: 'Ionicons', value: () => require('react-native-vector-icons/Ionicons') },
  {
    label: 'MaterialCommunityIcons',
    value: () => require('react-native-vector-icons/MaterialCommunityIcons'),
  },
  { label: 'MaterialIcons', value: () => require('react-native-vector-icons/MaterialIcons') },
  { label: 'Octicons', value: () => require('react-native-vector-icons/Octicons') },
  { label: 'SimpleLineIcons', value: () => require('react-native-vector-icons/SimpleLineIcons') },
  { label: 'Zocial', value: () => require('react-native-vector-icons/Zocial') },
];

const AS_ICON = 'icon';
const AS_IMAGE = 'image';
const AS_NAME = 'name';
const AS_BUTTON = 'button';

const ICON_COMPONENT_OPTIONS = [
  { label: 'Icon Component', value: AS_ICON },
  { label: 'Image Source', value: AS_IMAGE },
  { label: 'Name String', value: AS_NAME },
  { label: 'Icon Button', value: AS_BUTTON },
];

const MIN_SIZE = 8;
const MAX_SIZE = 300;

const renderPreview = (Font, name, type, zoom) => {
  const size = MIN_SIZE + Math.floor(MAX_SIZE * zoom);

  switch (type) {
    case AS_ICON:
      return <Font name={name} color={TEXT_COLOR} size={size} />;
    case AS_IMAGE: {
      const IconImage = ({ size, color }) => {
        const [source, setSource] = useState(null);

        useEffect(() => {
          Font.getImageSource(name, size, color).then(setSource);
        }, []);

        if (!source) {
          return null;
        }

        return <Image source={source} resizeMode="contain" style={{ height: size, width: size }} />;
      };

      return <IconImage color={TEXT_COLOR} size={size} />;
    }
    case AS_NAME:
      return <Text>{name}</Text>;
    case AS_BUTTON:
      return (
        <Font.Button
          name={name}
          color={TEXT_COLOR}
          size={size}
          backgroundColor={BUTTON_COLOR}
          onPress={() => null}
        >
          <Text>
            {name}
            {' '}
Button
          </Text>
        </Font.Button>
      );
  }
};

const styles = StyleSheet.create({
  fullFlex: { flex: 1 },
  glyphListItemOdd: {
    padding: 5,
    flexDirection: 'row',
  },
  glyphListItemEven: {
    padding: 5,
    flexDirection: 'row',
    backgroundColor: ACTIVE_BACKGROUND_COLOR,
  },
  glyphListItemText: { marginLeft: 10 },
});

const generateResultingData = (type, fontFamily, name, includeImport, includeImgComp, zoom) => {
  const size = MIN_SIZE + Math.floor(MAX_SIZE * zoom);
  let result = '';

  switch (type) {
    case AS_ICON:
      result = `
<${fontFamily} name="${name}" color="#ffffff" size={${size}} />`;
      break;
    case AS_IMAGE:
      if (includeImgComp) {
        result = `
const IconImage = ({ size = ${size}, color = '#ffffff, loadingView = null }) => {
  const [source, setSource] = useState(null);

  useEffect(() => {
    ${fontFamily}.getImageSource("${name}", size, color).then(setSource);
  }, []);

  if (!source) {
    return loadingView;
  }

  return <Image source={source} resizeMode="contain" style={{ height: size, width: size }} />;
};
`;
      } else {
        result = `${fontFamily}.getImageSource("${name}", ${size}, '#ffffff')`;
      }
      break;
    case AS_NAME:
      result = name;
      break;
    case AS_BUTTON:
      result = `
<${fontFamily}.Button name="${name}" size={${size}} color="#ffffff" backgroundColor="#3b5998" onPress={() => null}>
  <Text>${name} Button</Text>
</${fontFamily}.Button>`;
      break;
  }

  return (data = {
    key: `react-native-vector-icons/${fontFamily}`,
    importCode: includeImport
      ? `import ${fontFamily} from 'react-native-vector-icons/${fontFamily}';\n`
      : '',
    iconCode: result,
  });
};

const GenerateCodeView = ({
  fontFamily,
  Font,
  name,
  copyToClipboard,
  pasteIntoCode,
  onCancel,
  onBack,
  onImport,
}) => {
  const [useAs, setUseAs] = useState(ICON_COMPONENT_OPTIONS[0]);
  const [includeImport, setIncludeImport] = useState(false);
  const [includeImgComp, setIncludeImgComp] = useState(false);
  const [zoom, setZoom] = useState(0.2);

  const { value: type } = useAs;

  return (
    <>
      <SmallHeader>
        {fontFamily}
        {' '}
/
        {name}
      </SmallHeader>
      <HGroup noHorizontalPadding style={{ alignSelf: 'stretch' }}>
        <Font
          name={name}
          color={TEXT_COLOR}
          size={100}
          style={{
            margin: 5,
            padding: 5,
            alignSelf: 'center',
            backgroundColor: ACTIVE_BACKGROUND_COLOR,
            borderWidth: 2,
            borderColor: TEXT_COLOR,
          }}
        />
        <View
          style={{ flex: 1, alignSelf: 'stretch', alignItems: 'stretch', justifyContent: 'center' }}
        >
          <InputPlaceholder label="Use Font Icon as">
            <DropDown
              items={ICON_COMPONENT_OPTIONS}
              selectedItem={useAs}
              onChange={(item) => {
                setUseAs(item);
              }}
            />
          </InputPlaceholder>
          <HSlider
            value={zoom}
            onChange={(value) => setZoom(value)}
            style={{ marginHorizontal: 10 }}
          />
        </View>
      </HGroup>
      <CheckBox
        selected={includeImport}
        label="Include Font import"
        onPress={() => setIncludeImport(!includeImport)}
      />
      {type === AS_IMAGE ? (
        <CheckBox
          selected={includeImgComp}
          label="Wrap into Image component"
          onPress={() => setIncludeImgComp(!includeImgComp)}
        />
      ) : null}
      <View
        style={{
          flex: 1,
          alignSelf: 'stretch',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        {renderPreview(Font, name, type, zoom)}
      </View>
      <HGroup noHorizontalPadding>
        <TextButton label="Cancel" onPress={onCancel} />
        <View style={styles.fullFlex} />
        <TextButton label="Back" onPress={onBack} />
        <TextButton
          label="Copy"
          onPress={() => {
            copyToClipboard(
              generateResultingData(type, fontFamily, name, includeImport, includeImgComp, zoom),
            );
          }}
          style={{ marginHorizontal: 10 }}
        />
        <TextButton
          label="Paste To Code"
          onPress={() => {
            pasteIntoCode(
              generateResultingData(type, fontFamily, name, includeImport, includeImgComp, zoom),
            );
          }}
        />
      </HGroup>
    </>
  );
};

const GlyphListItem = ({ Font, name, index, onPress }) => (
  <TouchableHighlight onPress={onPress}>
    <View style={index % 2 ? styles.glyphListItemOdd : styles.glyphListItemEven}>
      <Font name={name} color={TEXT_ACTIVE_COLOR} size={30} />
      <Text style={styles.glyphListItemText}>{name}</Text>
    </View>
  </TouchableHighlight>
);

const renderGlyphListItem = (Font, onSelected) => ({ item, index }) => (
  <GlyphListItem
    key={item}
    Font={Font}
    name={item}
    index={index}
    onPress={() => onSelected(item, Font)}
  />
);

const GlyphsList = forwardRef(({ Font, list, onSelected }, ref) => (
  <FlatList
    ref={ref}
    data={list}
    keyExtractor={(name) => name}
    renderItem={renderGlyphListItem(Font, onSelected)}
  />
));

const usedFonts = {};

const prepareFont = ({ label, value: factory }) => {
  if (!usedFonts[label]) {
    const { default: Font, getStyledIconSet } = factory();

    usedFonts[label] = {
      Font,
      fontFamily: label,
      glyphs: Object.keys(FontAwesome.getRawGlyphMap())
        .sort()
        .filter(Font.hasIcon),
    };
  }

  return usedFonts[label];
};

const SelectGlyphView = ({ list, selectedItem, onCancel, onContinue }) => {
  const listRef = useRef();
  const [fontItem, setFontItem] = useState(selectedItem);
  const [{ Font, fontFamily, glyphs }, setGlyphList] = useState({});

  useEffect(() => {
    setGlyphList(prepareFont(FONTS[0]));
  }, []);

  return (
    <>
      <SmallHeader>Select an Icon</SmallHeader>
      <DropDown
        items={FONTS}
        selectedItem={fontItem}
        onChange={(item) => {
          setFontItem(item);
          setGlyphList(prepareFont(item));

          if (listRef.current) {
            listRef.current.scrollToOffset(0);
          }
        }}
      />
      <SlimHeader style={{ marginTop: 20 }}>Available Glyphs</SlimHeader>
      {Font ? (
        <GlyphsList
          ref={listRef}
          Font={Font}
          list={glyphs}
          onSelected={(name) => onContinue(fontItem, Font, fontFamily, name)}
        />
      ) : (
        <Spacer />
      )}
      <Small style={{ margin: 5 }}>
        All icons are aailable thanks to react-native-vector-icons package.
      </Small>
      <HGroup noHorizontalPadding>
        <TextButton label="Cancel" onPress={onCancel} />
      </HGroup>
    </>
  );
};

const IconFinderView = ({ list, close, pasteIntoCode, copyToClipboard }) => {
  const [currentFontItem, setCurrentFontItem] = useState(FONTS[0]);
  const [icon, selectIcon] = useState(null);

  if (icon) {
    return (
      <GenerateCodeView
        {...icon}
        onCancel={close}
        onBack={() => selectIcon(null)}
        pasteIntoCode={pasteIntoCode}
        copyToClipboard={copyToClipboard}
      />
    );
  }

  return (
    <SelectGlyphView
      onCancel={close}
      selectedItem={currentFontItem}
      onContinue={(fontItem, Font, fontFamily, name) => {
        setCurrentFontItem(fontItem);
        selectIcon({ Font, fontFamily, name });
      }}
    />
  );
};

const IconFinderModal = withHostedModal(
  IconFinderView,
  ['pasteIntoCode', 'copyToClipboard'],
  {},
  undefined,
  ModalScreen,
);

export const { renderer: iconFinderModalRenderer } = IconFinderModal;

const tool = {
  type: 'editor',
  mimeType: ['application/javascript'],
  iconRenderer: () => <FontAwesome name="fonticons" color={TEXT_ACTIVE_COLOR} size={28} />,
  pressHandler: async ({ closeToolsPanel, showModal, editorApi }) => {
    closeToolsPanel();
    showModal({
      renderer: iconFinderModalRenderer,
      props: {
        pasteIntoCode: async ({ key, importCode, iconCode }) => {
          await editorApi.replaceSelection(iconCode);
          if (!importCode) {
            return;
          }

          const code = await editorApi.getValue();

          if (code.indexOf(key) < 0) {
            editorApi.setValue(`${importCode}${code}`);
          }
        },
        copyToClipboard: ({ importCode, iconCode }) => {
          Clipboard.setString(`${importCode}${iconCode}`);
        },
      },
    });
  },
};

export default tool;
