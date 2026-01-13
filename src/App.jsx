
import React, { useState, useEffect, useMemo } from 'react';
import { LogIn, BarChart as BarChartIcon, UtensilsCrossed, Settings, LogOut, Loader2, Clock, CheckCircle, XCircle, Edit, Trash2, Info, Inbox, X, Plus, PlusCircle, Star, MessageSquare, ChefHat, Bell, Menu, ToggleLeft, ToggleRight, DollarSign, TrendingUp, CreditCard, Activity, ShoppingBag} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, onSnapshot, orderBy, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { KeepAwake } from '@capgo/capacitor-keep-awake';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";


// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDDFCPcfBKcvrkjqidsXstHqe8Og_3u36k",
  authDomain: "snaccit-7d853.firebaseapp.com",
  projectId: "snaccit-7d853",
  storageBucket: "snaccit-7d853.firebasestorage.app",
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

// --- Orders View Component (Reordered: Active -> Completed -> Failed) ---
const OrdersView = ({ restaurantId, showNotification }) => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const hasPendingRef = React.useRef(false); 
    
    const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
        return localStorage.getItem('snaccit_sound_enabled') === 'true';
    });
    
    const audioRef = React.useRef(new Audio('/alert.mp3')); 

    // --- Audio Logic (Keep Alive & Resume) ---
    useEffect(() => {
        audioRef.current.loop = true;
        audioRef.current.volume = 1.0;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && hasPendingRef.current && isSoundEnabled) {
                audioRef.current.play().catch(e => console.log("Resume failed:", e));
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleVisibilityChange);

        return () => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("focus", handleVisibilityChange);
        };
    }, [isSoundEnabled]);

    const handleToggleSound = () => {
        const newState = !isSoundEnabled;
        setIsSoundEnabled(newState);
        localStorage.setItem('snaccit_sound_enabled', newState);

        if (newState) {
            audioRef.current.play().then(() => {
                if (!hasPendingRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
                showNotification("Sound alerts ON", "success");
            }).catch(() => showNotification("Tap anywhere to enable audio.", "info"));
        } else {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            showNotification("Sound alerts OFF", "info");
        }
    };

    // --- Order Fetching Logic ---
    useEffect(() => {
        if (!restaurantId) { setIsLoading(false); return; };

        const q = query(collection(db, "orders"), where("restaurantId", "==", restaurantId), orderBy("createdAt", "desc"));
        
        let unsubscribe = null;
        
        const startListener = () => {
             if (unsubscribe) unsubscribe();

             unsubscribe = onSnapshot(q, (querySnapshot) => {
                const ordersData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    // Format Timestamp (e.g., "12 Oct, 1:45 PM")
                    const dateObj = data.createdAt?.toDate();
                    const dateStr = dateObj ? dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
                    const timeStr = dateObj ? dateObj.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '';
                    
                    return {
                        id: doc.id, 
                        ...data,
                        placedAtDisplay: `${dateStr}, ${timeStr}` // Formatted string for UI
                    };
                });
                
                setOrders(ordersData);
                setIsLoading(false);

                // Sound Logic
                const hasPending = ordersData.some(order => order.status === 'pending');
                hasPendingRef.current = hasPending;

                if (hasPending && isSoundEnabled) {
                    audioRef.current.play().catch(e => console.log("Autoplay blocked:", e));
                } else {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
            });
        };

        startListener();

        const appStateListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                console.log("App woke up! Forcing data refresh...");
                setIsLoading(true);
                startListener();
            }
        });

        return () => {
            if (unsubscribe) unsubscribe();
            appStateListener.then(f => f.remove());
        };
    }, [restaurantId, isSoundEnabled]);

    const handleUpdateStatus = async (orderId, newStatus) => {
        hasPendingRef.current = false; 
        audioRef.current.pause();
        await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    };

    const statusStyles = {
        awaiting_payment: { borderColor: 'border-gray-400', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
        payment_failed: { borderColor: 'border-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
        pending: { borderColor: 'border-yellow-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
        accepted: { borderColor: 'border-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
        preparing: { borderColor: 'border-indigo-500', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
        ready: { borderColor: 'border-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
        declined: { borderColor: 'border-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
        completed: { borderColor: 'border-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700' }
    };

    // --- GROUPING LOGIC ---
    const activeOrders = orders.filter(o => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status));
    const issueOrders = orders.filter(o => ['payment_failed', 'awaiting_payment'].includes(o.status));
    const completedOrders = orders.filter(o => ['completed', 'declined'].includes(o.status));

    const renderOrderCard = (order) => (
        <div key={order.id} className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${statusStyles[order.status]?.borderColor || 'border-gray-400'} ${order.status === 'pending' ? 'ring-4 ring-yellow-400/50 animate-pulse' : ''}`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg text-gray-800 truncate">{order.userName || 'Customer'}</h3>
                    <p className="text-sm font-medium text-gray-600">{order.userPhone || order.userEmail || 'N/A'}</p>
                    {/* Timestamp Display */}
                    <p className="text-xs text-gray-400 mt-1">Placed: {order.placedAtDisplay}</p>
                </div>
                <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full whitespace-nowrap ml-2 ${statusStyles[order.status]?.bgColor || 'bg-gray-100'} ${statusStyles[order.status]?.textColor || 'text-gray-700'}`}>{order.status.replace('_', ' ')}</span>
            </div>
            <div className="mb-4">
                {order.items.map((item, index) => (
                    <div key={index} className="text-gray-700 flex justify-between items-start border-b border-gray-100 last:border-0 py-1">
                        <span className="font-medium">{item.quantity} x {item.name} <span className="text-xs text-gray-500 font-normal">{item.size ? `(${item.size})` : ''} {item.addons && item.addons.length > 0 ? `+ ${item.addons.join(', ')}` : ''}</span></span>
                    </div>
                ))}
            </div>
            <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-800 text-lg">₹{order.total.toFixed(2)}</span>
                    <span className="flex items-center font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md"><Clock size={16} className="mr-2"/>{order.arrivalTime}</span>
                </div>
                
                {/* Action Buttons based on Status */}
                {order.status === 'pending' && (
                    <div className="mt-4 flex space-x-2">
                        <button onClick={() => handleUpdateStatus(order.id, 'accepted')} className="flex-1 flex items-center justify-center bg-green-500 text-white font-semibold py-3 rounded-lg hover:bg-green-600 shadow-lg transform active:scale-95 transition-transform"><CheckCircle size={18} className="mr-2"/>Accept</button>
                        <button onClick={() => handleUpdateStatus(order.id, 'declined')} className="flex-1 flex items-center justify-center bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300"><XCircle size={18} className="mr-2"/>Decline</button>
                    </div>
                )}
                {order.status === 'accepted' && (
                    <button onClick={() => handleUpdateStatus(order.id, 'preparing')} className="mt-4 w-full flex items-center justify-center bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600"><ChefHat size={18} className="mr-2"/>Start Preparing</button>
                )}
                {order.status === 'preparing' && (
                    <button onClick={() => handleUpdateStatus(order.id, 'ready')} className="mt-4 w-full flex items-center justify-center bg-indigo-500 text-white font-semibold py-3 rounded-lg hover:bg-indigo-600"><Bell size={18} className="mr-2"/>Mark Ready</button>
                )}
                {order.status === 'ready' && (
                    <button onClick={() => handleUpdateStatus(order.id, 'completed')} className="mt-4 w-full flex items-center justify-center bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700"><CheckCircle size={18} className="mr-2"/>Complete Order</button>
                )}
            </div>
        </div>
    );

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Incoming Orders</h1>
                    <p className="text-gray-600 mt-1">Live feed. Keep this tab open to hear alerts.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-3 rounded-full shadow-sm border border-gray-200">
                    <span className={`text-sm font-bold ${isSoundEnabled ? 'text-gray-800' : 'text-gray-400'}`}>
                        {isSoundEnabled ? 'Sound ON' : 'Sound OFF'}
                    </span>
                    <button onClick={handleToggleSound} className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${isSoundEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isSoundEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <SkeletonOrderCard /><SkeletonOrderCard /><SkeletonOrderCard />
                </div>
            ) : orders.length > 0 ? (
                <div className="space-y-12">
                    
                    {/* SECTION 1: ACTIVE ORDERS */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><UtensilsCrossed className="mr-2 text-green-600"/> Active Orders ({activeOrders.length})</h2>
                        {activeOrders.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {activeOrders.map(renderOrderCard)}
                            </div>
                        ) : (
                            <div className="bg-gray-50 border-dashed border-2 border-gray-200 rounded-xl p-8 text-center text-gray-400">
                                <p>No active orders right now.</p>
                            </div>
                        )}
                    </div>

                    {/* SECTION 2: COMPLETED ORDERS (Now appearing second) */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-500 mb-4 flex items-center"><Clock className="mr-2"/> Past Orders</h2>
                        {completedOrders.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-75 hover:opacity-100 transition-opacity">
                                {completedOrders.map(renderOrderCard)}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm italic">No completed history yet.</p>
                        )}
                    </div>

                    {/* SECTION 3: PAYMENT ISSUES (Now appearing last) */}
                    {issueOrders.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-red-700 mb-4 flex items-center"><Info className="mr-2"/> Payment Issues ({issueOrders.length})</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-80">
                                {issueOrders.map(renderOrderCard)}
                            </div>
                        </div>
                    )}

                </div>
            ) : (
                <div className="bg-white p-12 rounded-lg shadow-md text-center">
                    <Inbox size={48} className="mx-auto text-gray-300" />
                    <h3 className="mt-4 text-xl font-semibold text-gray-700">No orders found</h3>
                    <p className="text-gray-500 mt-1">Waiting for new orders to arrive...</p>
                </div>
            )}
        </div>
    );
};


// --- [UPDATED] Menu Item Modal with Image Upload ---
const MenuItemModal = ({ isOpen, onClose, onSave, itemToEdit, showNotification }) => {
    const defaultItem = { name: '', description: '', category: 'Main Course', isVeg: true, sizes: [{ name: 'Regular', price: '', isAvailable: true }], addons: [], imageUrl: '' };
    const [item, setItem] = useState(itemToEdit || defaultItem);
    const [isUploading, setIsUploading] = useState(false); // Loading state for upload

    useEffect(() => {
        setItem(itemToEdit || defaultItem);
    }, [itemToEdit, isOpen]);

    const handleItemChange = (e) => {
        const { name, value, type, checked } = e.target;
        setItem(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    // --- NEW: Handle Image Selection & Upload ---
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 1. Basic Validation
        if (!file.type.startsWith('image/')) {
            showNotification("Please upload a valid image file (PNG, JPG).", "error");
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB Limit
            showNotification("Image is too large. Max size is 2MB.", "error");
            return;
        }

        setIsUploading(true);

        try {
            // 2. Initialize Storage
            const storage = getStorage();
            
            // 3. Create a unique path: menu_items/TIMESTAMP_FILENAME
            // This prevents overwriting files with the same name
            const storageRef = ref(storage, `menu_items/${Date.now()}_${file.name}`);

            // 4. Upload the file
            await uploadBytes(storageRef, file);

            // 5. Get the permanent URL
            const downloadURL = await getDownloadURL(storageRef);

            // 6. Save URL to state (so it saves to Firestore later)
            setItem(prev => ({ ...prev, imageUrl: downloadURL }));
            showNotification("Image uploaded successfully!", "success");

        } catch (error) {
            console.error("Upload failed:", error);
            showNotification("Failed to upload image. Please try again.", "error");
        } finally {
            setIsUploading(false);
        }
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
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input 
                type="text" 
                name="category" 
                value={item.category || ''} 
                onChange={handleItemChange} 
                placeholder="e.g. Beverages, Starters, Chinese" 
                className="mt-1 w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500 outline-none"
                required
            />
            <p className="text-[10px] text-gray-400 mt-1">Common categories: Beverages, Starters, Main Course, Desserts</p>
        </div>
                    <div>
                        <label className="block text-sm font-medium">Description</label>
                        <textarea name="description" value={item.description} onChange={handleItemChange} rows="3" className="mt-1 w-full border rounded-md p-2"></textarea>
                    </div>

                    {/* --- NEW IMAGE UPLOADER UI --- */}
                    <div className="border p-4 rounded-md bg-gray-50">
                        <label className="block text-sm font-medium mb-2">Item Image</label>
                        <div className="flex items-center gap-4">
                            {/* Image Preview Box */}
                            <div className="w-24 h-24 bg-gray-200 rounded-md overflow-hidden flex items-center justify-center border border-gray-300">
                                {isUploading ? (
                                    <Loader2 className="animate-spin text-green-600" />
                                ) : item.imageUrl ? (
                                    <img src={item.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs text-gray-500">No Image</span>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="flex-1">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageUpload} 
                                    className="block w-full text-sm text-slate-500
                                      file:mr-4 file:py-2 file:px-4
                                      file:rounded-full file:border-0
                                      file:text-sm file:font-semibold
                                      file:bg-green-100 file:text-green-700
                                      hover:file:bg-green-200
                                      cursor-pointer"
                                />
                                <p className="text-xs text-gray-500 mt-2">Max size: 2MB. Formats: JPG, PNG.</p>
                                
                                {/* Fallback URL input if they still want to paste manually */}
                                <input 
                                    type="text" 
                                    name="imageUrl" 
                                    value={item.imageUrl} 
                                    onChange={handleItemChange} 
                                    placeholder="Or paste image URL here..." 
                                    className="mt-2 w-full border rounded-md p-2 text-xs bg-white"
                                />
                            </div>
                        </div>
                    </div>
                    {/* ----------------------------- */}

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
                    <button onClick={handleSave} disabled={isUploading} className={`font-semibold py-2 px-4 rounded-lg ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white`}>
                        {isUploading ? 'Uploading...' : 'Save Item'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Settings View Component (Updated with Availability Toggle) ---
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
        // Ensure isAvailable is set for new items
        const dataToSave = { ...itemData, isAvailable: itemData.isAvailable !== false }; 

        if (itemData.id) {
            const itemDocRef = doc(db, "restaurants", restaurantId, "menu", itemData.id);
            const { id, ...dataToUpdate } = dataToSave;
            await updateDoc(itemDocRef, dataToUpdate);
            showNotification("Menu item updated!", "success");
        } else {
            await addDoc(menuCollectionRef, dataToSave);
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

    // --- NEW FUNCTION: Handle Availability Toggle ---
    const handleToggleAvailability = async (item) => {
        try {
            const itemDocRef = doc(db, "restaurants", restaurantId, "menu", item.id);
            // If isAvailable is undefined (old items), treat as true, so toggle makes it false
            const currentStatus = item.isAvailable !== false; 
            await updateDoc(itemDocRef, { isAvailable: !currentStatus });
            showNotification(`Item marked as ${!currentStatus ? 'Available' : 'Unavailable'}`, "info");
        } catch (error) {
            console.error("Error toggling availability:", error);
            showNotification("Failed to update status", "error");
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
                    <div>
                        <label className="block text-sm font-medium">Opening Time</label>
                        <input type="time" name="openingTime" value={details.openingTime || ''} onChange={handleDetailsChange} className="mt-1 w-full border border-gray-300 rounded-md p-2"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Closing Time</label>
                        <input type="time" name="closingTime" value={details.closingTime || ''} onChange={handleDetailsChange} className="mt-1 w-full border border-gray-300 rounded-md p-2"/>
                    </div>
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
                        <thead>
                            <tr className="border-b">
                                <th className="p-2">Name</th>
                                <th className="p-2">Category</th>
                                <th className="p-2">Description</th>
                                <th className="p-2">Price</th>
                                <th className="p-2">Veg</th>
                                {/* New Column Header */}
                                <th className="p-2">Available</th> 
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {menuItems.map(item => (
                                <tr key={item.id} className={`border-b hover:bg-gray-50 ${item.isAvailable === false ? 'opacity-60 bg-gray-50' : ''}`}>
                                    <td className="p-2 font-medium">{item.name}</td>
                                    <td className="p-2 text-xs font-bold text-blue-600 uppercase">{item.category || 'N/A'}</td>
                                    <td className="p-2 text-sm text-gray-600 max-w-xs truncate">{item.description}</td>
                                    <td className="p-2">₹{item.sizes && item.sizes[0] ? item.sizes[0].price : 'N/A'}</td>
                                    <td className="p-2">{item.isVeg ? 'Yes' : 'No'}</td>
                                    {/* New Column Body */}
                                    <td className="p-2">
                                        <button onClick={() => handleToggleAvailability(item)} className="focus:outline-none transition-colors hover:opacity-80">
                                            {item.isAvailable !== false ? (
                                                <ToggleRight size={32} className="text-green-600" />
                                            ) : (
                                                <ToggleLeft size={32} className="text-gray-400" />
                                            )}
                                        </button>
                                    </td>
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

// --- [FINAL COMPLETE] Analytics View Component (Dashboard) ---
const AnalyticsView = ({ restaurantId }) => {
    // State for Metrics
    const [stats, setStats] = useState({ 
        grossSales: 0, 
        netEarnings: 0, 
        mdrFeeAmount: 0, // This holds either the 'Deducted' amount OR the 'Saved' amount
        totalOrders: 0,
        weeklyPayout: 0, // Calculated for Mon-Sun of current week
        avgOrderValue: 0
    });

    // State for Fee Status (Listening to Admin toggle)
    const [isFeeWaived, setIsFeeWaived] = useState(false); 

    // State for Charts
    const [salesTrend, setSalesTrend] = useState([]);
    const [peakHours, setPeakHours] = useState([]);
    const [topItems, setTopItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const STANDARD_MDR = 2.301; 

    // 1. Listen to Real-time Fee Waiver Status from Database
    useEffect(() => {
        if (!restaurantId) return;
        const unsub = onSnapshot(doc(db, "restaurants", restaurantId), (docSnap) => {
            if (docSnap.exists()) {
                // If the field exists and is true, waive fees. Otherwise apply them.
                setIsFeeWaived(docSnap.data().waiveFee === true);
            }
        });
        return () => unsub();
    }, [restaurantId]);

    // 2. Fetch Orders & Calculate Everything
    useEffect(() => {
        if (!restaurantId) { setIsLoading(false); return; };

        const q = query(
            collection(db, "orders"), 
            where("restaurantId", "==", restaurantId),
            where("status", "==", "completed")
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data(),
                createdAtDate: doc.data().createdAt?.toDate() 
            }));
            
            // --- Calculation Variables ---
            let grossSales = 0;
            let mdrFeeAmount = 0;
            let weeklyPayout = 0;
            let hourlyCounts = Array(24).fill(0);
            let itemCounts = {};

            // Calculate "This Week" Start Date (Monday 00:00)
            const now = new Date();
            const startOfWeek = new Date(now);
            const day = startOfWeek.getDay(); // 0 is Sunday
            const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust to get Monday
            startOfWeek.setDate(diff); 
            startOfWeek.setHours(0,0,0,0);

            // Determine the Rate to Apply for Payout Calculation
            const appliedRate = isFeeWaived ? 0 : STANDARD_MDR;

            orders.forEach(order => {
                const orderTotal = order.subtotal || order.total || 0; // Menu Value (Gross)
                const paidAmount = order.total || 0;

                // 1. Gross Sales
                grossSales += orderTotal;
                
                // 2. Fee Logic
                // We calculate the fee value regardless of waiver to show "What you saved" or "What you paid"
                const feeValue = (paidAmount * STANDARD_MDR) / 100;
                mdrFeeAmount += feeValue; 

                // 3. Weekly Payout Logic
                // Check if order is from this week
                if (order.createdAtDate >= startOfWeek) {
                    const deduction = (paidAmount * appliedRate) / 100;
                    weeklyPayout += (orderTotal - deduction);
                }

                // 4. Analytics Data (Charts)
                if (order.createdAtDate) {
                    hourlyCounts[order.createdAtDate.getHours()] += 1;
                }
                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
                    });
                }
            });

            // Final Net Earnings Logic
            // If Waived: Earnings = Gross. 
            // If Applied: Earnings = Gross - Total Fees.
            const netEarnings = isFeeWaived ? grossSales : (grossSales - mdrFeeAmount);

            // --- Chart Data Preparation ---

            // A. Daily Sales (Last 7 Days)
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
            }).reverse();

            const dailyData = last7Days.map(dateStr => {
                const dayTotal = orders
                    .filter(o => o.createdAtDate?.toLocaleDateString('en-CA') === dateStr)
                    .reduce((sum, o) => sum + (o.subtotal || o.total || 0), 0);
                return {
                    date: new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short' }),
                    sales: dayTotal
                };
            });

            // B. Peak Hours
            const peakHoursData = hourlyCounts.map((count, hour) => ({
                hour: `${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`,
                orders: count
            })).filter(h => h.orders > 0);

            // C. Top Items
            const topItemsData = Object.entries(itemCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            setStats({ 
                grossSales, 
                netEarnings, 
                mdrFeeAmount, 
                totalOrders: orders.length, 
                weeklyPayout, 
                avgOrderValue: orders.length > 0 ? grossSales / orders.length : 0 
            });

            setSalesTrend(dailyData);
            setPeakHours(peakHoursData);
            setTopItems(topItemsData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [restaurantId, isFeeWaived]); // Re-run calculations if fee waiver toggles

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-green-500" size={32} /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between md:items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Business Insights</h1>
                    <p className="text-gray-600 mt-1">
                        Status: <span className={`font-bold ${isFeeWaived ? 'text-green-600' : 'text-orange-600'}`}>
                            {isFeeWaived ? 'Zero Commission Plan Active' : 'Standard Partner Plan'}
                        </span>
                    </p>
                </div>
                {/* Weekly Payout Badge */}
                <div className="mt-4 md:mt-0 bg-green-100 border border-green-200 px-4 py-2 rounded-lg flex flex-col items-end shadow-sm">
                    <span className="text-xs font-bold text-green-600 uppercase tracking-wider">This Week's Payout</span>
                    <span className="text-2xl font-black text-green-800">₹{stats.weeklyPayout.toFixed(0)}</span>
                </div>
            </div>
            
            {/* --- 1. KEY METRICS CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Net Earnings Card */}
                <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 bg-white/10 w-24 h-24 rounded-full blur-xl"></div>
                    <p className="text-green-100 font-medium text-sm uppercase tracking-wider">Total Net Earnings</p>
                    <h3 className="text-3xl font-black mt-2">₹{stats.netEarnings.toFixed(0)}</h3>
                    <p className="text-xs text-green-200 mt-2 flex items-center gap-1">
                        <CheckCircle size={12}/> {isFeeWaived ? '100% Revenue Kept' : 'After Deductions'}
                    </p>
                </div>

                {/* DYNAMIC FEE CARD */}
                {isFeeWaived ? (
                    // 1. WAIVED STATE (Purple/Happy)
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden ring-4 ring-purple-100">
                        <div className="absolute -right-6 -bottom-6 bg-white/20 w-32 h-32 rounded-full blur-2xl"></div>
                        <div className="flex justify-between items-start">
                            <p className="text-purple-100 font-bold text-sm uppercase tracking-wider">Fees Waived</p>
                            <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold">You Saved</span>
                        </div>
                        <h3 className="text-4xl font-black mt-2">₹{stats.mdrFeeAmount.toFixed(0)}</h3>
                        <p className="text-xs text-purple-200 mt-2 font-medium flex items-center gap-1">
                            <Star size={12} fill="currentColor"/> Snaccit Partner Benefit
                        </p>
                    </div>
                ) : (
                    // 2. APPLIED STATE (Grey/Neutral)
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">Service Fees Paid</p>
                                <span className="text-xs text-gray-400">Rate: {STANDARD_MDR}%</span>
                            </div>
                            <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs font-bold">- Deducted</span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-700 mt-2">₹{stats.mdrFeeAmount.toFixed(0)}</h3>
                        <p className="text-xs text-gray-400 mt-2">Standard platform fee applied.</p>
                    </div>
                )}

                {/* Total Orders */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">Total Orders</p>
                            <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.totalOrders}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Activity size={24}/></div>
                    </div>
                </div>

                {/* Average Order Value */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">Avg. Order Value</p>
                            <h3 className="text-3xl font-bold text-gray-800 mt-2">₹{stats.avgOrderValue.toFixed(0)}</h3>
                        </div>
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><TrendingUp size={24}/></div>
                    </div>
                </div>
            </div>

            {/* --- 2. CHARTS ROW --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Sales Trend Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Revenue Trend (7 Days)</h2>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={salesTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                <Line type="monotone" dataKey="sales" stroke="#10B981" strokeWidth={4} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Peak Hours Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Peak Order Hours</h2>
                    {peakHours.length > 0 ? (
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={peakHours}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11}} dy={10} />
                                    <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                    <Bar dataKey="orders" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                            <Activity size={48} className="mb-2 opacity-20"/>
                            <p>Not enough data yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- 3. TOP ITEMS SECTION --- */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4">🔥 Top Selling Items</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100 text-gray-400 text-sm">
                                <th className="pb-3 font-semibold">Item Name</th>
                                <th className="pb-3 font-semibold text-right">Quantity Sold</th>
                                <th className="pb-3 font-semibold text-right">Popularity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topItems.length > 0 ? (
                                topItems.map((item, index) => (
                                    <tr key={index} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 font-medium text-gray-800 flex items-center gap-3">
                                            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {index + 1}
                                            </span>
                                            {item.name}
                                        </td>
                                        <td className="py-4 text-right text-gray-600 font-bold">{item.count}</td>
                                        <td className="py-4 text-right">
                                            <div className="w-24 h-2 bg-gray-100 rounded-full ml-auto overflow-hidden">
                                                <div 
                                                    className="h-full bg-green-500 rounded-full" 
                                                    style={{ width: `${(item.count / topItems[0].count) * 100}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="py-8 text-center text-gray-400">No items sold yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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

  // --- KIOSK MODE & NOTIFICATION SETUP ---
  useEffect(() => {
    const setupKioskMode = async () => {

        if (!Capacitor.isNativePlatform()) {
        return; 
      }
      try {
        // 1. Prevent Screen Sleep (The "Kiosk" Feature)
        await KeepAwake.keepAwake();
        console.log("Kiosk Mode: Screen will not sleep.");

        // 2. Request Permissions
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === 'granted') {
          await PushNotifications.register();
        }

        // 3. Create a High-Priority Sound Channel
        // This ensures the sound plays even if the phone is in "Do Not Disturb" or background
        await PushNotifications.createChannel({
            id: 'orders_critical_alarm_v1',
            name: 'New Orders Loud',
            description: 'Rings loudly when a new order arrives',
            importance: 5, // Max importance
            sound: 'alert', // This looks for 'alert.mp3' in res/raw
            visibility: 1,
            vibration: true,
        });

        // 4. Listen for Notifications (Foreground)
        // If the app is open, we can show a nice toast or refresh data immediately
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received:', notification);
            showNotification(`🔔 ${notification.title}`, "success");
            // Optional: You could trigger a refresh here if needed, 
            // but your onSnapshot listener already handles the data.
        });

      } catch (error) {
        console.error("Error setting up Kiosk Mode:", error);
      }
    };

    setupKioskMode();
  }, []);

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
            <div className="relative min-h-screen lg:flex">
                {/* Overlay for mobile */}
                {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-30 lg:hidden"></div>}
                
                {/* Sidebar */}
                <nav className={`fixed top-0 left-0 z-40 w-64 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-green-600">Snaccit</h2>
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-800">
                            <X size={24} />
                        </button>
                    </div>
                    <ul className="py-4">
                        <li onClick={() => handleSetView('orders')} className={`px-6 py-3 flex items-center cursor-pointer ${view === 'orders' ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}><UtensilsCrossed className="mr-3" size={20}/> Incoming Orders</li>
                        <li onClick={() => handleSetView('reviews')} className={`px-6 py-3 flex items-center cursor-pointer ${view === 'reviews' ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}><MessageSquare className="mr-3" size={20}/> Reviews</li>
                        <li onClick={() => handleSetView('analytics')} className={`px-6 py-3 flex items-center cursor-pointer ${view === 'analytics' ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}><BarChartIcon className="mr-3" size={20}/> Analytics</li>
                        <li onClick={() => handleSetView('settings')} className={`px-6 py-3 flex items-center cursor-pointer ${view === 'settings' ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}><Settings className="mr-3" size={20}/> Settings</li>
                    </ul>
                    <div className="absolute bottom-0 w-full p-6 border-t">
                        <button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-2 font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"><LogOut className="mr-2" size={16}/>Logout</button>
                    </div>
                </nav>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col lg:ml-64">
                    {/* Mobile Header */}
                    <header className="bg-white shadow-sm lg:hidden p-4 flex justify-between items-center sticky top-0 z-20">
                        <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600">
                            <Menu size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-green-600">Snaccit Dashboard</h2>
                    </header>
                    
                    {/* Content */}
                    <main className="flex-1 p-6 md:p-10">
                        {renderView()}
                    </main>
                </div>
            </div>
        )}
    </>
  );
};

export default App;
