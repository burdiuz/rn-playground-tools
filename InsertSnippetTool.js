import React, { Component, useState, useEffect, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';
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
import { ToolIconButton } from 'source/components/ToolButtonList';
import { showModal } from 'source/store/modals/actions';
import { getToolByFileName } from 'source/store/file/tools/selectors';
import TransparentIconButton from 'source/components/TransparentIconButton';

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
  IconButton,
  TextButton,
  VGroup,
  HGroup,
  SBGroup,
  RGroup,
  HRule,
  SlimHeader,
  FormTextInput,
  withHostedModal,
  ModalScreen,
  DimensionScreen,
} from '@actualwave/react-native-kingnare-style';

import { resetSnippets } from 'source/store/file/snippets/actions';
import {
  getSnippetsList,
  getSnippetByFilePath,
  areSnippetsInitialized,
} from 'source/store/file/snippets/selectors';

const SETTINGS_STORAGE_KEY = '@tool-insert-snippet-tool-settings';
const BUTTONS_STORAGE_KEY = '@tool-insert-snippet-tool-buttons';

/*
  I'm using modal from Color Palette Tool to display color selection in this tool.
  For more information, search for ShowColorPaletteButton component
*/
const COLOR_PALETTE_TOOL_FILE_NAME = 'ColorPaletteTool.js';

// ---------------- Settings Async Storage

const getSettingsFromStorage = async () => {
  let settings;

  try {
    settings = JSON.parse(await AsyncStorage.getItem(SETTINGS_STORAGE_KEY));
  } catch (error) {
    // ignore
  }

  return settings || { descriptions: true, starredSnippets: {} };
};

const isSnippetStarred = ({ filePath }, { starredSnippets }) => starredSnippets[filePath] === true;

const toggleStarredSnippet = async (snippet) => {
  const { filePath } = snippet;
  const settings = await getSettingsFromStorage();
  const { starredSnippets } = settings;

  if (isSnippetStarred(snippet, settings)) {
    delete starredSnippets[filePath];
  } else {
    starredSnippets[filePath] = true;
  }

  await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));

  return settings;
};

const updateSettings = async (updates) => {
  const fromStrorage = await getSettingsFromStorage();

  const settings = { ...fromStrorage, ...updates };

  await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));

  return settings;
};

// ---------------- Snippet Buttons Async Storage

const getSnippetButtonsFromStorage = async () => {
  let list;

  try {
    list = JSON.parse(await AsyncStorage.getItem(BUTTONS_STORAGE_KEY));
  } catch (error) {
    // ignore
  }

  return list || [];
};

const removeSnippetButton = async (filePath) => {
  const original = await getSnippetButtonsFromStorage();
  const list = original.filter(({ filePath: itemName }) => itemName !== filePath);

  await AsyncStorage.setItem(BUTTONS_STORAGE_KEY, JSON.stringify(list));

  return list;
};

const addSnippetButton = async (filePath, name, color = 0xffffffff) => {
  const original = await removeSnippetButton(name);
  const list = [...original, { filePath, name, color }];

  list.sort(({ name: a }, { name: b }) => (a < b ? -1 : 1));

  await AsyncStorage.setItem(BUTTONS_STORAGE_KEY, JSON.stringify(list));

  return list;
};

const styles = StyleSheet.create({
  fullFlex: { flex: 1 },
});

/*






  ============================================  Select and Apply Snippet from the List






*/

const keyExtractor = ({ fileName }) => fileName;

const getButtonColor = ({ filePath }, buttons) => {
  const item = buttons.find(({ filePath: item }) => item === filePath);

  return item ? item.color : undefined;
};

