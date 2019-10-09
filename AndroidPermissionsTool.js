import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, PermissionsAndroid } from 'react-native';

import { VGroup, HRule, TextButton, Text, Small } from '@actualwave/react-native-kingnare-style';

/*
https://facebook.github.io/react-native/docs/permissionsandroid

    This Tool should display a modal with all permissions available
    to turn on/off with switches, so user may enable or disable them
    at once.
*/

/*
TODO
    Add to tool configuration
    mimeType: String | String[], -- list of file mime types Tool can work with
    os: String | String[], -- IOS, WINDOWS, ANDROID. Code of OS where Tool can operate.
    type: String | String[] -- EDITOR, FILE, DIRECTORY, PROJECT, GENERAL. Add type of the tool,
          where it's button should be displayed. Different tools receive different arguments.
          File tool will receive file, parent directory and project info objects.
          General tool will not receive anything.
    group: String -- Grouping will allow creating groups of tools surrounded by separators.
                     Not sure if I should do this, need time to think.
    order: Number -- sorting number to sort tools on panel.
*/

/*
TODO
    Add to Code Editor hash of dependencies between mimetype and a list of plugins.
    {
        "application/javascript": [ ... ],
        "text/jsx": "application/javascript",
        "application/javascript-module": "application/javascript",
        "text/javascript": "application/javascript",
        "application/json": [ ... ],
        "text/json": "application/json", // redirect to "application/json"

*/

const PERMISSIONS = [
  {
    name: 'android.permission.READ_CALENDAR',
    description: "Allows an application to read the user's calendar data.",
  },
  {
    name: 'android.permission.WRITE_CALENDAR',
    description: "Allows an application to write the user's calendar data.",
  },
  {
    name: 'android.permission.CAMERA',
    description:
      'Required to be able to access the camera device. This will automatically enforce the uses-feature manifest element for all camera features.',
  },
  {
    name: 'android.permission.READ_CONTACTS',
    description: "Allows an application to read the user's contacts data.",
  },
  {
    name: 'android.permission.WRITE_CONTACTS',
    description: "Allows an application to write the user's contacts data.",
  },
  {
    name: 'android.permission.GET_ACCOUNTS',
    description: 'Allows access to the list of accounts in the Accounts Service.',
  },
  {
    name: 'android.permission.ACCESS_FINE_LOCATION',
    description: 'Allows an app to access precise location.',
  },
  {
    name: 'android.permission.ACCESS_COARSE_LOCATION',
    description: 'Allows an app to access approximate location.',
  },
  {
    name: 'android.permission.RECORD_AUDIO',
    description: 'Allows an application to record audio.',
  },
  {
    name: 'android.permission.READ_PHONE_STATE',
    description:
      'Allows read only access to phone state, including the phone number of the device, current cellular network information, the status of any ongoing calls, and a list of any PhoneAccounts registered on the device.',
  },
  {
    name: 'android.permission.CALL_PHONE',
    description:
      'Allows an application to initiate a phone call without going through the Dialer user interface for the user to confirm the call.',
  },
  {
    name: 'android.permission.READ_CALL_LOG',
    description: "Allows an application to read the user's call log.",
  },
  {
    name: 'android.permission.WRITE_CALL_LOG',
    description: "Allows an application to write (but not read) the user's call log data.",
  },
  {
    name: 'com.android.voicemail.permission.ADD_VOICEMAIL',
    description: 'Allows an application to add voicemails into the system.',
  },
  { name: 'android.permission.USE_SIP', description: 'Allows an application to use SIP service.' },
  {
    name: 'android.permission.PROCESS_OUTGOING_CALLS',
    description:
      '* This constant was deprecated in API level 29.\nAllows an application to see the number being dialed during an outgoing call with the option to redirect the call to a different number or abort the call altogether.',
  },
  {
    name: 'android.permission.BODY_SENSORS',
    description:
      'Allows an application to access data from sensors that the user uses to measure what is happening inside his/her body, such as heart rate.',
  },
  {
    name: 'android.permission.SEND_SMS',
    description: 'Allows an application to send SMS messages.',
  },
  {
    name: 'android.permission.RECEIVE_SMS',
    description: 'Allows an application to receive SMS messages.',
  },
  {
    name: 'android.permission.READ_SMS',
    description: 'Allows an application to read SMS messages.',
  },
  {
    name: 'android.permission.RECEIVE_WAP_PUSH',
    description: 'Allows an application to receive WAP push messages.',
  },
  {
    name: 'android.permission.RECEIVE_MMS',
    description: 'Allows an application to monitor incoming MMS messages.',
  },
  {
    name: 'android.permission.READ_EXTERNAL_STORAGE',
    description:
      'Allows an application to read from external storage. Any app that declares the WRITE_EXTERNAL_STORAGE permission is implicitly granted this permission.',
  },
  {
    name: 'android.permission.WRITE_EXTERNAL_STORAGE',
    description: 'Allows an application to write to external storage.',
  },
];

const styles = StyleSheet.create({
  sliderLabel: { width: 60, textAlign: 'right', marginRight: 10, marginTop: 4 },
  fullFlex: { flex: 1 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  input: { width: 40, marginVertical: 10 },
  inputLabel: { marginLeft: 10, marginRight: 5, marginVertical: 14 },
  inputsRow: { paddingBottom: 0 },
  colorButton: { margin: 5 },
  noHPaddings: { paddingLeft: 0, paddingRight: 0 },
});

const PermissionRow = ({ name, description }) => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const enabled = await PermissionsAndroid.check(name);

      setEnabled(enabled);
    })();
  }, []);

  return (
    <VGroup>
      <Text>{` ${name}`}</Text>
      <Small style={{ marginLeft: 5 }}>{description}</Small>
      <View style={{ alignItems: 'flex-end', marginBottom: 5 }}>
        {enabled ? (
          <TextButton label="Enabled" disabled selected />
        ) : (
          <TextButton
            label="Enable"
            onPress={async () => {
              try {
                const granted = await PermissionsAndroid.request(name);
                /*
                  {
                    title: 'Give new Permission',
                    message: description,
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Decline',
                    buttonPositive: 'Confirm',
                  }
                */
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                  setEnabled(true);
                }
              } catch (err) {
                console.warn(err);
              }
            }}
          />
        )}
      </View>
      <HRule />
    </VGroup>
  );
};

const AndroidPermissionsView = () => (
  <>
    {PERMISSIONS.map(({ name, description }) => (
      <PermissionRow key={name} name={name} description={description} />
    ))}
  </>
);

const tool = {
  title: 'Android Permissions',
  viewRenderer: () => <AndroidPermissionsView />,
  type: 'general',
  order: 1,
};

export default tool;
