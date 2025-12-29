import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ShoppingListItem } from '@/services/firestoreService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addItemsToList, createShoppingList, fetchShoppingLists } from '@/store/shoppingListsSlice';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

interface AddToShoppingListModalProps {
  visible: boolean;
  onClose: () => void;
  ingredients: { ingredient: string; measure: string }[];
}

export default function AddToShoppingListModal({
  visible,
  onClose,
  ingredients,
}: AddToShoppingListModalProps) {
  const dispatch = useAppDispatch();
  const { lists, loading } = useAppSelector((state) => state.shoppingLists);
  const user = useAppSelector((state) => state.auth.user);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (visible && user) {
      dispatch(fetchShoppingLists(user.uid));
    }
  }, [visible, user]);

  const handleAddToExistingList = async (listId: string) => {
    const items: Omit<ShoppingListItem, 'id' | 'addedAt'>[] = ingredients.map((ing) => ({
      ingredient: ing.ingredient,
      measure: ing.measure,
      checked: false,
    }));

    await dispatch(addItemsToList({ listId, items }));
    onClose();
  };

  const handleCreateNewList = async () => {
    if (!user || !newListName.trim()) return;

    setCreating(true);
    const items: Omit<ShoppingListItem, 'id' | 'addedAt'>[] = ingredients.map((ing) => ({
      ingredient: ing.ingredient,
      measure: ing.measure,
      checked: false,
    }));

    await dispatch(createShoppingList({ userId: user.uid, name: newListName, items }));
    setCreating(false);
    setNewListName('');
    setShowCreateNew(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Add to Shopping List</ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <ThemedText style={styles.closeButtonText}>✕</ThemedText>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0A84FF" />
            </View>
          ) : (
            <>
              {!showCreateNew ? (
                <ScrollView style={styles.listContainer}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.createNewButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => setShowCreateNew(true)}>
                    <ThemedText style={styles.createNewButtonText}>
                      + Create New List
                    </ThemedText>
                  </Pressable>

                  {lists.length > 0 ? (
                    <>
                      <ThemedText style={styles.sectionTitle}>
                        Or add to existing list:
                      </ThemedText>
                      {lists.map((list) => (
                        <Pressable
                          key={list.id}
                          style={({ pressed }) => [
                            styles.listItem,
                            pressed && styles.listItemPressed,
                          ]}
                          onPress={() => handleAddToExistingList(list.id!)}>
                          <ThemedText style={styles.listName}>{list.name}</ThemedText>
                          <ThemedText style={styles.listCount}>
                            {list.items.length} items
                          </ThemedText>
                        </Pressable>
                      ))}
                    </>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <ThemedText style={styles.emptyText}>
                        No shopping lists yet. Create one to get started!
                      </ThemedText>
                    </View>
                  )}
                </ScrollView>
              ) : (
                <View style={styles.createFormContainer}>
                  <ThemedText style={styles.label}>List Name</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={newListName}
                    onChangeText={setNewListName}
                    placeholder="e.g., Weekend Cooking"
                    placeholderTextColor="#666"
                    autoFocus
                  />

                  <View style={styles.buttonRow}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.cancelButton,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => {
                        setShowCreateNew(false);
                        setNewListName('');
                      }}>
                      <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.confirmButton,
                        pressed && styles.buttonPressed,
                        (!newListName.trim() || creating) && styles.disabledButton,
                      ]}
                      onPress={handleCreateNewList}
                      disabled={!newListName.trim() || creating}>
                      {creating ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <ThemedText style={styles.confirmButtonText}>Create & Add</ThemedText>
                      )}
                    </Pressable>
                  </View>
                </View>
              )}
            </>
          )}
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  createNewButton: {
    backgroundColor: '#0A84FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  createNewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 12,
  },
  listItem: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  listItemPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
  },
  listCount: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
  },
  createFormContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