const snippetItemRenderer = ({
  item,
  selected,
  onPress,
  settings,
  buttons,
  onStarSnippetToggle,
  onButtonColorToggle,
  showColorPalette,
}) => {
  const currentColor = getButtonColor(item, buttons);

  return (
    <TouchableHighlight onPress={onPress}>
      <VGroup
        style={{
          backgroundColor: selected ? ACTIVE_BACKGROUND_COLOR : 'transparent',
          paddingTop: 5,
        }}
        noPadding
      >
        <SBGroup>
          <Text style={{ color: selected ? TEXT_ACTIVE_COLOR : TEXT_COLOR }}>
            {item.name || item.fileName}
          </Text>
          <HGroup noPadding>
            <TransparentIconButton
              iconClass={MaterialCommunityIcons}
              icon="card"
              color={currentColor === undefined ? TEXT_DISABLED_COLOR : currentColor}
              iconSize={22}
              onPress={async () => {
                if (currentColor !== undefined) {
                  onButtonColorToggle(undefined, item);
                  return;
                }

                try {
                  const color = await showColorPalette();

                  onButtonColorToggle(parseInt(color), item);
                } catch (error) {
                  // ignore
                }
              }}
            />
            <TransparentIconButton
              iconClass={MaterialCommunityIcons}
              icon={isSnippetStarred(item, settings) ? 'star' : 'star-outline'}
              color={selected ? TEXT_COLOR : TEXT_DISABLED_COLOR}
              iconSize={22}
              onPress={() => onStarSnippetToggle(item)}
            />
          </HGroup>
        </SBGroup>
        {settings.descriptions ? (
          <Small style={{ color: selected ? TEXT_ACTIVE_COLOR : TEXT_COLOR, marginHorizontal: 5 }}>
            {item.description || ''}
          </Small>
        ) : null}
        <HRule />
      </VGroup>
    </TouchableHighlight>
  );
};

const noSnippetRenderer = (initialized) => (
  <Text style={{ width: '100%', textAlign: 'center' }}>
    {initialized
      ? 'No Snippets found. Please, put snippet JSON files into Snippets folder.'
      : 'Application reads snippets. Please, wait...'}
  </Text>
);

const SnippetsListView = ({
  initialized,
  settings,
  buttons,
  list,
  selectedItem,
  showModal,
  onChange,
  onStarSnippetToggle,
  onButtonColorToggle,
  colorPaletteModalRenderer,
}) => {
  const extraData = useMemo(() => ({}), [settings, buttons]);
  const showColorPalette = useMemo(() => {
    if (!colorPaletteModalRenderer || !showModal) {
      return undefined;
    }

    return () =>
      new Promise((resolve, reject) => {
        showModal({
          renderer: colorPaletteModalRenderer,
          props: {
            colorType: '0x',
            initialColor: 0x000000ff,
            submitTitle: ' Apply ',
            onCancel: reject,
            onSubmit: resolve,
          },
        });
      });
  }, [colorPaletteModalRenderer, showModal]);

  return (
    <FlatList
      data={list}
      extraData={extraData}
      keyExtractor={keyExtractor}
      renderItem={({ item }) =>
        snippetItemRenderer({
          item,
          selected: item === selectedItem,
          onPress: () => onChange(item),
          settings,
          buttons,
          onStarSnippetToggle,
          onButtonColorToggle,
          showColorPalette,
        })
      }
      ListEmptyComponent={() => noSnippetRenderer(initialized)}
      style={styles.fullFlex}
    />
  );
};

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
const SnippetsList = connect(
  (state, { settings }) => {
    const { ColorPaletteToolModal: { renderer: colorPaletteModalRenderer } = {} } =
      getToolByFileName(state, { fileName: COLOR_PALETTE_TOOL_FILE_NAME }) || {};

    return {
      list: getSnippetsList(state).sort((snippet1, snippet2) => {
        const starred1 = isSnippetStarred(snippet1, settings);
        const starred2 = isSnippetStarred(snippet2, settings);

        if (starred1 && !starred2) {
          return -1;
        } else if (!starred1 && starred2) {
          return 1;
        }

        return snippet1.name.toLowerCase() < snippet2.name.toLowerCase() ? -1 : 1;
      }),
      initialized: areSnippetsInitialized(state),
      colorPaletteModalRenderer,
    };
  },
  { showModal },
)(SnippetsListView);

