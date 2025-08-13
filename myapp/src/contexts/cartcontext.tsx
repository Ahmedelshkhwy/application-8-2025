import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// أنواع البيانات
export type CartItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
    stock?: number;
    image?: string;
};

type CartState = {
    items: CartItem[];
    loading: boolean;
};

type CartAction = 
    | { type: 'ADD_ITEM'; item: CartItem }
    | { type: 'REMOVE_ITEM'; id: string }
    | { type: 'UPDATE_QUANTITY'; id: string; quantity: number }
    | { type: 'CLEAR_CART' }
    | { type: 'SET_LOADING'; loading: boolean }
    | { type: 'SET_CART'; items: CartItem[] };

type CartContextType = {
    state: CartState;
    dispatch: React.Dispatch<CartAction>;
    addToCart: (item: CartItem) => boolean;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => boolean;
    clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const initialState: CartState = {
    items: [],
    loading: false,
};

function cartReducer(state: CartState, action: CartAction): CartState {
    switch (action.type) {
        case 'ADD_ITEM':
            const existingItemIndex = state.items.findIndex(item => item.id === action.item.id);
            
            if (existingItemIndex > -1) {
                // إذا كان المنتج موجود، نحدث الكمية
                const updatedItems = [...state.items];
                updatedItems[existingItemIndex] = {
                    ...updatedItems[existingItemIndex],
                    quantity: updatedItems[existingItemIndex].quantity + action.item.quantity
                };
                return {
                    ...state,
                    items: updatedItems
                };
            } else {
                // إذا كان المنتج جديد، نضيفه
                return {
                    ...state,
                    items: [...state.items, action.item]
                };
            }

        case 'REMOVE_ITEM':
            return {
                ...state,
                items: state.items.filter(item => item.id !== action.id)
            };

        case 'UPDATE_QUANTITY':
            return {
                ...state,
                items: state.items.map(item =>
                    item.id === action.id
                        ? { ...item, quantity: action.quantity }
                        : item
                ).filter(item => item.quantity > 0)
            };

        case 'CLEAR_CART':
            return {
                ...state,
                items: []
            };

        case 'SET_LOADING':
            return {
                ...state,
                loading: action.loading
            };

        case 'SET_CART':
            return {
                ...state,
                items: action.items
            };

        default:
            return state;
    }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(cartReducer, initialState);

    // إضافة منتج للسلة محلياً فقط
    const addToCart = (item: CartItem): boolean => {
        try {
            // التحقق من المخزون
            if (item.stock !== undefined && item.stock <= 0) {
                throw new Error('المنتج غير متوفر في المخزون');
            }

            // التحقق من الحد الأقصى
            const existingItem = state.items.find(cartItem => cartItem.id === item.id);
            const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
            const newTotalQuantity = currentQuantityInCart + item.quantity;

            if (item.stock !== undefined && newTotalQuantity > item.stock) {
                throw new Error(`لا يمكن إضافة هذه الكمية! المخزون المتاح: ${item.stock}, الكمية في السلة: ${currentQuantityInCart}`);
            }
            
            // إضافة للسلة المحلية
            dispatch({ type: 'ADD_ITEM', item });
            return true;
        } catch (error) {
            console.error('خطأ في إضافة المنتج للسلة:', error);
            throw error;
        }
    };

    // حذف من السلة محلياً فقط
    const removeFromCart = (id: string) => {
        dispatch({ type: 'REMOVE_ITEM', id });
    };

    // تحديث الكمية محلياً فقط
    const updateQuantity = (id: string, quantity: number): boolean => {
        try {
            const currentItem = state.items.find(item => item.id === id);
            if (!currentItem) return false;

            // التحقق من المخزون
            if (currentItem.stock !== undefined && quantity > currentItem.stock) {
                throw new Error(`الكمية المطلوبة أكبر من المخزون المتاح: ${currentItem.stock}`);
            }

            dispatch({ type: 'UPDATE_QUANTITY', id, quantity });
            return true;
        } catch (error) {
            console.error('خطأ في تحديث الكمية:', error);
            throw error;
        }
    };

    // مسح السلة
    const clearCart = () => {
        console.log('🧹 إفراغ السلة...');
        dispatch({ type: 'CLEAR_CART' });
        console.log('✅ تم إفراغ السلة');
    };

    return (
        <CartContext.Provider value={{ 
            state, 
            dispatch, 
            addToCart, 
            removeFromCart, 
            updateQuantity,
            clearCart
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};