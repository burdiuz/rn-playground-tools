import React, { Component, useState, useMemo, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { View, FlatList, StyleSheet, Clipboard } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import debounce from 'lodash/debounce';

import { imports } from '@actualwave/react-native-codeval';
import withCodevalApi from 'source/providers/withCodevalApi';
import { loadModule } from 'source/store/file/modules/actions';
import { getAvailableModuleImportList, getCachedModule } from 'source/store/file/modules/selectors';

import {
  CheckBox,
  CheckBoxButton,
  TEXT_COLOR,
  TEXT_ACTIVE_COLOR,
  withHostedModal,
  Text,
  DisabledText,
  HGroup,
  SBGroup,
  TabView,
  TextInput,
  TextButton,
  IconButton,
  LinkButton,
  SmallHeaderText,
  Section,
  ModalScreen,
} from '@actualwave/react-native-kingnare-style';

import { getModuleVersion } from 'source/package';

const styles = StyleSheet.create({
  fullFlex: { flex: 1 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
});

const capitalizeImport = (name, isFunc = false) =>
  name
    .replace(/[^/]+\//g, '')
    .match(/[a-z\d]+/gi)
    .map((part, index) => {
      if (!part || (!index && isFunc)) {
        return part;
      }

      return `${part.charAt().toUpperCase()}${part.substr(1)}`;
    })
    .join('');

const retrieveModuleExportsList = (name) => {
  const factory = imports.getImportedModule(name);
  const module = factory();

  return Object.keys(module).sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1));
};

const buildExportsList = (moduleExports, importName) => {
  const names = { ...moduleExports };

  if (names.default) {
    const general = capitalizeImport(importName);

    delete names.default;
    const list = Object.keys(names);

    return `${general}${list.length ? `, { ${list.join(', ')} }` : ''}`;
  }

  const list = Object.keys(names);

  if (!list.length) {
    return `* as ${capitalizeImport(importName)}`;
  }

  return `{ ${list.join(', ')} }`;
};

const buildImports = (selectedImports) =>
  Object.keys(selectedImports)
    .map((importName) => {
      const moduleExports = selectedImports[importName];

      if (!moduleExports) return '';

      return `import ${buildExportsList(moduleExports, importName)} from "${importName}";\n`;
    })
    .filter((importStr) => !!importStr)
    .join('');

const selectPackage = (selectedImports, importName) => ({
  ...selectedImports,
  [importName]: selectedImports[importName] || {},
});

const deselectPackage = (selectedImports, importName) => ({
  ...selectedImports,
  [importName]: undefined,
});

const isPackageSelected = (selectedImports, importName) => !!selectedImports[importName];

const togglePackageSelection = (selectedImports, importName) => {
  const toggleSelection = isPackageSelected(selectedImports, importName)
    ? deselectPackage
    : selectPackage;

  return toggleSelection(selectedImports, importName);
};

const selectPackageExportName = (selectedExports, exportName) => ({
  ...selectedExports,
  [exportName]: true,
});

const deselectPackageExportName = (selectedExports, exportName) => {
  if (!selectedExports) {
    return undefined;
  }

  const result = { ...selectedExports };

  delete result[exportName];

  return Object.keys(result).length ? result : undefined;
};

const isPackageExportNameSelected = (selectedExports, exportName) =>
  !!(selectedExports && selectedExports[exportName]);

const togglePackageExportNameSelection = (selectedExports, exportName) => {
  const toggleSelection = isPackageExportNameSelected(selectedExports, exportName)
    ? deselectPackageExportName
    : selectPackageExportName;

  return toggleSelection(selectedExports, exportName);
};

const ModuleExportsListItem = ({ name, selected, onPress }) => (
  <CheckBox label={name} selected={selected} onPress={onPress} />
);

const renderModuleExportsListItem = (selectedExports, onExportNameSelected, importName) => ({
  item,
}) => {
  const name = item === 'default' ? `default as ${capitalizeImport(importName)}` : item;

  return (
    <ModuleExportsListItem
      key={item}
      name={name}
      selected={isPackageExportNameSelected(selectedExports, item)}
      onPress={() => onExportNameSelected(importName, item)}
    />
  );
};

const ModuleExportsList = ({ importName, list, selectedExports, onExportNameSelected }) => (
  <FlatList
    data={list}
    extraData={selectedExports}
    keyExtractor={(name) => name}
    renderItem={renderModuleExportsListItem(selectedExports, onExportNameSelected, importName)}
    style={{ marginLeft: 25 }}
  />
);

const BuiltinsListItem = memo(
  ({ name, selected, onPress, selectedExports, onPackageSelected, onExportNameSelected }) => {
    const [exportsList, setExportsList] = useState(null);

    const version = getModuleVersion(name);
    const versionText = version ? (
      <Text style={{ marginHorizontal: 10, fontSize: 12 }}>{version}</Text>
    ) : null;

    return (
      <Section
        label={name}
        labelStyle={{ fontSize: 12 }}
        numberOfLines={1}
        ellipsizeMode="head"
        onExpanded={() => {
          if (!exportsList) {
            setExportsList(retrieveModuleExportsList(name));
          }
        }}
        headerChildren={
          <>
            {versionText}
            <CheckBoxButton selected={selected} onPress={() => onPackageSelected(name)} />
          </>
        }
      >
        {exportsList
          ? () => (
              <ModuleExportsList
                list={exportsList}
                selectedExports={selectedExports}
                onExportNameSelected={onExportNameSelected}
                importName={name}
              />
            )
          : null}
      </Section>
    );
  },
  ({ selected: a1, selectedExports: b1 }, { selected: a2, selectedExports: b2 }) =>
    a1 === a2 && b1 === b2,
);

const renderBuiltinsListItem = (selectedImports, onPackageSelected, onExportNameSelected) => ({
  item,
}) => (
  <BuiltinsListItem
    key={item}
    name={item}
    selectedExports={selectedImports[item]}
    selected={isPackageSelected(selectedImports, item)}
    onPackageSelected={onPackageSelected}
    onExportNameSelected={onExportNameSelected}
  />
);

const BuiltinsList = ({
  list,
  style,
  selectedImports,
  onPackageSelected,
  onExportNameSelected,
}) => (
  <FlatList
    data={list}
    extraData={selectedImports}
    keyExtractor={(name) => name}
    renderItem={renderBuiltinsListItem(selectedImports, onPackageSelected, onExportNameSelected)}
    style={style}
  />
);

const Builtins = ({ importsFilter, showToolPackages, ...props }) => {
  const list = useMemo(
    () =>
      imports.listImportedModules().filter((name) => {
        if (importsFilter && !name.includes(importsFilter)) {
          return false;
        }

        if (
          !showToolPackages &&
          (name.includes('babel') || name.includes('lodash/') || name.includes('lodash.'))
        ) {
          return false;
        }

        return true;
      }),
    [importsFilter, showToolPackages],
  );

  return <BuiltinsList {...props} list={list} />;
};

const ExternalsListItemView = memo(
  ({
    name,
    selected,
    moduleExports,
    onPress,
    load,
    selectedExports,
    onPackageSelected,
    onExportNameSelected,
  }) => {
    const [exportsList, setExportsList] = useState(
      moduleExports ? Object.keys(moduleExports) : null,
    );

    let loadedBtn = null;
    const handleModuleLoad = useCallback(async () => {
      const exports = await load();
      setExportsList(Object.keys(exports).sort());
    }, []);

    if (exportsList) {
      loadedBtn = (
        <DisabledText style={{ marginHorizontal: 10, fontSize: 12 }}>Loaded</DisabledText>
      );
    } else {
      loadedBtn = (
        <LinkButton
          label="Load"
          onPress={handleModuleLoad}
          style={{ marginHorizontal: 10 }}
          labelStyle={{ fontSize: 12 }}
        />
      );
    }

    return (
      <Section
        label={name}
        numberOfLines={1}
        labelStyle={{ fontSize: 12 }}
        ellipsizeMode="head"
        onExpanded={() => {
          if (!exportsList) {
            handleModuleLoad();
          }
        }}
        headerChildren={
          <>
            {loadedBtn}
            <CheckBoxButton selected={selected} onPress={() => onPackageSelected(name)} />
          </>
        }
      >
        {exportsList
          ? () => (
              <ModuleExportsList
                list={exportsList}
                selectedExports={selectedExports}
                onExportNameSelected={onExportNameSelected}
                importName={name}
              />
            )
          : null}
      </Section>
    );
  },
  (
    { selected: a1, selectedExports: a2, moduleExports: a3 },
    { selected: b1, selectedExports: b2, moduleExports: b3 },
  ) => a1 === b1 && a2 === b2 && a3 === b3,
);

const ExternalsListItem = withCodevalApi(
  connect(
    (state, { name }) => ({
      moduleExports: getCachedModule(state, { name }),
    }),
    (dispatch, { name, codevalApi }) => ({
      load: () => dispatch(loadModule({ name, codevalApi })),
    }),
  )(ExternalsListItemView),
);

const renderExternalsListItem = (selectedImports, onPackageSelected, onExportNameSelected) => ({
  item,
}) => (
  <ExternalsListItem
    key={item}
    name={item}
    selectedExports={selectedImports[item]}
    selected={isPackageSelected(selectedImports, item)}
    onPackageSelected={onPackageSelected}
    onExportNameSelected={onExportNameSelected}
  />
);

const ExternalsList = ({
  list,
  style,
  selectedImports,
  onPackageSelected,
  onExportNameSelected,
}) => (
  <FlatList
    data={list}
    extraData={selectedImports}
    keyExtractor={(name) => name}
    renderItem={renderExternalsListItem(selectedImports, onPackageSelected, onExportNameSelected)}
    style={style}
  />
);

const Externals = connect((state, { importsFilter }) => ({
  list: getAvailableModuleImportList(state).filter(
    (name) => !importsFilter || name.includes(importsFilter),
  ),
}))(ExternalsList);

class ImportToolView extends Component {
  state = {
    showToolPackages: false,
    filterText: '',
    importsFilter: '',
    selectedImports: {},
  };

  handleFilterChange = debounce((importsFilter) => this.setState({ importsFilter }), 1000);

  handleFilterTextChange = (text) => {
    this.setState({ filterText: text });
    this.handleFilterChange(text.length > 1 ? text : '');
  };

  handleModuleLoad = () =>
    this.setState(({ showToolPackages }) => ({ showToolPackages: !showToolPackages }));

  handlePackageSelected = (name) => {
    const { selectedImports } = this.state;

    this.setState({
      selectedImports: togglePackageSelection(selectedImports, name),
    });
  };

  handleExportNameSelected = (packageName, exportName) => {
    const { selectedImports } = this.state;
    const { [packageName]: selectedExports } = selectedImports;

    this.setState({
      selectedImports: {
        ...selectedImports,
        [packageName]: togglePackageExportNameSelection(selectedExports, exportName),
      },
    });
  };

  handleCopy = () => {
    const { copyToClipboard } = this.props;
    const { selectedImports } = this.state;
    const importsStr = buildImports(selectedImports);
    copyToClipboard(importsStr);
  };

  handlePasteToCode = () => {
    const { pasteIntoCode } = this.props;
    const { selectedImports } = this.state;
    const importsStr = buildImports(selectedImports);
    pasteIntoCode(importsStr);
  };

  render() {
    const { close } = this.props;
    const { showToolPackages, filterText, importsFilter, selectedImports } = this.state;

    return (
      <>
        <HGroup>
          <SmallHeaderText>Add Imports</SmallHeaderText>
          <TextInput
            placeholder="Filter package names"
            style={{ flex: 1, marginLeft: 10 }}
            value={filterText}
            onChangeText={this.handleFilterTextChange}
          />
          <IconButton
            iconRenderer={() => (
              <MaterialCommunityIcons name="toolbox" size={24} color={TEXT_COLOR} />
            )}
            selected={showToolPackages}
            onPress={this.handleModuleLoad}
            style={{ marginLeft: 10 }}
          />
        </HGroup>
        <TabView style={{ flex: 1, paddingBottom: 35 }}>
          <TabView.Child label=" Built-in Libraries ">
            <Builtins
              importsFilter={importsFilter}
              showToolPackages={showToolPackages}
              selectedImports={selectedImports}
              setSelectedImports={this.setSelectedImports}
              onPackageSelected={this.handlePackageSelected}
              onExportNameSelected={this.handleExportNameSelected}
            />
          </TabView.Child>
          <TabView.Child label=" External Modules ">
            <Externals
              importsFilter={importsFilter}
              selectedImports={selectedImports}
              onPackageSelected={this.handlePackageSelected}
              onExportNameSelected={this.handleExportNameSelected}
            />
          </TabView.Child>
        </TabView>
        <HGroup style={{ marginTop: 5, height: 35 }}>
          <TextButton label="Cancel" onPress={close} />
          <View style={styles.fullFlex} />
          <TextButton label="Copy" onPress={this.handleCopy} style={{ marginHorizontal: 10 }} />
          <TextButton label="Paste To Code" onPress={this.handlePasteToCode} />
        </HGroup>
      </>
    );
  }
}

const ImportToolModal = withHostedModal(
  ImportToolView,
  ['copyToClipboard', 'pasteIntoCode'],
  {},
  undefined,
  ModalScreen,
);

export const { renderer: importToolScreenRenderer } = ImportToolModal;

const tool = {
  type: 'editor',
  mimeType: ['application/javascript'],
  order: 140,
  iconRenderer: () => <MaterialCommunityIcons name="import" color={TEXT_ACTIVE_COLOR} size={28} />,
  pressHandler: async ({ closeToolsPanel, showModal, editorApi }) => {
    closeToolsPanel();
    showModal({
      renderer: importToolScreenRenderer,
      props: {
        pasteIntoCode: async (imports) => {
          const code = await editorApi.getValue();
          editorApi.setValue(`${imports}${code}`);
        },
        copyToClipboard: (value) => {
          Clipboard.setString(value);
        },
      },
    });
  },
};

export default tool;
