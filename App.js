import {SafeAreaView} from 'react-native';
import React, {useState, useCallback, useEffect} from 'react';
import moment from 'moment';
import {
  Appbar,
  ActivityIndicator,
  Dialog,
  Button,
  Caption,
  TextInput,
  List,
  Snackbar,
  Subheading,
} from 'react-native-paper';
import {
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  StatusBar,
} from 'react-native';
import {
  getDBConnection,
  createTable,
  getDaysCounterItems,
  saveDaysCounterItem,
  updateDaysCounterItem,
  deleteDaysCounterItem,
} from './services/db-service';
const monthMap = {
  January: '01',
  February: '02',
  March: '03',
  April: '04',
  May: '05',
  June: '06',
  July: '07',
  August: '08',
  September: '09',
  October: '10',
  November: '11',
  December: '12',
};
import RNPickerSelect from 'react-native-picker-select';
const App = () => {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(false);

  const [items, setItems] = useState([]);
  const [updatedData, setUpdatedData] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [month, setMonth] = useState('January');
  const [repeat, setRepeat] = useState('yearly');

  const loadDataCallback = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDBConnection();
      await createTable(db);
      const storedItems = await getDaysCounterItems(db);
      setItems(storedItems);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  }, []);

  useEffect(() => {
    loadDataCallback();
  }, [loadDataCallback, reload]);

  useEffect(() => {
    function recalculate() {
      let tmpArray = [];
      for (let i = 0; i < items.length; i++) {
        let tmp = items[i];
        if (tmp.repeat === 'yearly') {
          const year = moment().format('YYYY');
          const currentDate = moment();
          const compareDate = moment(
            new Date(`${year}-${monthMap[tmp.month]}-${tmp.date}`),
          );
          let dateDiff = compareDate.diff(currentDate, 'days');
          if (dateDiff < 0) {
            const _year = moment().add(1, 'year').format('YYYY');
            const _currentDate = moment();
            const _compareDate = moment(
              new Date(`${_year}-${monthMap[tmp.month]}-${tmp.date}`),
            );
            let dateDiff1 = _compareDate.diff(_currentDate, 'days');
            tmp.remainingDays = dateDiff1;
            if (dateDiff1 > 30) {
              tmp.remainingMonths = (dateDiff1 / 30.417).toFixed(2);
            }
          } else {
            tmp.remainingDays = dateDiff;
            if (dateDiff > 30) {
              tmp.remainingMonths = (dateDiff / 30.417).toFixed(2);
            }
          }
          tmpArray.push(tmp);
        }

        if (tmp.repeat === 'monthly') {
          const year = moment().format('YYYY');
          const _month = moment().format('MM');
          let _date = tmp.date.toString();
          if (_date.length === 1) {
            _date = `0${_date}`;
          }
          const currentDate = moment();
          const compareDate = moment(new Date(`${year}-${_month}-${_date}`));
          const dateDiff = compareDate.diff(currentDate, 'days');
          if (dateDiff < 0) {
            const month_ = moment().add(1, 'month').format('MM');
            const _currentDate = moment();
            const _compareDate = moment(new Date(`${year}-${month_}-${_date}`));
            const _dateDiff = _compareDate.diff(_currentDate, 'days');
            tmp.remainingDays = _dateDiff;
          } else {
            tmp.remainingDays = dateDiff;
          }
          tmpArray.push(tmp);
        }
      }
      let sorted = tmpArray.sort(function (a, b) {
        return a.remainingDays - b.remainingDays;
      });
      setUpdatedData(sorted);
    }
    if (items.length > 0) {
      recalculate();
    }
  }, [items]);

  const addData = async () => {
    setLoading(true);
    try {
      const db = await getDBConnection();
      let tmpMoth = month;
      if (repeat === 'monthly') {
        tmpMoth = '';
      }
      const item = {
        name,
        date,
        month: tmpMoth,
        repeat,
      };
      await saveDaysCounterItem(db, item);
      resetValues();
      setShowSnackbar(true);
      setSnackbarText('Item added successfully');
    } catch (error) {
      resetValues();
      console.error(error);
    }
  };

  const [updateModal, setUpdateModal] = useState(false);
  const [updateId, setUpdateId] = useState('');
  const [updateName, setUpdateName] = useState('');
  const [updateDate, setUpdateDate] = useState('');
  const [updateMonth, setUpdateMonth] = useState('January');
  const [updateRepeat, setUpdateRepeat] = useState('yearly');

  const updateItem = async () => {
    setLoading(true);
    try {
      const db = await getDBConnection();
      let tmpMoth = updateMonth;
      if (repeat === 'monthly') {
        tmpMoth = '';
      }
      const _item = {
        id: updateId,
        name: updateName,
        date: parseInt(updateDate, 10),
        month: tmpMoth,
        repeat: updateRepeat,
      };
      await updateDaysCounterItem(db, _item);
      resetValues();
      setShowSnackbar(true);
      setSnackbarText('Item updated successfully');
    } catch (error) {
      console.error(error);
    }
  };

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const deleteItem = async id => {
    setLoading(true);
    try {
      const db = await getDBConnection();
      await deleteDaysCounterItem(db, id);
      resetValues();
      setShowSnackbar(true);
      setSnackbarText('Item deleted successfully');
    } catch (error) {
      console.error(error);
    }
  };

  const resetValues = () => {
    setLoading(false);
    setName('');
    setDate('');
    setMonth('January');
    setRepeat('yearly');
    setAddModal(false);
    setUpdateId('');
    setUpdateName('');
    setUpdateDate('');
    setUpdateMonth('January');
    setUpdateRepeat('yearly');
    setUpdateModal(false);
    setDeleteModal(false);
    setReload(!reload);
  };

  const AppHeader = () => {
    return (
      <Appbar.Header>
        <Appbar.Content
          title="Days Counter"
          subtitle={'Simple Date Counter'}
          titleStyle={styles.textCenter}
          subtitleStyle={styles.textCenter}
        />
        <Appbar.Action
          icon="plus-box"
          onPress={() => setAddModal(true)}
          disabled={loading}
        />
      </Appbar.Header>
    );
  };

  const JList = ({data}) => {
    return (
      <List.Item
        title={data.name}
        description={`${data.remainingDays} days remaining`}
        left={props => (
          <List.Icon {...props} icon="calendar-alert" color="#33b5e5" />
        )}
        right={props => (
          <React.Fragment>
            <TouchableOpacity
              onPress={() => {
                setUpdateModal(true);
                setUpdateId(data.id);
                setUpdateName(data.name);
                setUpdateDate(data.date.toString());
                setUpdateMonth(data.month);
                setUpdateRepeat(data.repeat);
              }}>
              <List.Icon
                {...props}
                icon="circle-edit-outline"
                color="#FF8800"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setDeleteModal(true);
                setDeleteId(data.id);
              }}>
              <List.Icon {...props} icon="delete" color="#ff4444" />
            </TouchableOpacity>
          </React.Fragment>
        )}
        titleStyle={styles.listTitle}
        descriptionStyle={styles.listDescription}
        style={styles.listStyle}
      />
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colorScheme === 'dark' ? '#121212' : '#f6f6f6',
    },
    textCenter: {
      textAlign: 'center',
    },
    picker: {
      backgroundColor: colorScheme === 'dark' ? '#121212' : '#f6f6f6',
      color: colorScheme === 'dark' ? '#fff' : '#000',
    },
    toggleContainer: {
      flexDirection: 'row-reverse',
      marginLeft: 10,
    },
    listTitle: {
      color: colorScheme === 'dark' ? '#fff' : '#000',
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    listDescription: {
      color: colorScheme === 'dark' ? '#fff' : '#000',
      fontSize: 15,
      marginBottom: 3,
    },
    noData: {
      color: colorScheme === 'dark' ? '#fff' : '#000',
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 20,
      textAlign: 'center',
    },
  });

  const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
      fontSize: 16,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderWidth: 1,
      backgroundColor: colorScheme === 'dark' ? '#121212' : '#f6f6f6',
      borderColor: 'gray',
      borderRadius: 4,
      color: 'black',
      paddingRight: 30,
    },
    inputAndroid: {
      fontSize: 16,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderWidth: 0.5,
      backgroundColor: colorScheme === 'dark' ? '#121212' : '#f6f6f6',
      borderColor: 'purple',
      borderRadius: 8,
      color: 'black',
      paddingRight: 30,
    },
  });
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarText, setSnackbarText] = useState('');

  return (
    <React.Fragment>
      <SafeAreaView style={styles.container}>
        <StatusBar
          animated={true}
          backgroundColor={colorScheme === 'dark' ? '#121212' : '#6200ee'}
          barStyle={colorScheme === 'dark' ? 'dark-content' : 'light-content'}
          hidden={false}
        />
        <AppHeader />
        <ActivityIndicator
          animating={loading}
          color={colorScheme === 'dark' ? '#BB86FC' : '#6200ee'}
          size="large"
        />
        {items.length > 0 ? (
          <FlatList
            data={updatedData}
            renderItem={({item}) => <JList data={item} />}
            keyExtractor={item => item.id}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={() => setReload(!reload)}
              />
            }
          />
        ) : (
          <React.Fragment>
            <Subheading style={styles.noData}>No Items found</Subheading>
            <Button
              icon="plus-box"
              mode="text"
              uppercase={false}
              size="large"
              disabled={loading}
              onPress={() => setAddModal(true)}>
              Add Item
            </Button>
          </React.Fragment>
        )}
      </SafeAreaView>

      <Dialog visible={addModal} onDismiss={resetValues}>
        <Dialog.Title>Add New</Dialog.Title>
        <Dialog.Content>
          <Caption>Name</Caption>
          <TextInput
            label="Name"
            value={name}
            mode="outlined"
            onChangeText={text => setName(text)}
            keyboardAppearance={colorScheme === 'dark' ? 'dark' : 'light'}
          />
          <Caption>Repeat</Caption>
          <RNPickerSelect
            onValueChange={value => setRepeat(value)}
            items={[
              {label: 'Yearly', value: 'yearly'},
              {label: 'Monthly', value: 'monthly'},
            ]}
            value={repeat}
            placeholder={{label: 'Select Type', value: 'yearly'}}
            style={pickerSelectStyles}
          />
          {repeat === 'yearly' && (
            <React.Fragment>
              <Caption>Month</Caption>
              <RNPickerSelect
                onValueChange={value => setMonth(value)}
                items={[
                  {label: 'January', value: 'January'},
                  {label: 'February', value: 'February'},
                  {label: 'March', value: 'March'},
                  {label: 'April', value: 'April'},
                  {label: 'May', value: 'May'},
                  {label: 'June', value: 'June'},
                  {label: 'July', value: 'July'},
                  {label: 'August', value: 'August'},
                  {label: 'September', value: 'September'},
                  {label: 'October', value: 'October'},
                  {label: 'November', value: 'November'},
                  {label: 'December', value: 'December'},
                ]}
                value={repeat}
                placeholder={{label: 'Select Month', value: 'January'}}
                style={pickerSelectStyles}
              />
            </React.Fragment>
          )}
          <Caption>Day</Caption>
          <TextInput
            label="Day"
            value={date}
            keyboardType="number-pad"
            mode="outlined"
            onChangeText={text => setDate(text)}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={resetValues}>Cancel</Button>
          <Button onPress={addData}>Add</Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog visible={updateModal} onDismiss={resetValues}>
        <Dialog.Title>Edit {updateName}</Dialog.Title>
        <Dialog.Content>
          <Caption>Name</Caption>
          <TextInput
            label="Name"
            value={updateName}
            mode="outlined"
            onChangeText={text => setUpdateName(text)}
          />
          <Caption>Repeat</Caption>
          <RNPickerSelect
            onValueChange={value => setUpdateRepeat(value)}
            items={[
              {label: 'Yearly', value: 'yearly'},
              {label: 'Monthly', value: 'monthly'},
            ]}
            value={updateRepeat}
            placeholder={{
              label: updateRepeat
                ? updateRepeat === 'yearly'
                  ? 'Yearly'
                  : 'Monthy'
                : 'Select Type',
              value: updateRepeat,
            }}
            style={pickerSelectStyles}
          />
          {updateRepeat === 'yearly' && (
            <React.Fragment>
              <Caption>Month</Caption>
              <RNPickerSelect
                onValueChange={value => setUpdateMonth(value)}
                items={[
                  {label: 'January', value: 'January'},
                  {label: 'February', value: 'February'},
                  {label: 'March', value: 'March'},
                  {label: 'April', value: 'April'},
                  {label: 'May', value: 'May'},
                  {label: 'June', value: 'June'},
                  {label: 'July', value: 'July'},
                  {label: 'August', value: 'August'},
                  {label: 'September', value: 'September'},
                  {label: 'October', value: 'October'},
                  {label: 'November', value: 'November'},
                  {label: 'December', value: 'December'},
                ]}
                value={updateMonth}
                placeholder={{label: 'Select Month', value: updateMonth}}
                style={pickerSelectStyles}
              />
            </React.Fragment>
          )}
          <Caption>Day</Caption>
          <TextInput
            label="Day"
            value={updateDate}
            keyboardType="number-pad"
            mode="outlined"
            onChangeText={text => setUpdateDate(text)}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={resetValues}>Cancel</Button>
          <Button onPress={updateItem}>Update</Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog visible={deleteModal} onDismiss={resetValues}>
        <Dialog.Title>Do you want to delete ?</Dialog.Title>

        <Dialog.Actions>
          <Button onPress={resetValues}>Cancel</Button>
          <Button
            onPress={() => {
              deleteItem(deleteId);
            }}>
            Yes
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        action={{
          label: 'close',
          onPress: () => {
            setShowSnackbar(false);
          },
        }}>
        {snackbarText}
      </Snackbar>
    </React.Fragment>
  );
};

export default App;
