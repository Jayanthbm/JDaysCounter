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
  Card,
  Searchbar,
} from 'react-native-paper';
import {
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  RefreshControl,
  StatusBar,
  InputAccessoryView,
  Keyboard,
  View,
  Text,
  Platform,
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
import {Swipeable, GestureHandlerRootView} from 'react-native-gesture-handler';
const App = () => {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(false);

  const [items, setItems] = useState([]);
  const [updatedData, setUpdatedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
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
          let _date = tmp.date.toString();
          if (_date.length === 1) {
            _date = `0${_date}`;
          }
          const compareDate = moment(
            new Date(`${year}-${monthMap[tmp.month]}-${_date}`),
          );
          let dateDiff = compareDate.diff(currentDate, 'days');
          if (dateDiff < 0) {
            const _year = moment().add(1, 'year').format('YYYY');
            const _currentDate = moment();
            const _compareDate = moment(
              new Date(`${_year}-${monthMap[tmp.month]}-${_date}`),
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
      setFilteredData(sorted);
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
    setDeleteId(null);
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

  function getColor(remainingDays) {
    let colorCode = colorScheme === 'dark' ? '#fff' : '#000';
    if (remainingDays < 20) {
      colorCode = colorScheme === 'dark' ? '#CC0000' : '#ff4444';
    } else if (remainingDays < 50) {
      colorCode = colorScheme === 'dark' ? '#FF8800' : '#ffbb33';
    } else if (remainingDays < 100) {
      colorCode = colorScheme === 'dark' ? '#0099CC' : '#33b5e5';
    } else {
      colorCode = colorScheme === 'dark' ? '#007E33' : '#00C851';
    }
    return colorCode;
  }

  const rightSwipeActions = () => {
    return (
      <TouchableOpacity
        style={styles.deleteSwipeBackground}
        onPress={() => {
          setDeleteModal(true);
        }}>
        <Text style={styles.swipeText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  const leftSwipeActions = () => {
    return (
      <TouchableOpacity
        style={styles.editSwipeBackground}
        onPress={() => {
          setUpdateModal(true);
        }}>
        <Text style={styles.swipeText}>Edit</Text>
      </TouchableOpacity>
    );
  };

  const JList = ({data}) => {
    return (
      <Swipeable
        renderLeftActions={leftSwipeActions}
        onSwipeableLeftOpen={() => {
          setUpdateId(data.id);
          setUpdateName(data.name);
          setUpdateDate(data.date.toString());
          setUpdateMonth(data.month);
          setUpdateRepeat(data.repeat);
        }}
        renderRightActions={rightSwipeActions}
        onSwipeableRightOpen={() => {
          setDeleteId(data.id);
        }}>
        <Card style={styles.cardStyle}>
          <List.Item
            title={data.name}
            description={`In ${data.remainingDays} days`}
            left={props => (
              <List.Icon {...props} icon="calendar-alert" color="#33b5e5" />
            )}
            titleStyle={styles.listTitle}
            titleNumberOfLines={3}
            titleEllipsizeMode="tail"
            descriptionStyle={[
              {...styles.listDescription, color: getColor(data.remainingDays)},
            ]}
          />
          <Card.Actions>
            <Caption style={styles.cardFooterStyle}>
              Repeats {data.repeat}, On {data.date} {data.month}
            </Caption>
          </Card.Actions>
        </Card>
      </Swipeable>
    );
  };

  const inputAccessoryViewID = 'uniqueID';
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colorScheme === 'dark' ? '#121212' : '#f6f6f6',
    },
    textCenter: {
      textAlign: 'center',
    },
    listTitle: {
      color: colorScheme === 'dark' ? '#fff' : '#000',
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    listDescription: {
      fontSize: 16,
      marginBottom: 3,
      fontWeight: '400',
    },
    noData: {
      color: colorScheme === 'dark' ? '#fff' : '#000',
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 20,
      textAlign: 'center',
    },
    inputAccessoryView: {
      height: 45,
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 10,
      backgroundColor: '#f8f8f8',
      borderTopWidth: 1,
      borderTopColor: '#dedede',
      zIndex: 2,
    },
    inputAccessoryViewText: {
      color: '#007aff',
      fontWeight: '600',
      fontSize: 17,
      paddingTop: 1,
      paddingRight: 11,
    },
    cardFooterStyle: {
      fontSize: 15,
      fontWeight: '600',
      textTransform: 'capitalize',
      marginLeft: 20,
    },
    cardStyle: {
      marginBottom: 10,
    },
    deleteSwipeBackground: {
      backgroundColor: colorScheme === 'dark' ? '#CC0000' : '#ff4444',
      justifyContent: 'center',
      alignItems: 'flex-end',
      marginBottom: 10,
    },
    editSwipeBackground: {
      backgroundColor: colorScheme === 'dark' ? '#0099CC' : '#33b5e5',
      justifyContent: 'center',
      alignItems: 'flex-end',
      marginBottom: 10,
    },
    swipeText: {
      color: '#fff',
      paddingHorizontal: 20,
      fontWeight: '600',
      paddingVertical: 20,
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
      color: colorScheme === 'dark' ? '#fff' : '#000',
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
      color: colorScheme === 'dark' ? '#fff' : '#000',
      paddingRight: 30,
    },
  });
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarText, setSnackbarText] = useState('');

  const [searchQuery, setSearchQuery] = React.useState('');

  const onChangeSearch = query => setSearchQuery(query);

  useEffect(() => {
    if (searchQuery.length === 0) {
      setFilteredData(updatedData);
    } else {
      let searchResults = updatedData.filter(function (item) {
        return (
          item.name.toLowerCase().indexOf(searchQuery.toLocaleLowerCase()) > -1
        );
      });
      setFilteredData(searchResults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);
  return (
    <GestureHandlerRootView style={styles.container}>
      <React.Fragment>
        <SafeAreaView style={styles.container}>
          <StatusBar
            animated={true}
            backgroundColor={colorScheme === 'dark' ? '#121212' : '#6200ee'}
            barStyle={colorScheme === 'dark' ? 'dark-content' : 'light-content'}
            hidden={false}
          />
          <AppHeader />
          {loading && (
            <ActivityIndicator
              animating={loading}
              color={colorScheme === 'dark' ? '#BB86FC' : '#6200ee'}
              size="medium"
            />
          )}
          <Searchbar
            placeholder="Search"
            onChangeText={onChangeSearch}
            value={searchQuery}
          />
          {items.length > 0 ? (
            <FlatList
              data={filteredData}
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

        <Dialog
          visible={addModal}
          onDismiss={() => {
            setAddModal(false);
          }}>
          <Dialog.Title>Add New</Dialog.Title>
          <Dialog.Content>
            <Caption>Name</Caption>
            <TextInput
              label="Name"
              value={name}
              mode="outlined"
              onChangeText={text => setName(text)}
              keyboardAppearance={colorScheme === 'dark' ? 'dark' : 'light'}
              inputAccessoryViewID={inputAccessoryViewID}
            />
            <Caption>Repeats</Caption>
            <RNPickerSelect
              onValueChange={value => setRepeat(value)}
              items={[
                {label: 'Yearly', value: 'yearly'},
                {label: 'Monthly', value: 'monthly'},
              ]}
              value={repeat}
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
                  value={month}
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
              inputAccessoryViewID={inputAccessoryViewID}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setAddModal(false);
              }}>
              Cancel
            </Button>
            <Button onPress={addData}>Add</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={updateModal}
          onDismiss={() => {
            setUpdateModal(false);
          }}>
          <Dialog.Title>Editing {updateName}</Dialog.Title>
          <Dialog.Content>
            <Caption>Name</Caption>

            <TextInput
              label="Name"
              value={updateName}
              mode="outlined"
              onChangeText={text => setUpdateName(text)}
              inputAccessoryViewID={inputAccessoryViewID}
            />
            <Caption>Repeats</Caption>
            <RNPickerSelect
              onValueChange={value => setUpdateRepeat(value)}
              items={[
                {label: 'Yearly', value: 'yearly'},
                {label: 'Monthly', value: 'monthly'},
              ]}
              value={updateRepeat}
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
              inputAccessoryViewID={inputAccessoryViewID}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setUpdateModal(false);
              }}>
              Cancel
            </Button>
            <Button onPress={updateItem}>Update</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={deleteModal} onDismiss={() => setDeleteModal(false)}>
          <Dialog.Title>Do you want to delete ?</Dialog.Title>

          <Dialog.Actions>
            <Button onPress={() => setDeleteModal(false)}>Cancel</Button>
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
          duration={2000}
          action={{
            label: 'close',
            onPress: () => {
              setShowSnackbar(false);
            },
          }}>
          {snackbarText}
        </Snackbar>
        {Platform.OS === 'ios' && (
          <InputAccessoryView nativeID={inputAccessoryViewID}>
            <View style={styles.inputAccessoryView}>
              <TouchableOpacity onPress={() => Keyboard.dismiss()}>
                <Text style={styles.inputAccessoryViewText}> Done</Text>
              </TouchableOpacity>
            </View>
          </InputAccessoryView>
        )}
      </React.Fragment>
    </GestureHandlerRootView>
  );
};

export default App;
