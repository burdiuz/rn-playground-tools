/*
    This tool should allow user to create a style set under a name and then put into code

    StyleScheet.crate({
        ... here styles & names they have selected
    })

    or paste them into code as single object(they should highlight if have conflicting properties).

	It should display on top list of unrecognized style properties and possibility to add more custom props
	Then it should display categorized list of styles like
	 - Flexbox
	 - Spacings
	 - Text
	 - Position
	 - ???
	And there should be a switch to display only used style props, this will expand all categories and show only used props.

    Basically it will have two screens
    1. List of already created style sets
    2. Screen to generate set from all possible styles.
       User may select component for which they are adding styles to have help or style selection.
       Also, user may want to add a bunch of styles for appliance area, like layout styles, font styles, spacing styles stc.

	3. It should have preview view if it's possible using one of run containers(define it in tool settings) and should apply changes immediately
	4. Bind Color tool with it, so it will run color tool when color value needed
	5. It should remember styles for components so user may quickly select style they want
	6. Make it possible to "confirm" style property name, by default is "style", also could be "contentContainerStyle" and anything else


  ----
  No, we should not identify prop names or something.
  All we should do is identify an object constrain and try to parse it.
  So, whever user clicks, if cursor within a JS object, we can work with it.
  ----


https://facebook.github.io/react-native/docs/image-style-props
https://facebook.github.io/react-native/docs/layout-props
https://facebook.github.io/react-native/docs/shadow-props
https://facebook.github.io/react-native/docs/text-style-props
https://facebook.github.io/react-native/docs/view-style-props
*/
/*
  Instead of trying to display a component, make a dropdown with options. User selects a preview for 
   - position
   - appearance
   - text
   - image
   - flex child vertical
   - flex child horizontal
   - flex container(1)
   - flex container(2)
   - flex container(3)

  It displays small preview to show how style affects view
  May add something like to previews
   - original component
  which will try to render original component
*/

import React, { Component, memo, useCallback, useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  StyleSheet,
  FlatList,
  SectionList,
  Clipboard,
  ScrollView,
  TouchableHighlight,
} from 'react-native';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import TransparentIconButton from 'source/components/TransparentIconButton';
import BasicIconButton from 'source/buttons/BasicIconButton';
import { showModal } from 'source/store/modals/actions';
import { getToolByFileName } from 'source/store/file/tools/selectors';

import {
  Screen,
  ModalScreen,
  Area,
  HSlider,
  VSlider,
  HRule,
  VGroup,
  HGroup,
  SBGroup,
  Section,
  TextInput,
  TextArea,
  LinkButton,
  TextButton,
  IconButton,
  SectionButton,
  CheckBoxButton,
  SmallHeader,
  SlimHeader,
  SmallHeaderText,
  DropDown,
  TEXT_COLOR,
  TEXT_ACTIVE_COLOR,
  TEXT_DISABLED_COLOR,
  LIGHT_BORDER_COLOR,
  DARK_BORDER_COLOR,
  withHostedModal,
  bigModalDefaultStyle,
  TransparencyBackground,
  withInputLabel,
  TabView,
  Text,
  Small,
  ActiveText,
  DisabledText,
} from '@actualwave/react-native-kingnare-style';

/*
  I'm using modal from Color Palette Tool to display color selection in this tool.
  For more information, search for ShowColorPaletteButton component
*/
const COLOR_PALETTE_TOOL_FILE_NAME = 'ColorPaletteTool.js';

const NUMBER_AND_PERCENT = {
  type: 'number',
  matcher: '^-?\\d+(\\.d+)?%?$',
  matchErrorMessage: 'Value should a number or percent value',
};

const NUMBER = {
  type: 'number',
  matcher: '^-?\\d+(\\.d+)?$',
  matchErrorMessage: 'Value should be a number',
};

const INTEGER = {
  type: 'number',
  matcher: '^-?\\d+$',
  matchErrorMessage: 'Value should be an integer',
};

const COLOR = {
  type: 'color',
  matcher: '^0x(?:\\d{2,2}|\\d{4}|\\d{6}|\\d{8})$',
  matchErrorMessage: 'Value should be a HEX color',
};

const POSITIVE_INTEGER = {
  type: 'number',
  matcher: '^\\d+$',
  matchErrorMessage: 'Value should be a positive integer',
};

