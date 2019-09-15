import React, { Component, memo, useMemo, useState } from 'react';
import PropTypes, { TYPES } from 'prop-types';
import { View, ViewPropTypes, StyleSheet, ScrollView, TouchableHighlight } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import TransparentIconButton from 'source/components/TransparentIconButton';

import {
  ModalScreen,
  VGroup,
  HGroup,
  SBGroup,
  Section,
  TextInput,
  TextArea,
  LinkButton,
  TextButton,
  CheckBoxButton,
  SmallHeader,
  SlimHeader,
  DropDown,
  TEXT_ACTIVE_COLOR,
  TEXT_DISABLED_COLOR,
  DARK_BORDER_COLOR,
  withHostedModal,
  Text,
  Small,
  ActiveText,
} from '@actualwave/react-native-kingnare-style';

/* ------ Custom PropTypes for intrinsic components, you can define yours here too */

const customPropTypes = new Map();

customPropTypes.set(View, ViewPropTypes);

/* ------ Find and parse Component JSX tag closes to current cursor position */

// React Native cannot have tag names with dashes
const TAG_NAME_RGX = /^<([a-z\d.$_]+)(?=\s+|>|\/>)/i;
const PARAM_START_RGX = /^\s*(([a-z\d._]+)(?:\s*=\s*("|'|`|{)|(?=[\s{/>]))|{|\/\/|\/\*|>|\/>)/i;
const COMPUTABLE_VALUE_IDENTIFIER = '{';
const COMMENT_IDENTIFIER = '/';
const SINGLELINE_COMMENT_IDENTIFIER = '//';
const MULTILINE_COMMENT_IDENTIFIER = '/*';
let defaultJSXStringQuote = '"';

const findJSXStringEndQuote = (str, quote, startQuotePos = 0) =>
  str.indexOf(quote, startQuotePos + 1);

const STR_ENTITIES_DECODE = [[/&quot;/g, '"'], [/&apos;/g, "'"]];

const decodeHTMLEntities = (str) => {
  STR_ENTITIES_DECODE.forEach(([rgx, repl]) => {
    str = str.replace(rgx, repl);
  });

  return str;
};

const STR_ENTITIES_ENCODE = [[/"/g, '&quot;'], [/'/g, '&apos;']];

const encodeHTMLEntities = (str) => {
  STR_ENTITIES_ENCODE.forEach(([rgx, repl]) => {
    str = str.replace(rgx, repl);
  });

  return str;
};

const findEvaluatedValueClosingBrace = (str, openBracePos = 0) => {
  let opensCount = 1;
  let lastIndex = openBracePos;

  while (lastIndex >= 0 && opensCount > 0) {
    const openIndex = str.indexOf(COMPUTABLE_VALUE_IDENTIFIER, lastIndex + 1);
    const closeIndex = str.indexOf('}', lastIndex + 1);

    if (closeIndex < 0) {
      /*
       * This means we still have open braces but they will never be closed, so
       * we will never be able to find end of this block.
       */
      return -1;
    } else if (openIndex > 0 && openIndex < closeIndex) {
      opensCount++;
      lastIndex = openIndex;
    } else {
      opensCount--;
      lastIndex = closeIndex;
    }
  }

  return lastIndex;
};

const findTagStartFromIndex = (str, index) => {
  let lastIndex = str.lastIndexOf('<', index);

  while (lastIndex > 0) {
    if (TAG_NAME_RGX.test(str.substr(lastIndex))) {
      break;
    }

    lastIndex = str.lastIndexOf('<', lastIndex - 1);
  }

  return lastIndex;
};

const getTagStart = (str, index) => {
  const tagIndex = findTagStartFromIndex(str, index);

  if (tagIndex < 0) {
    throw new Error('Opening tag could not be found.');
  }

  const [substr, name] = str.substr(tagIndex).match(TAG_NAME_RGX) || [];

  if (!substr) {
    throw new Error('Could not retrieve tag name.');
  }

  return { name, startIndex: tagIndex, endIndex: tagIndex + substr.length };
};

const findNextPropEntry = (str) => {
  const match = str.match(PARAM_START_RGX);

  if (!match) {
    throw new Error('Could not parse props for a tag.');
  }

  return match;
};

const SINGLELINE_COMMENT_RGX = /^(\s*\/\/[^\n]*(?=\n))+/g;

const findSinglelineCommentLastIndex = (str) => {
  const [commentStr] = str.match(SINGLELINE_COMMENT_RGX) || [];

  if (!commentStr) {
    throw new Error('String identified as a multiline comment could not be parsed.');
  }

  return commentStr.length - 1;
};

const MULTILINE_COMMENT_RGX = /^\s*\/\*(?:.|\n)*?\*\//;

const findMultilineCommentLastIndex = (str) => {
  const [commentStr] = str.match(MULTILINE_COMMENT_RGX) || [];

  if (!commentStr) {
    throw new Error('String identified as a multiline comment could not be parsed.');
  }

  return commentStr.length - 1;
};

const retrievePropFromString = (str) => {
  const matchers = findNextPropEntry(str);
  const [matchStr, info, name] = matchers;
  let [, , , valueIdentifier] = matchers;

  if (info === '>' || info === '/>') {
    return null;
  }

  const preSpaces = matchStr.match(/\s*/)[0];
  const valueIndex = matchStr.length - 1;
  let valueLastIndex;
  let value = '';

  if (info === COMPUTABLE_VALUE_IDENTIFIER) {
    // rest props, { ...props }
    valueIdentifier = info;
    valueLastIndex = findEvaluatedValueClosingBrace(str, valueIndex);
    value = str.substring(valueIndex + 1, valueLastIndex).trim();
  } else if (info === SINGLELINE_COMMENT_IDENTIFIER) {
    valueIdentifier = info;
    valueLastIndex = findSinglelineCommentLastIndex(str);
    value = str.substring(valueIndex + 2, valueLastIndex + 1);
  } else if (info === MULTILINE_COMMENT_IDENTIFIER) {
    valueIdentifier = info;
    valueLastIndex = findMultilineCommentLastIndex(str);
    value = str.substring(valueIndex + 2, valueLastIndex - 1);
  } else if (name) {
    // named prop
    if (valueIdentifier === COMPUTABLE_VALUE_IDENTIFIER) {
      // prop={***}
      valueLastIndex = findEvaluatedValueClosingBrace(str, valueIndex);
      value = str.substring(valueIndex + 1, valueLastIndex).trim();
    } else if (valueIdentifier === undefined) {
      value = 'true';
      valueLastIndex = valueIndex;
    } else {
      // prop="***"
      valueLastIndex = findJSXStringEndQuote(str, valueIdentifier, valueIndex);
      value = decodeHTMLEntities(str.substring(valueIndex + 1, valueLastIndex));
      /*
        didn't find better place to do this -- get default quote type for JSX to
        apply when adding proerties.
      */
      defaultJSXStringQuote = valueIdentifier;
    }

    if (valueLastIndex < valueIndex) {
      throw new Error(`Could not read value of "${name}" property.`);
    }
  } else {
    // something unknown
    throw new Error(`Unknown property expression found "${matchStr}".`);
  }

  return {
    prop: {
      str: str.substring(0, valueLastIndex + 1),
      preSpaces,
      name,
      valueIdentifier,
      value,
    },
    index: valueLastIndex,
  };
};

const getPropsSequence = (str, index) => {
  const length = str.length;
  const props = [];
  let lastIndex = index;
  let propsStr = str.substr(lastIndex);

  while (lastIndex > 0 && lastIndex < length) {
    const value = retrievePropFromString(propsStr);

    if (!value) break;

    const { prop, index: lastPropIndex } = value;

    props.push(prop);

    lastIndex += lastPropIndex + 1;
    propsStr = str.substr(lastIndex);
  }

  return { props, startIndex: index, endIndex: lastIndex };
};

const parseTagByIndex = (str, lookupIndex) => {
  const { name, startIndex, endIndex: propsStartIndex } = getTagStart(str, lookupIndex);

  const { props, endIndex } = getPropsSequence(str, propsStartIndex);

  return { name, props, startIndex, propsStartIndex, endIndex };
};

/* ------ Find and parse Component import */
const getNameImportFromCode = (code, component) => {
  const rgx = new RegExp(
    /* Using [^\0]* instead of .* because I need all caracters including newline */
    `[^\\0]*(import\\s([^\\0]*?)((\\*)\\s+as\\s+|(?<=[{,]+)\\s*([\\w$]+)\\s+as\\s+)?\\s*(${component}(?=[^\\w$]))[^\\0]*?\\sfrom\\s+(\`|"|')([^'"\`]+)\\7)`,
  );
  /*
   * 0 -- Everything regexp captured, I put "greedy everyting" first to be sure next group don't capture multiple imports
   * 1 -- Whole import string
   * 2 -- Text between import keyword and component name
   * 3 -- If component import uses alias, assigning it will be here
   * 4 -- Asterisk symbol for global alias import, import * as Something from 'something'
   * 5 -- Original name of the component when alias used, import { Nothing as Something } from 'nothing'
   * 6 -- Component name
   * 7 -- Quote type used to wrap package name
   * 8 -- Package name or file path
   */
  const [
    ,
    importString,
    preNameString,
    ,
    originalNameOuter,
    originalNameInner,
    ,
    quoteType,
    packagePath,
  ] = code.match(rgx) || [];

  if (!importString) {
    return null;
  }

  return {
    importString,
    preNameString,
    importName: component,
    originalName: originalNameOuter || originalNameInner || component,
    quoteType,
    packagePath,
  };
};

/* ------ Cerate temporary module to evaluate and retrieve Component class/function */
const generateModuleCode = (importString, exportString) => `${importString};

export default ${exportString};`;

const makeComponentImportModule = (code, component) => {
  const importName = component.includes('.') ? component.split('.').shift() : component;

  const info = getNameImportFromCode(code, importName);

  if (!info) {
    return '';
  }

  const { preNameString, originalName, packagePath } = info;
  let importString = importName;

  if (originalName && originalName !== importName) {
    importString = `${originalName} as ${importString}`;
  }

  if (preNameString.includes('{') && !preNameString.includes('}')) {
    importString = `{ ${importString} }`;
  }

  return generateModuleCode(`import ${importString} from "${packagePath}"`, component);
};

const propTypesToList = (meta) =>
  Object.keys(meta)
    .filter((name) => !!meta[name])
    .map((name) => {
      const augmented = { name, ...meta[name] };
      meta[name] = augmented;

      return augmented;
    })
    .sort(({ name: a }, { name: b }) => (a < b ? -1 : 1));

/*
      {
        str: str.substring(0, valueLastIndex + 1),
        preSpaces,
        name,
        valueIdentifier,
        value,
      }
*/

const IS_NUMBER_RGX = /^(?:\+|-)?(?:\d+(?:\.\d+)?|0x[\da-f]+)$/i;
const IS_FUNCTION_RGX = /^(?:\(.*?\)\s*=>|function\s*\()/;

const isStringNumber = (value) => IS_NUMBER_RGX.test(value);

const isStringFunction = (value) => IS_FUNCTION_RGX.test(value);

const generatePropType = ({ name, value: rawValue, valueIdentifier }) => {
  let type = TYPES.any;
  const value = rawValue.trim();

  if ('\'"`'.includes(valueIdentifier)) {
    type = TYPES.string;
  } else if (value.charAt() === '{') {
    type = TYPES.object;
  } else if (value.charAt() === '[') {
    type = TYPES.array;
  } else if (isStringNumber(value)) {
    type = TYPES.number;
  } else if (isStringFunction(value)) {
    type = TYPES.func;
  } else if (value === 'true' || value === 'false') {
    type = TYPES.bool;
  }

  return { name, type, required: false, primitive: false };
};

const assignTypesToProps = ({ props }, specs) =>
  Object.keys(props).forEach((key) => {
    const prop = props[key];
    const { name } = prop;
    let spec;

    if (name) {
      spec = specs[name] || generatePropType(prop);
    } else {
      spec = {};
    }

    prop.type = spec;
  });

/* ------ Do everything at once:
  1. Parse JSX tag
  2. Find component import
  3. Generate temporary module code
  4. Evaluate temporary module
*/
const loadTargetComponent = async (editorApi, editorFile, codevalApi) => {
  const content = await editorApi.getValue();
  const { index: position } = (await editorApi.getCursor()) || {};
  let message = '';
  let target;
  let propTypes;
  let propTypesList;
  let TargetComponent;
  let targetPropTypes;
  let targetDefaults;

  try {
    target = parseTagByIndex(content, position);
  } catch (error) {
    console.error(error);
    throw new Error('Could not parse JSX code to retrieve component information.');
  }

  const moduleCode = makeComponentImportModule(content, target.name);

  if (moduleCode) {
    try {
      // we need an editor file to locate local imports
      ({ default: TargetComponent } = await codevalApi.evaluate(moduleCode, {}, editorFile));
      propTypes = PropTypes.gatherMetaFromPropTypesMap(
        TargetComponent.propTypes || customPropTypes.get(TargetComponent) || {},
        false,
      );

      propTypesList = propTypesToList(propTypes);

      assignTypesToProps(target, propTypes);

      defaultProps = TargetComponent.defaultProps || {};
    } catch (error) {
      console.error(error);
      message = `Could not load module with "${target.name}" component.`;
    }
  } else {
    message = `Could not find "${target.name}" import to retrieve PropTypes definitions.`;
  }

  return {
    content,
    position,
    target,
    message,
    propTypes,
    propTypesList,
    defaultProps,
    TargetComponent,
  };
};

const styles = StyleSheet.create({
  requiredText: {
    color: 0x993333ff,
  },
  typeText: {
    color: TEXT_DISABLED_COLOR,
  },
  fullFlex: { flex: 1 },
});

const getClosingSymbol = (openSymbol) => {
  switch (openSymbol) {
    case COMPUTABLE_VALUE_IDENTIFIER:
      return '}';
    case SINGLELINE_COMMENT_IDENTIFIER:
      return '';
    case MULTILINE_COMMENT_IDENTIFIER:
      return '*/';
    default:
      return openSymbol;
  }
};

const PropRequired = ({ required }) =>
  required ? <Text style={styles.requiredText}>*</Text> : null;

const renderPropType = ({ type, value, required } = {}) => {
  const { TYPES } = PropTypes;

  switch (type) {
    case TYPES.arrayOf:
      return `${renderPropType(value)}[ ]`;
    case TYPES.oneOf:
      return `enum(${value.length})`;
    case TYPES.oneOfType:
      return value.map(renderPropType).join('|');
    case TYPES.instanceOf:
      return `instanceOf(${value.displayName || value.name || ''})`;
    case TYPES.objectOf:
      return `${renderPropType(value)}{ }`;
    case TYPES.shape:
      return TYPES.object;
    default:
      return type;
  }
};

const PropType = ({ spec }) => {
  const { type, required } = spec;

  if (!type) {
    return null;
  }

  return (
    <Small style={styles.typeText}>
      {renderPropType(spec)}
      <PropRequired required={required} />
    </Small>
  );
};

const PropName = ({ name, type }) => {
  if (!name) {
    return <ActiveText style={styles.fullFlex}> ... </ActiveText>;
  }

  return (
    <ActiveText style={styles.fullFlex}>
      {name} {type ? <PropType spec={type} /> : null}
    </ActiveText>
  );
};
PropName.displayName = 'PropName';

const ValueContainer = ({ valueIdentifier, index, onChange, children }) => (
  <HGroup noPaddings>
    {onChange ? (
      <TextButton
        labelStyle={{
          paddingLeft: 20,
          paddingRight: 2,
        }}
        style={{
          marginHorizontal: 4,
        }}
        label={valueIdentifier}
        onPress={() =>
          onChange(index, {
            valueIdentifier:
              valueIdentifier === COMPUTABLE_VALUE_IDENTIFIER
                ? defaultJSXStringQuote
                : COMPUTABLE_VALUE_IDENTIFIER,
          })
        }
      />
    ) : (
      <Text
        style={{
          paddingLeft: 30,
        }}
      >
        {valueIdentifier}
      </Text>
    )}
    {children}
    <Text style={{ marginHorizontal: 4 }}>{getClosingSymbol(valueIdentifier)}</Text>
  </HGroup>
);
ValueContainer.displayName = 'ValueContainer';

const ExpandableValue = ({ index, valueIdentifier, value, onChange }) => {
  const [expanded, setExpanded] = useState(false);

  return expanded ? (
    <VGroup style={{ alignItems: 'flex-end' }}>
      <TextArea
        value={value}
        onChangeText={(newValue) => onChange(index, { value: newValue })}
        style={{ alignSelf: 'stretch', height: 200 }}
      />
      <LinkButton
        label="Collapse"
        labelStyle={{
          fontSize: 12,
        }}
        onPress={() => setExpanded(false)}
      />
    </VGroup>
  ) : (
    <ValueContainer valueIdentifier={valueIdentifier}>
      <TouchableHighlight onPress={() => setExpanded(true)} style={styles.fullFlex}>
        <Small numberOfLines={1} ellipsizeMode="tail">
          {value}
        </Small>
      </TouchableHighlight>
    </ValueContainer>
  );
};
ExpandableValue.displayName = 'ExpandableValue';

const renderMoveUpButton = (onPress, hidden) => {
  if (hidden) {
    return null;
  }

  return (
    <TransparentIconButton
      iconClass={AntDesign}
      icon="caretup"
      color={TEXT_DISABLED_COLOR}
      onPress={onPress}
    />
  );
};

const renderMoveDownButton = (onPress, hidden) => {
  if (hidden) {
    return <View style={{ width: 30 }} />;
  }

  return (
    <TransparentIconButton
      iconClass={AntDesign}
      icon="caretdown"
      color={TEXT_DISABLED_COLOR}
      onPress={onPress}
    />
  );
};

const memoPropRow = (PropRowComponent) =>
  memo(
    PropRowComponent,
    ({ prop: pa, index: ia, first: fa, last: la }, { prop: pb, index: ib, first: fb, last: lb }) =>
      pa === pb && ia === ib && fa === fb && la === lb,
  );

const PropRow = ({
  prop,
  index,
  first,
  last,
  buttons,
  children,
  onMoveUp,
  onMoveDown,
  onRemove,
}) => {
  const { name, type } = prop;

  return (
    <View
      style={{
        alignSelf: 'stretch',
        alignItems: 'stretch',
        borderBottomWidth: 1,
        borderBottomColor: DARK_BORDER_COLOR,
        marginBottom: 20,
      }}
    >
      <HGroup noPaddings>
        <PropName name={name} type={type} />
        {buttons}
        {renderMoveUpButton(() => onMoveUp(index), first)}
        {renderMoveDownButton(() => onMoveDown(index), last)}
        <TransparentIconButton
          iconClass={FontAwesome}
          icon="trash-o"
          color={TEXT_DISABLED_COLOR}
          onPress={() => onRemove(index)}
          style={{ alignSelf: 'flex-end' }}
        />
      </HGroup>
      {children}
    </View>
  );
};
PropRow.displayName = 'PropRow';

const NonPropRow = memoPropRow((props) => {
  const {
    prop: { value, valueIdentifier },
    onChange,
    index,
  } = props;

  const [expanded, setExpanded] = useState(false);

  return (
    <PropRow {...props}>
      <ExpandableValue
        index={index}
        value={value}
        onChange={onChange}
        valueIdentifier={valueIdentifier}
      />
    </PropRow>
  );
});
NonPropRow.displayName = 'NonPropRow';

const StringPropRow = memoPropRow((props) => {
  const {
    prop: { value, valueIdentifier },
    index,
    onChange,
  } = props;

  return (
    <PropRow {...props}>
      <ValueContainer index={index} onChange={onChange} valueIdentifier={valueIdentifier}>
        <TextInput
          value={value}
          style={styles.fullFlex}
          onChangeText={(newValue) => onChange(index, { value: newValue })}
        />
      </ValueContainer>
    </PropRow>
  );
});
StringPropRow.displayName = 'StringPropRow';

const NumberPropRow = memoPropRow((props) => {
  const {
    prop: { value, valueIdentifier },
    index,
    onChange,
  } = props;

  return (
    <PropRow {...props}>
      <ValueContainer valueIdentifier={valueIdentifier}>
        <TextInput
          value={value}
          style={styles.fullFlex}
          onChangeText={(newValue) => onChange(index, { value: newValue })}
          keyboardType="number-pad"
        />
      </ValueContainer>
    </PropRow>
  );
});
NumberPropRow.displayName = 'NumberPropRow';

const BoolPropRow = memoPropRow((props) => {
  const {
    prop: { value, valueIdentifier },
    index,
    onChange,
  } = props;

  return (
    <PropRow
      {...props}
      buttons={
        <CheckBoxButton
          selected={value === 'true'}
          onPress={() => onChange(index, { value: String(!(value === 'true')) })}
          style={{ alignSelf: 'flex-end' }}
        />
      }
    ></PropRow>
  );
});
BoolPropRow.displayName = 'BoolPropRow';

const FuncPropRow = memoPropRow((props) => {
  const {
    prop: { value, valueIdentifier },
    index,
    onChange,
  } = props;

  // Func and Shape transform into a TextArea which allow editing of contents
  return (
    <PropRow {...props}>
      <ExpandableValue
        index={index}
        value={value}
        onChange={onChange}
        valueIdentifier={valueIdentifier}
      />
    </PropRow>
  );
});
FuncPropRow.displayName = 'FuncPropRow';

const EnumPropRow = memoPropRow((props) => {
  const {
    prop: { name, value, type, valueIdentifier },
    onChange,
    index,
  } = props;

  const items = useMemo(() => type.value.map((value) => ({ label: value, value })), []);
  const selectedItem = items.find((item) => item.value === value);

  return (
    <PropRow {...props}>
      <ValueContainer index={index} onChange={onChange} valueIdentifier={valueIdentifier}>
        {valueIdentifier === COMPUTABLE_VALUE_IDENTIFIER ? (
          <TextInput
            value={value}
            style={styles.fullFlex}
            onChangeText={(newValue) => onChange(index, { value: newValue })}
          />
        ) : (
          <DropDown
            items={items}
            selectedItem={selectedItem}
            onChange={({ value }) => onChange(index, { value })}
            style={styles.fullFlex}
          />
        )}
      </ValueContainer>
    </PropRow>
  );
});
EnumPropRow.displayName = 'EnumPropRow';

const MultiEnumPropRow = memoPropRow((props) => {
  const {
    prop: { value, valueIdentifier },
    index,
    onChange,
  } = props;

  /*TODO
   * This may take an effort to build, it may be
   * arrayOf(oneOf([...]))
   * or
   * arrayOf(string), arrayOf(number), arrayOf(shape)
   * have to treat it properly or leave as it's now
   */
  return (
    <PropRow {...props}>
      <ExpandableValue
        index={index}
        value={value}
        onChange={onChange}
        valueIdentifier={valueIdentifier}
      />
    </PropRow>
  );
});

const ShapePropRow = memoPropRow((props) => {
  const {
    prop: { value, valueIdentifier },
    index,
    onChange,
  } = props;

  return (
    <PropRow {...props}>
      <ExpandableValue
        index={index}
        value={value}
        onChange={onChange}
        valueIdentifier={valueIdentifier}
      />
    </PropRow>
  );
});
ShapePropRow.displayName = 'ShapePropRow';

const getPropRowRenderer = (lastIndex, handlers) => (prop, index) => {
  const { name, type: { type } = {} } = prop;
  const first = index === 0;
  const last = index === lastIndex;
  const key = name || `prop-${index}`;

  let Row;

  switch (type) {
    case TYPES.any:
    case TYPES.string:
      Row = StringPropRow;
      break;
    case TYPES.number:
      Row = NumberPropRow;
      break;
    case TYPES.bool:
      Row = BoolPropRow;
      break;
    case TYPES.func:
      Row = FuncPropRow;
      break;
    case TYPES.object:
    case TYPES.shape:
      Row = ShapePropRow;
      break;
    case TYPES.arrayOf:
      Row = MultiEnumPropRow;
      break;
    case TYPES.oneOf:
      Row = EnumPropRow;
      break;
    default:
      Row = NonPropRow;
      break;
  }

  return <Row key={key} prop={prop} {...handlers} index={index} first={first} last={last} />;
};

class PropsList extends Component {
  constructor(props) {
    super(props);

    this.handlers = {
      onChange: this.handleChange,
      onMoveUp: this.handleMoveUp,
      onMoveDown: this.handleMoveDown,
      onRemove: this.handleRemove,
    };
  }

  handleChange = (index, patch) => {
    const { items, onChange } = this.props;
    const newItems = [...items];

    newItems[index] = { ...items[index], ...patch, changed: true };
    onChange(newItems);
  };

  handleMoveUp = (index) => {
    const { items, onChange } = this.props;
    const prop = items[index];
    const newItems = [...items];

    newItems.splice(index, 1);
    newItems.splice(index - 1, 0, prop);
    onChange(newItems);
  };

  handleMoveDown = (index) => {
    const { items, onChange } = this.props;
    const prop = items[index];
    const newItems = [...items];

    newItems.splice(index, 1);
    newItems.splice(index + 1, 0, prop);
    onChange(newItems);
  };

  handleRemove = (index) => {
    const { items, onChange } = this.props;
    const newItems = [...items];

    newItems.splice(index, 1);
    onChange(newItems);
  };

  render() {
    const { items } = this.props;

    return (
      <>
        <SlimHeader>Component Properties</SlimHeader>
        {items.map(getPropRowRenderer(items.length - 1, this.handlers))}
        {items.length ? null : (
          <Small style={{ margin: 10, textAlign: 'center' }}>
            Component does not have any props defined. Add one from Available PropTypes or a Custom
            Property.
          </Small>
        )}
      </>
    );
  }
}

const DEFAULT_PROPERTY_TYPE = { label: 'Any', value: TYPES.any };

const PROPERTY_TYPES = [
  DEFAULT_PROPERTY_TYPE,
  { label: 'String', value: TYPES.string },
  { label: 'Number', value: TYPES.number },
  { label: 'Boolean', value: TYPES.bool },
  { label: 'Function', value: TYPES.func },
  { label: 'Object', value: TYPES.object },
];

const AddCustomProperty = memo(
  ({ onAddProperty }) => {
    const [name, setName] = useState(null);
    const [typeItem, setTypeItem] = useState(DEFAULT_PROPERTY_TYPE);
    return (
      <>
        <SlimHeader spaceAbove>Add Custom Property</SlimHeader>
        <HGroup style={{ marginBottom: 20 }}>
          <TextInput
            value={name}
            placeholder="Property Name"
            onChangeText={setName}
            style={{ flex: 1 }}
          />
          <DropDown
            items={PROPERTY_TYPES}
            selectedItem={typeItem}
            onChange={setTypeItem}
            style={{ width: 150 }}
          />
          <TextButton
            label=" Add "
            onPress={() => {
              const { value: type } = typeItem;
              onAddProperty(name, { name, type, required: false, promitive: true });
              setName('');
            }}
          />
        </HGroup>
      </>
    );
  },
  () => true,
);
AddCustomProperty.displayName = 'AddCustomProperty';

const PropTypeRow = memo(
  ({ name, value, onAddProperty }) => (
    <HGroup>
      <TransparentIconButton
        iconClass={AntDesign}
        icon="plus"
        onPress={() => onAddProperty(name, value)}
      />
      <PropName name={name} type={value} />
    </HGroup>
  ),
  ({ name: a }, { name: b }) => a === b,
);
PropTypeRow.displayName = 'PropTypeRow';

const PropTypesList = ({ props, propTypes, onAddProperty }) => {
  const list = useMemo(() => {
    const names = props.reduce((res, { name }) => {
      res[name] = true;
      return res;
    }, {});
    return propTypes.filter(({ name }) => !names[name]);
  }, [props.length]);

  return (
    <Section label="Available Prop Types">
      {list.map((spec) => (
        <PropTypeRow key={spec.name} name={spec.name} value={spec} onAddProperty={onAddProperty} />
      ))}
    </Section>
  );
};
PropTypesList.displayName = 'PropTypesList';

const getEmptyValueForPropType = ({ type }) => {
  switch (type) {
    case TYPES.bool:
      return 'true';
    case TYPES.func:
      return '() => null';
    case TYPES.object:
    case TYPES.shape:
      return '{  }';
    case TYPES.array:
    case TYPES.arrayOf:
      return '[ ]';
    case TYPES.number:
      return '0';
    case TYPES.string:
    default:
      return '';
  }
};

const getValueIdentifierForType = ({ type, value }) => {
  switch (type) {
    case TYPES.string:
      return defaultJSXStringQuote;
    case TYPES.oneOf:
      if (value[0] && typeof value[0] === 'string') {
        return defaultJSXStringQuote;
      }

      return COMPUTABLE_VALUE_IDENTIFIER;
    default:
      return COMPUTABLE_VALUE_IDENTIFIER;
  }
};

const buildPropsStringFrom = (list) =>
  list.reduce(
    (props, { changed, str, type: { type }, preSpaces, name, valueIdentifier, value }) => {
      if (!changed) {
        return `${props}${str}`;
      }

      switch (type) {
        case TYPES.bool:
          return `${props}${preSpaces}${name}${value === 'true' ? '' : '={false}'}`;

        case undefined: // spread in props
          return `${props}${preSpaces}${valueIdentifier}${value}${getClosingSymbol(
            valueIdentifier,
          )}`;

        default:
          return `${props}${preSpaces}${name}=${valueIdentifier}${value}${getClosingSymbol(
            valueIdentifier,
          )}`;
      }
    },
    '',
  );

class PropTypePropsToolView extends Component {
  constructor(props) {
    super(props);

    const { props: list } = props;

    this.state = {
      list,
    };
  }

  handleChange = (list) => {
    this.setState({ list });
  };

  handleAddProperty = (name, propType) => {
    const value = getEmptyValueForPropType(propType);

    this.setState(({ list }) => {
      const { length } = list;
      let preSpaces;

      if (length) {
        ({ preSpaces } = list[length - 1]);
      }

      this.setState({
        list: [
          ...list,
          {
            name,
            preSpaces: preSpaces || ' ',
            value,
            valueIdentifier: getValueIdentifierForType(propType),
            type: propType,
            changed: true,
          },
        ],
      });
    });
  };

  handleUpdate = () => {
    const { onSubmit } = this.props;

    onSubmit(buildPropsStringFrom(this.state.list));
  };

  render() {
    const { name, propTypes, propTypesList, defaultProps, close } = this.props;

    const { list } = this.state;

    return (
      <>
        <SmallHeader spaceAbove>&lt;{name} /&gt; props</SmallHeader>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 200 }}>
          {propTypesList && propTypesList.length ? (
            <PropTypesList
              props={list}
              propTypes={propTypesList}
              onAddProperty={this.handleAddProperty}
            />
          ) : (
            <HGroup noPaddings>
              <MaterialCommunityIcons name="alert" color={TEXT_ACTIVE_COLOR} size={28} />
              <Small style={{ marginLeft: 10 }}>Component does not contain PropType specs.</Small>
            </HGroup>
          )}
          <PropsList items={list} propTypes={propTypes} onChange={this.handleChange} />
          <AddCustomProperty onAddProperty={this.handleAddProperty} />
        </ScrollView>
        <SBGroup style={{ marginTop: 5 }}>
          <TextButton label="Cancel" onPress={close} />
          <TextButton label="Update" onPress={this.handleUpdate} />
        </SBGroup>
      </>
    );
  }
}

const PropTypePropsToolModal = withHostedModal(
  PropTypePropsToolView,
  ['onSubmit'],
  {},
  undefined,
  ModalScreen,
);

const { renderer: propTypeParametersToolScreenRenderer } = PropTypePropsToolModal;

/*
  How it should work:
  1. Parse code to find Component name and props
  2. Search code to find Component import
  3. Create module code that imports and exports Component
  4. Evaluate code to retrieve Component
  5. Read it's PropTypes
  6. Build UI with already used props and possibility to add props from PropTypes
     Props with primitive values could be added here but complex ones could be added as templates.
     Complex is displayed with checkbox, if it's checked, then it added to code as
     propName={  }
*/

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
        content,
        position,
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
            const { propsStartIndex, endIndex } = target;
            const code = `${content.substring(0, propsStartIndex)}${value}${content.substring(
              endIndex,
            )}`;

            await editorApi.setValue(code);
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
