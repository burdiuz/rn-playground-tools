import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ScrollView } from 'react-native';
import * as yup from 'yup';
import { withFormik } from 'formik';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {
  VGroup,
  RGroup,
  TextButton,
  SlimHeader,
  FormTextInput,
  FormText,
  CheckBox,
  Small,
  ActiveText,
  ActiveArea,
  TEXT_ACTIVE_COLOR,
  withHostedModal,
  bigModalDefaultStyle,
} from '@actualwave/react-native-kingnare-style';

import {
  withProjectsApi,
  PROJECT_TYPE,
  DIRECTORY_TYPE,
  FILE_TYPE,
} from '@actualwave/rn-playground-projects';

import { Root } from '@actualwave/rn-playground-projects-list';

import FormContainer from 'source/forms/FormContainer';

import FormButtons from 'source/forms/FormButtons';

import withErrorBoundary from 'source/providers/withErrorBoundary';

const CopyFormView = (props) => {
  const {
    values: { name: nameValue, target, directory, move },
    errors: { name: nameError },
    handleSubmit,
    handleChange,
    handleBlur,
    onCancel,
    isSubmitting,
    projectsApi: { readDirectory, getRoot },
    titleRenderer,
    submitTitleRenderer,
  } = props;

  return (
    <FormContainer
      title={titleRenderer(props)}
      buttons={
        <FormButtons
          onSubmit={handleSubmit}
          onCancel={onCancel}
          enabled={!isSubmitting}
          submitTitle={submitTitleRenderer(props)}
        />
      }
    >
      <FormTextInput
        label={directory ? 'Directory Name' : 'File Name'}
        value={nameValue}
        onChangeText={handleChange('name')}
        onBlur={handleBlur('name')}
        errorMessage={nameError}
      />
      <ActiveText>
        Destination:
        {target.name}
      </ActiveText>
      <ActiveArea style={{ flex: 1 }}>
        <ScrollView>
          <Root
            onPress={({ item }) => handleChange('target')(item)}
            readDirectory={readDirectory}
            getRoot={getRoot}
            listItemFilter={({ type }) => type !== FILE_TYPE}
            selectedItem={target}
          />
        </ScrollView>
      </ActiveArea>
      <CheckBox
        selected={move}
        onPress={() => handleChange('move')(!move)}
        label="Move to destination"
        disabled={directory}
      />
    </FormContainer>
  );
};

CopyFormView.propTypes = {
  values: PropTypes.shape({}).isRequired,
  errors: PropTypes.shape({}).isRequired,
  handleChange: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  titleRenderer: PropTypes.func,
  submitTitleRenderer: PropTypes.func,
  handleBlur: PropTypes.func,
  onCancel: PropTypes.func,
};

CopyFormView.defaultProps = {
  handleBlur: undefined,
  onCancel: undefined,
  titleRenderer: ({ isDirectory, values: { move } }) => {
    const action = move ? 'Move' : 'Copy';
    const object = isDirectory ? 'Directory' : 'File';

    return `${action} ${object}`;
  },
  submitTitleRenderer: ({ values: { move } }) => (move ? 'Move' : 'Copy'),
};

const CopyForm = withFormik({
  mapPropsToValues: ({ file, parent = null }) => {
    const directory = file.fs.isDirectory();

    return { name: file.name, directory, target: parent, move: directory };
  },
  validationSchema: () =>
    yup.object().shape({
      name: yup
        .string()
        .matches(/^[^\.]/, 'File name should not start with " . " symbol')
        .matches(
          /^[^|\\?*<":>+[\]\/']+$/,
          'File name should not contain "| \\ ? * < " : > + [ ] / \' " symbols',
        )
        // uses validation schema to retrieve target value
        .fileNotExists(({ parent: { target } }) => target.fs)
        .required('File name is required'),
    }),
  handleSubmit: (values, { props: { onSubmit } }) => onSubmit(values),
  displayName: 'CopyForm',
})(CopyFormView);

CopyForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  parent: PropTypes.shape({ path: PropTypes.func.isRequired }).isRequired,
  file: PropTypes.shape({ name: PropTypes.string.isRequired }).isRequired,
  onCancel: PropTypes.func,
  titleRenderer: PropTypes.func,
  submitTitleRenderer: PropTypes.func,
};

CopyForm.defaultProps = {
  onCancel: undefined,
  titleRenderer: undefined,
  submitTitleRenderer: undefined,
};

// TODO Create file from downloading it from a URL
// TODO Create file from a gist, it loads gist and displays all fies with checkboxes, creates selected files
export class CopyScreen extends Component {
  state = { file: null, parent: null };

  componentDidMount() {
    this.prepareState();
  }

  componentDidUpdate() {
    this.prepareState();
  }

  async prepareState() {
    const {
      projectsApi: { getParent },
      item: file,
    } = this.props;
    const parent = await getParent(file);

    this.setState({ file, parent });
  }

  handleSubmit = async ({ name, target, move }) => {
    const {
      projectsApi: { moveTo, copyTo },
      close,
      item,
    } = this.props;

    const action = move ? moveTo : copyTo;

    const result = await action(item, target.fs.getChildPath(name));

    if (move) {
      item.parentUpdated();
    }

    close();
  };

  handleCancel = () => {
    const { close } = this.props;

    close();
  };

  render() {
    const { onCancel } = this.props;
    const { file, parent } = this.state;

    if (!file) {
      return null;
    }

    return (
      <CopyForm
        {...this.props}
        file={file}
        parent={parent}
        onSubmit={this.handleSubmit}
        onCancel={onCancel && this.handleCancel}
      />
    );
  }
}

const CopyModal = withHostedModal(
  withErrorBoundary(withProjectsApi(CopyScreen)),
  ['onSubmit', 'onCancel'],
  bigModalDefaultStyle,
);

const tool = {
  type: ['file', 'directory', 'project'],
  iconRenderer: () => <FontAwesome name="copy" color={TEXT_ACTIVE_COLOR} size={16} />,
  pressHandler: async ({ item, showModal, closeToolPanel }) => {
    showModal({
      renderer: CopyModal.renderer,
      props: {
        item,
      },
    });

    closeToolPanel();
  },
};

export default tool;
