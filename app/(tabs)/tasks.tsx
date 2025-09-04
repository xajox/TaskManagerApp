import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Task = { id: string; text: string; done: boolean; dueDate?: string | null };
type Filter = 'all' | 'active' | 'completed';

const STORAGE_KEY = 'TASKS';
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const todayISO = () => toISODate(new Date());
const addDaysISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toISODate(d);
};

const isToday = (iso?: string | null) => !!iso && iso === todayISO();
const isOverdue = (iso?: string | null) => !!iso && iso < todayISO();

const formatDue = (iso?: string | null) => {
  if (!iso) return '';
  if (iso === todayISO()) return 'Dnes';
  if (iso === addDaysISO(1)) return 'Zajtra';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};

export default function TasksScreen() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const didLoad = useRef(false);

  type DateFilter = 'all' | 'today' | 'overdue';
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const [search, setSearch] = useState('');
  const [q, setQ] = useState(''); // debounced query
  useEffect(() => {
    const id = setTimeout(() => setQ(search.trim().toLowerCase()), 250);
    return () => clearTimeout(id);
  }, [search]);

  // --- Load once
  useEffect(() => {
    const load = async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) setTasks(JSON.parse(data));
      } catch (e) {
        console.error('Chyba pri načítaní úloh', e);
      } finally {
        didLoad.current = true;
      }
    };
    load();
  }, []);

  // --- Save after load
  useEffect(() => {
    if (!didLoad.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)).catch((e) =>
      console.error('Chyba pri ukladaní úloh', e),
    );
  }, [tasks]);
  const setDueDate = (id: string, iso: string | null) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, dueDate: iso } : t)));
  };

  const quickPickDue = (id: string) => {
    Alert.alert('Nastaviť termín', undefined, [
      { text: 'Dnes', onPress: () => setDueDate(id, todayISO()) },
      { text: 'Zajtra', onPress: () => setDueDate(id, addDaysISO(1)) },
      { text: 'Zrušiť termín', onPress: () => setDueDate(id, null), style: 'destructive' },
      { text: 'Zatvoriť', style: 'cancel' },
    ]);
  };

  const todayStr = todayISO();

  // --- Derived
  const visibleTasks = useMemo(() => {
    const byStatus = tasks.filter((t) =>
      filter === 'all' ? true : filter === 'active' ? !t.done : t.done,
    );

    const byDate = byStatus.filter((t) => {
      if (dateFilter === 'all') return true;
      if (!t.dueDate) return false;
      if (dateFilter === 'today') return t.dueDate === todayStr;
      return t.dueDate < todayStr; // overdue
    });

    const bySearch = q ? byDate.filter((t) => t.text.toLowerCase().includes(q)) : byDate;

    return bySearch.slice().sort((a, b) => {
      const aHas = !!a.dueDate;
      const bHas = !!b.dueDate;
      if (aHas && bHas) return a.dueDate!.localeCompare(b.dueDate!);
      if (aHas) return -1;
      if (bHas) return 1;
      return 0;
    });
  }, [tasks, filter, dateFilter, todayStr, q]);

  const itemsLeft = tasks.filter((t) => !t.done).length;
  const leftLabel =
    itemsLeft === 1
      ? '1 úloha zostáva'
      : itemsLeft >= 2 && itemsLeft <= 4
        ? `${itemsLeft} úlohy zostávajú`
        : `${itemsLeft} úloh zostáva`;

  // --- Actions
  const addTask = () => {
    const value = task.trim();
    if (!value) return;
    const newTask: Task = { id: Date.now().toString(), text: value, done: false };
    setTasks((prev) => [newTask, ...prev]);
    setTask('');
    Keyboard.dismiss();
  };

  const toggleDone = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const updateTask = (id: string, text: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Vymazať úlohu?', 'Ste si istý?', [
      { text: 'Zrušiť', style: 'cancel' },
      { text: 'Vymazať', style: 'destructive', onPress: () => deleteTask(id) },
    ]);
  };

  const clearCompleted = () => {
    const hasCompleted = tasks.some((t) => t.done);
    if (!hasCompleted) return;
    Alert.alert('Vyčistiť dokončené?', 'Týmto odstránite všetky dokončené úlohy.', [
      { text: 'Zrušiť', style: 'cancel' },
      {
        text: 'Odstrániť',
        style: 'destructive',
        onPress: () => setTasks((p) => p.filter((t) => !t.done)),
      },
    ]);
  };

  const clearStorage = () => {
    Alert.alert('Vymazať všetky úlohy?', 'Týmto sa natrvalo odstránia všetky uložené úlohy.', [
      { text: 'Zrušiť', style: 'cancel' },
      {
        text: 'Vymazať',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem(STORAGE_KEY);
            setTasks([]);
          } catch (e) {
            console.error('Chyba pri čistení storage', e);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Moje úlohy</Text>
        <Text style={styles.subtitle}>{leftLabel}</Text>
      </View>

      {/* Input card */}
      <View style={styles.card}>
        <View style={styles.inputRow}>
          <Ionicons name="add-circle-outline" size={24} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Pridať novú úlohu…"
            placeholderTextColor="#9fb6c6"
            value={task}
            onChangeText={setTask}
            onSubmitEditing={addTask}
            blurOnSubmit
            returnKeyType="done"
          />
          <Pressable
            onPress={addTask}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
          >
            <Ionicons name="arrow-forward" size={18} color="#0b1a24" />
          </Pressable>
        </View>

        <View style={[styles.inputRow, { marginTop: 8 }]}>
          <Ionicons name="search-outline" size={20} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Hľadať úlohy…"
            placeholderTextColor="#9fb6c6"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {!!search && (
            <Pressable
              onPress={() => setSearch('')}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.btnPressed]}
              accessibilityLabel="Vymazať hľadanie"
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color="#9bb7c9" />
            </Pressable>
          )}
        </View>

        <View style={styles.rowBetween}>
          {/* ĽAVÝ STĹPEC: status + date filtre */}
          <View style={styles.filtersCol}>
            <View style={styles.filtersRow}>
              <Chip label="Všetko" active={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip
                label="Aktívne"
                active={filter === 'active'}
                onPress={() => setFilter('active')}
              />
              <Chip
                label="Dokončené"
                active={filter === 'completed'}
                onPress={() => setFilter('completed')}
              />
            </View>

            <View style={styles.dateFilters}>
              <Text
                onPress={() => setDateFilter('all')}
                style={[styles.dateFilterText, dateFilter === 'all' && styles.dateFilterActive]}
              >
                Všetky termíny
              </Text>
              <Text
                onPress={() => setDateFilter('today')}
                style={[styles.dateFilterText, dateFilter === 'today' && styles.dateFilterActive]}
              >
                Dnes
              </Text>
              <Text
                onPress={() => setDateFilter('overdue')}
                style={[styles.dateFilterText, dateFilter === 'overdue' && styles.dateFilterActive]}
              >
                Po termíne
              </Text>
            </View>
          </View>

          {/* PRAVÝ STĹPEC: akcie */}
          <View style={styles.actionsRight}>
            <ToolbarButton icon="trash-outline" label="Vyčistiť" onPress={clearCompleted} />
            <ToolbarButton icon="server-outline" label="Reset" onPress={clearStorage} />
          </View>
        </View>
      </View>

      {/* List */}
      <FlatList
        contentContainerStyle={visibleTasks.length === 0 ? styles.listEmptyWrap : undefined}
        data={visibleTasks}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            onToggle={() => toggleDone(item.id)}
            onDelete={() => confirmDelete(item.id)}
            onUpdate={(text) => updateTask(item.id, text)}
            onDuePress={() => quickPickDue(item.id)}
            query={q}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="sparkles-outline" size={28} color="#9bb7c9" />
            <Text style={styles.emptyText}>Zatiaľ žiadne úlohy. Pridajte svoju prvú.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

/** Row (checkbox + label/edit + actions) */
function TaskRow({
  task,
  onToggle,
  onDelete,
  onUpdate,
  onDuePress,
  query,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (text: string) => void;
  onDuePress: () => void;
  query: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== task.text) onUpdate(trimmed);
    setEditing(false);
  };

  useEffect(() => {
    setDraft(task.text);
  }, [task.text]);

  const renderHighlighted = (text: string, q: string) => {
    if (!q) return text;
    const re = new RegExp(`(${escapeRegExp(q)})`, 'gi');
    const parts = text.split(re);
    return parts.map((part, i) =>
      re.test(part) ? (
        <Text key={i} style={styles.highlight}>
          {part}
        </Text>
      ) : (
        part
      ),
    );
  };

  return (
    <View style={styles.row}>
      {/* Checkbox */}
      <Pressable onPress={onToggle} hitSlop={8} style={styles.checkbox}>
        <Ionicons
          name={task.done ? 'checkbox' : 'square-outline'}
          size={22}
          color={task.done ? '#61dafb' : '#5f7b90'}
        />
      </Pressable>

      {/* Label / Editor */}
      <Pressable
        onLongPress={() => setEditing(true)}
        style={{ flex: 1, justifyContent: 'center' }}
        disabled={editing}
      >
        {editing ? (
          <TextInput
            ref={inputRef}
            value={draft}
            onChangeText={setDraft}
            onBlur={commit}
            onSubmitEditing={commit}
            returnKeyType="done"
            style={[styles.taskText, styles.editInput]}
          />
        ) : (
          <View style={{ flexDirection: 'column' }}>
            <Text style={[styles.taskText, task.done && styles.taskTextDone]} numberOfLines={3}>
              {renderHighlighted(task.text, query)} {/* ← NÁHRADA */}
            </Text>
            {task.dueDate ? (
              <Text
                style={[
                  styles.dueBadge,
                  isOverdue(task.dueDate)
                    ? styles.dueOverdue
                    : isToday(task.dueDate)
                      ? styles.dueToday
                      : styles.dueFuture,
                ]}
              >
                {formatDue(task.dueDate)}
              </Text>
            ) : null}
          </View>
        )}
      </Pressable>

      {/* Actions */}
      <View style={styles.rowActions}>
        {!editing && (
          <>
            <IconButton icon="calendar-outline" onPress={onDuePress} accessibilityLabel="Termín" />
            <IconButton
              icon="create-outline"
              onPress={() => setEditing(true)}
              accessibilityLabel="Upraviť"
            />
          </>
        )}
        <IconButton icon="trash-outline" onPress={onDelete} accessibilityLabel="Vymazať" />
      </View>
    </View>
  );
}

/** Small UI atoms */
function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.btnPressed,
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ToolbarButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.toolbarBtn, pressed && styles.btnPressed]}
    >
      <Ionicons name={icon} size={16} color="#0b1a24" />
      <Text style={styles.toolbarBtnText}>{label}</Text>
    </Pressable>
  );
}

