import React, { Component, useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableHighlight,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  ACTIVE_BACKGROUND_COLOR,
  TEXT_COLOR,
  TEXT_ACTIVE_COLOR,
  TEXT_DISABLED_COLOR,
  Area,
  Screen,
  Text,
  Small,
  TextInput,
  TextButton,
  VGroup,
  HGroup,
  RGroup,
  HRule,
  SlimHeader,
  ScrollArea,
  FormTextInput,
  withHostedModal,
  ModalScreen,
  DimensionScreen,
} from '@actualwave/react-native-kingnare-style';

import { resetSnippets } from 'source/store/file/snippets/actions';
import { getSnippetsList, areSnippetsInitialized } from 'source/store/file/snippets/selectors';
import TransparentIconButton from 'source/components/TransparentIconButton';

const styles = StyleSheet.create({
  fullFlex: { flex: 1 },
});

const keyExtractor = ({ fileName }) => fileName;

const snippetItemRenderer = (item, selected, onPress) => (
  <TouchableHighlight onPress={onPress}>
    <VGroup style={{ backgroundColor: selected ? ACTIVE_BACKGROUND_COLOR : 'transparent' }}>
      <Text style={{ color: selected ? TEXT_ACTIVE_COLOR : TEXT_COLOR }}>
        {item.name || item.fileName}
      </Text>
      <HRule />
      <Small style={{ color: selected ? TEXT_ACTIVE_COLOR : TEXT_COLOR }}>
        {item.description || ''}
      </Small>
    </VGroup>
  </TouchableHighlight>
);

const noSnippetRenderer = (initialized) => (
  <Text style={{ width: '100%', textAlign: 'center' }}>
    {initialized
      ? 'No Snippets found. Please, put snippet JSON files into Snippets folder.'
      : 'Application reads snippets. Please, wait...'}
  </Text>
);

const SnippetsListView = ({ initialized, list, selectedItem, onChange }) => (
  <FlatList
    data={list}
    keyExtractor={keyExtractor}
    renderItem={({ item }) =>
      snippetItemRenderer(item, item === selectedItem, () => onChange(item))
    }
    ListEmptyComponent={() => noSnippetRenderer(initialized)}
  />
);

/*
    This needs some explanation. Since I didn't came up with a nice solution,
    I coded this dirty hack. It works because tool after evaluation is being
    inserted into Playground application react DOM tree and it has access to
    all contexts Playground have. By adding connect() here I've accessed
    Plaground app global state to retrieve snippets list instead of reading it
    from filesystem. So can you, but be careful, you will be playing with
    global state of entire application.

    It is not some kind of sacred knowledge and currently there are not much
    information in it, but anyway, if you try hard, you may break something.
    On other side, this state does not hold anything that will not be fixed by
    restarting or re-installing the app, so go ahead and do it.

    I'll try to add meaningful doc with this kind of information later, after
    all the basic functionality of the app is completed.

    TLDR;
    Le optimization.
*/
const SnippetsList = connect((state) => ({
  list: getSnippetsList(state),
  initialized: areSnippetsInitialized(state),
}))(SnippetsListView);

const SnippetSelect = ({ onSelect, onCancel }) => {
  const [selectedSnippet, setSelectedSnippet] = useState(null);

  return (
    <Screen>
      <SlimHeader>Select Code Snippet</SlimHeader>
      <ScrollView style={styles.fullFlex}>
        <SnippetsList selectedItem={selectedSnippet} onChange={setSelectedSnippet} />
      </ScrollView>
      <HGroup style={{ paddingTop: 5, justifyContent: 'space-between' }}>
        <TextButton label="Cancel" onPress={onCancel} />
        <TextButton
          label="Select"
          disabled={!selectedSnippet}
          onPress={() => onSelect(selectedSnippet)}
        />
      </HGroup>
    </Screen>
  );
};

const SnippetParameter = memo(
  ({ label, description, value, onChange }) => (
    <FormTextInput label={label} value={value} onChangeText={onChange}>
      {description ? <Small>{description}</Small> : null}
    </FormTextInput>
  ),
  ({ value: v1 }, { value: v2 }) => v1 === v2,
);