const APPEARANCE = [
  { name: 'width', ...NUMBER_AND_PERCENT },
  { name: 'height', ...NUMBER_AND_PERCENT },
  { name: 'margin', ...NUMBER_AND_PERCENT },
  { name: 'padding', ...NUMBER_AND_PERCENT },
  { name: 'borderWidth', type: 'number' },
  { name: 'borderColor', type: 'color' },
  { name: 'borderRadius', type: 'number' },
  { name: 'backgroundColor', type: 'color' },
  { name: 'overflow', type: 'string', options: ['visible', 'hidden', 'scroll'] },
  { name: 'display', type: 'string', options: ['none', 'flex'] },
  { name: 'opacity', type: 'number' },
  { name: 'backfaceVisibility', type: 'string', options: ['visible', 'hidden'] },
  { name: 'elevation', ...POSITIVE_INTEGER },
];

const FLEXBOX = [
  {
    name: 'alignContent',
    type: 'string',
    options: ['flex-start', 'flex-end', 'center', 'stretch', 'space-between', 'space-around'],
  },
  {
    name: 'alignItems',
    type: 'string',
    options: ['flex-start', 'flex-end', 'center', 'stretch', 'baseline'],
  },
  {
    name: 'alignSelf',
    type: 'string',
    options: ['auto', 'flex-start', 'flex-end', 'center', 'stretch', 'baseline'],
  },
  { name: 'aspectRatio', type: 'number' },
  { name: 'flex', type: 'number' },
  { name: 'flexBasis', ...NUMBER_AND_PERCENT },
  {
    name: 'flexDirection',
    type: 'string',
    options: ['row', 'row-reverse', 'column', 'column-reverse'],
  },
  { name: 'flexGrow', type: 'number' },
  { name: 'flexShrink', type: 'number' },
  {
    name: 'flexWrap',
    type: 'string',
    options: ['wrap', 'nowrap'],
  },
  {
    name: 'justifyContent',
    type: 'string',
    options: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'],
  },
];

const POSITION = [
  {
    name: 'position',
    type: 'string',
    options: ['absolute', 'relative'],
  },
  { name: 'zIndex', type: 'number' },
  { name: 'top', ...NUMBER_AND_PERCENT },
  { name: 'right', ...NUMBER_AND_PERCENT },
  { name: 'bottom', ...NUMBER_AND_PERCENT },
  { name: 'left', ...NUMBER_AND_PERCENT },
  { name: 'start', ...NUMBER_AND_PERCENT },
  { name: 'end', ...NUMBER_AND_PERCENT },
  { name: 'width', ...NUMBER_AND_PERCENT },
  { name: 'height', ...NUMBER_AND_PERCENT },
  { name: 'minWidth', ...NUMBER_AND_PERCENT },
  { name: 'minHeight', ...NUMBER_AND_PERCENT },
  { name: 'maxWidth', ...NUMBER_AND_PERCENT },
  { name: 'maxHeight', ...NUMBER_AND_PERCENT },
];

const MARGIN = [
  { name: 'margin', ...NUMBER_AND_PERCENT },
  { name: 'marginBottom', ...NUMBER_AND_PERCENT },
  { name: 'marginEnd', ...NUMBER_AND_PERCENT },
  { name: 'marginHorizontal', ...NUMBER_AND_PERCENT },
  { name: 'marginLeft', ...NUMBER_AND_PERCENT },
  { name: 'marginRight', ...NUMBER_AND_PERCENT },
  { name: 'marginStart', ...NUMBER_AND_PERCENT },
  { name: 'marginTop', ...NUMBER_AND_PERCENT },
  { name: 'marginVertical', ...NUMBER_AND_PERCENT },
];

const PADDING = [
  { name: 'padding', ...NUMBER_AND_PERCENT },
  { name: 'paddingBottom', ...NUMBER_AND_PERCENT },
  { name: 'paddingEnd', ...NUMBER_AND_PERCENT },
  { name: 'paddingHorizontal', ...NUMBER_AND_PERCENT },
  { name: 'paddingLeft', ...NUMBER_AND_PERCENT },
  { name: 'paddingRight', ...NUMBER_AND_PERCENT },
  { name: 'paddingStart', ...NUMBER_AND_PERCENT },
  { name: 'paddingTop', ...NUMBER_AND_PERCENT },
  { name: 'paddingVertical', ...NUMBER_AND_PERCENT },
];