function IconButton({
  icon,
  onPress,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.iconBtn, pressed && styles.btnPressed]}
    >
      <Ionicons name={icon} size={18} color="#9bb7c9" />
    </Pressable>
  );
}

/** Styles */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b1a24' },

  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#e7f3fb',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 6,
    textAlign: 'center',
    color: '#9bb7c9',
    fontSize: 14,
  },

  card: {
    margin: 16,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#102330',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#183343',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  highlight: {
    backgroundColor: '#2a6b88',
    borderRadius: 4,
    paddingHorizontal: 2,
  },
  filtersCol: { flex: 1, flexDirection: 'column', gap: 8, minWidth: 0 },
  filtersRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  dateFilters: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  dateFilterText: { color: '#9bb7c9', paddingVertical: 4, paddingHorizontal: 2 },
  dateFilterActive: { color: '#61dafb', fontWeight: '700' },

  actionsRight: { flexDirection: 'row', gap: 8, flexShrink: 0 },
  dueBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 12,
    overflow: 'hidden',
    color: '#0b1a24',
  },
  dueToday: { backgroundColor: '#61dafb' },
  dueOverdue: { backgroundColor: '#ff6b6b' },
  dueFuture: { backgroundColor: '#9bb7c9' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f1f2b',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1b3a4d',
  },
  inputIcon: { color: '#61dafb' },
  input: {
    flex: 1,
    paddingVertical: 8,
    color: '#e7f3fb',
    fontSize: 16,
  },
  primaryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#61dafb',
    borderRadius: 10,
  },
  btnPressed: { opacity: 0.7 },

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  chips: { flexDirection: 'row', gap: 8, flexShrink: 1, flexWrap: 'wrap' },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2a4c60',
    backgroundColor: '#0f1f2b',
  },
  chipActive: { backgroundColor: '#143245', borderColor: '#2a6b88' },
  chipText: { color: '#9bb7c9', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#d6f1ff' },

  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#61dafb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  toolbarBtnText: { color: '#0b1a24', fontSize: 13, fontWeight: '700' },

  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#193446', marginLeft: 54 },

  listEmptyWrap: { flexGrow: 1, justifyContent: 'center' },

  empty: { alignItems: 'center', gap: 8, padding: 24 },
  emptyText: { color: '#9bb7c9', fontSize: 14 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  checkbox: { width: 36, alignItems: 'center' },

  taskText: { color: '#e7f3fb', fontSize: 16, lineHeight: 22 },
  taskTextDone: { color: '#7fa0b3', textDecorationLine: 'line-through' },
  editInput: {
    paddingVertical: 2,
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a6b88',
  },

  rowActions: { flexDirection: 'row', gap: 8, marginLeft: 8 },
  iconBtn: { padding: 4 },
});
