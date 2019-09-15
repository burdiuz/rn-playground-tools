import React from 'react';
import PropTypes from 'prop-types';
import { Image, ScrollView, Linking } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import { withFormik } from 'formik';
import * as yup from 'yup';

import {
  ModalScreen,
  Screen,
  HGroup,
  TextButton,
  withHostedModal,
  bigModalDefaultStyle,
  Small,
  VGroup,
  LinkButton,
  SmallHeader,
  CheckBox,
  FormTextInput,
  InputPlaceholder,
  DropDown,
} from '@actualwave/react-native-kingnare-style';

const IMAGE_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAABGdBTUEAALGPC/xhBQAAAwBQTFRFAAAAVrO0V7S1WrS1Xba3Ybi4Yri5ZLm6abu8cL6/cr/AfcTFf8XG6V5e6l9f6mBg62Rk6mVl7G9v97k+9rk/97pB97tD9rtF97tG97xG97xI9r1M979P+L5K979Q98BS98JZ+MNb+MZi+Mdm+ctw+Mx2+M9+v4W/g8fHicnKi8rLjMvMj8zNkc3Oks7OlM/PmdHRm9HSn9TUqNfYsNvctN3dud/fu+Dg746O74+P8JCQ8JGR8JOT8ZeX8ZmZ8Zqa8Zub8qGh8qKi86mp9K2t9K6u9K+v9LKy9ba29bm59r+/wIfAwIjAwYnBw47DxJDExZHFzaHNzqHOz6XP0ajR0qnS06zT1K7U1bHV2LXY2rja3L3c+dGD+dKF+dOG+teS+t6m4MTg4cfh4sji5M3k5ujq5+nr6Onr6Orr6Ors6evt6uzt6+zu6+3v7O3v7O7v7e7w7u/x7vDx7/Dy8PLz8vP08/T08/T19PT1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAiTx58wAAAQB0Uk5T////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AFP3ByUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjEuNv1OCegAAAIESURBVEhLvZRZQxMxFIWnWtxKQSlWAVFEQURFUdlUlE1ccEGharW4U2cESplS8d8fT24ywwzIQ+ah30Ob3ORM7slN4sCSBIKbqQM5CqyXo7iywonjBzEM/FmL4idKyRIH8y1ZRcs00Jv7Hx2c5mkPa0owawRTwEUzJU6eAjcisCSJoDkT4xqjS28MRXaaMwP8rVbIthLcMFUKAX5cCXgBGb8LaBMN8mCHg37Z7M8Ac00DFZ1seQtolQJpHokLT1ZYKZVKnI87Q0Mj/Kv5ihpbTyZDOB913//bGA9Fs+WKV4CvLZSZ01lxp/kiHn4pwc/F1yEFYMfTMN3L50Iu8NsbnldtjIenrdlTbJxvF3rYPCxHKgLLA2+VVJRghpeHgdPa3BnWw0zb5RDHZSd04exIIhi8ahgFnk+Ma+5x7NOy8IFNvyrUleC6STSVOga0mbOWzd4HFkw5KRAHjfNgh4P3zPIboMsQpzt4vXdidSgsv6NypW8/XxlXm8Pbh1q4S5YkEHzUmy0scmlJNkh6D+Lh+8uFkLe86jLCT5kXPoacVksSCMaa0un0ETYvdXb2qTvtajw+1b7rrnMkCLlyp2/JwbsN5HO5rt1XQxL+zT9+Q/eJvBqWJBFMPQx5xog8rQGsRzTAroMH5sYoTgKbJl0DD5NpKfThezwXotasR9kTYM/SA/APZI1gaI5PBh0AAAAASUVORK5CYII=';
const IMAGE_DATA = { uri: IMAGE_URL };

const STORAGE_KEY = '@tool-prettier-code-format';

const DEFAULT_OPTIONS = {
  printWidth: 80,
  tabWidth: 2,
  semi: true,
  singleQuote: false,
  quoteProps: 'as-needed',
  jsxSingleQuote: false,
  trailingComma: 'es5',
  bracketSpacing: true,
  jsxBracketSameLine: false,
  arrowParens: 'always',
  proseWrap: 'always',
};

const QUOTE_PROPS = [
  {
    label: 'As needed - only add quotes around object properties where required',
    value: 'as-needed',
  },
  {
    label:
      'Consistent - if at least one property in an object requires quotes, quote all properties',
    value: 'consistent',
  },
  { label: 'Preserve - respect the input use of quotes in object properties', value: 'preserve' },
];