const SnippetParameters = ({ list, onSubmit, onCancel, onBack }) => {
  const [values, updateValues] = useState({});

  useEffect(() => {
    updateValues(
      list.reduce(
        (result, { name, defaultValue }) => ({ ...result, [name]: defaultValue || '' }),
        {},
      ),
    );
  }, [list]);

  return (
    <DimensionScreen>
      <SlimHeader>Enter Snippet Parameters</SlimHeader>
      <VGroup style={styles.fullFlex}>
        <ScrollView style={styles.fullFlex}>
          {list.map(({ name, label, description }) => (
            <SnippetParameter
              key={name}
              label={label}
              description={description}
              value={values[name]}
              onChange={(value) => updateValues({ ...values, [name]: value })}
            />
          ))}
        </ScrollView>
      </VGroup>
      <HGroup style={{ paddingTop: 5, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row' }}>
          <TextButton label="Cancel" onPress={onCancel} />
          <TextButton label="Back" onPress={onBack} style={{ marginHorizontal: 10 }} />
        </View>
        <TextButton label="Insert" onPress={() => onSubmit(values)} />
      </HGroup>
    </DimensionScreen>
  );
};

const getSnippetParameters = ({ parameters, body }, nameAsLabel = true) => {
  if (parameters) {
    return parameters;
  }

  /*
    TODO Add type for parameter, like String, Number, Boolean, Enum
    TODO add mimeType: String | String[] to filter snippets by file
    type currently edited
  */
  return (body.match(/\$\{[a-z0-9_]+\}/gi) || [])
    .map((name) => name.substring(2, name.length - 1))
    .filter(
      ((has = {}) => (name) => {
        if (!name || has[name] === true) {
          return false;
        }

        has[name] = true;

        return true;
      })(),
    )
    .map((name) => ({
      name,
      label: nameAsLabel ? name : '',
      description: '',
      defaultValue: '',
    }));
};

const applyValuesToSnippet = ({ body }, values) =>
  Object.keys(values).reduce(
    (result, name) => result.replace(new RegExp(`\\$\\{${name}\\}`, 'g'), values[name]),
    body,
  );

const SnippetSelectScreen = ({ onSubmit, onCancel }) => {
  const [parameters, setParameters] = useState(null);
  const [snippet, setSnippet] = useState(null);

  if (!snippet) {
    return (
      <SnippetSelect
        onSelect={(item) => {
          const parameters = getSnippetParameters(item);

          if (parameters && parameters.length) {
            setParameters(parameters);
            setSnippet(item);
          } else {
            onSubmit(item.body);
          }
        }}
        onCancel={onCancel}
      />
    );
  }

  return (
    <SnippetParameters
      list={parameters}
      onSubmit={(values) => {
        const result = applyValuesToSnippet(snippet, values);

        onSubmit(result);
      }}
      onCancel={onCancel}
      onBack={() => {
        setSnippet(null);
        setParameters(null);
      }}
    />
  );
};

const SnippetSelectModal = withHostedModal(
  SnippetSelectScreen,
  ['onSubmit', 'onCancel'],
  {},
  undefined,
  ModalScreen,
);

export const { renderer: snippetSelectScreenRenderer } = SnippetSelectModal;

const CreateSnippetParameter = memo(
  ({ parameter, index, onChange, onRemove }) => {
    const { name, label, description, defaultValue } = parameter;
    return (
      <VGroup>
        <RGroup noPadding>
          <Text>{name}</Text>
          <TransparentIconButton
            iconClass={FontAwesome}
            icon="trash-o"
            color={TEXT_DISABLED_COLOR}
            onPress={() => onRemove(index)}
          />
        </RGroup>
        <TextInput
          placeholder="Label"
          value={label}
          onChangeText={(value) => onChange({ ...parameter, label: value }, index)}
        />
        <TextInput
          placeholder="Description"
          value={description}
          onChangeText={(value) => onChange({ ...parameter, description: value }, index)}
          style={{ marginVertical: 4 }}
        />
        <TextInput
          placeholder="Default Value"
          value={defaultValue}
          onChangeText={(value) => onChange({ ...parameter, defaultValue: value }, index)}
        />
        <HRule />
      </VGroup>
    );
  },
  ({ parameter: a1, index: a2 }, { parameter: b1, index: b2 }) => a1 === b1 && a2 === b2,
);

class CreateSnippetParameters extends Component {
  static propTypes = {
    parameters: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        defaultValue: PropTypes.string.isRequired,
      }),
    ).isRequired,
    onChange: PropTypes.func.isRequired,
  };

  handleChange = (value, index) => {
    const { parameters, onChange } = this.props;
    const list = [...parameters];

    list[index] = value;
    onChange(list);
  };

  handleRemove = (index) => {
    const { parameters, onChange } = this.props;
    const list = [...parameters];

    list.splice(index, 1);
    onChange(list);
  };

  render() {
    const { parameters } = this.props;

    return (
      <>
        <Text>Snippet Parameters</Text>
        <Area>
          {parameters.map((param, index) => {
            const { name } = param;

            return (
              <CreateSnippetParameter
                key={name}
                index={index}
                parameter={param}
                onChange={this.handleChange}
                onRemove={this.handleRemove}
              />
            );
          })}
        </Area>
      </>
    );
  }
}

