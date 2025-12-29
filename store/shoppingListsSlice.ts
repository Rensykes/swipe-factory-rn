import { firestoreService, ShoppingList, ShoppingListItem } from '@/services/firestoreService';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ShoppingListsState {
  lists: ShoppingList[];
  currentList: ShoppingList | null;
  loading: boolean;
  error: string | null;
}

const initialState: ShoppingListsState = {
  lists: [],
  currentList: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchShoppingLists = createAsyncThunk(
  'shoppingLists/fetchAll',
  async (userId: string) => {
    const lists = await firestoreService.getUserShoppingLists(userId);
    return lists;
  }
);

export const createShoppingList = createAsyncThunk(
  'shoppingLists/create',
  async ({ userId, name, items }: { userId: string; name: string; items?: Omit<ShoppingListItem, 'id' | 'addedAt'>[] }) => {
    const listId = await firestoreService.createShoppingList(userId, name, items);
    const list = await firestoreService.getShoppingList(listId);
    return list;
  }
);

export const updateShoppingListName = createAsyncThunk(
  'shoppingLists/updateName',
  async ({ listId, name }: { listId: string; name: string }) => {
    await firestoreService.updateShoppingList(listId, { name });
    const list = await firestoreService.getShoppingList(listId);
    return list;
  }
);

export const addItemsToList = createAsyncThunk(
  'shoppingLists/addItems',
  async ({ listId, items }: { listId: string; items: Omit<ShoppingListItem, 'id' | 'addedAt'>[] }) => {
    await firestoreService.addItemsToShoppingList(listId, items);
    const list = await firestoreService.getShoppingList(listId);
    return list;
  }
);

export const toggleItemChecked = createAsyncThunk(
  'shoppingLists/toggleItem',
  async ({ listId, itemId, checked }: { listId: string; itemId: string; checked: boolean }) => {
    await firestoreService.updateShoppingListItem(listId, itemId, { checked });
    const list = await firestoreService.getShoppingList(listId);
    return list;
  }
);

export const deleteItemFromList = createAsyncThunk(
  'shoppingLists/deleteItem',
  async ({ listId, itemId }: { listId: string; itemId: string }) => {
    await firestoreService.deleteShoppingListItem(listId, itemId);
    const list = await firestoreService.getShoppingList(listId);
    return list;
  }
);

export const deleteShoppingList = createAsyncThunk(
  'shoppingLists/delete',
  async (listId: string) => {
    await firestoreService.deleteShoppingList(listId);
    return listId;
  }
);

export const fetchShoppingList = createAsyncThunk(
  'shoppingLists/fetchOne',
  async (listId: string) => {
    const list = await firestoreService.getShoppingList(listId);
    return list;
  }
);

const shoppingListsSlice = createSlice({
  name: 'shoppingLists',
  initialState,
  reducers: {
    setCurrentList: (state, action: PayloadAction<ShoppingList | null>) => {
      state.currentList = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all lists
      .addCase(fetchShoppingLists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShoppingLists.fulfilled, (state, action) => {
        state.loading = false;
        state.lists = action.payload;
      })
      .addCase(fetchShoppingLists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch shopping lists';
      })
      // Create list
      .addCase(createShoppingList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createShoppingList.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.lists.push(action.payload);
        }
      })
      .addCase(createShoppingList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create shopping list';
      })
      // Update list name
      .addCase(updateShoppingListName.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.lists.findIndex(list => list.id === action.payload!.id);
          if (index !== -1) {
            state.lists[index] = action.payload;
          }
          if (state.currentList?.id === action.payload.id) {
            state.currentList = action.payload;
          }
        }
      })
      // Add items
      .addCase(addItemsToList.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.lists.findIndex(list => list.id === action.payload!.id);
          if (index !== -1) {
            state.lists[index] = action.payload;
          }
          if (state.currentList?.id === action.payload.id) {
            state.currentList = action.payload;
          }
        }
      })
      // Toggle item
      .addCase(toggleItemChecked.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.lists.findIndex(list => list.id === action.payload!.id);
          if (index !== -1) {
            state.lists[index] = action.payload;
          }
          if (state.currentList?.id === action.payload.id) {
            state.currentList = action.payload;
          }
        }
      })
      // Delete item
      .addCase(deleteItemFromList.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.lists.findIndex(list => list.id === action.payload!.id);
          if (index !== -1) {
            state.lists[index] = action.payload;
          }
          if (state.currentList?.id === action.payload.id) {
            state.currentList = action.payload;
          }
        }
      })
      // Delete list
      .addCase(deleteShoppingList.fulfilled, (state, action) => {
        state.lists = state.lists.filter(list => list.id !== action.payload);
        if (state.currentList?.id === action.payload) {
          state.currentList = null;
        }
      })
      // Fetch single list
      .addCase(fetchShoppingList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShoppingList.fulfilled, (state, action) => {
        state.loading = false;
        state.currentList = action.payload;
      })
      .addCase(fetchShoppingList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch shopping list';
      });
  },
});

export const { setCurrentList, clearError } = shoppingListsSlice.actions;
export default shoppingListsSlice.reducer;
