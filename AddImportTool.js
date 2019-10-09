import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { View, FlatList, StyleSheet, Clipboard } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { imports } from '@actualwave/react-native-codeval';

import {
  CheckBox,
  CheckBoxButton,
  TEXT_ACTIVE_COLOR,
  withHostedModal,
  TextButton,
  Text,
  HGroup,
  SmallHeader,
  Section,
  ModalScreen,
} from '@actualwave/react-native-kingnare-style';

import { getModuleVersion } from 'source/package';

const styles = StyleSheet.create({
  fullFlex: { flex: 1 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
});

const capitalizeImport = (name) => name
  .replace(/^[^/]+\//, '')
  .match(/[a-z\d]+/gi)
  .map((part) => (part ? `${part.charAt().toUpperCase()}${part.substr(1)}` : part))
  .join('');

const retrieveModuleExportsList = (name) => {
  const factory = imports.getImportedModule(name);
  const module = factory();

  return Object.keys(module);
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

const buildImports = (selectedImports) => Object.keys(selectedImports)
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

const selectPackageExportName = (selectedExports = {}, exportName) => ({
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

const isPackageExportNameSelected = (selectedExports, exportName) => !!(selectedExports && selectedExports[exportName]);

const togglePackageExportNameSelection = (selectedExports, exportName) => {
  const toggleSelection = isPackageExportNameSelected(selectedExports, exportName)
    ? deselectPackageExportName
    : selectPackageExportName;

  return toggleSelection(selectedExports, exportName);
};

const ModuleExportsListItem = ({ name, selected, onPress }) => <CheckBox label={name} selected={selected} onPress={onPress} />;

const renderModuleExportsListItem = (selectedExports, setSelectedExports, importName) => ({
  item,
}) => {
  const name = item === 'default' ? `default as ${capitalizeImport(importName)}` : item;

  return (
    <ModuleExportsListItem
      key={item}
      name={name}
      selected={isPackageExportNameSelected(selectedExports, item)}
      onPress={() => setSelectedExports(togglePackageExportNameSelection(selectedExports, item))}
    />
  );
};

const ModuleExportsList = ({ importName, list, selectedExports, setSelectedExports }) => (
  <FlatList
    data={list}
    extraData={selectedExports}
    keyExtractor={(name) => name}
    renderItem={renderModuleExportsListItem(selectedExports, setSelectedExports, importName)}
    style={{ marginLeft: 25 }}
  />
);

const ImportsListItem = ({ name, selected, onPress, selectedExports, setSelectedExports }) => {
  const [exportsList, setExportsList] = useState(null);

  const version = getModuleVersion(name);
  const versionText = version ? <Text style={{ marginHorizontal: 10 }}>{version}</Text> : null;

  return (
    <Section
      label={name}
      numberOfLines={1}
      ellipsizeMode="head"
      onExpanded={() => {
        if (!exportsList) {
          setExportsList(retrieveModuleExportsList(name));
        }
      }}
      headerChildren={(
        <>
          {versionText}
          <CheckBoxButton selected={selected} onPress={onPress} />
        </>
)}
    >
      {exportsList ? (
        <ModuleExportsList
          list={exportsList}
          selectedExports={selectedExports}
          setSelectedExports={setSelectedExports}
          importName={name}
        />
      ) : null}
    </Section>
  );
};

const renderImportsListItem = (selectedImports, setSelectedImports) => ({ item }) => (
  <ImportsListItem
    key={item}
    name={item}
    selectedExports={selectedImports[item]}
    setSelectedExports={(selectedExports) => {
      setSelectedImports({
        ...selectedImports,
        [item]: selectedExports,
      });
    }}
    selected={isPackageSelected(selectedImports, item)}
    onPress={() => {
      setSelectedImports(togglePackageSelection(selectedImports, item));
    }}
  />
);

const ImportsList = ({ list, style, selectedImports, setSelectedImports }) => (
  <FlatList
    data={list}
    extraData={selectedImports}
    keyExtractor={(name) => name}
    renderItem={renderImportsListItem(selectedImports, setSelectedImports)}
    style={style}
  />
);

const ImportToolView = ({ list, close, pasteIntoCode, copyToClipboard }) => {
  const [selectedImports, setSelectedImports] = useState({});

  return (
    <>
      <SmallHeader>Add Build-in import</SmallHeader>
      <ImportsList
        list={list}
        selectedImports={selectedImports}
        setSelectedImports={setSelectedImports}
      />
      <HGroup style={{ marginTop: 5 }}>
        <TextButton label="Cancel" onPress={close} />
        <View style={styles.fullFlex} />
        <TextButton
          label="Copy"
          onPress={() => {
            const importsStr = buildImports(selectedImports);
            copyToClipboard(importsStr);
          }}
          style={{ marginHorizontal: 10 }}
        />
        <TextButton
          label="Paste To Code"
          onPress={() => {
            const importsStr = buildImports(selectedImports);
            pasteIntoCode(importsStr);
          }}
        />
      </HGroup>
    </>
  );
};

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
  iconRenderer: () => <MaterialCommunityIcons name="import" color={TEXT_ACTIVE_COLOR} size={28} />,
  pressHandler: async ({ closeToolsPanel, showModal, editorApi }) => {
    closeToolsPanel();
    showModal({
      renderer: importToolScreenRenderer,
      props: {
        list: imports.listImportedModules(),
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
