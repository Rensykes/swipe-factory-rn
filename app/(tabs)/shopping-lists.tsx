import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    createShoppingList,
    deleteItemFromList,
    deleteShoppingList,
    fetchShoppingLists,
    toggleItemChecked,
    updateShoppingListName,
} from '@/store/shoppingListsSlice';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

export default function ShoppingListsScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { lists, loading } = useAppSelector((state) => state.shoppingLists);
  const user = useAppSelector((state) => state.auth.user);
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editListName, setEditListName] = useState('');

  useEffect(() => {
    if (user) {
      dispatch(fetchShoppingLists(user.uid));
    }
  }, [user]);

  const handleToggleExpand = (listId: string) => {
    setExpandedListId(expandedListId === listId ? null : listId);
  };

  const handleToggleItem = async (listId: string, itemId: string, currentChecked: boolean) => {
    await dispatch(toggleItemChecked({ listId, itemId, checked: !currentChecked }));
  };

  const handleDeleteItem = async (listId: string, itemId: string) => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await dispatch(deleteItemFromList({ listId, itemId }));
        },
      },
    ]);
  };

  const handleDeleteList = async (listId: string) => {
    Alert.alert('Delete List', 'Are you sure you want to delete this entire shopping list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await dispatch(deleteShoppingList(listId));
          if (expandedListId === listId) {
            setExpandedListId(null);
          }
        },
      },
    ]);
  };

  const handleCreateList = async () => {
    if (!user || !newListName.trim()) return;
    
    Keyboard.dismiss();
    await dispatch(createShoppingList({ userId: user.uid, name: newListName, items: [] }));
    setNewListName('');
    setShowCreateModal(false);
  };

  const handleEditListName = async (listId: string) => {
    if (!editListName.trim()) return;
    
    await dispatch(updateShoppingListName({ listId, name: editListName }));
    setEditingListId(null);
    setEditListName('');
  };

  const handleShareList = async (listId: string) => {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    const uncheckedItems = list.items.filter(item => !item.checked);
    const checkedItems = list.items.filter(item => item.checked);
    
    let message = `📝 ${list.name}\n\n`;
    
    if (uncheckedItems.length > 0) {
      message += '🛒 To Buy:\n';
      uncheckedItems.forEach((item) => {
        message += `• ${item.ingredient} - ${item.measure}\n`;
      });
    }
    
    if (checkedItems.length > 0) {
      message += '\n✅ Already Got:\n';
      checkedItems.forEach((item) => {
        message += `• ${item.ingredient} - ${item.measure}\n`;
      });
    }

    Alert.alert('Share Shopping List', 'How would you like to share?', [
      {
        text: 'SMS',
        onPress: () => handleShareViaSMS(message),
      },
      {
        text: 'WhatsApp',
        onPress: () => handleShareViaWhatsApp(message),
      },
      {
        text: 'Other',
        onPress: () => handleShareViaOther(message),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const handleShareViaSMS = async (message: string) => {
    const url = Platform.OS === 'ios' 
      ? `sms:&body=${encodeURIComponent(message)}`
      : `sms:?body=${encodeURIComponent(message)}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'SMS is not available on this device');
      }
    } catch (error) {
      console.error('Error opening SMS:', error);
      Alert.alert('Error', 'Failed to open SMS');
    }
  };

  const handleShareViaWhatsApp = async (message: string) => {
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed on this device');
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      Alert.alert('Error', 'Failed to open WhatsApp');
    }
  };

  const handleShareViaOther = async (message: string) => {
    try {
      await Share.share({
        message,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>Please sign in to view shopping lists</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Shopping Lists
        </ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            pressed && styles.createButtonPressed,
          ]}
          onPress={() => setShowCreateModal(true)}>
          <ThemedText style={styles.createButtonText}>+ New</ThemedText>
        </Pressable>
      </View>

      {loading && lists.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A84FF" />
        </View>
      ) : lists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyTitle}>No Shopping Lists Yet</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Create a list or add ingredients from a meal
          </ThemedText>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {lists.map((list) => {
            const isExpanded = expandedListId === list.id;
            const uncheckedCount = list.items.filter(item => !item.checked).length;
            const totalCount = list.items.length;

            return (
              <View key={list.id} style={styles.listCard}>
                <Pressable
                  style={({ pressed }) => [
                    styles.listHeader,
                    pressed && styles.listHeaderPressed,
                  ]}
                  onPress={() => handleToggleExpand(list.id!)}>
                  <View style={styles.listHeaderLeft}>
                    {editingListId === list.id ? (
                      <TextInput
                        style={styles.editInput}
                        value={editListName}
                        onChangeText={setEditListName}
                        onBlur={() => {
                          if (editListName.trim()) {
                            handleEditListName(list.id!);
                          } else {
                            setEditingListId(null);
                            setEditListName('');
                          }
                        }}
                        onSubmitEditing={() => handleEditListName(list.id!)}
                        autoFocus
                      />
                    ) : (
                      <ThemedText style={styles.listName}>{list.name}</ThemedText>
                    )}
                    <ThemedText style={styles.listCount}>
                      {uncheckedCount} of {totalCount} remaining
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.expandIcon}>
                    {isExpanded ? '▼' : '▶'}
                  </ThemedText>
                </Pressable>

                {isExpanded && (
                  <View style={styles.listContent}>
                    {list.items.length === 0 ? (
                      <ThemedText style={styles.emptyListText}>
                        No items in this list yet
                      </ThemedText>
                    ) : (
                      list.items.map((item) => (
                        <View key={item.id} style={styles.itemRow}>
                          <Pressable
                            style={styles.checkboxContainer}
                            onPress={() => handleToggleItem(list.id!, item.id!, item.checked)}>
                            <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                              {item.checked && <ThemedText style={styles.checkmark}>✓</ThemedText>}
                            </View>
                          </Pressable>
                          
                          <View style={styles.itemTextContainer}>
                            <ThemedText
                              style={[
                                styles.itemIngredient,
                                item.checked && styles.itemChecked,
                              ]}>
                              {item.ingredient}
                            </ThemedText>
                            <ThemedText
                              style={[
                                styles.itemMeasure,
                                item.checked && styles.itemChecked,
                              ]}>
                              {item.measure}
                            </ThemedText>
                          </View>

                          <Pressable
                            style={styles.deleteItemButton}
                            onPress={() => handleDeleteItem(list.id!, item.id!)}>
                            <ThemedText style={styles.deleteItemText}>✕</ThemedText>
                          </Pressable>
                        </View>
                      ))
                    )}

                    <View style={styles.listActions}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.actionButton,
                          pressed && styles.actionButtonPressed,
                        ]}
                        onPress={() => {
                          setEditingListId(list.id!);
                          setEditListName(list.name);
                        }}>
                        <ThemedText style={styles.actionButtonText}>✏️ Rename</ThemedText>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [
                          styles.actionButton,
                          pressed && styles.actionButtonPressed,
                        ]}
                        onPress={() => handleShareList(list.id!)}>
                        <ThemedText style={styles.actionButtonText}>📤 Share</ThemedText>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [
                          styles.actionButton,
                          styles.deleteButton,
                          pressed && styles.actionButtonPressed,
                        ]}
                        onPress={() => handleDeleteList(list.id!)}>
                        <ThemedText style={[styles.actionButtonText, styles.deleteButtonText]}>
                          🗑️ Delete
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      {/* Create New List Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <ThemedView style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <ThemedText style={styles.modalTitle}>Create Shopping List</ThemedText>
                    <Pressable
                      onPress={() => {
                        setShowCreateModal(false);
                        setNewListName('');
                      }}
                      style={styles.closeButton}>
                      <ThemedText style={styles.closeButtonText}>✕</ThemedText>
                    </Pressable>
                  </View>

                  <View style={styles.modalBody}>
                    <ThemedText style={styles.label}>List Name</ThemedText>
                    <TextInput
                      style={styles.input}
                      value={newListName}
                      onChangeText={setNewListName}
                      placeholder="e.g., Weekend Cooking"
                      placeholderTextColor="#666"
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleCreateList}
                      blurOnSubmit={true}
                    />

                    <Pressable
                      style={({ pressed }) => [
                        styles.confirmButton,
                        pressed && styles.confirmButtonPressed,
                        !newListName.trim() && styles.disabledButton,
                      ]}
                      onPress={handleCreateList}
                      disabled={!newListName.trim()}>
                      <ThemedText style={styles.confirmButtonText}>Create List</ThemedText>
                    </Pressable>
                  </View>
                </ThemedView>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  createButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createButtonPressed: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#A0A0A0',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  listCard: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  listHeaderPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  listHeaderLeft: {
    flex: 1,
  },
  listName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  listCount: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  expandIcon: {
    fontSize: 16,
    color: '#A0A0A0',
    marginLeft: 12,
  },
  listContent: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
  },
  emptyListText: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    paddingVertical: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  checkboxContainer: {
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0A84FF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  itemTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  itemIngredient: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemMeasure: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 2,
  },
  itemChecked: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  deleteItemButton: {
    padding: 8,
  },
  deleteItemText: {
    fontSize: 18,
    color: '#FF3B30',
  },
  listActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
  },
  deleteButtonText: {
    color: '#FF3B30',
  },
  bottomSpacer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  modalBody: {
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
  editInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 8,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0A84FF',
    marginBottom: 4,
  },
  confirmButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
  },
  confirmButtonPressed: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
});
