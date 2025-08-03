
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  User, 
  Plus,
  Minus,
  X,
  Package,
  Settings,
  LogOut,
  Eye,
  Edit,
  Trash2,
  Crown,
  Zap,
  Shield,
  Award
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { 
  Product, 
  Category, 
  User as UserType, 
  CartItem,
  Order,
  WishlistItem,
  LoginInput,
  RegisterUserInput,
  GetProductsInput
} from '../../server/src/schema';

// Types for enhanced product display
interface CartItemWithProduct extends CartItem {
  product: Product;
}

interface OrderWithItems extends Order {
  items: Array<{
    id: number;
    product: Product;
    quantity: number;
    price_at_time: number;
  }>;
}

function App() {
  // Authentication state
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Main data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);

  // UI state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<{min?: number, max?: number}>({});
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Admin state
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);

  // Form state
  const [loginForm, setLoginForm] = useState<LoginInput>({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState<RegisterUserInput>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: null
  });

  // Load initial data
  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const filters: GetProductsInput = {};
      if (selectedCategory) filters.category_id = selectedCategory;
      if (searchQuery) filters.search = searchQuery;
      if (priceRange.min) filters.min_price = priceRange.min;
      if (priceRange.max) filters.max_price = priceRange.max;
      if (selectedBrand) filters.brand = selectedBrand;

      const result = await trpc.getProducts.query(filters);
      setProducts(result);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }, [selectedCategory, searchQuery, priceRange, selectedBrand]);

  const loadUserData = useCallback(async () => {
    if (!user) return;
    
    try {
      // Load cart items
      const cartResult = await trpc.getCartItems.query(user.id);
      // Transform cart items to include product data (stub implementation)
      const cartWithProducts: CartItemWithProduct[] = cartResult.map((item: CartItem) => ({
        ...item,
        product: products.find((p: Product) => p.id === item.product_id) || {
          id: item.product_id,
          name: 'Unknown Product',
          price: 0,
          image_urls: [],
          brand: '',
          model: '',
          description: null,
          stock_quantity: 0,
          category_id: 0,
          specifications: null,
          is_featured: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      }));
      setCartItems(cartWithProducts);

      // Load wishlist
      const wishlistResult = await trpc.getWishlistItems.query(user.id);
      setWishlistItems(wishlistResult);

      // Load orders
      const ordersResult = await trpc.getUserOrders.query(user.id);
      // Transform orders to include items (stub implementation)
      const ordersWithItems: OrderWithItems[] = ordersResult.map((order: Order) => ({
        ...order,
        items: [] // Stub - would need separate API call for order items
      }));
      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }, [user, products]);

  const loadAdminData = useCallback(async () => {
    if (!user?.is_admin) return;
    
    try {
      const allProducts = await trpc.getProducts.query();
      setAdminProducts(allProducts);
      
      const allOrders = await trpc.getAllOrders.query();
      setAdminOrders(allOrders);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  }, [user]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Authentication handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const result = await trpc.loginUser.mutate(loginForm);
      setUser(result);
      setIsLoginOpen(false);
      setLoginForm({ email: '', password: '' });
    } catch {
      setError('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const result = await trpc.registerUser.mutate(registerForm);
      setUser(result);
      setIsRegisterOpen(false);
      setRegisterForm({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: null
      });
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCartItems([]);
    setWishlistItems([]);
    setOrders([]);
    setActiveTab('home');
  };

  // Cart handlers
  const addToCart = async (productId: number, quantity: number = 1) => {
    if (!user) {
      setError('Please login to add items to cart');
      return;
    }

    try {
      await trpc.addToCart.mutate({
        user_id: user.id,
        product_id: productId,
        quantity
      });
      loadUserData();
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const updateCartQuantity = async (cartItemId: number, quantity: number) => {
    try {
      await trpc.updateCartItem.mutate({ id: cartItemId, quantity });
      loadUserData();
    } catch (error) {
      console.error('Failed to update cart:', error);
    }
  };

  const removeFromCartHandler = async (cartItemId: number) => {
    try {
      await trpc.removeFromCart.mutate(cartItemId);
      loadUserData();
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    }
  };

  // Wishlist handlers
  const toggleWishlist = async (productId: number) => {
    if (!user) {
      setError('Please login to manage your wishlist');
      return;
    }

    const isInWishlist = wishlistItems.some((item: WishlistItem) => item.product_id === productId);
    
    try {
      if (isInWishlist) {
        await trpc.removeFromWishlist.mutate({ user_id: user.id, product_id: productId });
      } else {
        await trpc.addToWishlist.mutate({ user_id: user.id, product_id: productId });
      }
      loadUserData();
    } catch (error) {
      console.error('Failed to update wishlist:', error);
    }
  };

  // Filter helpers
  const getUniquesBrands = () => {
    return [...new Set(products.map((p: Product) => p.brand))];
  };

  const filteredProducts = products.filter((product: Product) => {
    if (selectedCategory && product.category_id !== selectedCategory) return false;
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !product.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (priceRange.min && product.price < priceRange.min) return false;
    if (priceRange.max && product.price > priceRange.max) return false;
    if (selectedBrand && product.brand !== selectedBrand) return false;
    return true;
  });

  const featuredProducts = products.filter((p: Product) => p.is_featured).slice(0, 6);

  const getTotalCartPrice = () => {
    return cartItems.reduce((total: number, item: CartItemWithProduct) => 
      total + (item.product.price * item.quantity), 0
    );
  };

  // Render components
  const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const isInWishlist = wishlistItems.some((item: WishlistItem) => item.product_id === product.id);
    
    return (
      <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-0">
          <div className="relative overflow-hidden rounded-t-lg">
            <img 
              src={product.image_urls[0] || '/api/placeholder/300/200'} 
              alt={product.name}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 right-2 flex gap-1">
              {product.is_featured && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0">
                  <Crown className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 left-2 bg-white/80 hover:bg-white"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
            >
              <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>
          
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.brand} • {product.model}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ${product.price.toLocaleString()}
                </p>
              </div>
            </div>
            
            {product.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
            )}
            
            <div className="flex items-center justify-between">
              <Badge variant={product.stock_quantity > 0 ? "default" : "secondary"} className="text-xs">
                {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
              </Badge>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProduct(product)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  disabled={product.stock_quantity === 0}
                  onClick={() => addToCart(product.id)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  TimeKeeper
                </h1>
              </div>
              
              <div className="hidden md:flex space-x-6">
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab('home')}
                  className={activeTab === 'home' ? 'bg-blue-50 text-blue-600' : ''}
                >
                  Home
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab('products')}
                  className={activeTab === 'products' ? 'bg-blue-50 text-blue-600' : ''}
                >
                  Products
                </Button>
                {user && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => setActiveTab('orders')}
                      className={activeTab === 'orders' ? 'bg-blue-50 text-blue-600' : ''}
                    >
                      My Orders
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setActiveTab('wishlist')}
                      className={activeTab === 'wishlist' ? 'bg-blue-50 text-blue-600' : ''}
                    >
                      Wishlist
                    </Button>
                  </>
                )}
                {user?.is_admin && (
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab('admin')}
                    className={activeTab === 'admin' ? 'bg-blue-50 text-blue-600' : ''}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Admin
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search watches..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* Cart */}
              {user && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                      <ShoppingCart className="w-5 h-5" />
                      {cartItems.length > 0 && (
                        <Badge className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-blue-600 to-purple-600">
                          {cartItems.reduce((sum: number, item: CartItemWithProduct) => sum + item.quantity, 0)}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Shopping Cart</SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-[70vh] mt-4">
                      {cartItems.length === 0 ? (
                        <p className="text-center text-gray-500 mt-8">Your cart is empty</p>
                      ) : (
                        <div className="space-y-4">
                          {cartItems.map((item: CartItemWithProduct) => (
                            <div key={item.id} className="flex items-center space-x-3 border-b pb-3">
                              <img 
                                src={item.product.image_urls?.[0] || '/api/placeholder/60/60'} 
                                alt={item.product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{item.product.name}</h4>
                                <p className="text-sm text-gray-600">${item.product.price}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateCartQuantity(item.id, Math.max(1, item.quantity - 1))}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="text-sm">{item.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFromCartHandler(item.id)}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    {cartItems.length > 0 && (
                      <div className="border-t pt-4 mt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-semibold">Total:</span>
                          <span className="font-bold text-lg">${getTotalCartPrice().toFixed(2)}</span>
                        </div>
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                          Checkout
                        </Button>
                      </div>
                    )}
                  </SheetContent>
                </Sheet>
              )}

              {/* User Menu */}
              {user ? (
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      {user.first_name[0]}{user.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">
                    {user.first_name} {user.last_name}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <User className="w-4 h-4 mr-1" />
                        Login
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Login to TimeKeeper</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={loginForm.email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setLoginForm((prev: LoginInput) => ({ ...prev, email: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={loginForm.password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setLoginForm((prev: LoginInput) => ({ ...prev, password: e.target.value }))
                            }
                            required
                          />
                        </div>
                        {error && (
                          <Alert>
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                        <Button type="submit" disabled={isLoading} className="w-full">
                          {isLoading ? 'Logging in...' : 'Login'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        Register
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Account</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="first_name">First Name</Label>
                            <Input
                              id="first_name"
                              value={registerForm.first_name}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setRegisterForm((prev: RegisterUserInput) => ({ ...prev, first_name: e.target.value }))
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input
                              id="last_name"
                              value={registerForm.last_name}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setRegisterForm((prev: RegisterUserInput) => ({ ...prev, last_name: e.target.value }))
                              }
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="reg_email">Email</Label>
                          <Input
                            id="reg_email"
                            type="email"
                            value={registerForm.email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setRegisterForm((prev: RegisterUserInput) => ({ ...prev, email: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="reg_password">Password</Label>
                          <Input
                            id="reg_password"
                            type="password"
                            value={registerForm.password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setRegisterForm((prev: RegisterUserInput) => ({ ...prev, password: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone (Optional)</Label>
                          <Input
                            id="phone"
                            value={registerForm.phone || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setRegisterForm((prev: RegisterUserInput) => ({ 
                                ...prev, 
                                phone: e.target.value || null 
                              }))
                            }
                          />
                        </div>
                        {error && (
                          <Alert>
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                        <Button type="submit" disabled={isLoading} className="w-full">
                          {isLoading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'home' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <section className="text-center py-16 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-3xl text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20 rounded-3xl"></div>
              <div className="relative z-10">
                <h2 className="text-5xl font-bold mb-6">
                  Timeless Elegance ⌚
                </h2>
                <p className="text-xl mb-8 max-w-2xl mx-auto">
                  Discover our exquisite collection of luxury and sport watches. 
                  Each timepiece tells a story of precision, craftsmanship, and style.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button 
                    size="lg" 
                    className="bg-white text-blue-600 hover:bg-gray-100"
                    onClick={() => setActiveTab('products')}
                  >
                    Explore Collection
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white hover:text-blue-600"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Featured Deals
                  </Button>
                </div>
              </div>
            </section>

            {/* Features */}
            <section className="grid md:grid-cols-3 gap-8">
              <Card className="text-center p-6 border-0 bg-gradient-to-br from-blue-50 to-purple-50">
                <Shield className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-semibold mb-2">Authenticity Guaranteed</h3>
                <p className="text-gray-600">Every watch comes with certificate of authenticity</p>
              </Card>
              <Card className="text-center p-6 border-0 bg-gradient-to-br from-purple-50 to-pink-50">
                <Package className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                <h3 className="text-xl font-semibold mb-2">Free Shipping</h3>
                <p className="text-gray-600">Complimentary shipping on all orders over $500</p>
              </Card>
              <Card className="text-center p-6 border-0 bg-gradient-to-br from-pink-50 to-blue-50">
                <Crown className="w-12 h-12 mx-auto mb-4 text-pink-600" />
                <h3 className="text-xl font-semibold mb-2">Premium Service</h3>
                <p className="text-gray-600">Dedicated support and lifetime maintenance</p>
              </Card>
            </section>

            {/* Featured Products */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-bold">Featured Timepieces ✨</h3>
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab('products')}
                  className="hidden sm:flex"
                >
                  View All Products
                </Button>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.map((product: Product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <h2 className="text-3xl font-bold">Our Collection</h2>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <Select value={selectedCategory?.toString() || 'all'} onValueChange={(value: string) => 
                  setSelectedCategory(value === 'all' ? null : parseInt(value))
                }>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedBrand || 'all'} onValueChange={(value: string) => 
                  setSelectedBrand(value === 'all' ? '' : value)
                }>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {getUniquesBrands().map((brand: string) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex space-x-2">
                  <Input
                    placeholder="Min price"
                    type="number"
                    value={priceRange.min || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPriceRange((prev: {min?: number, max?: number}) => ({ 
                        ...prev, 
                        min: e.target.value ? parseInt(e.target.value) : undefined 
                      }))
                    }
                    className="w-24"
                  />
                  <Input
                    placeholder="Max price"
                    type="number"
                    value={priceRange.max || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPriceRange((prev: {min?: number, max?: number}) => ({ 
                        ...prev, 
                        max: e.target.value ? parseInt(e.target.value) : undefined 
                      }))
                    }
                    className="w-24"
                  />
                </div>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-lg text-gray-500 mb-4">No watches found matching your criteria</p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedBrand('');
                    setPriceRange({});
                    setSearchQuery('');
                  }}
                >
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product: Product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}

        {user && activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">My Orders 📦</h2>
            
            {orders.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg text-gray-500 mb-4">You haven't placed any orders yet</p>
                <Button onClick={() => setActiveTab('products')}>
                  Start Shopping
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order: OrderWithItems) => (
                  <Card key={order.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                        <p className="text-gray-600">Placed on {order.created_at.toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={order.status === 'delivered' ? 'default' : 'secondary'}
                          className="mb-2"
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                        <p className="font-bold text-lg">${order.total_amount.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div>
                      <h4 className="font-medium mb-2">Shipping Address:</h4>
                      <p className="text-sm text-gray-600">{order.shipping_address}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {user && activeTab === 'wishlist' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">My Wishlist ❤️</h2>
            
            {wishlistItems.length === 0 ? (
              <Card className="p-12 text-center">
                <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg text-gray-500 mb-4">Your wishlist is empty</p>
                <Button onClick={() => setActiveTab('products')}>
                  Browse Watches
                </Button>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {wishlistItems.map((item: WishlistItem) => {
                  const product = products.find((p: Product) => p.id === item.product_id);
                  return product ? <ProductCard key={item.id} product={product} /> : null;
                })}
              </div>
            )}
          </div>
        )}

        {user?.is_admin && activeTab === 'admin' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold flex items-center">
              <Settings className="w-8 h-8 mr-3" />
              Admin Dashboard
            </h2>
            
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
              </TabsList>
              
              <TabsContent value="products" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Manage Products</h3>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </div>
                
                <div className="grid gap-4">
                  {adminProducts.map((product: Product) => (
                    <Card key={product.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={product.image_urls[0] || '/api/placeholder/60/60'} 
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-gray-600">{product.brand} • ${product.price}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="categories" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Manage Categories</h3>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </div>
                
                <div className="grid gap-4">
                  {categories.map((category: Category) => (
                    <Card key={category.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{category.name}</h4>
                          <p className="text-sm text-gray-600">{category.description}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="orders" className="space-y-4">
                <h3 className="text-xl font-semibold">All Orders</h3>
                
                <div className="space-y-4">
                  {adminOrders.map((order: Order) => (
                    <Card key={order.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Order #{order.id}</h4>
                          <p className="text-sm text-gray-600">
                            {order.created_at.toLocaleDateString()} • ${order.total_amount.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">{order.status}</Badge>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProduct.name}</DialogTitle>
            </DialogHeader>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <img 
                  src={selectedProduct.image_urls[0] || '/api/placeholder/400/300'} 
                  alt={selectedProduct.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
                
                {selectedProduct.image_urls.length > 1 && (
                  <div className="flex space-x-2 mt-4">
                    {selectedProduct.image_urls.slice(1, 4).map((url: string, index: number) => (
                      <img 
                        key={index}
                        src={url} 
                        alt={`${selectedProduct.name} ${index + 2}`}
                        className="w-16 h-16 object-cover rounded cursor-pointer"
                      />
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold">{selectedProduct.name}</h3>
                  <p className="text-lg text-gray-600">{selectedProduct.brand} • {selectedProduct.model}</p>
                </div>
                
                <div className="text-3xl font-bold text-blue-600">
                  ${selectedProduct.price.toLocaleString()}
                </div>
                
                {selectedProduct.description && (
                  <p className="text-gray-700">{selectedProduct.description}</p>
                )}
                
                {selectedProduct.specifications && (
                  <div>
                    <h4 className="font-semibold mb-2">Specifications</h4>
                    <div className="space-y-1">
                      {Object.entries(selectedProduct.specifications).map(([key, value]: [string, string]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600">{key}:</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <Badge variant={selectedProduct.stock_quantity > 0 ? "default" : "secondary"}>
                    {selectedProduct.stock_quantity > 0 
                      ? `${selectedProduct.stock_quantity} in stock` 
                      : 'Out of stock'
                    }
                  </Badge>
                  
                  <div className="flex space-x-3">
                    <Button
                      disabled={selectedProduct.stock_quantity === 0}
                      onClick={() => addToCart(selectedProduct.id)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => toggleWishlist(selectedProduct.id)}
                    >
                      <Heart className={`w-4 h-4 ${
                        wishlistItems.some((item: WishlistItem) => item.product_id === selectedProduct.id) 
                          ? 'fill-red-500 text-red-500' 
                          : ''
                      }`} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default App;
