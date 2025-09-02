import React, { useState, useEffect, useMemo } from 'react';
import { LogIn, BarChart, UtensilsCrossed, Settings, LogOut, Loader2, Clock, CheckCircle, XCircle, Edit, Trash2, Info, Inbox, X, Plus, PlusCircle, Star, MessageSquare, ChefHat, Bell, Menu } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, onSnapshot, orderBy, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDDFCPcfBKcvrkjqidsXstHqe8Og_3u36k",
  authDomain: "snaccit-7d853.firebaseapp.com",
  projectId: "snaccit-7d853",
  storageBucket: "snaccit-7d853.appspot.com",
  messagingSenderId: "523142849231",
  appId: "1:523142849231:web:f10e23785d6451f510cdba"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- Notification Component ---
const Notification = ({ message, type, onDismiss }) => {
    if (!message) return null;
    const baseClasses = "fixed top-5 right-5 p-4 rounded-lg shadow-lg flex items-center z-50 animate-fade-in-down";
    const typeClasses = {
        success: "bg-green-100 text-green-800",
        error: "bg-red-100 text-red-800",
        info: "bg-blue-100 text-blue-800",
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, 5000);
        return () => clearTimeout(timer);
    }, [message, onDismiss]);

    return (
        <div className={`${baseClasses} ${typeClasses[type]}`}>
            <Info size={20} className="mr-3" />
            <span>{message}</span>
            <button onClick={onDismiss} className="ml-4 font-bold opacity-70 hover:opacity-100">
                <X size={18} />
            </button>
        </div>
    );
};


// --- Login Page Component ---
const LoginPage = ({ onShowSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().role === 'restaurant') {
        if (userDoc.data().approvalStatus === 'approved') {
          // Success! onAuthStateChanged listener will handle the view change.
        } else {
          await signOut(auth);
          setError("Your account is pending approval. We will notify you once it's reviewed.");
        }
      } else {
        await signOut(auth);
        setError("Access Denied. This account does not have restaurant privileges.");
      }
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-green-600">Snaccit</h1>
          <p className="mt-2 text-gray-500">Partner Portal Login</p>
        </div>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
          </div>
          {error && <p className="text-sm text-center text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
          <div>
            <button type="submit" disabled={isLoading} className="flex items-center justify-center w-full px-4 py-3 font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
              {isLoading ? <Loader2 className="animate-spin" /> : 'Sign In'}
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button onClick={onShowSignUp} className="font-medium text-green-600 hover:text-green-500">
            Register your restaurant
          </button>
        </p>
      </div>
    </div>
  );
};