const TRAILING_COMMAS = [
  { label: 'None - no trailing commas', value: 'none' },
  { label: 'ES5 - trailing commas where valid in ES5 (objects, arrays, etc.)', value: 'es5' },
  { label: 'All - trailing commas wherever possible (including function arguments)', value: 'all' },
];

const ARROW_FN_PARENTHESES = [
  { label: 'Avoid - omit parens when possible. Example: x => x', value: 'avoid' },
  { label: 'Always - always include parens. Example: (x) => x', value: 'always' },
];

const PROSE_WRAP = [
  { label: 'Always - wrap prose if it exceeds the print width', value: 'always' },
  { label: 'Never - do not wrap prose', value: 'never' },
  { label: 'Preserve - wrap prose as-is', value: 'preserve' },
];

const getOptionsFromStorage = async () => {
  let options;

  try {
    options = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY));
  } catch (error) {
    // ignore
  }

  return options || { ...DEFAULT_OPTIONS };
};

const setOptionsToStorage = async (options) =>
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(options));

const PrettierOptionsFormView = ({
  values: {
    printWidth,
    tabWidth,
    semi,
    singleQuote,
    quoteProps,
    jsxSingleQuote,
    trailingComma,
    bracketSpacing,
    jsxBracketSameLine,
    arrowParens,
    proseWrap,
  },
  errors,
  handleSubmit,
  handleChange,
  handleBlur,
  onCancel,
}) => {
  return (
    <VGroup style={{ flex: 1, paddingBottom: 0 }}>
      <ScrollView style={{ flex: 1 }}>
        <FormTextInput
          label="Print Width"
          value={printWidth}
          onChangeText={handleChange('printWidth')}
          onBlur={handleBlur('printWidth')}
          errorMessage={errors.printWidth}
        />
        <Small style={{ marginBottom: 10 }}>
          Specify the line length that the printer will wrap on
        </Small>
        <FormTextInput
          label="Tab Width"
          value={tabWidth}
          onChangeText={handleChange('tabWidth')}
          onBlur={handleBlur('tabWidth')}
          errorMessage={errors.tabWidth}
          style={{ marginBottom: 10 }}
        />
        <CheckBox
          label="Print semicolons at the ends of statements"
          selected={semi}
          onPress={() => handleChange('semi')(!semi)}
        />
        <CheckBox
          label="Use single quotes instead of double quotes"
          selected={singleQuote}
          onPress={() => handleChange('singleQuote')(!singleQuote)}
        />
        <CheckBox
          label="Use single quotes instead of double quotes in JSX"
          selected={jsxSingleQuote}
          onPress={() => handleChange('jsxSingleQuote')(!jsxSingleQuote)}
          contentContainerStyle={{ alignItems: 'flex-start', marginBottom: 10 }}
        />
        <InputPlaceholder label="Quote Props">
          <DropDown
            items={QUOTE_PROPS}
            selectedItem={QUOTE_PROPS.find(({ value }) => value === quoteProps)}
            onChange={({ value }) => handleChange('quoteProps')(value)}
          />
          <Small>Change when properties in objects are quoted.</Small>
        </InputPlaceholder>

        <InputPlaceholder label="Trailing Commas">
          <DropDown
            items={TRAILING_COMMAS}
            selectedItem={TRAILING_COMMAS.find(({ value }) => value === trailingComma)}
            onChange={({ value }) => handleChange('trailingComma')(value)}
          />
          <Small>
            Print trailing commas wherever possible when multi-line. (A single-line array, for
            example, never gets trailing commas.)
          </Small>
        </InputPlaceholder>

        <CheckBox
          label="Print spaces between brackets in object literals"
          selected={bracketSpacing}
          onPress={() => handleChange('bracketSpacing')(!bracketSpacing)}
        />
        <CheckBox
          label="Move closing bracket to next line"
          selected={jsxBracketSameLine}
          onPress={() => handleChange('jsxBracketSameLine')(!jsxBracketSameLine)}
        />
        <Small style={{ marginBottom: 10 }}>
          Put the &gt; of a multi-line JSX element at the end of the last line instead of being
          alone on the next line (does not apply to self closing elements).
        </Small>

        <InputPlaceholder label="Arrow Function Parentheses" keepErrorMessageSpace={false}>
          <DropDown
            items={ARROW_FN_PARENTHESES}
            selectedItem={ARROW_FN_PARENTHESES.find(({ value }) => value === arrowParens)}
            onChange={({ value }) => handleChange('arrowParens')(value)}
          />
        </InputPlaceholder>
        <Small style={{ marginBottom: 10 }}>
          Include parentheses around a sole arrow function parameter.
        </Small>

        <InputPlaceholder label="Prose Wrap">
          <DropDown
            items={PROSE_WRAP}
            selectedItem={PROSE_WRAP.find(({ value }) => value === proseWrap)}
            onChange={({ value }) => handleChange('proseWrap')(value)}
          />
        </InputPlaceholder>

        <LinkButton
          label="Prettier options documentation"
          onPress={() => Linking.openURL('https://prettier.io/docs/en/options.html')}
        />
      </ScrollView>
      <HGroup noPadding style={{ justifyContent: 'space-between', marginTop: 5 }}>
        <TextButton label="Cancel" onPress={onCancel} />
        <TextButton label="Prettify" onPress={handleSubmit} />
      </HGroup>
    </VGroup>
  );
};

