import {enablePromise, openDatabase} from 'react-native-sqlite-storage';

const tableName = 'daysCounter';

enablePromise(true);

export const getDBConnection = async () => {
  return openDatabase({name: 'days-counter.db', location: 'default'});
};

export const createTable = async db => {
  const query = `CREATE TABLE IF NOT EXISTS ${tableName}(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        date INTEGER NOT NULL,
        month TEXT,
        repeat TEXT NOT NULL
    );`;

  await db.executeSql(query);
};

export const getDaysCounterItems = async db => {
  try {
    const items = [];
    const results = await db.executeSql(
      `SELECT id,name,date,month,repeat FROM ${tableName}`,
    );
    results.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        items.push(result.rows.item(index));
      }
    });
    return items;
  } catch (error) {
    console.error(error);
    throw Error(error);
  }
};

export const saveDaysCounterItem = async (db, item) => {
  try {
    const query = `INSERT INTO ${tableName} (name, date, month, repeat) VALUES (?, ?, ?, ?)`;
    const params = [item.name, item.date, item.month, item.repeat];
    await db.executeSql(query, params);
  } catch (error) {
    console.error(error);
    throw Error(error);
  }
};

export const updateDaysCounterItem = async (db, item) => {
  try {
    const query = `UPDATE ${tableName} SET name = ?, date = ?, month = ?, repeat = ? WHERE id = ?`;
    const params = [item.name, item.date, item.month, item.repeat, item.id];
    await db.executeSql(query, params);
  } catch (error) {
    console.error(error);
    throw Error(error);
  }
};

export const deleteDaysCounterItem = async (db, id) => {
  try {
    const query = `DELETE FROM ${tableName} WHERE id = ?`;
    const params = [id];
    await db.executeSql(query, params);
  } catch (error) {
    console.error(error);
    throw Error(error);
  }
};