const SnippetSelect = ({
  settings,
  buttons,
  onDescriptionsToggle,
  onStarSnippetToggle,
  onButtonColorToggle,
  onSelect,
  onCancel,
}) => {
  const [selectedSnippet, setSelectedSnippet] = useState(null);

  return (
    <>
      <SBGroup>
        <SlimHeader>Select Code Snippet</SlimHeader>
        <IconButton
          iconRenderer={() => (
            <MaterialCommunityIcons name="card-text-outline" color={TEXT_ACTIVE_COLOR} size={20} />
          )}
          onPress={onDescriptionsToggle}
          selected={settings.descriptions}
        />
      </SBGroup>
      <SnippetsList
        settings={settings}
        buttons={buttons}
        selectedItem={selectedSnippet}
        onChange={setSelectedSnippet}
        onStarSnippetToggle={onStarSnippetToggle}
        onButtonColorToggle={onButtonColorToggle}
      />
      <HGroup style={{ paddingTop: 5, justifyContent: 'space-between' }}>
        <TextButton label="Cancel" onPress={onCancel} />
        <TextButton
          label="Select"
          disabled={!selectedSnippet}
          onPress={() => onSelect(selectedSnippet)}
        />
      </HGroup>
    </>
  );
};

const SnippetParameter = memo(
  ({ label, description, value, onChange, focusOnMount }) => (
    <FormTextInput label={label} value={value} onChangeText={onChange} focusOnMount={focusOnMount}>
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
    <>
      <SlimHeader>Enter Snippet Parameters</SlimHeader>
      <VGroup style={styles.fullFlex}>
        <ScrollView style={styles.fullFlex}>
          {list.map(({ name, label, description }, index) => (
            <SnippetParameter
              key={name}
              label={label}
              description={description}
              focusOnMount={!index}
              value={values[name]}
              onChange={(value) => updateValues({ ...values, [name]: value })}
            />
          ))}
        </ScrollView>
      </VGroup>
      <HGroup style={{ paddingTop: 5, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row' }}>
          <TextButton label="Cancel" onPress={onCancel} />
          {onBack ? (
            <TextButton label="Back" onPress={onBack} style={{ marginHorizontal: 10 }} />
          ) : null}
        </View>
        <TextButton label="Insert" onPress={() => onSubmit(values)} />
      </HGroup>
    </>
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

const SnippetSelectScreen = ({
  settings: initialSettings,
  buttons: initialButtons,
  refreshButtonsList,
  onSubmit,
  onCancel,
}) => {
  const [parameters, setParameters] = useState(null);
  const [snippet, setSnippet] = useState(null);
  const [buttons, setButtons] = useState(initialButtons);
  const [settings, setSettings] = useState(initialSettings);

  if (!snippet) {
    return (
      <SnippetSelect
        settings={settings}
        buttons={buttons}
        onDescriptionsToggle={async () => {
          const { descriptions } = settings;
          const updated = await updateSettings({ descriptions: !descriptions });
          setSettings(updated);
        }}
        onStarSnippetToggle={async (snippet) => {
          const updated = await toggleStarredSnippet(snippet);
          setSettings(updated);
        }}
        onButtonColorToggle={async (color, { filePath, name }) => {
          let updated;

          if (color === undefined) {
            updated = await removeSnippetButton(filePath);
          } else {
            updated = await addSnippetButton(filePath, name, color);
          }

          setButtons(updated);
          refreshButtonsList();
        }}
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

/*






  ============================================  Apply Snippet By Name






*/

const ApplyByFileView = ({ snippet, onSubmit, onCancel, onNotExists }) => {
  const [parameters, setParameters] = useState([]);
  const handleSubmit = (values) => {
    const result = applyValuesToSnippet(snippet, values);

    onSubmit(result);
  };

  useEffect(() => {
    if (!snippet) {
      onNotExists();
      return;
    }

    const parameters = getSnippetParameters(snippet);

    if (!parameters || !parameters.length) {
      handleSubmit({});
      return;
    }

    setParameters(parameters);
  }, []);

  return <SnippetParameters list={parameters} onSubmit={handleSubmit} onCancel={onCancel} />;
};

const ApplyByFileScreen = connect((state, { filePath }) => ({
  snippet: getSnippetByFilePath(state, { filePath }),
}))(ApplyByFileView);

const ApplyByFileModal = withHostedModal(
  ApplyByFileScreen,
  ['onSubmit', 'onCancel', 'onNotExists'],
  {},
  undefined,
  ModalScreen,
);

export const { renderer: applyByFileRenderer } = ApplyByFileModal;

/*






  ============================================  Create New Snippet






*/

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
  const [fileName, setFileName] = useState('');
  const [exists, setExists] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const snippetFileName = /\.json$/i.test(fileName) ? fileName : `${fileName}.json`;

  useEffect(() => {
    isSnippetExists(snippetFileName).then(setExists);
  }, [fileName]);

  return (
    <DimensionScreen>
      <KeyboardAvoidingView style={styles.fullFlex} enabled>
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

const SnippetCreateNewScreen = connect(null, (dispatch, { getSnippetsRoot, projectsApi }) => ({
  reset: () => dispatch(resetSnippets({ getSnippetsRoot, projectsApi })),
}))(SnippetCreateNewScreenView);

const SnippetCreateNewModal = withHostedModal(
  SnippetCreateNewScreen,
  ['onSubmit', 'onCancel'],
  {},
  undefined,
  ModalScreen,
);

export const { renderer: snippetCreateNewRenderer } = SnippetCreateNewModal;

const getIconStringFromName = (name) =>
  name
    .match(/(^.|[A-Z]|\d|[^\w\d]\w)/g)
    .map((str) => str.charAt(str.length - 1))
    .join('')
    .substr(0, 3);

const getIconFromName = (name, color) => (
  <Text style={{ fontWeight: '600', color }}>{getIconStringFromName(name)}</Text>
);

const SnippetButtons = ({ onPress, onLongPress }) => {
  const [buttons, setButtons] = useState([]);
  const [refreshNum, refreshButtons] = useState(0);
  const refreshButtonsList = () => refreshButtons(Date.now());

  useEffect(() => {
    (async () => {
      const list = await getSnippetButtonsFromStorage();

      setButtons(list);
    })();
  }, [refreshNum]);

  return (
    <>
      <ToolIconButton
        icon={
          <MaterialCommunityIcons name="alpha-s-box-outline" color={TEXT_ACTIVE_COLOR} size={28} />
        }
        onPress={() => onPress({ refreshButtonsList })}
        onLongPress={onLongPress}
      />
      {buttons.map(({ filePath, name, color }) => (
        <ToolIconButton
          key={filePath}
          icon={getIconFromName(name || filePath, color)}
          onPress={() => onPress({ snippetByFile: filePath })}
        />
      ))}
    </>
  );
};

const tool = {
  type: 'editor',
  mimeType: ['application/javascript'],
  order: 130,
  controlRenderer: (pressHandler, longPressHandler) => (
    <SnippetButtons onPress={pressHandler} onLongPress={longPressHandler} />
  ),
  pressHandler: async ({
    closeToolsPanel,
    showModal,
    showAlert,
    editorApi,
    data: { refreshButtonsList, snippetByFile },
  }) => {
    closeToolsPanel();

    if (snippetByFile) {
      showModal({
        renderer: applyByFileRenderer,
        props: {
          filePath: snippetByFile,
          onSubmit: (value) => editorApi.replaceSelection(value),
          onNotExists: async () => {
            await removeSnippetButton(snippetByFile);
            refreshButtonsList();
            showAlert('Could not find the snippet. If it still exists, re-add it to the buttons.');
          },
          onCancel: () => null,
        },
      });

      return;
    }

    const settings = await getSettingsFromStorage();
    const buttons = await getSnippetButtonsFromStorage();

    showModal({
      renderer: snippetSelectScreenRenderer,
      props: {
        buttons,
        settings,
        refreshButtonsList,
        onSubmit: (value) => editorApi.replaceSelection(value),
        onCancel: () => null,
      },
    });
  },
  longPressHandler: async ({
    closeToolsPanel,
    showModal,
    showAlert,
    editorApi,
    projectsApi,
    fsRoots: { getSnippetsRoot },
  }) => {
    const { createFile } = projectsApi;
    closeToolsPanel();

    const body = await editorApi.getSelection();

    if (!body) {
      showAlert('To create a Snippet, select text you want to save as snippet.');
      return;
    }

    const parameters = getSnippetParameters({ body }, false);
    const root = await getSnippetsRoot();

    const isSnippetExists = (fileName) => root.fs.has(fileName);

    showModal({
      renderer: snippetCreateNewRenderer,
      props: {
        body,
        parameters,
        isSnippetExists,
        projectsApi,
        getSnippetsRoot,
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
