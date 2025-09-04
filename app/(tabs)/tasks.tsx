import { useState } from "react";
import {
    Alert,
    Button,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Task = {
  id: string;
  text: string;
  done: boolean;
};

export default function TasksScreen() {
  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);

  const addTask = () => {
    if (!task.trim()) return;
    const newTask: Task = { id: Date.now().toString(), text: task.trim(), done: false };
    setTasks(prev => [newTask, ...prev]); // nové navrch
    setTask("");
  };

  const toggleDone = (id: string) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const confirmDelete = (id: string) => {
    Alert.alert("Delete task", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTask(id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Tasks</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter a new task"
          placeholderTextColor="#aaa"
          value={task}
          onChangeText={setTask}
          onSubmitEditing={addTask}
          returnKeyType="done"
        />
        <Button title="Add" onPress={addTask} />
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id} // stabilný kľúč
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.taskItem}
            onPress={() => toggleDone(item.id)}          // tap = hotovo/nehotovo
            onLongPress={() => confirmDelete(item.id)}   // long press = zmazať
          >
            <Text style={[styles.taskText, item.done && styles.taskTextDone]}>
              {item.text}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No tasks yet. Add your first one 👇</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#282c34", marginTop: 30 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#61dafb", textAlign: "center" },
  inputRow: { flexDirection: "row", marginBottom: 20, alignItems: "center" },
  input: {
    flex: 1, borderColor: "#61dafb", borderWidth: 1, borderRadius: 5,
    padding: 10, marginRight: 10, color: "#ffffff",
  },
  separator: { height: 1, backgroundColor: "#61dafb22" },
  taskItem: { paddingVertical: 14 },
  taskText: { color: "#fff", fontSize: 18 },
  taskTextDone: { textDecorationLine: "line-through", color: "#9bb7c9" },
  empty: { color: "#9bb7c9", textAlign: "center", marginTop: 40 },
});