PrettierOptionsFormView.propTypes = {
  values: PropTypes.shape({}).isRequired,
  errors: PropTypes.shape({}).isRequired,
  handleChange: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  handleBlur: PropTypes.func,
  onCancel: PropTypes.func,
};

PrettierOptionsFormView.defaultProps = {
  handleBlur: undefined,
  onCancel: undefined,
};

const NUM_ERROR_MSG = 'Must be a positive number';

const PrettierOptionsForm = withFormik({
  mapPropsToValues: ({ options: { printWidth, tabWidth, ...options } }) => ({
    ...options,
    printWidth: String(printWidth),
    tabWidth: String(tabWidth),
  }),
  handleSubmit: (values, { props: { onSubmit } }) => onSubmit(values),
  validationSchema: () =>
    yup.object().shape({
      printWidth: yup
        .number(NUM_ERROR_MSG)
        .positive(NUM_ERROR_MSG)
        .required(NUM_ERROR_MSG),
      tabWidth: yup
        .number(NUM_ERROR_MSG)
        .positive(NUM_ERROR_MSG)
        .required(NUM_ERROR_MSG),
    }),
  displayName: 'PrettierForm',
})(PrettierOptionsFormView);

PrettierOptionsForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
};

PrettierOptionsForm.defaultProps = {
  onCancel: undefined,
};

const PrettierOptionsScreen = ({ close, options, onSubmit }) => (
  <>
    <SmallHeader>Prettier Options</SmallHeader>
    <PrettierOptionsForm options={options} onCancel={close} onSubmit={onSubmit} />
  </>
);

const PrettierOptionsModal = withHostedModal(
  PrettierOptionsScreen,
  ['onSubmit'],
  {},
  undefined,
  ModalScreen,
);

export const { renderer: prettierOptionsModalRenderer } = PrettierOptionsModal;

/*
  TODO Add Modal with Prettier options, they should save in Async Storage
*/

const prettifyEditorCode = async ({ editorApi }) => {
  const options = await getOptionsFromStorage();
  const parser = await requireModule('parser-babylon');
  const prettier = await requireModule('prettier');
  const currentValue = await editorApi.getValue();

  const prettified = prettier.format(currentValue, {
    ...options,
    parser: 'babel',
    plugins: [parser],
  });

  editorApi.setValue(prettified);
};

const tool = {
  type: 'editor',
  mimeType: ['application/javascript'],
  iconRenderer: () => <Image source={IMAGE_DATA} style={{ width: 28, height: 28 }} />,
  pressHandler: prettifyEditorCode,
  longPressHandler: async ({ closeToolsPanel, showModal, editorApi }) => {
    const options = await getOptionsFromStorage();
    closeToolsPanel();
    showModal({
      renderer: prettierOptionsModalRenderer,
      props: {
        options,
        onSubmit: async ({ printWidth, tabWidth, ...options }) => {
          await setOptionsToStorage({
            ...options,
            printWidth: Number(printWidth),
            tabWidth: Number(tabWidth),
          });
          return prettifyEditorCode({ editorApi });
        },
      },
    });
  },
};

export default tool;