// --- SignUp Page Component ---
const SignUpPage = ({ onShowLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [restaurantName, setRestaurantName] = useState('');
    const [fssaiLicense, setFssaiLicense] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const newRestaurantRef = await addDoc(collection(db, "restaurants"), {
                name: restaurantName,
                cuisine: "To be updated",
                imageUrl: "https://placehold.co/600x400/cccccc/ffffff?text=Image+Needed",
                ownerUID: user.uid,
            });

            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                role: 'restaurant',
                approvalStatus: 'pending',
                restaurantId: newRestaurantRef.id,
                fssaiLicense: fssaiLicense,
            });

            setSuccess("Registration successful! Your account is now pending approval. We'll notify you via email once it has been reviewed.");
            await signOut(auth);
        } catch (err) {
            console.error("Registration Error:", err);
            if (err.code === 'auth/email-already-in-use') {
                setError("This email is already registered.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password is too short. It must be at least 6 characters long.");
            }
            else {
                setError("Failed to create account. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 py-12">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-green-600">Snaccit</h1>
            <p className="mt-2 text-gray-500">Restaurant Partner Registration</p>
          </div>
          {success ? (
            <div className="text-center p-8 flex flex-col items-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle size={64} className="text-green-500 transform transition-transform duration-500 scale-110" />
              </div>
              <h2 className="font-bold text-2xl mt-6 text-gray-800">Thank You!</h2>
              <p className="text-gray-600 mt-2">{success}</p>
              <button onClick={onShowLogin} className="mt-8 w-full px-4 py-3 font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700">
                Back to Login
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSignUp}>
              <input type="text" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} placeholder="Restaurant Name" required className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"/>
              <input type="text" value={fssaiLicense} onChange={(e) => setFssaiLicense(e.target.value)} placeholder="FSSAI License Number" required className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"/>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" required className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"/>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"/>
              {error && <p className="text-sm text-center text-red-600">{error}</p>}
              <button type="submit" disabled={isLoading} className="flex items-center justify-center w-full px-4 py-3 font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 disabled:opacity-50">
                {isLoading ? <Loader2 className="animate-spin" /> : 'Register'}
              </button>
            </form>
          )}
          {!success && (
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button onClick={onShowLogin} className="font-medium text-green-600 hover:text-green-500">
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    );
};

// --- Skeleton Loader Component ---
const SkeletonOrderCard = () => (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-200 animate-pulse">
        <div className="flex justify-between items-center mb-4">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="mb-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="border-t pt-4">
            <div className="flex justify-between items-center">
                <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            </div>
        </div>
    </div>
);

// --- Orders View Component ---
const OrdersView = ({ restaurantId, showNotification }) => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!restaurantId) {
            setIsLoading(false);
            return;
        };
        const q = query(collection(db, "orders"), where("restaurantId", "==", restaurantId), orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const ordersData = querySnapshot.docs.map(doc => ({
                id: doc.id, ...doc.data(),
                createdAt: doc.data().createdAt?.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            }));
            setOrders(ordersData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching orders: ", error);
            showNotification("Could not fetch orders. You may be missing a database index.", "error");
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [restaurantId, showNotification]);

    const handleUpdateStatus = async (orderId, newStatus) => {
        await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    };

    const statusStyles = {
        pending: { borderColor: 'border-yellow-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
        accepted: { borderColor: 'border-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
        preparing: { borderColor: 'border-indigo-500', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
        ready: { borderColor: 'border-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
        declined: { borderColor: 'border-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
        completed: { borderColor: 'border-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700' }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Incoming Orders</h1>
            <p className="text-gray-600 mt-2">New pre-orders will appear here in real-time.</p>
            <div className="mt-8">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        <SkeletonOrderCard />
                        <SkeletonOrderCard />
                        <SkeletonOrderCard />
                    </div>
                ) : orders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {orders.map(order => (
                            <div key={order.id} className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${statusStyles[order.status]?.borderColor || 'border-gray-400'}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg truncate">{order.userEmail}</h3>
                                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${statusStyles[order.status]?.bgColor || 'bg-gray-100'} ${statusStyles[order.status]?.textColor || 'text-gray-700'}`}>{order.status}</span>
                                </div>
                                <div className="mb-4">
                                    {order.items.map((item, index) => (
                                        <div key={index} className="text-gray-700">
                                            <span>{item.quantity} x {item.name}</span>
                                            {item.size && <span className="text-xs text-gray-500"> ({item.size})</span>}
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t pt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-gray-800">Total: ₹{order.total.toFixed(2)}</span>
                                        <span className="flex items-center font-bold text-blue-600"><Clock size={16} className="mr-2"/>{order.arrivalTime}</span>
                                    </div>
                                    {order.status === 'pending' && (
                                        <div className="mt-4 flex space-x-2">
                                            <button onClick={() => handleUpdateStatus(order.id, 'accepted')} className="flex-1 flex items-center justify-center bg-green-500 text-white font-semibold py-2 rounded-lg hover:bg-green-600"><CheckCircle size={16} className="mr-2"/>Accept</button>
                                            <button onClick={() => handleUpdateStatus(order.id, 'declined')} className="flex-1 flex items-center justify-center bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-300"><XCircle size={16} className="mr-2"/>Decline</button>
                                        </div>
                                    )}
                                    {order.status === 'accepted' && (
                                        <div className="mt-4">
                                            <button onClick={() => handleUpdateStatus(order.id, 'preparing')} className="w-full flex items-center justify-center bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-600"><ChefHat size={16} className="mr-2"/>Start Preparing</button>
                                        </div>
                                    )}
                                    {order.status === 'preparing' && (
                                        <div className="mt-4">
                                            <button onClick={() => handleUpdateStatus(order.id, 'ready')} className="w-full flex items-center justify-center bg-indigo-500 text-white font-semibold py-2 rounded-lg hover:bg-indigo-600"><Bell size={16} className="mr-2"/>Ready for Pickup</button>
                                        </div>
                                    )}
                                     {order.status === 'ready' && (
                                        <div className="mt-4">
                                            <button onClick={() => handleUpdateStatus(order.id, 'completed')} className="w-full flex items-center justify-center bg-gray-500 text-white font-semibold py-2 rounded-lg hover:bg-gray-600"><CheckCircle size={16} className="mr-2"/>Mark as Completed</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                  <div className="bg-white p-12 rounded-lg shadow-md text-center">
                    <Inbox size={48} className="mx-auto text-gray-300" />
                    <h3 className="mt-4 text-xl font-semibold text-gray-700">No new orders yet</h3>
                    <p className="text-gray-500 mt-1">We'll show new pre-orders here as soon as they come in.</p>
                  </div>
                )}
            </div>
        </div>
    );
};


// --- Menu Item Modal ---
const MenuItemModal = ({ isOpen, onClose, onSave, itemToEdit, showNotification }) => {
    const defaultItem = { name: '', description: '', isVeg: true, sizes: [{ name: 'Regular', price: '' }], addons: [], imageUrl: '' };
    const [item, setItem] = useState(itemToEdit || defaultItem);

    useEffect(() => {
        setItem(itemToEdit || defaultItem);
    }, [itemToEdit, isOpen]);

    const handleItemChange = (e) => {
        const { name, value, type, checked } = e.target;
        setItem(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSizeChange = (index, field, value) => {
        const newSizes = [...item.sizes];
        newSizes[index][field] = field === 'price' ? Number(value) : value;
        setItem(prev => ({ ...prev, sizes: newSizes }));
    };

    const addSize = () => {
        setItem(prev => ({ ...prev, sizes: [...prev.sizes, { name: '', price: '' }] }));
    };

    const removeSize = (index) => {
        if (item.sizes.length <= 1) {
            showNotification("Each item must have at least one size.", "error");
            return;
        }
        const newSizes = item.sizes.filter((_, i) => i !== index);
        setItem(prev => ({ ...prev, sizes: newSizes }));
    };
    
    const handleAddonChange = (index, field, value) => {
        const newAddons = [...item.addons];
        newAddons[index][field] = field === 'price' ? Number(value) : value;
        setItem(prev => ({ ...prev, addons: newAddons }));
    };

    const addAddon = () => {
        setItem(prev => ({ ...prev, addons: [...prev.addons, { name: '', price: '' }] }));
    };

    const removeAddon = (index) => {
        const newAddons = item.addons.filter((_, i) => i !== index);
        setItem(prev => ({ ...prev, addons: newAddons }));
    };

    const handleSave = () => {
        if (!item.name || item.sizes.some(s => !s.name || s.price <= 0)) {
            showNotification("Please fill out the item name and ensure all sizes have a name and a valid price.", "error");
            return;
        }
        onSave(item);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">{item.id ? 'Edit' : 'Add'} Menu Item</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium">Item Name</label>
                        <input type="text" name="name" value={item.name} onChange={handleItemChange} className="mt-1 w-full border rounded-md p-2"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Description</label>
                        <textarea name="description" value={item.description} onChange={handleItemChange} rows="3" className="mt-1 w-full border rounded-md p-2"></textarea>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Item Image URL</label>
                        <input type="text" name="imageUrl" value={item.imageUrl} onChange={handleItemChange} className="mt-1 w-full border rounded-md p-2"/>
                    </div>
                    <div>
                        <label className="flex items-center gap-2"><input type="checkbox" name="isVeg" checked={item.isVeg} onChange={handleItemChange} className="form-checkbox h-4 w-4 text-green-600"/> Is this a vegetarian item?</label>
                    </div>

                    <div className="pt-4 border-t">
                        <h3 className="font-bold mb-2">Sizes & Pricing</h3>
                        {item.sizes.map((size, index) => (
                            <div key={index} className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-md">
                                <input type="text" placeholder="Size Name (e.g., Small)" value={size.name} onChange={(e) => handleSizeChange(index, 'name', e.target.value)} className="w-full border rounded-md p-2"/>
                                <input type="number" placeholder="Price" value={size.price} onChange={(e) => handleSizeChange(index, 'price', e.target.value)} className="w-40 border rounded-md p-2"/>
                                <button onClick={() => removeSize(index)} className="text-red-500 p-2 rounded-full hover:bg-red-100"><Trash2 size={18}/></button>
                            </div>
                        ))}
                        <button onClick={addSize} className="text-sm text-blue-600 font-semibold flex items-center gap-1 mt-2"><PlusCircle size={16}/>Add another size</button>
                    </div>

                    <div className="pt-4 border-t">
                        <h3 className="font-bold mb-2">Optional Add-ons</h3>
                         {item.addons.map((addon, index) => (
                            <div key={index} className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-md">
                                <input type="text" placeholder="Add-on Name (e.g., Extra Cheese)" value={addon.name} onChange={(e) => handleAddonChange(index, 'name', e.target.value)} className="w-full border rounded-md p-2"/>
                                <input type="number" placeholder="Price" value={addon.price} onChange={(e) => handleAddonChange(index, 'price', e.target.value)} className="w-40 border rounded-md p-2"/>
                                <button onClick={() => removeAddon(index)} className="text-red-500 p-2 rounded-full hover:bg-red-100"><Trash2 size={18}/></button>
                            </div>
                        ))}
                        <button onClick={addAddon} className="text-sm text-blue-600 font-semibold flex items-center gap-1 mt-2"><PlusCircle size={16}/>Add an add-on</button>
                    </div>
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <button onClick={onClose} className="mr-2 bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSave} className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700">Save Item</button>
                </div>
            </div>
        </div>
    );
};


// --- Settings View Component (Original Stable Version) ---
const SettingsView = ({ restaurantId, showNotification }) => {
    const [details, setDetails] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    useEffect(() => {
        if (!restaurantId) return;
        
        setIsLoading(true);
        const unsubDetails = onSnapshot(doc(db, "restaurants", restaurantId), (doc) => {
            setDetails(doc.exists() ? doc.data() : null);
        });

        const unsubMenu = onSnapshot(query(collection(db, "restaurants", restaurantId, "menu"), orderBy("name")), (snapshot) => {
            setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        });
        
        return () => { unsubDetails(); unsubMenu(); };
    }, [restaurantId]);

    const handleDetailsChange = (e) => setDetails({ ...details, [e.target.name]: e.target.value });
    
    const handleSaveChanges = async () => {
        await updateDoc(doc(db, "restaurants", restaurantId), details);
        showNotification("Details updated successfully!", "success");
    };

    const handleOpenModalForNew = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleSaveItem = async (itemData) => {
        const menuCollectionRef = collection(db, "restaurants", restaurantId, "menu");
        if (itemData.id) {
            const itemDocRef = doc(db, "restaurants", restaurantId, "menu", itemData.id);
            const { id, ...dataToUpdate } = itemData;
            await updateDoc(itemDocRef, dataToUpdate);
            showNotification("Menu item updated!", "success");
        } else {
            await addDoc(menuCollectionRef, itemData);
            showNotification("Menu item added!", "success");
        }
        setIsModalOpen(false);
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            await deleteDoc(doc(db, "restaurants", restaurantId, "menu", itemId));
            showNotification("Menu item deleted.", "success");
        }
    };

    if (isLoading || !details) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-green-500" size={32} /></div>;
    }

    return (
        <div>
            <MenuItemModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveItem}
                itemToEdit={editingItem}
                showNotification={showNotification}
            />
            <h1 className="text-3xl font-bold text-gray-800">Restaurant Management</h1>
            <p className="text-gray-600 mt-2">Update your restaurant details and manage your menu.</p>
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Your Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium">Name</label><input type="text" name="name" value={details.name} onChange={handleDetailsChange} className="mt-1 w-full border border-gray-300 rounded-md p-2"/></div>
                    <div><label className="block text-sm font-medium">Cuisine</label><input type="text" name="cuisine" value={details.cuisine} onChange={handleDetailsChange} className="mt-1 w-full border border-gray-300 rounded-md p-2"/></div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium">Image URL</label><input type="text" name="imageUrl" value={details.imageUrl} onChange={handleDetailsChange} className="mt-1 w-full border border-gray-300 rounded-md p-2"/></div>
                </div>
                <button onClick={handleSaveChanges} className="mt-4 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700">Save Changes</button>
            </div>
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Manage Menu</h2>
                    <button onClick={handleOpenModalForNew} className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center gap-2"><Plus size={18}/>Add New Item</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="border-b"><th className="p-2">Name</th><th className="p-2">Description</th><th className="p-2">Price</th><th className="p-2">Veg</th><th className="p-2">Actions</th></tr></thead>
                        <tbody>
                            {menuItems.map(item => (
                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2 font-medium">{item.name}</td>
                                    <td className="p-2 text-sm text-gray-600 max-w-xs truncate">{item.description}</td>
                                    <td className="p-2">₹{item.sizes && item.sizes[0] ? item.sizes[0].price : 'N/A'}</td>
                                    <td className="p-2">{item.isVeg ? 'Yes' : 'No'}</td>
                                    <td className="p-2 flex gap-2">
                                        <button onClick={() => handleOpenModalForEdit(item)} className="text-blue-500 hover:text-blue-700"><Edit size={18}/></button>
                                        <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- Analytics View Component ---
const AnalyticsView = ({ restaurantId }) => {
    const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 });
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!restaurantId) {
            setIsLoading(false);
            return;
        };

        const q = query(collection(db, "orders"), where("restaurantId", "==", restaurantId), where("status", "==", "completed"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const completedOrders = snapshot.docs.map(doc => doc.data());
            
            const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
            const totalOrders = completedOrders.length;
            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            setStats({ totalRevenue, totalOrders, avgOrderValue });

            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toLocaleDateString('en-CA');
            }).reverse();

            const dailyRevenue = last7Days.map(dateStr => {
                const dayRevenue = completedOrders
                    .filter(order => order.createdAt?.toDate().toLocaleDateString('en-CA') === dateStr)
                    .reduce((sum, order) => sum + order.total, 0);
                return {
                    date: new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                    revenue: dayRevenue,
                };
            });
            
            setChartData(dailyRevenue);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [restaurantId]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-green-500" size={32} /></div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Sales Analytics</h1>
            <p className="text-gray-600 mt-2">Here's an overview of your performance on Snaccit.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">₹{stats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-gray-500 text-sm font-medium">Total Completed Orders</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalOrders}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-gray-500 text-sm font-medium">Average Order Value</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">₹{stats.avgOrderValue.toFixed(2)}</p>
                </div>
            </div>
             <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Revenue (Last 7 Days)</h2>
                {chartData.length > 0 ? (
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : <p>No sales data available for the last 7 days.</p>}
            </div>
        </div>
    );
};

// --- Star Rating Display Component ---
const StarRating = ({ rating }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(
            <Star key={i} size={20} className={i <= rating ? 'text-amber-400 fill-current' : 'text-gray-300'} />
        );
    }
    return <div className="flex">{stars}</div>;
};

// --- Reviews View Component ---
const ReviewsView = ({ restaurantId }) => {
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!restaurantId) return;
        
        const q = query(collection(db, "reviews"), where("restaurantId", "==", restaurantId), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [restaurantId]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Customer Reviews</h1>
            <p className="text-gray-600 mt-2">See what your customers are saying about you.</p>
            <div className="mt-8 space-y-6">
                {isLoading ? (
                    <p>Loading reviews...</p>
                ) : reviews.length > 0 ? (
                    reviews.map(review => (
                        <div key={review.id} className="bg-white p-6 rounded-lg shadow-md">
                            <div className="flex justify-between items-center mb-2">
                                <StarRating rating={review.rating} />
                                <span className="text-sm text-gray-400">{review.createdAt.toDate().toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-700 italic">"{review.text}"</p>
                            <p className="text-right text-sm font-semibold text-gray-500 mt-2">- {review.userEmail.split('@')[0]}</p>
                        </div>
                    ))
                ) : (
                    <div className="bg-white p-12 rounded-lg shadow-md text-center">
                        <MessageSquare size={48} className="mx-auto text-gray-300" />
                        <h3 className="mt-4 text-xl font-semibold text-gray-700">No reviews yet</h3>
                        <p className="text-gray-500 mt-1">Customer reviews will appear here once they are submitted.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Main App Component ---
const App = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState(null);
  const [view, setView] = useState('orders');
  const [authView, setAuthView] = useState('login');
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        getDoc(userDocRef).then(userDoc => {
          if (userDoc.exists() && userDoc.data().role === 'restaurant' && userDoc.data().approvalStatus === 'approved') {
            setRestaurantId(userDoc.data().restaurantId);
            setUser(user);
          } else {
            setUser(null);
          }
          setIsLoading(false);
        });
      } else {
        setUser(null);
        setRestaurantId(null);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Effect to lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
    return () => {
        document.body.style.overflow = 'auto';
    };
  }, [isSidebarOpen]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleSetView = (newView) => {
    setView(newView);
    setIsSidebarOpen(false);
  };

  const renderView = () => {
    switch(view) {
        case 'orders': return <OrdersView restaurantId={restaurantId} showNotification={showNotification} />;
        case 'settings': return <SettingsView restaurantId={restaurantId} showNotification={showNotification} />;
        case 'analytics': return <AnalyticsView restaurantId={restaurantId} />;
        case 'reviews': return <ReviewsView restaurantId={restaurantId} />;
        default: return <OrdersView restaurantId={restaurantId} showNotification={showNotification} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100"><Loader2 className="animate-spin text-green-600" size={48} /></div>
    );
  }

  return (
    <>
        <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
        {!user ? (
            authView === 'login' ? 
            <LoginPage onShowSignUp={() => setAuthView('signup')} /> : 
            <SignUpPage onShowLogin={() => setAuthView('login')} />
        ) : (
            <div className="flex min-h-screen bg-gray-50">
                 {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-30 lg:hidden"></div>}
                <nav className={`fixed lg:relative z-40 w-64 bg-white shadow-lg h-full flex-shrink-0 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:transform-none`}>
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-green-600">Snaccit</h2>
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-800">
                            <X size={24} />
                        </button>
                    </div>
                    <ul className="py-4">
                        <li onClick={() => handleSetView('orders')} className={`px-6 py-3 flex items-center cursor-pointer ${view === 'orders' ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}><UtensilsCrossed className="mr-3" size={20}/> Incoming Orders</li>
                        <li onClick={() => handleSetView('reviews')} className={`px-6 py-3 flex items-center cursor-pointer ${view === 'reviews' ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}><MessageSquare className="mr-3" size={20}/> Reviews</li>
                        <li onClick={() => handleSetView('analytics')} className={`px-6 py-3 flex items-center cursor-pointer ${view === 'analytics' ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}><BarChart className="mr-3" size={20}/> Analytics</li>
                        <li onClick={() => handleSetView('settings')} className={`px-6 py-3 flex items-center cursor-pointer ${view === 'settings' ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}><Settings className="mr-3" size={20}/> Settings</li>
                    </ul>
                    <div className="absolute bottom-0 w-64 p-6 border-t">
                        <button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-2 font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"><LogOut className="mr-2" size={16}/>Logout</button>
                    </div>
                </nav>
                <div className="flex-1 flex flex-col">
                    <header className="bg-white shadow-md lg:hidden p-4 flex justify-between items-center">
                        <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600">
                            <Menu size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-green-600">Snaccit Dashboard</h2>
                    </header>
                    <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                        {renderView()}
                    </main>
                </div>
            </div>
        )}
    </>
  );
};

export default App;

