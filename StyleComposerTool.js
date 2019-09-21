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

const NUMBER_RGX = /^-?(\d+(\.\d+)?|\.\d+|0x[\da-f]+)$/i;

const NUMBER_TYPE = 'number';
const STRING_TYPE = 'string';
const COLOR_TYPE = 'color';
const BOOL_TYPE = 'bool';

const NUMBER_AND_PERCENT = {
  type: NUMBER_TYPE,
  matcher: /^-?\d+(\.\d+)?%?$/,
  matchErrorMessage: 'Value should a number or percent value',
};

const NUMBER = {
  type: NUMBER_TYPE,
  matcher: NUMBER_RGX,
  matchErrorMessage: 'Value should be a number',
};

const INTEGER = {
  type: NUMBER_TYPE,
  matcher: /^-?\d+$/,
  matchErrorMessage: 'Value should be an integer',
};

const COLOR = {
  type: COLOR_TYPE,
  matcher: /^0x(?:[\da-f]{2}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i,
  matchErrorMessage: 'Value should be a HEX color',
};

const POSITIVE_INTEGER = {
  type: NUMBER_TYPE,
  matcher: /^\d+$/,
  matchErrorMessage: 'Value should be a positive integer',
};

const APPEARANCE = [
  { name: 'width', ...NUMBER_AND_PERCENT },
  { name: 'height', ...NUMBER_AND_PERCENT },
  { name: 'margin', ...NUMBER_AND_PERCENT },
  { name: 'padding', ...NUMBER_AND_PERCENT },
  { name: 'borderWidth', ...NUMBER },
  { name: 'borderColor', ...COLOR },
  { name: 'borderRadius', ...NUMBER },
  { name: 'backgroundColor', ...COLOR },
  { name: 'overflow', type: STRING_TYPE, options: ['', 'visible', 'hidden', 'scroll'] },
  { name: 'display', type: STRING_TYPE, options: ['', 'none', 'flex'] },
  { name: 'opacity', ...NUMBER },
  { name: 'backfaceVisibility', type: STRING_TYPE, options: ['', 'visible', 'hidden'] },
  { name: 'elevation', ...POSITIVE_INTEGER },
];

const FLEXBOX = [
  {
    name: 'alignContent',
    type: STRING_TYPE,
    options: ['', 'flex-start', 'flex-end', 'center', 'stretch', 'space-between', 'space-around'],
  },
  {
    name: 'alignItems',
    type: STRING_TYPE,
    options: ['', 'flex-start', 'flex-end', 'center', 'stretch', 'baseline'],
  },
  {
    name: 'alignSelf',
    type: STRING_TYPE,
    options: ['', 'auto', 'flex-start', 'flex-end', 'center', 'stretch', 'baseline'],
  },
  { name: 'aspectRatio', ...NUMBER },
  { name: 'flex', ...NUMBER },
  { name: 'flexBasis', ...NUMBER_AND_PERCENT },
  {
    name: 'flexDirection',
    type: STRING_TYPE,
    options: ['', 'row', 'row-reverse', 'column', 'column-reverse'],
  },
  { name: 'flexGrow', ...NUMBER },
  { name: 'flexShrink', ...NUMBER },
  {
    name: 'flexWrap',
    type: STRING_TYPE,
    options: ['', 'wrap', 'nowrap'],
  },
  {
    name: 'justifyContent',
    type: STRING_TYPE,
    options: [
      '',
      'flex-start',
      'flex-end',
      'center',
      'space-between',
      'space-around',
      'space-evenly',
    ],
  },
];

const POSITION = [
  {
    name: 'position',
    type: STRING_TYPE,
    options: ['', 'absolute', 'relative'],
  },
  { name: 'zIndex', ...NUMBER },
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
  { name: 'borderWidth', ...NUMBER },
  { name: 'borderColor', ...COLOR },
  { name: 'borderRadius', ...NUMBER },
  {
    name: 'borderStyle',
    type: NUMBER_TYPE,
    matcher: /^(-?\d+(\.\d+)?|-?\.\d+|solid|dotted|dashed)$/,
    matchErrorMessage: 'Vaue must be a number or one of solid, dotted or dashed',
    options: ['', 'solid', 'dotted', 'dashed'],
  },
  { name: 'borderRightColor', ...COLOR },
  { name: 'borderBottomColor', ...COLOR },
  { name: 'borderBottomEndRadius', ...NUMBER },
  { name: 'borderBottomLeftRadius', ...NUMBER },
  { name: 'borderBottomRightRadius', ...NUMBER },
  { name: 'borderBottomStartRadius', ...NUMBER },
  { name: 'borderBottomWidth', ...NUMBER },
  { name: 'borderEndColor', ...COLOR },
  { name: 'borderLeftColor', ...COLOR },
  { name: 'borderLeftWidth', ...NUMBER },
  { name: 'borderRightWidth', ...NUMBER },
  { name: 'borderStartColor', ...COLOR },
  { name: 'borderTopColor', ...COLOR },
  { name: 'borderTopEndRadius', ...NUMBER },
  { name: 'borderTopLeftRadius', ...NUMBER },
  { name: 'borderTopRightRadius', ...NUMBER },
  { name: 'borderTopStartRadius', ...NUMBER },
  { name: 'borderTopWidth', ...NUMBER },
];

const IMAGE = [
  {
    name: 'resizeMode',
    type: STRING_TYPE,
    options: ['', 'cover', 'contain', 'stretch', 'repeat', 'center'],
  },
  { name: 'tintColor', ...COLOR },
  { name: 'overlayColor', ...COLOR },
];

const TEXT = [
  { name: COLOR_TYPE, ...COLOR },
  { name: 'fontSize', ...NUMBER },
  { name: 'fontStyle', type: STRING_TYPE, options: ['', 'normal', 'italic'] },
  {
    name: 'fontWeight',
    type: STRING_TYPE,
    options: ['', 'normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  },
  { name: 'lineHeight', ...NUMBER },
  {
    name: 'textAlign',
    type: STRING_TYPE,
    options: ['', 'auto', 'left', 'right', 'center', 'justify'],
  },
  {
    name: 'textDecorationLine',
    type: STRING_TYPE,
    options: ['', 'none', 'underline', 'line-through', 'underline line-through'],
  },
  { name: 'textShadowColor', ...COLOR },
  { name: 'fontFamily', type: STRING_TYPE },
  { name: 'textShadowRadius', ...NUMBER },
  { name: 'includeFontPadding', type: BOOL_TYPE },
  {
    name: 'textAlignVertical',
    type: STRING_TYPE,
    options: ['', 'auto', 'top', 'bottom', 'center'],
  },
  { name: 'letterSpacing', ...NUMBER },
  {
    name: 'textTransform',
    type: STRING_TYPE,
    options: ['', 'none', 'uppercase', 'lowercase', 'capitalize'],
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

const STYLE_PROP_MAP = STYLE_SECTIONS.reduce(
  (map, { props }) =>
    props.reduce((result, prop) => {
      result[prop.name] = prop;

      return result;
    }, map),
  {},
);

let defaultStringQuote = '"';

/*

 ----------------- PARSING OBJECT CODE SECTION

*/

const isQuote = (str, index = 0) => '\'"`'.includes(str.charAt(index));

const isBlockStart = (str, index = 0) => '({['.includes(str.charAt(index));

const isCommentStart = (str, index = 0) =>
  str.charAt(index) === '/' && '/*'.includes(str.charAt(index + 1));

const isSkippable = (str, index = 0) => {
  const char = str.charAt(index);

  return '({[\'"`'.includes(char) || (char === '/' && '/*'.includes(str.charAt(index + 1)));
};

const findObjectStartingBrace = (str, cursorPos) => {
  return str.substr(str, cursorPos + 1).lastIndexOf('{');
};

// ----------------- SKIP QUOTED STRING SECTION

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

const skipQuotedString = (str, startIndex) => {
  const lastIndex = findStringEndQuoteIndex(str, startIndex);

  if (lastIndex < 0) {
    throw new Error(
      `Cannot find end quote "${str.charAt(startIndex)}" for string starting at ${startIndex}`,
    );
  }

  return lastIndex + 1;
};

// ----------------- SKIP COMMENTS SECTION

const SINGLELINE_COMMENT_RGX = /^(\/\/[^\n]*(?=\n))+/g;

const skipSinglelineComment = (str, startIndex) => {
  const [commentStr] = str.substr(startIndex).match(SINGLELINE_COMMENT_RGX) || [];

  if (!commentStr) {
    throw new Error(
      `String identified as a singleline comment at ${startIndex} could not be parsed.`,
    );
  }

  return startIndex + commentStr.length;
};

const MULTILINE_COMMENT_RGX = /^\/\*(?:.|\n)*?\*\//;

const skipMultilineComment = (str, startIndex) => {
  const [commentStr] = str.substr(startIndex).match(MULTILINE_COMMENT_RGX) || [];

  if (!commentStr) {
    throw new Error(
      `String identified as a multiline comment at ${startIndex} could not be parsed.`,
    );
  }

  return startIndex + commentStr.length;
};

const skipComment = (str, startIndex) => {
  switch (str.charAt(startIndex + 1)) {
    case '/':
      return skipSinglelineComment(str, startIndex);
    case '*':
      return skipMultilineComment(str, startIndex);
    default:
      /*
        This is not a comment, so we silently continue
      */
      return startIndex + 1;
  }
};

// ----------------- SKIP BLOCKS SECTION
const getSectionClosingBrace = (char) => {
  switch (char) {
    case '{':
      return '}';
    case '[':
      return ']';
    case '(':
      return ')';
    default:
      return undefined;
  }
};

const CLOSING_BRACE_RGX = {
  '{': /[{}"'`\/]/,
  '[': /[[\]"'`\/]/,
  '(': /[()"'`\/]/,
};

const findBraceBoundaryLastIndex = (str, startIndex) => {
  const endIndex = str.length - 1;
  const openingBrace = str.charAt(startIndex);
  const closingBrace = getSectionClosingBrace(openingBrace);

  if (!closingBrace) {
    throw new Error(`Could not identify section opening "${openingBrace}" at ${startIndex}`);
  }

  const rgx = CLOSING_BRACE_RGX[openingBrace];
  let depth = 1;
  let lastIndex = startIndex + 1;

  do {
    const charIndex = str.substr(lastIndex).search(rgx);

    if (charIndex < 0) {
      throw new Error(
        `Could not find closing brace "${closingBrace}" for a block starting at ${startIndex}`,
      );
    }

    lastIndex += charIndex;
    const char = str.charAt(lastIndex);

    if (isQuote(char)) {
      lastIndex = skipQuotedString(str, lastIndex);
    } else if (isCommentStart(str, lastIndex)) {
      lastIndex = skipComment(str, lastIndex);
    } else {
      switch (char) {
        case openingBrace:
          depth += 1;
          break;
        case closingBrace:
          depth -= 1;
          break;
        default:
          throw new Error(`Unhandled char "${char}" found while skiping block at ${lastIndex}`);
          break;
      }

      if (depth) {
        lastIndex += 1;
      }
    }
  } while (depth > 0 && lastIndex < endIndex);

  return lastIndex;
};

const skipBlock = (str, openIndex) => {
  const lastIndex = findBraceBoundaryLastIndex(str, openIndex);

  return lastIndex + 1;
};

// ----------------- GENERAL SKIP TO

const REGEXPS = {};

/*
  We search for
  "{", "[", "(", "\"", "'", "`" - to skip blocks, strings and comments
  "/" - to detect a start of a comment block, if not followed by "/" or "*", skip it
*/
const getSkipBlockRegExpFor = (chars) => {
  let rgx = REGEXPS[chars];
  if (!rgx) {
    rgx = new RegExp(`[\\{\\[\\("'\`\\/${chars}]`);
    REGEXPS[chars] = rgx;
  }

  return rgx;
};

const skipToSymbol = (str, index, chars) => {
  const endIndex = str.length - 1;
  let lastIndex = index;
  const rgx = getSkipBlockRegExpFor(chars);

  do {
    const searchIndex = str.substr(lastIndex).search(rgx);

    if (searchIndex < 0) {
      throw new Error(`Required symbols "${chars}" cannot be found after index ${lastIndex}.`);
    }

    lastIndex += searchIndex;

    if (isSkippable(str, lastIndex)) {
      if (isQuote(str, lastIndex)) {
        // " ' `
        lastIndex = skipQuotedString(str, lastIndex);
      } else if (isBlockStart(str, lastIndex)) {
        // { ( [
        lastIndex = skipBlock(str, lastIndex);
      } else if (isCommentStart(str, lastIndex)) {
        // // /*
        lastIndex = skipComment(str, lastIndex);
      }

      continue;
    }

    break;
  } while (lastIndex < endIndex);

  return lastIndex;
};

/*
  Label may end with
  : - requires reading value coming after this symbol
  , - label is also a reference to a variable with value
  } - label is a reference and search is completed
*/
const LABEL_END_SEARCH_CHARS = ':,\\}';

const skipToLabelEnd = (str, index) => skipToSymbol(str, index, LABEL_END_SEARCH_CHARS);

/*
  Value may end with
  , - continue to next label
  } - search is completed
*/
const VALUE_END_SEARCH_CHARS = ',\\}';

const skipToValueEnd = (str, index) => skipToSymbol(str, index, VALUE_END_SEARCH_CHARS);

const trimPropertyPreSpaces = (property) => {
  const { value: originalValue, preSpaces } = property;
  const [, pre, value] = originalValue.match(/^(\s*)((?:.|\n)*?)$/);

  return {
    ...property,
    preSpaces: `${preSpaces}${pre}`,
    value,
  };
};

const trimPropertyPreComments = (property) => {
  let { value, preComments } = property;

  while (isCommentStart(value, 0)) {
    const lastIndex = skipComment(value, 0);
    let spacesAfterComments;

    preComments = `${preComments}${value.substring(0, lastIndex)}`;
    [, spacesAfterComments, value] = value.substring(lastIndex).match(/^(\s*)((?:.|\n)*?)$/);
    preComments = `${preComments}${spacesAfterComments}`;
  }

  return {
    ...property,
    value,
    preComments,
  };
};

const trimPropertyPostSpaces = (property) => {
  const { value: originalValue, postSpaces } = property;
  const [, value, post] = originalValue.match(/^((?:.|\n)*?)(\s*)$/);

  return {
    ...property,
    value,
    postSpaces: `${postSpaces}${post}`,
  };
};

const trimPropertyPostComments = (property) => {
  // FIXME implement may be later, anyway it's a bad habit
  return property;
};

const trimSpacesAndComments = (str) => {
  /*
  here property object is being generated by trimming spaces and
  then comments with spaces from the string leaving meaningful value
  trim spaces first
  /^(\s*).*?(\s*)$/
  then trim comments + spaces
*/

  let property = {
    str,
    preSpaces: '',
    preComments: '',
    value: str,
    postComments: '',
    postSpaces: '',
  };

  property = trimPropertyPreSpaces(property);
  property = trimPropertyPreComments(property);
  property = trimPropertyPostComments(property);
  property = trimPropertyPostSpaces(property);

  return property;
};

const parseStyleObject = (str, cursorIndex) => {
  const startIndex = findObjectStartingBrace(str, cursorIndex);
  const endIndex = str.length - 1;
  let properties = [];

  if (startIndex < 0) {
    // invalid
    return null;
  }

  let lastIndex = startIndex + 1;
  let char;

  do {
    nextIndex = skipToLabelEnd(str, lastIndex);
    char = str.charAt(nextIndex);

    const label = trimSpacesAndComments(str.substring(lastIndex, nextIndex));
    const property = { label, value: null };

    properties.push(property);

    if (char === '}') {
      // label without explicit value and end of search

      /* It does not really matter if we remove comments at the end or keep them,
         they will go to big editable field and will be treated as simple text

      if (!label.value) {
        // no label, probably spaces or comments
        properties.pop();
      }
      */

      lastIndex = nextIndex;
      break;
    } else {
      lastIndex = nextIndex + 1;

      if (char === ',') {
        // label without explicit value
        continue;
      }
    }

    nextIndex = skipToValueEnd(str, lastIndex);

    property.value = trimSpacesAndComments(str.substring(lastIndex, nextIndex));

    if (char === '}') {
      // label without explicit value and end of search
      lastIndex = nextIndex;
      break;
    } else {
      lastIndex = nextIndex + 1;
    }

    /* after retrieving label or value, cut comments from start and end
    {
      // pre label
      display /* post label * / : /* pre value * / "flex" // post value
      ,
    }
    resulting property object should be something like
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
  } while (char !== '}' && lastIndex < endIndex);

  return {
    startIndex,
    properties,
    endIndex: lastIndex,
  };
};

/*

  ---------------------------- GENERATING OBJECT STRING SECTION

*/

const stringQuoteWrap = (str) => `${defaultStringQuote}${str}${defaultStringQuote}`;

const stringifyValue = (name, value) => {
  const { type } = STYLE_PROP_MAP[name];

  switch (type) {
    case NUMBER_TYPE:
    case COLOR_TYPE:
      return NUMBER_RGX.test(value) ? value : stringQuoteWrap(value);
    case BOOL_TYPE:
      return value;
    case STRING_TYPE:
    default:
      return stringQuoteWrap(value);
  }
};

const combileStyleObjectPart = ({ str, preSpaces, preComments, value, postComments, postSpaces }) =>
  `${preSpaces}${preComments}${value}${postSpaces}${postComments}`;

const combileStyleObject = (properties) =>
  properties.reduce((str, { label, value }) => {
    let result = `${str}${combileStyleObjectPart(label)}`;

    if (value) {
      result = `${result}:${combileStyleObjectPart(value)},`;
    } else if (label.value) {
      result = `${result},`;
    }

    return result;
  }, '');

/*
  Here is the final step of te tool session, so we don't care about keeping data unchanged, 
  it will be gone anyway and you can't save it. Don't even try, it's a dead weight, move on.
*/
const buildPropertiesString = (styles, list) => {
  const values = { ...styles };
  let etalon;
  let str = combileStyleObject(
    list
      .filter((item) => {
        const {
          label: { value: name },
        } = item;
        const prop = values[name];

        if (isStyleProp(name)) {
          etalon = item;
          return !prop || !prop.enabled || !!prop.value;
        }

        return true;
      })
      .map((item) => {
        const {
          label: { value: name },
          value,
        } = item;
        const prop = values[name];

        // we delete nothing or prop, we don't know and don't need to
        delete values[name];

        if (!isStyleProp(name) || !prop || !prop.changed || !prop.enabled) {
          return item;
        }

        return {
          ...item,
          value: {
            ...value,
            value: stringifyValue(name, prop.value),
          },
        };
      }),
  );

  if (!etalon) {
    etalon = {
      label: { preSpaces: ' ', postSpaces: '' },
      value: { preSpaces: ' ', postSpaces: '' },
    };
  } else if (!etalon.value) {
    // because value can be null
    etalon.value = { preSpaces: ' ', postSpaces: '' };
  }

  console.log(list, etalon);

  return Object.keys(values).reduce((result, name) => {
    const {
      label: { preSpaces: preLabel, postSpaces: postLabel },
      value: { preSpaces: preValue, postSpaces: postValue },
    } = etalon;
    const value = stringifyValue(name, values[name].value);

    return `${result}${preLabel}${name}${postLabel}:${preValue}${value}${postValue},`;
  }, str);
};

/*

  ---------------------------- UI MODAL RENDERING SECTION

*/

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
  const hasError = matcher && value !== '' && value !== undefined ? !matcher.test(value) : false;

  return hasError ? [style, styles.error] : style;
};

const ShowEnabled = ({ value, enabled, children }) => {
  if (enabled) {
    return children;
  }

  return <DisabledText>{value}</DisabledText>;
};

const StyleStringValue = ({ value, enabled, prop: { name, matcher }, onChange }) => (
  <ShowEnabled value={value} enabled={enabled}>
    <TextInput
      value={value}
      placeholder="String"
      placeholderTextColor={TEXT_DISABLED_COLOR}
      onChangeText={(newValue) => onChange(name, newValue)}
      style={getStyle(value, matcher, styles.input)}
    />
  </ShowEnabled>
);

// using keyboardType="decimal-pad" we cannot specify percents
const StyleNumberValue = ({ value, enabled, prop: { name, matcher }, onChange }) => (
  <ShowEnabled value={value} enabled={enabled}>
    <TextInput
      value={value}
      placeholder="Number"
      placeholderTextColor={TEXT_DISABLED_COLOR}
      onChangeText={(newValue) => onChange(name, newValue)}
      style={getStyle(value, matcher, styles.number)}
    />
  </ShowEnabled>
);

const StyleEnumValue = ({ value, enabled, prop: { name, matcher, options }, onChange }) => {
  const items = useMemo(() => options.map((value) => ({ label: value, value })), []);
  const selectedItem = items.find((item) => item.value === value);

  if (value && !selectedItem) {
    return (
      <ShowEnabled value={value} enabled={enabled}>
        <TextInput
          value={value}
          onChangeText={(newValue) => onChange(name, newValue)}
          style={getStyle(value, matcher, styles.input)}
        />
      </ShowEnabled>
    );
  }

  return (
    <ShowEnabled value={value} enabled={enabled}>
      <DropDown
        items={items}
        selectedItem={selectedItem}
        onChange={({ value }) => onChange(name, value)}
        style={styles.input}
      />
    </ShowEnabled>
  );
};

const StyleBoolValue = ({ value, enabled, prop: { name }, onChange }) => (
  <ShowEnabled value={value} enabled={enabled}>
    <CheckBoxButton selected={value} onPress={() => onChange(name, !value)} />
  </ShowEnabled>
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
            initialColor: currentValue ? parseInt(currentValue, 16) : 0x000000ff,
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

const StyleColorValue = ({ value, enabled, prop: { name, matcher }, onChange }) => {
  return (
    <ShowEnabled value={value} enabled={enabled}>
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
    </ShowEnabled>
  );
};

const renderPropValue = (value, enabled, prop, onChange) => {
  const { type, options } = prop;

  let ValueComponent;

  if (options && options.length) {
    ValueComponent = StyleEnumValue;
  } else {
    switch (type) {
      case NUMBER_TYPE:
        ValueComponent = StyleNumberValue;
        break;
      case COLOR_TYPE:
        ValueComponent = StyleColorValue;
        break;
      case BOOL_TYPE:
        ValueComponent = StyleBoolValue;
        break;
      case STRING_TYPE:
      default:
        ValueComponent = StyleStringValue;
        break;
    }
  }

  return <ValueComponent value={value} enabled={enabled} prop={prop} onChange={onChange} />;
};

const StylePropRow = memo(
  ({ value, enabled, prop, onChange }) => {
    const { name } = prop;

    return (
      <SBGroup>
        <ActiveText>{name}</ActiveText>
        {renderPropValue(value, enabled, prop, onChange)}
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
        const data = values[name];

        if (!data) {
          return false;
        }

        const { value } = data;

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

    const { values = {} } = props;

    this.state = {
      sections: STYLE_SECTIONS.map((section) => ({
        ...section,
        expanded: false,
        undefinedVisible: true,
        data: [],
      })),
      sectionsEnabled: true,
      list: [],
      values,
    };
  }

  handleChange = (name, value) =>
    this.setState(({ values }) => {
      const { [name]: prevData = { enabled: true } } = values;

      return {
        values: {
          ...values,
          [name]: {
            ...prevData,
            changed: true,
            value,
          },
        },
      };
    });

  handleUpdate = () => {
    const { onSubmit } = this.props;

    onSubmit(onSubmit(this.state.values));
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
        {expanded ? (
          <CheckBoxButton
            selected={undefinedVisible}
            onPress={() => this.toggleUndefinedVisible(section)}
          />
        ) : null}
      </SectionButton>
    );
  };

  renderItem = ({ item, index, section }) => {
    let enabled = true;
    let value;
    const { name } = item;
    const {
      values: { [name]: data },
    } = this.state;

    if (data) {
      ({ value, enabled } = data);
    }

    return (
      <StylePropRow
        key={name}
        prop={item}
        value={value}
        enabled={enabled}
        onChange={this.handleChange}
      />
    );
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

export const { renderer: styleComposerToolScreenRenderer } = StyleComposerToolModal;

const isStyleProp = (prop) => {
  const { [prop]: obj } = STYLE_PROP_MAP;

  return Boolean(obj && obj.type);
};

const isQuotedString = (str) => {
  const start = str.charAt();

  return isQuote(start) && start === str.charAt(str.length - 1);
};

const getValidStyleProps = ({ properties }) =>
  properties.reduce((result, { label, value }) => {
    if (!isStyleProp(label.value)) {
      return result;
    }

    let styleValue = value ? value.value : label.value;
    let enabled = !!value;

    if (isQuotedString(styleValue)) {
      defaultStringQuote = styleValue.charAt();
      styleValue = styleValue.substring(1, styleValue.length - 1);
    }

    return {
      ...result,
      [label.value]: {
        value: styleValue,
        changed: false,
        enabled,
      },
    };
  }, {});

const loadStyleObjectProps = async (editorApi) => {
  const content = await editorApi.getValue();
  const { index: position } = (await editorApi.getCursor()) || {};

  const object = parseStyleObject(content, position);
  const styles = getValidStyleProps(object);

  return {
    ...object,
    styles,
    position,
    content,
  };
};

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
        content,
        position,
        startIndex,
        endIndex,
        properties,
        styles,
      } = await loadStyleObjectProps(editorApi);

      showModal({
        renderer: styleComposerToolScreenRenderer,
        props: {
          values: styles,
          onSubmit: async (newStyles) => {
            const stylesString = buildPropertiesString(newStyles, properties);
            const code = `${content.substring(0, startIndex)}${stylesString}${content.substring(
              endIndex,
            )}`;

            editorApi.setValue(code);
            await editorApi.setCursor(position);
          },
        },
      });
    } catch (error) {
      showAlert(error.message, 'Error');
    }
  },
};

export default tool;