const SnippetCreateNewScreenView = ({
  parameters: initParams,
  isSnippetExists,
  onCancel,
  onSubmit,
  reset,
}) => {
  const [parameters, setParameters] = useState(initParams);
  7;
  const [fileName, setFileName] = useState('');
  const [exists, setExists] = useState(false);
  isSnippetExists;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const snippetFileName = /\.json$/i.test(fileName) ? fileName : `${fileName}.json`;

  useEffect(() => {
    isSnippetExists(snippetFileName).then(setExists);
  }, [fileName]);

  return (
    <DimensionScreen>
      <KeyboardAvoidingView style={styles.fullFlex} behavior="padding" enabled>
        <ScrollView>
          <SlimHeader>Create new Snippet</SlimHeader>
          <Small>This will create a code snippet from a selection in the Code Editor.</Small>
          <FormTextInput
            label="Snippet File Name"
            value={fileName}
            onChangeText={setFileName}
            errorMessage={exists ? 'Snippet with this file name already exists.' : ''}
          />
          <FormTextInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            keepErrorMessageSpace={false}
          />
          <FormTextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            keepErrorMessageSpace={false}
          />
          <CreateSnippetParameters parameters={parameters} onChange={setParameters} />
        </ScrollView>
      </KeyboardAvoidingView>
      <HGroup style={{ paddingTop: 5, justifyContent: 'space-between' }}>
        <TextButton label="Cancel" onPress={onCancel} />
        <TextButton
          label="Create"
          onPress={async () => {
            await onSubmit(snippetFileName, { name: title, description, parameters });
            reset();
          }}
          disabled={!fileName || exists}
        />
      </HGroup>
    </DimensionScreen>
  );
};

const SnippetCreateNewScreen = connect(
  null,
  (dispatch, { projectsApi }) => ({ reset: () => dispatch(resetSnippets({ projectsApi })) }),
)(SnippetCreateNewScreenView);

const SnippetCreateNewModal = withHostedModal(
  SnippetCreateNewScreen,
  ['onSubmit', 'onCancel'],
  {},
  undefined,
  ModalScreen,
);

export const { renderer: snippetCreateNewRenderer } = SnippetCreateNewModal;

const tool = {
  type: 'editor',
  mimeType: ['application/javascript'],
  iconRenderer: () => (
    <MaterialCommunityIcons name="alpha-s-box-outline" color={TEXT_ACTIVE_COLOR} size={28} />
  ),
  pressHandler: async ({ closeToolsPanel, showModal, editorApi }) => {
    closeToolsPanel();
    showModal({
      renderer: snippetSelectScreenRenderer,
      props: {
        onSubmit: (value) => {
          editorApi.replaceSelection(value);
        },
        onCancel: () => null,
      },
    });
  },
  longPressHandler: async ({ closeToolsPanel, showModal, showAlert, editorApi, projectsApi }) => {
    const { createFile, getSnippetsRoot } = projectsApi;
    closeToolsPanel();

    const body = await editorApi.getSelection();

    if (!body) {
      showAlert('To create a Snippet, select text you want to save as snippet.');
      return;
    }

    const parameters = getSnippetParameters({ body }, false);
    const root = await projectsApi.getSnippetsRoot();

    const isSnippetExists = (fileName) => root.fs.has(fileName);

    showModal({
      renderer: snippetCreateNewRenderer,
      props: {
        body,
        parameters,
        isSnippetExists,
        projectsApi,
        onSubmit: (fileName, snippet) => {
          const { parameters: params } = snippet;

          const parameters = params.map(({ name, label, ...param }) => ({
            name,
            label: label || name,
            ...param,
          }));

          return createFile(
            fileName,
            JSON.stringify({ ...snippet, parameters, body }, null, 2),
            null,
            root,
          );
        },
        onCancel: () => null,
      },
    });
  },
};

export default tool;