const BORDER = [
  { name: 'borderWidth', type: 'number' },
  { name: 'borderColor', type: 'color' },
  { name: 'borderRadius', type: 'number' },
  { name: 'borderStyle', type: 'number', options: ['solid', 'dotted', 'dashed'] },
  { name: 'borderRightColor', type: 'color' },
  { name: 'borderBottomColor', type: 'color' },
  { name: 'borderBottomEndRadius', type: 'number' },
  { name: 'borderBottomLeftRadius', type: 'number' },
  { name: 'borderBottomRightRadius', type: 'number' },
  { name: 'borderBottomStartRadius', type: 'number' },
  { name: 'borderBottomWidth', type: 'number' },
  { name: 'borderEndColor', type: 'color' },
  { name: 'borderLeftColor', type: 'color' },
  { name: 'borderLeftWidth', type: 'number' },
  { name: 'borderRightWidth', type: 'number' },
  { name: 'borderStartColor', type: 'color' },
  { name: 'borderTopColor', type: 'color' },
  { name: 'borderTopEndRadius', type: 'number' },
  { name: 'borderTopLeftRadius', type: 'number' },
  { name: 'borderTopRightRadius', type: 'number' },
  { name: 'borderTopStartRadius', type: 'number' },
  { name: 'borderTopWidth', type: 'number' },
];

const IMAGE = [
  {
    name: 'resizeMode',
    type: 'string',
    options: ['cover', 'contain', 'stretch', 'repeat', 'center'],
  },
  { name: 'tintColor', type: 'color' },
  { name: 'overlayColor', type: 'color' },
];

const TEXT = [
  { name: 'color', type: 'color' },
  { name: 'fontSize', type: 'number' },
  { name: 'fontStyle', type: 'string', options: ['normal', 'italic'] },
  {
    name: 'fontWeight',
    type: 'string',
    options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  },
  { name: 'lineHeight', type: 'number' },
  {
    name: 'textAlign',
    type: 'string',
    options: ['auto', 'left', 'right', 'center', 'justify'],
  },
  {
    name: 'textDecorationLine',
    type: 'string',
    options: ['none', 'underline', 'line-through', 'underline line-through'],
  },
  { name: 'textShadowColor', type: 'color' },
  { name: 'fontFamily', type: 'string' },
  { name: 'textShadowRadius', type: 'number' },
  { name: 'includeFontPadding', type: 'bool' },
  {
    name: 'textAlignVertical',
    type: 'string',
    options: ['auto', 'top', 'bottom', 'center'],
  },
  { name: 'letterSpacing', type: 'number' },
  {
    name: 'textTransform',
    type: 'string',
    options: ['none', 'uppercase', 'lowercase', 'capitalize'],
  },
];

const STYLE_SECTIONS = [
  { label: 'Appearance Styles', props: APPEARANCE },
  { label: 'FlexBox Styles', props: FLEXBOX },
  { label: 'Position Styles', props: POSITION },
  { label: 'Margin Styles', props: MARGIN },
  { label: 'Padding Styles', props: PADDING },
  { label: 'Border Styles', props: BORDER },
  { label: 'Image Styles', props: IMAGE },
  { label: 'Text Styles', props: TEXT },
];

let defaultStringQuote = '"';

const isQuoteEscaped = (str, index) => {
  let count = 1;
  while (str.charAt(index - count) === '\\') {
    count++;
  }

  // we start with 1 when no escape chars exist,
  // so condition is reversed -- if odd then not escaped
  return count % 2 ? false : true;
};

const findStringEndQuoteIndex = (str, startQuotePos = 0) => {
  const quote = str.charAt(startQuotePos);
  let lastIndex = str.indexOf(quote, startQuotePos + 1);

  while (lastIndex > 0 && isQuoteEscaped(str, lastIndex)) {
    lastIndex = str.indexOf(quote, lastIndex + 1);
  }

  return lastIndex;
};

const getSectionClosingBrace = (char) => {
  switch (char) {
    case '{':
      return '}';
    case '[':
      return ']';
    case '(':
      return ')';
    case '<':
      return '>';
    default:
      return undefined;
  }
};

const findObjectStartingBrace = (str, cursorPos) => {
  return str.substr(str, cursorPos + 1).lastIndexOf('{');
};

