import React, { useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { View, StyleSheet, ScrollView, TouchableHighlight, FlatList } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  ACTIVE_BACKGROUND_COLOR,
  TEXT_COLOR,
  TEXT_ACTIVE_COLOR,
  Screen,
  Text,
  Small,
  TextButton,
  VGroup,
  HGroup,
  HRule,
  SlimHeader,
  FormTextInput,
  withHostedModal,
  ModalScreen,
} from '@actualwave/react-native-kingnare-style';

import { getSnippetsList, areSnippetsInitialized } from 'source/store/file/snippets/selectors';

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
  }, []);

  return (
    <Screen>
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
    </Screen>
  );
};

const getSnippetParameters = ({ parameters, body }) => {
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
      label: name,
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
};

export default tool;
