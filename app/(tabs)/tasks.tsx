import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Task = {
  id: string;
  text: string;
  done: boolean;
};

export default function TasksScreen() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);

  // Načítanie zo storage pri štarte
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const data = await AsyncStorage.getItem('TASKS');
        if (data) setTasks(JSON.parse(data));
      } catch (e) {
        console.error('Error loading tasks', e);
      }
    };
    loadTasks();
  }, []);

  // Ukladanie pri každej zmene
  useEffect(() => {
    const saveTasks = async () => {
      try {
        await AsyncStorage.setItem('TASKS', JSON.stringify(tasks));
      } catch (e) {
        console.error('Error saving tasks', e);
      }
    };
    saveTasks();
  }, [tasks]);
  const clearStorage = () => {
    Alert.alert('Vymazať všetky úlohy?', 'Týmto sa natrvalo odstránia všetky uložené úlohy.', [
      { text: 'Zrušiť', style: 'cancel' },
      {
        text: 'Vymazať',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.clear();
            setTasks([]);
            console.log('🗑️ AsyncStorage cleared');
          } catch (e) {
            console.error('Error clearing AsyncStorage', e);
          }
        },
      },
    ]);
  };
  const logStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      console.log('📦 AsyncStorage content:', items);
    } catch (e) {
      console.error('Error reading AsyncStorage', e);
    }
  };

  const addTask = () => {
    if (!task.trim()) return;
    const newTask: Task = { id: Date.now().toString(), text: task.trim(), done: false };
    setTasks((prev) => [newTask, ...prev]);
    setTask('');
  };

  const toggleDone = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Vymazať úlohu', 'Ste si itý?', [
      { text: 'Zrušiť', style: 'cancel' },
      { text: 'Vymazať', style: 'destructive', onPress: () => deleteTask(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        <Text style={styles.title}>Moje úlohy</Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Vložte novú úlohu"
            placeholderTextColor="#aaa"
            value={task}
            onChangeText={setTask}
            onSubmitEditing={addTask}
            returnKeyType="done"
          />
          <Button title="Pridať" onPress={addTask} />
        </View>
        <View style={{ marginBottom: 20, alignItems: 'center' }}>
          <Button title="Debug úložiska" onPress={logStorage} />
          <View style={{ marginTop: 10 }} />
          <Button title="Vymazať úložisko" color="red" onPress={clearStorage} />
        </View>

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.taskItem}
              onPress={() => toggleDone(item.id)}
              onLongPress={() => confirmDelete(item.id)}
            >
              <Text style={[styles.taskText, item.done && styles.taskTextDone]}>{item.text}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Zatiaľ žiadne úlohy. Pridajte svoju prvú. 👇</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#282c34' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#61dafb',
    textAlign: 'center',
  },
  inputRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'center' },
  input: {
    flex: 1,
    borderColor: '#61dafb',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    color: '#ffffff',
  },
  separator: { height: 1, backgroundColor: '#61dafb22' },
  taskItem: { paddingVertical: 14 },
  taskText: { color: '#fff', fontSize: 18 },
  taskTextDone: { textDecorationLine: 'line-through', color: '#9bb7c9' },
  empty: { color: '#9bb7c9', textAlign: 'center', marginTop: 40 },
});