const CLOSING_BRACE_RGX = {
  '{': /[{}"'`\/]/,
  '[': /[[\]"'`\/]/,
  '(': /[()"'`\/]/,
  '<': /[<>"'`\/]/,
};

const findBraceBoundaryIndex = (str, index) => {
  const brace = str.charAt(index);
  const rgx = CLOSING_BRACE_RGX[brace];
  const { length } = str;
  1;
  let depth = 1;
  let lastIndex = index;

  do {
    const chrIndex = str.substr(lastIndex + 1).search(rgx);

    if (chrIndex < 0) {
      return chrIndex;
    }

    lastIndex += chrIndex;
    const chr = str.charAt(lastIndex);

    switch (chr) {
      case brace:
        lastIndex = skipBlock(str, lastIndex);
        break;
      case '"':
      case "'":
      case '`':
        lastIndex = findStringEndQuoteIndex(str, lastIndex);
        break;
      case '/':
        lastIndex = skipComment(str, lastIndex);
        break;
      default:
        return lastIndex;
    }
  } while (depth > 0 && lastIndex < length);

  return lastIndex;
};

const SINGLELINE_COMMENT_RGX = /^(\s+\/\/[^\n]*(?=\n))+/g;

const findSinglelineCommentLastIndex = (str, startIndex) => {
  const [commentStr] = str.substr(startIndex).match(SINGLELINE_COMMENT_RGX) || [];

  if (!commentStr) {
    throw new Error('String identified as a multiline comment could not be parsed.');
  }

  return startIndex + commentStr.length - 1;
};

const MULTILINE_COMMENT_RGX = /^\s*\/\*(?:.|\n)*?\*\//;

const findMultilineCommentLastIndex = (str, startIndex) => {
  const [commentStr] = str.substr(startIndex).match(MULTILINE_COMMENT_RGX) || [];

  if (!commentStr) {
    throw new Error('String identified as a multiline comment could not be parsed.');
  }

  return startIndex + commentStr.length - 1;
};

const REGEXPS = {};

/*
  We search for 
  "{", "[", "(", "\"", "'", "`" - to skip blocks
  "/" - to detect a start of a comment block, if not followed by "/" or "*", skip it
*/
const getSkipRegExpFor = (chars) => {
  let rgx = REGEXPS[chars];
  if (!rgx) {
    rgx = new RegExp(`[\\{\\[\\("'\`\\/${chars}]`);
    REGEXPS[chars] = rgx;
  }

  return rgx;
};

const skipToSymbol = (str, index, chars) => {
  
};

/*
  We search for 
  "{", "[", "(", "\"", "'", "`" - to skip blocks
  "/" - to detect a start of a comment block, if not followed by "/" or "*", skip it
  ":" - to detect boulds of a label part
  "," - to detect end of block, possible not a label(spread?), skip to search next label
  "}" - to detect bound of object
*/
const LABEL_SEARCH_SYMBOLS = /[\{\[\("'`\/:,\}]/;

/*
  We search for same symbols as label, except don't look for ":" -- it can't be there
*/
const VALUE_SEARCH_SYMBOLS = /[\{\[\("'`\/,\}]/;

const LABEL_END_SEARCH_CHARS = ':,\\}';
const VALUE_END_SEARCH_CHARS = ',\\}';

const findNextPunctuationIndex = (str, rgx, index) => {
  const { length } = str;
  let lastIndex = index;

  do {
    const chrIndex = str.substr(lastIndex + 1).search(rgx);

    if (chrIndex < 0) {
      return chrIndex;
    }

    lastIndex += chrIndex;
    const chr = str.charAt(lastIndex);

    switch (chr) {
      case '[':
      case '(':
      case '{':
      case '<':
        lastIndex = skipBlock(str, lastIndex);
        break;
      case '"':
      case "'":
      case '`':
        lastIndex = findStringEndQuoteIndex(str, lastIndex);
        break;
      case '/':
        lastIndex = skipComment(str, lastIndex);
        break;
      default:
        return lastIndex;
    }
  } while (lastIndex < length);
};

const parseStyleObject = (str, cursorIndex) => {
  const startIndex = findObjectStartingBrace(str, cursorIndex);

  if (startIndex < 0) {
    // invalid
    return null;
  }

  let lastIndex = startIndex + 1;
  let lookupLabel = true;
  let nextIndex;
  let lastChar;

  do {
    nextIndex = findNextPunctuationIndex(
      str,
      lookupLabel ? LABEL_SEARCH_SYMBOLS : VALUE_SEARCH_SYMBOLS,
      lastIndex,
    );
    lastChar = str.charAt(nextIndex);
    lastIndex = nextIndex + 1;

    /* after retrieving label or value, cut comments from start and end
    {
      // pre label
      display /* post label * / : /* pre value * / "flex" // post value
      ,
    }
    property object should be something like
    {
      label: {
        pre: "    // pre label",
        text: "display",
        post: "    /* post label *\/",
      },
      value: {
        pre: "    /* pre value *\/",
        text: "flex",
        post: "    // post value",
      },
    }
    */
  } while (lastChar !== '}' && lastIndex < str.length);
};

const parsingTarget = `(
  <Obj
    param={{
      0: this.item.value,
      // float will be converted to a string
      0.25: 'quarter',
      normal: \`${value}%\`,
      postLabelComment
      // comment here
      : "text here",
      valueComment: /* this value is commented */ functionCall(getListFrom(this.props.funcParams)(10, false))[1],
      /*
        Special Chars labels
      */
      ['-special' + '^chars']: 563.34325, // comment before label
      '@property': [1, 2, 3, 'string'],
    }}
  />
)`;

console.log(parseStyleObject(parsingTarget, 50));

const styles = StyleSheet.create({
  fullFlex: { flex: 1 },
  listContainer: { paddingBottom: 200 },
  input: {
    width: 150,
  },
  number: {
    width: 150,
    textAlign: 'right',
  },
  color: {
    width: 118,
    textAlign: 'right',
  },
  error: {
    borderColor: 0xff0000ff,
  },
});

const getStyle = (value, matcher, style) => {
  const hasError = matcher && value !== '' && value !== undefined ? matcher.test(value) : false;

  return hasError ? [style, styles.error] : style;
};

const StyleStringValue = ({ value, prop: { name, matcher }, onChange }) => (
  <TextInput
    value={value}
    placeholder="String"
    placeholderTextColor={TEXT_DISABLED_COLOR}
    onChangeText={(newValue) => onChange(name, newValue)}
    style={getStyle(value, matcher, styles.input)}
  />
);

const StyleNumberValue = ({ value, prop: { name, matcher }, onChange }) => (
  <TextInput
    value={value}
    placeholder="Number"
    placeholderTextColor={TEXT_DISABLED_COLOR}
    onChangeText={(newValue) => onChange(name, newValue)}
    keyboardType="decimal-pad"
    style={getStyle(value, matcher, styles.number)}
  />
);

const StyleEnumValue = ({ value, prop: { name, matcher, options }, onChange }) => {
  const items = useMemo(() => options.map((value) => ({ label: value, value })), []);
  const selectedItem = items.find((item) => item.value === value);

  if (value && !selectedItem) {
    return (
      <TextInput
        value={value}
        onChangeText={(newValue) => onChange(name, newValue)}
        style={getStyle(value, matcher, styles.input)}
      />
    );
  }

  return (
    <DropDown
      items={items}
      selectedItem={selectedItem}
      onChange={({ value }) => onChange(name, value)}
      style={styles.input}
    />
  );
};

const StyleBoolValue = ({ value, prop: { name }, onChange }) => (
  <CheckBoxButton selected={value} onPress={() => onChange(name, !value)} />
);

const ShowColorPaletteButton = connect(
  (state) => {
    const { iconRenderer, ColorPaletteToolModal: { renderer: colorPaletteModalRenderer } = {} } =
      getToolByFileName(state, { fileName: COLOR_PALETTE_TOOL_FILE_NAME }) || {};

    return { iconRenderer, colorPaletteModalRenderer };
  },
  { showModal },
)(({ iconRenderer, colorPaletteModalRenderer, showModal, name, value, onChange }) => {
  const showColorPalette = useMemo(() => {
    if (!iconRenderer || !colorPaletteModalRenderer || !showModal) {
      return undefined;
    }

    return (currentValue) =>
      new Promise((resolve, reject) => {
        showModal({
          renderer: colorPaletteModalRenderer,
          props: {
            colorType: '0x',
            initialColor: parseInt(currentValue, 16),
            submitTitle: ' Apply ',
            onCancel: reject,
            onSubmit: resolve,
          },
        });
      });
  }, [colorPaletteModalRenderer, showModal]);

  const handlePress = useMemo(
    () => async () => {
      try {
        const newValue = await showColorPalette(value);

        onChange(name, newValue);
      } catch (error) {
        console.log('error', error);
      }
    },
    [showColorPalette, value, onChange],
  );
  return (
    <IconButton
      iconRenderer={iconRenderer}
      onPress={handlePress}
      selected={!showColorPalette}
      disabled={!showColorPalette}
    />
  );
});

const StyleColorValue = ({ value, prop: { name, matcher }, onChange }) => {
  return (
    <HGroup noPadding>
      <ShowColorPaletteButton value={value} name={name} onChange={onChange} />
      <TextInput
        value={value}
        placeholder="Color"
        placeholderTextColor={TEXT_DISABLED_COLOR}
        onChangeText={(newValue) => onChange(name, newValue)}
        style={getStyle(value, matcher, styles.color)}
      />
    </HGroup>
  );
};

const renderPropValue = (value, prop, onChange) => {
  const { type, options } = prop;

  let ValueComponent;

  if (options && options.length) {
    ValueComponent = StyleEnumValue;
  } else {
    switch (type) {
      case 'number':
        ValueComponent = StyleNumberValue;
        break;
      case 'color':
        ValueComponent = StyleColorValue;
        break;
      case 'bool':
        ValueComponent = StyleBoolValue;
        break;
      case 'string':
      default:
        ValueComponent = StyleStringValue;
        break;
    }
  }

  return <ValueComponent value={value} prop={prop} onChange={onChange} />;
};

const StylePropRow = memo(
  ({ value, prop, onChange }) => {
    const { name } = prop;

    return (
      <SBGroup>
        <ActiveText>{name}</ActiveText>
        {renderPropValue(value, prop, onChange)}
      </SBGroup>
    );
  },
  ({ value: a }, { value: b }) => a === b,
);

const NoStyleProps = () => <Text style={{ margin: 10, textAlign: 'center' }}>...</Text>;

const validateSectionData = (section, values) => {
  const { expanded, undefinedVisible, props } = section;
  let data;
  if (expanded) {
    if (undefinedVisible) {
      data = [...props];
    } else {
      data = props.filter(({ name }) => {
        const value = values[name];

        return value !== '' && value !== undefined;
      });
    }
  } else {
    data = [];
  }

  return { ...section, data };
};

export class StyleComposerToolView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      sections: STYLE_SECTIONS.map((section) => ({
        ...section,
        expanded: false,
        undefinedVisible: true,
        data: [],
      })),
      sectionsEnabled: true,
      list: [],
      values: {},
    };
  }

  handleChange = (name, value) =>
    this.setState(({ values }) => ({ values: { ...values, [name]: value } }));

  handleUpdate = () => {
    const { onSubmit } = this.props;

    onSubmit(buildPropsStringFrom(this.state.list));
  };

  handleToggleSections = () =>
    this.setState(({ sections, values, sectionsEnabled }) => {
      const enabled = !sectionsEnabled;
      const names = {};

      return {
        sectionsEnabled: enabled,
        list: enabled
          ? []
          : sections
              .reduce(
                (list, section) => [
                  ...list,
                  ...validateSectionData(
                    { ...section, expanded: true, undefinedVisible: false },
                    values,
                  ).data,
                ],
                [],
              )
              .filter(({ name }) => {
                if (names[name] === true) {
                  return false;
                }

                names[name] = true;

                return true;
              })
              .sort(({ name: a }, { name: b }) => (a < b ? -1 : 1)),
      };
    });

  handleCollapseAll = () =>
    this.setState(({ sections, values }) => ({
      sections: sections.map((section) =>
        section.expanded ? validateSectionData({ ...section, expanded: false }, values) : section,
      ),
    }));

  handleExpandAll = () =>
    this.setState(({ sections, values }) => ({
      sections: sections.map((section) =>
        section.expanded ? section : validateSectionData({ ...section, expanded: true }, values),
      ),
    }));

  toggleSectionExpanded = (section) =>
    this.setState(({ sections, values }) => {
      const { expanded } = section;
      const sectionIndex = sections.indexOf(section);
      const newSections = [...sections];

      newSections[sectionIndex] = validateSectionData({ ...section, expanded: !expanded }, values);

      return { sections: newSections };
    });

  toggleUndefinedVisible = (section) =>
    this.setState(({ sections, values }) => {
      const { undefinedVisible } = section;
      const sectionIndex = sections.indexOf(section);
      const newSections = [...sections];

      newSections[sectionIndex] = validateSectionData(
        { ...section, undefinedVisible: !undefinedVisible },
        values,
      );

      return { sections: newSections };
    });

  renderSectionHeader = ({ section }) => {
    const { label, expanded, undefinedVisible, data } = section;

    return (
      <SectionButton
        key={label}
        label={label}
        expanded={expanded}
        onPress={() => this.toggleSectionExpanded(section)}
      >
        <CheckBoxButton
          selected={undefinedVisible}
          onPress={() => this.toggleUndefinedVisible(section)}
        />
      </SectionButton>
    );
  };

  renderItem = ({ item, index, section }) => {
    const { name } = item;
    const {
      values: { [name]: value },
    } = this.state;

    return <StylePropRow key={name} prop={item} value={value} onChange={this.handleChange} />;
  };

  renderSectionList() {
    const { sections, values } = this.state;

    return (
      <SectionList
        sections={sections}
        extraData={values}
        renderItem={this.renderItem}
        renderSectionHeader={this.renderSectionHeader}
        contentContainerStyle={styles.listContainer}
        style={styles.fullFlex}
      />
    );
  }

  renderFlatList() {
    const { list, values } = this.state;

    return (
      <FlatList
        data={list}
        extraData={values}
        renderItem={this.renderItem}
        contentContainerStyle={styles.listContainer}
        style={styles.fullFlex}
      />
    );
  }

  renderList() {
    const { sectionsEnabled } = this.state;

    if (sectionsEnabled) {
      return this.renderSectionList();
    }

    return this.renderFlatList();
  }

  render() {
    const { close } = this.props;
    const { sectionsEnabled } = this.state;

    return (
      <>
        <SBGroup style={{ marginVertical: 10 }}>
          <SmallHeaderText>Style Composer</SmallHeaderText>
          <HGroup noPadding>
            <BasicIconButton
              iconClass={MaterialCommunityIcons}
              icon="view-headline"
              selected={sectionsEnabled}
              onPress={this.handleToggleSections}
            />
            <BasicIconButton
              iconClass={MaterialCommunityIcons}
              icon="expand-all"
              style={{ marginHorizontal: 10 }}
              onPress={this.handleCollapseAll}
              disabled={!sectionsEnabled}
            />
            <BasicIconButton
              iconClass={MaterialCommunityIcons}
              icon="collapse-all"
              onPress={this.handleExpandAll}
              disabled={!sectionsEnabled}
            />
          </HGroup>
        </SBGroup>
        {this.renderList()}
        <SBGroup style={{ marginTop: 5 }}>
          <TextButton label="Cancel" onPress={close} />
          <TextButton label="Update" onPress={this.handleUpdate} />
        </SBGroup>
      </>
    );
  }
}

const StyleComposerToolModal = withHostedModal(
  StyleComposerToolView,
  ['onSubmit'],
  {},
  undefined,
  ModalScreen,
);

export const { renderer: propTypeParametersToolScreenRenderer } = StyleComposerToolModal;

const tool = {
  type: 'editor',
  mimeType: ['application/javascript'],
  iconRenderer: () => (
    <MaterialCommunityIcons name="playlist-edit" color={TEXT_ACTIVE_COLOR} size={28} />
  ),
  pressHandler: async ({
    closeToolsPanel,
    showModal,
    showAlert,
    editorApi,
    editorFile,
    codevalApi,
  }) => {
    closeToolsPanel();
    try {
      const {
        target,
        message,
        propTypes,
        propTypesList,
        defaultProps,
        TargetComponent,
      } = await loadTargetComponent(editorApi, editorFile, codevalApi);

      const { name, props } = target;

      showModal({
        renderer: propTypeParametersToolScreenRenderer,
        props: {
          name,
          props,
          propTypes,
          propTypesList,
          defaultProps,
          TargetComponent,
          onSubmit: async (value) => {
            const { content, propsStartIndex, endIndex } = target;
            const code = `${content.substring(0, propsStartIndex)}${value}${content.substring(
              endIndex,
            )}`;

            console.log(code);

            editorApi.setValue(code);
          },
        },
      });
    } catch (error) {
      showAlert(error.message, 'Error');
    }
  },
};

export default tool;
